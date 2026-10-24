/**
 * Note ownership without accounts.
 *
 * Every note gets a random edit token when it's written. The token stays in
 * this browser's localStorage; only its SHA-256 hash goes to the database, and
 * get_project() strips that hash before returning anything. So holding the
 * token is the only way to prove authorship, and the server never stores
 * anything that grants edit rights.
 *
 * Consequences worth knowing:
 *  - Clearing site data loses edit rights to your own notes. The notes stay;
 *    they just become read-only, like everyone else's.
 *  - Notes written before this existed have no token and are read-only for
 *    everyone, which is strictly better than the previous state where anyone
 *    could edit or delete any note on any project.
 */

const STORAGE_KEY = "oncue_note_tokens"
const MAX_TOKENS = 500

type TokenMap = Record<string, string>

function read(): TokenMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function write(map: TokenMap) {
  try {
    // Keep the newest entries if this ever grows unreasonably.
    const entries = Object.entries(map)
    const trimmed = entries.length > MAX_TOKENS ? entries.slice(-MAX_TOKENS) : entries
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(trimmed)))
  } catch {
    // Private browsing or quota. Edit rights are lost, notes are not.
  }
}

/** A fresh token. Unguessable; never leaves this browser except as a hash. */
export function newEditToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

export async function hashEditToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("")
}

export function rememberEditToken(annotationId: string, token: string) {
  const map = read()
  map[annotationId] = token
  write(map)
}

export function getEditToken(annotationId: string): string | null {
  return read()[annotationId] ?? null
}

/** Whether this browser can edit or delete the given note. */
export function canEditNote(annotationId: string): boolean {
  return getEditToken(annotationId) !== null
}

export function forgetEditToken(annotationId: string) {
  const map = read()
  if (annotationId in map) {
    delete map[annotationId]
    write(map)
  }
}
