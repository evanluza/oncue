import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

let _supabase: SupabaseClient<Database> | null = null

export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    )
  }
  if (!_supabase) {
    _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}

/** @deprecated Use getSupabase() for lazy initialization */
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : (null as unknown as SupabaseClient<Database>)
