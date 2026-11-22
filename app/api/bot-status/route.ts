import { resolveMode, resolveProvider } from "@/lib/botMode";

// Config check for the browser. Never returns keys, only whether one is present.
export async function GET() {
  const provider = resolveProvider();
  return Response.json({
    mode: resolveMode(),
    provider,
    hasKey: provider === "groq" ? !!process.env.GROQ_API_KEY : provider === "anthropic" ? !!process.env.ANTHROPIC_API_KEY : false,
  });
}
