import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not defined in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Configurable email addresses
const FROM_EMAIL = process.env.RESEND_EMAIL || 'noreply@ubot.ai';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@ubot.ai';

interface ContactEmailData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

/**
 * Sends a contact form submission email to the support team
 */
export async function sendContactEmail(data: ContactEmailData) {
    const { email, subject } = data;

    try {
        const result = await resend.emails.send({
            from: `UBOT Platform <${FROM_EMAIL}>`,
            to: SUPPORT_EMAIL,
            replyTo: email, // User's email for easy replies
            subject: `[Contact Form] ${subject}`,
            html: generateContactEmailHTML(data),
            text: generateContactEmailText(data),
        });

        console.log('✅ Contact email sent successfully:', result);
        return { success: true, id: result.data?.id };
    } catch (error) {
        console.error('❌ Failed to send contact email:', error);
        throw error;
    }
}

/**
 * Sends a confirmation email to the user who submitted the contact form
 */
export async function sendContactConfirmationEmail(data: ContactEmailData) {
    const { name, email, subject } = data;

    try {
        const result = await resend.emails.send({
            from: `UBOT Support <${FROM_EMAIL}>`,
            to: email,
            subject: 'We received your message - UBOT Platform',
            html: generateConfirmationEmailHTML(name, subject),
            text: generateConfirmationEmailText(name, subject),
        });

        console.log('✅ Confirmation email sent successfully:', result);
        return { success: true, id: result.data?.id };
    } catch (error) {
        console.error('❌ Failed to send confirmation email:', error);
        // Don't throw - confirmation email failure shouldn't block the main flow
        return { success: false, error };
    }
}

/**
 * Generates HTML email for support team
 */
function generateContactEmailHTML(data: ContactEmailData): string {
    const { name, email, subject, message } = data;
    const timestamp = new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'long',
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Courier New', monospace; background-color: #000000; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border: 1px solid #00ff41;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px; background: linear-gradient(135deg, #000000 0%, #0a0a0a 100%); border-bottom: 2px solid #00ff41;">
                            <h1 style="margin: 0; color: #00ff41; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px;">
                                📬 NEW CONTACT SUBMISSION
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff99; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">
                                UBOT Platform • ${timestamp}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <!-- Subject -->
                            <div style="margin-bottom: 30px; padding: 20px; background-color: #00ff4108; border-left: 3px solid #00ff41;">
                                <p style="margin: 0 0 5px 0; color: #00ff41; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">
                                    SUBJECT
                                </p>
                                <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 700;">
                                    ${subject}
                                </p>
                            </div>

                            <!-- Sender Info -->
                            <div style="margin-bottom: 30px;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding: 15px; background-color: #ffffff05; border: 1px solid #ffffff1a;">
                                            <p style="margin: 0 0 5px 0; color: #00ff41; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">
                                                NAME
                                            </p>
                                            <p style="margin: 0; color: #ffffff; font-size: 14px;">
                                                ${name}
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 15px; background-color: #ffffff05; border: 1px solid #ffffff1a; border-top: none;">
                                            <p style="margin: 0 0 5px 0; color: #00ff41; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">
                                                EMAIL ADDRESS
                                            </p>
                                            <p style="margin: 0;">
                                                <a href="mailto:${email}" style="color: #00ff41; text-decoration: none; font-size: 14px;">
                                                    ${email}
                                                </a>
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Message -->
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 0 0 10px 0; color: #00ff41; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">
                                    MESSAGE
                                </p>
                                <div style="padding: 20px; background-color: #ffffff05; border: 1px solid #ffffff1a; color: #ffffffe6; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${message}
                                </div>
                            </div>

                            <!-- Quick Reply Button -->
                            <div style="margin-top: 30px; text-align: center;">
                                <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" 
                                   style="display: inline-block; padding: 15px 40px; background-color: #00ff41; color: #000000; text-decoration: none; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; border: none;">
                                    REPLY TO ${name.split(' ')[0].toUpperCase()}
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; background-color: #000000; border-top: 1px solid #ffffff1a; text-align: center;">
                            <p style="margin: 0; color: #ffffff66; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">
                                UBOT Platform • Automated Contact System
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Generates plain text email for support team
 */
function generateContactEmailText(data: ContactEmailData): string {
    const { name, email, subject, message } = data;
    const timestamp = new Date().toLocaleString();

    return `
═══════════════════════════════════════════════════════════
  NEW CONTACT FORM SUBMISSION
  UBOT Platform
  ${timestamp}
═══════════════════════════════════════════════════════════

SUBJECT: ${subject}

FROM:
  Name: ${name}
  Email: ${email}

MESSAGE:
${message}

───────────────────────────────────────────────────────────
Reply to: ${email}
═══════════════════════════════════════════════════════════
    `.trim();
}

/**
 * Generates HTML confirmation email for user
 */
function generateConfirmationEmailHTML(name: string, subject: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Message Received - UBOT</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Courier New', monospace; background-color: #000000; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border: 1px solid #00ff41;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px; background: linear-gradient(135deg, #000000 0%, #0a0a0a 100%); border-bottom: 2px solid #00ff41; text-align: center;">
                            <h1 style="margin: 0; color: #00ff41; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px;">
                                ✓ MESSAGE RECEIVED
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #ffffff; font-size: 16px; line-height: 1.6;">
                                Hi <strong style="color: #00ff41;">${name}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 20px 0; color: #ffffffe6; font-size: 14px; line-height: 1.6;">
                                Thank you for reaching out to UBOT Platform. We've successfully received your message regarding <strong>"${subject}"</strong>.
                            </p>

                            <div style="margin: 30px 0; padding: 20px; background-color: #00ff4108; border-left: 3px solid #00ff41;">
                                <p style="margin: 0; color: #ffffffe6; font-size: 13px; line-height: 1.6;">
                                    <strong style="color: #00ff41;">⚡ WHAT'S NEXT?</strong><br><br>
                                    Our support team will review your message and respond within <strong>24-48 hours</strong>. For urgent matters, please include "URGENT" in your subject line.
                                </p>
                            </div>

                            <p style="margin: 20px 0 0 0; color: #ffffff99; font-size: 12px; line-height: 1.6;">
                                If you have any additional information to add, simply reply to this email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #000000; border-top: 1px solid #ffffff1a; text-align: center;">
                            <p style="margin: 0 0 10px 0; color: #00ff41; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">
                                UBOT PLATFORM
                            </p>
                            <p style="margin: 0; color: #ffffff66; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">
                                Building the Future of AI Interactions
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Generates plain text confirmation email for user
 */
function generateConfirmationEmailText(name: string, subject: string): string {
    return `
═══════════════════════════════════════════════════════════
  MESSAGE RECEIVED
  UBOT Platform
═══════════════════════════════════════════════════════════

Hi ${name},

Thank you for reaching out to UBOT Platform. We've successfully 
received your message regarding "${subject}".

⚡ WHAT'S NEXT?

Our support team will review your message and respond within 
24-48 hours. For urgent matters, please include "URGENT" in 
your subject line.

If you have any additional information to add, simply reply 
to this email.

───────────────────────────────────────────────────────────
UBOT Platform
Building the Future of AI Interactions
═══════════════════════════════════════════════════════════
    `.trim();
}
