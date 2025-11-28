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
      bundle_standards: {
        Row: {
          bundle_id: string
          standard_id: string
        }
        Insert: {
          bundle_id: string
          standard_id: string
        }
        Update: {
          bundle_id?: string
          standard_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_standards_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "standard_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_standards_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          certification_level: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          certification_level?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          certification_level?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_history: {
        Row: {
          amount: number | null
          bundle_id: string | null
          created_at: string | null
          id: string
          purchase_type: string | null
          standard_id: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          bundle_id?: string | null
          created_at?: string | null
          id?: string
          purchase_type?: string | null
          standard_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          bundle_id?: string | null
          created_at?: string | null
          id?: string
          purchase_type?: string | null
          standard_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_history_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "standard_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_history_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_bundles: {
        Row: {
          created_at: string | null
          description: string | null
          discount_percent: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Relationships: []
      }
      standards: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_free: boolean | null
          lemon_squeezy_variant_id_annual: string | null
          lemon_squeezy_variant_id_monthly: string | null
          lemon_squeezy_variant_id_onetime: string | null
          metadata: Json | null
          name: string
          price_annual: number | null
          price_monthly: number | null
          price_one_time: number | null
          stripe_price_id_annual: string | null
          stripe_price_id_monthly: string | null
          stripe_price_id_onetime: string | null
          stripe_product_id: string | null
          version: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          lemon_squeezy_variant_id_annual?: string | null
          lemon_squeezy_variant_id_monthly?: string | null
          lemon_squeezy_variant_id_onetime?: string | null
          metadata?: Json | null
          name: string
          price_annual?: number | null
          price_monthly?: number | null
          price_one_time?: number | null
          stripe_price_id_annual?: string | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_onetime?: string | null
          stripe_product_id?: string | null
          version?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          lemon_squeezy_variant_id_annual?: string | null
          lemon_squeezy_variant_id_monthly?: string | null
          lemon_squeezy_variant_id_onetime?: string | null
          metadata?: Json | null
          name?: string
          price_annual?: number | null
          price_monthly?: number | null
          price_one_time?: number | null
          stripe_price_id_annual?: string | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_onetime?: string | null
          stripe_product_id?: string | null
          version?: string | null
        }
        Relationships: []
      }
      technique_sheets: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          id: string
          modified_by: string | null
          sheet_name: string
          standard: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data: Json
          id?: string
          modified_by?: string | null
          sheet_name: string
          standard?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          modified_by?: string | null
          sheet_name?: string
          standard?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_standard_access: {
        Row: {
          access_type: string
          created_at: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          lemon_squeezy_order_id: string | null
          purchase_date: string | null
          standard_id: string
          stripe_payment_id: string | null
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          lemon_squeezy_order_id?: string | null
          purchase_date?: string | null
          standard_id: string
          stripe_payment_id?: string | null
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          lemon_squeezy_order_id?: string | null
          purchase_date?: string | null
          standard_id?: string
          stripe_payment_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_standard_access_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_standard_access: {
        Args: { _standard_code: string; _user_id: string }
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
