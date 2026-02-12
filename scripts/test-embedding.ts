import { generateEmbedding } from "../src/lib/ai-provider";
import * as dotenv from "dotenv";

// Load environment variables if needed (though embedding might not need keys unless it calls an API)
dotenv.config({ path: ".env.local" });

async function test() {
    console.log("Testing embedding generation...");
    try {
        const vector = await generateEmbedding("Hello world");
        console.log("Success! Vector length:", vector.length);
        console.log("First 5 values:", vector.slice(0, 5));
    } catch (error) {
        console.error("Embedding failed:", error);
    }
}

test();
