"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, X } from "lucide-react"
import { getMyProjects, removeMyProject, type MyProject } from "@/lib/my-projects"

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff)) return ""
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/** Lets a creator get back to tracks they've shared. Reads localStorage, so it
 *  renders nothing until mounted. */
export function MyTracks() {
  const [projects, setProjects] = useState<MyProject[] | null>(null)

  useEffect(() => {
    setProjects(getMyProjects())
  }, [])

  if (!projects || projects.length === 0) return null

  const handleRemove = (id: string) => {
    removeMyProject(id)
    setProjects((prev) => (prev ? prev.filter((p) => p.id !== id) : prev))
  }

  return (
    <div className="w-full max-w-md mx-auto mt-10 text-left">
      <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-2.5 px-1">
        Your shared tracks
      </h3>
      <ul className="divide-y divide-border/40 rounded-lg border border-border/40 overflow-hidden bg-card/30">
        {projects.map((p) => (
          <li key={p.id} className="group flex items-center gap-2">
            <Link
              href={`/share/${p.id}`}
              className="flex flex-1 min-w-0 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:bg-muted/40"
            >
              <span className="flex-1 min-w-0 truncate text-sm text-foreground">{p.name}</span>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50">
                {timeAgo(p.sharedAt)}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
            </Link>
            <button
              onClick={() => handleRemove(p.id)}
              aria-label={`Remove ${p.name} from this list`}
              className="shrink-0 mr-2 rounded p-1 text-muted-foreground/30 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
