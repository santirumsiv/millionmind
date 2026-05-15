import type { Metadata } from "next";
import { QueryProvider } from "@/components/QueryProvider";
import { AnalyticsInit } from "@/components/AnalyticsInit";
import { LegalGate } from "@/components/LegalGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Million Mind — Powerball & Mega Millions Statistics",
  description:
    "Million Mind analyzes 2,600+ historical Powerball and Mega Millions drawings via frequency, gap, Markov, and Monte Carlo methods — for entertainment and analytical exploration only. Lottery drawings are independent random events that cannot be predicted.",
  applicationName: "Million Mind",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense verification + ad delivery */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3042511402369114"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <QueryProvider>
          <AnalyticsInit />
          <LegalGate />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
