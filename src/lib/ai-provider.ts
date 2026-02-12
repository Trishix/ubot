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
        throw new Error("No Google API keys configured. Please set FREE_API_KEY_1 in .env.local");
    }
    const key = keys[currentKeyIndex];
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

/**
 * Check if error is a rate limit or quota error
 */
/**
 * Check if error is a rate limit or quota error
 */
function isQuotaError(error: unknown): boolean {
    if (!error) return false;

    const errorString = JSON.stringify(error).toLowerCase();

    // Type guard for objects with message/status
    const hasMessage = (e: unknown): e is { message: string } =>
        typeof e === 'object' && e !== null && 'message' in e;

    const hasStatus = (e: unknown): e is { status: number } =>
        typeof e === 'object' && e !== null && 'status' in e;

    const message = hasMessage(error) ? error.message.toLowerCase() : '';

    // Check for standard HTTP 429 status
    if (hasStatus(error) && error.status === 429) return true;

    // Common strings in Google AI quota errors
    return (
        message.includes('429') ||
        message.includes('rate limit') ||
        message.includes('quota exceeded') ||
        message.includes('exhausted') ||
        message.includes('too many requests') ||
        message.includes('resource_exhausted') ||
        errorString.includes('quota') ||
        errorString.includes('rate_limit') ||
        errorString.includes('429') ||
        errorString.includes('resource_exhausted')
    );
}

/**
 * Execute an AI task with automatic key rotation on rate limits
 */
export async function withRetry<T>(fn: (client: ReturnType<typeof createGoogleGenerativeAI>) => Promise<T>): Promise<T> {
    const maxAttempts = keys.length;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const client = getGoogleClient();
            return await fn(client);
        } catch (error: unknown) {
            lastError = error;
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ API Key ${currentKeyIndex} failed:`, errorMessage);

            if (isQuotaError(error) && attempt < maxAttempts - 1) {
                rotateKey();
                console.log(`🔄 Retrying with next API key (attempt ${attempt + 2}/${maxAttempts})...`);
                continue;
            }

            // If it's not a quota error or we're out of keys, throw immediately
            throw error;
        }
    }

    throw new Error(`All ${maxAttempts} API keys exhausted. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

// Singleton for the embedding pipeline to avoid reloading logic
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let embeddingPipeline: any = null;

export async function generateEmbedding(text: string): Promise<number[]> {
    if (!embeddingPipeline) {
        // Dynamic import to avoid build issues if mixed environments
        const { pipeline } = await import("@xenova/transformers");
        // 'Xenova/all-mpnet-base-v2' outputs 768 dimensions
        embeddingPipeline = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");
    }

    const output = await embeddingPipeline(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!embeddingPipeline) {
        const { pipeline } = await import("@xenova/transformers");
        embeddingPipeline = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");
    }

    const embeddings: number[][] = [];
    for (const text of texts) {
        const output = await embeddingPipeline(text, { pooling: "mean", normalize: true });
        embeddings.push(Array.from(output.data));
    }
    return embeddings;
}
