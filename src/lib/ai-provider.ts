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
function isQuotaError(error: any): boolean {
    if (!error) return false;

    const errorString = JSON.stringify(error).toLowerCase();
    const message = error.message?.toLowerCase() || '';

    // Check for standard HTTP 429 status
    if (error.status === 429 || error.statusCode === 429) return true;

    // Common strings in Google AI quota errors
    return (
        message.includes('429') ||
        message.includes('rate limit') ||
        message.includes('quota exceeded') ||
        message.includes('exhausted') ||
        message.includes('too many requests') ||
        errorString.includes('quota') ||
        errorString.includes('rate_limit') ||
        errorString.includes('429')
    );
}

/**
 * Execute an AI task with automatic key rotation on rate limits
 */
export async function withRetry(fn: (client: ReturnType<typeof createGoogleGenerativeAI>) => Promise<any>) {
    const maxAttempts = keys.length;
    let lastError: any;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const client = getGoogleClient();
            return await fn(client);
        } catch (error: any) {
            lastError = error;
            console.error(`❌ API Key ${currentKeyIndex} failed:`, error.message || error);

            if (isQuotaError(error) && attempt < maxAttempts - 1) {
                rotateKey();
                console.log(`🔄 Retrying with next API key (attempt ${attempt + 2}/${maxAttempts})...`);
                continue;
            }

            // If it's not a quota error or we're out of keys, throw immediately
            throw error;
        }
    }

    throw new Error(`All ${maxAttempts} API keys exhausted. Last error: ${lastError?.message || 'Unknown error'}`);
}
