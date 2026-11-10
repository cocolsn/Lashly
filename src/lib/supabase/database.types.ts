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
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
