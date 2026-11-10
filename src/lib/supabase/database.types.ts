// Généré depuis Supabase (generate_typescript_types). Ne pas modifier à la main.
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      pros: {
        Row: {
          buffer_minutes: number;
          city: string;
          created_at: string;
          id: string;
          pause_end: string | null;
          pause_start: string | null;
          phone: string | null;
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
          slug?: string;
          studio_name?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          active: boolean;
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
