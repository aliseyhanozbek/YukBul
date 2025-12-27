import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Environment variables kontrolü
console.log("=== Supabase Client Initialization ===");
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase URL exists:", !!supabaseUrl);
console.log("Supabase URL type:", typeof supabaseUrl);
console.log("Supabase URL length:", supabaseUrl?.length || 0);
console.log("Supabase URL starts with https:", supabaseUrl?.startsWith('https://') || false);
console.log("Supabase Anon Key exists:", !!supabaseAnonKey);
console.log("Supabase Anon Key type:", typeof supabaseAnonKey);
console.log("Supabase Anon Key length:", supabaseAnonKey?.length || 0);
console.log("Supabase Anon Key preview:", supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "undefined");
console.log("Supabase Anon Key ends with expected format:", supabaseAnonKey?.endsWith('==') || supabaseAnonKey?.length > 100 || false);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables!");
  console.error("Please check your .env.local file in the project root directory.");
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error("❌ Invalid Supabase URL format!");
  console.error("URL should start with 'https://' and contain '.supabase.co'");
  throw new Error('Invalid Supabase URL format. URL should be: https://your-project.supabase.co');
}

// Validate API key format (anon keys are typically JWT tokens, should be long)
if (supabaseAnonKey.length < 100) {
  console.warn("⚠️ Supabase Anon Key seems too short. Typical anon keys are 200+ characters.");
}

console.log("✅ Supabase client configuration looks valid");

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

console.log("✅ Supabase client created successfully");

// Database types (optional, for TypeScript support)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string; // UUID from auth.users
          name: string;
          email: string;
          phone: string | null;
          // password is NOT stored here - it's only in auth.users for security
          role: 'musteri' | 'sofor' | 'sirket';
          company_id: string | null;
          address: string | null;
          bio: string | null;
          vehicle: string | null;
          plate: string | null;
          rating: number;
          reviews: number;
          totalShipments: number;
          totalSpent: string;
          avgRating: number;
          memberSince: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Database['public']['Tables']['users']['Row'], 'id' | 'createdAt' | 'updatedAt'>>;
      };
      listings: {
        Row: {
          id: number;
          driverId: string | null; // UUID reference to users
          from: string;
          to: string;
          date: string; // Yükleme Tarihi (Loading Date) - YYYY-MM-DD format
          arrival_date: string | null; // Tahmini Varış Tarihi (Estimated Arrival Date) - YYYY-MM-DD format (snake_case)
          capacity: string;
          vehicleType: string | null;
          price: string;
          description: string | null;
          status: 'Aktif' | 'Beklemede' | 'Tamamlandı' | 'İptal';
          views: number;
          messages: number;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database['public']['Tables']['listings']['Row'], 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Database['public']['Tables']['listings']['Insert']>;
      };
      orders: {
        Row: {
          id: number;
          customerId: string | null; // UUID reference to users
          driverId: string | null; // UUID reference to users
          listingId: number | null;
          from: string;
          to: string;
          date: string;
          cargo: string | null;
          vehicleType: string | null;
          price: string;
          status: 'Onay Bekliyor' | 'Hazırlanıyor' | 'Yolda' | 'Tamamlandı' | 'İptal';
          progress: number;
          eta: string | null;
          completedAt: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      conversations: {
        Row: {
          id: number;
          customerId: string | null; // UUID reference to users
          driverId: string | null; // UUID reference to users
          listingId: number | null;
          lastMessage: string | null;
          time: string | null;
          unread: number; // Legacy field, kept for backward compatibility
          customer_unread_count: number;
          driver_unread_count: number;
          online: boolean;
          route: string | null;
          customer_approved: boolean;
          driver_approved: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };
      messages: {
        Row: {
          id: number;
          conversationId: number | null;
          sender: 'customer' | 'driver' | 'me' | 'other';
          text: string;
          time: string;
          read: boolean;
          createdAt: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'createdAt'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      reviews: {
        Row: {
          id: number;
          customerId: string | null; // UUID reference to users
          driverId: string | null; // UUID reference to users
          orderId: number | null;
          rating: number;
          comment: string | null;
          date: string;
          createdAt: string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'createdAt'>;
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
      };
      shipmentTracking: {
        Row: {
          id: number;
          orderId: number | null;
          currentLocation: string | null;
          lastUpdate: string | null;
          from: Record<string, any> | null;
          to: Record<string, any> | null;
          progress: number;
          eta: string | null;
          vehicleType: string | null;
          vehiclePlate: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database['public']['Tables']['shipmentTracking']['Row'], 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Database['public']['Tables']['shipmentTracking']['Insert']>;
      };
      locationSharing: {
        Row: {
          id: number;
          driverId: string | null; // UUID reference to users
          orderId: number | null;
          latitude: number | null;
          longitude: number | null;
          isSharing: boolean;
          lastUpdate: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database['public']['Tables']['locationSharing']['Row'], 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Database['public']['Tables']['locationSharing']['Insert']>;
      };
      timeline: {
        Row: {
          id: number;
          orderId: number | null;
          status: string;
          time: string | null;
          completed: boolean;
          current: boolean;
          createdAt: string;
        };
        Insert: Omit<Database['public']['Tables']['timeline']['Row'], 'id' | 'createdAt'>;
        Update: Partial<Database['public']['Tables']['timeline']['Insert']>;
      };
      statistics: {
        Row: {
          id: number;
          driverId: string | null; // UUID reference to users
          totalKm: number;
          totalShipments: number;
          totalIncome: string;
          totalExpense: string;
          netProfit: string;
          month: string | null;
          value: number | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database['public']['Tables']['statistics']['Row'], 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Database['public']['Tables']['statistics']['Insert']>;
      };
      companies: {
        Row: {
          id: string; // UUID
          owner_id: string; // UUID
          name: string;
          tax_no: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['companies']['Insert']>;
      };
    };
  };
};

