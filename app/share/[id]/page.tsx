"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useKeyboardControls } from "@/hooks/use-keyboard-controls"
import { useParams } from "next/navigation"
import { WaveformPlayer } from "@/components/waveform-player"
import { PlaybackControls } from "@/components/playback-controls"
import { SharedNotesList } from "@/components/shared-notes-list"
import { MacroBar } from "@/components/macro-bar"
import { ContributorPrompt } from "@/components/contributor-prompt"
import { ShareCta } from "@/components/share-cta"
import { DownloadNotes } from "@/components/download-notes"
import { FeedbackButton } from "@/components/feedback-button"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { MacroType } from "@/lib/types"
import { ensureContributor, saveContributor } from "@/lib/contributor"
import type { Contributor } from "@/lib/contributor"
import { ev } from "@/lib/analytics"
import { getMyProjects } from "@/lib/my-projects"
import * as db from "@/lib/db"
import { parsePeaks } from "@/lib/waveform"
import type { AnnotationRow, ProjectRow } from "@/lib/db"

export default function SharePage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<ProjectRow | null>(null)
  const [annotations, setAnnotations] = useState<AnnotationRow[]>([])
  // Whether this visitor left a note on this visit — the CTA reports it so the
  // two kinds of recruit (listened only vs. actually annotated) stay separable.
  const [hasAnnotatedHere, setHasAnnotatedHere] = useState(false)
  /** One play event per visit, not per press of the play button. */
  const playReported = useRef(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [macroFeedback, setMacroFeedback] = useState<{ timestamp: number; type: MacroType } | null>(null)

  const [contributor, setContributor] = useState<Contributor | null>(null)
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const hasAskedForName = useRef(false)

  const audioRef = useRef<HTMLAudioElement>(null)

  // Load project and annotations
  useEffect(() => {
    async function load() {
      try {
        // One call through the RPC: the anon key can't read the tables.
        const loaded = await db.getProjectWithAnnotations(projectId)
        if (!loaded) {
          setError("Project not found")
          return
        }
        setProject(loaded.project)
        setAnnotations(loaded.annotations)
      } catch (err) {
        setError("Failed to load project")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  // Nobody is gated on naming themselves — a visitor gets a Guest identity and
  // starts listening immediately. The name is asked for after the first note.
  useEffect(() => {
    setContributor(ensureContributor())
  }, [])

  useEffect(() => {
    ev("share_link_opened", { projectId })
  }, [projectId])

  const handleContributorSubmit = (c: Contributor) => {
    setContributor(c)
    saveContributor(c)
    setShowNamePrompt(false)
  }

  /** Ask for a name once, after they've actually left something. */
  const maybeAskForName = useCallback(() => {
    if (hasAskedForName.current) return
    hasAskedForName.current = true
    setContributor((current) => {
      if (current && !current.named) setShowNamePrompt(true)
      return current
    })
  }, [])

  // New rows carry storage_path; the older ones only have audio_url and a flat
  // object key that stays where it is.
  // Once the sweep has removed the object there is nothing to point at; the
  // waveform still draws from stored peaks, it just can't be played.
  const audioSrc = project && !project.audio_expired ? db.audioUrlFor(project) : null

  // Peaks stored at upload. When present the page never fetches the audio to
  // draw the waveform — that fetch plus the <audio> source was two full
  // downloads of the same file on every single view.
  const storedPeaks = parsePeaks(project?.peaks)

  // Decode audio for waveform
  const decodeAudioFromUrl = useCallback(async (url: string) => {
    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioContext = new AudioContext()
      const buffer = await audioContext.decodeAudioData(arrayBuffer)
      setAudioBuffer(buffer)
      audioContext.close()
    } catch (err) {
      console.error("Failed to decode audio:", err)
    }
  }, [])

  useEffect(() => {
    // Only projects from before peaks existed need the decode path.
    if (audioSrc && !storedPeaks) {
      decodeAudioFromUrl(audioSrc)
    }
  }, [audioSrc, storedPeaks, decodeAudioFromUrl])

  // Audio events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)
    const handlePlay = () => {
      setIsPlaying(true)
      // Someone opening a link and actually listening is invisible in the
      // database — nothing is written unless they annotate. This is the only
      // record that the other end of the loop ever happened.
      if (!playReported.current) {
        playReported.current = true
        const isCreator = getMyProjects().some((p) => p.id === projectId)
        ev("recipient_played_audio", { projectId, isCreator })
      }
    }
    const handlePause = () => setIsPlaying(false)
    const handleError = () => setIsPlaying(false)


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
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("error", handleError)
    }
    // `loading` belongs in here. The project is set one render before loading
    // flips false (there's an await between the two), so this effect first runs
    // while the page is still showing the spinner and <audio> doesn't exist
    // yet. Without a second run nothing is ever bound: playback works, but the
    // clock, the duration and the moving playhead stay frozen at 0:00.
  }, [audioSrc, loading])

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => setIsPlaying(false))
    }
  }, [isPlaying])

  const handleSeek = (time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setCurrentTime(time)
  }

  const handleSkip = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    const newTime = Math.max(0, Math.min(duration, audio.currentTime + seconds))
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }, [duration])

  useKeyboardControls({ onPlayPause: handlePlayPause, onSkip: handleSkip })

  // Convert annotations to the notes format the waveform expects
  const notesForWaveform = annotations.map((a) => ({
    id: a.id,
    timestamp: a.timestamp,
    text: a.text,
    type: a.type as MacroType | undefined,
    createdAt: new Date(a.created_at),
  }))

  const handleAddNote = async (timestamp: number) => {
    const who = contributor ?? ensureContributor()

    try {
      const row = await db.addAnnotation(
        projectId, timestamp, "", who.name, who.color
      )
      setAnnotations((prev) => [...prev, row].sort((a, b) => a.timestamp - b.timestamp))
      if (!hasAnnotatedHere) ev("first_annotation_created", { projectId, surface: "share", type: "none" })
      ev("annotation_added", { projectId, surface: "share", type: "none" })
      setHasAnnotatedHere(true)
      maybeAskForName()
    } catch (err) {
      console.error("Failed to add annotation:", err)
    }
  }

  const handleMacroTrigger = async (type: MacroType, timestamp: number) => {
    const who = contributor ?? ensureContributor()

    const macroLabels: Record<MacroType, string> = {
      highlight: "🔥",
      issue: "❗ Issue flagged",
      "too-loud": "🔊 Volume too high",
      "too-quiet": "🔉 Volume too low",
      "adjust-levels": "🎚️ Needs level adjustment",
      note: "",
      idea: "",
    }

    try {
      const row = await db.addAnnotation(
        projectId, timestamp, macroLabels[type],
        who.name, who.color, type
      )
      setAnnotations((prev) => [...prev, row].sort((a, b) => a.timestamp - b.timestamp))

      setMacroFeedback({ timestamp, type })
      setTimeout(() => setMacroFeedback(null), 1000)

      if (!hasAnnotatedHere) ev("first_annotation_created", { projectId, surface: "share", type })
      ev("annotation_added", { projectId, surface: "share", type })
      setHasAnnotatedHere(true)
      maybeAskForName()
    } catch (err) {
      console.error("Failed to add annotation:", err)
    }
  }

  const handleUpdateAnnotation = async (id: string, text: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, text } : a))
    )
    try {
      await db.updateAnnotation(id, text)
    } catch (err) {
      console.error("Failed to update:", err)
    }
  }

  const handleDeleteAnnotation = async (id: string) => {
    const previous = annotations
    setAnnotations((prev) => prev.filter((a) => a.id !== id))
    try {
      // Returns false when this browser doesn't hold the note's edit token —
      // the row is untouched, so put the note back rather than leaving the
      // list disagreeing with the database.
      if (!(await db.deleteAnnotation(id))) setAnnotations(previous)
    } catch (err) {
      console.error("Failed to delete:", err)
      setAnnotations(previous)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    )
  }

  // Error state
  if (error || !project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <Image src="/oc-icon-orange.png" alt="OnCue" width={32} height={32} />
        <h1 className="text-lg font-semibold text-foreground">Project not found</h1>
        {/* Audio can expire but a project row never does, so reaching this
            means the id is wrong, not that it timed out. An expired project
            still loads and shows its notes. */}
        <p className="text-sm text-muted-foreground">
          Check that the link is complete — it may have been cut short when it was copied or pasted.
        </p>
        <Link
          href="/"
          className="text-sm text-accent hover:underline"
        >
          Go to OnCue
        </Link>
      </div>
    )
  }

  return (
    /* Chrome stays pinned and only the notes pane scrolls — seeking the
       waveform shouldn't require scrolling back up to find it. */
    <div className="flex h-dvh flex-col overflow-hidden bg-background pb-24 sm:pb-32">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-14 items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image src="/oc-icon-orange.png" alt="OnCue" width={22} height={22} />
              <span className="text-sm font-semibold text-foreground tracking-tight hidden sm:inline">oncue</span>
            </Link>
            <div className="w-px h-5 bg-border/50 hidden sm:block" />
            <h1 className="text-sm text-muted-foreground truncate">{project.name}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              Shared by
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.creator_color }} />
                {project.created_by}
              </span>
            </div>

            {contributor?.named && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: contributor.color }} />
                {contributor.name}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col min-h-0">
        <div className="border-b border-border/50 bg-card/30">
          <WaveformPlayer
            currentTime={currentTime}
            duration={duration}
            notes={notesForWaveform}
            onSeek={handleSeek}
            onAddNote={handleAddNote}
            macroFeedback={macroFeedback}
            audioBuffer={audioBuffer}
            peaks={storedPeaks}
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

        {/* The CTA lives inside the scroll area so it lands at the end of the
            notes rather than adding a second scrollbar to the page. */}
        <div className="flex-1 min-h-0 overflow-auto">
          <SharedNotesList
            annotations={annotations}
            currentTime={currentTime}
            contributorName={contributor?.name ?? ""}
            onNoteClick={(timestamp) => handleSeek(timestamp)}
            onUpdateAnnotation={handleUpdateAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
          />
          {project.audio_expired ? (
            <div className="border-t border-border/50 bg-card/30 px-4 py-6">
              <div className="mx-auto w-full max-w-md space-y-3 text-center">
                <p className="text-sm text-foreground">Audio expired after 30 days of inactivity</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The notes below are all still here. Upload the track again to listen alongside them.
                </p>
                <div className="flex justify-center">
                  <DownloadNotes trackName={project.name} annotations={annotations} />
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t border-border/50 px-4 py-4">
              <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2.5 text-center">
                <p className="text-xs text-muted-foreground/70">
                  This link stays live for 30 days after the last note. Download your notes anytime.
                </p>
                <DownloadNotes trackName={project.name} annotations={annotations} />
              </div>
            </div>
          )}

          <ShareCta projectId={projectId} annotated={hasAnnotatedHere} />
        </div>
      </main>

      <MacroBar currentTime={currentTime} isPlaying={isPlaying} onMacroTrigger={handleMacroTrigger} />

      {showNamePrompt && contributor && (
        <ContributorPrompt
          contributor={contributor}
          onSubmit={handleContributorSubmit}
          onSkip={() => setShowNamePrompt(false)}
        />
      )}

      {/* metadata only: duration is all this needs before someone presses play */}
      <audio ref={audioRef} src={audioSrc ?? undefined} preload="metadata" />
    </div>
  )
}
