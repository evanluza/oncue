"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { WaveformPlayer } from "@/components/waveform-player"
import { PlaybackControls } from "@/components/playback-controls"
import { NotesList } from "@/components/notes-list"
import { MacroBar } from "@/components/macro-bar"
import { ContributorPrompt } from "@/components/contributor-prompt"
import { Button } from "@/components/ui/button"
import { Upload, Share2, Check, Copy, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Note, MacroType } from "@/lib/types"
import { getContributor, saveContributor } from "@/lib/contributor"
import type { Contributor } from "@/lib/contributor"
import { useKeyboardControls } from "@/hooks/use-keyboard-controls"
import * as db from "@/lib/db"

function isAudioFile(file: File) {
  return file.type === "audio/wav" || file.type === "audio/mpeg"
}

export default function AnnotatePage() {
  const [audioFile, setAudioFile] = useState<string | null>(null)
  const [rawFile, setRawFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [isDecoding, setIsDecoding] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const [macroFeedback, setMacroFeedback] = useState<{ timestamp: number; type: MacroType } | null>(null)

  // Contributor & project state
  const [contributor, setContributor] = useState<Contributor | null>(null)
  const [showContributorPrompt, setShowContributorPrompt] = useState(false)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load contributor on mount
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
  }, [audioFile])

  const decodeAudio = useCallback(async (file: File) => {
    setIsDecoding(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const audioContext = new AudioContext()
      const buffer = await audioContext.decodeAudioData(arrayBuffer)
      setAudioBuffer(buffer)
      audioContext.close()
    } catch (err) {
      console.error("Failed to decode audio:", err)
    } finally {
      setIsDecoding(false)
    }
  }, [])

  const loadFile = useCallback((file: File) => {
    if (!isAudioFile(file)) return
    const url = URL.createObjectURL(file)
    setAudioFile(url)
    setRawFile(file)
    setFileName(file.name)
    setNotes([])
    setCurrentTime(0)
    setIsPlaying(false)
    setAudioBuffer(null)
    setProjectId(null)
    setShareUrl(null)
    decodeAudio(file)
  }, [decodeAudio])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }

  const handleShare = async () => {
    if (!rawFile || !contributor) return
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return
    }

    setIsSharing(true)
    try {
      const project = await db.createProject(
        fileName,
        rawFile,
        contributor.name,
        contributor.color
      )
      setProjectId(project.id)

      for (const note of notes) {
        await db.addAnnotation(
          project.id,
          note.timestamp,
          note.text,
          contributor.name,
          contributor.color,
          note.type
        )
      }

      const url = `${window.location.origin}/share/${project.id}`
      setShareUrl(url)
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Share failed:", err)
    } finally {
      setIsSharing(false)
    }
  }

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audioFile) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => setIsPlaying(false))
    }
  }, [audioFile, isPlaying])

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

  // Keyboard: spacebar, arrow keys
  useKeyboardControls({ onPlayPause: handlePlayPause, onSkip: handleSkip })

  const handleAddNote = async (timestamp: number) => {
    const newNote: Note = {
      id: Date.now().toString(),
      timestamp,
      text: "",
      createdAt: new Date(),
    }
    setNotes((prev) => [...prev, newNote].sort((a, b) => a.timestamp - b.timestamp))

    if (projectId && contributor) {
      try {
        const row = await db.addAnnotation(
          projectId, timestamp, "", contributor.name, contributor.color
        )
        setNotes((prev) =>
          prev.map((n) => (n.id === newNote.id ? { ...n, id: row.id } : n))
        )
      } catch (err) {
        console.error("Failed to sync annotation:", err)
      }
    }
  }

  const handleMacroTrigger = async (type: MacroType, timestamp: number) => {
    const macroLabels: Record<MacroType, string> = {
      highlight: "🔥",
      issue: "❗ Issue flagged",
      "too-loud": "🔊 Volume too high",
      "too-quiet": "🔉 Volume too low",
      "adjust-levels": "🎚️ Needs level adjustment",
      note: "",
      idea: "",
    }

    const newNote: Note = {
      id: Date.now().toString(),
      timestamp,
      text: macroLabels[type],
      type,
      createdAt: new Date(),
    }

    setNotes((prev) => [...prev, newNote].sort((a, b) => a.timestamp - b.timestamp))

    setMacroFeedback({ timestamp, type })
    setTimeout(() => setMacroFeedback(null), 1000)

    if (projectId && contributor) {
      try {
        const row = await db.addAnnotation(
          projectId, timestamp, macroLabels[type],
          contributor.name, contributor.color, type
        )
        setNotes((prev) =>
          prev.map((n) => (n.id === newNote.id ? { ...n, id: row.id } : n))
        )
      } catch (err) {
        console.error("Failed to sync annotation:", err)
      }
    }
  }

  const handleUpdateNote = async (id: string, text: string) => {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, text } : note)))

    if (projectId) {
      try {
        await db.updateAnnotation(id, text)
      } catch (err) {
        console.error("Failed to update annotation:", err)
      }
    }
  }

  const handleDeleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id))

    if (projectId) {
      try {
        await db.deleteAnnotation(id)
      } catch (err) {
        console.error("Failed to delete annotation:", err)
      }
    }
  }

  const handleNoteClick = (timestamp: number) => {
    handleSeek(timestamp)
  }

  // Contributor prompt overlay
  if (showContributorPrompt) {
    return <ContributorPrompt onSubmit={handleContributorSubmit} />
  }

  if (!audioFile) {
    return (
      <div
        className="flex min-h-dvh flex-col bg-background"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <header className="border-b border-border/50">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/oc-icon-orange.png" alt="OnCue" width={24} height={24} />
              <span className="text-sm font-semibold text-foreground tracking-tight">oncue</span>
            </Link>
            {contributor && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: contributor.color }} />
                {contributor.name}
              </div>
            )}
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="max-w-md text-center space-y-6">
            <div
              className={`mx-auto w-20 h-20 rounded-2xl border flex items-center justify-center transition-all ${
                isDragging
                  ? "bg-accent/20 border-accent scale-110"
                  : "bg-accent/10 border-accent/20"
              }`}
            >
              <Upload className="h-8 w-8 text-accent" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                {isDragging ? "Drop it here" : "Upload an audio file"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Drag and drop a .wav or .mp3, or click below to browse.
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 h-11 px-6"
            >
              <Upload className="h-4 w-4" />
              Choose Audio File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,.mp3,audio/wav,audio/mpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-24 sm:pb-32">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-14 items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image src="/oc-icon-orange.png" alt="OnCue" width={22} height={22} />
              <span className="text-sm font-semibold text-foreground tracking-tight hidden sm:inline">oncue</span>
            </Link>
            <div className="w-px h-5 bg-border/50 hidden sm:block" />
            <h1 className="text-sm text-muted-foreground truncate">{fileName}</h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {contributor && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground mr-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: contributor.color }} />
                {contributor.name}
              </div>
            )}

            <Button
              variant={shareUrl ? "ghost" : "default"}
              size="sm"
              onClick={handleShare}
              disabled={isSharing}
              className={shareUrl
                ? "gap-1.5 text-muted-foreground hover:text-foreground"
                : "gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
              }
            >
              {isSharing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : copied ? (
                <Check className="h-4 w-4" />
              ) : shareUrl ? (
                <Copy className="h-4 w-4" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isSharing ? "Sharing..." : copied ? "Copied!" : shareUrl ? "Copy Link" : "Share"}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,.mp3,audio/wav,audio/mpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="border-b border-border/50 bg-card/30">
          <WaveformPlayer
            currentTime={currentTime}
            duration={duration}
            notes={notes}
            onSeek={handleSeek}
            onAddNote={handleAddNote}
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
            onNoteClick={handleNoteClick}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
          />
        </div>
      </main>

      <MacroBar currentTime={currentTime} isPlaying={isPlaying} onMacroTrigger={handleMacroTrigger} />

      <audio ref={audioRef} src={audioFile} />
    </div>
  )
}
