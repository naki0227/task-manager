"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
    { label: "ダッシュボード", href: "/" },
    { label: "思考ノード", href: "/flow" },
    { label: "機会損失", href: "/loss" },
    { label: "成長記録", href: "/skills" },
];

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    return (
        <>
            {/* Hamburger Toggle Button */}
            <motion.nav
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-6 right-6 z-50 mix-blend-difference" // Positioned top-right, visible against light/dark
            >
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-full hover:bg-white/40 transition-colors pointer-events-auto"
                >
                    {isOpen ? <X className="text-white" /> : <Menu className="text-white" />}
                </button>
            </motion.nav>

            {/* Fullscreen Overlay Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-3xl flex items-center justify-center pointer-events-auto"
                    >
                        <div className="flex flex-col items-center gap-8">
                            <h2 className="font-heading text-4xl text-primary mb-8 tracking-tighter">Menu</h2>

                            {NAV_ITEMS.map((item, index) => {
                                const isActive = pathname === item.href;
                                return (
                                    <motion.div
                                        key={item.href}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Link
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "font-jp text-2xl font-bold tracking-widest relative group transition-colors duration-300",
                                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {item.label}
                                            <span className={cn(
                                                "absolute -bottom-2 left-0 w-full h-[2px] bg-primary scale-x-0 transition-transform duration-300 group-hover:scale-x-100",
                                                isActive && "scale-x-100"
                                            )} />
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
