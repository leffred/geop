export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_engines: {
        Row: {
          code: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      credits: {
        Row: {
          balance: number
          updated_at: string
          user_email: string
        }
        Insert: {
          balance?: number
          updated_at?: string
          user_email: string
        }
        Update: {
          balance?: number
          updated_at?: string
          user_email?: string
        }
        Relationships: []
      }
      monitoring_results: {
        Row: {
          engine_id: string | null
          id: string
          is_brand_mentioned: boolean | null
          prompt_id: string
          rank_position: number | null
          raw_response: string | null
          run_date: string
          sentiment_score: number | null
          sources_found: Json | null
        }
        Insert: {
          engine_id?: string | null
          id?: string
          is_brand_mentioned?: boolean | null
          prompt_id: string
          rank_position?: number | null
          raw_response?: string | null
          run_date?: string
          sentiment_score?: number | null
          sources_found?: Json | null
        }
        Update: {
          engine_id?: string | null
          id?: string
          is_brand_mentioned?: boolean | null
          prompt_id?: string
          rank_position?: number | null
          raw_response?: string | null
          run_date?: string
          sentiment_score?: number | null
          sources_found?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_results_engine_id_fkey"
            columns: ["engine_id"]
            isOneToOne: false
            referencedRelation: "ai_engines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitoring_results_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          country: string | null
          created_at: string
          domain: string | null
          id: string
          language: string | null
          name: string
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          language?: string | null
          name: string
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          language?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          created_at: string
          id: string
          intent: string | null
          text: string
          topic_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intent?: string | null
          text: string
          topic_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intent?: string | null
          text?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          analysis_data: Json | null
          brand: string
          country: string | null
          created_at: string
          id: string
          keyword: string
          user_email: string
        }
        Insert: {
          analysis_data?: Json | null
          brand: string
          country?: string | null
          created_at?: string
          id?: string
          keyword: string
          user_email: string
        }
        Update: {
          analysis_data?: Json | null
          brand?: string
          country?: string | null
          created_at?: string
          id?: string
          keyword?: string
          user_email?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          brand: string | null
          city: string | null
          competitors: Json | null
          country: string | null
          device: string | null
          ga4_measurement_id: string | null
          gsc_property_id: string | null
          id: number
          keywords: Json | null
          language: string | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          city?: string | null
          competitors?: Json | null
          country?: string | null
          device?: string | null
          ga4_measurement_id?: string | null
          gsc_property_id?: string | null
          id?: number
          keywords?: Json | null
          language?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          city?: string | null
          competitors?: Json | null
          country?: string | null
          device?: string | null
          ga4_measurement_id?: string | null
          gsc_property_id?: string | null
          id?: number
          keywords?: Json | null
          language?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      topics: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string
          volume_estimation: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id: string
          volume_estimation?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          volume_estimation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
