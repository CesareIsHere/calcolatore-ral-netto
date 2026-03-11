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
  description: "A simple tool to calculate net salary from gross salary in Italy, accounting for IRPEF taxes, social security contributions, and meal vouchers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950`}
      >
        <main className="flex-1">{children}</main>
        <footer className="py-6 text-center text-xs text-zinc-400 dark:text-zinc-600 space-y-2">
          <p>Ultimo aggiornamento: 11 marzo 2026</p>
          <p>
            Fonti:{" "}
            <a
              href="https://www.normattiva.it/atto/caricaDettaglioAtto?atto.dataPubblicazioneGazzetta=2025-12-30&atto.codiceRedazionale=25G00212&atto.articolo.numero=0&atto.articolo.sottoArticolo=1&atto.articolo.sottoArticolo1=0&qId=72c221d4-b312-4a5e-94c3-70d6212dd759&tabID=0.9587533112297261&title=lbl.dettaglioAtto&generaTabId=true"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-500 dark:hover:text-zinc-400"
            >
              L. 30 dicembre 2025, n. 199
            </a>
            {" · "}
            <a
              href="https://www.normattiva.it/atto/caricaDettaglioAtto?atto.dataPubblicazioneGazzetta=1986-12-31&atto.codiceRedazionale=086U0917&atto.articolo.numero=0&atto.articolo.sottoArticolo=1&atto.articolo.sottoArticolo1=0&qId=0ea2fa30-61e7-4185-b886-e57490d0687b&tabID=0.8612997169888713&title=lbl.dettaglioAtto"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-500 dark:hover:text-zinc-400"
            >
              TUIR (D.P.R. 917/1986)
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
