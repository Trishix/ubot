"use client";

import { useState } from "react";
import { Mail, Send, Terminal as TerminalIcon, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ContactPage() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "General Inquiry",
        message: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setStatus("success");
                setFormData({ name: "", email: "", subject: "General Inquiry", message: "" });
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    };

    return (
        <main className="min-h-screen bg-black pt-32 pb-20 px-6 font-mono relative">
            {/* Background Grid Accent */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

            <div className="max-w-4xl mx-auto space-y-20 relative z-10">
                {/* Header */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Contact Us</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
                        Establish <span className="text-primary">Contact</span>
                    </h1>
                    <p className="text-white/90 text-sm md:text-base max-w-2xl leading-relaxed uppercase">
                        Our support team is here to help with any questions or feedback. We&apos;ll get back to you within 24-48 hours.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                    {/* Sidebar Info */}
                    <div className="space-y-12">
                        <div className="space-y-8">
                            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.5em]">Direct Links</h2>
                            <div className="space-y-6">
                                <div className="group cursor-pointer">
                                    <span className="block text-[10px] text-primary uppercase tracking-widest mb-1 font-black group-hover:text-white transition-colors">Email</span>
                                    <p className="text-sm text-white font-black uppercase tracking-tight">support@ubot-chat.vercel.app</p>
                                </div>
                                <div className="group cursor-pointer">
                                    <span className="block text-[10px] text-primary uppercase tracking-widest mb-1 font-black group-hover:text-white transition-colors">System Status</span>
                                    <div className="text-sm text-white font-black uppercase tracking-tight flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        All Systems Live
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border border-white/10 bg-white/[0.02] space-y-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 blur-3xl rounded-full" />
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <p className="text-[10px] text-white/90 uppercase leading-relaxed font-black">
                                Your message is encrypted for secure delivery to our command center.
                            </p>
                        </div>
                    </div>

                    {/* Form Area */}
                    <div className="md:col-span-2">
                        <AnimatePresence mode="wait">
                            {status === "success" ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="h-full flex flex-col items-center justify-center p-12 border border-primary/20 bg-primary/[0.02] text-center space-y-6"
                                >
                                    <CheckCircle2 className="w-12 h-12 text-primary" />
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-white uppercase italic">Message Sent</h3>
                                        <p className="text-[11px] text-white/80 uppercase tracking-widest leading-relaxed font-black">
                                            We&apos;ve received your message and will respond as soon as possible.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setStatus("idle")}
                                        className="text-[11px] text-primary font-black uppercase tracking-[0.3em] hover:text-white hover:underline transition-all"
                                    >
                                        [ Send Another Message ]
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.form
                                    onSubmit={handleSubmit}
                                    className="space-y-8"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-white uppercase tracking-widest">Name</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full bg-white/[0.02] border border-white/10 p-5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-mono placeholder:text-white/20"
                                                placeholder="Your Name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-white uppercase tracking-widest">Email Address</label>
                                            <input
                                                required
                                                type="email"
                                                className="w-full bg-white/[0.02] border border-white/10 p-5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-mono placeholder:text-white/20"
                                                placeholder="your@email.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-white uppercase tracking-widest">Subject</label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-black border border-white/10 p-5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-mono appearance-none font-black"
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            >
                                                <option>General Inquiry</option>
                                                <option>Technical Support</option>
                                                <option>Partnership Inquiry</option>
                                                <option>Bug Report</option>
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                                                <TerminalIcon className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-white uppercase tracking-widest">Message</label>
                                        <textarea
                                            required
                                            rows={6}
                                            className="w-full bg-white/[0.02] border border-white/10 p-5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-mono resize-none placeholder:text-white/20"
                                            placeholder="Tell us what&apos;s on your mind..."
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={status === "loading"}
                                        className="w-full py-6 border border-primary text-primary font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-4 hover:bg-primary hover:text-black transition-all group disabled:opacity-50"
                                    >
                                        {status === "loading" ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                                Send Message
                                            </>
                                        )}
                                    </button>

                                    {status === "error" && (
                                        <p className="text-[11px] text-red-500 uppercase tracking-widest text-center font-black">
                                            Error: Something went wrong. Please try again.
                                        </p>
                                    )}
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </main>
    );
}
