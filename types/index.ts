/**
 * App-local user + onboarding types.
 *
 * The travel-era type barrel (bookings, trips, rewards, flights, …) was removed
 * with the screens that used it in the W4nder -> Paint the Town rebrand. What
 * remains is the locally-persisted profile that AppContext keeps in AsyncStorage
 * — the authoritative subscription tier lives in Supabase, not here.
 */

export interface LoyaltyProgram {
  id: string;
  name: string;
  type: 'airline' | 'hotel' | 'creditCard' | 'other';
  memberId: string;
  points: number;
  tier?: string;
  icon?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  travelStyle: string;
  budgetRange: string;
  preferences: string[];
  tripsCompleted: number;
  countriesVisited: number;
  memberSince: string;
  loyaltyPrograms?: LoyaltyProgram[];
  rewardPoints: number;
  subscriptionTier: 'free' | 'standard' | 'premium' | 'family';
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
  emergencyContacts?: EmergencyContact[];
  languagePreference?: string;
  carbonOffsetEnabled?: boolean;
}

export interface OnboardingData {
  travelStyle: string | null;
  budgetRange: string | null;
  preferences: string[];
  foodPreferences: string[];
}
