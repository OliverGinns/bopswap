import type { Metadata } from "next";
import { Suspense } from "react";
import { themeById } from "@/lib/directions";
import Header from "@/components/Header";
import PlanClient from "@/components/plan/PlanClient";

export const metadata: Metadata = {
  title: "Plan your outfit | BopSwap",
  description: "Tell BopBot your event, pick a look, then shop the pieces within walking distance.",
};

type Search = Promise<{ q?: string | string[]; theme?: string | string[] }>;

/** Reads ?q= (set by the home prompt) to prefill the chat box. Suspended so the page shell still prerenders. */
async function Prefilled({ searchParams }: { searchParams: Search }) {
  const { q, theme } = await searchParams;
  const initial = (Array.isArray(q) ? q[0] : q)?.slice(0, 200) ?? "";
  return <PlanClient initialInput={initial} themeId={themeById(Array.isArray(theme) ? theme[0] : theme)?.id} />;
}

export default function PlanPage({ searchParams }: { searchParams: Search }) {
  return (
    <div className="flex h-dvh flex-col">
      <Header />
      <main className="min-h-0 flex-1">
        <Suspense fallback={<PlanClient />}>
          <Prefilled searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
