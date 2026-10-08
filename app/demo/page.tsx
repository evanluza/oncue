"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { WaveformPlayer } from "@/components/waveform-player"
import { PlaybackControls } from "@/components/playback-controls"
import { NotesList } from "@/components/notes-list"
import { MacroBar } from "@/components/macro-bar"
import { FeedbackButton } from "@/components/feedback-button"
import type { Note, MacroType } from "@/lib/types"
import { ev } from "@/lib/analytics"
import { useKeyboardControls } from "@/hooks/use-keyboard-controls"

/**
 * Every other route ends at "upload audio". Someone reading about OnCue on
 * their phone has no student recording to hand, so they leave without ever
 * seeing it work. This page is the product, already loaded, with real feedback
 * on it — and unlike /share/[id] it's indexable, because nothing here belongs
 * to anyone.
 *
 * Deliberately local-only: no Supabase, no project row, no writes. Notes the
 * visitor adds live in React state and die with the tab, which is also why the
 * page can promise that nothing is saved.
 */

const DEMO_AUDIO = "/demo-track.m4a"

/**
 * Timestamps were measured against the rendered audio rather than guessed, so
 * each note lands on the word it's about. If the recording is ever replaced,
 * re-measure them — a demo whose notes sit in the wrong place argues against
 * the entire product.
 */
const DEMO_NOTES: Note[] = [
  {
    id: "d1",
    timestamp: 1.6,
    text: "Good steady pace to open — easy to follow.",
    type: "highlight",
    createdAt: new Date(),
  },
  {
    id: "d2",
    timestamp: 6.7,
    text: "comfortable → three syllables: COMF-ter-bul. You said all four.",
    createdAt: new Date(),
  },
  {
    id: "d3",
    timestamp: 10.0,
    text: "\"everybody knew each other\" — let these run together instead of separating every word.",
    createdAt: new Date(),
  },
  {
    id: "d4",
    timestamp: 14.2,
    text: "KIL-o-meter — stress the first syllable, not the second.",
    createdAt: new Date(),
  },
  {
    id: "d5",
    timestamp: 21.5,
    text: "This whole sentence sounded completely natural.",
    type: "highlight",
    createdAt: new Date(),
  },
  {
    id: "d6",
    timestamp: 23.7,
    text: "Nice structure with \"Looking back…\". Re-record this part next week and compare.",
    type: "idea",
    createdAt: new Date(),
  },
]

export default function DemoPage() {
  const [notes, setNotes] = useState<Note[]>(DEMO_NOTES)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [isDecoding, setIsDecoding] = useState(true)
  const [macroFeedback, setMacroFeedback] = useState<{ timestamp: number; type: MacroType } | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const playReported = useRef(false)

  useEffect(() => {
    ev("demo_opened")
  }, [])

  useEffect(() => {
    let cancelled = false
    const decode = async () => {
      try {
        const res = await fetch(DEMO_AUDIO)
        const arrayBuffer = await res.arrayBuffer()
        const ctx = new AudioContext()
        const buffer = await ctx.decodeAudioData(arrayBuffer)
        if (!cancelled) setAudioBuffer(buffer)
        ctx.close()
      } catch (err) {
        // The waveform is a nicety; playback still works without it.
        console.error("Failed to decode demo audio:", err)
      } finally {
        if (!cancelled) setIsDecoding(false)
      }
    }
    decode()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)
    const handlePlay = () => {
      setIsPlaying(true)
      if (!playReported.current) {
        playReported.current = true
        ev("demo_played")
      }
    }
    const handlePause = () => setIsPlaying(false)


    // Metadata can land before React attaches these listeners (a cached or
    // local file is ready almost immediately), and then the duration event
    // never comes. Read whatever the element already knows.
    if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration)
    if (audio.currentTime > 0) setCurrentTime(audio.currentTime)
    if (!audio.paused) setIsPlaying(true)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
    }
  }, [])

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.pause()
    else audio.play().catch(() => setIsPlaying(false))
  }, [isPlaying])

  const handleSeek = (time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setCurrentTime(time)
  }

  const handleSkip = useCallback(
    (seconds: number) => {
      const audio = audioRef.current
      if (!audio) return
      audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds))
    },
    [duration],
  )

  useKeyboardControls({ onPlayPause: handlePlayPause, onSkip: handleSkip })

  const addLocalNote = (timestamp: number, text: string, type?: MacroType) => {
    setNotes((prev) =>
      [...prev, { id: `local-${Date.now()}`, timestamp, text, type, createdAt: new Date() }].sort(
        (a, b) => a.timestamp - b.timestamp,
      ),
    )
    ev("demo_note_added", { type: type ?? "none" })
  }

  const handleMacroTrigger = (type: MacroType, timestamp: number) => {
    const labels: Partial<Record<MacroType, string>> = { highlight: "🔥", idea: "", note: "" }
    addLocalNote(timestamp, labels[type] ?? "", type)
    setMacroFeedback({ timestamp, type })
    setTimeout(() => setMacroFeedback(null), 1000)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-24 sm:pb-32">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-14 items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image src="/oc-icon-orange.png" alt="OnCue" width={22} height={22} />
              <span className="text-sm font-semibold tracking-tight hidden sm:inline">oncue</span>
            </Link>
            <div className="w-px h-5 bg-border/50 hidden sm:block" />
            <h1 className="text-sm text-muted-foreground truncate">speaking-practice-sample.m4a</h1>
          </div>
          <Link
            href="/annotate"
            onClick={() => ev("demo_cta_clicked", { placement: "header" })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent text-accent-foreground px-3 sm:px-4 h-9 text-sm font-medium hover:bg-accent/90 transition-colors shrink-0"
          >
            Upload your own
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <div className="border-b border-border/50 bg-accent/5 px-4 py-2.5">
        <p className="mx-auto max-w-3xl text-xs text-muted-foreground text-center">
          A sample recording with a teacher&apos;s feedback already on it. Press play — each note arrives at the
          moment it applies. Add your own too; nothing here is saved.
        </p>
      </div>

      <main className="flex flex-1 flex-col">
        <div className="border-b border-border/50 bg-card/30">
          <WaveformPlayer
            currentTime={currentTime}
            duration={duration}
            notes={notes}
            onSeek={handleSeek}
            onAddNote={(timestamp) => addLocalNote(timestamp, "")}
            macroFeedback={macroFeedback}
            audioBuffer={audioBuffer}
            isDecoding={isDecoding}
          />
        </div>

        <div className="border-b border-border/50">
          <PlaybackControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlayPause={handlePlayPause}
            onSkip={handleSkip}
          />
        </div>

        <div className="flex-1 overflow-auto">
          <NotesList
            notes={notes}
            currentTime={currentTime}
            onNoteClick={handleSeek}
            onUpdateNote={(id, text) =>
              setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)))
            }
            onDeleteNote={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
          />

          <div className="border-t border-border/50 bg-card/30 px-4 py-10">
            <div className="mx-auto max-w-md text-center space-y-4">
              <div className="space-y-1.5">
                <h2 className="text-base font-semibold text-foreground">Now do it with your own recording</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Drop in an mp3, wav or m4a — including a voice memo straight off a phone — mark the moments
                  that matter, and send one link. No account, for you or for them.
                </p>
              </div>
              <Link
                href="/annotate"
                onClick={() => ev("demo_cta_clicked", { placement: "footer" })}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
              >
                Upload audio
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="pt-2">
                <FeedbackButton />
              </div>
            </div>
          </div>
        </div>
      </main>

      <MacroBar currentTime={currentTime} isPlaying={isPlaying} onMacroTrigger={handleMacroTrigger} />

      <audio ref={audioRef} src={DEMO_AUDIO} preload="metadata" />
    </div>
  )
}
