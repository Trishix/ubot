import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { validateEnv } from "@/lib/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "UBOT | Create Your AI Career Twin",
    template: "%s | UBOT Platform"
  },
  description: "Transform your professional identity into a 24/7 AI representative. UBOT analyzes your GitHub and CV to create a personalized, terminal-style chatbot that answers questions about your skills and experience.",
  keywords: ["AI chatbot", "career twin", "resume parser", "GitHub analysis", "personal branding", "AI portfolio", "terminal UI", "developer tools"],
  authors: [{ name: "UBOT Team" }],
  creator: "UBOT Platform",
  publisher: "UBOT Platform",
  metadataBase: new URL("https://ubot-chat.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: {
      default: "UBOT | Create Your AI Career Twin",
      template: "%s | UBOT Platform"
    },
    description: "Generate a personalized AI chatbot from your resume and GitHub. The ultimate developer portfolio tool.",
    url: "https://ubot-chat.vercel.app",
    siteName: "UBOT Platform",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "UBOT Platform Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UBOT | AI Career Twin",
    description: "Turn your CV into an interactive AI chatbot. Hacker-style interface for developers.",
    creator: "@ubot_platform",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Catch config errors early in production
  validateEnv();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "UBOT Platform",
              "url": "https://ubot-chat.vercel.app",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://ubot-chat.vercel.app/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "publisher": {
                "@type": "Organization",
                "name": "UBOT Platform",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://ubot-chat.vercel.app/logo.png"
                }
              }
            })
          }}
        />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
