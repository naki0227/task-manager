"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";

interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
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

        const userMessage: Message = {
            id: Date.now(),
            role: "user",
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        // Simulate AI response (in real implementation, this would call Python backend)
        setTimeout(() => {
            const responses: Record<string, string> = {
                "今日のタスク": "今日のタスクは3件あります：\n\n1. ✅ Vision Frontend の実装\n2. 📅 チームMTGの準備（14:00〜）\n3. 📝 ドキュメント作成\n\nどれから始めますか？",
                "タスク": "了解しました！新しいタスクを追加します。\n\nタスク名を教えてください。",
                "集中": "集中モードを開始しますか？\n\n25分の集中セッションを開始します。準備ができたら「開始」と言ってください。",
                default: "承知しました！他に何かお手伝いできることはありますか？\n\nヒント：「今日のタスク」「スキルを見せて」「統計を表示」などと話しかけてみてください。",
            };

            const matchedKey = Object.keys(responses).find((key) => userMessage.content.includes(key));
            const responseContent = responses[matchedKey || "default"];

            const assistantMessage: Message = {
                id: Date.now(),
                role: "assistant",
                content: responseContent,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setIsLoading(false);
        }, 1000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
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
                            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        </div>
                        {message.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-accent" />
                            </div>
                        )}
                    </motion.div>
                ))}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div className="bg-muted p-4 rounded-2xl rounded-bl-md">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}

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
