import { track } from "@vercel/analytics"

/**
 * The loop, as events:
 *
 *   upload_started ──▶ track_uploaded ──▶ first_annotation_created
 *                            │                      │
 *                            │                      ▼
 *                            │              share_clicked ──▶ track_shared
 *                            │                                     │
 *                            │                                     ▼
 *                            │                            share_link_opened
 *                            │                                     │
 *                            │                    ┌────────────────┴────────────────┐
 *                            │                    ▼                                 ▼
 *                            │          recipient_played_audio              share_cta_clicked
 *                            │                                                      │
 *                            ▼                                                      ▼
 *                    creator_returned ──▶ repeat_upload              upload_started (referral: "share")
 *
 * Two different questions. The left spine is retention — does the same person
 * come back with another track? The right branch is recruitment — does a
 * recipient become a creator? Recruitment has never happened once in
 * production, so retention is the one being watched.
 *
 * `share_link_opened` and `recipient_played_audio` are the events that can't be
 * reconstructed after the fact: annotations only record people who acted, so a
 * link that was opened, listened to and closed leaves no trace in the database.
 *
 * Identity for the return events is the anonymous localStorage record in
 * `lib/identity.ts`, which means repeat counts are a floor: a cleared browser
 * looks like a new person.
 */
export type OnCueEvent =
  // Upload
  | "upload_started"
  | "upload_rejected"
  | "track_uploaded"
  // Annotate
  | "first_annotation_created"
  | "annotation_added"
  // Share
  | "share_clicked"
  | "track_shared"
  | "share_link_opened"
  | "recipient_played_audio"
  | "share_cta_clicked"
  // Return
  | "creator_returned"
  | "repeat_upload"
  // Research prompts
  | "email_capture_shown"
  | "email_capture_submitted"
  | "email_capture_skipped"
  | "use_case_prompt_shown"
  | "use_case_selected"
  | "use_case_skipped"
  | "feedback_opened"
  | "feedback_submitted"


type Props = Record<string, string | number | boolean | null>

/**
 * Events fired on mount used to vanish.
 *
 * React runs a child's effects before its parent's, so a `useEffect` in a page
 * fires before the root layout's <Analytics> has loaded the SDK. In that window
 * `window.va` doesn't exist yet, track() quietly parks the event in a queue
 * that never gets drained, and nothing surfaces. `share_link_opened` is a
 * mount-time event, so recipients opening links have been undercounted for as
 * long as that event has existed.
 *
 * Waiting for the SDK to appear is enough, and doesn't depend on its internals.
 */
const READY_POLL_MS = 250
const READY_MAX_ATTEMPTS = 20 // ~5s, then give up rather than leak timers

function analyticsReady() {
  return typeof window !== "undefined" && typeof (window as unknown as { va?: unknown }).va === "function"
}

function send(name: OnCueEvent, props: Props | undefined, attempt: number) {
  if (typeof window === "undefined") return

  if (!analyticsReady() && attempt < READY_MAX_ATTEMPTS) {
    setTimeout(() => send(name, props, attempt + 1), READY_POLL_MS)
    return
  }

  try {
    track(name, props)
  } catch {
    // Blocked, offline, or never loaded. A missing event must never break the app.
  }
}

export function ev(name: OnCueEvent, props?: Props) {
  send(name, props, 0)
}
