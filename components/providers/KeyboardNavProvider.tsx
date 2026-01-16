"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Keyboard shortcuts configuration
const SHORTCUTS: Record<string, string> = {
    "g+d": "/",           // Go to Dashboard
    "g+s": "/stats",      // Go to Stats
    "g+c": "/calendar",   // Go to Calendar
    "g+t": "/thinking",   // Go to Thinking
    "g+k": "/skills",     // Go to sKills
    "g+r": "/resume",     // Go to Resume
    "g+h": "/chat",       // Go to cHat
    "g+e": "/settings",   // Go to sEttings
};

export function useKeyboardNavigation() {
    const router = useRouter();

    useEffect(() => {
        let keySequence = "";
        let timeout: NodeJS.Timeout;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as HTMLElement).isContentEditable
            ) {
                return;
            }

            // Clear sequence after 1 second
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                keySequence = "";
            }, 1000);

            // Build key sequence
            keySequence += e.key.toLowerCase();

            // Check for matching shortcut
            for (const [keys, path] of Object.entries(SHORTCUTS)) {
                if (keySequence.endsWith(keys.replace("+", ""))) {
                    e.preventDefault();
                    router.push(path);
                    keySequence = "";
                    return;
                }
            }

            // Single key shortcuts
            if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
                // Show shortcuts help (handled by CommandPalette)
            }

            // Escape to close modals (handled by individual components)
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [router]);
}

export function KeyboardNavProvider({ children }: { children: React.ReactNode }) {
    useKeyboardNavigation();
    return <>{children}</>;
}
