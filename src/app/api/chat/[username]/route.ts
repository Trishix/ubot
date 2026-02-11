import { streamText } from "ai";
import { createClient } from "@supabase/supabase-js";
import { withRetry, MODELS } from "@/lib/ai-provider";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
    req: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;
    const { messages } = await req.json();

    try {
        // 1. Fetch persona data
        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("portfolio_data")
            .eq("username", username)
            .single();

        if (profileError || !profile) {
            return new Response("Bot configuration not found.", { status: 404 });
        }

        const data = profile.portfolio_data;

        // 2. Use withRetry for automatic key rotation
        return await withRetry(async (google) => {
            const result = await streamText({
                model: google(MODELS.FLASH_LITE),
                maxRetries: 0, // Disable internal retries for instant rotation
                system: `You are ${data.name}, ${data.role}. 
                Your biography: ${data.bio}.
                Your skills: ${data.skills?.join(", ")}.
                GitHub Profile: ${data.github}.
                
                RESPONSE RULES:
                - Always speak in the FIRST PERSON as ${data.name}.
                - Maintain a professional, helpful, yet slightly tech-focused terminal-aesthetic personality.
                - Keep responses concise and structured.
                - If asked about things outside your work or profile, pivot back to your expertise.`,
                messages,
            });
            return result.toDataStreamResponse();
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return new Response(
            JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
