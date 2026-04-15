"use client"

import { Button } from "@/components/ui/button"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"

type PlaybackControlsProps = {
  isPlaying: boolean
  currentTime: number
  duration: number
  onPlayPause: () => void
  onSkip: (seconds: number) => void
}

export function PlaybackControls({ isPlaying, currentTime, duration, onPlayPause, onSkip }: PlaybackControlsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`
  }

  return (
    <div className="flex items-center justify-between px-4 py-3">
      {/* Time display */}
      <div className="text-sm font-mono text-muted-foreground min-w-[80px]">{formatTime(currentTime)}</div>

      {/* Playback controls */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onSkip(-5)} disabled={currentTime === 0}>
          <SkipBack className="h-4 w-4" />
          <span className="sr-only">Skip back 5 seconds</span>
        </Button>

        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={onPlayPause}>
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
        </Button>

        <Button variant="ghost" size="icon" onClick={() => onSkip(5)} disabled={currentTime >= duration}>
          <SkipForward className="h-4 w-4" />
          <span className="sr-only">Skip forward 5 seconds</span>
        </Button>
      </div>

      {/* Duration display */}
      <div className="text-sm font-mono text-muted-foreground min-w-[80px] text-right">{formatTime(duration)}</div>
    </div>
  )
}
