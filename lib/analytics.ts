import { track } from "@vercel/analytics"

/**
 * The share loop, as events:
 *
 *   upload_started ──▶ share_clicked ──▶ share_created
 *                                            │
 *                                            ▼
 *                                    share_link_opened
 *                                            │
 *                                            ▼
 *                                   annotation_added (first: true)
 *
 * `share_link_opened` is the one that can't be reconstructed after the fact —
 * annotations only record people who acted, so a link that was opened and
 * ignored leaves no trace in the database.
 */
export type OnCueEvent =
  | "upload_started"
  | "share_clicked"
  | "share_created"
  | "share_link_opened"
  | "annotation_added"

type Props = Record<string, string | number | boolean | null>

export function ev(name: OnCueEvent, props?: Props) {
  try {
    track(name, props)
  } catch {
    // Analytics must never break the app.
  }
}
