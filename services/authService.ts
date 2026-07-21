// services/authService.ts
// Handles all authentication with Supabase

import { supabase } from '@/lib/supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

// Types
export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

// Transform Supabase user to app user
const transformUser = (user: any): AuthUser => ({
  id: user.id,
  email: user.email || '',
  fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
  avatarUrl: user.user_metadata?.avatar_url || '',
});

// ============================================
// EMAIL AUTHENTICATION
// ============================================

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  fullName?: string
): Promise<AuthResult> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      return { success: true, user: transformUser(data.user) };
    }

    return { success: false, error: 'Sign up failed' };
  } catch (err: any) {
    return { success: false, error: err.message || 'An error occurred' };
  }
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      return { success: true, user: transformUser(data.user) };
    }

    return { success: false, error: 'Sign in failed' };
  } catch (err: any) {
    return { success: false, error: err.message || 'An error occurred' };
  }
};

// ============================================
// APPLE AUTHENTICATION (iOS)
// ============================================

// Check if Apple Sign In is available
export const isAppleSignInAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  return await AppleAuthentication.isAvailableAsync();
};

// Sign in with Apple (native iOS)
export const signInWithApple = async (): Promise<AuthResult> => {
  try {
    // Check availability
    const isAvailable = await isAppleSignInAvailable();
    if (!isAvailable) {
      return { success: false, error: 'Apple Sign In is not available on this device' };
    }

    // Request Apple credentials
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // Get the identity token
    if (!credential.identityToken) {
      return { success: false, error: 'No identity token received from Apple' };
    }

    // Sign in with Supabase using the Apple token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Update user profile with Apple-provided name (only available on first sign in)
    if (data.user && credential.fullName) {
      const fullName = [credential.fullName.givenName, credential.fullName.familyName]
        .filter(Boolean)
        .join(' ');

      if (fullName) {
        await supabase.auth.updateUser({
          data: { full_name: fullName },
        });

        // Also update the profiles table
        await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', data.user.id);
      }
    }

    if (data.user) {
      return { success: true, user: transformUser(data.user) };
    }

    return { success: false, error: 'Apple sign in failed' };
  } catch (err: any) {
    if (err.code === 'ERR_REQUEST_CANCELED') {
      return { success: false, error: 'Sign in was cancelled' };
    }
    return { success: false, error: err.message || 'An error occurred' };
  }
};

// ============================================
// SESSION MANAGEMENT
// ============================================

// Get current user
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? transformUser(user) : null;
  } catch {
    return null;
  }
};

// Get current session
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Sign out
export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An error occurred' };
  }
};

// ============================================
// PASSWORD MANAGEMENT
// ============================================

// Send password reset email
export const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'painthetown://reset-password', // Deep link to your app
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An error occurred' };
  }
};

// Update password (when user is logged in)
export const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An error occurred' };
  }
};

// ============================================
// PROFILE MANAGEMENT
// ============================================

// Update user profile
export const updateProfile = async (updates: {
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Update auth metadata
    if (updates.fullName) {
      await supabase.auth.updateUser({
        data: { full_name: updates.fullName },
      });
    }

    // Update profiles table
    const profileUpdates: any = {};
    if (updates.fullName) profileUpdates.full_name = updates.fullName;
    if (updates.avatarUrl) profileUpdates.avatar_url = updates.avatarUrl;
    if (updates.phone) profileUpdates.phone = updates.phone;

    const { error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An error occurred' };
  }
};

// Get user profile from database
export const getProfile = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};

// ============================================
// AUTH STATE LISTENER
// ============================================

// Subscribe to auth state changes
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      callback(transformUser(session.user));
    } else {
      callback(null);
    }
  });

  return subscription;
};
