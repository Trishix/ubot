"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useParams } from "next/navigation";
import { Terminal, Send, Github, Activity, User, HardDrive, Copy, Check } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";

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

    const [input, setInput] = useState("");

    const { messages, sendMessage, status, setMessages } = useChat({
        transport: new DefaultChatTransport({
            api: `/api/chat/${username}`,
        }),
        messages: [
            { id: "boot-1", role: "system", parts: [{ type: "text", text: `Connected to @${username}` }] },
            { id: "boot-2", role: "system", parts: [{ type: "text", text: "AI Personality Loaded" }] },
            {
                id: "intro",
                role: "assistant",
                parts: [{
                    type: "text",
                    text: `System Online.\n\nI am the AI assistant for @${username}.\n\nAsk me about their:\n- Professional Experience\n- Key Skills & Expertise\n- Projects & Achievements\n- Contact info\n\nHow can I help you today?`
                }]
            }
        ],
        onError: (err: Error) => {
            console.error("Chat Error:", err);
            const errorMessage = err instanceof Error ? err.message : "Connection failed.";

            // Avoid duplicate error messages
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setMessages((prev: any[]) => {
                const lastMsg = prev[prev.length - 1];
                // Check if last message is a system error message
                const lastMsgText = lastMsg?.parts?.[0]?.text;
                if (lastMsg?.role === "system" && lastMsgText === errorMessage) return prev;

                return [
                    ...prev,
                    {
                        id: `err-${Date.now()}`,
                        role: "system",
                        parts: [{ type: "text", text: `> SYSTEM ALERT: ${errorMessage}` }]
                    }
                ];
            });
        }
    });

    const isLoading = status === "submitted" || status === "streaming";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getMessageText = (msg: any) => {
        if (typeof msg.content === 'string' && msg.content.length > 0) return msg.content;
        if (msg.parts && Array.isArray(msg.parts)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const text = msg.parts
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((p: any) => p.type === 'text')
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((p: any) => p.text || '')
                .join('');
            if (text) return text;
        }
        return "";
    };

    // Lightweight markdown → JSX renderer
    const renderMarkdown = (text: string) => {
        if (!text) return null;

        // Split into lines, preserving blank lines for paragraph breaks
        const lines = text.split('\n');

        return lines.map((line, lineIdx) => {
            // Parse inline markdown tokens
            const parseInline = (str: string): React.ReactNode[] => {
                const nodes: React.ReactNode[] = [];
                // Regex: bold (**text**), italic (*text*), inline code (`text`), links [text](url)
                const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)|(\*(.+?)\*)|(\[(.+?)\]\((.+?)\))/g;
                let lastIndex = 0;
                let match;

                while ((match = regex.exec(str)) !== null) {
                    // Push text before this match
                    if (match.index > lastIndex) {
                        nodes.push(str.slice(lastIndex, match.index));
                    }

                    if (match[1]) {
                        // Bold: **text**
                        nodes.push(<strong key={`b-${lineIdx}-${match.index}`} className="font-black">{match[2]}</strong>);
                    } else if (match[3]) {
                        // Inline code: `text`
                        nodes.push(<code key={`c-${lineIdx}-${match.index}`} className="px-1.5 py-0.5 bg-white/10 border border-white/10 text-primary text-xs">{match[4]}</code>);
                    } else if (match[5]) {
                        // Italic: *text*
                        nodes.push(<em key={`i-${lineIdx}-${match.index}`} className="italic text-white/90">{match[6]}</em>);
                    } else if (match[7]) {
                        // Link: [text](url)
                        nodes.push(
                            <a key={`a-${lineIdx}-${match.index}`} href={match[9]} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-white transition-colors">
                                {match[8]}
                            </a>
                        );
                    }

                    lastIndex = match.index + match[0].length;
                }

                // Push remaining text
                if (lastIndex < str.length) {
                    nodes.push(str.slice(lastIndex));
                }

                return nodes.length > 0 ? nodes : [str];
            };

            // Handle bullet points (- item or * item)
            const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);
            if (bulletMatch) {
                return (
                    <div key={lineIdx} className="flex gap-2 items-start pl-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{parseInline(bulletMatch[1])}</span>
                    </div>
                );
            }

            // Handle heading-like lines (### text)
            const headingMatch = line.match(/^#{1,3}\s+(.+)/);
            if (headingMatch) {
                return <div key={lineIdx} className="font-black text-white mt-2 mb-1">{parseInline(headingMatch[1])}</div>;
            }

            // Empty line = spacer
            if (line.trim() === '') {
                return <div key={lineIdx} className="h-2" />;
            }

            // Regular line
            return <div key={lineIdx}>{parseInline(line)}</div>;
        });
    };

    const handleCustomSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setInput(""); // Clear input immediately

        try {
            await sendMessage({ text: userMessage });
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    // Scroll handling...
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
                        <Image src="/logoubot.jpg" alt="UBOT logo" width={28} height={28} className="rounded-sm" />
                        <h1 className="text-xs font-black text-white uppercase tracking-widest">
                            {profile?.name || username}
                        </h1>
                    </div>
                    <div className="h-4 w-[1px] bg-white/5" aria-hidden="true" />
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2" role="status" aria-label="Bot status">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                            <span className="text-[10px] text-white uppercase tracking-[0.2em] font-black">Online</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-white/50">
                        <Activity className="w-3 h-3 text-primary" aria-hidden="true" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
                    </div>
                    {profile?.github && (
                        <a
                            href={profile.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label={`Visit ${profile?.name || username}'s GitHub profile`}
                        >
                            <Github className="w-4 h-4" />
                        </a>
                    )}
                </div>
            </header>

            {/* Flat Scrollable Conversation Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 md:px-8 py-10 flex flex-col gap-8 max-w-4xl mx-auto w-full scrollbar-none"
                role="log"
                aria-label="Chat conversation"
                aria-live="polite"
            >
                <AnimatePresence initial={false}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {messages.map((msg: any, i: number) => (
                        <motion.div
                            key={msg.id || i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} w-full`}
                        >
                            {msg.role === 'system' ? (
                                <div className="flex items-center gap-3 ml-1">
                                    <span className={`text-[10px] uppercase tracking-[0.3em] font-black ${getMessageText(msg).includes("Notice") ? "text-red-500" : "text-primary/70"}`}>
                                        {`> ${getMessageText(msg)}`}
                                    </span>
                                </div>
                            ) : (
                                <div className={`flex flex-col max-w-[90%] ${msg.role === 'user' ? 'items-end text-right' : 'items-start text-left'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {msg.role === 'user' ? (
                                            <>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/90">You</span>
                                                <User className="w-3 h-3 text-white/90" aria-hidden="true" />
                                            </>
                                        ) : (
                                            <>
                                                <HardDrive className="w-3 h-3 text-primary" aria-hidden="true" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">@{username}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className={`relative group max-w-full ${msg.role === 'user' ? 'min-w-[200px]' : ''}`}>
                                        {/* Status Tag for User Messages */}
                                        {msg.role === 'user' ? (
                                            <div className="absolute -top-3 right-4 px-2 py-1 bg-black border border-primary/50 text-[7px] font-black text-primary uppercase tracking-[0.3em] z-10 flex items-center gap-1.5" aria-hidden="true">
                                                <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                                Message Sent
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleCopy(getMessageText(msg), msg.id)}
                                                className="absolute -top-3 right-4 px-2 py-1 bg-black border border-white/20 text-[7px] font-black text-white/40 hover:text-primary hover:border-primary/50 uppercase tracking-[0.3em] z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer min-h-[28px]"
                                                aria-label={copiedId === msg.id ? "Response copied" : "Copy AI response"}
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
                                            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" aria-hidden="true"
                                                style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "10px 10px" }} />

                                            {msg.role === 'assistant' ? renderMarkdown(getMessageText(msg)) : getMessageText(msg)}

                                            {msg.role === 'assistant' && !getMessageText(msg) && isLoading && (
                                                <div className="flex gap-1 py-1" role="status" aria-label="AI is typing">
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
                    <form onSubmit={handleCustomSubmit} className="relative" aria-label="Send a message">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-primary" aria-hidden="true">
                            <Terminal className="w-4 h-4" />
                            <span className="font-bold text-sm">$</span>
                        </div>
                        <input
                            type="text"
                            autoFocus
                            className="w-full bg-white/[0.02] border border-white/10 py-5 pl-24 pr-16 focus:border-primary/50 transition-all text-white placeholder:text-white/40 text-base md:text-sm min-h-[48px]"
                            placeholder="Ask a question..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            aria-label="Type your message"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white text-black hover:bg-primary transition-all flex items-center justify-center disabled:opacity-0 shadow-[0_0_15px_rgba(255,255,255,0.1)] min-w-[44px] min-h-[44px]"
                            aria-label="Send message"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-4 flex items-center justify-between px-2">
                        <div className="flex gap-6">
                            <span className="text-[10px] text-white/80 font-black uppercase tracking-[0.4em]">Active Profile: @{username}</span>
                        </div>
                        {isLoading && (
                            <span className="text-[10px] text-primary/70 font-black uppercase tracking-[0.4em] animate-pulse" role="status">
                                @{username} is thinking...
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
