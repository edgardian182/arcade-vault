# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault (README.md) — a Spanish-language retro arcade platform where users browse games, play them, and compete on score leaderboards.

The `app/` directory is still the unmodified `create-next-app` scaffold (default Tailwind starter page). The actual product design lives as a static, non-Next.js HTML/JSX prototype in `resources/templates/` (untracked, not wired into the Next.js app). Treat it as the UX/behavior spec, not as code to copy verbatim:

- `Arcade Vault.html` — loads React/ReactDOM/Babel from CDN `<script>` tags and the `.jsx` files below in dependency order (`data.jsx` → `nav.jsx` → screen components → `app.jsx`). This is a client-only prototyping shell; it has no relation to Next.js's build or module system.
- `data.jsx` — mock `GAMES` catalog (id, title, category, cover, color, best score, plays).
- `app.jsx` — root component: hash-based routing (`route` state synced to `location.hash`) and `user`/scores persisted to `localStorage` (`av_user`, `av_scores`).
- `nav.jsx`, `biblioteca.jsx` (library/catalog), `detalle.jsx` (game detail), `reproductor.jsx` (game player), `auth.jsx` (login/signup), `salon.jsx` (hall of fame / leaderboard) — one file per screen, matching the `route.name` values dispatched in `app.jsx`.
- `styles.css` — retro/neon visual language (arcade fonts: Press Start 2P, JetBrains Mono).

When implementing real pages under `app/`, reimplement this behavior idiomatically for the App Router (Server Components, real routes/segments, proper data fetching) rather than porting the hash-router/localStorage/global-React patterns as-is.

There is no test runner configured in this repo.

## Skills

Always use /frontend-design to design user interfaces

## Architecture notes

- **Next.js 16.3.0 / React 19.2 — read the docs before writing framework code.** This version is newer than most training data and has real breaking changes from Next.js 15. Per `AGENTS.md`, consult `node_modules/next/dist/docs/` before touching routing, caching, images, or middleware. Notable changes that matter for this repo:
  - `middleware.ts` is renamed `proxy.ts` (export `proxy`, not `middleware`); the `edge` runtime is not supported there.
  - `cookies()`, `headers()`, `draftMode()`, and `params`/`searchParams` in pages/layouts/routes are async-only now (no sync fallback).
  - `revalidateTag(tag)` now requires a second `cacheLife` profile argument; use `updateTag` for read-your-writes semantics.
  - Partial Prerendering is gone; caching/prerendering is opted into via the `cacheComponents` config flag instead.
  - `next lint` was removed — use the `lint` script (plain ESLint CLI) shown above.
- Path alias `@/*` resolves to the repo root (`tsconfig.json`).
- Styling is Tailwind v4 via `@tailwindcss/postcss` (no `tailwind.config.*`). `app/globals.css` defines theme tokens with the v4 `@theme inline` block and light/dark values via `prefers-color-scheme`.
- README references a "Spec Driven Design" workflow using `/spec` and `/spec-impl` commands from `Klerith/fernando-skills` (`npx skills@latest add Klerith/fernando-skills`). These commands are not currently installed in `.claude/` — if the user invokes `/spec` or `/spec-impl` and they're unavailable, point them at that install command.
