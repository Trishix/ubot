"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/dashboard`,
                },
            });
            if (error) throw error;
        } catch (err) {
            console.error("Google login error:", err);
            setError(err instanceof Error ? err.message : "Failed to initialize Google login");
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-black crt-overlay">
            <div className="w-full max-w-[420px] relative z-10">
                <div className="border border-white/5 bg-[#050505] p-10">
                    <div className="mb-10 text-left">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-mono font-black text-primary uppercase tracking-widest">Secure Access</span>
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Welcome Back</h1>
                        <p className="text-white/90 text-sm font-mono uppercase tracking-tight">Sign in to manage your AI bot</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] font-mono">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/80" />
                                <input
                                    type="email"
                                    required
                                    placeholder="your@email.com"
                                    className="w-full bg-white/[0.02] border border-white/5 py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all text-white font-mono placeholder:text-white/20"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] font-mono">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-white/[0.02] border border-white/5 py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all text-white font-mono placeholder:text-white/5"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-4 border border-red-500/20 text-red-500 text-[10px] font-mono uppercase text-center tracking-widest"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full py-4 border border-white/10 text-white/90 font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-white/[0.02] active:scale-95 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" className="w-3 h-3 fill-primary">
                                <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                            </svg>
                            <span>Continue with Google</span>
                        </button>

                        <p className="text-center text-[10px] text-white/40 font-mono uppercase tracking-[0.2em]">
                            New here?{" "}
                            <Link href="/auth/register" className="text-primary hover:text-white transition-colors font-black">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <Link href="/" className="text-[10px] text-white/40 hover:text-primary transition-all uppercase tracking-[0.4em] font-mono">
                        Back to Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
