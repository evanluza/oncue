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

export const GUEST_NAME = "Guest"

export type Contributor = {
  name: string
  color: string
  /** False until the person has actually chosen a name for themselves. */
  named: boolean
}

export function getContributor(): Contributor | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.name || !parsed?.color) return null
    // Contributors saved before the name prompt became optional had to type a
    // name to get in, so treat them as already named.
    return { name: parsed.name, color: parsed.color, named: parsed.named ?? true }
  } catch {
    return null
  }
}

export function saveContributor(contributor: Contributor) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contributor))
}

/**
 * Always returns someone to annotate as. Nobody is ever blocked on naming
 * themselves — an unnamed visitor gets a stable Guest identity and a color, and
 * can put a real name to it later.
 */
export function ensureContributor(): Contributor {
  const existing = getContributor()
  if (existing) return existing

  const guest: Contributor = { name: GUEST_NAME, color: getRandomColor(), named: false }
  saveContributor(guest)
  return guest
}

export function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

export { COLORS }
