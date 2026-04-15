# OnCue — Audio Annotation App

## Project Overview
OnCue is an audio annotation web app. Users upload .mp3/.wav files, annotate them with timestamped notes, voice memos, and quick macros, then share a link for collaborators to view and add their own notes.

**Target users:** Musicians collaborating on tracks, music teachers/students, podcasters/editors.

**Collaboration model:** Async — one person uploads and shares, others view + comment. Not real-time.

## Tech Stack
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui (new-york style)
- **Package manager:** pnpm
- **Theme:** Dark-first, studio-grade. OKLch color space. Accent: orange `oklch(0.68 0.18 45)`

## Routes
- `/` — Landing page (server component)
- `/annotate` — Annotation workspace (client component)

## Key Directories
- `app/` — Next.js App Router pages
- `components/` — App components + `ui/` (shadcn)
- `lib/types.ts` — Shared types (Note, MacroType)
- `lib/utils.ts` — cn() utility
- `public/` — Logo assets (oc-icon-orange.png, oc-icon.png, oc-dual.png, oc-orange.png)

## Build & Run
```bash
npx pnpm install
npx pnpm dev --port 3002
npx pnpm build
```

## Design Principles
- Audio-native — should feel like a DAW, not a generic web app
- Speed over features — musicians mid-session won't wait
- Opinionated defaults — lean into the macro bar, don't over-configure
- Dark-first — studio tool aesthetic
