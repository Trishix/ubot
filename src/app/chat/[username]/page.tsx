"use client";

import { useState, useEffect, useRef } from "react";
import { useChat, Message } from "@ai-sdk/react";
import { useParams } from "next/navigation";
import { Terminal, Send, Github, Activity, User, Bot as BotIcon, HardDrive, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

interface Profile {
    name?: string;
    github?: string;
    [key: string]: unknown;
}

export default function PublicBot() {
    const { username } = useParams();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Fetch profile data for the header
    useEffect(() => {
        const fetchProfile = async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("portfolio_data")
                .eq("username", username)
                .single();

            if (!error && data) {
                setProfile(data.portfolio_data);
            }
        };
        fetchProfile();
    }, [username]);

    const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
        api: `/api/chat/${username}`,
        initialMessages: [
            { id: "boot-1", role: "system", content: `Connected to @${username}` },
            { id: "boot-2", role: "system", content: "AI Personality Loaded" },
            {
                id: "intro",
                role: "assistant",
                content: `beeps* System Online.\n\nI am the AI assistant for @${username}. I have full access to their GitHub repositories and professional portfolio.\n\nAsk me about their:\n- Latest projects\n- Tech stack & skills\n- Coding philosophy\n- Contact info\n\nHow can I help you today?`
            }
        ],
        onError: (err) => {
            console.error("Chat Error:", err);
            setMessages(prev => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: "system",
                    content: "Notice: Rate limit reached. Please wait a moment."
                }
            ]);
        }
    });

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleCopy = (content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <main className="relative h-screen bg-black flex flex-col crt-overlay font-mono">
            {/* Minimal Terminal Header */}
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-black z-30">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <BotIcon className="w-4 h-4 text-primary" />
                        <h1 className="text-[10px] font-black text-white uppercase tracking-widest">
                            {profile?.name || username}
                        </h1>
                    </div>
                    <div className="h-4 w-[1px] bg-white/5" />
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] text-white uppercase tracking-[0.2em] font-black">Online</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-white/50">
                        <Activity className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
                    </div>
                    {profile?.github && (
                        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary transition-colors">
                            <Github className="w-4 h-4" />
                        </a>
                    )}
                </div>
            </header>

            {/* Flat Scrollable Conversation Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 md:px-8 py-10 flex flex-col gap-8 max-w-4xl mx-auto w-full scrollbar-none"
            >
                <AnimatePresence initial={false}>
                    {messages.map((msg: Message, i: number) => (
                        <motion.div
                            key={msg.id || i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} w-full`}
                        >
                            {msg.role === 'system' ? (
                                <div className="flex items-center gap-3 ml-1">
                                    <span className={`text-[10px] uppercase tracking-[0.3em] font-black ${msg.content.includes("Notice") ? "text-red-500" : "text-primary/70"}`}>
                                        {`> ${msg.content}`}
                                    </span>
                                </div>
                            ) : (
                                <div className={`flex flex-col max-w-[90%] ${msg.role === 'user' ? 'items-end text-right' : 'items-start text-left'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {msg.role === 'user' ? (
                                            <>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/90">You</span>
                                                <User className="w-3 h-3 text-white/90" />
                                            </>
                                        ) : (
                                            <>
                                                <HardDrive className="w-3 h-3 text-primary" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">@{username}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className={`relative group max-w-full ${msg.role === 'user' ? 'min-w-[200px]' : ''}`}>
                                        {/* Status Tag for User Messages */}
                                        {msg.role === 'user' ? (
                                            <div className="absolute -top-3 right-4 px-2 py-1 bg-black border border-primary/50 text-[7px] font-black text-primary uppercase tracking-[0.3em] z-10 flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                                Message Sent
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleCopy(msg.content, msg.id)}
                                                className="absolute -top-3 right-4 px-2 py-1 bg-black border border-white/20 text-[7px] font-black text-white/40 hover:text-primary hover:border-primary/50 uppercase tracking-[0.3em] z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                            >
                                                {copiedId === msg.id ? <Check className="w-2 h-2 text-primary" /> : <Copy className="w-2 h-2" />}
                                                {copiedId === msg.id ? "COPIED" : "COPY RESPONSE"}
                                            </button>
                                        )}

                                        <div
                                            className={`p-6 border transition-all ${msg.role === 'user'
                                                ? 'border-primary/40 bg-primary/[0.02] text-primary shadow-[0_0_20px_rgba(0,255,150,0.03)]'
                                                : 'border-white/10 bg-white/[0.01] text-white group-hover:border-white/20'
                                                } text-sm leading-relaxed whitespace-pre-wrap relative overflow-hidden`}
                                            style={{
                                                clipPath: "polygon(0 0, 100% 0, 100% 88%, 97% 100%, 0 100%)",
                                            }}
                                        >
                                            {/* Technical Grid Background */}
                                            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                                                style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "10px 10px" }} />

                                            {msg.content}

                                            {msg.role === 'assistant' && !msg.content && isLoading && (
                                                <div className="flex gap-1 py-1">
                                                    <div className="w-1 h-3 bg-primary animate-pulse" />
                                                    <div className="w-1 h-3 bg-primary/40 animate-pulse delay-75" />
                                                    <div className="w-1 h-3 bg-primary/10 animate-pulse delay-150" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Input - Minimal & Functional */}
            <div className="p-4 md:p-8 bg-black z-30">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="relative">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-primary">
                            <Terminal className="w-4 h-4" />
                            <span className="font-bold text-sm">$</span>
                        </div>
                        <input
                            type="text"
                            autoFocus
                            className="w-full bg-white/[0.02] border border-white/10 py-5 pl-24 pr-16 focus:outline-none focus:border-primary/50 transition-all text-white placeholder:text-white/40 text-base md:text-sm"
                            placeholder="Ask a question..."
                            value={input}
                            onChange={handleInputChange}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white text-black hover:bg-primary transition-all flex items-center justify-center disabled:opacity-0 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-4 flex items-center justify-between px-2">
                        <div className="flex gap-6">
                            <span className="text-[10px] text-white/80 font-black uppercase tracking-[0.4em]">Engine: Gemini 2.5 Flash-Lite</span>
                            <span className="text-[10px] text-white/80 font-black uppercase tracking-[0.4em]">Active Profile: @{username}</span>
                        </div>
                        {isLoading && (
                            <span className="text-[10px] text-primary/70 font-black uppercase tracking-[0.4em] animate-pulse">
                                @{username} is thinking...
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
