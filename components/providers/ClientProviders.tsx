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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// Pages without sidebar
const NO_SIDEBAR_PATHS = ["/login", "/signup"];

export function ClientProviders({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const showSidebar = !NO_SIDEBAR_PATHS.includes(pathname);
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                retry: 1,
            },
        },
    }));

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
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
            </QueryClientProvider>
        </ErrorBoundary>
    );
}
