import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { KeyboardNavProvider } from "@/components/providers/KeyboardNavProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-jp",
});

export const metadata: Metadata = {
  title: "Vision - Autonomous Life OS",
  description: "AIが準備、あとは始めるだけ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vision",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3ea8ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.variable} ${notoSansJP.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <LocaleProvider>
            <ToastProvider>
              <KeyboardNavProvider>
                <div className="flex min-h-screen">
                  <Sidebar />
                  <main className="flex-1 lg:ml-[260px] p-4 lg:p-8 pt-16 lg:pt-8">
                    {children}
                  </main>
                  <CommandPalette />
                </div>
              </KeyboardNavProvider>
            </ToastProvider>
          </LocaleProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
