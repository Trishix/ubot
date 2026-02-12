import { createOpenAI } from "@ai-sdk/openai";
/*
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const keys = Array.from(new Set([
    process.env.FREE_API_KEY_1,
    process.env.FREE_API_KEY_2,
    process.env.FREE_API_KEY_3,
    process.env.FREE_API_KEY_4,
    process.env.GOOGLE_API_KEY
].filter(Boolean) as string[]));

// Shuffle keys on startup to distribute load across multiple free tier quotas
if (keys.length > 1) {
    for (let i = keys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [keys[i], keys[j]] = [keys[j], keys[i]];
    }
}

console.log(`📡 AI Provider: Loaded ${keys.length} unique API keys.`);

let currentKeyIndex = 0;

// Strictly using the requested Gemini 2.5 variants
export const MODELS = {
    FLASH: "gemini-2.5-flash",
    FLASH_LITE: "gemini-2.5-flash-lite"
} as const;

export function getGoogleClient() {
    if (keys.length === 0) {
        console.error("❌ AI Provider: No API keys found in process.env!");
        throw new Error("No Google API keys configured. Please set FREE_API_KEY_1 in .env.local");
    }
    const key = keys[currentKeyIndex];
    // console.log(`🔑 Using API Key Index: ${currentKeyIndex}`);
    return createGoogleGenerativeAI({
        apiKey: key,
    });
}

export function rotateKey() {
    if (keys.length <= 1) return currentKeyIndex;

    const previousIndex = currentKeyIndex;
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    console.log(`📡 Rotating API Key: Index ${previousIndex} → ${currentKeyIndex}`);
    return currentKeyIndex;
}
*/

// --- OPENROUTER CONFIGURATION ---
const openrouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
        "HTTP-Referer": "https://ubot-chat.vercel.app", // Optional: Your site URL
        "X-Title": "UBOT" // Optional: Your site name
    }
});

export const MODELS = {
    // Switching to Gemini 2.0 Pro Experimental (Free on OpenRouter)
    PRO: "google/gemini-2.0-pro-exp-02-05:free"
} as const;


/**
 * Check if error is a rate limit or quota error
 */
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

        embeddingPipeline = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");
    }

    const embeddings: number[][] = [];
    for (const text of texts) {
        const output = await embeddingPipeline(text, { pooling: "mean", normalize: true });
        embeddings.push(Array.from(output.data));
    }
    return embeddings;
}
