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
        Update: {
          timestamp?: number
          text?: string
          type?: string | null
        }
      }
    }
  }
}
