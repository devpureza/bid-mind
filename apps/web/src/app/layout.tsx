import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "BidMind",
  description: "Plataforma de agentes de IA para licitações públicas",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
