"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface User {
    id: number;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();

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
        window.location.href = "/login";
    };

    const updateUser = (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem("vision-user", JSON.stringify(updatedUser));
    };

    // Show loading spinner briefly
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isLoading,
            isAuthenticated: !!token,
            login,
            logout,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

