import { getSupabase } from "./supabase"
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
  // Upload audio to Supabase Storage
  const fileExt = name.split(".").pop()
  const filePath = `${crypto.randomUUID()}.${fileExt}`

  const { error: uploadError } = await getSupabase().storage
    .from("audio")
    .upload(filePath, audioFile, {
      contentType: audioFile.type,
      cacheControl: "3600",
    })

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

  const { data: urlData } = getSupabase().storage.from("audio").getPublicUrl(filePath)

  const { data, error } = await getSupabase()
    .from("projects")
    .insert({
      name,
      audio_url: urlData.publicUrl,
      created_by: createdBy,
      creator_color: creatorColor,
    })
    .select()
    .single()

  if (error) throw new Error(`Create project failed: ${error.message}`)
  return data
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  const { data, error } = await getSupabase()
    .from("projects")
    .select()
    .eq("id", id)
    .single()

  if (error) return null
  return data
}

// ── Annotations ──

export async function getAnnotations(projectId: string): Promise<AnnotationRow[]> {
  const { data, error } = await getSupabase()
    .from("annotations")
    .select()
    .eq("project_id", projectId)
    .order("timestamp", { ascending: true })

  if (error) throw new Error(`Fetch annotations failed: ${error.message}`)
  return data ?? []
}

export async function addAnnotation(
  projectId: string,
  timestamp: number,
  text: string,
  contributorName: string,
  contributorColor: string,
  type?: MacroType
): Promise<AnnotationRow> {
  const { data, error } = await getSupabase()
    .from("annotations")
    .insert({
      project_id: projectId,
      timestamp,
      text,
      type: type ?? null,
      contributor_name: contributorName,
      contributor_color: contributorColor,
    })
    .select()
    .single()

  if (error) throw new Error(`Add annotation failed: ${error.message}`)
  return data
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
