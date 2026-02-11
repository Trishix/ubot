# 📧 Email Service Documentation

## Overview

UBOT Platform uses **Resend** as its email service provider for sending transactional emails. The email service handles contact form submissions with professional, branded email templates.

## Features

✅ **Dual Email System**
- Support team notification emails
- User confirmation emails

✅ **Professional Templates**
- Terminal-style aesthetic matching UBOT brand
- HTML + Plain text versions for all emails
- Mobile-responsive design

✅ **Robust Error Handling**
- Graceful degradation if email fails
- Detailed logging for debugging
- Non-blocking confirmation emails

## Setup Instructions

### 1. Get Your Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Navigate to **API Keys** in the dashboard
4. Create a new API key
5. Copy the key (starts with `re_`)

### 3. Configure Environment Variables

Add to your `.env.local` file:

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_EMAIL=ubot@resend.dev  # Default sender
SUPPORT_EMAIL=your_email@gmail.com  # Where you receive notifications
```

### 4. Configure Your Domain (Production)

For production use (to send from your own domain like `noreply@ubot.ai`), you need to verify your domain with Resend:

1. Go to **Domains** in Resend dashboard
2. Add your domain (e.g., `ubot.ai`)
3. Add the DNS records provided by Resend
4. Wait for verification (usually 5-10 minutes)

**For Free Tier Testing:**
You can only send to email addresses that you have **verified** in the Resend dashboard (or use `delivered@resend.dev`). Be sure to verify your `SUPPORT_EMAIL` address.

### 5. Testing

#### Development Testing (Free Tier)


Resend's free tier allows sending to:
- Any email address you've verified in your Resend account
- `delivered@resend.dev` (test email that always succeeds)

To test during development:

```typescript
// Temporarily change in src/lib/email.ts
to: 'delivered@resend.dev', // or your verified email
```

#### Production Testing

Once your domain is verified, you can send to any email address.

## Email Templates

### 1. Support Notification Email

**Sent to:** `support@ubot.ai`  
**Purpose:** Notify support team of new contact form submission  
**Includes:**
- Sender's name and email
- Subject category
- Full message content
- Quick reply button
- Timestamp

### 2. User Confirmation Email

**Sent to:** User's email address  
**Purpose:** Confirm receipt of their message  
**Includes:**
- Personalized greeting
- Subject confirmation
- Expected response time (24-48 hours)
- Professional branding

## API Usage

### Contact Form Endpoint

```typescript
POST /api/contact

Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Technical Support",
  "message": "I need help with..."
}

Response (Success):
{
  "success": true,
  "message": "Your message has been received. We'll get back to you soon!"
}

Response (Error - Missing API Key):
{
  "error": "Email service not configured. Please contact support directly.",
  "status": 503
}
```

## Email Service Functions

### `sendContactEmail(data)`

Sends notification email to support team.

```typescript
import { sendContactEmail } from '@/lib/email';

await sendContactEmail({
  name: 'John Doe',
  email: 'john@example.com',
  subject: 'Technical Support',
  message: 'I need help...'
});
```

### `sendContactConfirmationEmail(data)`

Sends confirmation email to user.

```typescript
import { sendContactConfirmationEmail } from '@/lib/email';

await sendContactConfirmationEmail({
  name: 'John Doe',
  email: 'john@example.com',
  subject: 'Technical Support',
  message: 'I need help...'
});
```

## Error Handling

The email service implements multiple layers of error handling:

1. **Missing API Key**: Returns 503 error to user
2. **Support Email Failure**: Logs error but doesn't block request
3. **Confirmation Email Failure**: Logged but non-blocking (user still gets success response)

This ensures the contact form remains functional even if email delivery has issues.

## Monitoring & Debugging

### Check Email Delivery Status

1. Log into [Resend Dashboard](https://resend.com/emails)
2. View all sent emails and their delivery status
3. Check bounce rates and errors

### Server Logs

The email service logs all activities:

```bash
# Success
✅ Contact email sent successfully: { id: 'abc123' }
✅ Confirmation email sent successfully: { id: 'def456' }

# Errors
❌ Failed to send support notification email: Error...
⚠️ Failed to send confirmation email to user: Error...
```

## Rate Limits

**Resend Free Tier:**
- 100 emails per day
- 3,000 emails per month

**Resend Pro Tier:**
- 50,000 emails per month
- $20/month

For high-volume applications, consider upgrading or implementing rate limiting.

## Customization

### Modify Email Templates

Edit the template functions in `src/lib/email.ts`:

- `generateContactEmailHTML()` - Support team HTML email
- `generateContactEmailText()` - Support team plain text
- `generateConfirmationEmailHTML()` - User confirmation HTML
- `generateConfirmationEmailText()` - User confirmation plain text

### Change Email Styling

The templates use inline CSS for maximum email client compatibility. Key brand colors:

- Primary: `#00ff41` (terminal green)
- Background: `#000000` (black)
- Text: `#ffffff` (white)

## Security Best Practices

✅ **Implemented:**
- Email validation (regex)
- Input sanitization (trim, lowercase)
- Reply-To headers for safe responses
- Environment variable protection

⚠️ **Recommended:**
- Add rate limiting to prevent spam
- Implement CAPTCHA for public forms
- Set up SPF/DKIM/DMARC records

## Troubleshooting

### "RESEND_API_KEY is not defined"

**Solution:** Add the API key to `.env.local` and restart the dev server.

### Emails not being received

**Checklist:**
1. Check Resend dashboard for delivery status
2. Verify recipient email isn't in spam folder
3. Confirm domain is verified (production)
4. Check server logs for errors

### Template styling broken

**Cause:** Email clients have limited CSS support  
**Solution:** Use inline styles only, avoid modern CSS features

## Future Enhancements

Potential improvements:

- [ ] Add email templates for user registration
- [ ] Implement password reset emails
- [ ] Add weekly digest emails
- [ ] Support for email attachments
- [ ] Multi-language email templates
- [ ] A/B testing for email templates

## Support

For issues with the email service:
- Check [Resend Documentation](https://resend.com/docs)
- Review server logs
- Contact Resend support for delivery issues

---

**Last Updated:** February 11, 2026  
**Version:** 1.0.0
