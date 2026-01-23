"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { visionAPI } from "@/lib/api";

interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    isTyping?: boolean;
}

const WELCOME_MESSAGE: Message = {
    id: 0,
    role: "assistant",
    content: "こんにちは！Vision AI アシスタントです。\n\n何かお手伝いできることはありますか？例えば：\n- 「今日のタスクを教えて」\n- 「新しいタスクを追加して」\n- 「集中モードを開始して」",
    timestamp: new Date(),
};

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const timestamp = new Date();
        const userMessage: Message = {
            id: Date.now(),
            role: "user",
            content: input.trim(),
            timestamp,
        };

        const tempAiId = Date.now() + 1;
        const tempAiMessage: Message = {
            id: tempAiId,
            role: "assistant",
            content: "",
            timestamp,
            isTyping: true,
        };

        // Optimistic UI: Add user message AND placeholder AI message immediately
        setMessages((prev) => [...prev, userMessage, tempAiMessage]);
        setInput("");
        setIsLoading(true);

        // Call API
        try {
            const response = await visionAPI.chatWithAI(input.trim());

            // Replace placeholder with real response
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === tempAiId
                        ? { ...msg, content: response, isTyping: false }
                        : msg
                )
            );
        } catch (e) {
            console.error(e);
            // Error handling: Remove the placeholder and show error
            setMessages((prev) => prev.filter(msg => msg.id !== tempAiId));
            alert("AIからの応答に失敗しました。");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            // @ts-ignore - nativeEvent types related to IME
            if (e.nativeEvent.isComposing) return;
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="max-w-3xl h-[calc(100vh-8rem)] flex flex-col">
            {/* Header */}
            <header className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-sm text-primary font-medium">AI アシスタント</span>
                </div>
                <h1 className="text-3xl font-bold">Chat</h1>
                <p className="text-muted-foreground mt-1">Vision と対話して操作</p>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {messages.map((message) => (
                    <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                    >
                        {message.role === "assistant" && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-primary" />
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] p-4 rounded-2xl ${message.role === "user"
                                ? "bg-primary text-white rounded-br-md"
                                : "bg-muted rounded-bl-md"
                                }`}
                        >
                            {message.isTyping ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground animate-pulse">Thinking...</span>
                                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div>
                                    {/* Check if content is a JSON proposal */}
                                    {(() => {
                                        try {
                                            const json = JSON.parse(message.content);
                                            if (json.type === "proposal") {
                                                return (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2 text-amber-500 font-medium pb-2 border-b border-amber-500/20">
                                                            <Sparkles className="w-4 h-4" />
                                                            <span>Action Required</span>
                                                        </div>
                                                        <p className="text-sm font-medium">{json.message}</p>
                                                        <div className="bg-background/50 p-2 rounded text-xs font-mono mb-2">
                                                            {json.tool}({JSON.stringify(json.args)})
                                                        </div>
                                                        <div className="flex gap-2 pt-1">
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        setMessages(prev => [...prev, {
                                                                            id: Date.now(),
                                                                            role: "user",
                                                                            content: "Approved: " + json.tool,
                                                                            timestamp: new Date()
                                                                        }]);

                                                                        const res = await visionAPI.confirmTool(json.tool, json.args);

                                                                        setMessages(prev => [...prev, {
                                                                            id: Date.now() + 1,
                                                                            role: "assistant",
                                                                            content: "✅ Executed: " + JSON.stringify(res.result),
                                                                            timestamp: new Date()
                                                                        }]);
                                                                    } catch (e) {
                                                                        alert("Execution failed");
                                                                    }
                                                                }}
                                                                className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setMessages(prev => [...prev, {
                                                                        id: Date.now(),
                                                                        role: "user",
                                                                        content: "Rejected: " + json.tool,
                                                                        timestamp: new Date()
                                                                    }, {
                                                                        id: Date.now() + 1,
                                                                        role: "assistant",
                                                                        content: "Action cancelled.",
                                                                        timestamp: new Date()
                                                                    }]);
                                                                }}
                                                                className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        } catch (e) {
                                            // Not JSON, render as text
                                        }
                                        return <p className="whitespace-pre-wrap text-sm">{message.content}</p>;
                                    })()}
                                </div>
                            )}
                        </div>
                        {message.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-accent" />
                            </div>
                        )}
                    </motion.div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="card flex items-center gap-3 p-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="メッセージを入力..."
                    className="flex-1 bg-transparent focus:outline-none"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
