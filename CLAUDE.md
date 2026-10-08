# OnCue — Audio Annotation App

**Domain:** oncue.audio

## Project Overview
OnCue is an audio annotation web app. Users upload .mp3/.wav/.m4a files, annotate them with timestamped text notes and quick macros, then share a link for collaborators to view and add their own notes.

**Target users:** Anyone giving feedback on a recording — language/pronunciation tutors, music teachers, producers, podcasters.

**Positioning (Sep 2026):** one-way feedback, not collaboration. Production data showed 53 of 61 tracks had notes from the uploader only, and not one recipient ever became a creator — so the site sells "mark up a recording and send one link", while recipients keep the ability to reply. Don't re-introduce collaboration-first copy.

## Tech Stack
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui (new-york style)
- **Backend:** Supabase (Postgres + Storage)
- **Package manager:** pnpm
- **Hosting:** Vercel + GitHub (evanluza/oncue)
- **Theme:** Dark-first, studio-grade. OKLch color space. Accent: orange `oklch(0.68 0.18 45)`

## Routes
- `/` — Landing page (server component, static)
- `/for/language-teachers`, `/for/pronunciation-feedback`, `/for/music-teachers`, `/for/music-feedback` — hand-written SEO landing pages, linked from the homepage use-case grid and listed in `app/sitemap.ts`
- `/annotate` — Annotation workspace (client component, static)
- `/share/[id]` — Shared project view (client component, dynamic, has own OG meta)

## Key Directories
- `app/` — Next.js App Router pages
- `components/` — App components + `ui/` (shadcn)
- `lib/types.ts` — Shared types (Note, MacroType)
- `lib/db.ts` — Supabase CRUD operations (projects, annotations)
- `lib/supabase.ts` — Supabase client (lazy-initialized, safe at build time)
- `lib/contributor.ts` — Contributor identity (name + color, localStorage). `ensureContributor()` always returns someone — unnamed visitors get a Guest identity so nobody is ever gated on a name form.
- `lib/my-projects.ts` — Creator's own shared projects (localStorage). Without accounts this is the only route back to a track's feedback.
- `lib/analytics.ts` — `ev()` wrapper over Vercel Analytics `track()`, with the full event catalogue and the loop diagram. **`ev()` waits for the SDK before sending:** React runs child effects before the root `<Analytics>`, so mount-time events (notably `share_link_opened`) used to be dropped silently. Don't "simplify" that back to a bare `track()` call.
- `lib/identity.ts` — the anonymous creator record in localStorage (random id, upload count, last upload/visit, use case). Powers `creator_returned` and `repeat_upload`. Not a fingerprint; repeat counts are a floor.
- `lib/referral.ts` — carries "came from a share link" across the hop to `/annotate` (sessionStorage + `?ref=share`). Analytics props only; never written to the database.
- `components/landing-shell.tsx` — chrome for the hand-written `/for/*` SEO pages. Four pages only; do not generate more programmatically.
- `components/post-share-prompts.tsx` — email capture then the use-case question, shown only after a share link exists. Both skippable, asked once per browser.
- `components/feedback-button.tsx` — "Have feedback?" → textarea + optional email → `product_feedback`.
- `lib/site.ts` — the canonical origin (`www.oncue.audio`) used by metadata, `app/sitemap.ts` and `app/robots.ts`. Share pages are `noindex`.
- `lib/utils.ts` — cn() utility
- `hooks/use-keyboard-controls.ts` — Spacebar play/pause, arrow key skip
- `public/` — Logo assets + oncue-og.png (OG image)

## Database (Supabase)
- **projects** — id, name, audio_url, created_by, creator_color, created_at
- **annotations** — id, project_id, timestamp, text, type, contributor_name, contributor_color, created_at
- **email_captures / use_case_responses / product_feedback** — research tables, **insert-only**: no select policy, because the browser anon key is public and these hold email addresses. Read them in the Supabase dashboard.
- **Storage bucket:** `audio` (public, for uploaded audio files)
- Schema defined in `supabase-schema.sql`

## Macros (3 offered, text-only — no voice recording)
The bar offers **note, highlight (Fire), idea**. Trimmed from seven in Aug 2026:
across 538 production annotations these three were 99.6% of all use, while
too-loud and too-quiet had never been pressed once.

`MacroType` still carries the retired values (`issue`, `too-loud`, `too-quiet`,
`adjust-levels`) so existing annotations keep rendering — don't remove them from
the type or from `macroLabels`.

## Features
- Real waveform rendering from audio data (Web Audio API decodeAudioData)
- Spacebar play/pause, arrow key skip (±5s)
- Drag-and-drop file upload with 25MB size limit + file type validation
- Contributor identity is optional — visitors annotate as Guest and are asked to name themselves only *after* their first note (skippable)
- Share page ends in a "Got a track of your own?" CTA — every recipient is a potential uploader
- Share links carry per-project OG meta ("<name> wants feedback on <track>"), generated server-side in `app/share/[id]/layout.tsx`
- Creators see "Your shared tracks" on the upload screen
- Share button uploads audio to Supabase, copies share link
- OG image (oncue-og.png) + social meta tags for rich link previews (summary_large_image)
- Mobile-optimized: responsive waveform, touch-to-seek, bottom-docked macro bar, iOS safe areas

## Limits
- **File size:** 25MB max per upload (validated client-side with clear error message)
- **File types:** .mp3, .wav, .m4a/.aac (MIME or extension match — browsers disagree on m4a). Rejections fire `upload_rejected`.
- **No auth yet** — contributor identity is name + color via localStorage, and naming is optional
- **No per-user upload limits yet** — planned for post-MVP (track via upload_logs table)

## Parked work
- **`/demo` page** lives on the `demo-page` branch, not on main. It's complete and verified (sample track + six timestamped notes, local-only, indexable, linked from the homepage/landing pages/upload screen) but the sample audio is synthesised speech and sounds it. Restore by merging the branch once a real human recording replaces `public/demo-track.m4a` — and re-measure the six note timestamps against the new audio.

## Build & Run
```bash
npx pnpm install
npx pnpm dev --port 3002
npx pnpm build
```

## Environment Variables
```
NEXT_PUBLIC_EMAIL_DELIVERY=on   # only once transactional email actually exists; flips the capture copy from "Save my email" to "Send me the link"
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_SITE_URL=https://www.oncue.audio  # optional, defaults to www (the host Vercel serves; apex 307s to it)
```

## Design Principles
- Audio-native — should feel like a DAW, not a generic web app
- Speed over features — musicians mid-session won't wait
- Opinionated defaults — lean into the macro bar, but keep it small; usage data killed four of the original seven macros
- Dark-first — studio tool aesthetic
- Text-only annotations for v1 — no voice recording to keep storage lean
- Every shared link is a new user — the share flow is the growth engine, so nothing may block a recipient before they hear audio
