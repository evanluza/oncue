"use client"

import type React from "react"

import { useRef, useEffect, useMemo, useCallback } from "react"
import { Loader2 } from "lucide-react"
import type { Note, MacroType } from "@/lib/types"

type WaveformPlayerProps = {
  currentTime: number
  duration: number
  notes: Note[]
  onSeek: (time: number) => void
  onAddNote: (timestamp: number) => void
  macroFeedback?: { timestamp: number; type: MacroType } | null
  audioBuffer?: AudioBuffer | null
  isDecoding?: boolean
}

function computeWaveformData(audioBuffer: AudioBuffer, barCount: number): number[] {
  const channelData = audioBuffer.getChannelData(0)
  const samplesPerBar = Math.floor(channelData.length / barCount)
  const bars: number[] = []

  for (let i = 0; i < barCount; i++) {
    let sum = 0
    const start = i * samplesPerBar
    const end = Math.min(start + samplesPerBar, channelData.length)

    for (let j = start; j < end; j++) {
      sum += Math.abs(channelData[j])
    }

    bars.push(sum / (end - start))
  }

  const max = Math.max(...bars, 0.001)
  return bars.map((b) => b / max)
}

function generateFallbackBars(barCount: number): number[] {
  return Array.from({ length: barCount }, (_, i) => {
    return Math.abs(Math.sin(i * 0.2) * 0.3 + Math.cos(i * 0.1) * 0.2 + Math.sin(i * 0.05) * 0.5) * 0.8 + 0.05
  })
}

export function WaveformPlayer({
  currentTime,
  duration,
  notes,
  onSeek,
  onAddNote,
  macroFeedback,
  audioBuffer,
  isDecoding,
}: WaveformPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const BAR_COUNT = 160

  const waveformData = useMemo(() => {
    if (audioBuffer) {
      return computeWaveformData(audioBuffer, BAR_COUNT)
    }
    return generateFallbackBars(BAR_COUNT)
  }, [audioBuffer, BAR_COUNT])

  // Handle resize
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, rect.height)

    const barWidth = rect.width / BAR_COUNT
    const gap = Math.max(1, barWidth * 0.15)
    const progress = duration > 0 ? currentTime / duration : 0
    const maxBarHeight = rect.height * 0.85
    const centerY = rect.height / 2

    for (let i = 0; i < BAR_COUNT; i++) {
      const amplitude = waveformData[i]
      const h = Math.max(2, amplitude * maxBarHeight)
      const x = i * barWidth
      const y = centerY - h / 2
      const barProgress = i / BAR_COUNT

      ctx.fillStyle = barProgress <= progress
        ? "oklch(0.50 0.13 45)"
        : "oklch(0.68 0.18 45)"

      const w = barWidth - gap
      const radius = Math.min(w / 2, 1.5)
      ctx.beginPath()
      ctx.roundRect(x, y, w, h, radius)
      ctx.fill()
    }

    if (duration > 0) {
      notes.forEach((note) => {
        const x = (note.timestamp / duration) * rect.width

        ctx.strokeStyle = "oklch(1 0 0 / 0.25)"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, centerY - maxBarHeight * 0.45)
        ctx.lineTo(x, centerY + maxBarHeight * 0.45)
        ctx.stroke()

        ctx.fillStyle = "oklch(1 0 0 / 0.9)"
        ctx.beginPath()
        ctx.arc(x, 8, 3.5, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    if (macroFeedback && duration > 0) {
      const x = (macroFeedback.timestamp / duration) * rect.width

      ctx.strokeStyle = "oklch(0.68 0.18 45 / 0.6)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, centerY, 14, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = "oklch(0.68 0.18 45)"
      ctx.beginPath()
      ctx.arc(x, centerY, 5, 0, Math.PI * 2)
      ctx.fill()
    }

    if (duration > 0) {
      const playheadX = progress * rect.width

      ctx.strokeStyle = "oklch(1 0 0 / 0.8)"
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, rect.height)
      ctx.stroke()

      ctx.fillStyle = "oklch(1 0 0)"
      ctx.beginPath()
      ctx.moveTo(playheadX - 4, 0)
      ctx.lineTo(playheadX + 4, 0)
      ctx.lineTo(playheadX, 5)
      ctx.closePath()
      ctx.fill()
    }
  }, [currentTime, duration, notes, macroFeedback, waveformData, BAR_COUNT])

  useEffect(() => {
    draw()
  }, [draw])

  // Resize observer for responsive canvas
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => draw())
    observer.observe(container)
    return () => observer.disconnect()
  }, [draw])

  const getTimeFromX = (clientX: number) => {
    const canvas = canvasRef.current
    if (!canvas || duration === 0) return null
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    return (x / rect.width) * duration
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const clickedTime = getTimeFromX(e.clientX)
    if (clickedTime === null) return

    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left

    const clickedNote = notes.find((note) => {
      const noteX = (note.timestamp / duration) * rect.width
      return Math.abs(noteX - x) < 10
    })

    if (clickedNote) {
      onSeek(clickedNote.timestamp)
    } else if (e.altKey || e.shiftKey) {
      onAddNote(clickedTime)
    } else {
      onSeek(clickedTime)
    }
  }

  // Touch: tap to seek
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.changedTouches.length === 0) return
    const touch = e.changedTouches[0]
    const time = getTimeFromX(touch.clientX)
    if (time !== null) onSeek(time)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="relative px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3">
      <div className="mb-1.5 flex items-center justify-between text-[10px] text-muted-foreground/50 font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div ref={containerRef} className="relative rounded-lg bg-secondary/10 overflow-hidden border border-border/20">
        {isDecoding && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-24 sm:h-36 cursor-crosshair touch-none"
          onClick={handleCanvasClick}
          onTouchEnd={handleTouchEnd}
        />
      </div>
    </div>
  )
}
