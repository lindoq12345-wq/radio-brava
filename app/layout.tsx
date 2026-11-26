import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Player from "@/components/Player";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "BRAVA — Rádio e TV",
  description: "Rádio online, canais oficiais, filmes e esportes da BRAVA em um só lugar.",
  applicationName: "BRAVA",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "BRAVA",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: o next-themes altera a classe do <html> antes da hidratação.
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeProvider>
          {children}
          <Player />
        </ThemeProvider>
      </body>
    </html>
  );
}
