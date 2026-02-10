import express, { Request, Response } from 'express';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, ModelMessage } from 'ai';
import { getPortfolio } from '../lib/portfolio.js';
import { UBOT_PERSONA, RESPONSE_GUIDELINES } from '../lib/prompts.js';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
    console.log('\n🤖 UBOT: New chat request received');

    try {
        // 1. Get the user's messages
        const { messages }: { messages: ModelMessage[] } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                error: 'Messages array is required'
            });
        }

        console.log(`📨 Processing ${messages.length} message(s)`);

        // 2. Load portfolio data
        const portfolio = await getPortfolio();
        console.log(`📋 Portfolio loaded: ${portfolio.name} - ${portfolio.role}`);

        // 3. Build the system prompt with portfolio data
        const systemPrompt = `${UBOT_PERSONA}

PORTFOLIO DATA YOU HAVE ACCESS TO:
${JSON.stringify(portfolio, null, 2)}

${RESPONSE_GUIDELINES}

Remember: You are speaking AS the developer. Use "I" when referring to their work and experience.`;

        // 4. Call Gemini API
        console.log('🔮 Calling Gemini API with model: gemini-2.5-flash');

        const google = createGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY
        });

        const result = streamText({
            model: google('gemini-2.5-flash'),
            system: systemPrompt,
            messages: messages,
            temperature: 0.7,
            maxOutputTokens: 500,
        });

        // 5. Set up streaming response
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let chunkCount = 0;

        // 6. Stream the response
        try {
            for await (const chunk of result.textStream) {
                chunkCount++;
                res.write(chunk);
            }
        } catch (streamError: any) {
            console.error('❌ Stream processing error:', streamError);
            res.write(`\n[Error during generation: ${streamError.message}]`);
        }

        if (chunkCount === 0) {
            console.warn('⚠️ Warning: No chunks received from Gemini API');
            res.write('The AI returned an empty response.');
        }

        console.log(`✅ Response sent successfully (${chunkCount} chunks)`);
        res.end();

    } catch (error: any) {
        console.error('❌ Chat error:', error.message);

        // Send error response
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Failed to generate response. Please try again.'
            });
        }
    }
});

export default router;
