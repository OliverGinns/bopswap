import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import OfferEngine from "@/components/OfferEngine";
import "./globals.css";

const heading = Fredoka({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BopSwap — Swap it. Wear it. Same day.",
  description: "Student-to-student clothes swaps in Oxford, with same-day in-person handover.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <OfferEngine />
      </body>
    </html>
  );
}
