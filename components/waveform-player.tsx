"use client"

import type React from "react"

import { useRef, useEffect, useMemo } from "react"
import type { Note, MacroType } from "@/lib/types"

type WaveformPlayerProps = {
  currentTime: number
  duration: number
  notes: Note[]
  onSeek: (time: number) => void
  onAddNote: (timestamp: number) => void
  macroFeedback?: { timestamp: number; type: MacroType } | null
  audioBuffer?: AudioBuffer | null
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

  // Normalize to 0-1
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
}: WaveformPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const BAR_COUNT = 160

  const waveformData = useMemo(() => {
    if (audioBuffer) {
      return computeWaveformData(audioBuffer, BAR_COUNT)
    }
    return generateFallbackBars(BAR_COUNT)
  }, [audioBuffer, BAR_COUNT])

  useEffect(() => {
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
    const gap = 1.5
    const progress = duration > 0 ? currentTime / duration : 0
    const maxBarHeight = rect.height * 0.85
    const centerY = rect.height / 2

    // Draw bars
    for (let i = 0; i < BAR_COUNT; i++) {
      const amplitude = waveformData[i]
      const h = Math.max(2, amplitude * maxBarHeight)
      const x = i * barWidth
      const y = centerY - h / 2
      const barProgress = i / BAR_COUNT

      if (barProgress <= progress) {
        ctx.fillStyle = "oklch(0.50 0.13 45)"
      } else {
        ctx.fillStyle = "oklch(0.68 0.18 45)"
      }

      const w = barWidth - gap
      const radius = Math.min(w / 2, 1.5)
      ctx.beginPath()
      ctx.roundRect(x, y, w, h, radius)
      ctx.fill()
    }

    // Draw note markers
    if (duration > 0) {
      notes.forEach((note) => {
        const x = (note.timestamp / duration) * rect.width

        // Vertical line
        ctx.strokeStyle = "oklch(1 0 0 / 0.25)"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, centerY - maxBarHeight * 0.45)
        ctx.lineTo(x, centerY + maxBarHeight * 0.45)
        ctx.stroke()

        // Dot
        ctx.fillStyle = "oklch(1 0 0 / 0.9)"
        ctx.beginPath()
        ctx.arc(x, 8, 3.5, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Macro feedback
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

    // Playhead
    if (duration > 0) {
      const playheadX = progress * rect.width

      ctx.strokeStyle = "oklch(1 0 0 / 0.8)"
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, rect.height)
      ctx.stroke()

      // Playhead top indicator
      ctx.fillStyle = "oklch(1 0 0)"
      ctx.beginPath()
      ctx.moveTo(playheadX - 4, 0)
      ctx.lineTo(playheadX + 4, 0)
      ctx.lineTo(playheadX, 5)
      ctx.closePath()
      ctx.fill()
    }
  }, [currentTime, duration, notes, macroFeedback, waveformData, BAR_COUNT])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || duration === 0) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clickedTime = (x / rect.width) * duration

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="relative px-4 pt-4 pb-3">
      <div className="mb-1.5 flex items-center justify-between text-[10px] text-muted-foreground/50 font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="relative rounded-lg bg-secondary/10 overflow-hidden border border-border/20">
        <canvas ref={canvasRef} className="w-full h-36 cursor-crosshair" onClick={handleCanvasClick} />
      </div>
    </div>
  )
}
