import { createOpenAI } from "@ai-sdk/openai";

// --- OPENROUTER CONFIGURATION ---
// OpenRouter using OpenAI compatibility
const openrouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://ubot-chat.vercel.app", // Optional, for including your app on openrouter.ai rankings.
        "X-Title": "UBot", // Optional. Shows in rankings on openrouter.ai.
    },
});

export const MODELS = {
    // Switching to Gemini 2.0 Pro Experimental (Free on OpenRouter)
    PRO: "google/gemini-2.0-pro-exp-02-05:free"
} as const;


/**
 * Check if error is a rate limit or quota error
 */
function isQuotaError(error: unknown): boolean {
    if (!error) return false;

    const errorString = String(error).toLowerCase(); // Better than stringify for Error objects
    const errorJson = typeof error === 'object' ? JSON.stringify(error).toLowerCase() : '';

    // Type guard for objects with message/status
    const hasMessage = (e: unknown): e is { message: string } =>
        typeof e === 'object' && e !== null && 'message' in e;

    const hasStatus = (e: unknown): e is { status: number } =>
        typeof e === 'object' && e !== null && 'status' in e;

    const message = hasMessage(error) ? error.message.toLowerCase() : '';

    // Check for standard HTTP 429 status
    if (hasStatus(error) && error.status === 429) return true;

    // Aggressive checks for any quota-related keywords
    const isRateLimit = (
        message.includes('429') ||
        message.includes('rate limit') ||
        message.includes('quota') || // Catch "quota exceeded", "quota check failed", etc.
        message.includes('exhausted') ||
        message.includes('too many requests') ||
        errorString.includes('quota') ||
        errorString.includes('rate limit') ||
        errorString.includes('429') ||
        errorJson.includes('quota') ||
        errorJson.includes('resource_exhausted')
    );

    return isRateLimit;
}

// Mock withRetry for OpenRouter since it handles its own internal routing/retries usually,
// or we can implement simple retry if needed. For now, we pass through basic client.
export async function withRetry<T>(fn: (client: any) => Promise<T>): Promise<T> {
    // Just execute with OpenRouter client
    // We removed the rotation logic for now as OpenRouter abstracts providers
    return await fn(openrouter);
}

// Singleton for the embedding pipeline to avoid reloading logic
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let embeddingPipeline: any = null;

export async function generateEmbedding(text: string): Promise<number[]> {
    if (!embeddingPipeline) {
        // Dynamic import to avoid build issues
        const { pipeline, env } = await import("@xenova/transformers");

        // Configure for Serverless (Vercel)
        env.allowLocalModels = false;
        env.useBrowserCache = false;

        // 'Xenova/all-mpnet-base-v2' outputs 768 dimensions
        embeddingPipeline = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");
    }

    const output = await embeddingPipeline(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!embeddingPipeline) {
        const { pipeline, env } = await import("@xenova/transformers");

        // Configure for Serverless (Vercel)
        env.allowLocalModels = false;
        env.useBrowserCache = false;

        // 'Xenova/all-mpnet-base-v2' outputs 768 dimensions
        embeddingPipeline = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");
    }

    const embeddings: number[][] = [];
    for (const text of texts) {
        const output = await embeddingPipeline(text, { pooling: "mean", normalize: true });
        embeddings.push(Array.from(output.data));
    }
    return embeddings;
}
