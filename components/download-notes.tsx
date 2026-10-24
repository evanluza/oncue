"use client"

import { useState } from "react"
import { Download, Check, Copy, FileText, Table2 } from "lucide-react"
import type { AnnotationRow } from "@/lib/db"
import {
  notesAsText,
  notesAsReaperCsv,
  exportBaseName,
  downloadFile,
} from "@/lib/export-notes"

type DownloadNotesProps = {
  trackName: string
  annotations: AnnotationRow[]
}

/**
 * Audio expires after 30 days of inactivity; notes never do. This is how the
 * notes leave — as plain text to paste anywhere, or as a marker CSV that drops
 * straight onto a Reaper timeline.
 */
export function DownloadNotes({ trackName, annotations }: DownloadNotesProps) {
  const [copied, setCopied] = useState(false)

  if (annotations.length === 0) return null

  const base = exportBaseName(trackName)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(notesAsText(trackName, annotations))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard denied — the two download buttons still work.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleCopy}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy as text"}
      </button>

      <button
        onClick={() =>
          downloadFile(`${base}.txt`, notesAsText(trackName, annotations), "text/plain;charset=utf-8")
        }
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <FileText className="h-3.5 w-3.5" />
        .txt
      </button>

      <button
        onClick={() =>
          downloadFile(`${base}-markers.csv`, notesAsReaperCsv(annotations), "text/csv;charset=utf-8")
        }
        title="Marker CSV — import onto a Reaper timeline"
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Table2 className="h-3.5 w-3.5" />
        Reaper markers
      </button>
    </div>
  )
}

export { Download }
