/**
 * The loop's weakest measured link: a share-link recipient who clicks through
 * to /annotate lands on a fresh page with no memory of where they came from,
 * so their upload looks identical to cold traffic. This carries that one fact
 * across the hop, in sessionStorage so it dies with the tab and never becomes
 * tracking.
 */
const KEY = "oncue:referral"

export type Referral = { source: "share"; fromProjectId: string | null }

export function markReferredFromShare(fromProjectId: string) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ source: "share", fromProjectId }))
  } catch {
    // Private mode and friends: the ?ref=share param below still survives.
  }
}

/**
 * Reads the referral for the current /annotate visit. The query param is the
 * source of truth (it survives a link opened in a new tab); sessionStorage
 * only adds which track they came from.
 */
export function readReferral(search: string): Referral | null {
  const viaParam = new URLSearchParams(search).get("ref") === "share"

  let stored: Referral | null = null
  try {
    const raw = sessionStorage.getItem(KEY)
    stored = raw ? (JSON.parse(raw) as Referral) : null
  } catch {
    stored = null
  }

  if (!viaParam && !stored) return null
  return { source: "share", fromProjectId: stored?.fromProjectId ?? null }
}
