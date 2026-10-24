#!/usr/bin/env node
/**
 * Remove a project: its audio object, its notes, and the row.
 *
 * For takedowns and for clearing test data. There is deliberately no admin
 * HTTP route — that would mean a destructive endpoint on a public domain
 * guarded by one shared secret, for something used a handful of times a year.
 * This runs locally with the service key already in .env.local.
 *
 *   node scripts/admin-delete-project.mjs <project-id>
 *   node scripts/admin-delete-project.mjs <project-id> --yes
 *
 * Without --yes it prints what it would remove and asks you to retype the id.
 * Annotations are removed by the foreign key's ON DELETE CASCADE.
 */

import { readFileSync } from "node:fs"
import { createInterface } from "node:readline/promises"
import { stdin, stdout } from "node:process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function loadEnv() {
  const text = readFileSync(path.join(repoRoot, ".env.local"), "utf8")
  const env = {}
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue
    const i = line.indexOf("=")
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return env
}

const env = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const [projectId, ...flags] = process.argv.slice(2)
const assumeYes = flags.includes("--yes")

if (!projectId || !/^[0-9a-f-]{36}$/i.test(projectId)) {
  console.error("Usage: node scripts/admin-delete-project.mjs <project-id> [--yes]")
  process.exit(1)
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
}

async function api(pathname, init = {}) {
  // Storage rejects a bodyless request that still declares a JSON content-type
  // ("Body cannot be empty when content-type is set to 'application/json'"),
  // so only send that header when there is actually a body.
  const requestHeaders = { ...headers, ...(init.headers ?? {}) }
  if (!init.body) delete requestHeaders["Content-Type"]

  const res = await fetch(`${SUPABASE_URL}${pathname}`, { ...init, headers: requestHeaders })
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${pathname} -> ${res.status} ${await res.text()}`)
  const body = await res.text()
  return body ? JSON.parse(body) : null
}

// ── What's there ────────────────────────────────────────────────────────────
const [project] = await api(`/rest/v1/projects?select=*&id=eq.${projectId}`)
if (!project) {
  console.error(`No project with id ${projectId}`)
  process.exit(1)
}

const notes = await api(`/rest/v1/annotations?select=id&project_id=eq.${projectId}`)
const objectKey = project.storage_path ?? project.audio_url.split("/audio/").pop() ?? null

console.log("")
console.log("  About to permanently delete:")
console.log(`    project     ${project.id}`)
console.log(`    name        ${project.name}`)
console.log(`    created     ${project.created_at?.slice(0, 19) ?? "?"}`)
console.log(`    notes       ${notes.length} (cascade)`)
console.log(`    audio       ${project.audio_expired ? "already expired" : objectKey ?? "no object key"}`)
console.log("")

if (!assumeYes) {
  const rl = createInterface({ input: stdin, output: stdout })
  const answer = await rl.question("  Retype the project id to confirm: ")
  rl.close()
  if (answer.trim() !== projectId) {
    console.log("  Mismatch — nothing deleted.")
    process.exit(1)
  }
}

// ── Remove ──────────────────────────────────────────────────────────────────
// Object first: if this fails, the row is still there to retry from. The other
// order would orphan bytes that nothing references any more.
if (objectKey && !project.audio_expired) {
  await api(`/storage/v1/object/audio/${objectKey}`, { method: "DELETE" })
  console.log(`  deleted object  ${objectKey}`)
}

await api(`/rest/v1/projects?id=eq.${projectId}`, {
  method: "DELETE",
  headers: { ...headers, Prefer: "return=minimal" },
})
console.log(`  deleted project ${projectId} and ${notes.length} note(s)`)
console.log("")
