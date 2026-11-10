// Généré depuis Supabase (generate_typescript_types). Ne pas modifier à la main.
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
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
          phone: string | null;
          slug: string;
          studio_name: string;
        };
        Insert: {
          buffer_minutes?: number;
          city: string;
          created_at?: string;
          id: string;
          phone?: string | null;
          slug: string;
          studio_name: string;
        };
        Update: {
          buffer_minutes?: number;
          city?: string;
          created_at?: string;
          id?: string;
          phone?: string | null;
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
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
