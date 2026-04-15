"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnnotationRow } from "@/lib/db"

type SharedNotesListProps = {
  annotations: AnnotationRow[]
  currentTime: number
  contributorName: string
  onNoteClick: (timestamp: number) => void
  onUpdateAnnotation: (id: string, text: string) => void
  onDeleteAnnotation: (id: string) => void
}

export function SharedNotesList({
  annotations,
  currentTime,
  contributorName,
  onNoteClick,
  onUpdateAnnotation,
  onDeleteAnnotation,
}: SharedNotesListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`
  }

  const isNearCurrentTime = (timestamp: number) => {
    return Math.abs(timestamp - currentTime) < 0.5
  }

  if (annotations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground/60">No annotations yet</p>
          <p className="text-xs text-muted-foreground/40">
            Use the macro bar below or Shift+Click the waveform to add notes
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {annotations.map((annotation) => {
        const isActive = isNearCurrentTime(annotation.timestamp)
        const isEditing = editingId === annotation.id
        const isOwn = annotation.contributor_name === contributorName
        const isEditableType = !annotation.type || annotation.type === "note" || annotation.type === "idea"
        const placeholderText = annotation.type === "idea" ? "Click to leave idea..." : "Click to add note..."

        return (
          <div
            key={annotation.id}
            onClick={(e) => {
              const target = e.target as HTMLElement
              if (!isEditing && !target.closest('button[aria-label="Delete note"]') && !target.closest("textarea")) {
                onNoteClick(annotation.timestamp)
              }
            }}
            className={cn(
              "group relative flex gap-3 p-3 transition-colors hover:bg-muted/50 cursor-pointer",
              isActive && "bg-accent/5",
            )}
          >
            {/* Active indicator */}
            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />}

            {/* Timestamp */}
            <div className="shrink-0 font-mono text-[11px] text-muted-foreground/50">
              {formatTime(annotation.timestamp)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* Contributor tag */}
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: annotation.contributor_color }}
                />
                <span className="text-[11px] text-muted-foreground/60">
                  {annotation.contributor_name}
                  {isOwn && <span className="text-muted-foreground/40 ml-1">(you)</span>}
                </span>
              </div>

              {/* Note text */}
              {isEditing && isEditableType && isOwn ? (
                <textarea
                  autoFocus
                  value={annotation.text}
                  onChange={(e) => onUpdateAnnotation(annotation.id, e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditingId(null)
                    if (e.key === "Enter" && e.metaKey) setEditingId(null)
                  }}
                  placeholder="Add your note here..."
                  maxLength={120}
                  className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                />
              ) : (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isEditableType && isOwn) setEditingId(annotation.id)
                  }}
                  className={cn("w-full text-left", isEditableType && isOwn && "cursor-text")}
                >
                  {annotation.text ? (
                    <p
                      className={cn(
                        "text-sm leading-relaxed",
                        !isEditableType ? "text-foreground font-medium" : "text-foreground",
                      )}
                    >
                      {annotation.text}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      {isOwn ? placeholderText : "Empty note"}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Delete — only your own */}
            {isOwn && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteAnnotation(annotation.id)
                }}
                aria-label="Delete note"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
