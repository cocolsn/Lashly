// Généré depuis Supabase (generate_typescript_types). Ne pas modifier à la main.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      bookings: {
        Row: {
          addon_name: string | null;
          blocked_until: string;
          client_id: string;
          created_at: string;
          deposit_cents: number;
          ends_at: string;
          id: string;
          price_cents: number;
          pro_id: string;
          service_id: string | null;
          service_name: string;
          starts_at: string;
          status: string;
        };
        Insert: {
          addon_name?: string | null;
          blocked_until: string;
          client_id: string;
          created_at?: string;
          deposit_cents?: number;
          ends_at: string;
          id?: string;
          price_cents: number;
          pro_id: string;
          service_id?: string | null;
          service_name: string;
          starts_at: string;
          status?: string;
        };
        Update: {
          addon_name?: string | null;
          blocked_until?: string;
          client_id?: string;
          created_at?: string;
          deposit_cents?: number;
          ends_at?: string;
          id?: string;
          price_cents?: number;
          pro_id?: string;
          service_id?: string | null;
          service_name?: string;
          starts_at?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_pro_id_fkey";
            columns: ["pro_id"];
            isOneToOne: false;
            referencedRelation: "pros";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      client_records: {
        Row: {
          client_id: string;
          created_at: string;
          curl: string | null;
          glue: string | null;
          health_consent_at: string | null;
          id: string;
          lash_type: string | null;
          length_mm: number | null;
          notes: string | null;
          pro_id: string;
          reactions: string | null;
          thickness: number | null;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          curl?: string | null;
          glue?: string | null;
          health_consent_at?: string | null;
          id?: string;
          lash_type?: string | null;
          length_mm?: number | null;
          notes?: string | null;
          pro_id: string;
          reactions?: string | null;
          thickness?: number | null;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          curl?: string | null;
          glue?: string | null;
          health_consent_at?: string | null;
          id?: string;
          lash_type?: string | null;
          length_mm?: number | null;
          notes?: string | null;
          pro_id?: string;
          reactions?: string | null;
          thickness?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "client_records_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: true;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_records_pro_id_fkey";
            columns: ["pro_id"];
            isOneToOne: false;
            referencedRelation: "pros";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          consent_at: string;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          phone: string;
          pro_id: string;
        };
        Insert: {
          consent_at: string;
          created_at?: string;
          email: string;
          full_name: string;
          id?: string;
          phone: string;
          pro_id: string;
        };
        Update: {
          consent_at?: string;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          phone?: string;
          pro_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_pro_id_fkey";
            columns: ["pro_id"];
            isOneToOne: false;
            referencedRelation: "pros";
            referencedColumns: ["id"];
          },
        ];
      };
      opening_breaks: {
        Row: {
          created_at: string;
          end_time: string;
          id: string;
          pro_id: string;
          start_time: string;
          weekday: number;
        };
        Insert: {
          created_at?: string;
          end_time: string;
          id?: string;
          pro_id: string;
          start_time: string;
          weekday: number;
        };
        Update: {
          created_at?: string;
          end_time?: string;
          id?: string;
          pro_id?: string;
          start_time?: string;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "opening_breaks_pro_id_fkey";
            columns: ["pro_id"];
            isOneToOne: false;
            referencedRelation: "pros";
            referencedColumns: ["id"];
          },
        ];
      };
      opening_hours: {
        Row: {
          created_at: string;
          end_time: string;
          fixed_times: string[];
          id: string;
          is_open: boolean;
          pro_id: string;
          slot_mode: string;
          start_time: string;
          weekday: number;
        };
        Insert: {
          created_at?: string;
          end_time?: string;
          fixed_times?: string[];
          id?: string;
          is_open?: boolean;
          pro_id: string;
          slot_mode?: string;
          start_time?: string;
          weekday: number;
        };
        Update: {
          created_at?: string;
          end_time?: string;
          fixed_times?: string[];
          id?: string;
          is_open?: boolean;
          pro_id?: string;
          slot_mode?: string;
          start_time?: string;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "opening_hours_pro_id_fkey";
            columns: ["pro_id"];
            isOneToOne: false;
            referencedRelation: "pros";
            referencedColumns: ["id"];
          },
        ];
      };
      pros: {
        Row: {
          buffer_minutes: number;
          city: string;
          created_at: string;
          id: string;
          pause_end: string | null;
          pause_start: string | null;
          phone: string | null;
          slot_step_minutes: number;
          slug: string;
          studio_name: string;
        };
        Insert: {
          buffer_minutes?: number;
          city: string;
          created_at?: string;
          id: string;
          pause_end?: string | null;
          pause_start?: string | null;
          phone?: string | null;
          slot_step_minutes?: number;
          slug: string;
          studio_name: string;
        };
        Update: {
          buffer_minutes?: number;
          city?: string;
          created_at?: string;
          id?: string;
          pause_end?: string | null;
          pause_start?: string | null;
          phone?: string | null;
          slot_step_minutes?: number;
          slug?: string;
          studio_name?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          active: boolean;
          addon_duration_min: number | null;
          addon_name: string | null;
          addon_price_cents: number | null;
          created_at: string;
          description: string | null;
          duration_min: number;
          id: string;
          name: string;
          position: number;
          price_cents: number;
          pro_id: string;
        };
        Insert: {
          active?: boolean;
          addon_duration_min?: number | null;
          addon_name?: string | null;
          addon_price_cents?: number | null;
          created_at?: string;
          description?: string | null;
          duration_min: number;
          id?: string;
          name: string;
          position?: number;
          price_cents: number;
          pro_id: string;
        };
        Update: {
          active?: boolean;
          addon_duration_min?: number | null;
          addon_name?: string | null;
          addon_price_cents?: number | null;
          created_at?: string;
          description?: string | null;
          duration_min?: number;
          id?: string;
          name?: string;
          position?: number;
          price_cents?: number;
          pro_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_pro_id_fkey";
            columns: ["pro_id"];
            isOneToOne: false;
            referencedRelation: "pros";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_booking: {
        Args: {
          p_consent: boolean;
          p_email: string;
          p_full_name: string;
          p_health_consent: boolean;
          p_phone: string;
          p_reactions: string;
          p_service_id: string;
          p_slug: string;
          p_starts_at: string;
          p_with_addon: boolean;
        };
        Returns: Json;
      };
      get_available_slots: {
        Args: {
          p_days?: number;
          p_service_id: string;
          p_slug: string;
          p_with_addon?: boolean;
        };
        Returns: string[];
      };
      get_public_studio: { Args: { p_slug: string }; Returns: Json };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
