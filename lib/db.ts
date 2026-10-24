import { getSupabase } from "./supabase"
import { canonicalAudioType } from "./audio-types"
import type { MacroType } from "./types"

export type ProjectRow = {
  id: string
  name: string
  audio_url: string
  created_by: string
  creator_color: string
  created_at: string
}

export type AnnotationRow = {
  id: string
  project_id: string
  timestamp: number
  text: string
  type: string | null
  contributor_name: string
  contributor_color: string
  created_at: string
}

// ── Projects ──

export async function createProject(
  name: string,
  audioFile: File,
  createdBy: string,
  creatorColor: string
): Promise<ProjectRow> {
  // The key's extension and the contentType both come from the validated file,
  // never from the filename — see lib/audio-types.ts.
  const canonical = canonicalAudioType(audioFile)
  if (!canonical) throw new Error("Unsupported audio format")

  const filePath = `${crypto.randomUUID()}.${canonical.ext}`

  // The `contentType` option below does NOT win for a Blob/File body:
  // supabase-js sends it as a multipart part and storage reads the part's own
  // type, so a File with an empty type arrives as application/octet-stream and
  // the bucket's allowed_mime_types rejects it. Re-wrapping the bytes in a Blob
  // that carries the canonical type is what actually sets it.
  const body = new Blob([audioFile], { type: canonical.mimeType })

  const { error: uploadError } = await getSupabase().storage
    .from("audio")
    .upload(filePath, body, {
      contentType: canonical.mimeType,
      cacheControl: "3600",
    })

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

  const { data: urlData } = getSupabase().storage.from("audio").getPublicUrl(filePath)

  // The id is generated here rather than read back. `insert().select()` needs
  // SELECT on the table to return the row, and anon SELECT is exactly what
  // step 2 revokes — so nothing on the write path may ask for the row back.
  const row: ProjectRow = {
    id: crypto.randomUUID(),
    name,
    audio_url: urlData.publicUrl,
    created_by: createdBy,
    creator_color: creatorColor,
    created_at: new Date().toISOString(),
  }

  const { error } = await getSupabase().from("projects").insert({
    id: row.id,
    name: row.name,
    audio_url: row.audio_url,
    created_by: row.created_by,
    creator_color: row.creator_color,
  })

  if (error) throw new Error(`Create project failed: ${error.message}`)
  return row
}

export type ProjectWithAnnotations = {
  project: ProjectRow
  annotations: AnnotationRow[]
}

/**
 * One share page in one call, through a SECURITY DEFINER function. The tables
 * are not readable by the anon key: this returns the single project whose id
 * you already hold, so a share link can't be turned into a list of every
 * project and its audio URL.
 */
export async function getProjectWithAnnotations(
  id: string
): Promise<ProjectWithAnnotations | null> {
  const { data, error } = await getSupabase().rpc("get_project", { id })

  if (error) throw new Error(`Fetch project failed: ${error.message}`)

  const payload = data as { project: ProjectRow | null; annotations: AnnotationRow[] } | null
  if (!payload?.project) return null

  return { project: payload.project, annotations: payload.annotations ?? [] }
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  try {
    return (await getProjectWithAnnotations(id))?.project ?? null
  } catch {
    return null
  }
}

// ── Annotations ──

export async function addAnnotation(
  projectId: string,
  timestamp: number,
  text: string,
  contributorName: string,
  contributorColor: string,
  type?: MacroType
): Promise<AnnotationRow> {
  // Same reason as createProject: no reading the row back, because anon SELECT
  // on annotations is revoked in step 2.
  const row: AnnotationRow = {
    id: crypto.randomUUID(),
    project_id: projectId,
    timestamp,
    text,
    type: type ?? null,
    contributor_name: contributorName,
    contributor_color: contributorColor,
    created_at: new Date().toISOString(),
  }

  const { error } = await getSupabase().from("annotations").insert({
    id: row.id,
    project_id: row.project_id,
    timestamp: row.timestamp,
    text: row.text,
    type: row.type,
    contributor_name: row.contributor_name,
    contributor_color: row.contributor_color,
  })

  if (error) throw new Error(`Add annotation failed: ${error.message}`)
  return row
}

export async function updateAnnotation(
  id: string,
  text: string
): Promise<void> {
  const { error } = await getSupabase()
    .from("annotations")
    .update({ text })
    .eq("id", id)

  if (error) throw new Error(`Update annotation failed: ${error.message}`)
}

export async function deleteAnnotation(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from("annotations")
    .delete()
    .eq("id", id)

  if (error) throw new Error(`Delete annotation failed: ${error.message}`)
}

// ── Research writes ──
//
// Everything below is opt-in data the visitor typed on purpose. All three
// tables are insert-only for the anon key (see supabase-schema.sql), and every
// call is best-effort: a research write must never break annotating or sharing.
// If the migration hasn't been run yet these fail quietly and return false.

export type UseCaseAnswer = string

export async function saveEmailCapture(input: {
  email: string
  projectId: string | null
  creatorId: string
  useCase: UseCaseAnswer | null
  marketingConsent: boolean
  source?: string
}): Promise<boolean> {
  try {
    const { error } = await getSupabase().from("email_captures").insert({
      email: input.email.trim(),
      project_id: input.projectId,
      creator_id: input.creatorId,
      use_case: input.useCase,
      marketing_consent: input.marketingConsent,
      source: input.source ?? "post_share",
    })
    if (error) throw error
    return true
  } catch (err) {
    console.error("Email capture failed:", err)
    return false
  }
}

export async function saveUseCase(input: {
  creatorId: string
  useCase: UseCaseAnswer
  projectId: string | null
}): Promise<boolean> {
  try {
    const { error } = await getSupabase().from("use_case_responses").insert({
      creator_id: input.creatorId,
      use_case: input.useCase,
      project_id: input.projectId,
    })
    if (error) throw error
    return true
  } catch (err) {
    console.error("Use case save failed:", err)
    return false
  }
}

export async function saveFeedback(input: {
  message: string
  email: string | null
  creatorId: string
  useCase: UseCaseAnswer | null
  path: string
}): Promise<boolean> {
  try {
    const { error } = await getSupabase().from("product_feedback").insert({
      message: input.message.trim(),
      email: input.email?.trim() || null,
      creator_id: input.creatorId,
      use_case: input.useCase,
      path: input.path,
    })
    if (error) throw error
    return true
  } catch (err) {
    console.error("Feedback save failed:", err)
    return false
  }
}
