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
      certifications: {
        Row: {
          created_at: string | null
          credential_id: string | null
          credential_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          agreed_credits: number
          client_confirmed: boolean
          client_id: string
          completed_at: string | null
          created_at: string
          description: string
          id: string
          proposed_by: string
          provider_confirmed: boolean
          provider_id: string
          service_id: string | null
          status: Database["public"]["Enums"]["contract_status"]
          title: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          agreed_credits: number
          client_confirmed?: boolean
          client_id: string
          completed_at?: string | null
          created_at?: string
          description: string
          id?: string
          proposed_by: string
          provider_confirmed?: boolean
          provider_id: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          title: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          agreed_credits?: number
          client_confirmed?: boolean
          client_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          proposed_by?: string
          provider_confirmed?: boolean
          provider_id?: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          title?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packages: {
        Row: {
          created_at: string | null
          credits: number
          id: string
          is_active: boolean | null
          name: string
          price_usd: number
          sort_order: number | null
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits: number
          id?: string
          is_active?: boolean | null
          name: string
          price_usd: number
          sort_order?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price_usd?: number
          sort_order?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_purchases: {
        Row: {
          amount_usd: number
          completed_at: string | null
          created_at: string | null
          credits: number
          id: string
          package_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount_usd: number
          completed_at?: string | null
          created_at?: string | null
          credits: number
          id?: string
          package_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount_usd?: number
          completed_at?: string | null
          created_at?: string | null
          credits?: number
          id?: string
          package_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      education: {
        Row: {
          created_at: string | null
          degree: string
          description: string | null
          end_date: string | null
          field_of_study: string | null
          grade: string | null
          id: string
          institution: string
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          degree: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution: string
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          degree?: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution?: string
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      endorsements: {
        Row: {
          created_at: string | null
          endorser_id: string
          id: string
          skill_id: string
        }
        Insert: {
          created_at?: string | null
          endorser_id: string
          id?: string
          skill_id: string
        }
        Update: {
          created_at?: string | null
          endorser_id?: string
          id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "endorsements_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "user_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
          service_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
          service_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          media_type: string | null
          project_url: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          media_type?: string | null
          project_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          media_type?: string | null
          project_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about: string | null
          availability_status: string | null
          avatar_url: string | null
          bio: string | null
          bonus_credits: number
          cover_url: string | null
          created_at: string
          earned_credits: number
          email: string | null
          escrow_credits: number
          full_name: string | null
          headline: string | null
          id: string
          is_suspended: boolean | null
          is_verified: boolean | null
          last_free_credits_at: string | null
          location: string | null
          profile_slug: string | null
          profile_visibility: string | null
          response_time_hours: number | null
          show_email: boolean | null
          show_location: boolean | null
          skills: string[] | null
          stripe_connect_account_id: string | null
          stripe_connect_onboarding_complete: boolean | null
          time_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          about?: string | null
          availability_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          bonus_credits?: number
          cover_url?: string | null
          created_at?: string
          earned_credits?: number
          email?: string | null
          escrow_credits?: number
          full_name?: string | null
          headline?: string | null
          id?: string
          is_suspended?: boolean | null
          is_verified?: boolean | null
          last_free_credits_at?: string | null
          location?: string | null
          profile_slug?: string | null
          profile_visibility?: string | null
          response_time_hours?: number | null
          show_email?: boolean | null
          show_location?: boolean | null
          skills?: string[] | null
          stripe_connect_account_id?: string | null
          stripe_connect_onboarding_complete?: boolean | null
          time_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          about?: string | null
          availability_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          bonus_credits?: number
          cover_url?: string | null
          created_at?: string
          earned_credits?: number
          email?: string | null
          escrow_credits?: number
          full_name?: string | null
          headline?: string | null
          id?: string
          is_suspended?: boolean | null
          is_verified?: boolean | null
          last_free_credits_at?: string | null
          location?: string | null
          profile_slug?: string | null
          profile_visibility?: string | null
          response_time_hours?: number | null
          show_email?: boolean | null
          show_location?: boolean | null
          skills?: string[] | null
          stripe_connect_account_id?: string | null
          stripe_connect_onboarding_complete?: boolean | null
          time_credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_visible: boolean | null
          recommendee_id: string
          recommender_id: string
          relationship: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          recommendee_id: string
          recommender_id: string
          relationship?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          recommendee_id?: string
          recommender_id?: string
          relationship?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string | null
          contract_id: string | null
          created_at: string | null
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          contract_id?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          contract_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string
          created_at: string
          description: string
          hourly_credits: number
          id: string
          image_url: string | null
          is_active: boolean
          is_remote: boolean
          location: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          hourly_credits?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_remote?: boolean
          location?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          hourly_credits?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_remote?: boolean
          location?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          receiver_id: string
          sender_id: string
          service_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          receiver_id: string
          sender_id: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      user_categories: {
        Row: {
          category: Database["public"]["Enums"]["professional_category"]
          created_at: string | null
          custom_category: string | null
          id: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["professional_category"]
          created_at?: string | null
          custom_category?: string | null
          id?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["professional_category"]
          created_at?: string | null
          custom_category?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_languages: {
        Row: {
          created_at: string | null
          id: string
          language: string
          proficiency: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          language: string
          proficiency?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          language?: string
          proficiency?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          category: Database["public"]["Enums"]["professional_category"] | null
          created_at: string | null
          endorsement_count: number | null
          id: string
          proficiency_level: number | null
          skill_name: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["professional_category"] | null
          created_at?: string | null
          endorsement_count?: number | null
          id?: string
          proficiency_level?: number | null
          skill_name: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["professional_category"] | null
          created_at?: string | null
          endorsement_count?: number | null
          id?: string
          proficiency_level?: number | null
          skill_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tools: {
        Row: {
          created_at: string | null
          id: string
          proficiency_level: number | null
          tool_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          proficiency_level?: number | null
          tool_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          proficiency_level?: number | null
          tool_name?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          created_at: string | null
          credits_amount: number
          fee_amount: number
          id: string
          net_amount: number
          notes: string | null
          processed_at: string | null
          status: string
          usd_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_amount: number
          fee_amount?: number
          id?: string
          net_amount: number
          notes?: string | null
          processed_at?: string | null
          status?: string
          usd_amount: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_amount?: number
          fee_amount?: number
          id?: string
          net_amount?: number
          notes?: string | null
          processed_at?: string | null
          status?: string
          usd_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      work_experience: {
        Row: {
          company: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          location: string | null
          start_date: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          start_date: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          start_date?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_contract: {
        Args: { p_contract_id: string; p_user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      transfer_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_receiver_id: string
          p_sender_id: string
          p_service_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      contract_status:
        | "proposed"
        | "accepted"
        | "in_progress"
        | "completed"
        | "disputed"
        | "cancelled"
      professional_category:
        | "web_developer"
        | "software_engineer"
        | "ui_ux_designer"
        | "graphic_artist"
        | "digital_marketer"
        | "social_media_consultant"
        | "content_creator"
        | "data_analyst"
        | "mobile_app_developer"
        | "video_editor"
        | "photographer"
        | "business_consultant"
        | "other"
      service_type: "offer" | "request"
      transaction_status: "pending" | "completed" | "cancelled" | "disputed"
      transaction_type: "service_payment" | "refund" | "bonus" | "adjustment"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      contract_status: [
        "proposed",
        "accepted",
        "in_progress",
        "completed",
        "disputed",
        "cancelled",
      ],
      professional_category: [
        "web_developer",
        "software_engineer",
        "ui_ux_designer",
        "graphic_artist",
        "digital_marketer",
        "social_media_consultant",
        "content_creator",
        "data_analyst",
        "mobile_app_developer",
        "video_editor",
        "photographer",
        "business_consultant",
        "other",
      ],
      service_type: ["offer", "request"],
      transaction_status: ["pending", "completed", "cancelled", "disputed"],
      transaction_type: ["service_payment", "refund", "bonus", "adjustment"],
    },
  },
} as const
