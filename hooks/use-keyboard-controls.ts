import { useEffect } from "react"

type KeyboardControlsOptions = {
  onPlayPause: () => void
  onSkip: (seconds: number) => void
}

export function useKeyboardControls({ onPlayPause, onSkip }: KeyboardControlsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      switch (e.code) {
        case "Space":
          e.preventDefault()
          onPlayPause()
          break
        case "ArrowLeft":
          e.preventDefault()
          onSkip(-5)
          break
        case "ArrowRight":
          e.preventDefault()
          onSkip(5)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onPlayPause, onSkip])
}
