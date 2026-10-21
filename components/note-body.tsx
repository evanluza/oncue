"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export const NOTE_MAX_LENGTH = 500

/** The counter stays hidden until someone is within this many characters of the cap. */
const COUNTER_VISIBLE_WITHIN = 100

type NoteBodyProps = {
  text: string
  placeholder: string
  /** Whether this viewer may edit this note at all. */
  editable: boolean
  isEditing: boolean
  onStartEditing: () => void
  onStopEditing: () => void
  onChange: (text: string) => void
  /** Macro notes ("🔥", "❗ Issue flagged") render heavier than typed prose. */
  emphasized?: boolean
}

/**
 * The read and edit states of a single note's text, shared by the solo and
 * shared timelines. Collapsed to one line in the list; the full note is always
 * one click away (into the editor when editable, expanded in place otherwise)
 * and available on hover via the title tooltip, which costs no layout.
 */
export function NoteBody({
  text,
  placeholder,
  editable,
  isEditing,
  onStartEditing,
  onStopEditing,
  onChange,
  emphasized,
}: NoteBodyProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)

  // Grow the textarea to fit its content, up to the max-height where it scrolls.
  // scrollHeight covers content + padding but not the border, and box-sizing is
  // border-box here, so the border has to be added back or the field sits two
  // pixels short and scrolls forever.
  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    const borderY = el.offsetHeight - el.clientHeight
    el.style.height = `${el.scrollHeight + borderY}px`
  }, [text, isEditing])

  const firstLine = text.split("\n", 1)[0]
  const hasMoreLines = firstLine.length < text.length

  // Only measure while collapsed — expanded there is nothing hidden to detect.
  // isEditing matters: the paragraph only mounts once the editor closes, and
  // without it here that first mount would never get measured.
  useLayoutEffect(() => {
    if (expanded) return
    const el = textRef.current
    if (!el) return
    const measure = () => setIsTruncated(hasMoreLines || el.scrollWidth > el.clientWidth + 1)
    measure()
    // Re-measure on rotate/resize: the same note truncates at phone width and
    // not at desktop width.
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [text, expanded, isEditing, hasMoreLines])

  if (isEditing && editable) {
    const remaining = NOTE_MAX_LENGTH - text.length
    const showCounter = remaining <= COUNTER_VISIBLE_WITHIN

    return (
      <div onClick={(e) => e.stopPropagation()}>
        <textarea
          ref={textareaRef}
          autoFocus
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onStopEditing}
          onKeyDown={(e) => {
            if (e.key === "Escape") onStopEditing()
            if (e.key === "Enter" && e.metaKey) onStopEditing()
          }}
          placeholder="Add your note here..."
          maxLength={NOTE_MAX_LENGTH}
          rows={1}
          // Caps lower on phones, where the on-screen keyboard already takes
          // half the viewport, then scrolls.
          className="w-full resize-none overflow-y-auto rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed max-h-32 sm:max-h-48 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {showCounter && (
          <div
            className={cn(
              "mt-1 text-right font-mono text-[10px] tabular-nums",
              remaining <= 0 ? "text-accent" : "text-muted-foreground/50",
            )}
          >
            {text.length}/{NOTE_MAX_LENGTH}
          </div>
        )}
      </div>
    )
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (editable) onStartEditing()
    else if (isTruncated || expanded) setExpanded((v) => !v)
  }

  return (
    <div
      onClick={handleClick}
      className={cn("w-full text-left", (editable || isTruncated || expanded) && "cursor-pointer")}
    >
      {text ? (
        <p
          ref={textRef}
          // Shown on hover without reflowing the row.
          title={isTruncated ? text : undefined}
          className={cn(
            "text-sm leading-relaxed",
            expanded
              ? "whitespace-pre-wrap break-words"
              : // Collapsed shows the first line only, cut with an ellipsis the
                // way single-line truncation always has. line-clamp was the
                // obvious choice but -webkit-box refuses to break a long word,
                // so a note that is mostly a URL rendered as just "^ …".
                "truncate",
            emphasized ? "text-foreground font-medium" : "text-foreground",
          )}
        >
          {expanded ? text : firstLine}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic">{placeholder}</p>
      )}
    </div>
  )
}
