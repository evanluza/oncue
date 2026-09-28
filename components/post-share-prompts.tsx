"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ev } from "@/lib/analytics"
import * as db from "@/lib/db"
import { getCreator, updateCreator, USE_CASE_LABELS, type UseCase } from "@/lib/identity"

/**
 * The two research asks, shown only after a share link exists — never before,
 * and never in the way of one. Both are skippable, both are asked at most once
 * per browser, and dismissing either leaves the share link exactly where it was.
 *
 * Email first (it has something to offer: a way back to the track), then the
 * use-case question (which only has something to offer us).
 */

/** Set once sending is configured — until then the copy must not promise delivery. */
const EMAIL_DELIVERY_ON = process.env.NEXT_PUBLIC_EMAIL_DELIVERY === "on"

const EMAIL_SKIP_KEY = "oncue:email_prompt_skipped"

const USE_CASES: UseCase[] = ["speaking", "music", "music-lessons", "podcast", "other"]

type Step = "email" | "use_case" | "done"

function looksLikeEmail(value: string) {
  const v = value.trim()
  return v.length >= 3 && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

export function PostSharePrompts({ projectId }: { projectId: string }) {
  const [step, setStep] = useState<Step>("done")
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [failed, setFailed] = useState(false)
  const shownFor = useRef<string | null>(null)

  // Decide what (if anything) to ask, once per shared track.
  useEffect(() => {
    if (shownFor.current === projectId) return
    shownFor.current = projectId

    const creator = getCreator()
    let skippedThisSession = false
    try {
      skippedThisSession = sessionStorage.getItem(EMAIL_SKIP_KEY) === "1"
    } catch {
      // Treat an unreadable sessionStorage as "not skipped".
    }

    if (!creator.emailCaptured && !skippedThisSession) {
      setStep("email")
      ev("email_capture_shown", { projectId, useCase: creator.useCase })
      return
    }
    if (!creator.useCaseAsked) {
      setStep("use_case")
      ev("use_case_prompt_shown", { projectId })
      return
    }
    setStep("done")
  }, [projectId])

  const goToUseCaseOrClose = () => {
    const creator = getCreator()
    if (!creator.useCaseAsked) {
      setStep("use_case")
      ev("use_case_prompt_shown", { projectId })
    } else {
      setStep("done")
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!looksLikeEmail(email) || saving) return
    setSaving(true)

    const creator = getCreator()
    const ok = await db.saveEmailCapture({
      email,
      projectId,
      creatorId: creator.id,
      useCase: creator.useCase,
      marketingConsent: consent,
      source: "post_share",
    })

    ev("email_capture_submitted", {
      projectId,
      marketingConsent: consent,
      useCase: creator.useCase,
      stored: ok,
      delivery: EMAIL_DELIVERY_ON,
    })
    setSaving(false)
    if (!ok) {
      // Don't claim to have their address when we don't.
      setFailed(true)
      return
    }
    updateCreator({ emailCaptured: true })
    setSaved(true)

    // Let the confirmation land before moving on.
    setTimeout(goToUseCaseOrClose, EMAIL_DELIVERY_ON ? 1800 : 2600)
  }

  const handleEmailSkip = () => {
    try {
      sessionStorage.setItem(EMAIL_SKIP_KEY, "1")
    } catch {
      // Then they may see it again next share. Acceptable.
    }
    ev("email_capture_skipped", { projectId })
    goToUseCaseOrClose()
  }

  const handleUseCase = async (useCase: UseCase) => {
    const creator = updateCreator({ useCase, useCaseAsked: true })
    ev("use_case_selected", { projectId, useCase })
    setStep("done")
    await db.saveUseCase({ creatorId: creator.id, useCase, projectId })
  }

  const handleUseCaseSkip = () => {
    updateCreator({ useCaseAsked: true })
    ev("use_case_skipped", { projectId })
    setStep("done")
  }

  if (step === "done") return null

  return (
    <div className="border-t border-border/50 bg-card/40 px-4 py-5">
      <div className="mx-auto w-full max-w-md">
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {saved ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Saved.</p>
                <p className="text-xs text-muted-foreground">
                  {EMAIL_DELIVERY_ON
                    ? "The link is on its way to your inbox."
                    : "We'll send the link as soon as email is switched on — your link is still on this page, so copy it if you need it now."}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-foreground">Don&apos;t lose this track</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {EMAIL_DELIVERY_ON
                      ? "Email yourself the link so you can come back to it anytime."
                      : "Leave your email and we'll send you the link. Email delivery isn't switched on yet, so copy the link too."}
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    maxLength={254}
                    aria-label="Your email address"
                    className="flex-1 min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button
                    type="submit"
                    disabled={!looksLikeEmail(email) || saving}
                    className="shrink-0 bg-accent text-accent-foreground hover:bg-accent/90 h-9"
                  >
                    {saving ? "Saving..." : EMAIL_DELIVERY_ON ? "Send me the link" : "Save my email"}
                  </Button>
                </div>

                {/* "Email me this link" is not consent to be marketed at, so the
                    opt-in is separate and off by default. */}
                <label className="flex items-start gap-2 text-[11px] text-muted-foreground/80 leading-relaxed">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-input accent-[oklch(0.68_0.18_45)]"
                  />
                  <span>
                    You can also email me about OnCue (occasional, and you can stop it any time).
                    We&apos;ll only use your address for the link unless you tick this.
                  </span>
                </label>

                {failed && (
                  <p className="text-xs text-destructive">
                    That didn&apos;t save — the link on this page still works, so copy it before you go.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleEmailSkip}
                  className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  No thanks
                </button>
              </>
            )}
          </form>
        )}

        {step === "use_case" && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">What are you using OnCue for?</h2>
            <div className="flex flex-wrap gap-2">
              {USE_CASES.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleUseCase(u)}
                  className={cn(
                    "rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground",
                    "hover:border-accent/50 hover:text-accent transition-colors",
                  )}
                >
                  {USE_CASE_LABELS[u]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleUseCaseSkip}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
