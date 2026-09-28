/**
 * Hand-written rather than generated. supabase-js resolves inserts to `never`
 * unless the schema carries Views/Functions/Enums/CompositeTypes and each table
 * a Relationships array, so those are present and empty on purpose.
 */
export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          audio_url: string
          created_by: string
          creator_color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          audio_url: string
          created_by: string
          creator_color: string
          created_at?: string
        }
        Relationships: []
        Update: {
          name?: string
          audio_url?: string
          created_by?: string
          creator_color?: string
        }
      }
      annotations: {
        Row: {
          id: string
          project_id: string
          timestamp: number
          text: string
          type: string | null
          contributor_name: string
          contributor_color: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          timestamp: number
          text?: string
          type?: string | null
          contributor_name: string
          contributor_color: string
          created_at?: string
        }
        Relationships: []
        Update: {
          timestamp?: number
          text?: string
          type?: string | null
        }
      }
      // Research tables. Insert-only for the anon key — there is no select
      // policy on any of them, so Row is what was written, not what can be
      // read back from the browser.
      email_captures: {
        Row: {
          id: string
          email: string
          project_id: string | null
          creator_id: string | null
          source: string
          use_case: string | null
          marketing_consent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          project_id?: string | null
          creator_id?: string | null
          source?: string
          use_case?: string | null
          marketing_consent?: boolean
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      use_case_responses: {
        Row: {
          id: string
          creator_id: string
          use_case: string
          project_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          use_case: string
          project_id?: string | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      product_feedback: {
        Row: {
          id: string
          message: string
          email: string | null
          creator_id: string | null
          use_case: string | null
          path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          message: string
          email?: string | null
          creator_id?: string | null
          use_case?: string | null
          path?: string | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
