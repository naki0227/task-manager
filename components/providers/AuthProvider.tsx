"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

interface User {
    id: number;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// Pages that don't require authentication
const PUBLIC_PATHS = ["/login", "/signup", "/offline"];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // Check for stored auth on mount
        const storedToken = localStorage.getItem("vision-token");
        const storedUser = localStorage.getItem("vision-user");

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user");
                localStorage.removeItem("vision-token");
                localStorage.removeItem("vision-user");
            }
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Redirect to login if not authenticated and not on public page
        if (!isLoading && !token && !PUBLIC_PATHS.includes(pathname)) {
            router.push("/login");
        }
    }, [isLoading, token, pathname, router]);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem("vision-token", newToken);
        localStorage.setItem("vision-user", JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("vision-token");
        localStorage.removeItem("vision-user");
        router.push("/login");
    };

    // Show nothing while checking auth (prevents flash)
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Show login/signup pages without auth check
    if (PUBLIC_PATHS.includes(pathname)) {
        return (
            <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
                {children}
            </AuthContext.Provider>
        );
    }

    // Require auth for protected pages
    if (!token) {
        return null; // Will redirect in useEffect
    }

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
