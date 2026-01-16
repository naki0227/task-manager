"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function PushNotificationButton() {
    const { showToast } = useToast();
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        setIsSupported("Notification" in window && "serviceWorker" in navigator);
        if ("Notification" in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!isSupported) {
            showToast("error", "このブラウザは通知に対応していません");
            return;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === "granted") {
                showToast("success", "通知を有効にしました");

                // Register service worker
                const registration = await navigator.serviceWorker.register("/sw.js");
                console.log("Service Worker registered:", registration);

                // Show test notification
                new Notification("Vision", {
                    body: "通知が有効になりました！",
                    icon: "/icon-192.png",
                });
            } else {
                showToast("info", "通知の許可が必要です");
            }
        } catch (error) {
            console.error("Notification error:", error);
            showToast("error", "通知の設定に失敗しました");
        }
    };

    if (!isSupported) return null;

    return (
        <button
            onClick={requestPermission}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${permission === "granted"
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "bg-primary text-white"
                }`}
        >
            {permission === "granted" ? (
                <>
                    <Bell className="w-4 h-4" />
                    通知ON
                </>
            ) : (
                <>
                    <BellOff className="w-4 h-4" />
                    通知を許可
                </>
            )}
        </button>
    );
}
