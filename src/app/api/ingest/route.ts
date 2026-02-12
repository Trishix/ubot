import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";
import { withRetry, MODELS, generateEmbeddings } from "@/lib/ai-provider";

// Increase body size limit for file uploads if needed (Next.js config might be required)

// Force Node.js runtime for PDF parsing and local embeddings
export const maxDuration = 60; // Allow 60 seconds for processing
export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Add OPTIONS handler for CORS preflight (if needed) and to satisfy Vercel routing
export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const githubUrl = formData.get("github") as string;
        const username = formData.get("username") as string;
        const userId = formData.get("userId") as string; // Add userId to associate with account
        const resumeFile = formData.get("resume") as File | null;
        const extraDetails = formData.get("extraDetails") as string;

        if ((!githubUrl && !resumeFile && !extraDetails) || !username || !userId) {
            return NextResponse.json({ error: "At least one data source (GitHub, Resume, or Extra Details) is required." }, { status: 400 });
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

        const githubUsername = githubUrl ? githubUrl.split("/").filter(Boolean).pop() : null;
        let githubData = "";
        let profileInfo = "";
        let resumeText = "";
        let githubId = null;

        // Process Resume PDF if provided
        if (resumeFile) {
            try {
                const arrayBuffer = await resumeFile.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Dynamic import for pdf-parse to prevent cold start crashes
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const { PDFParse } = require("pdf-parse");

                const parser = new PDFParse({ data: buffer });
                const data = await parser.getText();
                await parser.destroy();
                resumeText = data.text;
                console.log("Resume parsed successfully, length:", resumeText.length);
            } catch (error) {
                console.error("PDF Parsing Error:", error);
                // Continue without resume if parsing fails, but warn
            }
        }

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
                    profileInfo = `Name: ${profile.name || profile.login}, Bio: ${profile.bio || ""}, Company: ${profile.company || ""}, Location: ${profile.location || ""}, Blog: ${profile.blog || ""}`;
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

        if (!githubData && !profileInfo && !resumeText && !extraDetails) {
            throw new Error("Could not retrieve any data from the provided sources.");
        }

        // Generate Structured Persona from GitHub + Resume Summary + Extra Details
        const structuredData = await withRetry(async (google) => {
            const { text } = await generateText({
                model: google(MODELS.FLASH),
                maxRetries: 0,
                prompt: `Create a professional chatbot persona based on this GitHub profile, repositories, Resume, and Extra Details.
                Output ONLY a JSON object with keys: name, role, bio, skills (array), github.

                STRICT RULE: Represent the person in the FIRST PERSON ("I am...", "I built...").
                STRICT RULE: The user's GitHub handle is "${githubUsername || 'provided in resume'}". UDPATE the 'github' field with this handle/URL.

                DATA MERGING & CONFLICT RESOLUTION:
                0. **Extra Details (Make sure to include)**: This source contains specific user instructions, recent achievements, or manual overrides. It has the **HIGHEST PRIORITY**. Whether it contradicts the Resume or GitHub or extends it, always incorporate this information.
                1. **Role/Title**: If the Resume and GitHub have different current roles, prioritize the most recent one (look for "Present", "Current", or 2024/2025 dates). If ambiguous, combine them (e.g., "Full Stack Developer & Open Source Contributor").
                2. **Skills**: Merge skills from all sources.
                   - Prioritize languages found in **GitHub Repos** as they are "verified" usage.
                   - Add unique skills from the **Resume** (e.g., Soft Skills, older stacks).
                3. **Bio**: Create a cohesive narrative. Start with the Resume's professional summary but specifically mention 1-2 key active repositories from GitHub to show current focus. Incorporate any bio info from Extra Details.
                4. **Latest Info**: Trust the source with the *latest timestamp* or verified employment status.

                EXTRA DETAILS (Direct User Input - HIGHEST PRIORITY):
                ${extraDetails}

                GITHUB PROFILE:
                ${profileInfo}

                GITHUB REPOSITORIES:
                ${githubData}

                RESUME SUMMARY (if any):
                ${resumeText.slice(0, 3000)}... (truncated for summary)
                `,
            });
            return text;
        });

        const jsonMatch = structuredData.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Failed to generate profile structure.");

        const portfolioJson = JSON.parse(jsonMatch[0]);



        // Upsert Profile
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert({
                user_id: userId,
                github_id: githubId,
                username,
                portfolio_data: portfolioJson,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (profileError) throw profileError;

        // --- VECTOR INGESTION START ---
        // Clear existing documents for this user before adding new ones (full re-index strategy)
        await supabaseAdmin.from("documents").delete().eq("user_id", userId);

        const documentsToEmbed: { content: string; source: string }[] = [];

        // Chunk Resume
        if (resumeText) {
            const chunks = resumeText.split(/\n\s*\n/).filter(c => c.length > 50);
            chunks.forEach(c => documentsToEmbed.push({ content: c, source: "resume" }));
        }

        // Chunk GitHub Data
        if (githubData) {
            const chunks = githubData.split('\n').filter(c => c.length > 20);
            chunks.forEach(c => documentsToEmbed.push({ content: c, source: "github" }));
        }

        // Chunk Profile Info
        if (profileInfo) {
            documentsToEmbed.push({ content: profileInfo, source: "github_profile" });
        }

        // Chunk Extra Details
        if (extraDetails) {
            const chunks = extraDetails.split(/\n\s*\n/).filter(c => c.length > 10);
            chunks.forEach(c => documentsToEmbed.push({ content: c, source: "extra_details" }));
        }

        console.log(`Generating embeddings for ${documentsToEmbed.length} chunks...`);

        // Generate Embeddings in batch
        if (documentsToEmbed.length > 0) {
            // Extract just the text content for embedding generation
            const textChunks = documentsToEmbed.map(d => d.content);
            const embeddings = await generateEmbeddings(textChunks);

            // Insert into Supabase
            const records = documentsToEmbed.map((doc, i) => {
                return {
                    user_id: userId,
                    content: doc.content,
                    embedding: embeddings[i],
                    metadata: { source: doc.source }
                };
            });

            const { error: vectorError } = await supabaseAdmin
                .from("documents")
                .insert(records);

            if (vectorError) {
                console.error("Vector Insert Error:", vectorError);
                // We don't fail the whole request if vector insert fails, but log it
            }
        }
        // --- VECTOR INGESTION END ---

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
