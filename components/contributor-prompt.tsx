"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { COLORS, getRandomColor } from "@/lib/contributor"
import type { Contributor } from "@/lib/contributor"

type ContributorPromptProps = {
  onSubmit: (contributor: Contributor) => void
}

export function ContributorPrompt({ onSubmit }: ContributorPromptProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(getRandomColor)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), color })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm mx-4 rounded-xl border border-border/50 bg-card p-6 shadow-2xl space-y-5"
      >
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-foreground">What should we call you?</h2>
          <p className="text-sm text-muted-foreground">
            Your name and color will appear on your annotations.
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

          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "w-7 h-7 rounded-full transition-all",
                  color === c
                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-card scale-110"
                    : "hover:scale-105 opacity-70 hover:opacity-100"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <Button
          type="submit"
          disabled={!name.trim()}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-10"
        >
          Continue
        </Button>
      </form>
    </div>
  )
}
