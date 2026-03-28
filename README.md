# Capture

## Overview

- Capture is a web app where users can enter and capture blocks by clicking on them.

## Features

- Realtime updates, instantly change block ownership for all users.
- Mobile responsiveness, you can play smoothly using pc, mobile.
- A Leaderboard, where you can track your rank in realtime.

## Tech Stack

- Next.JS as a full-stack framework
- TailwindCSS + custom animation classes for styling.
- Supabase for auth, database and realtime features.

## Setup

1. Clone the project and install deps:
	- `npm install`
2. Create `.env.local` in the root and add:
	- `NEXT_PUBLIC_SUPABASE_URL=your_project_url`
	- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_or_anon_key`
3. Open Supabase SQL Editor and run `supabase-schema.sql` once.
4. Start dev server:
	- `npm run dev`
5. Open `http://localhost:3000` and create an account.

That is it, app should be ready locally.

## Deployment

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Add the same env vars in Vercel project settings:
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. In Supabase Auth settings, add your production domain to redirect URLs.
5. Deploy.

After deploy, test quickly:
- sign up / login
- capture + unclaim
- realtime updates on 2 tabs/devices

## Mobile Responsiveness

- the UI is well optimized for mobile and small devices, it also uses a pointer-based drag/pan.

## Known Limitations

- The project currently uses supabase's free plan, and is not currently optimized for large-scale traffic.

## Security

- Each API route currently requires user to be signed in using supabase auth, otherwise it will return a 401 error.
- RLS from Supabase is active, so users can only update rows they are allowed to. Even if someone sends manual requests, DB policies still block unauthorized updates.
- Cooldown is used to slow spam captures (currently 1 second between captures). It helps keep gameplay fair and makes bot-like rapid claiming much harder.

## Roadmap

- tighten capture conflicts using an atomic DB update/RPC (safer when many users click same block)
- add API rate limiting (per user/IP) to reduce spam and abuse
- improve observability: logs for capture/unclaim errors + simple admin metrics
- ship more gameplay stuff (events, power-ups, maybe team mode)
- optimize for scale (bigger board options, caching, and stress testing)
- improve onboarding UX (better first-time hints + quick tutorial)
