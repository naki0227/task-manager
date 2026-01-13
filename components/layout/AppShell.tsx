import { Sidebar } from "./Sidebar";

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 pl-16 transition-all duration-300">
                <header className="sticky top-0 z-30 flex h-16 items-center border-b border-white/10 bg-background/50 backdrop-blur-md px-6">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-mono text-muted-foreground">SYSTEM_READY</span>
                        <span className="mx-2 text-white/20">|</span>
                        <span className="text-xs font-mono text-primary">v2.5.0-ALPHA</span>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                        {/* Future HUD elements */}
                        <div className="font-mono text-xs text-muted-foreground">
                            CPU: 12% | MEM: 4.2GB
                        </div>
                    </div>
                </header>
                <main className="container mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </main>
            </div>
        </div>
    );
}
