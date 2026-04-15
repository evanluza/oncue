"use client"

import { useState } from "react"
import type { Note } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Trash2, Play } from "lucide-react"
import { cn } from "@/lib/utils"

type NotesListProps = {
  notes: Note[]
  currentTime: number
  onNoteClick: (timestamp: number) => void
  onUpdateNote: (id: string, text: string) => void
  onDeleteNote: (id: string) => void
}

export function NotesList({ notes, currentTime, onNoteClick, onUpdateNote, onDeleteNote }: NotesListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [playingVoiceNote, setPlayingVoiceNote] = useState<string | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`
  }

  const isNearCurrentTime = (timestamp: number) => {
    return Math.abs(timestamp - currentTime) < 0.5
  }

  const playVoiceNote = (note: Note) => {
    if (!note.audioBlob) return

    const audioUrl = URL.createObjectURL(note.audioBlob)
    const audio = new Audio(audioUrl)

    audio.onplay = () => setPlayingVoiceNote(note.id)
    audio.onended = () => {
      setPlayingVoiceNote(null)
      URL.revokeObjectURL(audioUrl)
    }
    audio.onerror = () => {
      setPlayingVoiceNote(null)
      URL.revokeObjectURL(audioUrl)
    }

    audio.play()
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground/60">No annotations</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {notes.map((note) => {
        const isActive = isNearCurrentTime(note.timestamp)
        const isEditing = editingId === note.id
        const isEditableType = !note.type || note.type === "note" || note.type === "idea"
        const placeholderText = note.type === "idea" ? "Click to leave idea..." : "Click to add note..."

        return (
          <div
            key={note.id}
            onClick={(e) => {
              const target = e.target as HTMLElement
              if (!isEditing && !target.closest('button[aria-label="Delete note"]') && !target.closest("textarea")) {
                onNoteClick(note.timestamp)
              }
            }}
            className={cn(
              "group relative flex gap-3 p-3 transition-colors hover:bg-muted/50 cursor-pointer",
              isActive && "bg-accent/5",
            )}
          >
            <div className="flex-shrink-0 font-mono text-[11px] text-muted-foreground/50">
              {formatTime(note.timestamp)}
            </div>

            {/* Note content */}
            <div className="flex-1 min-w-0">
              {note.type === "voice-note" && note.audioBlob && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    playVoiceNote(note)
                  }}
                  className="mb-2 gap-2"
                  disabled={playingVoiceNote === note.id}
                >
                  <Play className="h-3 w-3" />
                  {playingVoiceNote === note.id ? "Playing..." : "Play recording"}
                </Button>
              )}

              {isEditing && isEditableType ? (
                <textarea
                  autoFocus
                  value={note.text}
                  onChange={(e) => onUpdateNote(note.id, e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setEditingId(null)
                    }
                    if (e.key === "Enter" && e.metaKey) {
                      setEditingId(null)
                    }
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
                    if (isEditableType) {
                      setEditingId(note.id)
                    }
                  }}
                  className={cn("w-full text-left", isEditableType && "cursor-text")}
                >
                  {note.text ? (
                    <p
                      className={cn(
                        "text-sm leading-relaxed",
                        !isEditableType ? "text-foreground font-medium" : "text-foreground",
                      )}
                    >
                      {note.text}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">{placeholderText}</p>
                  )}
                </div>
              )}
            </div>

            {/* Delete button */}
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteNote(note.id)
              }}
              aria-label="Delete note"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete note</span>
            </Button>

            {/* Active indicator */}
            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />}
          </div>
        )
      })}
    </div>
  )
}
