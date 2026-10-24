import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FeedbackButton } from "@/components/feedback-button"

export const metadata: Metadata = {
  title: "What's new",
  description:
    "Recent changes to OnCue — longer notes, downloadable feedback, faster share pages, and how long a link stays live.",
  alternates: { canonical: "/updates" },
}

/**
 * A short, dated list of changes people can actually notice.
 *
 * Deliberately not a dev changelog: no migrations, no refactors, and nothing
 * about security work. Describing a hole that is now closed only tells readers
 * it was once open, which is a poor trade on a tool strangers are asked to
 * upload audio to. The job of this page is to show the thing is maintained —
 * which matters more than usual here, because there are no accounts to fall
 * back on.
 *
 * Add entries in product language, newest first, and only when a user would
 * see a difference.
 */

type Update = {
  date: string
  displayDate: string
  title: string
  body: string
}

const UPDATES: Update[] = [
  {
    date: "2026-10-24",
    displayDate: "24 October 2026",
    title: "Take your notes with you",
    body:
      "Every shared track can now be exported — copy the notes as plain text, download a .txt, or grab a marker CSV that drops straight onto a Reaper timeline. Each line carries its timestamp, so the feedback still makes sense away from OnCue.",
  },
  {
    date: "2026-10-24",
    displayDate: "24 October 2026",
    title: "How long a link stays live",
    body:
      "A share link keeps its audio for 30 days after the last note, and every new note restarts the clock — so a track stays up for as long as people are still working on it. The notes themselves are kept, and you can download them any time. OnCue isn't a backup, so keep your own copy of the file.",
  },
  {
    date: "2026-10-24",
    displayDate: "24 October 2026",
    title: "Share pages load faster",
    body:
      "The waveform is now drawn from data saved when the track is uploaded, so opening a share link no longer downloads the audio twice before you can see anything. Noticeably quicker on a phone and on slow connections.",
  },
  {
    date: "2026-10-21",
    displayDate: "21 October 2026",
    title: "Longer notes",
    body:
      "Notes can be up to 500 characters, instead of 120. The box grows as you type, and the timeline shows the first line with the full note a click away — so a longer explanation doesn't push everything else off the screen.",
  },
  {
    date: "2026-08-24",
    displayDate: "24 August 2026",
    title: "No name needed to leave feedback",
    body:
      "Opening a shared link used to ask who you were before you could hear anything. Now the track plays straight away, and you're only asked for a name after your first note — which you can skip.",
  },
]

export default function UpdatesPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/oc-icon-orange.png" alt="OnCue" width={22} height={22} />
            <span className="text-sm font-semibold tracking-tight text-foreground">oncue</span>
          </Link>
          <Link
            href="/annotate"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Start annotating
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <p className="text-[11px] uppercase tracking-widest text-accent">What&apos;s new</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Recent changes to OnCue
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          The changes worth knowing about, newest first. If something here doesn&apos;t work the way
          you expect, tell me — it&apos;s a short list because it&apos;s a small tool.
        </p>

        <ol className="mt-10 space-y-8 border-l border-border/50 pl-5 sm:pl-6">
          {UPDATES.map((update, i) => (
            <li key={`${update.date}-${i}`} className="relative">
              <span
                aria-hidden
                className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-accent/70 sm:-left-[29px]"
              />
              <time
                dateTime={update.date}
                className="font-mono text-[11px] text-muted-foreground/60"
              >
                {update.displayDate}
              </time>
              <h2 className="mt-1 text-base font-medium text-foreground">{update.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{update.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-14 rounded-xl border border-border/50 bg-card/30 p-6">
          <h2 className="text-base font-semibold text-foreground">Got a track to mark up?</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Drop in an mp3, wav or m4a, pin your notes to the exact moments, and send one link back.
            No sign-up.
          </p>
          <Link
            href="/annotate"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Start annotating
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 text-xs text-muted-foreground/60">
          <FeedbackButton />
          <span aria-hidden>·</span>
          <a
            href="https://www.elulabs.com/#contact"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-accent"
          >
            Built by ELU LABS
          </a>
        </div>
      </footer>
    </div>
  )
}
