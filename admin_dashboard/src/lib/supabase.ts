import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables");
}

// Singleton pattern - يمنع إنشاء عدة instances
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: 'avon-auth-token',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      }
    );
  }
  return supabaseInstance;
};

export const supabase = getSupabase();

export type Database = {
  public: {
    Tables: {
      services: {
        Row: {
          id: string;
          name_ar: string;
          name_en?: string;
          price_iqd: number;
          duration_minutes: number;
          description?: string;
          category?: string;
          image_url?: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en?: string;
          price_iqd: number;
          duration_minutes: number;
          description?: string;
          category?: string;
          image_url?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };
      branches: {
        Row: {
          id: string;
          name_ar: string;
          address?: string;
          phone?: string;
          working_hours?: string;
          image_url?: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name_ar: string;
          address?: string;
          phone?: string;
          working_hours?: string;
          image_url?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['branches']['Insert']>;
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          service_id: string;
          branch_id: string;
          doctor_name?: string;
          appointment_date: string;
          appointment_time: string;
          status: string;
          total_price_iqd: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          service_id: string;
          branch_id: string;
          doctor_name?: string;
          appointment_date: string;
          appointment_time: string;
          status?: string;
          total_price_iqd: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          email?: string;
          full_name?: string;
          phone?: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string;
          full_name?: string;
          phone?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      offers: {
        Row: {
          id: string;
          title_ar: string;
          description?: string;
          discount_percentage: number;
          original_price: number;
          discounted_price: number;
          image_url?: string;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title_ar: string;
          description?: string;
          discount_percentage: number;
          original_price: number;
          discounted_price: number;
          image_url?: string;
          start_date: string;
          end_date: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['offers']['Insert']>;
      };
      doctors: {
        Row: {
          id: string;
          name: string;
          specialty?: string;
          experience?: number;
          phone?: string;
          email?: string;
          bio?: string;
          rating: number;
          image_url?: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          specialty?: string;
          experience?: number;
          phone?: string;
          email?: string;
          bio?: string;
          rating?: number;
          image_url?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['doctors']['Insert']>;
      };
    };
  };
};
