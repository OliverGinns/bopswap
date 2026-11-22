import { Suspense } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import ListingDetail from "@/components/ListingDetail";
import UserListingLoader from "@/components/UserListingLoader";
import { ALL_LISTINGS, getListing } from "@/lib/seed";

export const instant = false;

export function generateStaticParams() {
  return ALL_LISTINGS.map((l) => ({ id: l.id }));
}

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <Link href="/" className="text-sm text-stone hover:text-forest">
          ← Back to listings
        </Link>
        <Suspense fallback={<p className="mt-10 text-center text-stone">Loading…</p>}>
          <Body params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function Body({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seeded = getListing(id);
  // Seeded items render on the server. Anything else is a user upload (Supabase or localStorage), resolved in the browser.
  return seeded ? <ListingDetail listing={seeded} /> : <UserListingLoader id={id} />;
}
