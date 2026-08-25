"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/contributor"
import type { Contributor } from "@/lib/contributor"

type ContributorPromptProps = {
  /** Current identity — its color seeds the picker so notes already left don't change color. */
  contributor: Contributor
  onSubmit: (contributor: Contributor) => void
  onSkip: () => void
}

/**
 * Shown *after* someone leaves their first note, never before. Naming yourself
 * is optional — skipping leaves the notes credited to Guest.
 */
export function ContributorPrompt({ contributor, onSubmit, onSkip }: ContributorPromptProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(contributor.color)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onSkip])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), color, named: true })
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onSkip}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-border/50 bg-card p-6 shadow-2xl space-y-5"
      >
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-foreground">Note added — who should we credit?</h2>
          <p className="text-sm text-muted-foreground">
            Your name and color show up next to your notes. You can skip this.
          </p>
        </div>

        <div className="space-y-3">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={30}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <div className="flex items-center gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Pick color ${c}`}
                className={cn(
                  "w-7 h-7 rounded-full transition-all",
                  color === c
                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-card scale-110"
                    : "hover:scale-105 opacity-70 hover:opacity-100",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            className="text-muted-foreground hover:text-foreground h-10"
          >
            Skip
          </Button>
          <Button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 h-10"
          >
            Save
          </Button>
        </div>
      </form>
    </div>
  )
}
