import type { Metadata } from "next";
import BasketClient from "@/components/BasketClient";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Your handover plan | BopSwap",
  description: "Your offers, your walking route and your same-day handovers in one place.",
};

export default function BasketPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-mist">
        <BasketClient />
      </main>
    </>
  );
}
