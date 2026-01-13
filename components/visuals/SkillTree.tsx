"use client";

import { motion } from "framer-motion";

const SKILLS = [
    { id: 1, x: 50, y: 80, label: "Core", unlocked: true },
    { id: 2, x: 20, y: 60, label: "Python", unlocked: true },
    { id: 3, x: 80, y: 60, label: "React", unlocked: true },
    { id: 4, x: 50, y: 40, label: "Architecture", unlocked: false },
    { id: 5, x: 20, y: 20, label: "AI Ops", unlocked: false },
];

export function SkillTree() {
    return (
        <div className="relative h-[300px] w-full bg-slate-950 rounded-lg border border-white/10 p-4 overflow-hidden">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <span className="text-xs font-mono text-purple-400">SKILL_MATRIX</span>
            </div>

            <svg className="absolute inset-0 h-full w-full">
                {/* Connections */}
                <line x1="50%" y1="80%" x2="20%" y2="60%" stroke="#1e293b" strokeWidth="2" />
                <line x1="50%" y1="80%" x2="80%" y2="60%" stroke="#1e293b" strokeWidth="2" />
                <line x1="20%" y1="60%" x2="20%" y2="20%" stroke="#1e293b" strokeWidth="2" />
                <line x1="50%" y1="80%" x2="50%" y2="40%" stroke="#1e293b" strokeWidth="2" />
            </svg>

            {SKILLS.map((skill) => (
                <motion.div
                    key={skill.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: skill.id * 0.1 }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
                >
                    <div className={`
                h-10 w-10 rounded-full flex items-center justify-center border-2 
                ${skill.unlocked
                            ? 'bg-purple-500/20 border-purple-500 text-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                            : 'bg-slate-900 border-slate-700 text-slate-700'}
            `}>
                        <div className="h-2 w-2 rounded-full bg-current" />
                    </div>
                    <span className={`mt-2 text-xs font-mono font-bold ${skill.unlocked ? 'text-purple-400' : 'text-slate-600'}`}>{skill.label}</span>
                </motion.div>
            ))}
        </div>
    );
}
