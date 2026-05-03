import type { Metadata } from "next";
import { QueryProvider } from "@/components/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Million Mind — Powerball Statistics & Analytics",
  description:
    "Million Mind analyzes 1,800+ historical Powerball drawings via frequency, gap, Markov, and Monte Carlo methods — for entertainment and analytical exploration only. Powerball drawings are independent random events that cannot be predicted.",
  applicationName: "Million Mind",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
