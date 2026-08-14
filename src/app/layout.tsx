import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Flow — Avalanche Contract Builder",
  description:
    "Build, audit, and preview Avalanche smart contracts with a visual node editor.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--bg-void)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
