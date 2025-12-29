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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      anchor_batches: {
        Row: {
          batch_end_time: string
          batch_start_time: string
          created_at: string
          donation_count: number
          error_message: string | null
          id: string
          leaf_count: number
          merkle_root: string
          metadata: Json | null
          onchain_block: number | null
          onchain_slot: number | null
          onchain_timestamp: string | null
          onchain_tx_signature: string | null
          retry_count: number | null
          status: string
          total_amount_inr: number
          tree_height: number
          updated_at: string
        }
        Insert: {
          batch_end_time: string
          batch_start_time: string
          created_at?: string
          donation_count?: number
          error_message?: string | null
          id?: string
          leaf_count: number
          merkle_root: string
          metadata?: Json | null
          onchain_block?: number | null
          onchain_slot?: number | null
          onchain_timestamp?: string | null
          onchain_tx_signature?: string | null
          retry_count?: number | null
          status?: string
          total_amount_inr?: number
          tree_height: number
          updated_at?: string
        }
        Update: {
          batch_end_time?: string
          batch_start_time?: string
          created_at?: string
          donation_count?: number
          error_message?: string | null
          id?: string
          leaf_count?: number
          merkle_root?: string
          metadata?: Json | null
          onchain_block?: number | null
          onchain_slot?: number | null
          onchain_timestamp?: string | null
          onchain_tx_signature?: string | null
          retry_count?: number | null
          status?: string
          total_amount_inr?: number
          tree_height?: number
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount_inr: number
          anchor_batch_id: string | null
          anchored: boolean | null
          anonymous: boolean | null
          bank_reference: string | null
          campaign_id: string | null
          card_last4: string | null
          created_at: string
          created_by: string | null
          currency: string
          dedication_message: string | null
          donor_email: string | null
          donor_name: string | null
          donor_pan: string | null
          donor_phone: string | null
          id: string
          internal_tags: string[] | null
          ip_address: unknown
          merkle_leaf_hash: string | null
          merkle_leaf_index: number | null
          merkle_proof: Json | null
          metadata: Json | null
          net_amount_inr: number | null
          notes: string | null
          order_id: string | null
          payment_id: string
          payment_method: string | null
          payment_method_details: Json | null
          provider: string
          purpose: string | null
          razorpay_event_id: string | null
          razorpay_fee_inr: number | null
          razorpay_signature: string | null
          status: string
          tax_amount_inr: number | null
          updated_at: string
          upi_reference: string | null
          user_agent: string | null
          webhook_received_at: string | null
        }
        Insert: {
          amount_inr: number
          anchor_batch_id?: string | null
          anchored?: boolean | null
          anonymous?: boolean | null
          bank_reference?: string | null
          campaign_id?: string | null
          card_last4?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          dedication_message?: string | null
          donor_email?: string | null
          donor_name?: string | null
          donor_pan?: string | null
          donor_phone?: string | null
          id?: string
          internal_tags?: string[] | null
          ip_address?: unknown
          merkle_leaf_hash?: string | null
          merkle_leaf_index?: number | null
          merkle_proof?: Json | null
          metadata?: Json | null
          net_amount_inr?: number | null
          notes?: string | null
          order_id?: string | null
          payment_id: string
          payment_method?: string | null
          payment_method_details?: Json | null
          provider: string
          purpose?: string | null
          razorpay_event_id?: string | null
          razorpay_fee_inr?: number | null
          razorpay_signature?: string | null
          status?: string
          tax_amount_inr?: number | null
          updated_at?: string
          upi_reference?: string | null
          user_agent?: string | null
          webhook_received_at?: string | null
        }
        Update: {
          amount_inr?: number
          anchor_batch_id?: string | null
          anchored?: boolean | null
          anonymous?: boolean | null
          bank_reference?: string | null
          campaign_id?: string | null
          card_last4?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          dedication_message?: string | null
          donor_email?: string | null
          donor_name?: string | null
          donor_pan?: string | null
          donor_phone?: string | null
          id?: string
          internal_tags?: string[] | null
          ip_address?: unknown
          merkle_leaf_hash?: string | null
          merkle_leaf_index?: number | null
          merkle_proof?: Json | null
          metadata?: Json | null
          net_amount_inr?: number | null
          notes?: string | null
          order_id?: string | null
          payment_id?: string
          payment_method?: string | null
          payment_method_details?: Json | null
          provider?: string
          purpose?: string | null
          razorpay_event_id?: string | null
          razorpay_fee_inr?: number | null
          razorpay_signature?: string | null
          status?: string
          tax_amount_inr?: number | null
          updated_at?: string
          upi_reference?: string | null
          user_agent?: string | null
          webhook_received_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_anchor_batch_id_fkey"
            columns: ["anchor_batch_id"]
            isOneToOne: false
            referencedRelation: "anchor_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      feeder_refills: {
        Row: {
          created_at: string
          feeder_condition: string | null
          feeder_id: string
          food_quantity_kg: number
          food_type: string | null
          id: string
          notes: string | null
          photo_url: string | null
          refill_date: string
          refilled_by: string
          updated_at: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          feeder_condition?: string | null
          feeder_id: string
          food_quantity_kg: number
          food_type?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          refill_date?: string
          refilled_by: string
          updated_at?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          feeder_condition?: string | null
          feeder_id?: string
          food_quantity_kg?: number
          food_type?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          refill_date?: string
          refilled_by?: string
          updated_at?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feeder_refills_feeder_id_fkey"
            columns: ["feeder_id"]
            isOneToOne: false
            referencedRelation: "feeders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeder_refills_feeder_id_fkey"
            columns: ["feeder_id"]
            isOneToOne: false
            referencedRelation: "feeders_with_volunteers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeder_refills_refilled_by_fkey"
            columns: ["refilled_by"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      feeders: {
        Row: {
          additional_photos: Json | null
          area_name: string | null
          capacity_kg: number | null
          created_at: string
          feeder_type: string | null
          id: string
          installation_date: string | null
          landmark: string | null
          last_refilled_at: string | null
          latitude: number
          location_name: string
          longitude: number
          metadata: Json | null
          next_refill_due: string | null
          notes: string | null
          photo_url: string | null
          pincode: string
          refill_frequency_days: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_by: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          additional_photos?: Json | null
          area_name?: string | null
          capacity_kg?: number | null
          created_at?: string
          feeder_type?: string | null
          id?: string
          installation_date?: string | null
          landmark?: string | null
          last_refilled_at?: string | null
          latitude: number
          location_name: string
          longitude: number
          metadata?: Json | null
          next_refill_due?: string | null
          notes?: string | null
          photo_url?: string | null
          pincode: string
          refill_frequency_days?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          additional_photos?: Json | null
          area_name?: string | null
          capacity_kg?: number | null
          created_at?: string
          feeder_type?: string | null
          id?: string
          installation_date?: string | null
          landmark?: string | null
          last_refilled_at?: string | null
          latitude?: number
          location_name?: string
          longitude?: number
          metadata?: Json | null
          next_refill_due?: string | null
          notes?: string | null
          photo_url?: string | null
          pincode?: string
          refill_frequency_days?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeders_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_list: {
        Row: {
          created_at: string
          description: string | null
          done: boolean
          done_at: string | null
          id: number
          owner: string
          title: string
          urgent: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          done?: boolean
          done_at?: string | null
          id?: number
          owner: string
          title: string
          urgent?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          done?: boolean
          done_at?: string | null
          id?: number
          owner?: string
          title?: string
          urgent?: boolean
        }
        Relationships: []
      }
      volunteer_feeders: {
        Row: {
          assigned_at: string
          feeder_id: string
          id: string
          is_primary: boolean | null
          role: string
          volunteer_id: string
        }
        Insert: {
          assigned_at?: string
          feeder_id: string
          id?: string
          is_primary?: boolean | null
          role?: string
          volunteer_id: string
        }
        Update: {
          assigned_at?: string
          feeder_id?: string
          id?: string
          is_primary?: boolean | null
          role?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_feeders_feeder_id_fkey"
            columns: ["feeder_id"]
            isOneToOne: false
            referencedRelation: "feeders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_feeders_feeder_id_fkey"
            columns: ["feeder_id"]
            isOneToOne: false
            referencedRelation: "feeders_with_volunteers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_feeders_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteers: {
        Row: {
          area: string
          area_name: string | null
          city: string | null
          created_at: string
          email: string | null
          help_types: string[]
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          pincode: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          area: string
          area_name?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          help_types: string[]
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          pincode?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          area?: string
          area_name?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          help_types?: string[]
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          pincode?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      feeders_with_volunteers: {
        Row: {
          additional_photos: Json | null
          area_name: string | null
          capacity_kg: number | null
          created_at: string | null
          feeder_type: string | null
          id: string | null
          installation_date: string | null
          landmark: string | null
          last_refilled_at: string | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          metadata: Json | null
          next_refill_due: string | null
          notes: string | null
          photo_url: string | null
          pincode: string | null
          refill_frequency_days: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_by: string | null
          tags: string[] | null
          updated_at: string | null
          volunteer_count: number | null
          volunteer_ids: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "feeders_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_area_stats: {
        Args: { p_pincode?: string }
        Returns: {
          active_feeder_count: number
          area_name: string
          avg_coverage_percent: number
          feeder_count: number
          pincode: string
          total_refills_30d: number
          volunteer_count: number
        }[]
      }
      get_donation_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          anchored_donations: number
          completed_donations: number
          pending_donations: number
          total_amount: number
          total_donations: number
        }[]
      }
      get_feeders_needing_refill: {
        Args: Record<PropertyKey, never>
        Returns: {
          area_name: string
          days_overdue: number
          id: string
          last_refilled_at: string
          location_name: string
          next_refill_due: string
          pincode: string
        }[]
      }
      get_unanchored_donations: {
        Args: { batch_size?: number; time_window_hours?: number }
        Returns: {
          amount: number
          created_at: string
          donation_id: string
          payment_id: string
        }[]
      }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
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
