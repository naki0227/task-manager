"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Camera, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ProfileData {
    id: number;
    email: string;
    name: string;
    avatar_url: string;
    bio: string;
}

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (profile: ProfileData) => void;
}

export function ProfileEditModal({ isOpen, onClose, onUpdate }: ProfileEditModalProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<ProfileData>({
        id: 0,
        email: "",
        name: "",
        avatar_url: "",
        bio: "",
    });

    useEffect(() => {
        if (isOpen) {
            fetchProfile();
        }
    }, [isOpen]);

    const fetchProfile = async () => {
        const token = localStorage.getItem("vision-token");
        if (!token) {
            showToast("error", "ログインが必要です");
            onClose();
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("プロフィールの取得に失敗しました");

            const data = await response.json();
            setProfile(data);
        } catch (error) {
            showToast("error", "プロフィールの取得に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const token = localStorage.getItem("vision-token");
        if (!token) return;

        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/api/users/me`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: profile.name,
                    avatar_url: profile.avatar_url,
                    bio: profile.bio,
                }),
            });

            if (!response.ok) throw new Error("保存に失敗しました");

            const updated = await response.json();
            showToast("success", "プロフィールを更新しました");
            onUpdate(updated);
            onClose();
        } catch (error) {
            showToast("error", "保存に失敗しました");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                    >
                        <div className="card">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">プロフィール編集</h2>
                                <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Avatar */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                                            {profile.name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={profile.avatar_url}
                                                onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                                                placeholder="アバターURL（オプション）"
                                                className="w-full px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">
                                            <User className="w-4 h-4 inline mr-1" />
                                            名前
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.name}
                                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                            placeholder="表示名"
                                            className="w-full px-4 py-3 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>

                                    {/* Email (readonly) */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">
                                            <Mail className="w-4 h-4 inline mr-1" />
                                            メールアドレス
                                        </label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            className="w-full px-4 py-3 bg-muted/50 rounded-lg text-muted-foreground cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Bio */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">自己紹介</label>
                                        <textarea
                                            value={profile.bio}
                                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                            placeholder="自己紹介を入力..."
                                            rows={3}
                                            className="w-full px-4 py-3 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                        />
                                    </div>

                                    {/* Save Button */}
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        {saving ? "保存中..." : "保存"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
