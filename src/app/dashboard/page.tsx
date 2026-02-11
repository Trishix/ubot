"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Github, Link as LinkIcon, Loader2, CheckCircle2, LogOut, Terminal, Share2, ExternalLink, Check, Copy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

export default function Dashboard() {
    const router = useRouter();
    const [githubUrl, setGithubUrl] = useState("https://github.com/");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState("");
    const [error, setError] = useState("");
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedApi, setCopiedApi] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/auth/login");
            }
        };
        checkSession();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleCopyApi = () => {
        const apiUrl = `${window.location.host}/api/chat/${username}`;
        navigator.clipboard.writeText(apiUrl);
        setCopiedApi(true);
        setTimeout(() => setCopiedApi(false), 2000);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!githubUrl || !username) {
            setError("Both GitHub URL and username are required.");
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("github", githubUrl);
        formData.append("username", username);

        try {
            const res = await fetch("/api/ingest", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Processing failed.");
            }

            await res.json();
            setGeneratedLink(`${window.location.origin}/chat/${username}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Synchronization failed.");
        } finally {
            setTimeout(() => setLoading(false), 800);
        }
    };

    return (
        <main className="min-h-screen bg-black crt-overlay py-20 px-6 relative overflow-hidden">
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-8 font-mono"
                    >
                        <div className="relative">
                            <div className="w-24 h-24 border border-primary/20 rounded-full animate-[spin_3s_linear_infinite]" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-primary animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-2 text-center">
                            <h2 className="text-primary text-[10px] uppercase font-black tracking-[0.5em] animate-pulse">Initializing Your Bot</h2>
                            <div className="flex items-center gap-2 justify-center">
                                <span className="text-[9px] text-white uppercase tracking-[0.3em] font-bold">Syncing Source</span>
                                <div className="w-4 h-[1px] bg-primary" />
                                <span className="text-[9px] text-white uppercase tracking-[0.3em] font-black">Building Persona</span>
                            </div>
                        </div>
                        <div className="max-w-xs w-full bg-white/[0.1] h-[1px] relative overflow-hidden">
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-primary"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-4xl mx-auto flex flex-col gap-16 relative z-10">
                {/* Minimal Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-primary" />
                            <span className="text-[11px] font-mono font-black text-primary uppercase tracking-[0.2em]">Dashboard</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Configure Bot</h1>
                        <p className="text-white/90 font-mono text-sm uppercase tracking-widest">Connect your GitHub and choose your link handle</p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="px-6 py-3 border border-white/10 text-white hover:text-primary hover:border-primary/50 transition-all text-[11px] font-mono uppercase tracking-widest font-black"
                    >
                        [ Sign Out ]
                    </button>
                </div>

                {/* Config Form */}
                <form onSubmit={handleGenerate} className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] font-mono">Your Link Handle</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/80 font-mono text-[11px] uppercase font-black">ubot.ai/at/</span>
                                <input
                                    type="text"
                                    required
                                    placeholder="your-name"
                                    className="w-full bg-white/[0.02] border border-white/10 py-5 pl-[110px] pr-4 focus:outline-none focus:border-primary/50 transition-all text-white font-mono text-sm"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] font-mono">GitHub Profile URL</label>
                            <div className="relative">
                                <Github className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                                <input
                                    type="text"
                                    required
                                    placeholder="https://github.com/yourusername"
                                    className="w-full bg-white/[0.02] border border-white/10 py-5 pl-14 pr-4 focus:outline-none focus:border-primary/50 transition-all text-white font-mono text-sm"
                                    value={githubUrl}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val.startsWith("https://github.com/")) {
                                            setGithubUrl(val);
                                        } else if ("https://github.com/".startsWith(val)) {
                                            setGithubUrl("https://github.com/");
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-4 border border-red-500/50 bg-red-500/5 text-red-500 text-[11px] font-mono uppercase tracking-widest text-center font-black"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading || !githubUrl || !username}
                        className="w-full py-6 border border-primary text-primary font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 active:scale-[0.99] transition-all disabled:opacity-20 hover:bg-primary hover:text-black group"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="font-mono">Processing...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-5 h-5 transition-transform group-hover:scale-110" />
                                <span className="font-mono">Generate Bot</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Result Links */}
                <AnimatePresence>
                    {generatedLink && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="relative group">
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-black border border-primary/50 text-[10px] font-black text-primary uppercase tracking-[0.4em] z-10 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    Live Bot // Active
                                </div>
                                <div
                                    className="border border-primary/30 bg-primary/[0.02] p-12 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden transition-all hover:bg-primary/[0.04] shadow-[0_0_30px_rgba(0,255,150,0.02)]"
                                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 88%, 97% 100%, 0 100%)" }}
                                >
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                        style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "15px 15px" }} />

                                    <div className="text-left space-y-2 relative">
                                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Bot Ready</h3>
                                        <p className="text-white text-[11px] font-mono uppercase tracking-widest flex items-center gap-2 font-black">
                                            <span className="w-3 h-[1px] bg-primary" />
                                            Your chatbot is now online
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-4 w-full md:w-auto min-w-[340px] relative">
                                        <div className="flex items-center justify-between p-6 bg-black border border-white/10 group-hover:border-primary/40 transition-all">
                                            <span className="text-white font-mono text-[11px] truncate mr-8 uppercase tracking-widest font-black">
                                                {generatedLink}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={handleCopyLink}
                                                    className="p-3 border border-white/10 text-white/90 hover:text-primary hover:border-primary/50 transition-all flex items-center gap-2"
                                                    title="Copy Link"
                                                >
                                                    {copiedLink ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                                                    {copiedLink && <span className="text-[8px] font-black uppercase">Copied</span>}
                                                </button>
                                                <a
                                                    href={generatedLink}
                                                    target="_blank"
                                                    className="p-3 border border-primary text-primary hover:bg-primary hover:text-black transition-all flex items-center justify-center shadow-[0_0_15px_rgba(0,255,150,0.1)]"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative group">
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-black border border-white/30 text-[10px] font-black text-white/90 uppercase tracking-[0.4em] z-10 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                    API Endpoint // Open
                                </div>
                                <div
                                    className="border border-white/10 bg-white/[0.01] p-12 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden transition-all hover:bg-white/[0.03]"
                                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 88%, 97% 100%, 0 100%)" }}
                                >
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                        style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "15px 15px" }} />

                                    <div className="text-left space-y-2 relative">
                                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Public API</h3>
                                        <p className="text-white/90 text-[11px] font-mono uppercase tracking-widest flex items-center gap-2 font-black">
                                            <span className="w-4 h-[1px] bg-white/20" />
                                            Use your bot in other apps
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 w-full md:w-auto min-w-[340px] relative">
                                        <div className="flex items-center justify-between p-6 bg-black border border-white/10 group-hover:border-white/30 transition-all">
                                            <span className="text-white font-mono text-[11px] truncate mr-8 tracking-widest uppercase font-black">
                                                {`${window.location.host}/api/chat/${username}`}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={handleCopyApi}
                                                    className="p-3 border border-white/10 text-white/80 hover:text-primary transition-all flex items-center gap-2"
                                                    title="Copy API Link"
                                                >
                                                    {copiedApi ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                                                    {copiedApi && <span className="text-[8px] font-black uppercase">Copied</span>}
                                                </button>
                                                <button className="p-3 border border-white/10 text-white/50 hover:text-primary transition-all cursor-help" title="POST { messages }">
                                                    <Terminal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="px-6 py-3 border border-white/10 bg-black/40">
                                            <p className="text-[10px] font-mono text-white uppercase tracking-[0.2em] font-black">
                                                Payload: <span className="text-primary">{`{ "messages": [...] }`}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
