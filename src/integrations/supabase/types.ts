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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      calendar_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          aggression_type: string
          concept: string | null
          created_at: string
          cunning_type: string
          determination_type: string
          epic_marks: Json | null
          extended_narratives: Json | null
          faith_type: string
          game_system: string
          heroic_moves_stored: number
          id: string
          major_marks: Json | null
          mark_progress: Json | null
          minor_marks: string[] | null
          name: string
          negative_marks: Json | null
          seduction_type: string
          updated_at: string
          user_id: string
          vampiro_data: Json | null
        }
        Insert: {
          aggression_type?: string
          concept?: string | null
          created_at?: string
          cunning_type?: string
          determination_type?: string
          epic_marks?: Json | null
          extended_narratives?: Json | null
          faith_type?: string
          game_system?: string
          heroic_moves_stored?: number
          id?: string
          major_marks?: Json | null
          mark_progress?: Json | null
          minor_marks?: string[] | null
          name: string
          negative_marks?: Json | null
          seduction_type?: string
          updated_at?: string
          user_id: string
          vampiro_data?: Json | null
        }
        Update: {
          aggression_type?: string
          concept?: string | null
          created_at?: string
          cunning_type?: string
          determination_type?: string
          epic_marks?: Json | null
          extended_narratives?: Json | null
          faith_type?: string
          game_system?: string
          heroic_moves_stored?: number
          id?: string
          major_marks?: Json | null
          mark_progress?: Json | null
          minor_marks?: string[] | null
          name?: string
          negative_marks?: Json | null
          seduction_type?: string
          updated_at?: string
          user_id?: string
          vampiro_data?: Json | null
        }
        Relationships: []
      }
      complications: {
        Row: {
          character_id: string
          created_at: string
          description: string
          id: string
          is_manifested: boolean
          is_visible: boolean
          manifest_note: string | null
          manifested_at: string | null
          session_id: string
          type: string
        }
        Insert: {
          character_id: string
          created_at?: string
          description: string
          id?: string
          is_manifested?: boolean
          is_visible?: boolean
          manifest_note?: string | null
          manifested_at?: string | null
          session_id: string
          type: string
        }
        Update: {
          character_id?: string
          created_at?: string
          description?: string
          id?: string
          is_manifested?: boolean
          is_visible?: boolean
          manifest_note?: string | null
          manifested_at?: string | null
          session_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "complications_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      merits_flaws: {
        Row: {
          category: string
          cost: number
          created_at: string
          created_by: string
          description: string
          game_systems: string[]
          id: string
          name: string
          prerequisites: string | null
          sourcebook: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          cost?: number
          created_at?: string
          created_by: string
          description?: string
          game_systems?: string[]
          id?: string
          name: string
          prerequisites?: string | null
          sourcebook?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          cost?: number
          created_at?: string
          created_by?: string
          description?: string
          game_systems?: string[]
          id?: string
          name?: string
          prerequisites?: string | null
          sourcebook?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      minor_marks: {
        Row: {
          attribute: string
          created_at: string
          created_by: string | null
          description: string
          effect: string
          id: string
          name: string
          session_id: string | null
        }
        Insert: {
          attribute: string
          created_at?: string
          created_by?: string | null
          description: string
          effect: string
          id?: string
          name: string
          session_id?: string | null
        }
        Update: {
          attribute?: string
          created_at?: string
          created_by?: string | null
          description?: string
          effect?: string
          id?: string
          name?: string
          session_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          language?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scenes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          session_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          session_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_events: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          scene_id: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          scene_id?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          scene_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_events_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_participants: {
        Row: {
          character_id: string | null
          experience_points: number
          id: string
          joined_at: string
          session_blood_pool: number | null
          session_health_damage: Json | null
          session_id: string
          session_willpower_current: number | null
          sheet_locked: boolean
          user_id: string
        }
        Insert: {
          character_id?: string | null
          experience_points?: number
          id?: string
          joined_at?: string
          session_blood_pool?: number | null
          session_health_damage?: Json | null
          session_id: string
          session_willpower_current?: number | null
          sheet_locked?: boolean
          user_id: string
        }
        Update: {
          character_id?: string | null
          experience_points?: number
          id?: string
          joined_at?: string
          session_blood_pool?: number | null
          session_health_damage?: Json | null
          session_id?: string
          session_willpower_current?: number | null
          sheet_locked?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          current_scene_id: string | null
          description: string | null
          game_system: string
          id: string
          invite_code: string
          name: string
          narrator_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_scene_id?: string | null
          description?: string | null
          game_system?: string
          id?: string
          invite_code: string
          name: string
          narrator_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_scene_id?: string | null
          description?: string | null
          game_system?: string
          id?: string
          invite_code?: string
          name?: string
          narrator_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_current_scene"
            columns: ["current_scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      test_rolls: {
        Row: {
          attribute_modifier: number
          character_id: string
          dice1: number | null
          dice2: number | null
          difficulty_modifier: number
          has_negative_extreme: boolean | null
          has_positive_extreme: boolean | null
          heroic_move_choice: string | null
          id: string
          pull_group_used: boolean | null
          result: string | null
          rolled_at: string | null
          test_id: string
          total: number | null
          user_id: string
        }
        Insert: {
          attribute_modifier: number
          character_id: string
          dice1?: number | null
          dice2?: number | null
          difficulty_modifier: number
          has_negative_extreme?: boolean | null
          has_positive_extreme?: boolean | null
          heroic_move_choice?: string | null
          id?: string
          pull_group_used?: boolean | null
          result?: string | null
          rolled_at?: string | null
          test_id: string
          total?: number | null
          user_id: string
        }
        Update: {
          attribute_modifier?: number
          character_id?: string
          dice1?: number | null
          dice2?: number | null
          difficulty_modifier?: number
          has_negative_extreme?: boolean | null
          has_positive_extreme?: boolean | null
          heroic_move_choice?: string | null
          id?: string
          pull_group_used?: boolean | null
          result?: string | null
          rolled_at?: string | null
          test_id?: string
          total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_rolls_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_rolls_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          attribute: string
          completed_at: string | null
          context: string | null
          created_at: string
          created_by: string
          difficulty: number
          id: string
          scene_id: string | null
          session_id: string
          status: string
          test_type: string
        }
        Insert: {
          attribute: string
          completed_at?: string | null
          context?: string | null
          created_at?: string
          created_by: string
          difficulty?: number
          id?: string
          scene_id?: string | null
          session_id: string
          status?: string
          test_type: string
        }
        Update: {
          attribute?: string
          completed_at?: string | null
          context?: string | null
          created_at?: string
          created_by?: string
          difficulty?: number
          id?: string
          scene_id?: string | null
          session_id?: string
          status?: string
          test_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_log: {
        Row: {
          amount: number
          character_id: string
          created_at: string
          id: string
          narrator_id: string
          narrator_name: string
          note: string | null
          session_id: string | null
        }
        Insert: {
          amount: number
          character_id: string
          created_at?: string
          id?: string
          narrator_id: string
          narrator_name: string
          note?: string | null
          session_id?: string | null
        }
        Update: {
          amount?: number
          character_id?: string
          created_at?: string
          id?: string
          narrator_id?: string
          narrator_name?: string
          note?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xp_log_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_session_narrator: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: boolean
      }
      is_session_participant: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: boolean
      }
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
