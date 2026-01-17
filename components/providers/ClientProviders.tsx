"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { KeyboardNavProvider } from "@/components/providers/KeyboardNavProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { DreamProvider } from "@/contexts/DreamContext";

// Pages without sidebar
const NO_SIDEBAR_PATHS = ["/login", "/signup"];

export function ClientProviders({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const showSidebar = !NO_SIDEBAR_PATHS.includes(pathname);

    return (
        <ErrorBoundary>
            <ThemeProvider>
                <LocaleProvider>
                    <ToastProvider>
                        <AuthProvider>
                            <DreamProvider>
                                <KeyboardNavProvider>
                                    {showSidebar ? (
                                        <div className="flex min-h-screen">
                                            <Sidebar />
                                            <main className="flex-1 lg:ml-[260px] p-4 lg:p-8 pt-16 lg:pt-8">
                                                {children}
                                            </main>
                                            <CommandPalette />
                                        </div>
                                    ) : (
                                        children
                                    )}
                                </KeyboardNavProvider>
                            </DreamProvider>
                        </AuthProvider>
                    </ToastProvider>
                </LocaleProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}
