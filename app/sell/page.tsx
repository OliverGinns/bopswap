import type { Metadata } from "next";
import Header from "@/components/Header";
import SellClient from "@/components/SellClient";

export const metadata: Metadata = {
  title: "Sell or swap | BopSwap",
  description: "List an item for a same-day swap with a student nearby.",
};

export default function SellPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-mist">
        <SellClient />
      </main>
    </>
  );
}
