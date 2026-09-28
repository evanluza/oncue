"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ev } from "@/lib/analytics"
import * as db from "@/lib/db"
import { getCreator } from "@/lib/identity"

/**
 * There is no way to ask someone why they stopped using OnCue — no accounts, no
 * addresses, no contact of any kind. Two power users left without a trace. This
 * is the cheapest possible fix for that: one quiet link, one text box.
 */
export function FeedbackButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  /** A thank-you for a message that never saved would lose the message. */
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const handleOpen = () => {
    setOpen(true)
    setSent(false)
    setFailed(false)
    ev("feedback_opened", { path: typeof window === "undefined" ? null : window.location.pathname })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return
    setSending(true)

    const creator = getCreator()
    const path = window.location.pathname
    const ok = await db.saveFeedback({
      message,
      email: email.trim() || null,
      creatorId: creator.id,
      useCase: creator.useCase,
      path,
    })

    ev("feedback_submitted", {
      path,
      withEmail: Boolean(email.trim()),
      useCase: creator.useCase,
      stored: ok,
      length: message.trim().length,
    })
    setSending(false)
    if (!ok) {
      setFailed(true)
      return
    }
    setSent(true)
    setMessage("")
    setEmail("")
    setTimeout(() => setOpen(false), 1600)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`text-xs text-muted-foreground/60 hover:text-foreground transition-colors ${className}`}
      >
        Have feedback?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl border border-border/50 bg-card p-5 shadow-2xl space-y-4"
          >
            {sent ? (
              <p className="text-sm text-foreground">Thanks — that goes straight to the person who builds this.</p>
            ) : (
              <>
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-foreground">What&apos;s missing from OnCue?</h2>
                  <p className="text-xs text-muted-foreground">
                    Anything that got in your way, or anything you wish it did.
                  </p>
                </div>

                <textarea
                  autoFocus
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={4000}
                  placeholder="I wish OnCue could..."
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional, only if you want a reply)"
                  maxLength={254}
                  aria-label="Your email address, optional"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                />

                {failed && (
                  <p className="text-xs text-destructive leading-relaxed">
                    That didn&apos;t save — sorry. Your words are still in the box:{" "}
                    <a
                      href="https://www.elulabs.com/#contact"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground"
                    >
                      send them here instead
                    </a>
                    , or try again.
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:text-foreground h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!message.trim() || sending}
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 h-9"
                  >
                    {sending ? "Sending..." : "Send"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </>
  )
}
