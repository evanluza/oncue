import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Daily retention sweep.
 *
 * Deletes ONLY the stored audio for projects with no new note in 30 days, and
 * marks audio_expired. Project rows and annotation rows are never touched —
 * the notes outlive the audio, which is the whole point: 95% of tracks get
 * their last note the same day, so the audio is dead weight long before the
 * feedback stops being worth reading.
 *
 * SHIPS DISABLED. Without RETENTION_SWEEP_ENABLED=true it reports what it
 * would delete and deletes nothing, so the schedule can run harmlessly and be
 * inspected before anything is destroyed.
 */

const INACTIVE_DAYS = 30

export async function GET(request: Request) {
  // Vercel sends `Authorization: Bearer $CRON_SECRET` on scheduled invocations.
  // Without a configured secret this route stays shut rather than open.
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 })
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 })
  }

  const enabled = process.env.RETENTION_SWEEP_ENABLED === "true"
  const cutoff = new Date(Date.now() - INACTIVE_DAYS * 86_400_000).toISOString()

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: stale, error } = await admin
    .from("projects")
    .select("id, name, storage_path, audio_url, last_activity_at")
    .eq("audio_expired", false)
    .lt("last_activity_at", cutoff)
    .limit(200)

  if (error) {
    console.error("expire-audio: query failed", error.message)
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }

  const candidates = stale ?? []

  if (!enabled) {
    return NextResponse.json({
      mode: "dry-run",
      note: "Set RETENTION_SWEEP_ENABLED=true to actually delete audio.",
      cutoff,
      wouldExpire: candidates.length,
      projects: candidates.map((p) => ({ id: p.id, name: p.name, lastActivity: p.last_activity_at })),
    })
  }

  const expired: string[] = []
  const failed: { id: string; reason: string }[] = []

  for (const project of candidates) {
    // Older rows predate storage_path and carry a flat key inside audio_url.
    const key = project.storage_path ?? project.audio_url.split("/audio/").pop() ?? null
    if (!key) {
      failed.push({ id: project.id, reason: "no object key" })
      continue
    }

    const { error: removeError } = await admin.storage.from("audio").remove([key])
    if (removeError) {
      failed.push({ id: project.id, reason: removeError.message })
      continue
    }

    // Only flag it once the bytes are actually gone, so a failed delete is
    // retried tomorrow rather than silently marked expired.
    const { error: flagError } = await admin
      .from("projects")
      .update({ audio_expired: true })
      .eq("id", project.id)

    if (flagError) {
      failed.push({ id: project.id, reason: flagError.message })
      continue
    }

    expired.push(project.id)
  }

  console.log(`expire-audio: expired ${expired.length}, failed ${failed.length}`)

  return NextResponse.json({ mode: "live", cutoff, expired: expired.length, failed })
}
