"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Mic, AlertCircle, Volume2, VolumeX, Sliders, Edit, Lightbulb, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MacroType } from "@/lib/types"

export type { MacroType }

type MacroAction = {
  type: MacroType
  label: string
  icon: React.ReactNode
  color: string
}

type MacroBarProps = {
  currentTime: number
  isPlaying: boolean
  onMacroTrigger: (type: MacroType, timestamp: number, audioBlob?: Blob) => void
}

const macroActions: MacroAction[] = [
  {
    type: "highlight",
    label: "Fire",
    icon: <Flame className="h-5 w-5" />,
    color: "text-foreground",
  },
  {
    type: "issue",
    label: "Issue",
    icon: <AlertCircle className="h-5 w-5" />,
    color: "text-foreground",
  },
  {
    type: "voice-note",
    label: "Voice",
    icon: <Mic className="h-5 w-5" />,
    color: "text-foreground",
  },
  {
    type: "note",
    label: "Note",
    icon: <Edit className="h-5 w-5" />,
    color: "text-foreground",
  },
  {
    type: "too-loud",
    label: "Too Loud",
    icon: <Volume2 className="h-5 w-5" />,
    color: "text-foreground",
  },
  {
    type: "too-quiet",
    label: "Too Quiet",
    icon: <VolumeX className="h-5 w-5" />,
    color: "text-foreground",
  },
  {
    type: "adjust-levels",
    label: "Levels",
    icon: <Sliders className="h-5 w-5" />,
    color: "text-foreground",
  },
  {
    type: "idea",
    label: "Idea",
    icon: <Lightbulb className="h-5 w-5" />,
    color: "text-foreground",
  },
]

export function MacroBar({ currentTime, isPlaying, onMacroTrigger }: MacroBarProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState(0)
  const [recentTrigger, setRecentTrigger] = useState<MacroType | null>(null)
  const [hoveredAction, setHoveredAction] = useState<MacroType | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Start voice recording
  const startRecording = async (timestamp: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        onMacroTrigger("voice-note", recordingStartTime, audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingStartTime(timestamp)
    } catch (error) {
      console.error("Failed to start recording:", error)
    }
  }

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Handle macro button click
  const handleMacroClick = (type: MacroType) => {
    if (type === "voice-note") {
      if (isRecording) {
        stopRecording()
      } else {
        startRecording(currentTime)
      }
    } else {
      onMacroTrigger(type, currentTime)

      setRecentTrigger(type)
      setTimeout(() => setRecentTrigger(null), 600)
    }
  }

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl p-1.5">
        {isRecording && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          </div>
        )}

        <div className="grid grid-cols-4 gap-1.5">
          {macroActions.map((action) => {
            const isActive = recentTrigger === action.type
            const isVoiceRecording = isRecording && action.type === "voice-note"
            const isHovered = hoveredAction === action.type

            return (
              <button
                key={action.type}
                onClick={() => handleMacroClick(action.type)}
                onMouseEnter={() => setHoveredAction(action.type)}
                onMouseLeave={() => setHoveredAction(null)}
                onTouchStart={() => setHoveredAction(action.type)}
                onTouchEnd={() => setHoveredAction(null)}
                className={cn(
                  "relative flex items-center justify-center",
                  "w-14 h-14 rounded-lg",
                  "transition-all duration-100 active:scale-90",
                  "bg-secondary/30 hover:bg-secondary/50",
                  isActive && "bg-accent/20 ring-2 ring-accent/60 shadow-[0_0_12px_rgba(255,135,50,0.4)]",
                  isVoiceRecording && "bg-accent/20 ring-2 ring-accent animate-pulse",
                )}
                aria-label={action.label}
              >
                <span
                  className={cn(
                    "transition-all duration-100",
                    isActive || isVoiceRecording ? "text-accent" : action.color,
                    isActive && "scale-110",
                  )}
                >
                  {action.icon}
                </span>

                {isHovered && (
                  <div className="absolute bottom-full mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-100 pointer-events-none border border-border/50">
                    {action.label}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
