# BopSwap

Student-to-student clothes swap/trade web app — like Vinted, but local, with **in-person handover the same day (no delivery)**. Built for a hackathon; the deliverable is a short demo video + presentation.

Tagline: **Swap it. Wear it. Same day.**

## Rule #1: demo-first
**No feature that can crash on camera.** Polished, never breaks, no auth. Prefer seeded/static data and graceful fallbacks over anything that depends on the network, permissions or user input. If a feature is risky (maps, Supabase, geolocation), it must fail soft and never block the UI.

## Stack
- Next.js (App Router, TypeScript) + Tailwind CSS
- Supabase — to be added later
- react-leaflet + OpenStreetMap — to be added later
- Mobile-first, looks good on desktop

## Look
Dark navy background, hot pink + electric yellow accents, rounded cards, 🪩 logo, wordmark "BopSwap".

## Data
`lib/seed.ts` is the single, easy-to-edit source of truth: 30 local Oxford listings (~20 90s-themed, ~10 fancy dress) and 10 external listings (Vinted/Amazon/Facebook — plain text labels, no real logos, no location). Default user location is St Anne's College.

## Business assumptions
BopSwap takes a 5% fee (an assumption, labelled as such in the UI). Express handover (within the hour) is +£0.50.

## Commands
- `npm run dev` — dev server
- `npm run build` — production build (run before demo)

## Notes
This Next.js version has breaking changes; check `node_modules/next/dist/docs/` before using unfamiliar APIs.
