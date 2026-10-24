/**
 * One place that decides what counts as audio, and what MIME type and extension
 * we store it under.
 *
 * Browsers disagree about audio MIME types, especially m4a: Chrome reports
 * audio/mp4, Safari audio/x-m4a, Windows sometimes audio/mp3 instead of
 * audio/mpeg, and a file dragged from some sources arrives with an empty type.
 * Uploads used to pass the browser's string straight to storage, which was
 * harmless while the bucket accepted anything.
 *
 * Once the bucket enforces allowed_mime_types, that stops being harmless: an
 * empty or non-canonical type is rejected outright. So every accepted file is
 * mapped onto one canonical MIME type from ALLOWED_MIME_TYPES, and the stored
 * extension comes from that mapping rather than from the filename — a filename
 * is user input and `evil.php` should not become the object's key.
 */

export type CanonicalAudio = {
  /** What we send as contentType, always one of ALLOWED_MIME_TYPES. */
  mimeType: string
  /** Extension for the storage key, without a dot. */
  ext: string
}

const MPEG: CanonicalAudio = { mimeType: "audio/mpeg", ext: "mp3" }
const WAV: CanonicalAudio = { mimeType: "audio/wav", ext: "wav" }
const MP4: CanonicalAudio = { mimeType: "audio/mp4", ext: "m4a" }
const AAC: CanonicalAudio = { mimeType: "audio/aac", ext: "aac" }

/** Every MIME type the browser might hand us, mapped to what we store. */
const BY_MIME: Record<string, CanonicalAudio> = {
  "audio/mpeg": MPEG,
  "audio/mp3": MPEG,
  "audio/wav": WAV,
  "audio/x-wav": WAV,
  "audio/wave": WAV,
  "audio/mp4": MP4,
  "audio/x-m4a": MP4,
  "audio/m4a": MP4,
  "audio/aac": AAC,
}

/** Fallback for files that arrive with an empty or unrecognised type. */
const BY_EXT: Record<string, CanonicalAudio> = {
  mp3: MPEG,
  wav: WAV,
  m4a: MP4,
  mp4: MP4,
  aac: AAC,
}

/**
 * The exact set the `audio` bucket's allowed_mime_types must contain. Keep the
 * two in step: a type here that the bucket rejects is an upload that fails
 * after the file has already been chosen.
 */
export const ALLOWED_MIME_TYPES = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/aac"] as const

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

function extensionOf(name: string): string {
  const i = name.lastIndexOf(".")
  return i === -1 ? "" : name.slice(i + 1).toLowerCase()
}

/**
 * Dot-prefixed extension, for the `upload_rejected` analytics label only. Kept
 * in this format so the event stays comparable with everything logged before.
 */
export function fileExtension(name: string): string {
  const ext = extensionOf(name)
  return ext ? `.${ext}` : ""
}

/**
 * Returns what to store this file as, or null if it isn't audio we accept.
 * MIME type wins when we recognise it; otherwise the extension decides, which
 * is what keeps empty-type uploads (iPhone Voice Memos via some paths) working.
 */
export function canonicalAudioType(file: File): CanonicalAudio | null {
  return BY_MIME[file.type] ?? BY_EXT[extensionOf(file.name)] ?? null
}
