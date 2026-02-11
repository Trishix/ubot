import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";
import { withRetry, MODELS } from "@/lib/ai-provider";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const githubUrl = formData.get("github") as string;
        const username = formData.get("username") as string;
        const userId = formData.get("userId") as string; // Add userId to associate with account

        if (!githubUrl || !username || !userId) {
            return NextResponse.json({ error: "Missing fields. Ensure you are logged in." }, { status: 400 });
        }

        // 1. Check if username is already taken by another user
        const { data: existingUser } = await supabaseAdmin
            .from("profiles")
            .select("user_id")
            .eq("username", username)
            .single();

        if (existingUser && existingUser.user_id !== userId) {
            return NextResponse.json({ error: "This username handle is already taken. Please choose another." }, { status: 400 });
        }

        const githubUsername = githubUrl.split("/").filter(Boolean).pop();
        let githubData = "";
        let profileInfo = "";
        let githubId = null;

        if (githubUsername) {
            try {
                const userRes = await fetch(`https://api.github.com/users/${githubUsername}`, {
                    headers: process.env.GITHUB_TOKEN ? {
                        Authorization: `token ${process.env.GITHUB_TOKEN}`,
                        Accept: "application/vnd.github.v3+json",
                    } : {},
                });

                if (userRes.ok) {
                    const profile = await userRes.json();
                    profileInfo = `Name: ${profile.name || profile.login}, Bio: ${profile.bio || ""}, Company: ${profile.company || ""}, Location: ${profile.location || ""}`;
                    githubId = profile.id;
                }

                const githubRes = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=15`, {
                    headers: process.env.GITHUB_TOKEN ? {
                        Authorization: `token ${process.env.GITHUB_TOKEN}`,
                        Accept: "application/vnd.github.v3+json",
                    } : {},
                });

                if (githubRes.ok) {
                    const repos = await githubRes.json();
                    githubData = repos.map((r: { name: string; language: string; description: string }) =>
                        `Repo: ${r.name}, Language: ${r.language || "Unknown"}, Description: ${r.description || "No description"}`
                    ).join("\n");
                }
            } catch (error) {
                console.warn("GitHub fetch failed:", error);
                throw new Error("Failed to fetch data from GitHub.");
            }
        }

        if (!githubData && !profileInfo) {
            throw new Error("Could not retrieve any data from the provided GitHub URL.");
        }

        // Use withRetry for automatic key rotation
        const structuredData = await withRetry(async (google) => {
            const { text } = await generateText({
                model: google(MODELS.FLASH),
                maxRetries: 0, // Disable internal retries so withRetry handles key rotation instantly
                prompt: `Create a professional chatbot persona based on this GitHub profile and repositories. 
                Output ONLY a JSON object with keys: name, role, bio, skills (array), github.
          
                STRICT RULE: Represent the person in the FIRST PERSON ("I am...", "I built...").
          
                GITHUB PROFILE:
                ${profileInfo}
          
                GITHUB REPOSITORIES:
                ${githubData}`,
            });
            return text;
        });

        const jsonMatch = structuredData.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Failed to generate profile structure.");

        const portfolioJson = JSON.parse(jsonMatch[0]);

        const { error } = await supabaseAdmin
            .from("profiles")
            .upsert({
                user_id: userId, // Associate with user account
                github_id: githubId, // Store GitHub ID for uniqueness check
                username,
                portfolio_data: portfolioJson,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id' // Ensure only one chatbot per account
            });

        if (error) throw error;

        return NextResponse.json({ success: true, portfolio: portfolioJson });

    } catch (error) {
        console.error("Ingest Error:", error);

        let errorMsg = "An unexpected error occurred.";

        if (error instanceof Error) {
            // Check if it's a quota error
            if (error.message.includes('quota') || error.message.includes('rate limit')) {
                errorMsg = "AI service quota exceeded. Please wait a few minutes and try again, or upgrade your API plan for higher limits.";
            } else if (error.message.includes('All') && error.message.includes('API keys')) {
                errorMsg = "All API keys have reached their quota limits. Please wait before trying again.";
            } else {
                errorMsg = error.message;
            }
        }

        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}
