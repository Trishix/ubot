import { streamText } from "ai";
import { createClient } from "@supabase/supabase-js";
import { withRetry, MODELS, generateEmbedding } from "@/lib/ai-provider";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CORS Options
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
            .select("portfolio_data, user_id")
            .eq("username", username)
            .single();

        if (profileError || !profile) {
            return new Response("Bot configuration not found.", { status: 404 });
        }

        const data = profile.portfolio_data;

        // 2. Use withRetry for automatic key rotation
        return await withRetry(async (google) => {

            // --- RAG RETRIEVAL START ---
            let contextText = "";
            try {
                const userMessage = messages[messages.length - 1]?.content;
                if (userMessage) {
                    // Use Xenova local embedding
                    const queryEmbedding = await generateEmbedding(userMessage);

                    const { data: documents } = await supabaseAdmin.rpc("match_documents", {
                        query_embedding: queryEmbedding,
                        match_threshold: 0.5, // Adjust threshold as needed
                        match_count: 5,
                        filter_user_id: profile.user_id
                    });

                    if (documents && documents.length > 0) {
                        contextText = documents.map((doc: { content: string }) => doc.content).join("\n\n");
                        console.log(`RAG: Found ${documents.length} relevant context chunks.`);
                    }
                }
            } catch (err) {
                console.error("RAG Retrieval Failed:", err);
                // Continue without context if RAG fails
            }
            // --- RAG RETRIEVAL END ---

            const result = await streamText({
                model: google(MODELS.FLASH_LITE),
                maxRetries: 0, // Disable internal retries for instant rotation
                system: `You are ${data.name}, ${data.role}. 
                Your biography: ${data.bio}.
                Your skills: ${data.skills?.join(", ")}.
                GitHub Profile: ${data.github}.

                RELEVANT CONTEXT FROM YOUR KNOWLEDGE BASE (RESUME/GITHUB):
                ${contextText ? contextText : "No specific context found for this query."}
                
                RESPONSE RULES:
                - Always speak in the FIRST PERSON as ${data.name}.
                - Maintain a professional, helpful, yet slightly tech-focused terminal-aesthetic personality.
                - Keep responses concise and structured.
                - If asked about things outside your work or profile, pivot back to your expertise.
                - Use the "RELEVANT CONTEXT" above to answer specific questions about your experience, specific projects, or resume details.`,
                messages,
            });

            const response = result.toDataStreamResponse();

            // Add CORS headers to the stream response
            response.headers.set("Access-Control-Allow-Origin", "*");
            response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
            response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

            return response;
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return new Response(
            JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
            { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
    }
}
