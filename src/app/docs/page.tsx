"use client";

import { BookOpen, Zap, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function DocumentationPage() {
    const [copiedPayload, setCopiedPayload] = useState(false);
    const [copiedCurl, setCopiedCurl] = useState(false);

    const payload = `{
  "messages": [
    {
      "role": "user",
      "content": "Tell me about your GitHub projects."
    }
  ]
}`;

    const curlCommand = `curl -X POST https://ubot.ai/api/chat/your_username \\
-H "Content-Type: application/json" \\
-d '{"messages": [{"role": "user", "content": "Hello"}]}'`;

    const handleCopyPayload = () => {
        navigator.clipboard.writeText(payload);
        setCopiedPayload(true);
        setTimeout(() => setCopiedPayload(false), 2000);
    };

    const handleCopyCurl = () => {
        navigator.clipboard.writeText(curlCommand);
        setCopiedCurl(true);
        setTimeout(() => setCopiedCurl(false), 2000);
    };

    return (
        <main className="min-h-screen bg-black pt-32 pb-20 px-6 font-mono">
            <div className="max-w-4xl mx-auto space-y-20">
                {/* Header */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Documentation</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
                        Integration <span className="text-primary">Guide</span>
                    </h1>
                    <p className="text-white/90 text-sm md:text-base max-w-2xl leading-relaxed uppercase">
                        Learn how to integrate your ubot into your own applications and websites using our REST API.
                    </p>
                </div>

                {/* API Quick Start */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-white/5" />
                        <h2 className="text-[11px] font-black text-white uppercase tracking-[0.5em]">Quick Start</h2>
                        <div className="h-[1px] flex-1 bg-white/5" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-white uppercase italic">Access</h3>
                            <p className="text-white/90 text-[11px] leading-relaxed uppercase">
                                Your bot is accessible via a simple POST request. By default, endpoints are public and tied to your chosen username.
                            </p>
                            <div className="p-4 bg-white/[0.02] border border-white/5 relative group">
                                <span className="text-[10px] text-primary block mb-2 uppercase font-black">Endpoint URL</span>
                                <code className="text-xs text-white uppercase font-bold">
                                    POST /api/chat/[username]
                                </code>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-white uppercase italic">Usage Limits</h3>
                            <p className="text-white/90 text-[11px] leading-relaxed uppercase">
                                Standard accounts enjoy generous usage limits. For massive scale or custom needs, contact our enterprise team.
                            </p>
                            <div className="flex gap-4">
                                <div className="flex-1 p-4 border border-white/10 text-center">
                                    <span className="text-xl font-black text-primary italic">50</span>
                                    <span className="block text-[9px] text-white/80 uppercase tracking-widest mt-1 font-black">REQS / HOUR</span>
                                </div>
                                <div className="flex-1 p-4 border border-white/10 text-center">
                                    <span className="text-xl font-black text-white italic">12ms</span>
                                    <span className="block text-[9px] text-white/80 uppercase tracking-widest mt-1 font-black">LATENCY</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payload Documentation */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-white/5" />
                        <h2 className="text-[11px] font-black text-white uppercase tracking-[0.5em]">Request Format</h2>
                        <div className="h-[1px] flex-1 bg-white/5" />
                    </div>

                    <div className="relative group">
                        <div className="absolute -top-3 left-6 px-3 py-1 bg-black border border-primary/50 text-[10px] font-black text-primary uppercase tracking-[0.4em] z-20">
                            JSON PAYLOAD
                        </div>
                        <div className="absolute top-4 right-4 z-20">
                            <button
                                onClick={handleCopyPayload}
                                className="p-2 border border-white/10 bg-black hover:border-primary/50 text-white/50 hover:text-primary transition-all flex items-center gap-2 group/btn"
                            >
                                {copiedPayload ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                                <span className="text-[8px] font-black uppercase tracking-widest">{copiedPayload ? "COPIED" : "COPY"}</span>
                            </button>
                        </div>
                        <div
                            className="border border-white/10 bg-white/[0.01] p-12 relative overflow-hidden"
                            style={{ clipPath: "polygon(0 0, 100% 0, 100% 95%, 98% 100%, 0 100%)" }}
                        >
                            <pre className="text-xs md:text-sm text-white leading-relaxed overflow-x-auto">
                                <code>{payload}</code>
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Integration Examples */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-white/5" />
                        <h2 className="text-[11px] font-black text-white uppercase tracking-[0.5em]">Integration Example</h2>
                        <div className="h-[1px] flex-1 bg-white/5" />
                    </div>

                    <div className="space-y-6">
                        <div className="p-8 border border-white/10 bg-white/[0.01] flex flex-col md:flex-row gap-8 items-start relative group">
                            <div className="p-3 border border-primary text-primary">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div className="space-y-3 flex-1 w-full">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-white font-black uppercase text-sm italic">Sample cURL Command</h4>
                                    <button
                                        onClick={handleCopyCurl}
                                        className="p-2 border border-white/10 bg-black hover:border-primary/50 text-white/50 hover:text-primary transition-all flex items-center gap-2"
                                    >
                                        {copiedCurl ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                                        <span className="text-[8px] font-black uppercase tracking-widest">{copiedCurl ? "COPIED" : "COPY"}</span>
                                    </button>
                                </div>
                                <div className="relative">
                                    <code className="block p-6 bg-black border border-white/10 text-xs text-white break-all leading-loose font-bold">
                                        curl -X POST https://ubot.ai/api/chat/your_username \<br />
                                        -H &quot;Content-Type: application/json&quot; \<br />
                                        -d &#123;&quot;messages&quot;: [&#123;&quot;role&quot;: &quot;user&quot;, &quot;content&quot;: &quot;Hello&quot;&#125;]&#125;
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="pt-20 border-t border-white/10 text-center space-y-6">
                    <p className="text-[11px] text-white/90 uppercase tracking-[0.3em] font-black">Need more power?</p>
                    <a href="/contact" className="inline-block px-10 py-5 border border-primary text-primary font-black uppercase text-xs tracking-[0.2em] hover:bg-primary hover:text-black transition-all">
                        Contact Enterprise
                    </a>
                </div>
            </div>
        </main>
    );
}
