import type { AnnotationRow } from "./db"

/**
 * Taking the notes with you.
 *
 * Audio expires after 30 days of inactivity but notes never do, so the notes
 * have to be portable — otherwise "your audio is gone" reads as "your feedback
 * is gone". Both formats are generated in the browser; nothing is uploaded.
 */

function clockTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

/** Reaper wants h:mm:ss.mmm. */
function reaperTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(3, "0")}`
}

function byTimestamp(a: AnnotationRow, b: AnnotationRow) {
  return a.timestamp - b.timestamp
}

/** One line per note: `0:42 · Sam: vocals too quiet` */
export function notesAsText(trackName: string, annotations: AnnotationRow[]): string {
  const lines = [...annotations].sort(byTimestamp).map((a) => {
    const text = a.text.trim().replace(/\s*\n\s*/g, " ")
    return `${clockTime(a.timestamp)} · ${a.contributor_name}: ${text || "(no text)"}`
  })

  return [trackName, "—".repeat(Math.min(trackName.length, 40)), ...lines, ""].join("\n")
}

function csvCell(value: string): string {
  // Quote anything containing a comma, quote or newline; double inner quotes.
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/**
 * Marker CSV in the layout Reaper's marker import expects: an `M`-prefixed
 * index, a name, and a start timecode.
 */
export function notesAsReaperCsv(annotations: AnnotationRow[]): string {
  const rows = [...annotations].sort(byTimestamp).map((a, i) => {
    const name = `${a.contributor_name}: ${a.text.trim().replace(/\s*\n\s*/g, " ")}`.trim()
    return [`M${i + 1}`, csvCell(name || a.contributor_name), reaperTime(a.timestamp)].join(",")
  })

  return ["#,Name,Start", ...rows, ""].join("\n")
}

/** Strip the extension and anything awkward in a filename. */
export function exportBaseName(trackName: string): string {
  return (
    trackName
      .replace(/\.(mp3|wav|m4a|aac|mp4)$/i, "")
      .replace(/[^\w\s.-]/g, "")
      .trim()
      .slice(0, 60) || "oncue-notes"
  )
}

export function downloadFile(filename: string, contents: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: mimeType }))
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
