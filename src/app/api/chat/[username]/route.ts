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

// Force Node.js runtime for local embeddings (transformers.js)
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;

    try {
        const { messages } = await req.json();

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

        // 2. Use withRetry for automatic key rotation (now OpenRouter passthrough)
        return await withRetry(async (ai) => {

            // --- RAG RETRIEVAL START ---
            let contextText = "";
            try {
                const userMessage = messages[messages.length - 1]?.content;
                if (userMessage) {
                    // Use Xenova local embedding
                    const queryEmbedding = await generateEmbedding(userMessage);

                    const { data: documents, error: matchError } = await supabaseAdmin.rpc("match_documents", {
                        query_embedding: queryEmbedding,
                        match_threshold: 0.5, // Standard threshold
                        match_count: 5,
                        filter_user_id: profile.user_id
                    });

                    if (matchError) {
                        console.error("RAG Match Error", matchError);
                    } else if (documents && documents.length > 0) {
                        contextText = documents.map((doc: { content: string }) => doc.content).join("\n\n");
                    }
                }
            } catch (err) {
                console.error("RAG Failed", err);
                // Continue without context if RAG fails
            }
            // --- RAG RETRIEVAL END ---

            const result = await streamText({
                model: ai(MODELS.PRO),
                maxRetries: 0, // Disable internal retries for instant rotation
                system: `You are ${data.name}, ${data.role}.
                Your biography: ${data.bio}.
                Your skills: ${data.skills?.join(", ")}.
                GitHub Profile: ${data.github}.

                RELEVANT CONTEXT FROM YOUR KNOWLEDGE BASE (RESUME/PORTFOLIO):
                ${contextText ? contextText : "No specific context found for this query."}

                RESPONSE RULES:
                - Always speak in the FIRST PERSON as ${data.name}.
                - **CRITICAL**: The "RELEVANT CONTEXT" above contains your actual Resume, Portfolio, and background. You MUST use it to answer **ANY** question about your experience, education, projects, skills, contact info, or personal background.
                - Do NOT be evasive. If the answer is in the context, provide it directly and professionally.
                - If the information is NOT in the context, strictly say "I don't have that specific information in my knowledge base."
                - Maintain a professional, helpful personality.
                - Keep responses concise and structured.`,
                messages,
            });

            const response = result.toDataStreamResponse({
                getErrorMessage: (error) => {
                    return error instanceof Error ? error.message : String(error);
                }
            });

            // Add CORS headers to the stream response
            response.headers.set("Access-Control-Allow-Origin", "*");
            response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
            response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

            return response;
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return new Response(
            JSON.stringify({
                error: "Service temporarily unavailable.",
                details: error instanceof Error ? error.message : String(error)
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            }
        );
    }
}
