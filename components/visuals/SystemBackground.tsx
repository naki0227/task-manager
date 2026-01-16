"use client";

import { motion } from "framer-motion";

export function SystemBackground() {
    return (
        <div className="fixed inset-0 -z-50 h-full w-full bg-background overflow-hidden pointer-events-none">
            {/* Soft Gradient Meshes */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-200/20 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-200/20 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
            <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-sky-200/20 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-4000" />

            {/* Subtle Dot Pattern */}
            <div
                className="absolute inset-0 opacity-[0.4]"
                style={{
                    backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
                    backgroundSize: "32px 32px"
                }}
            />
        </div>
    );
}
