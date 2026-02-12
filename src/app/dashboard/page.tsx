"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Github, Link as LinkIcon, Loader2, CheckCircle2, Terminal, ExternalLink, Check, Copy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";

interface Profile {
    username: string;
    role?: string;
    portfolio_data: {
        github?: string;
        role?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export default function Dashboard() {
    const router = useRouter();
    const [githubUrl, setGithubUrl] = useState("https://github.com/");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingProfile, setFetchingProfile] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [generatedLink, setGeneratedLink] = useState("");
    const [error, setError] = useState("");
    const [copiedLink, setCopiedLink] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [extraDetails, setExtraDetails] = useState("");


    useEffect(() => {
        const initDashboard = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/auth/login");
                return;
            }
            setUser(session.user);
            await fetchProfile(session.user.id);
            setFetchingProfile(false);
        };
        initDashboard();
    }, [router]);

    // Live Username Check
    useEffect(() => {
        if (!username || username.length < 3) {
            setIsUsernameAvailable(null);
            return;
        }

        const checkAvailability = async () => {
            setIsCheckingUsername(true);
            try {
                const res = await fetch(`/api/check-username?username=${username}&userId=${user?.id || ''}`);
                const data = await res.json();
                setIsUsernameAvailable(data.available);
            } catch (err) {
                console.error("Check failed:", err);
            } finally {
                setIsCheckingUsername(false);
            }
        };

        const timer = setTimeout(checkAvailability, 500);
        return () => clearTimeout(timer);
    }, [username, user?.id]);

    const fetchProfile = async (userId: string) => {
        try {
            const res = await fetch(`/api/profile?userId=${userId}`);
            const data = await res.json();
            if (data.profile) {
                setProfile(data.profile);
                setGeneratedLink(`${typeof window !== 'undefined' ? window.location.origin : ''}/chat/${data.profile.username}`);
                setUsername(data.profile.username);
                setGithubUrl(data.profile.portfolio_data.github || "https://github.com/");
                setExtraDetails(data.profile.portfolio_data.extra_details || "");
            } else {
                setProfile(null);
                setGeneratedLink("");
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    const handleDelete = async () => {
        if (!user) return;
        if (!confirm("Are you sure you want to delete your chatbot? This action cannot be undone.")) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/profile?userId=${user.id}`, { method: "DELETE" });
            if (res.ok) {
                setProfile(null);
                setGeneratedLink("");
                setUsername("");
                setGithubUrl("https://github.com/");
                setExtraDetails("");
                setIsEditing(false);
            }
        } catch {
            setError("Failed to delete profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if ((!githubUrl && !resumeFile && !extraDetails) || !username || !user) {
            setError("At least one data source (GitHub, Resume, or Extra Details) is required.");
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("github", githubUrl);
        formData.append("username", username);
        formData.append("userId", user.id);
        formData.append("extraDetails", extraDetails);
        if (resumeFile) {
            formData.append("resume", resumeFile);
        }

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
            if (user) await fetchProfile(user.id);
            setGeneratedLink(`${window.location.origin}/chat/${username}`);
            setIsEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Synchronization failed.");
        } finally {
            setTimeout(() => setLoading(false), 800);
        }
    };

    if (fetchingProfile) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black crt-overlay pt-24 pb-10 md:py-20 px-4 md:px-6 relative overflow-hidden font-mono">
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
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-4xl mx-auto flex flex-col gap-8 md:gap-16 relative z-10">
                {/* Minimal Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-primary" />
                            <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Dashboard</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">
                            {profile ? "Your Chatbot" : "Configure Bot"}
                        </h1>
                        <p className="text-white/90 text-sm uppercase tracking-widest leading-relaxed">
                            {profile ? "Manage your existing career twin" : "Connect your GitHub and choose your link handle"}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLogout}
                            className="px-6 py-3 border border-white/10 text-white hover:text-primary hover:border-primary/50 transition-all text-[11px] uppercase tracking-widest font-black"
                        >
                            [ Sign Out ]
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                {profile && !isEditing ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-12"
                    >
                        {/* Status Card */}
                        <div className="relative group">
                            <div className="absolute -top-3 left-6 px-3 py-1 bg-black border border-primary/50 text-[10px] font-black text-primary uppercase tracking-[0.4em] z-10 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                Active System // ONLINE
                            </div>
                            <div
                                className="border border-primary/30 bg-primary/[0.02] p-6 md:p-12 flex flex-col items-center justify-center gap-8 relative overflow-hidden"
                                style={{ clipPath: "polygon(0 0, 100% 0, 100% 92%, 98% 100%, 0 100%)" }}
                            >
                                <div className="text-center space-y-4">
                                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">@{profile.username}</h3>
                                    <div className="flex items-center gap-4 justify-center">
                                        <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-[0.2em]">
                                            {profile.portfolio_data.role || "Developer"}
                                        </span>
                                        <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/50 text-[9px] font-black uppercase tracking-[0.2em]">
                                            v1.0.0
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    <a
                                        href={generatedLink}
                                        target="_blank"
                                        className="px-8 py-4 border border-primary text-primary hover:bg-primary hover:text-black transition-all text-[11px] font-black uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Launch Bot
                                    </a>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-8 py-4 border border-white/10 text-white hover:border-primary/50 hover:text-primary transition-all text-[11px] font-black uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <Terminal className="w-4 h-4" />
                                        Edit Config
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="px-8 py-4 border border-white/10 text-white hover:border-red-500/50 hover:text-red-500 transition-all text-[11px] font-black uppercase tracking-widest flex items-center gap-2"
                                    >
                                        [ Delete Bot ]
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Integration Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 border border-white/5 bg-white/[0.01] space-y-4">
                                <div className="flex items-center gap-2 text-primary opacity-50">
                                    <LinkIcon className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Share Link</span>
                                </div>
                                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                    <span className="text-white text-xs truncate max-w-[200px]">{generatedLink}</span>
                                    <button onClick={handleCopyLink} className="text-primary hover:scale-110 transition-transform">
                                        {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="p-8 border border-white/5 bg-white/[0.01] space-y-4">
                                <div className="flex items-center gap-2 text-primary opacity-50">
                                    <Github className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Connected Source</span>
                                </div>
                                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                    <span className="text-white text-xs truncate max-w-[200px]">{profile.portfolio_data.github}</span>
                                    <ExternalLink className="w-4 h-4 text-white/20" />
                                </div>
                            </div>

                            {/* API Endpoint Section */}
                            <div className="md:col-span-2 p-8 border border-white/5 bg-white/[0.01] space-y-4">
                                <div className="flex items-center gap-2 text-primary opacity-50">
                                    <Terminal className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Headless API Endpoint</span>
                                </div>
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <code className="text-white/70 text-[10px] md:text-xs font-mono bg-black/50 p-3 rounded border border-white/10 w-full md:w-auto flex-1 break-all">
                                        POST {typeof window !== 'undefined' ? window.location.origin : ''}/api/chat/{profile.username}
                                    </code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/api/chat/${profile.username}`);
                                            alert("API Endpoint copied!");
                                        }}
                                        className="text-primary text-[10px] uppercase font-black hover:underline whitespace-nowrap"
                                    >
                                        [ Copy Endpoint ]
                                    </button>
                                </div>
                                <p className="text-[10px] text-white/40 uppercase tracking-wider">
                                    Integrate your bot into any frontend. Send POST requests with <code>{`{ messages: [] }`}</code> body.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-12"
                    >
                        {isEditing && (
                            <button
                                onClick={() => setIsEditing(false)}
                                className="text-primary text-[10px] font-black uppercase tracking-widest mb-4 hover:underline"
                            >
                                &lt;- Cancel Editing
                            </button>
                        )}

                        <form onSubmit={handleGenerate} className="space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] font-mono">Your Link Handle</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/80 font-mono text-[11px] uppercase font-black pointer-events-none select-none">
                                            <span className="hidden md:inline">ubot-chat.vercel.app/at/</span>
                                            <span className="md:hidden">.../at/</span>
                                        </span>
                                        <input
                                            type="text"
                                            required
                                            placeholder="your-name"
                                            className={`w-full bg-white/[0.02] border py-5 pl-[80px] md:pl-[220px] pr-4 focus:outline-none transition-all text-white font-mono text-sm ${isUsernameAvailable === true ? 'border-primary/50' :
                                                isUsernameAvailable === false ? 'border-red-500/50' :
                                                    'border-white/10'
                                                }`}
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {isCheckingUsername ? (
                                                <Loader2 className="w-3 h-3 text-primary animate-spin" />
                                            ) : isUsernameAvailable === true ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[8px] font-black text-primary uppercase tracking-widest">Available</span>
                                                    <CheckCircle2 className="w-3 h-3 text-primary" />
                                                </div>
                                            ) : isUsernameAvailable === false ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Taken</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-white uppercase tracking-[0.2em]">GitHub Profile URL</label>
                                    <div className="relative">
                                        <Github className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                                        <input
                                            type="text"
                                            placeholder="https://github.com/..."
                                            className="w-full bg-white/[0.02] border border-white/10 py-5 pl-14 pr-4 focus:outline-none focus:border-primary/50 transition-all text-white text-sm"
                                            value={githubUrl}
                                            onChange={(e) => setGithubUrl(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] font-mono">Resume (PDF)</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        className="w-full bg-white/[0.02] border border-white/10 py-4 px-4 focus:outline-none focus:border-primary/50 transition-all text-white font-mono text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-black file:bg-primary file:text-black hover:file:bg-primary/90"
                                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] font-mono">Extra Details (Optional)</label>
                                <textarea
                                    placeholder="Add specific instructions, recent achievements, or bio overrides here..."
                                    className="w-full bg-white/[0.02] border border-white/10 py-4 px-4 focus:outline-none focus:border-primary/50 transition-all text-white font-mono text-sm min-h-[100px]"
                                    value={extraDetails}
                                    onChange={(e) => setExtraDetails(e.target.value)}
                                />
                                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                                    * Provide at least one source to train your bot.
                                </p>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    Error: {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || (!githubUrl && !resumeFile && !extraDetails) || !username || isUsernameAvailable === false || isCheckingUsername}
                                className="w-full py-6 border border-primary text-primary font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 hover:bg-primary hover:text-black transition-all disabled:opacity-20"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        REBUILDING SYSTEM...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        {isEditing ? "Update Chatbot" : "Generate Chatbot"}
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                )}
            </div>

            {/* Global Status Bar */}
            <footer className="fixed bottom-0 left-0 right-0 h-10 border-t border-white/5 bg-black flex items-center justify-between px-8 z-50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] text-white uppercase tracking-widest">
                            USR: {user?.email}
                        </span>
                    </div>
                </div>
                <div className="text-[9px] text-white/50 uppercase tracking-widest">
                    UBOT ARCHITECTURE v2.5
                </div>
            </footer>
        </main >
    );
}
