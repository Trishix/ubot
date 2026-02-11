# 🚀 Quick Setup Guide - Email Service

## Step 1: Get Your Resend API Key

1. **Go to Resend**: https://resend.com
2. **Sign up** for a free account
3. **Navigate to API Keys** in the dashboard
4. **Create a new API key**
5. **Copy the key** (it starts with `re_`)

## Step 2: Add to Environment Variables

Open your `.env.local` file and add:

```env
RESEND_API_KEY=re_your_actual_api_key_here
```

**Important:** Replace `re_your_actual_api_key_here` with your actual API key from Resend!

## Step 3: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 4: Test the Contact Form

1. Go to: http://localhost:3000/contact
2. Fill out the form with your email address
3. Submit the form
4. Check your email inbox for the confirmation email
5. Check Resend dashboard to see the sent emails

## Free Tier Limits

Resend's free tier includes:
- ✅ **100 emails per day**
- ✅ **3,000 emails per month**
- ✅ Perfect for development and small projects

## Development Testing

During development, you can test with:

### Option 1: Use Resend's Test Email
```typescript
// Temporarily in src/lib/email.ts, line 22
to: 'delivered@resend.dev', // Always succeeds
```

### Option 2: Verify Your Email
1. Go to Resend dashboard
2. Add your personal email to verified addresses
3. Test with your own email

## Production Setup (Later)

For production, you'll want to:

1. **Verify your domain** in Resend
2. **Update email addresses** in `src/lib/email.ts`:
   ```typescript
   from: 'UBOT Platform <noreply@yourdomain.com>',
   to: 'support@yourdomain.com',
   ```
3. **Add DNS records** provided by Resend
4. **Test thoroughly** before launch

## Troubleshooting

### "RESEND_API_KEY is not defined"
- Make sure you added it to `.env.local`
- Restart your dev server
- Check for typos in the variable name

### Emails not arriving
- Check spam folder
- Verify API key is correct
- Check Resend dashboard for delivery status
- Make sure you're using a verified email (free tier)

### Still having issues?
- Check server console for error messages
- Review: `/docs/EMAIL_SERVICE.md` for detailed documentation
- Check Resend status: https://resend.com/status

## What You Get

✅ **Professional email templates** with terminal-style design  
✅ **Dual email system**: Support notifications + User confirmations  
✅ **Mobile-responsive** HTML emails  
✅ **Plain text fallback** for all emails  
✅ **Detailed logging** for debugging  
✅ **Graceful error handling**  

## Next Steps

Once email is working:
- [ ] Customize email templates in `src/lib/email.ts`
- [ ] Update support email address
- [ ] Add rate limiting to prevent spam
- [ ] Set up domain verification for production

---

**Need help?** Check the full documentation at `/docs/EMAIL_SERVICE.md`
