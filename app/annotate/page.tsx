"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { WaveformPlayer } from "@/components/waveform-player"
import { PlaybackControls } from "@/components/playback-controls"
import { NotesList } from "@/components/notes-list"
import { MacroBar } from "@/components/macro-bar"
import { ContributorPrompt } from "@/components/contributor-prompt"
import { MyTracks } from "@/components/my-tracks"
import { Button } from "@/components/ui/button"
import { Upload, Share2, Check, Copy, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Note, MacroType } from "@/lib/types"
import { ensureContributor, saveContributor } from "@/lib/contributor"
import type { Contributor } from "@/lib/contributor"
import { addMyProject } from "@/lib/my-projects"
import { ev } from "@/lib/analytics"
import { readReferral } from "@/lib/referral"
import { daysSince, getCreator, touchVisit, updateCreator } from "@/lib/identity"
import { PostSharePrompts } from "@/components/post-share-prompts"
import { FeedbackButton } from "@/components/feedback-button"
import { useKeyboardControls } from "@/hooks/use-keyboard-controls"
import * as db from "@/lib/db"

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

/**
 * Clipboard writes are denied more often than you'd think — Safari outside a
 * tight user gesture, embedded webviews, locked-down permissions. This used to
 * throw straight out of the share handler, which skipped the analytics event
 * and left the creator with no link at all. Failure is now just a false.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Voice Memos on iPhone records .m4a, which is how most speaking practice,
 * lesson recordings and phone-captured audio arrive. Rejecting it turned away
 * the exact uploads the tool is best at, silently.
 *
 * Extension is checked alongside MIME type because browsers disagree about
 * m4a: Chrome reports audio/mp4, Safari audio/x-m4a, and a file dragged from
 * some sources arrives with an empty type.
 */
const ACCEPTED_TYPES = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
])
const ACCEPTED_EXTENSIONS = [".wav", ".mp3", ".m4a", ".aac", ".mp4"]

function fileExtension(name: string) {
  const i = name.lastIndexOf(".")
  return i === -1 ? "" : name.slice(i).toLowerCase()
}

function isAudioFile(file: File) {
  return ACCEPTED_TYPES.has(file.type) || ACCEPTED_EXTENSIONS.includes(fileExtension(file.name))
}

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
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
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [macroFeedback, setMacroFeedback] = useState<{ timestamp: number; type: MacroType } | null>(null)

  // Contributor & project state
  const [contributor, setContributor] = useState<Contributor | null>(null)
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const hasAskedForName = useRef(false)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  /** Clipboard denied — the link has to be visible or the track is lost. */
  const [copyFailed, setCopyFailed] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Start with a Guest identity rather than a name form — the upload screen is
  // the first thing anyone should see.
  useEffect(() => {
    setContributor(ensureContributor())
  }, [])

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

      // The upload is only real once the audio actually decoded: upload_started
      // counts attempts, this counts tracks that made it into the workspace.
      const before = getCreator()
      const isRepeat = before.uploadCount > 0
      ev("track_uploaded", {
        durationSec: Math.round(buffer.duration),
        referral: referral.current,
        useCase: before.useCase,
        uploadIndex: before.uploadCount + 1,
        creatorId: before.id,
      })
      if (isRepeat) {
        ev("repeat_upload", {
          daysSincePreviousUpload: daysSince(before.lastUploadAt),
          previousTrackId: before.lastProjectId,
          useCase: before.useCase,
          uploadIndex: before.uploadCount + 1,
          creatorId: before.id,
        })
      }
      updateCreator({ uploadCount: before.uploadCount + 1, lastUploadAt: new Date().toISOString() })
    } catch (err) {
      console.error("Failed to decode audio:", err)
    } finally {
      setIsDecoding(false)
    }
  }, [])

  // Read once on mount: were they sent here from someone else's share link?
  // Recorded as a prop on the funnel events rather than in the database — it
  // answers "does the loop recruit?", not "who is this person?".
  const referral = useRef<string>("direct")
  const referredFrom = useRef<string | null>(null)
  // A returning creator: someone who has uploaded before and is arriving after
  // a gap, not clicking around in one sitting.
  useEffect(() => {
    const { returning, creator } = touchVisit()
    if (!returning) return
    ev("creator_returned", {
      daysSinceLastUpload: daysSince(creator.lastUploadAt),
      uploadsSoFar: creator.uploadCount,
      useCase: creator.useCase,
      creatorId: creator.id,
    })
  }, [])

  useEffect(() => {
    const found = readReferral(window.location.search)
    if (!found) return
    referral.current = "share"
    if (found.fromProjectId) referredFrom.current = found.fromProjectId
    // Keep the address bar (and any copy/paste of it) clean.
    window.history.replaceState(null, "", "/annotate")
  }, [])

  /** Reset per loaded track by loadFile, so each track reports its own first note. */
  const firstNoteFired = useRef(false)

  const loadFile = useCallback((file: File) => {
    setUploadError(null)

    if (!isAudioFile(file)) {
      // Rejections were invisible before this: a blocked upload left no trace
      // anywhere, so a format everyone records in could fail for months.
      ev("upload_rejected", { reason: "format", ext: fileExtension(file.name) || "none", mime: file.type || "none" })
      setUploadError("That file type isn't supported. Try .mp3, .wav or .m4a.")
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      ev("upload_rejected", { reason: "size", sizeMb: Math.round((file.size / (1024 * 1024)) * 10) / 10 })
      setUploadError(`File is ${formatFileSize(file.size)}. Max size is 25MB — try a compressed .mp3.`)
      return
    }

    ev("upload_started", {
      sizeMb: Math.round((file.size / (1024 * 1024)) * 10) / 10,
      referral: referral.current,
      referredFrom: referredFrom.current,
    })

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
    firstNoteFired.current = false
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
    if (!rawFile) return
    const who = contributor ?? ensureContributor()

    if (shareUrl) {
      const ok = await copyToClipboard(shareUrl)
      setCopyFailed(!ok)
      if (ok) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
      return
    }

    ev("share_clicked", { noteCount: notes.length })
    setIsSharing(true)
    try {
      const project = await db.createProject(
        fileName,
        rawFile,
        who.name,
        who.color
      )
      setProjectId(project.id)

      for (const note of notes) {
        await db.addAnnotation(
          project.id,
          note.timestamp,
          note.text,
          who.name,
          who.color,
          note.type
        )
      }

      // Without accounts, this list is the creator's only route back to the
      // feedback once the tab is closed.
      addMyProject({ id: project.id, name: fileName, sharedAt: new Date().toISOString() })

      const url = `${window.location.origin}/share/${project.id}`
      setShareUrl(url)

      const copiedOk = await copyToClipboard(url)
      setCopyFailed(!copiedOk)
      if (copiedOk) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }

      const creator = updateCreator({ lastProjectId: project.id })
      ev("track_shared", {
        projectId: project.id,
        noteCount: notes.length,
        referral: referral.current,
        useCase: creator.useCase,
        uploadIndex: creator.uploadCount,
        creatorId: creator.id,
        clipboard: copiedOk,
      })
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

  const noteFirstAnnotation = (type: string) => {
    if (firstNoteFired.current) return
    firstNoteFired.current = true
    const creator = getCreator()
    ev("first_annotation_created", {
      surface: "annotate",
      type,
      useCase: creator.useCase,
      uploadIndex: creator.uploadCount,
      creatorId: creator.id,
    })
  }

  const handleAddNote = async (timestamp: number) => {
    const newNote: Note = {
      id: Date.now().toString(),
      timestamp,
      text: "",
      createdAt: new Date(),
    }
    setNotes((prev) => [...prev, newNote].sort((a, b) => a.timestamp - b.timestamp))
    noteFirstAnnotation("none")
    ev("annotation_added", { surface: "annotate", type: "none" })
    maybeAskForName()

    if (projectId) {
      const who = contributor ?? ensureContributor()
      try {
        const row = await db.addAnnotation(
          projectId, timestamp, "", who.name, who.color
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

    noteFirstAnnotation(type)
    ev("annotation_added", { surface: "annotate", type })
    maybeAskForName()

    if (projectId) {
      const who = contributor ?? ensureContributor()
      try {
        const row = await db.addAnnotation(
          projectId, timestamp, macroLabels[type],
          who.name, who.color, type
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

  const namePrompt = showNamePrompt && contributor && (
    <ContributorPrompt
      contributor={contributor}
      onSubmit={handleContributorSubmit}
      onSkip={() => setShowNamePrompt(false)}
    />
  )

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
            {contributor?.named && (
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
                Drag and drop a .mp3, .wav or .m4a, or click below to browse.
              </p>
              <p className="text-[11px] text-muted-foreground/50">Max file size: 25MB</p>
            </div>
            {uploadError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {uploadError}
              </div>
            )}
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
              accept=".wav,.mp3,.m4a,.aac,.mp4,audio/wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac"
              onChange={handleFileUpload}
              className="hidden"
            />

            <MyTracks />

            <FeedbackButton className="pt-2" />
          </div>
        </div>

        {namePrompt}
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
            {contributor?.named && (
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
              accept=".wav,.mp3,.m4a,.aac,.mp4,audio/wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac"
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
          {shareUrl && copyFailed && (
            <div className="border-t border-border/50 bg-card/40 px-4 py-4">
              <div className="mx-auto w-full max-w-md space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  Your browser blocked the copy — here&apos;s the link:
                </p>
                <input
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Share link"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                />
              </div>
            </div>
          )}

          {/* Only after a link exists, and never in the way of it. */}
          {projectId && shareUrl && <PostSharePrompts projectId={projectId} />}
        </div>
      </main>

      <MacroBar currentTime={currentTime} isPlaying={isPlaying} onMacroTrigger={handleMacroTrigger} />

      {namePrompt}

      <audio ref={audioRef} src={audioFile} />
    </div>
  )
}
