import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";

// --- OPENROUTER CONFIGURATION (For Chat) ---
const openrouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://ubot-chat.vercel.app",
        "X-Title": "UBot",
    },
});

export const MODELS = {
    // Free models in priority order — rotate on failure
    FREE_MODELS: [
        "stepfun/step-3.5-flash:free",
        "qwen/qwen3-coder:free",
        "google/gemma-3n-e2b-it:free",
        "deepseek/deepseek-r1:free",
        "openrouter/free",
    ] as const,
    PRO: "stepfun/step-3.5-flash:free" // Primary free model
} as const;

// --- GOOGLE CONFIGURATION (For Embeddings) ---
const GOOGLE_KEYS = [
    process.env.FREE_API_KEY_1,
    process.env.FREE_API_KEY_2,
    process.env.FREE_API_KEY_3,
    process.env.FREE_API_KEY_4,
    process.env.FREE_API_KEY_5,
].filter(Boolean) as string[];

// Embedding Model - Google's latest production embedding model
// "gemini-embedding-001" is the only model available on v1beta with free API keys (3072 dimensions)
const GOOGLE_EMBEDDING_MODEL = "gemini-embedding-001";

/**
 * Check if error is a rate limit or quota error
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isQuotaError(error: unknown): boolean {
    if (!error) return false;

    const errorString = String(error).toLowerCase();
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
        message.includes('quota') ||
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

// Retry logic with model rotation (Using OpenRouter)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function withRetry<T>(fn: (client: any, modelId: string) => Promise<T>, retries = 3): Promise<T> {
    let lastError: unknown;
    const models = MODELS.FREE_MODELS;

    for (let i = 0; i < retries; i++) {
        const modelId = models[i % models.length];
        try {
            console.log(`Attempt ${i + 1}: Using model ${modelId}`);
            return await fn(openrouter, modelId);
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${i + 1} (model: ${modelId}) failed:`, error);
            if (i === retries - 1) break;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    throw lastError;
}

// Retry logic for Google Embeddings with key rotation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function withGoogleRetry<T>(fn: (provider: any) => Promise<T>, retries = 5): Promise<T> {
    let lastError: unknown;
    const keys = GOOGLE_KEYS;

    for (let i = 0; i < Math.min(retries, keys.length); i++) {
        const apiKey = keys[i]; // Try keys in order
        const provider = createGoogleGenerativeAI({ apiKey });
        try {
            return await fn(provider);
        } catch (error) {
            lastError = error;
            console.warn(`Google API Key ${i + 1} failed:`, error);
            if (i === keys.length - 1) break;
            // Short delay before trying next key
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    throw lastError;
}

export async function generateEmbedding(text: string): Promise<number[]> {
    return withGoogleRetry(async (google) => {
        const { embedding } = await embed({
            model: google.textEmbeddingModel(GOOGLE_EMBEDDING_MODEL),
            value: text,
        });
        return embedding;
    });
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    return withGoogleRetry(async (google) => {
        const { embeddings } = await embedMany({
            model: google.textEmbeddingModel(GOOGLE_EMBEDDING_MODEL),
            values: texts,
        });
        return embeddings;
    });
}
