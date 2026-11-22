import { redirect } from "next/navigation";
import { Suspense } from "react";

type Search = Promise<{ q?: string | string[] }>;

async function Redirector({ searchParams }: { searchParams: Search }): Promise<null> {
  const { q } = await searchParams;
  const text = Array.isArray(q) ? q[0] : q;
  redirect(text ? `/plan?q=${encodeURIComponent(text.slice(0, 200))}` : "/plan");
  return null;
}

/** The old /costume split view now lives at /plan. Keeps ?q= so the home prompt still prefills the chat. */
export default function CostumePage({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={null}>
      <Redirector searchParams={searchParams} />
    </Suspense>
  );
}
