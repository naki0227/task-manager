"use client";

export function SystemBackground() {
    return (
        <div className="fixed inset-0 -z-50 h-full w-full bg-background overflow-hidden pointer-events-none">
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />

            {/* Ambient Glow */}
            <div className="absolute top-[-20%] left-[20%] right-[20%] h-[500px] bg-primary/20 blur-[120px] rounded-full mix-blend-screen opacity-20" />
            <div className="absolute bottom-[-20%] left-[10%] h-[400px] w-[400px] bg-accent/10 blur-[100px] rounded-full mix-blend-screen opacity-20" />
        </div>
    );
}
