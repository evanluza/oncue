const STORAGE_KEY = "oncue_my_projects"
const MAX_TRACKED = 20

export type MyProject = {
  id: string
  name: string
  sharedAt: string
}

/**
 * There are no accounts, so a share link is the only handle a creator has on
 * their own track. Without this list, closing the tab loses the feedback for
 * good.
 */
export function getMyProjects(): MyProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((p) => p?.id && p?.name)
  } catch {
    return []
  }
}

export function addMyProject(project: MyProject) {
  try {
    const existing = getMyProjects().filter((p) => p.id !== project.id)
    const next = [project, ...existing].slice(0, MAX_TRACKED)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Private browsing, quota — not worth surfacing.
  }
}

export function removeMyProject(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getMyProjects().filter((p) => p.id !== id)))
  } catch {
    // Ignore.
  }
}
