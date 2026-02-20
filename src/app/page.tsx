"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

export default function LandingPage() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-black crt-overlay pt-20 px-4">

      {/* Hero Section */}
      <section className="relative z-10 max-w-4xl px-6 text-center" aria-label="Hero">
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-6 text-white uppercase italic leading-[1]">
          Turn your <span className="text-primary">Portfolio</span> into an AI Chatbot
        </h1>
        <p className="text-base md:text-lg text-white/80 mb-10 max-w-2xl mx-auto font-mono leading-relaxed">
          The professional AI representative for developers.
          Sync your profile and get a shareable link in under 2 minutes.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {session ? (
            <Link href="/dashboard" className="w-full md:w-auto">
              <button className="w-full px-8 py-4 border border-primary text-primary font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-primary hover:text-black transition-all group min-h-[48px]">
                <Terminal className="w-4 h-4" />
                Go to Dashboard
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          ) : (
            <>
              <Link href="/auth/register" className="w-full md:w-auto">
                <button className="w-full px-8 py-4 border border-primary text-primary font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-primary hover:text-black transition-all group min-h-[48px]">
                  Get Started Now
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <Link href="/auth/login" className="w-full md:w-auto">
                <button className="w-full px-8 py-4 border border-white/10 text-white hover:text-primary hover:border-primary/50 font-mono uppercase tracking-widest text-xs transition-all min-h-[48px]">
                  Login to Account
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Benefits Section */}
        <section className="mt-12 md:mt-24" aria-label="Platform benefits">
          <div className="grid grid-cols-1 md:grid-cols-3 border border-white/5 divide-y md:divide-y-0 md:divide-x divide-white/5">
            {[
              {
                title: "Source Sync",
                desc: "Build knowledge directly from your public repositories and contributions."
              },
              {
                title: "12ms Latency",
                desc: "Engineered for speed with a minimalist terminal-based conversation interface."
              },
              {
                title: "Personal Handle",
                desc: "A permanent ubot-chat.vercel.app/at/username link for your professional bio."
              },
            ].map((benefit, i) => (
              <div key={i} className="p-8 text-left hover:bg-white/[0.02] transition-colors">
                <h3 className="text-xs font-black tracking-[0.2em] text-primary mb-3 uppercase font-mono">
                  {benefit.title}
                </h3>
                <p className="text-white/80 text-sm font-mono leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>

      {/* Global Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-10 border-t border-white/5 bg-black flex items-center justify-between px-8 z-50" role="contentinfo">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2" role="status" aria-label="System status">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            <span className="text-[10px] font-mono text-white uppercase tracking-widest">System Status: Online</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-white/90 uppercase tracking-widest leading-none">
          © 2026 UBOT // v1.0.0
        </div>
      </footer>
    </main >
  );
}
