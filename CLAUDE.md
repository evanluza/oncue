# OnCue — Audio Annotation App

## Project Overview
OnCue is an audio annotation web app. Users upload .mp3/.wav files, annotate them with timestamped text notes and quick macros, then share a link for collaborators to view and add their own notes.

**Target users:** Musicians collaborating on tracks, music teachers/students, podcasters/editors.

**Collaboration model:** Async — one person uploads and shares, others view + comment. Not real-time.

## Tech Stack
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui (new-york style)
- **Backend:** Supabase (Postgres + Storage)
- **Package manager:** pnpm
- **Hosting:** Vercel + GitHub (evanluza/oncue)
- **Theme:** Dark-first, studio-grade. OKLch color space. Accent: orange `oklch(0.68 0.18 45)`

## Routes
- `/` — Landing page (server component, static)
- `/annotate` — Annotation workspace (client component, static)
- `/share/[id]` — Shared project view (client component, dynamic)

## Key Directories
- `app/` — Next.js App Router pages
- `components/` — App components + `ui/` (shadcn)
- `lib/types.ts` — Shared types (Note, MacroType)
- `lib/db.ts` — Supabase CRUD operations (projects, annotations)
- `lib/supabase.ts` — Supabase client (lazy-initialized, safe at build time)
- `lib/contributor.ts` — Contributor identity (name + color, localStorage)
- `lib/utils.ts` — cn() utility
- `public/` — Logo assets (oc-icon-orange.png, oc-icon.png, oc-dual.png, oc-orange.png)

## Database (Supabase)
- **projects** — id, name, audio_url, created_by, creator_color, created_at
- **annotations** — id, project_id, timestamp, text, type, contributor_name, contributor_color, created_at
- **Storage bucket:** `audio` (public, for uploaded audio files)
- Schema defined in `supabase-schema.sql`

## Macros (7 total, text-only — no voice recording)
highlight, issue, note, too-loud, too-quiet, adjust-levels, idea

## Build & Run
```bash
npx pnpm install
npx pnpm dev --port 3002
npx pnpm build
```

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

## Design Principles
- Audio-native — should feel like a DAW, not a generic web app
- Speed over features — musicians mid-session won't wait
- Opinionated defaults — lean into the macro bar, don't over-configure
- Dark-first — studio tool aesthetic
- Text-only annotations for v1 — no voice recording to keep storage lean
