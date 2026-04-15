export type MacroType =
  | "highlight"
  | "issue"
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
  createdAt: Date
}
