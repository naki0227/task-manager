"use client";

import { useEffect, useState } from "react";
import { visionAPI, ContextSnapshot } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { Plus, Monitor, Play, Trash2, Chrome, Loader2, Save, Terminal, AlertTriangle } from "lucide-react";

export default function SnapshotsPage() {
    const { token } = useAuth();
    const [snapshots, setSnapshots] = useState<ContextSnapshot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCapturing, setIsCapturing] = useState(false);
    const [resumingId, setResumingId] = useState<number | null>(null);
    const [isCloud, setIsCloud] = useState(false);

    useEffect(() => {
        visionAPI.getSystemConfig().then(c => setIsCloud(c.is_cloud_env)).catch(() => { });
    }, []);

    const formatDate = (dateString: string) => {
        try {
            return new Intl.DateTimeFormat('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).format(new Date(dateString));
        } catch (e) {
            return dateString;
        }
    };

    const fetchSnapshots = async () => {
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const data = await visionAPI.getSnapshots();
            setSnapshots(data);
        } catch (e) {
            console.error("Failed to fetch snapshots", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSnapshots();
    }, [token]);

    const handleCapture = async () => {
        if (isCloud) return;

        const now = new Date();
        const defaultName = `Snapshot ${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const name = prompt("スナップショットの名前を入力してください:", defaultName);
        if (!name) return;

        setIsCapturing(true);
        try {
            await visionAPI.createSnapshot(name, "Handmade snapshot"); // Notes
            await fetchSnapshots();
        } catch (e) {
            console.error("Capture failed", e);
            alert("キャプチャに失敗しました");
        } finally {
            setIsCapturing(false);
        }
    };

    const handleResume = async (id: number) => {
        if (isCloud) return;

        setResumingId(id);
        try {
            await visionAPI.resumeSnapshot(id);
        } catch (e) {
            console.error("Resume failed", e);
            alert("再開に失敗しました");
        } finally {
            setResumingId(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("このスナップショットを削除しますか？")) return;
        try {
            await fetch(`/api/snapshots/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            await fetchSnapshots();
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Monitor className="w-5 h-5 text-primary" />
                        <span className="text-sm text-primary font-medium">Infinite Context Resume</span>
                    </div>
                    <h1 className="text-3xl font-bold">コンテキスト管理</h1>
                    <p className="text-muted-foreground mt-1">作業環境（ブラウザタブ、VS Code）の状態を保存・復元</p>
                </div>
                <button
                    onClick={handleCapture}
                    disabled={isCapturing || isCloud}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    コンテキストを保存
                </button>
            </header>

            {isCloud && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg mb-6 text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <p className="text-sm font-medium">クラウド版では作業環境の保存・復元機能は利用できません。デスクトップ版をご利用ください。</p>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {snapshots.map((snap) => (
                        <div key={snap.id} className="card group hover:shadow-lg transition-all relative overflow-hidden">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">{snap.name}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(snap.created_at || new Date().toISOString())}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(snap.id)}
                                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-3 mb-6">
                                {snap.windows && snap.windows.map((win, idx) => (
                                    <div key={idx} className="bg-muted/50 p-2 rounded text-sm">
                                        <div className="flex items-center gap-2 mb-1 font-medium text-foreground/80">
                                            {win.type === "browser" ? <Chrome className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
                                            <span>{win.name}</span>
                                        </div>
                                        {win.type === "browser" && (
                                            <div className="pl-6 text-xs text-muted-foreground line-clamp-2">
                                                {win.urls?.length} tabs open
                                            </div>
                                        )}
                                        {win.type === "code" && (
                                            <div className="pl-6 text-xs text-muted-foreground truncate">
                                                {win.path?.split('/').pop()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleResume(snap.id)}
                                disabled={resumingId === snap.id || isCloud}
                                className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-2 rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
                            >
                                {resumingId === snap.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                再開する
                            </button>
                        </div>
                    ))}

                    {snapshots.length === 0 && (
                        <div className="col-span-full text-center py-20 text-muted-foreground">
                            <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>保存されたコンテキストはありません</p>
                            <p className="text-sm mt-2">「コンテキストを保存」ボタンから作業環境を保存できます</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
