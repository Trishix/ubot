# API Quota Management Guide

## 🚨 Current Issue: API Quota Exceeded

Your Google Gemini API keys have reached their free tier quota limits. This is a temporary limitation that will reset automatically.

---

## ⏰ Quick Fix: Wait for Quota Reset

**Free Tier Limits:**
- **Gemini 2.5 Flash**: 20 requests per minute
- **Gemini 2.5 Flash-Lite**: Higher limits (cost-efficient)
- **Daily Quota**: Resets every 24 hours

**What to do:**
1. Wait 30-60 seconds between bot generation attempts
2. The quota resets automatically - no action needed
3. Try again after a few minutes

---

## 🔄 How the Key Rotation Works

Your platform automatically rotates between multiple API keys:

```
FREE_API_KEY_1 → Quota exceeded
    ↓ (automatic rotation)
FREE_API_KEY_2 → Quota exceeded
    ↓
Error: "All API keys exhausted"
```

**Current Configuration:**
- ✅ 2 API keys configured
- ✅ Automatic rotation enabled
- ✅ Quota error detection working

---

## 💡 Solutions

### Option 1: Wait (Free)
Simply wait for the quota to reset. The free tier is generous for development:
- **15 requests per minute** (per key)
- **1,500 requests per day** (per key)

### Option 2: Add More Free Keys (Recommended)
Create additional Google AI API keys and add them to `.env.local`:

```env
FREE_API_KEY_1=AIzaSy...  # Existing
FREE_API_KEY_2=AIzaSy...  # Existing
FREE_API_KEY_3=AIzaSy...  # New key
FREE_API_KEY_4=AIzaSy...  # New key
```

**How to get more keys:**
1. Visit: https://aistudio.google.com/apikey
2. Create a new project
3. Generate a new API key
4. Add to `.env.local`

### Option 3: Upgrade to Paid Tier
For production use, upgrade to Google AI's paid tier:
- **Higher rate limits**
- **No daily quotas**
- **Priority support**

Visit: https://ai.google.dev/pricing

---

## 🛠️ Technical Details

### Error Detection
The system detects quota errors through:
```typescript
- HTTP 429 status codes
- "quota exceeded" in error messages
- "rate limit" keywords
```

### Automatic Retry Logic
```typescript
withRetry() → Tries all available API keys
    ↓
    If all fail → Returns user-friendly error
```

### Current Models in Use
- **Ingest API**: `gemini-2.5-flash` (complex reasoning)
- **Chat API**: `gemini-2.5-flash-lite` (fast responses)

---

## 📊 Monitoring Your Usage

Track your API usage at:
- https://ai.dev/rate-limit
- https://aistudio.google.com/app/apikey

---

## ✅ Next Steps

1. **Immediate**: Wait 5-10 minutes for quota reset
2. **Short-term**: Add 2-3 more free API keys
3. **Long-term**: Consider paid tier for production

The platform is working correctly - this is just a temporary quota limitation from Google's free tier.
