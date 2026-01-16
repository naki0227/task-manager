const CACHE_NAME = "vision-v1";
const OFFLINE_URL = "/offline";

const STATIC_ASSETS = [
    "/",
    "/offline",
    "/manifest.json",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    if (event.request.url.includes("/api/")) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request)
                .then((response) => {
                    if (!response || response.status !== 200 || response.type !== "basic") {
                        return response;
                    }

                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                })
                .catch(() => {
                    if (event.request.mode === "navigate") {
                        return caches.match(OFFLINE_URL);
                    }
                    return new Response("Offline", { status: 503 });
                });
        })
    );
});

self.addEventListener("push", (event) => {
    const data = event.data?.json() || {};
    const title = data.title || "Vision";
    const options = {
        body: data.body || "新しい通知があります",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: data.tag || "default",
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.openWindow("/")
    );
});
