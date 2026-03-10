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
      audit_log: {
        Row: {
          action: string
          changed_fields: Json | null
          contract_id: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string
        }
        Insert: {
          action: string
          changed_fields?: Json | null
          contract_id: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          changed_fields?: Json | null
          contract_id?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          customer_id: string
          email: string
          id: string
          is_primary: boolean
          name: string
          phone: string
          role: string
        }
        Insert: {
          customer_id: string
          email?: string
          id?: string
          is_primary?: boolean
          name: string
          phone?: string
          role?: string
        }
        Update: {
          customer_id?: string
          email?: string
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_approvals: {
        Row: {
          comment: string | null
          contract_id: string
          decided_at: string | null
          decided_by: string | null
          id: string
          requested_at: string
          requested_by: string
          status: string
        }
        Insert: {
          comment?: string | null
          contract_id: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          requested_at?: string
          requested_by: string
          status?: string
        }
        Update: {
          comment?: string | null
          contract_id?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          requested_at?: string
          requested_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_approvals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_comments: {
        Row: {
          content: string
          contract_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          contract_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          contract_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_comments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_documents: {
        Row: {
          contract_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          original_name: string | null
          uploaded_at: string
          version: number
        }
        Insert: {
          contract_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          original_name?: string | null
          uploaded_at?: string
          version?: number
        }
        Update: {
          contract_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          original_name?: string | null
          uploaded_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_contract_fk"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_tags: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          tag_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          tag_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_tags_contract_fk"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          auto_renew: boolean
          binding_months: number
          contract_type: string
          created_at: string
          created_by: string
          description: string
          id: string
          name: string
          notes: string
          notice_months: number
          reminder_days: number
        }
        Insert: {
          auto_renew?: boolean
          binding_months?: number
          contract_type?: string
          created_at?: string
          created_by: string
          description?: string
          id?: string
          name: string
          notes?: string
          notice_months?: number
          reminder_days?: number
        }
        Update: {
          auto_renew?: boolean
          binding_months?: number
          contract_type?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          name?: string
          notes?: string
          notice_months?: number
          reminder_days?: number
        }
        Relationships: []
      }
      contract_types: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          auto_renew: boolean
          binding_months: number
          contract_name: string
          contract_type: string
          created_at: string
          customer_id: string
          document_url: string | null
          end_date: string
          id: string
          internal_responsible: string
          notes: string
          notice_months: number
          reminder_days: number
          responsible_contact_id: string | null
          start_date: string
          status: string
          value_sek: number | null
        }
        Insert: {
          auto_renew?: boolean
          binding_months?: number
          contract_name: string
          contract_type?: string
          created_at?: string
          customer_id: string
          document_url?: string | null
          end_date: string
          id?: string
          internal_responsible?: string
          notes?: string
          notice_months?: number
          reminder_days?: number
          responsible_contact_id?: string | null
          start_date: string
          status?: string
          value_sek?: number | null
        }
        Update: {
          auto_renew?: boolean
          binding_months?: number
          contract_name?: string
          contract_type?: string
          created_at?: string
          customer_id?: string
          document_url?: string | null
          end_date?: string
          id?: string
          internal_responsible?: string
          notes?: string
          notice_months?: number
          reminder_days?: number
          responsible_contact_id?: string | null
          start_date?: string
          status?: string
          value_sek?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_responsible_contact_id_fkey"
            columns: ["responsible_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string
          city: string
          company_name: string
          created_at: string
          id: string
          invoice_email: string
          notes: string
          org_number: string
          postal_code: string
        }
        Insert: {
          address?: string
          city?: string
          company_name: string
          created_at?: string
          id?: string
          invoice_email?: string
          notes?: string
          org_number?: string
          postal_code?: string
        }
        Update: {
          address?: string
          city?: string
          company_name?: string
          created_at?: string
          id?: string
          invoice_email?: string
          notes?: string
          org_number?: string
          postal_code?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          from_user_id: string | null
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          from_user_id?: string | null
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          from_user_id?: string | null
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      related_contracts: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          related_contract_id: string
          relation_type: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          related_contract_id: string
          relation_type?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          related_contract_id?: string
          relation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "related_contracts_contract_fk"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_contracts_related_fk"
            columns: ["related_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_log: {
        Row: {
          contract_id: string
          error_message: string | null
          id: string
          sent_at: string
          sent_to_email: string
          success: boolean
        }
        Insert: {
          contract_id: string
          error_message?: string | null
          id?: string
          sent_at?: string
          sent_to_email: string
          success?: boolean
        }
        Update: {
          contract_id?: string
          error_message?: string | null
          id?: string
          sent_at?: string
          sent_to_email?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reminder_log_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_filters: {
        Row: {
          created_at: string
          filters: Json
          id: string
          is_shared: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          is_shared?: boolean
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          is_shared?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          default_reminder_days: number
          email_template: string
          id: string
          sender_email: string
          sender_name: string
        }
        Insert: {
          default_reminder_days?: number
          email_template?: string
          id?: string
          sender_email?: string
          sender_name?: string
        }
        Update: {
          default_reminder_days?: number
          email_template?: string
          id?: string
          sender_email?: string
          sender_name?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_level: {
        Args: {
          _min_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "reader"
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
      app_role: ["admin", "user", "reader"],
    },
  },
} as const
