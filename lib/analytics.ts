import { track } from "@vercel/analytics"

/**
 * The share loop, as events:
 *
 *   upload_started ──▶ share_clicked ──▶ share_created
 *                                            │
 *                                            ▼
 *                                    share_link_opened
 *                                            │
 *                                            ├──▶ annotation_added (first: true)
 *                                            │
 *                                            └──▶ share_cta_clicked
 *                                                       │
 *                                                       ▼
 *                                        upload_started (referral: "share")
 *
 * The second branch is recruitment: a recipient who liked the tool enough to
 * bring their own track. It is the only channel that compounds, so it is
 * measured end to end rather than inferred from a traffic spike.
 *
 * `share_link_opened` is the one that can't be reconstructed after the fact —
 * annotations only record people who acted, so a link that was opened and
 * ignored leaves no trace in the database.
 */
export type OnCueEvent =
  | "upload_started"
  | "upload_rejected"
  | "share_clicked"
  | "share_created"
  | "share_link_opened"
  | "share_cta_clicked"
  | "annotation_added"

type Props = Record<string, string | number | boolean | null>

export function ev(name: OnCueEvent, props?: Props) {
  try {
    track(name, props)
  } catch {
    // Analytics must never break the app.
  }
}
