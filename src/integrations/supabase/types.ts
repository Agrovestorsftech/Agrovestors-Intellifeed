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
      activities: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          meta: Json
          target_id: string | null
          target_type: string | null
          verb: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          target_id?: string | null
          target_type?: string | null
          verb: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          target_id?: string | null
          target_type?: string | null
          verb?: string
        }
        Relationships: []
      }
      farmers: {
        Row: {
          assigned_agent_id: string | null
          avatar_url: string | null
          created_at: string
          farm_name: string | null
          id: string
          livestock_type: string | null
          name: string
          notes: string | null
          phone: string | null
          region: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_agent_id?: string | null
          avatar_url?: string | null
          created_at?: string
          farm_name?: string | null
          id?: string
          livestock_type?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          region?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_agent_id?: string | null
          avatar_url?: string | null
          created_at?: string
          farm_name?: string | null
          id?: string
          livestock_type?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          region?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      feed_orders: {
        Row: {
          agent_id: string | null
          farmer_id: string | null
          id: string
          order_no: string
          placed_at: string
          product_id: string | null
          quantity: number
          status: string
        }
        Insert: {
          agent_id?: string | null
          farmer_id?: string | null
          id?: string
          order_no?: string
          placed_at?: string
          product_id?: string | null
          quantity?: number
          status?: string
        }
        Update: {
          agent_id?: string | null
          farmer_id?: string | null
          id?: string
          order_no?: string
          placed_at?: string
          product_id?: string | null
          quantity?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_orders_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "feed_products"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_products: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          price_per_unit: number | null
          sku: string
          unit: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          price_per_unit?: number | null
          sku: string
          unit?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          price_per_unit?: number | null
          sku?: string
          unit?: string
        }
        Relationships: []
      }
      health_cases: {
        Row: {
          created_at: string
          diagnosis: string | null
          farmer_id: string | null
          id: string
          opened_by: string | null
          severity: string
          status: string
          treatment: string | null
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          farmer_id?: string | null
          id?: string
          opened_by?: string | null
          severity?: string
          status?: string
          treatment?: string | null
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          farmer_id?: string | null
          id?: string
          opened_by?: string | null
          severity?: string
          status?: string
          treatment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_cases_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          id: string
          product_id: string | null
          quantity: number
          reorder_level: number
          updated_at: string
          warehouse: string
        }
        Insert: {
          id?: string
          product_id?: string | null
          quantity?: number
          reorder_level?: number
          updated_at?: string
          warehouse?: string
        }
        Update: {
          id?: string
          product_id?: string | null
          quantity?: number
          reorder_level?: number
          updated_at?: string
          warehouse?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "feed_products"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          author_id: string | null
          body: string
          category: string | null
          created_at: string
          id: string
          published: boolean
          tags: string[] | null
          title: string
        }
        Insert: {
          author_id?: string | null
          body: string
          category?: string | null
          created_at?: string
          id?: string
          published?: boolean
          tags?: string[] | null
          title: string
        }
        Update: {
          author_id?: string | null
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          published?: boolean
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          recipient_id: string
          title: string
          type?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      nutrition_plans: {
        Row: {
          created_at: string
          created_by: string | null
          effective_from: string | null
          farmer_id: string | null
          id: string
          plan: Json
          species: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_from?: string | null
          farmer_id?: string | null
          id?: string
          plan?: Json
          species?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_from?: string | null
          farmer_id?: string | null
          id?: string
          plan?: Json
          species?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plans_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      production_runs: {
        Row: {
          batch_no: string
          created_at: string
          finished_at: string | null
          id: string
          product_id: string | null
          quantity: number
          started_at: string | null
          status: string
        }
        Insert: {
          batch_no: string
          created_at?: string
          finished_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          started_at?: string | null
          status?: string
        }
        Update: {
          batch_no?: string
          created_at?: string
          finished_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_runs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "feed_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          initials: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          initials?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          initials?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assignee_id: string | null
          created_at: string
          id: string
          opened_by: string | null
          portal: string
          priority: string
          status: string
          subject: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          id?: string
          opened_by?: string | null
          portal?: string
          priority?: string
          status?: string
          subject: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          id?: string
          opened_by?: string | null
          portal?: string
          priority?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          meta: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          priority: string
          status: string
          title: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
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
      visit_reports: {
        Row: {
          agent_id: string | null
          farmer_id: string | null
          id: string
          payload: Json
          priority: string
          reviewed_at: string | null
          reviewed_by: string | null
          species: string | null
          status: string
          submitted_at: string
          summary: string | null
        }
        Insert: {
          agent_id?: string | null
          farmer_id?: string | null
          id?: string
          payload?: Json
          priority?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          species?: string | null
          status?: string
          submitted_at?: string
          summary?: string | null
        }
        Update: {
          agent_id?: string | null
          farmer_id?: string | null
          id?: string
          payload?: Json
          priority?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          species?: string | null
          status?: string
          submitted_at?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_reports_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "system_admin" | "field_agent" | "admin_agent" | "feedops"
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
      app_role: ["system_admin", "field_agent", "admin_agent", "feedops"],
    },
  },
} as const
