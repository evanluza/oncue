"use client"

import Link from "next/link"
import { Upload } from "lucide-react"

/**
 * The end of the share page used to be a dead end — the only way out was the
 * logo. This is the loop: everyone who receives a link is someone who works
 * with audio and now knows what the tool does.
 */
export function ShareCta() {
  return (
    <div className="border-t border-border/50 bg-card/30 px-4 py-10 sm:py-12">
      <div className="mx-auto max-w-md text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Upload className="h-5 w-5 text-accent" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-foreground">Got a track of your own?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Drop in an mp3 or wav, mark it up, and send the link. No sign-up.
          </p>
        </div>
        <Link
          href="/annotate"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Upload className="h-4 w-4" />
          Start annotating
        </Link>
      </div>
    </div>
  )
}
