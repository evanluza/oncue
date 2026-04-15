export type MacroType =
  | "highlight"
  | "issue"
  | "voice-note"
  | "too-loud"
  | "too-quiet"
  | "adjust-levels"
  | "note"
  | "idea"

export type Note = {
  id: string
  timestamp: number
  text: string
  type?: MacroType
  audioBlob?: Blob
  createdAt: Date
}
