export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_usage: {
        Row: {
          id: string
          prospect_id: string | null
          model: string
          input_tokens: number
          output_tokens: number
          estimated_cost: number
          created_at: string
        }
        Insert: {
          id?: string
          prospect_id?: string | null
          model: string
          input_tokens: number
          output_tokens: number
          estimated_cost: number
          created_at?: string
        }
        Update: {
          id?: string
          prospect_id?: string | null
          model?: string
          input_tokens?: number
          output_tokens?: number
          estimated_cost?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          email_template: string
          id: string
          name: string
          status: string
          target_category: string
          target_location: string
        }
        Insert: {
          created_at?: string
          email_template: string
          id?: string
          name: string
          status?: string
          target_category: string
          target_location: string
        }
        Update: {
          created_at?: string
          email_template?: string
          id?: string
          name?: string
          status?: string
          target_category?: string
          target_location?: string
        }
        Relationships: []
      }
      emails_sent: {
        Row: {
          bounced: boolean
          campaign_id: string
          clicked: boolean
          clicked_at: string | null
          email_content: string
          follow_up_number: number
          id: string
          open_count: number
          opened: boolean
          opened_at: string | null
          prospect_id: string
          replied: boolean
          replied_at: string | null
          sent_at: string
          subject: string
        }
        Insert: {
          bounced?: boolean
          campaign_id: string
          clicked?: boolean
          clicked_at?: string | null
          email_content: string
          follow_up_number?: number
          id?: string
          open_count?: number
          opened?: boolean
          opened_at?: string | null
          prospect_id: string
          replied?: boolean
          replied_at?: string | null
          sent_at?: string
          subject: string
        }
        Update: {
          bounced?: boolean
          campaign_id?: string
          clicked?: boolean
          clicked_at?: string | null
          email_content?: string
          follow_up_number?: number
          id?: string
          open_count?: number
          opened?: boolean
          opened_at?: string | null
          prospect_id?: string
          replied?: boolean
          replied_at?: string | null
          sent_at?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_sent_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_sent_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          content: string
          email_id: string
          follow_up_number: number
          id: string
          sent_at: string
        }
        Insert: {
          content: string
          email_id: string
          follow_up_number: number
          id?: string
          sent_at?: string
        }
        Update: {
          content?: string
          email_id?: string
          follow_up_number?: number
          id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails_sent"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          follow_up_date: string | null
          id: string
          notes: string | null
          prospect_id: string
          status: string
        }
        Insert: {
          created_at?: string
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          prospect_id: string
          status?: string
        }
        Update: {
          created_at?: string
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          prospect_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          business_name: string
          category: string
          created_at: string
          email_verified: boolean
          general_email: string | null
          google_place_id: string | null
          google_rating: number | null
          id: string
          location: string
          owner_email: string | null
          owner_name: string | null
          owner_source: string | null
          phone: string | null
          website: string | null
          website_status: string
        }
        Insert: {
          business_name: string
          category: string
          created_at?: string
          email_verified?: boolean
          general_email?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          id?: string
          location: string
          owner_email?: string | null
          owner_name?: string | null
          owner_source?: string | null
          phone?: string | null
          website?: string | null
          website_status?: string
        }
        Update: {
          business_name?: string
          category?: string
          created_at?: string
          email_verified?: boolean
          general_email?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          id?: string
          location?: string
          owner_email?: string | null
          owner_name?: string | null
          owner_source?: string | null
          phone?: string | null
          website?: string | null
          website_status?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
