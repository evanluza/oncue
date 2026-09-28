/**
 * The anonymous creator record.
 *
 * OnCue has no accounts and is not getting any, so repeat behaviour can only be
 * measured against something the browser remembers. This is that something: a
 * random id the visitor assigns themselves, plus the few facts needed to tell
 * "came back and uploaded again" from "first time here".
 *
 * It is deliberately not a fingerprint. Nothing is derived from the device, it
 * never leaves localStorage except as an analytics property, and clearing site
 * data resets it — which also means repeat counts are a floor, not a truth.
 */
const KEY = "oncue:creator"

/** A new browser session starts when the tab has been idle this long. */
const SESSION_GAP_MS = 30 * 60 * 1000

export type UseCase = "speaking" | "music" | "music-lessons" | "podcast" | "other"

export type CreatorRecord = {
  id: string
  uploadCount: number
  lastUploadAt: string | null
  lastProjectId: string | null
  lastVisitAt: string | null
  useCase: UseCase | null
  /** Set once the use-case question has been shown, answered or skipped. */
  useCaseAsked: boolean
  /** Set once an email has been captured, so we never ask twice. */
  emailCaptured: boolean
}

const BLANK: CreatorRecord = {
  id: "",
  uploadCount: 0,
  lastUploadAt: null,
  lastProjectId: null,
  lastVisitAt: null,
  useCase: null,
  useCaseAsked: false,
  emailCaptured: false,
}

function newId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `c_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  }
}

export function getCreator(): CreatorRecord {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed?.id) return { ...BLANK, ...parsed }
  } catch {
    // Private mode, quota, corrupt JSON — fall through to a fresh record.
  }
  const fresh = { ...BLANK, id: newId() }
  save(fresh)
  return fresh
}

function save(record: CreatorRecord) {
  try {
    localStorage.setItem(KEY, JSON.stringify(record))
  } catch {
    // Nothing here is worth breaking an upload over.
  }
}

export function updateCreator(patch: Partial<CreatorRecord>): CreatorRecord {
  const next = { ...getCreator(), ...patch }
  save(next)
  return next
}

export function daysSince(iso: string | null): number | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms) || ms < 0) return null
  return Math.round((ms / 86_400_000) * 10) / 10
}

/**
 * Marks this page view and reports whether it is a returning visit — a creator
 * who has uploaded before, arriving after a gap rather than clicking around in
 * one sitting.
 */
export function touchVisit(): { returning: boolean; creator: CreatorRecord } {
  const creator = getCreator()
  const last = creator.lastVisitAt ? new Date(creator.lastVisitAt).getTime() : 0
  const returning = creator.uploadCount > 0 && Date.now() - last > SESSION_GAP_MS
  return { returning, creator: updateCreator({ lastVisitAt: new Date().toISOString() }) }
}

export const USE_CASE_LABELS: Record<UseCase, string> = {
  speaking: "Language / speaking lessons",
  music: "Music / production",
  "music-lessons": "Music lessons",
  podcast: "Podcast / audio editing",
  other: "Other",
}
