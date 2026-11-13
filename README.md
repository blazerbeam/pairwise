# pairwise

Group prioritization by comparing two things at a time. Live at
[pairwise.one](https://pairwise.one). Anyone can sign up.

Ranking ten things on a whiteboard gets you a list nobody trusts. pairwise never asks
anyone to rank ten things. It asks them to pick between two, then two more. After
enough rounds the math produces a ranking, and a 2D plot shows which items are quick
wins and which are big bets.

## Where it came from

In 2015 I was a PM at Jama Software. My team spent two weeks building this idea,
then called Array. People who saw the prototype loved it, and it never shipped. The
build wasn't the hard part. Getting from "internal demo" to "deployed product" was:
auth, a real database, onboarding, deployment and support.

In 2026 I rebuilt it solo in about six hours across five evenings. The full story is
in [The wall that killed Array](https://jeremymyrland.com/writing/the-wall-that-killed-array).
The first 80% of the work is transformed by AI tooling. The last 20% is still judgment.

## What it does

- Create a session with a list of items and share it by link or QR code
- Pick two axes, each asked of a different group (Sales on revenue and Finance on
  risk, or Leadership on impact and the team on urgency), or start from scratch
- Participants vote on pairs, with no account needed to vote
- Results as a ranked list and a 2D plot of the two axes
- Sign-in and data storage on Supabase, with row-level security

## How it's built

- Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Supabase for the database and auth
- Recharts for the plot
- Hosted on Vercel
- Built with [v0](https://v0.app)

## Running it locally

```bash
pnpm install
pnpm dev
```

You'll need a Supabase project. Set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.

---

Built by [Jeremy Myrland](https://jeremymyrland.com).
