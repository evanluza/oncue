const STORAGE_KEY = "oncue_contributor"

const COLORS = [
  "#F4845F", // coral orange
  "#7EC8E3", // sky blue
  "#C3E88D", // lime green
  "#C792EA", // lavender
  "#F78C6C", // peach
  "#82AAFF", // periwinkle
  "#FFCB6B", // gold
  "#89DDFF", // cyan
  "#FF5370", // rose
  "#A8E6CF", // mint
]

export type Contributor = {
  name: string
  color: string
}

export function getContributor(): Contributor | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveContributor(contributor: Contributor) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contributor))
}

export function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

export { COLORS }
