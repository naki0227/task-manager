"use client";

import { motion } from "framer-motion";

const SKILLS = [
    { id: 1, x: 50, y: 50, label: "Core", unlocked: true },
    { id: 2, x: 20, y: 30, label: "Code", unlocked: true },
    { id: 3, x: 80, y: 30, label: "Design", unlocked: true },
    { id: 4, x: 20, y: 70, label: "Mgmt", unlocked: false },
    { id: 5, x: 80, y: 70, label: "AI", unlocked: false },
];

export function SkillTree() {
    return (
        <div className="h-full w-full relative flex items-center justify-center">
            <div className="relative w-full h-full">
                <svg className="absolute inset-0 w-full h-full">
                    <circle cx="50%" cy="50%" r="100" stroke="#0044ff" strokeWidth="1" fill="none" strokeOpacity="0.1" />
                    <circle cx="50%" cy="50%" r="150" stroke="#0044ff" strokeWidth="1" fill="none" strokeOpacity="0.05" />
                </svg>

                {SKILLS.map((skill) => (
                    <motion.div
                        key={skill.id}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
                        style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
                        whileHover={{ scale: 1.1 }}
                    >
                        <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300
                    ${skill.unlocked
                                ? 'bg-blue-500/10 border-blue-500 text-blue-600 shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                                : 'bg-gray-100/50 border-gray-200 text-gray-400'}
                `}>
                            <span className="font-heading text-lg">{skill.label.substring(0, 2)}</span>
                        </div>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{skill.label}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
