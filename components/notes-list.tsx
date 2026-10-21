"use client"

import { useState } from "react"
import type { Note } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { NoteBody } from "@/components/note-body"
import { Trash2 } from "lucide-react"
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`
  }

  const isNearCurrentTime = (timestamp: number) => {
    return Math.abs(timestamp - currentTime) < 0.5
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground/60">No notes yet</p>
          <p className="text-xs text-muted-foreground/40">
            Play the track and tap Note to leave one at that moment.
          </p>
        </div>
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
            <div className="shrink-0 font-mono text-[11px] text-muted-foreground/50">
              {formatTime(note.timestamp)}
            </div>

            {/* Note content */}
            <div className="flex-1 min-w-0">
              <NoteBody
                text={note.text}
                placeholder={placeholderText}
                editable={isEditableType}
                emphasized={!isEditableType}
                isEditing={isEditing}
                onStartEditing={() => setEditingId(note.id)}
                onStopEditing={() => setEditingId(null)}
                onChange={(text) => onUpdateNote(note.id, text)}
              />
            </div>

            {/* Delete button */}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
