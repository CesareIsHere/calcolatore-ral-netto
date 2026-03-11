import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Calcolatore RAL -> Netto",
  description: "This is a simple tool to calculate the net salary from the gross salary in Italy, taking into account taxes, social security contributions, and meal vouchers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950`}
      >
        <main className="flex-1">{children}</main>
        <footer className="py-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
          Ultimo aggiornamento: 11 marzo 2026
        </footer>
      </body>
    </html>
  );
}
