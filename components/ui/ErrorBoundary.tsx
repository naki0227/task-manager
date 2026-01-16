"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-destructive" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">エラーが発生しました</h2>
                    <p className="text-muted-foreground mb-4 max-w-md">
                        予期しないエラーが発生しました。ページをリロードするか、しばらく経ってからお試しください。
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        <RefreshCw className="w-4 h-4" />
                        ページをリロード
                    </button>
                    {process.env.NODE_ENV === "development" && this.state.error && (
                        <pre className="mt-4 p-4 bg-muted rounded-lg text-left text-xs overflow-auto max-w-full">
                            {this.state.error.message}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
