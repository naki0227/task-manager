"use client";

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center p-8">
                <div className="text-6xl mb-4">📡</div>
                <h1 className="text-2xl font-bold mb-2">オフラインです</h1>
                <p className="text-muted-foreground mb-4">
                    インターネット接続を確認してください
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90"
                >
                    再読み込み
                </button>
            </div>
        </div>
    );
}
