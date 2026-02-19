# API Quota Management Guide

## 🚨 Understanding API Limits

UBot uses multiple AI providers to ensure a free and reliable experience. However, free tiers come with strict limits. Below is how we manage them.

---

## 🔄 1. Google AI (Embeddings Key Rotation)

We use Google's `gemini-embedding-001` for vector search. Since the free tier has a per-key quota, we've implemented an **Automatic Key Rotation** system.

**How it works:**
The system checks for "Quota Exceeded" errors (HTTP 429). If detected, it instantly switches to the next available key in your `.env.local`.

**Configuration:**
Add up to 5 keys to your environment:
```env
FREE_API_KEY_1=...
FREE_API_KEY_2=...
FREE_API_KEY_3=...
FREE_API_KEY_4=...
FREE_API_KEY_5=...
```

---

## 💬 2. OpenRouter (Chat & Persona Rotation)

For chat responses and persona generation, we use **OpenRouter**. Since individual free models can be slow or rate-limited, we use a **Model Rotation** strategy.

**The Rotation Order:**
1.  **Step-3.5-Flash** (Primary)
2.  **Qwen 3 Coder** (Fallback 1)
3.  **Gemma 3** (Fallback 2)
4.  **DeepSeek R1** (Fallback 3)
5.  **OpenRouter Free Pool** (Final Fallback)

If one model fails or times out, the system automatically tries the next one in the list.

---

## 🛠️ Common Issues & Fixes

### "Quota Exceeded" or "Rate Limit"
*   **Cause**: You've hit the limit for your current pool of keys.
*   **Fix**: 
    1.  Wait 1-2 minutes for the "Requests Per Minute" (RPM) to reset.
    2.  Add more Google API keys to your `.env.local` (we support up to 5).
    3.  Check if your `OPENROUTER_API_KEY` has credits (or is correctly set for free models).

### "504 Gateway Timeout" (Vercel Only)
*   **Cause**: Vercel Free tier has a strict **10-second** timeout for API routes. Ingestion (which involves PDF parsing + 20+ embedding calls) often takes 30-50 seconds.
*   **Fix**: 
    1.  Run the application locally for ingestion (where there is no timeout).
    2.  Alternatively, upgrade to Vercel Pro which supports 300s timeouts.

---

## 📈 Monitoring Usage

Track your limits here:
*   **Google AI Studio**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
*   **OpenRouter Dashboard**: [https://openrouter.ai/activity](https://openrouter.ai/activity)

---

The platform is designed to be as resilient as possible within free-tier constraints. Adding more keys is the most effective way to improve reliability.
