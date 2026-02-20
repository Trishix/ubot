"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X, User } from "lucide-react";
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
        <nav
            className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 flex items-center justify-between px-8 z-50 bg-black/50 backdrop-blur-md font-mono"
            aria-label="Main navigation"
        >
            <Link href="/" className="flex items-center gap-2 group" aria-label="UBOT — go to homepage">
                <Image src="/logoubot.jpg" alt="UBOT logo" width={36} height={36} className="rounded-sm group-hover:scale-110 transition-transform" />
                <span className="font-black tracking-tighter text-xl text-white">UBOT</span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex gap-8 items-center text-[11px] uppercase tracking-widest">
                {navLinks.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={`hover:text-primary transition-colors py-1 ${pathname === link.href
                            ? "text-primary font-black border-b-2 border-primary"
                            : "text-white/90 border-b-2 border-transparent"
                            }`}
                        aria-current={pathname === link.href ? "page" : undefined}
                    >
                        {link.name}
                    </Link>
                ))}

                {user ? (
                    <Link
                        href="/dashboard"
                        className="px-5 py-2.5 border border-primary text-primary hover:bg-primary hover:text-black transition-all font-black flex items-center gap-2 min-h-[44px]"
                        aria-current={pathname === "/dashboard" ? "page" : undefined}
                    >
                        <User className="w-3 h-3" />
                        Dashboard
                    </Link>
                ) : (
                    <div className="flex items-center gap-4">
                        <Link href="/auth/login" className="text-white/90 hover:text-primary transition-colors py-2">Login</Link>
                        <Link
                            href="/auth/register"
                            className="px-5 py-2.5 border border-primary text-primary hover:bg-primary hover:text-black transition-all font-black min-h-[44px] flex items-center"
                        >
                            Sign Up
                        </Link>
                    </div>
                )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
                className="md:hidden text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile Menu */}
            {isOpen && (
                <div
                    className="absolute top-16 left-0 right-0 bg-black border-b border-white/5 p-8 flex flex-col gap-2 md:hidden z-40"
                    role="menu"
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            role="menuitem"
                            aria-current={pathname === link.href ? "page" : undefined}
                            className={`text-xs uppercase tracking-[0.2em] py-3 px-2 min-h-[44px] flex items-center ${pathname === link.href
                                ? "text-primary font-black border-l-2 border-primary pl-4"
                                : "text-white/70 border-l-2 border-transparent"
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="h-[1px] bg-white/5 my-2" />
                    {user ? (
                        <Link
                            href="/dashboard"
                            onClick={() => setIsOpen(false)}
                            role="menuitem"
                            className="w-full py-4 border border-primary text-primary flex items-center justify-center font-black uppercase text-xs tracking-widest gap-2 min-h-[44px]"
                        >
                            <User className="w-3 h-3" />
                            Dashboard
                        </Link>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <Link
                                href="/auth/login"
                                onClick={() => setIsOpen(false)}
                                role="menuitem"
                                className="w-full py-4 text-white/70 flex items-center justify-center uppercase text-xs tracking-widest min-h-[44px]"
                            >
                                Login
                            </Link>
                            <Link
                                href="/auth/register"
                                onClick={() => setIsOpen(false)}
                                role="menuitem"
                                className="w-full py-4 border border-primary text-primary flex items-center justify-center font-black uppercase text-xs tracking-widest min-h-[44px]"
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
