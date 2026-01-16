import { Navbar } from "./Navbar";

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="min-h-screen pb-20 flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto max-w-5xl px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {children}
            </main>

            <footer className="py-8 text-center text-xs font-mono text-muted-foreground">
                <p>VISION OS [BETA] // AUTOMATED LIFE ASSISTANT</p>
            </footer>
        </div>
    );
}
