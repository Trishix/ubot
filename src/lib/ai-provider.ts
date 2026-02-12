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

// List of free/experimental models to rotate through
const FREE_MODELS = [
    "google/gemma-3-12b-it:free",  // Latest Google Gemma 3
    "google/gemma-3-4b-it:free",
    "google/gemma-3-27b-it:free",
    "meta-llama/llama-3.3-70b-instruct:free", // Reliable Llama
    "meta-llama/llama-3.2-3b-instruct:free",
    "mistralai/pixtral-12b:free",
    "microsoft/phi-3-medium-128k-instruct:free",
    "liquid/lfm-2.5-1.2b-instruct:free",
    "google/gemini-2.0-pro-exp-02-05:free", // Keeping as fallback
    "google/gemini-2.0-flash-exp:free",
    "google/gemini-2.0-flash-thinking-exp:free",
];

export const MODELS = {
    // Dynamic getter to pick a random model from the free pool
    get PRO() {
        return FREE_MODELS[Math.floor(Math.random() * FREE_MODELS.length)];
    }
} as const;


/**
 * Check if error is a rate limit or quota error
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isQuotaError(error: unknown): boolean {
    if (!error) return false;

    const errorString = String(error).toLowerCase(); // Better than stringify for Error objects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorJson = typeof error === 'object' ? JSON.stringify(error as any).toLowerCase() : '';

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

// Retry with model rotation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function withRetry<T>(fn: (client: any) => Promise<T>, retries = 3): Promise<T> {
    let lastError: unknown;

    for (let i = 0; i < retries; i++) {
        try {
            // Attempt execution
            return await fn(openrouter);
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${i + 1} failed with model rotation:`, error);

            // If it's a quota error or specific model error, continue to next iteration (which picks new model via getter)
            // If it's the last retry, throw
            if (i === retries - 1) break;

            // Add small delay before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }

    throw lastError;
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
