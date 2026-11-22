import type { Metadata } from "next";
import Header from "@/components/Header";
import WardrobeClient from "@/components/WardrobeClient";

export const metadata: Metadata = {
  title: "Your wardrobe | BopSwap",
  description: "What you already own, so BopSwap only suggests what you're missing.",
};

export default function WardrobePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <WardrobeClient />
      </main>
    </>
  );
}
