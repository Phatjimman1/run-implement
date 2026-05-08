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
  public: {
    Tables: {
      alerts: {
        Row: {
          deal_score: number | null
          id: string
          listing_id: string
          message: string | null
          read: boolean
          sniper_score: number | null
          triggered_at: string
          type: string
        }
        Insert: {
          deal_score?: number | null
          id?: string
          listing_id: string
          message?: string | null
          read?: boolean
          sniper_score?: number | null
          triggered_at?: string
          type: string
        }
        Update: {
          deal_score?: number | null
          id?: string
          listing_id?: string
          message?: string | null
          read?: boolean
          sniper_score?: number | null
          triggered_at?: string
          type?: string
        }
        Relationships: []
      }
      analyses: {
        Row: {
          block_reason: string | null
          block_severity: string | null
          card_count: number | null
          card_hierarchy_brand: string | null
          card_hierarchy_normalized_parallel: string | null
          card_hierarchy_numbering: string | null
          card_hierarchy_parallel: string | null
          card_hierarchy_rank: number | null
          card_hierarchy_reasoning: string | null
          card_hierarchy_score_bonus: number
          card_hierarchy_tier: string | null
          card_hierarchy_warnings_json: Json
          card_signature: string | null
          collector_priority: string | null
          comp_confidence: string
          comp_count: number
          comp_high: number | null
          comp_low: number | null
          comp_median: number | null
          competition: string
          deal_score: number
          detected_brands: string[]
          detected_card_types: string[]
          detected_players: string[]
          detected_sets: string[]
          discount_percent: number | null
          educational_notes_json: Json
          estimated_market_value: number | null
          flip_score: number
          heat_label: string | null
          heat_score: number | null
          hierarchy_explanation_json: Json
          hold_score: number
          id: string
          is_auto: boolean
          is_blocked: boolean
          is_certified_auto: boolean
          is_college: boolean
          is_damaged: boolean
          is_insert: boolean
          is_numbered: boolean
          is_refractor: boolean
          is_reprint_risk: boolean
          is_rookie: boolean
          is_xfractor: boolean
          listing_id: string
          market_anchor_explanation_json: Json
          max_bid: number
          max_bid_breakdown_json: Json
          numbered_print_run: number | null
          player_heat_explanation_json: Json
          price_per_card: number | null
          reasoning: string | null
          recommendation: string
          recommendation_explanation_json: Json
          risk_analysis_json: Json
          risk_score: number
          score_breakdown_json: Json
          sniper_score: number
          tags: string[]
          updated_at: string
          urgency: string
          value_score: number
        }
        Insert: {
          block_reason?: string | null
          block_severity?: string | null
          card_count?: number | null
          card_hierarchy_brand?: string | null
          card_hierarchy_normalized_parallel?: string | null
          card_hierarchy_numbering?: string | null
          card_hierarchy_parallel?: string | null
          card_hierarchy_rank?: number | null
          card_hierarchy_reasoning?: string | null
          card_hierarchy_score_bonus?: number
          card_hierarchy_tier?: string | null
          card_hierarchy_warnings_json?: Json
          card_signature?: string | null
          collector_priority?: string | null
          comp_confidence?: string
          comp_count?: number
          comp_high?: number | null
          comp_low?: number | null
          comp_median?: number | null
          competition?: string
          deal_score?: number
          detected_brands?: string[]
          detected_card_types?: string[]
          detected_players?: string[]
          detected_sets?: string[]
          discount_percent?: number | null
          educational_notes_json?: Json
          estimated_market_value?: number | null
          flip_score?: number
          heat_label?: string | null
          heat_score?: number | null
          hierarchy_explanation_json?: Json
          hold_score?: number
          id?: string
          is_auto?: boolean
          is_blocked?: boolean
          is_certified_auto?: boolean
          is_college?: boolean
          is_damaged?: boolean
          is_insert?: boolean
          is_numbered?: boolean
          is_refractor?: boolean
          is_reprint_risk?: boolean
          is_rookie?: boolean
          is_xfractor?: boolean
          listing_id: string
          market_anchor_explanation_json?: Json
          max_bid?: number
          max_bid_breakdown_json?: Json
          numbered_print_run?: number | null
          player_heat_explanation_json?: Json
          price_per_card?: number | null
          reasoning?: string | null
          recommendation?: string
          recommendation_explanation_json?: Json
          risk_analysis_json?: Json
          risk_score?: number
          score_breakdown_json?: Json
          sniper_score?: number
          tags?: string[]
          updated_at?: string
          urgency?: string
          value_score?: number
        }
        Update: {
          block_reason?: string | null
          block_severity?: string | null
          card_count?: number | null
          card_hierarchy_brand?: string | null
          card_hierarchy_normalized_parallel?: string | null
          card_hierarchy_numbering?: string | null
          card_hierarchy_parallel?: string | null
          card_hierarchy_rank?: number | null
          card_hierarchy_reasoning?: string | null
          card_hierarchy_score_bonus?: number
          card_hierarchy_tier?: string | null
          card_hierarchy_warnings_json?: Json
          card_signature?: string | null
          collector_priority?: string | null
          comp_confidence?: string
          comp_count?: number
          comp_high?: number | null
          comp_low?: number | null
          comp_median?: number | null
          competition?: string
          deal_score?: number
          detected_brands?: string[]
          detected_card_types?: string[]
          detected_players?: string[]
          detected_sets?: string[]
          discount_percent?: number | null
          educational_notes_json?: Json
          estimated_market_value?: number | null
          flip_score?: number
          heat_label?: string | null
          heat_score?: number | null
          hierarchy_explanation_json?: Json
          hold_score?: number
          id?: string
          is_auto?: boolean
          is_blocked?: boolean
          is_certified_auto?: boolean
          is_college?: boolean
          is_damaged?: boolean
          is_insert?: boolean
          is_numbered?: boolean
          is_refractor?: boolean
          is_reprint_risk?: boolean
          is_rookie?: boolean
          is_xfractor?: boolean
          listing_id?: string
          market_anchor_explanation_json?: Json
          max_bid?: number
          max_bid_breakdown_json?: Json
          numbered_print_run?: number | null
          player_heat_explanation_json?: Json
          price_per_card?: number | null
          reasoning?: string | null
          recommendation?: string
          recommendation_explanation_json?: Json
          risk_analysis_json?: Json
          risk_score?: number
          score_breakdown_json?: Json
          sniper_score?: number
          tags?: string[]
          updated_at?: string
          urgency?: string
          value_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "analyses_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      condition_analyses: {
        Row: {
          centering: Json
          condition_advice: string
          condition_label: string
          condition_score: number
          confidence: string
          corners: Json
          created_at: string
          edges: Json
          explanation: string | null
          id: string
          image_quality: Json
          image_url: string | null
          listing_id: string
          overlay_image_url: string | null
          psa_potential: string
          surface: Json
          updated_at: string
          warnings: Json
        }
        Insert: {
          centering?: Json
          condition_advice?: string
          condition_label?: string
          condition_score?: number
          confidence?: string
          corners?: Json
          created_at?: string
          edges?: Json
          explanation?: string | null
          id?: string
          image_quality?: Json
          image_url?: string | null
          listing_id: string
          overlay_image_url?: string | null
          psa_potential?: string
          surface?: Json
          updated_at?: string
          warnings?: Json
        }
        Update: {
          centering?: Json
          condition_advice?: string
          condition_label?: string
          condition_score?: number
          confidence?: string
          corners?: Json
          created_at?: string
          edges?: Json
          explanation?: string | null
          id?: string
          image_quality?: Json
          image_url?: string | null
          listing_id?: string
          overlay_image_url?: string | null
          psa_potential?: string
          surface?: Json
          updated_at?: string
          warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "condition_analyses_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          bid_count: number | null
          buy_now_price: number | null
          current_price: number | null
          end_time: string | null
          first_seen_at: string
          id: string
          image_urls: string[]
          last_seen_at: string
          raw_json: Json | null
          seller_name: string | null
          seller_rating: number | null
          shipping_cost: number | null
          status: string
          title: string
          tradera_item_id: string
          url: string
        }
        Insert: {
          bid_count?: number | null
          buy_now_price?: number | null
          current_price?: number | null
          end_time?: string | null
          first_seen_at?: string
          id?: string
          image_urls?: string[]
          last_seen_at?: string
          raw_json?: Json | null
          seller_name?: string | null
          seller_rating?: number | null
          shipping_cost?: number | null
          status?: string
          title: string
          tradera_item_id: string
          url: string
        }
        Update: {
          bid_count?: number | null
          buy_now_price?: number | null
          current_price?: number | null
          end_time?: string | null
          first_seen_at?: string
          id?: string
          image_urls?: string[]
          last_seen_at?: string
          raw_json?: Json | null
          seller_name?: string | null
          seller_rating?: number | null
          shipping_cost?: number | null
          status?: string
          title?: string
          tradera_item_id?: string
          url?: string
        }
        Relationships: []
      }
      market_comps: {
        Row: {
          bid_count: number | null
          brand: string | null
          card_signature: string
          card_type: string | null
          id: string
          is_auto: boolean
          is_numbered: boolean
          is_refractor: boolean
          is_rookie: boolean
          player: string | null
          raw_title: string | null
          sale_price: number
          set_name: string | null
          shipping_cost: number | null
          sold_at: string
          source: string
          source_listing_id: string | null
        }
        Insert: {
          bid_count?: number | null
          brand?: string | null
          card_signature: string
          card_type?: string | null
          id?: string
          is_auto?: boolean
          is_numbered?: boolean
          is_refractor?: boolean
          is_rookie?: boolean
          player?: string | null
          raw_title?: string | null
          sale_price: number
          set_name?: string | null
          shipping_cost?: number | null
          sold_at?: string
          source?: string
          source_listing_id?: string | null
        }
        Update: {
          bid_count?: number | null
          brand?: string | null
          card_signature?: string
          card_type?: string | null
          id?: string
          is_auto?: boolean
          is_numbered?: boolean
          is_refractor?: boolean
          is_rookie?: boolean
          player?: string | null
          raw_title?: string | null
          sale_price?: number
          set_name?: string | null
          shipping_cost?: number | null
          sold_at?: string
          source?: string
          source_listing_id?: string | null
        }
        Relationships: []
      }
      player_heat: {
        Row: {
          active_listing_count: number
          heat_score: number
          id: string
          label: string
          player: string
          prior_avg_price: number | null
          recent_avg_price: number | null
          sample_size: number
          trend: string
          updated_at: string
        }
        Insert: {
          active_listing_count?: number
          heat_score?: number
          id?: string
          label?: string
          player: string
          prior_avg_price?: number | null
          recent_avg_price?: number | null
          sample_size?: number
          trend?: string
          updated_at?: string
        }
        Update: {
          active_listing_count?: number
          heat_score?: number
          id?: string
          label?: string
          player?: string
          prior_avg_price?: number | null
          recent_avg_price?: number | null
          sample_size?: number
          trend?: string
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          card_hierarchy_brand: string | null
          card_hierarchy_parallel: string | null
          card_hierarchy_tier: string | null
          collector_priority: string | null
          estimated_value: number
          exit_platform: string | null
          id: string
          listing_id: string | null
          notes: string | null
          player: string | null
          purchase_price: number
          purchased_at: string
          shipping: number
          sold_at: string | null
          sold_price: number | null
          status: string
          title: string
          total_cost: number | null
        }
        Insert: {
          card_hierarchy_brand?: string | null
          card_hierarchy_parallel?: string | null
          card_hierarchy_tier?: string | null
          collector_priority?: string | null
          estimated_value?: number
          exit_platform?: string | null
          id?: string
          listing_id?: string | null
          notes?: string | null
          player?: string | null
          purchase_price: number
          purchased_at?: string
          shipping?: number
          sold_at?: string | null
          sold_price?: number | null
          status?: string
          title: string
          total_cost?: number | null
        }
        Update: {
          card_hierarchy_brand?: string | null
          card_hierarchy_parallel?: string | null
          card_hierarchy_tier?: string | null
          collector_priority?: string | null
          estimated_value?: number
          exit_platform?: string | null
          id?: string
          listing_id?: string | null
          notes?: string | null
          player?: string | null
          purchase_price?: number
          purchased_at?: string
          shipping?: number
          sold_at?: string | null
          sold_price?: number | null
          status?: string
          title?: string
          total_cost?: number | null
        }
        Relationships: []
      }
      search_terms: {
        Row: {
          active: boolean
          created_at: string
          id: string
          last_run_at: string | null
          priority: number
          query: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          last_run_at?: string | null
          priority?: number
          query: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          last_run_at?: string | null
          priority?: number
          query?: string
        }
        Relationships: []
      }
      watchlist_items: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          notes: string | null
          recommended_max_bid: number | null
          status: string
          updated_at: string
          user_max_bid: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          notes?: string | null
          recommended_max_bid?: number | null
          status?: string
          updated_at?: string
          user_max_bid?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          notes?: string | null
          recommended_max_bid?: number | null
          status?: string
          updated_at?: string
          user_max_bid?: number | null
        }
        Relationships: []
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
