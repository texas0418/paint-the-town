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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      anniversaries: {
        Row: {
          anniversary_date: string
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          anniversary_date: string
          created_at?: string
          id?: string
          title?: string
          user_id: string
        }
        Update: {
          anniversary_date?: string
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          cache_creation_input_tokens: number
          cache_read_input_tokens: number
          created_at: string
          id: number
          input_tokens: number
          job_id: string | null
          model: string
          output_tokens: number
          web_search_requests: number
        }
        Insert: {
          cache_creation_input_tokens?: number
          cache_read_input_tokens?: number
          created_at?: string
          id?: never
          input_tokens?: number
          job_id?: string | null
          model: string
          output_tokens?: number
          web_search_requests?: number
        }
        Update: {
          cache_creation_input_tokens?: number
          cache_read_input_tokens?: number
          created_at?: string
          id?: never
          input_tokens?: number
          job_id?: string | null
          model?: string
          output_tokens?: number
          web_search_requests?: number
        }
        Relationships: []
      }
      date_plans: {
        Row: {
          city: string
          created_at: string
          estimated_cost: number | null
          id: string
          items: Json
          plan_date: string | null
          source: string
          start_time: string | null
          status: string
          title: string
          total_budget: number | null
          updated_at: string
          user_id: string
          vibe: string | null
        }
        Insert: {
          city: string
          created_at?: string
          estimated_cost?: number | null
          id?: string
          items?: Json
          plan_date?: string | null
          source?: string
          start_time?: string | null
          status?: string
          title: string
          total_budget?: number | null
          updated_at?: string
          user_id: string
          vibe?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          estimated_cost?: number | null
          id?: string
          items?: Json
          plan_date?: string | null
          source?: string
          start_time?: string | null
          status?: string
          title?: string
          total_budget?: number | null
          updated_at?: string
          user_id?: string
          vibe?: string | null
        }
        Relationships: []
      }
      plan_jobs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          partial: Json
          plans: Json | null
          progress: Json | null
          request: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          partial?: Json
          plans?: Json | null
          progress?: Json | null
          request?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          partial?: Json
          plans?: Json | null
          progress?: Json | null
          request?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string | null
          id: string
          nationality: string | null
          onboarding_completed: boolean
          phone: string | null
          preferred_currency: string
          preferred_language: string
          push_token: string | null
          subscription_expires_at: string | null
          subscription_tier: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name?: string | null
          id: string
          nationality?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          preferred_currency?: string
          preferred_language?: string
          push_token?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string | null
          id?: string
          nationality?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          preferred_currency?: string
          preferred_language?: string
          push_token?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          accessibility_needs: string[] | null
          activity_dislikes: string[] | null
          activity_loves: string[] | null
          avoid_countries: string[] | null
          budget_range: string | null
          created_at: string
          date_budget: number | null
          dietary_restrictions: string[] | null
          drinks: string[] | null
          food_dislikes: string[] | null
          food_loves: string[] | null
          home_city: string | null
          id: string
          music_genres: string[] | null
          preferred_activities: string[] | null
          preferred_airlines: string[] | null
          preferred_hotels: string[] | null
          travel_style: string | null
          updated_at: string
          user_id: string
          venue_style: string | null
        }
        Insert: {
          accessibility_needs?: string[] | null
          activity_dislikes?: string[] | null
          activity_loves?: string[] | null
          avoid_countries?: string[] | null
          budget_range?: string | null
          created_at?: string
          date_budget?: number | null
          dietary_restrictions?: string[] | null
          drinks?: string[] | null
          food_dislikes?: string[] | null
          food_loves?: string[] | null
          home_city?: string | null
          id?: string
          music_genres?: string[] | null
          preferred_activities?: string[] | null
          preferred_airlines?: string[] | null
          preferred_hotels?: string[] | null
          travel_style?: string | null
          updated_at?: string
          user_id: string
          venue_style?: string | null
        }
        Update: {
          accessibility_needs?: string[] | null
          activity_dislikes?: string[] | null
          activity_loves?: string[] | null
          avoid_countries?: string[] | null
          budget_range?: string | null
          created_at?: string
          date_budget?: number | null
          dietary_restrictions?: string[] | null
          drinks?: string[] | null
          food_dislikes?: string[] | null
          food_loves?: string[] | null
          home_city?: string | null
          id?: string
          music_genres?: string[] | null
          preferred_activities?: string[] | null
          preferred_airlines?: string[] | null
          preferred_hotels?: string[] | null
          travel_style?: string | null
          updated_at?: string
          user_id?: string
          venue_style?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      append_partial: { Args: { item: Json; job_id: string }; Returns: number }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
