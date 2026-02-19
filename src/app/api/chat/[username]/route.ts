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
        return await withRetry(async (ai, modelId) => {

            // --- RAG RETRIEVAL START ---
            let contextText = "";
            try {
                // Extract text from the last user message, handling both content and parts formats
                const lastMsg = messages[messages.length - 1];
                let userMessage = '';
                if (typeof lastMsg?.content === 'string') {
                    userMessage = lastMsg.content;
                } else if (lastMsg?.parts && Array.isArray(lastMsg.parts)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    userMessage = lastMsg.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('');
                }
                if (userMessage) {
                    // Use Google Generative AI embedding
                    const queryEmbedding = await generateEmbedding(userMessage);

                    if (queryEmbedding && queryEmbedding.length > 0) {
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
                }
            } catch (err) {
                console.error("RAG Failed", err);
                // Continue without context if RAG fails
            }
            // --- RAG RETRIEVAL END ---

            // --- MESSAGE SANITIZATION & PREPARATION ---

            // 1. Define the System Prompt
            const systemPrompt = `You are ${data.name}, ${data.role}.
            Your biography: ${data.bio}.
            Your skills: ${data.skills?.join(", ")}.
            GitHub Profile: ${data.github}.

            RELEVANT CONTEXT FROM YOUR KNOWLEDGE BASE (RESUME/PORTFOLIO):
            ${contextText ? contextText : "No specific context found for this query."}

            RESPONSE RULES:
            - Always speak in the FIRST PERSON as ${data.name}.
            - **CRITICAL**: The "RELEVANT CONTEXT" above contains your actual Resume, Portfolio, and background. You MUST use it to answer **ANY** question about your experience, education, projects, skills, contact info, or personal background.
            - Keep responses concise and structured.`;

            console.log("Processing request for:", username);

            // 2. Format Client Messages (Stringify content)
            const validRoles = ['user', 'assistant']; // Only include user/assistant in the turn history, system goes first manually

            interface ChatMessage {
                role: 'system' | 'user' | 'assistant';
                content: string;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cleanMessages: ChatMessage[] = messages.map((m: any) => {
                let content = '';
                if (typeof m.content === 'string') {
                    content = m.content;
                } else if (Array.isArray(m.content)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    content = m.content.map((p: any) => p.text || '').join('');
                } else if (m.parts && Array.isArray(m.parts)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    content = m.parts.map((p: any) => p.text || '').join('');
                }

                return { role: (m.role === 'system' || m.role === 'tool' ? 'user' : m.role) as 'user' | 'assistant', content: content };
            }).filter((m: ChatMessage) => validRoles.includes(m.role) && m.content.trim().length > 0);

            // Filter out leading assistant messages (e.g., welcome/intro messages that are client-side only)
            while (cleanMessages.length > 0 && cleanMessages[0].role === 'assistant') {
                cleanMessages.shift();
            }

            // 3. Merge consecutive messages of the same role
            const mergedMessages: ChatMessage[] = [];
            if (cleanMessages.length > 0) {
                mergedMessages.push(cleanMessages[0]);
                for (let i = 1; i < cleanMessages.length; i++) {
                    const prev = mergedMessages[mergedMessages.length - 1];
                    const curr = cleanMessages[i];
                    if (prev.role === curr.role) {
                        prev.content += "\n\n" + curr.content;
                    } else {
                        mergedMessages.push(curr);
                    }
                }
            }

            // 4. Final Messages Construction
            // Prepend system prompt to the first user message for maximum compatibility
            const finalMessages = [...mergedMessages];
            if (finalMessages.length > 0 && finalMessages[0].role === 'user') {
                finalMessages[0].content = systemPrompt + "\n\n---\n\n" + finalMessages[0].content;
            } else {
                // Should not happen if filtered, but fallback to system role if no user message starts
                finalMessages.unshift({ role: 'system', content: systemPrompt });
            }


            console.log("Final Sent Messages:", JSON.stringify(finalMessages, null, 2));

            const result = streamText({
                model: ai.chat(modelId),
                messages: finalMessages,
                maxRetries: 1,
            });

            return result.toUIMessageStreamResponse({
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                },
            });
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
