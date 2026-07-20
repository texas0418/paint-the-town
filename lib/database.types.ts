/**
 * W4nder Database Types
 * 
 * These types match the Supabase schema exactly.
 * You can regenerate these using: npx supabase gen types typescript
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          date_of_birth: string | null;
          nationality: string | null;
          preferred_currency: string;
          preferred_language: string;
          timezone: string;
          subscription_tier: 'free' | 'standard' | 'premium' | 'family';
          subscription_expires_at: string | null;
          onboarding_completed: boolean;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          nationality?: string | null;
          preferred_currency?: string;
          preferred_language?: string;
          timezone?: string;
          subscription_tier?: 'free' | 'standard' | 'premium' | 'family';
          subscription_expires_at?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          nationality?: string | null;
          preferred_currency?: string;
          preferred_language?: string;
          timezone?: string;
          subscription_tier?: 'free' | 'standard' | 'premium' | 'family';
          subscription_expires_at?: string | null;
          onboarding_completed?: boolean;
          push_token?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          travel_style: string | null;
          budget_range: string | null;
          preferred_activities: string[] | null;
          dietary_restrictions: string[] | null;
          accessibility_needs: string[] | null;
          preferred_airlines: string[] | null;
          preferred_hotels: string[] | null;
          avoid_countries: string[] | null;
          food_loves: string[] | null;
          food_dislikes: string[] | null;
          activity_loves: string[] | null;
          activity_dislikes: string[] | null;
          music_genres: string[] | null;
          drinks: string[] | null;
          venue_style: string | null;
          date_budget: number | null;
          home_city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          travel_style?: string | null;
          budget_range?: string | null;
          preferred_activities?: string[] | null;
          dietary_restrictions?: string[] | null;
          accessibility_needs?: string[] | null;
          preferred_airlines?: string[] | null;
          preferred_hotels?: string[] | null;
          avoid_countries?: string[] | null;
          food_loves?: string[] | null;
          food_dislikes?: string[] | null;
          activity_loves?: string[] | null;
          activity_dislikes?: string[] | null;
          music_genres?: string[] | null;
          drinks?: string[] | null;
          venue_style?: string | null;
          date_budget?: number | null;
          home_city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          travel_style?: string | null;
          budget_range?: string | null;
          preferred_activities?: string[] | null;
          dietary_restrictions?: string[] | null;
          accessibility_needs?: string[] | null;
          preferred_airlines?: string[] | null;
          preferred_hotels?: string[] | null;
          avoid_countries?: string[] | null;
          food_loves?: string[] | null;
          food_dislikes?: string[] | null;
          activity_loves?: string[] | null;
          activity_dislikes?: string[] | null;
          music_genres?: string[] | null;
          drinks?: string[] | null;
          venue_style?: string | null;
          date_budget?: number | null;
          home_city?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      date_plans: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          city: string;
          plan_date: string | null;
          start_time: string | null;
          total_budget: number | null;
          estimated_cost: number | null;
          status: 'saved' | 'scheduled' | 'completed' | 'cancelled';
          source: 'ai' | 'custom';
          vibe: string | null;
          items: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          city: string;
          plan_date?: string | null;
          start_time?: string | null;
          total_budget?: number | null;
          estimated_cost?: number | null;
          status?: 'saved' | 'scheduled' | 'completed' | 'cancelled';
          source?: 'ai' | 'custom';
          vibe?: string | null;
          items?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          city?: string;
          plan_date?: string | null;
          start_time?: string | null;
          total_budget?: number | null;
          estimated_cost?: number | null;
          status?: 'saved' | 'scheduled' | 'completed' | 'cancelled';
          source?: 'ai' | 'custom';
          vibe?: string | null;
          items?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      plan_jobs: {
        Row: {
          id: string;
          user_id: string;
          status: 'pending' | 'done' | 'error';
          request: Json;
          plans: Json | null;
          partial: Json;
          progress: Json | null;
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: 'pending' | 'done' | 'error';
          request?: Json;
          plans?: Json | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'pending' | 'done' | 'error';
          plans?: Json | null;
          error?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      destinations: {
        Row: {
          id: string;
          name: string;
          country: string;
          description: string | null;
          image_url: string | null;
          rating: number | null;
          review_count: number;
          tags: string[] | null;
          avg_price: number | null;
          currency: string;
          best_season: string | null;
          latitude: number | null;
          longitude: number | null;
          timezone: string | null;
          language: string | null;
          visa_required: boolean;
          safety_rating: 'low' | 'moderate' | 'high' | 'critical' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          country: string;
          description?: string | null;
          image_url?: string | null;
          rating?: number | null;
          review_count?: number;
          tags?: string[] | null;
          avg_price?: number | null;
          currency?: string;
          best_season?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          timezone?: string | null;
          language?: string | null;
          visa_required?: boolean;
          safety_rating?: 'low' | 'moderate' | 'high' | 'critical' | null;
        };
        Update: Partial<Database['public']['Tables']['destinations']['Insert']>;
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          destination_id: string | null;
          start_date: string;
          end_date: string;
          status: 'planning' | 'booked' | 'in_progress' | 'completed' | 'cancelled';
          budget_total: number | null;
          budget_spent: number;
          currency: string;
          is_group_trip: boolean;
          group_id: string | null;
          cover_image_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          destination_id?: string | null;
          start_date: string;
          end_date: string;
          status?: 'planning' | 'booked' | 'in_progress' | 'completed' | 'cancelled';
          budget_total?: number | null;
          budget_spent?: number;
          currency?: string;
          is_group_trip?: boolean;
          group_id?: string | null;
          cover_image_url?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['trips']['Insert']>;
        Relationships: [];
      };
      itinerary_days: {
        Row: {
          id: string;
          trip_id: string;
          day_number: number;
          date: string;
          title: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          day_number: number;
          date: string;
          title?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['itinerary_days']['Insert']>;
        Relationships: [];
      };
      itinerary_items: {
        Row: {
          id: string;
          itinerary_day_id: string;
          type: 'flight' | 'hotel' | 'restaurant' | 'activity' | 'transport' | 'event' | 'free_time';
          name: string;
          description: string | null;
          start_time: string | null;
          end_time: string | null;
          location: string | null;
          latitude: number | null;
          longitude: number | null;
          price: number | null;
          currency: string;
          booking_id: string | null;
          confirmation_code: string | null;
          notes: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          itinerary_day_id: string;
          type: 'flight' | 'hotel' | 'restaurant' | 'activity' | 'transport' | 'event' | 'free_time';
          name: string;
          description?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          price?: number | null;
          currency?: string;
          booking_id?: string | null;
          confirmation_code?: string | null;
          notes?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['itinerary_items']['Insert']>;
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          trip_id: string | null;
          type: 'flight' | 'hotel' | 'car_rental' | 'activity' | 'restaurant' | 'event' | 'insurance' | 'transfer';
          provider_name: string;
          provider_booking_id: string | null;
          confirmation_code: string | null;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
          price_total: number;
          price_paid: number;
          currency: string;
          commission_rate: number | null;
          booking_date: string;
          start_date: string | null;
          end_date: string | null;
          start_time: string | null;
          end_time: string | null;
          details: Json | null;
          cancellation_policy: string | null;
          is_refundable: boolean;
          refund_deadline: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          trip_id?: string | null;
          type: 'flight' | 'hotel' | 'car_rental' | 'activity' | 'restaurant' | 'event' | 'insurance' | 'transfer';
          provider_name: string;
          provider_booking_id?: string | null;
          confirmation_code?: string | null;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
          price_total: number;
          price_paid?: number;
          currency?: string;
          commission_rate?: number | null;
          booking_date?: string;
          start_date?: string | null;
          end_date?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          details?: Json | null;
          cancellation_policy?: string | null;
          is_refundable?: boolean;
          refund_deadline?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'booking' | 'reminder' | 'alert' | 'group' | 'reward' | 'promo' | 'system';
          title: string;
          message: string;
          read: boolean;
          action_url: string | null;
          trip_id: string | null;
          booking_id: string | null;
          priority: 'low' | 'medium' | 'high';
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'booking' | 'reminder' | 'alert' | 'group' | 'reward' | 'promo' | 'system';
          title: string;
          message: string;
          read?: boolean;
          action_url?: string | null;
          trip_id?: string | null;
          booking_id?: string | null;
          priority?: 'low' | 'medium' | 'high';
          expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          trip_id: string;
          category: 'food' | 'transport' | 'accommodation' | 'activities' | 'shopping' | 'other';
          amount: number;
          currency: string;
          description: string | null;
          date: string;
          paid_by: string | null;
          receipt_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          trip_id: string;
          category: 'food' | 'transport' | 'accommodation' | 'activities' | 'shopping' | 'other';
          amount: number;
          currency?: string;
          description?: string | null;
          date: string;
          paid_by?: string | null;
          receipt_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
        Relationships: [];
      };
      loyalty_programs: {
        Row: {
          id: string;
          user_id: string;
          program_name: string;
          program_type: 'airline' | 'hotel' | 'credit_card' | 'other' | null;
          member_id: string | null;
          points: number;
          tier: string | null;
          icon_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          program_name: string;
          program_type?: 'airline' | 'hotel' | 'credit_card' | 'other' | null;
          member_id?: string | null;
          points?: number;
          tier?: string | null;
          icon_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['loyalty_programs']['Insert']>;
        Relationships: [];
      };
      bucket_list: {
        Row: {
          id: string;
          user_id: string;
          destination_id: string;
          added_at: string;
          target_date: string | null;
          notes: string | null;
          priority: number;
          is_completed: boolean;
          completed_trip_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          destination_id: string;
          added_at?: string;
          target_date?: string | null;
          notes?: string | null;
          priority?: number;
          is_completed?: boolean;
          completed_trip_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['bucket_list']['Insert']>;
        Relationships: [];
      };
      trip_groups: {
        Row: {
          id: string;
          name: string;
          trip_id: string | null;
          organizer_id: string;
          chat_enabled: boolean;
          budget_pool: number | null;
          split_method: 'equal' | 'custom' | 'per_item';
          invite_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          trip_id?: string | null;
          organizer_id: string;
          chat_enabled?: boolean;
          budget_pool?: number | null;
          split_method?: 'equal' | 'custom' | 'per_item';
          invite_code?: string | null;
        };
        Update: Partial<Database['public']['Tables']['trip_groups']['Insert']>;
        Relationships: [];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: 'organizer' | 'member';
          status: 'pending' | 'accepted' | 'declined';
          contribution: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: 'organizer' | 'member';
          status?: 'pending' | 'accepted' | 'declined';
          contribution?: number;
        };
        Update: Partial<Database['public']['Tables']['group_members']['Insert']>;
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          group_id: string;
          sender_id: string;
          message: string;
          type: 'text' | 'image' | 'itinerary' | 'vote' | 'system';
          attachment_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          sender_id: string;
          message: string;
          type?: 'text' | 'image' | 'itinerary' | 'vote' | 'system';
          attachment_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Trip = Database['public']['Tables']['trips']['Row'];
export type TripInsert = Database['public']['Tables']['trips']['Insert'];
export type TripUpdate = Database['public']['Tables']['trips']['Update'];

export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
export type BookingUpdate = Database['public']['Tables']['bookings']['Update'];

export type Destination = Database['public']['Tables']['destinations']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Expense = Database['public']['Tables']['expenses']['Row'];
export type LoyaltyProgram = Database['public']['Tables']['loyalty_programs']['Row'];
export type BucketListItem = Database['public']['Tables']['bucket_list']['Row'];
export type TripGroup = Database['public']['Tables']['trip_groups']['Row'];
export type GroupMember = Database['public']['Tables']['group_members']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
