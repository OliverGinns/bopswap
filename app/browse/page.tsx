import type { Metadata } from "next";
import BrowseClient from "@/components/BrowseClient";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Browse | BopSwap",
  description: "Every swap near you: filter, search, or flip to the map.",
};

export default function BrowsePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <BrowseClient />
      </main>
    </>
  );
}
