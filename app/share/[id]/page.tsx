"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { WaveformPlayer } from "@/components/waveform-player"
import { PlaybackControls } from "@/components/playback-controls"
import { SharedNotesList } from "@/components/shared-notes-list"
import { MacroBar } from "@/components/macro-bar"
import { ContributorPrompt } from "@/components/contributor-prompt"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { MacroType } from "@/lib/types"
import { getContributor, saveContributor } from "@/lib/contributor"
import type { Contributor } from "@/lib/contributor"
import * as db from "@/lib/db"
import type { AnnotationRow, ProjectRow } from "@/lib/db"

export default function SharePage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<ProjectRow | null>(null)
  const [annotations, setAnnotations] = useState<AnnotationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [macroFeedback, setMacroFeedback] = useState<{ timestamp: number; type: MacroType } | null>(null)

  const [contributor, setContributor] = useState<Contributor | null>(null)
  const [showContributorPrompt, setShowContributorPrompt] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)

  // Load project and annotations
  useEffect(() => {
    async function load() {
      try {
        const proj = await db.getProject(projectId)
        if (!proj) {
          setError("Project not found")
          return
        }
        setProject(proj)

        const annots = await db.getAnnotations(projectId)
        setAnnotations(annots)
      } catch (err) {
        setError("Failed to load project")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  // Load contributor
  useEffect(() => {
    const saved = getContributor()
    if (saved) setContributor(saved)
    else setShowContributorPrompt(true)
  }, [])

  const handleContributorSubmit = (c: Contributor) => {
    setContributor(c)
    saveContributor(c)
    setShowContributorPrompt(false)
  }

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
    if (project?.audio_url) {
      decodeAudioFromUrl(project.audio_url)
    }
  }, [project?.audio_url, decodeAudioFromUrl])

  // Audio events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleError = () => setIsPlaying(false)

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
  }, [project?.audio_url])

  const handlePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => setIsPlaying(false))
    }
  }

  const handleSeek = (time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setCurrentTime(time)
  }

  const handleSkip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Convert annotations to the notes format the waveform expects
  const notesForWaveform = annotations.map((a) => ({
    id: a.id,
    timestamp: a.timestamp,
    text: a.text,
    type: a.type as MacroType | undefined,
    createdAt: new Date(a.created_at),
  }))

  const handleAddNote = async (timestamp: number) => {
    if (!contributor) return

    try {
      const row = await db.addAnnotation(
        projectId, timestamp, "", contributor.name, contributor.color
      )
      setAnnotations((prev) => [...prev, row].sort((a, b) => a.timestamp - b.timestamp))
    } catch (err) {
      console.error("Failed to add annotation:", err)
    }
  }

  const handleMacroTrigger = async (type: MacroType, timestamp: number) => {
    if (!contributor) return

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
        contributor.name, contributor.color, type
      )
      setAnnotations((prev) => [...prev, row].sort((a, b) => a.timestamp - b.timestamp))

      setMacroFeedback({ timestamp, type })
      setTimeout(() => setMacroFeedback(null), 1000)
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
    setAnnotations((prev) => prev.filter((a) => a.id !== id))
    try {
      await db.deleteAnnotation(id)
    } catch (err) {
      console.error("Failed to delete:", err)
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
        <p className="text-sm text-muted-foreground">This link may have expired or the project was deleted.</p>
        <Link
          href="/"
          className="text-sm text-accent hover:underline"
        >
          Go to OnCue
        </Link>
      </div>
    )
  }

  // Contributor prompt
  if (showContributorPrompt) {
    return <ContributorPrompt onSubmit={handleContributorSubmit} />
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-32">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/oc-icon-orange.png" alt="OnCue" width={22} height={22} />
              <span className="text-sm font-semibold text-foreground tracking-tight">oncue</span>
            </Link>
            <div className="w-px h-5 bg-border/50" />
            <h1 className="text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-none">{project.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              Shared by
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.creator_color }} />
                {project.created_by}
              </span>
            </div>

            {contributor && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: contributor.color }} />
                {contributor.name}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="border-b border-border/50 bg-card/30">
          <WaveformPlayer
            currentTime={currentTime}
            duration={duration}
            notes={notesForWaveform}
            onSeek={handleSeek}
            onAddNote={handleAddNote}
            macroFeedback={macroFeedback}
            audioBuffer={audioBuffer}
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
          <SharedNotesList
            annotations={annotations}
            currentTime={currentTime}
            contributorName={contributor?.name ?? ""}
            onNoteClick={(timestamp) => handleSeek(timestamp)}
            onUpdateAnnotation={handleUpdateAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
          />
        </div>
      </main>

      <MacroBar currentTime={currentTime} isPlaying={isPlaying} onMacroTrigger={handleMacroTrigger} />

      <audio ref={audioRef} src={project.audio_url} />
    </div>
  )
}
