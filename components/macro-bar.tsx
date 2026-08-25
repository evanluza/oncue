"use client"

import { useState } from "react"
import { Edit, Lightbulb, Flame } from "lucide-react"
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

// Trimmed from seven to three on the strength of 538 real annotations: Note,
// Fire and Idea accounted for 99.6% of them. Issue, Levels, Too Loud and Too
// Quiet had four uses between them. MacroType still carries the retired values
// so existing annotations keep rendering.
const macroActions: MacroAction[] = [
  { type: "note", label: "Note", icon: <Edit className="h-5 w-5" /> },
  { type: "highlight", label: "Fire", icon: <Flame className="h-5 w-5" /> },
  { type: "idea", label: "Idea", icon: <Lightbulb className="h-5 w-5" /> },
]

export function MacroBar({ currentTime, isPlaying, onMacroTrigger }: MacroBarProps) {
  const [recentTrigger, setRecentTrigger] = useState<MacroType | null>(null)

  const handleMacroClick = (type: MacroType) => {
    onMacroTrigger(type, currentTime)
    setRecentTrigger(type)
    setTimeout(() => setRecentTrigger(null), 600)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:bottom-5 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
      <div className="bg-card/95 backdrop-blur-md border-t border-border/50 sm:border sm:rounded-2xl shadow-2xl p-1.5 sm:p-1.5 safe-bottom">
        <div className="flex gap-1.5 sm:gap-2 justify-center">
          {macroActions.map((action) => {
            const isActive = recentTrigger === action.type

            return (
              <button
                key={action.type}
                onClick={() => handleMacroClick(action.type)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5",
                  "w-20 h-14 sm:w-16 sm:h-14 rounded-lg shrink-0",
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
                <span className="text-[10px] text-muted-foreground/60 leading-none">
                  {action.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
