/**
 * Database Types
 * 
 * TypeScript type definitions for Supabase database tables.
 * These types are generated based on the database schema.
 */

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string; // UUID from auth.users
          name: string;
          email: string;
          phone: string | null;
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
          arrival_date: string | null; // Tahmini Varış Tarihi (Estimated Arrival Date) - YYYY-MM-DD format
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

// Convenience type exports
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Listing = Database['public']['Tables']['listings']['Row'];
export type ListingInsert = Database['public']['Tables']['listings']['Insert'];
export type ListingUpdate = Database['public']['Tables']['listings']['Update'];

export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

export type Review = Database['public']['Tables']['reviews']['Row'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update'];

export type ShipmentTracking = Database['public']['Tables']['shipmentTracking']['Row'];
export type ShipmentTrackingInsert = Database['public']['Tables']['shipmentTracking']['Insert'];
export type ShipmentTrackingUpdate = Database['public']['Tables']['shipmentTracking']['Update'];

export type LocationSharing = Database['public']['Tables']['locationSharing']['Row'];
export type LocationSharingInsert = Database['public']['Tables']['locationSharing']['Insert'];
export type LocationSharingUpdate = Database['public']['Tables']['locationSharing']['Update'];

export type Timeline = Database['public']['Tables']['timeline']['Row'];
export type TimelineInsert = Database['public']['Tables']['timeline']['Insert'];
export type TimelineUpdate = Database['public']['Tables']['timeline']['Update'];

export type Statistics = Database['public']['Tables']['statistics']['Row'];
export type StatisticsInsert = Database['public']['Tables']['statistics']['Insert'];
export type StatisticsUpdate = Database['public']['Tables']['statistics']['Update'];

export type Company = Database['public']['Tables']['companies']['Row'];
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
export type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

