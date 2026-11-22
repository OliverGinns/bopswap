import type { Metadata } from "next";
import Header from "@/components/Header";
import ProfileClient from "@/components/ProfileClient";

export const metadata: Metadata = {
  title: "Your profile | BopSwap",
  description: "Your wardrobe, listings, offers and impact.",
};

export default function ProfilePage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-mist">
        <ProfileClient />
      </main>
    </>
  );
}
