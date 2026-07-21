/**
 * Supabase Client Configuration for Paint the Town App
 * 
 * Setup Instructions:
 * 1. Install: npm install @supabase/supabase-js @react-native-async-storage/async-storage
 * 2. Create .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
 * 3. Import this file wherever you need database access
 */

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============================================
// AUTH HELPERS
// ============================================

export const auth = {
  /**
   * Sign up with email and password
   */
  signUp: async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  /**
   * Sign in with OAuth provider (Google, Apple)
   */
  signInWithOAuth: async (provider: 'google' | 'apple') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'painthetown://auth/callback',
        skipBrowserRedirect: true,
      },
    });
    return { data, error };
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Get current session
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  },

  /**
   * Get current user
   */
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { user: data.user, error };
  },

  /**
   * Send password reset email
   */
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'painthetown://auth/reset-password',
    });
    return { data, error };
  },

  /**
   * Update user password
   */
  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ============================================
// DATABASE HELPERS
// ============================================

export const db = {
  // Profiles
  profiles: {
    get: async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return { data, error };
    },
    update: async (userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      return { data, error };
    },
  },

  // Trips
  trips: {
    list: async (userId: string) => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          destination:destinations(*),
          bookings(*)
        `)
        .eq('user_id', userId)
        .order('start_date', { ascending: false });
      return { data, error };
    },
    get: async (tripId: string) => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          destination:destinations(*),
          bookings(*),
          itinerary_days(
            *,
            items:itinerary_items(*)
          )
        `)
        .eq('id', tripId)
        .single();
      return { data, error };
    },
    create: async (trip: Database['public']['Tables']['trips']['Insert']) => {
      const { data, error } = await supabase
        .from('trips')
        .insert(trip)
        .select()
        .single();
      return { data, error };
    },
    update: async (tripId: string, updates: Database['public']['Tables']['trips']['Update']) => {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', tripId)
        .select()
        .single();
      return { data, error };
    },
    delete: async (tripId: string) => {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);
      return { error };
    },
  },

  // Bookings
  bookings: {
    list: async (tripId: string) => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('trip_id', tripId)
        .order('start_date', { ascending: true });
      return { data, error };
    },
    create: async (booking: Database['public']['Tables']['bookings']['Insert']) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert(booking)
        .select()
        .single();
      return { data, error };
    },
    update: async (bookingId: string, updates: Database['public']['Tables']['bookings']['Update']) => {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single();
      return { data, error };
    },
  },

  // Destinations (public data)
  destinations: {
    list: async (filters?: { country?: string; tags?: string[] }) => {
      let query = supabase
        .from('destinations')
        .select('*')
        .order('rating', { ascending: false });
      
      if (filters?.country) {
        query = query.eq('country', filters.country);
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      
      const { data, error } = await query;
      return { data, error };
    },
    get: async (destinationId: string) => {
      const { data, error } = await supabase
        .from('destinations')
        .select(`
          *,
          activities(*),
          local_tips(*)
        `)
        .eq('id', destinationId)
        .single();
      return { data, error };
    },
    search: async (query: string) => {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .or(`name.ilike.%${query}%,country.ilike.%${query}%`)
        .limit(20);
      return { data, error };
    },
  },

  // Notifications
  notifications: {
    list: async (userId: string, unreadOnly = false) => {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (unreadOnly) {
        query = query.eq('read', false);
      }
      
      const { data, error } = await query;
      return { data, error };
    },
    markAsRead: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      return { error };
    },
    markAllAsRead: async (userId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
      return { error };
    },
  },

  // Expenses
  expenses: {
    list: async (tripId: string) => {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          splits:expense_splits(*)
        `)
        .eq('trip_id', tripId)
        .order('date', { ascending: false });
      return { data, error };
    },
    create: async (expense: Database['public']['Tables']['expenses']['Insert']) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single();
      return { data, error };
    },
  },

  // Bucket list
  bucketList: {
    list: async (userId: string) => {
      const { data, error } = await supabase
        .from('bucket_list')
        .select(`
          *,
          destination:destinations(*)
        `)
        .eq('user_id', userId)
        .order('priority', { ascending: false });
      return { data, error };
    },
    add: async (userId: string, destinationId: string) => {
      const { data, error } = await supabase
        .from('bucket_list')
        .insert({ user_id: userId, destination_id: destinationId })
        .select()
        .single();
      return { data, error };
    },
    remove: async (userId: string, destinationId: string) => {
      const { error } = await supabase
        .from('bucket_list')
        .delete()
        .eq('user_id', userId)
        .eq('destination_id', destinationId);
      return { error };
    },
  },
};

// ============================================
// STORAGE HELPERS
// ============================================

export const storage = {
  /**
   * Upload a file to a bucket
   */
  upload: async (bucket: string, path: string, file: Blob | File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
    return { data, error };
  },

  /**
   * Get public URL for a file
   */
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Delete a file from storage
   */
  delete: async (bucket: string, paths: string[]) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths);
    return { data, error };
  },

  /**
   * Upload user avatar
   */
  uploadAvatar: async (userId: string, file: Blob | File) => {
    const ext = 'jpg';
    const path = `${userId}/avatar.${ext}`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    
    if (error) return { url: null, error };
    
    const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    return { url, error: null };
  },

  /**
   * Upload trip photo
   */
  uploadTripPhoto: async (userId: string, tripId: string, file: Blob | File, filename: string) => {
    const path = `${userId}/${tripId}/${filename}`;
    const { data, error } = await supabase.storage
      .from('trip-photos')
      .upload(path, file);
    
    if (error) return { url: null, error };
    
    const url = supabase.storage.from('trip-photos').getPublicUrl(path).data.publicUrl;
    return { url, error: null };
  },
};

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

export const realtime = {
  /**
   * Subscribe to trip updates
   */
  subscribeToTrip: (tripId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`trip:${tripId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` },
        callback
      )
      .subscribe();
  },

  /**
   * Subscribe to group chat messages
   */
  subscribeToGroupChat: (groupId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`chat:${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `group_id=eq.${groupId}` },
        callback
      )
      .subscribe();
  },

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        callback
      )
      .subscribe();
  },

  /**
   * Unsubscribe from a channel
   */
  unsubscribe: (channel: any) => {
    return supabase.removeChannel(channel);
  },
};

export default supabase;
