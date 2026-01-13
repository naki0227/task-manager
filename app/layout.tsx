import type { Metadata } from "next";
import { SystemBackground } from "@/components/visuals/SystemBackground";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "VISION OS",
  description: "Autonomous Life OS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`antialiased bg-background text-foreground min-h-screen selection:bg-primary/20 selection:text-primary`}
      >
        <SystemBackground />
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
