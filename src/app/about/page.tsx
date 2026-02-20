"use client";

import { Github, Linkedin, ExternalLink, Cpu, ShieldCheck } from "lucide-react";

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-black pt-32 pb-20 px-6 font-mono relative overflow-hidden">
            {/* Background Grid Accent */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden="true"
                style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

            <div className="max-w-4xl mx-auto space-y-24 relative z-10">
                {/* Mission Section */}
                <section className="space-y-6" aria-label="Our mission">
                    <div className="flex items-center gap-2 text-primary">
                        <Cpu className="w-4 h-4" aria-hidden="true" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Our Mission</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none">
                        Digital <span className="text-primary italic">Identity</span> Extension
                    </h1>
                    <p className="text-white/90 text-base max-w-2xl leading-relaxed">
                        UBOT was created to bring high-performance AI representation to every developer. By syncing directly with your GitHub activity, we build autonomous personas that showcase your skills and experience 24/7.
                    </p>
                </section>

                {/* Founder Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start" aria-label="About the founder">
                    <div className="space-y-8">
                        <h2 className="text-xs font-black text-white uppercase tracking-[0.5em]">The Founder</h2>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-white uppercase italic">Trishit <span className="text-primary">Swarnakar</span></h3>
                            <p className="text-white/90 text-sm leading-relaxed">
                                Full-stack developer and AI architect focused on creating high-performance digital identities. Specialized in building intelligent interfaces that bridge the gap between code and conversation.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <a
                                href="https://github.com/Trishix"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Visit Trishit Swarnakar's GitHub profile"
                                className="flex items-center justify-between p-6 border border-white/5 bg-white/[0.01] hover:border-primary/50 hover:bg-primary/[0.02] transition-all group min-h-[44px]"
                            >
                                <div className="flex items-center gap-4">
                                    <Github className="w-5 h-5 text-primary" aria-hidden="true" />
                                    <span className="text-xs font-black uppercase tracking-widest text-white group-hover:text-primary transition-colors">GitHub Profile</span>
                                </div>
                                <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-primary transition-all" aria-hidden="true" />
                            </a>
                            <a
                                href="https://www.linkedin.com/in/trishit-swarnakar/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Visit Trishit Swarnakar's LinkedIn profile"
                                className="flex items-center justify-between p-6 border border-white/5 bg-white/[0.01] hover:border-primary/50 hover:bg-primary/[0.02] transition-all group min-h-[44px]"
                            >
                                <div className="flex items-center gap-4">
                                    <Linkedin className="w-5 h-5 text-primary" aria-hidden="true" />
                                    <span className="text-xs font-black uppercase tracking-widest text-white group-hover:text-primary transition-colors">LinkedIn Network</span>
                                </div>
                                <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-primary transition-all" aria-hidden="true" />
                            </a>
                        </div>
                    </div>

                    <div className="space-y-12">
                        <h2 className="text-xs font-black text-white uppercase tracking-[0.5em]">Our Philosophy</h2>
                        <div className="space-y-8">
                            {[
                                { title: "Authenticity", desc: "Every response is grounded in your actual work and verified profile data." },
                                { title: "Performance", desc: "Lightning-fast response times via our optimized terminal-first architecture." },
                                { title: "Simplicity", desc: "Designed for developers who want a powerful representative without the noise." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-6">
                                    <div className="h-full w-[1px] bg-primary/20" aria-hidden="true" />
                                    <div className="space-y-2">
                                        <h3 className="text-primary font-black uppercase text-xs tracking-widest">{item.title}</h3>
                                        <p className="text-white/80 text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Platform Summary */}
                <section
                    className="p-16 border border-white/5 bg-white/[0.01] relative overflow-hidden text-center space-y-8"
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 85%, 97% 100%, 0 100%)" }}
                    aria-label="Security information"
                >
                    <ShieldCheck className="w-12 h-12 text-primary/40 mx-auto" aria-hidden="true" />
                    <div className="space-y-3">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Secure Deployment</h3>
                        <p className="text-white/90 text-sm max-w-md mx-auto leading-relaxed">
                            We leverage industry-standard security protocols to ensure your AI representation maintains your professional standards.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
