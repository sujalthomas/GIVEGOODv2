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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
      volunteers: {
        Row: {
          area: string
          created_at: string
          email: string | null
          help_types: string[]
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          area: string
          created_at?: string
          email?: string | null
          help_types: string[]
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          area?: string
          created_at?: string
          email?: string | null
          help_types?: string[]
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      get_unanchored_donations: {
        Args: { batch_size?: number; time_window_hours?: number }
        Returns: {
          amount: number
          created_at: string
          donation_id: string
          payment_id: string
        }[]
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
