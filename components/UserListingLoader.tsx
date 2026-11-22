"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Listing } from "@/lib/seed";
import { loadUserListing } from "@/lib/userListings";
import ListingDetail from "./ListingDetail";

/** Resolves a user-uploaded listing (localStorage first, then Supabase) in the browser. Never throws. */
export default function UserListingLoader({ id }: { id: string }) {
  const [state, setState] = useState<{ status: "loading" } | { status: "missing" } | { status: "ok"; listing: Listing }>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    loadUserListing(id).then((l) => alive && setState(l ? { status: "ok", listing: l } : { status: "missing" }));
    return () => {
      alive = false;
    };
  }, [id]);

  if (state.status === "ok") return <ListingDetail listing={state.listing} />;
  if (state.status === "loading") return <p className="mt-10 text-center text-stone">Loading…</p>;
  return (
    <div className="mt-10 rounded-3xl border-2 border-ink bg-cream shadow-pop p-10 text-center">
      <p className="text-4xl">🕺</p>
      <p className="mt-2 font-semibold">We can&apos;t find that listing. It may have been saved on another device.</p>
      <Link href="/" className="mt-4 inline-block rounded-full bg-mustard px-5 py-2 font-bold text-ink">
        Back to listings
      </Link>
    </div>
  );
}
