// services/activityService.ts
// Replaces: mocks/experiences.ts

import { supabase } from '@/lib/supabase';

// Types matching your app's LocalExperience / Activity types
export interface Activity {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  category: string[];
  image: string;
  images?: string[];
  price: number;
  currency: string;
  duration: string;
  rating: number;
  reviewCount: number;
  city: string;
  country: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  included?: string[];
  notIncluded?: string[];
  requirements?: string[];
  languages?: string[];
  maxParticipants?: number;
  instantBook: boolean;
  cancellationPolicy?: string;
  destinationId?: string;
}

// Static category data
export const experienceCategories = [
  { id: 'all', label: 'All', icon: 'Sparkles' },
  { id: 'tours', label: 'Tours', icon: 'Map' },
  { id: 'classes', label: 'Classes', icon: 'GraduationCap' },
  { id: 'food_drink', label: 'Food & Drink', icon: 'UtensilsCrossed' },
  { id: 'adventure', label: 'Adventure', icon: 'Mountain' },
  { id: 'wellness', label: 'Wellness', icon: 'Heart' },
  { id: 'art_culture', label: 'Art & Culture', icon: 'Palette' },
  { id: 'sightseeing', label: 'Sightseeing', icon: 'Camera' },
  { id: 'nature', label: 'Nature', icon: 'Trees' },
];

// Transform database row to Activity type
// eslint-disable-next-line complexity -- tracked in #1
const transformActivity = (row: any): Activity => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  shortDescription: row.description?.slice(0, 100) + '...' || '',
  category: row.category || [],
  image: row.image_url || '',
  images: row.images || [],
  price: parseFloat(row.price) || 0,
  currency: row.currency || 'USD',
  duration: row.duration || '',
  rating: parseFloat(row.rating) || 0,
  reviewCount: row.review_count || 0,
  city: row.city || '',
  country: row.country || '',
  address: row.address || '',
  coordinates: row.latitude && row.longitude ? {
    lat: parseFloat(row.latitude),
    lng: parseFloat(row.longitude),
  } : undefined,
  included: row.included || [],
  notIncluded: row.not_included || [],
  requirements: row.requirements || [],
  languages: row.languages || [],
  maxParticipants: row.max_participants,
  instantBook: row.instant_book || false,
  cancellationPolicy: row.cancellation_policy,
  destinationId: row.destination_id,
});

// Get all activities
export const getActivities = async (): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching activities:', error);
    return [];
  }

  return data.map(transformActivity);
};

// Get activity by ID
export const getActivityById = async (id: string): Promise<Activity | null> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching activity:', error);
    return null;
  }

  return transformActivity(data);
};

// Get activities by destination
export const getActivitiesByDestination = async (destinationId: string): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('destination_id', destinationId)
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching activities by destination:', error);
    return [];
  }

  return data.map(transformActivity);
};

// Get activities by city
export const getActivitiesByCity = async (city: string): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .ilike('city', `%${city}%`)
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching activities by city:', error);
    return [];
  }

  return data.map(transformActivity);
};

// Get activities by category
export const getActivitiesByCategory = async (category: string): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .contains('category', [category])
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching activities by category:', error);
    return [];
  }

  return data.map(transformActivity);
};

// Search activities
export const searchActivities = async (query: string): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .or(`name.ilike.%${query}%,city.ilike.%${query}%,description.ilike.%${query}%`)
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error searching activities:', error);
    return [];
  }

  return data.map(transformActivity);
};

// Get featured activities (top rated)
export const getFeaturedActivities = async (limit: number = 6): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured activities:', error);
    return [];
  }

  return data.map(transformActivity);
};

// Get activities by price range
export const getActivitiesByPriceRange = async (minPrice: number, maxPrice: number): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .gte('price', minPrice)
    .lte('price', maxPrice)
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching activities by price:', error);
    return [];
  }

  return data.map(transformActivity);
};

// Get instant bookable activities
export const getInstantBookActivities = async (): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('instant_book', true)
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching instant book activities:', error);
    return [];
  }

  return data.map(transformActivity);
};

// Get activities available in specific languages
export const getActivitiesByLanguage = async (language: string): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .contains('languages', [language])
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching activities by language:', error);
    return [];
  }

  return data.map(transformActivity);
};
