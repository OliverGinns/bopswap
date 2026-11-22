# BopSwap 🪩

**Swap it. Wear it. Same day.** Student-to-student and charity-shop clothes swapping with same-day, in-person handover, plus **BopBot**, an outfit planner for events.

**Live demo:** https://bopswap-chi.vercel.app/ · **2-min video:** [VIDEO_PLACEHOLDER]

## Try it in 60 seconds

1. **Home** → pick **College bop – 90s**.
2. Choose a look → **Find my pieces**.
3. Make an offer on a few items.
4. Open the **Basket** → confirm handovers.
5. Also poke around: **Wardrobe**, **Sell**, **Profile**.

## The problem

Buying second-hand online means parcels, waiting days, shipping costs and returns, which is a poor fit when you need an outfit for Friday's bop. Students end up buying cheap one-wear costumes, and good clothes sit unworn in wardrobes. Local charity shops hold plenty of suitable stock, but students rarely think to check it.

**Who it affects:** students who need event outfits fast and cheaply, and local charity shops that want more footfall for their stock.

## What it does

- **Outfit planner (BopBot):** say the event ("College bop, 90s theme") and get a few looks to choose from, then refine them in chat.
- **Wardrobe-aware matching:** looks are checked against what you already own, so you only look for the missing pieces.
- **Local map:** matching items are shown on a map with walking distance, so everything is collectable the same day.
- **Offers and swaps:** make an offer on an item, then confirm the handover from your basket.
- **Charity shops:** their stock appears alongside student listings.
- **Sell from your wardrobe:** list items you already own. With an API key, AI autofill can suggest the listing details from a photo.

## Business model and impact

- Free to list. Charity shops list free.
- A small fee on swaps and sales (**assumed 5%**, labelled as an assumption in the UI).
- Paid **express handover** (within the hour, +£0.50).
- **Impact:** parcels avoided (everything is handed over locally) and more clothes reused instead of bought new for one night.

## Run it locally (zero config)

```bash
git clone https://github.com/OliverGinns/bopswap.git
cd bopswap
npm install
npm run dev
```

Open <http://localhost:3000>.

With no keys set, BopBot runs in **scripted** mode and uploaded listings are saved in **localStorage**. To enable the optional extras, copy `env.example` to `.env.local`:

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Enables the optional live BopBot mode via Groq's OpenAI-compatible API (free key, see below). Server-side only. |
| `GROQ_MODEL` | Groq model to use (default `openai/gpt-oss-120b`). |
| `ANTHROPIC_API_KEY` | Enables live BopBot via Claude (`claude-haiku-5-5`) and AI photo autofill on Sell (autofill needs a vision model, so it is Anthropic-only). Server-side only. |
| `BOPBOT_PROVIDER` | `groq` or `anthropic`. Default: `groq` if `GROQ_API_KEY` is set, otherwise `anthropic` if `ANTHROPIC_API_KEY` is set. |
| `BOPBOT_MODE` | `live`, `scripted` or `auto` (default: live if a provider key is set, otherwise scripted). |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL, so listings are stored there instead of localStorage. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key. |

For Supabase, run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.

### Free live BopBot with Groq

1. Sign up at [console.groq.com](https://console.groq.com) and create an API key (no card needed).
2. Put it in `.env.local` as `GROQ_API_KEY=...` and restart `npm run dev`.

The free tier is **rate-limited**. If Groq returns a 429 (or any error, timeout or invalid JSON twice), BopBot silently falls back to the scripted bot, so the UI never breaks. Keys stay on the server and are never sent to the browser.

## What's real vs sample data

Being upfront:

- **Sample data:** the listings, the charity shops (**fictional names**, no real partnerships) and the external Vinted / Amazon / Facebook items are all seeded in [`lib/seed.ts`](lib/seed.ts).
- **Simulated:** offers and handovers are not sent to anyone. There is no sign-in.
- **Simple rules:** the refinement chat uses simple rules, not a model.
- **BopBot:** in this deployed prototype, BopBot's replies are **scripted** so the demo is repeatable. A live mode (Groq or Claude `claude-haiku-5-5`, with a scripted fallback) is built into the code and is enabled by setting `GROQ_API_KEY` or `ANTHROPIC_API_KEY`, but it was **not enabled or fully tested** for the hackathon demo.
- **Real:** the app itself, the planner and wardrobe matching flow, the map, and listing uploads (localStorage, or Supabase if configured).

## Tech and AI tools

Next.js (App Router, TypeScript), Tailwind CSS, Supabase, Leaflet + OpenStreetMap and Vercel. In the deployed prototype BopBot's replies are scripted so the demo is repeatable; an optional live mode (Groq or Claude `claude-haiku-5-5`, scripted fallback) is built in via `GROQ_API_KEY` or `ANTHROPIC_API_KEY` but was not enabled or fully tested for the hackathon demo. **Claude Code** was used to build the project. Built during the hackathon.

## Roadmap

- Real university-email sign-in and verification
- Safe public meetup spots for handovers
- Real charity-shop partnerships and stock feeds
- Partner APIs for external marketplaces
- Better ranking of matches
- Notifications
- College-by-college rollout

## Team

Team BopSwap: Ollie, Jamie, Melissa and Danny
