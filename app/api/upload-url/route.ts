import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES, extensionForMimeType } from "@/lib/audio-types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Hands out a one-shot signed upload URL.
 *
 * Until now the browser uploaded straight into the `audio` bucket using the
 * public anon key, so anyone who read the JS bundle could write whatever they
 * liked. With the anon insert policy removed (step 4b) this route is the only
 * way in, and it checks the type and size before issuing anything.
 *
 * The object key is {project_id}/{uuid}.{ext}. Existing objects keep their flat
 * keys; nothing is moved.
 */

// ── Rate limit ──────────────────────────────────────────────────────────────
// In-memory, so it is per serverless instance and resets on cold start. That
// blunts a naive loop but is NOT a real limit — Vercel Firewall rate limiting
// is the control that actually holds, and it needs no code. Treat this as the
// floor, not the ceiling.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 10
const MAX_TRACKED_IPS = 5_000

const hits = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)

  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent)
    return true
  }

  recent.push(now)
  hits.set(ip, recent)

  // Crude bound so a spray of unique IPs can't grow this without limit.
  if (hits.size > MAX_TRACKED_IPS) hits.clear()

  return false
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "unknown"
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const ip = clientIp(request)
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many uploads from this address. Try again in a minute." },
      { status: 429 }
    )
  }

  let body: { projectId?: unknown; contentType?: unknown; size?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 })
  }

  const { projectId, contentType, size } = body

  if (typeof projectId !== "string" || !UUID_RE.test(projectId)) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 })
  }

  if (typeof contentType !== "string" || !ALLOWED_MIME_TYPES.includes(contentType as never)) {
    return NextResponse.json({ error: "Unsupported audio format" }, { status: 415 })
  }

  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File is too large" }, { status: 413 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !supabaseUrl) {
    // Misconfiguration, not the caller's fault — and worth shouting about in
    // logs, because uploads fail completely without it.
    console.error("upload-url: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is missing")
    return NextResponse.json({ error: "Upload is unavailable" }, { status: 503 })
  }

  const path = `${projectId}/${crypto.randomUUID()}.${extensionForMimeType(contentType)}`

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await admin.storage.from("audio").createSignedUploadUrl(path)

  if (error || !data) {
    console.error("upload-url: createSignedUploadUrl failed", error?.message)
    return NextResponse.json({ error: "Could not start upload" }, { status: 502 })
  }

  return NextResponse.json({ path: data.path, token: data.token })
}
