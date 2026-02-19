import { NextResponse } from "next/server";
import { sendContactEmail, sendContactConfirmationEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const { name, email, subject, message } = await req.json();

        // Validate required fields
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email address" },
                { status: 400 }
            );
        }

        const contactData = {
            name: (name || "").trim(),
            email: (email || "").trim().toLowerCase(),
            subject: (subject || "General Inquiry").trim(),
            message: (message || "").trim(),
        };

        console.log("📬 Processing contact form submission:", {
            timestamp: new Date().toISOString(),
            name: contactData.name,
            email: contactData.email,
            subject: contactData.subject,
        });

        // Send email to support team
        try {
            await sendContactEmail(contactData);
        } catch (emailError) {
            console.error("❌ Failed to send support notification email:", emailError);

            // Check if it's a Resend API key issue
            if (emailError instanceof Error && emailError.message.includes('RESEND_API_KEY')) {
                return NextResponse.json(
                    { error: "Email service not configured. Please contact support directly." },
                    { status: 503 }
                );
            }

            // For other email errors, still log but don't fail the request
            // The confirmation email might still work
        }

        // Send confirmation email to user (non-blocking)
        sendContactConfirmationEmail(contactData).catch((error) => {
            console.error("⚠️ Failed to send confirmation email to user:", error);
            // Don't block the response if confirmation email fails
        });

        return NextResponse.json({
            success: true,
            message: "Your message has been received. We'll get back to you soon!"
        });
    } catch (error) {
        console.error("❌ Contact API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
