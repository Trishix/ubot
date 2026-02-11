"use client";

import Link from "next/link";
import { Terminal as TerminalIcon, Menu, X, User } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { User as SupabaseUser } from "@supabase/supabase-js";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Don't show navbar on chat pages as they are full-screen terminal experiences
    if (pathname.startsWith("/chat/")) return null;

    const navLinks = [
        ...(pathname !== "/" ? [{ name: "Home", href: "/" }] : []),
        { name: "Documentation", href: "/docs" },
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 flex items-center justify-between px-8 z-50 bg-black/50 backdrop-blur-md font-mono">
            <Link href="/" className="flex items-center gap-2 group">
                <TerminalIcon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="font-black tracking-tighter text-xl text-white">UBOT</span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex gap-8 items-center text-[11px] uppercase tracking-widest">
                {navLinks.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={`hover:text-primary transition-colors ${pathname === link.href ? "text-primary font-black" : "text-white/90"
                            }`}
                    >
                        {link.name}
                    </Link>
                ))}

                {user ? (
                    <Link
                        href="/dashboard"
                        className="px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-black transition-all font-black flex items-center gap-2"
                    >
                        <User className="w-3 h-3" />
                        Dashboard
                    </Link>
                ) : (
                    <div className="flex items-center gap-4">
                        <Link href="/auth/login" className="text-white/90 hover:text-primary transition-colors">Login</Link>
                        <Link
                            href="/auth/register"
                            className="px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-black transition-all font-black"
                        >
                            Sign Up
                        </Link>
                    </div>
                )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
                className="md:hidden text-white"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="absolute top-16 left-0 right-0 bg-black border-b border-white/5 p-8 flex flex-col gap-6 md:hidden z-40">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className={`text-xs uppercase tracking-[0.2em] ${pathname === link.href ? "text-primary font-black" : "text-white/70"
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="h-[1px] bg-white/5" />
                    {user ? (
                        <Link
                            href="/dashboard"
                            onClick={() => setIsOpen(false)}
                            className="w-full py-4 border border-primary text-primary flex items-center justify-center font-black uppercase text-xs tracking-widest gap-2"
                        >
                            <User className="w-3 h-3" />
                            Dashboard
                        </Link>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <Link
                                href="/auth/login"
                                onClick={() => setIsOpen(false)}
                                className="w-full py-4 text-white/70 flex items-center justify-center uppercase text-xs tracking-widest"
                            >
                                Login
                            </Link>
                            <Link
                                href="/auth/register"
                                onClick={() => setIsOpen(false)}
                                className="w-full py-4 border border-primary text-primary flex items-center justify-center font-black uppercase text-xs tracking-widest"
                            >
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}
