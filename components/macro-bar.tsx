"use client"

import { useState } from "react"
import { AlertCircle, Volume2, VolumeX, Sliders, Edit, Lightbulb, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MacroType } from "@/lib/types"

export type { MacroType }

type MacroAction = {
  type: MacroType
  label: string
  icon: React.ReactNode
}

type MacroBarProps = {
  currentTime: number
  isPlaying: boolean
  onMacroTrigger: (type: MacroType, timestamp: number) => void
}

const macroActions: MacroAction[] = [
  { type: "highlight", label: "Fire", icon: <Flame className="h-5 w-5" /> },
  { type: "issue", label: "Issue", icon: <AlertCircle className="h-5 w-5" /> },
  { type: "note", label: "Note", icon: <Edit className="h-5 w-5" /> },
  { type: "too-loud", label: "Too Loud", icon: <Volume2 className="h-5 w-5" /> },
  { type: "too-quiet", label: "Too Quiet", icon: <VolumeX className="h-5 w-5" /> },
  { type: "adjust-levels", label: "Levels", icon: <Sliders className="h-5 w-5" /> },
  { type: "idea", label: "Idea", icon: <Lightbulb className="h-5 w-5" /> },
]

export function MacroBar({ currentTime, isPlaying, onMacroTrigger }: MacroBarProps) {
  const [recentTrigger, setRecentTrigger] = useState<MacroType | null>(null)
  const [hoveredAction, setHoveredAction] = useState<MacroType | null>(null)

  const handleMacroClick = (type: MacroType) => {
    onMacroTrigger(type, currentTime)
    setRecentTrigger(type)
    setTimeout(() => setRecentTrigger(null), 600)
  }

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl p-1.5">
        <div className="grid grid-cols-7 gap-1.5">
          {macroActions.map((action) => {
            const isActive = recentTrigger === action.type
            const isHovered = hoveredAction === action.type

            return (
              <button
                key={action.type}
                onClick={() => handleMacroClick(action.type)}
                onMouseEnter={() => setHoveredAction(action.type)}
                onMouseLeave={() => setHoveredAction(null)}
                className={cn(
                  "relative flex items-center justify-center",
                  "w-14 h-14 rounded-lg",
                  "transition-all duration-100 active:scale-90",
                  "bg-secondary/30 hover:bg-secondary/50",
                  isActive && "bg-accent/20 ring-2 ring-accent/60 shadow-[0_0_12px_rgba(255,135,50,0.4)]",
                )}
                aria-label={action.label}
              >
                <span
                  className={cn(
                    "transition-all duration-100 text-foreground",
                    isActive && "text-accent scale-110",
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
