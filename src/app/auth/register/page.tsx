"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ArrowRight, UserPlus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
                },
            });
            if (error) throw error;
        } catch (err) {
            console.error("Google login error:", err);
            setError(err instanceof Error ? err.message : "Failed to initialize Google login");
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                }
            }
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 pt-24 bg-black crt-overlay">
            <div className="w-full max-w-[420px] relative z-10">
                <div className="border border-white/5 bg-[#050505] p-10">
                    <div className="mb-10 text-left">
                        <div className="flex items-center gap-2 mb-4">
                            <UserPlus className="w-4 h-4 text-primary" aria-hidden="true" />
                            <span className="text-[10px] font-mono font-black text-primary uppercase tracking-widest">Join Ubot</span>
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Create Account</h1>
                        <p className="text-white/90 text-sm font-mono uppercase tracking-tight">Enter your details to get started</p>
                    </div>

                    {/* Google Auth - Primary */}
                    <button
                        onClick={handleGoogleLogin}
                        aria-label="Continue with Google"
                        className="w-full py-4 bg-white text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-white/90 active:scale-[0.98] transition-all min-h-[52px]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" className="w-4 h-4 fill-black" aria-hidden="true">
                            <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                        </svg>
                        <span>Sign up with Google</span>
                    </button>

                    <p className="text-center text-[10px] text-white/30 font-mono mt-3">Fastest way to get started — one click</p>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">or register with email</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Email/Password Auth - Secondary */}
                    <form onSubmit={handleRegister} className="space-y-5" aria-label="Registration form">
                        <div className="space-y-2">
                            <label htmlFor="register-username" className="text-[11px] font-black text-white/60 uppercase tracking-[0.2em] font-mono required-indicator">Username</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 font-mono font-bold" aria-hidden="true">$</span>
                                <input
                                    id="register-username"
                                    type="text"
                                    required
                                    placeholder="your-username"
                                    autoComplete="username"
                                    className="w-full bg-white/[0.02] border border-white/5 py-3.5 pl-10 pr-4 focus:border-primary/50 transition-all text-white font-mono placeholder:text-white/20 text-sm"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="register-email" className="text-[11px] font-black text-white/60 uppercase tracking-[0.2em] font-mono required-indicator">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
                                <input
                                    id="register-email"
                                    type="email"
                                    required
                                    placeholder="your@email.com"
                                    autoComplete="email"
                                    className="w-full bg-white/[0.02] border border-white/5 py-3.5 pl-12 pr-4 focus:border-primary/50 transition-all text-white font-mono placeholder:text-white/20 text-sm"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="register-password" className="text-[11px] font-black text-white/60 uppercase tracking-[0.2em] font-mono required-indicator">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
                                <input
                                    id="register-password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    className="w-full bg-white/[0.02] border border-white/5 py-3.5 pl-12 pr-4 focus:border-primary/50 transition-all text-white font-mono placeholder:text-white/20 text-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 border border-white/10 text-white/80 font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:bg-white/[0.03] active:scale-[0.98] transition-all disabled:opacity-50 min-h-[48px]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Create Account with Email</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-4 p-4 border border-red-500/20 bg-red-500/10 flex items-center gap-3"
                                role="alert"
                            >
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" aria-hidden="true" />
                                <p className="text-sm text-red-400">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <p className="text-center text-xs text-white/40 font-mono uppercase tracking-[0.2em]">
                            Already have an account?{" "}
                            <Link href="/auth/login" className="text-primary hover:text-white transition-colors font-black">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <Link href="/" className="text-xs text-white/40 hover:text-primary transition-all uppercase tracking-[0.4em] font-mono">
                        Back to Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
