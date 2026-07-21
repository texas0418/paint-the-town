// services/restaurantService.ts
// Replaces: mocks/restaurants.ts

import { supabase } from '@/lib/supabase';
import { Restaurant } from '@/types';

// Static data that doesn't need to be in the database
export const cuisineCategories = [
  { id: 'all', label: 'All', icon: 'Utensils' },
  { id: 'italian', label: 'Italian', icon: 'Pizza' },
  { id: 'japanese', label: 'Japanese', icon: 'Fish' },
  { id: 'french', label: 'French', icon: 'Wine' },
  { id: 'mexican', label: 'Mexican', icon: 'Flame' },
  { id: 'indian', label: 'Indian', icon: 'Leaf' },
  { id: 'thai', label: 'Thai', icon: 'Soup' },
  { id: 'american', label: 'American', icon: 'Beef' },
  { id: 'mediterranean', label: 'Mediterranean', icon: 'Salad' },
];

export const timeSlots = [
  '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
  '8:00 PM', '8:30 PM', '9:00 PM',
];

export const occasions = [
  'Birthday', 'Anniversary', 'Date Night', 'Business Meal',
  'Special Celebration', 'Just Dining Out',
];

// Transform database row to app's Restaurant type
// eslint-disable-next-line complexity -- tracked in #1
const transformRestaurant = (row: any): Restaurant => ({
  id: row.id,
  name: row.name,
  cuisine: row.cuisine || [],
  priceRange: row.price_range || 2,
  rating: parseFloat(row.rating) || 0,
  reviewCount: row.review_count || 0,
  image: row.image_url || '',
  images: row.images || [],
  description: row.description || '',
  address: row.address || '',
  city: row.city || '',
  country: row.country || '',
  phone: row.phone || '',
  website: row.website || '',
  hours: row.hours || {},
  features: row.features || [],
  dietaryOptions: row.dietary_options || [],
  dressCode: row.dress_code || '',
  reservationRequired: row.reservation_required || false,
  instantBook: false, // Add if needed in DB
  popularDishes: [], // Add if needed in DB
  averagePrice: parseFloat(row.average_price) || 0,
  currency: row.currency || 'USD',
  featured: false, // Add if needed in DB
  michelinStars: row.michelin_stars || undefined,
});

// Get all restaurants
export const getRestaurants = async (): Promise<Restaurant[]> => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching restaurants:', error);
    return [];
  }

  return data.map(transformRestaurant);
};

// Get a single restaurant by ID
export const getRestaurantById = async (id: string): Promise<Restaurant | null> => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching restaurant:', error);
    return null;
  }

  return transformRestaurant(data);
};

// Get restaurants by city
export const getRestaurantsByCity = async (city: string): Promise<Restaurant[]> => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .ilike('city', `%${city}%`)
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching restaurants by city:', error);
    return [];
  }

  return data.map(transformRestaurant);
};

// Get restaurants by cuisine type
export const getRestaurantsByCuisine = async (cuisine: string): Promise<Restaurant[]> => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .contains('cuisine', [cuisine])
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching restaurants by cuisine:', error);
    return [];
  }

  return data.map(transformRestaurant);
};

// Get restaurants by price range
export const getRestaurantsByPriceRange = async (priceRange: number): Promise<Restaurant[]> => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('price_range', priceRange)
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching restaurants by price:', error);
    return [];
  }

  return data.map(transformRestaurant);
};

// Search restaurants
export const searchRestaurants = async (query: string): Promise<Restaurant[]> => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .or(`name.ilike.%${query}%,city.ilike.%${query}%,description.ilike.%${query}%`)
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error searching restaurants:', error);
    return [];
  }

  return data.map(transformRestaurant);
};

// Get Michelin-starred restaurants
export const getMichelinRestaurants = async (): Promise<Restaurant[]> => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .not('michelin_stars', 'is', null)
    .order('michelin_stars', { ascending: false });

  if (error) {
    console.error('Error fetching Michelin restaurants:', error);
    return [];
  }

  return data.map(transformRestaurant);
};

// Get restaurants with dietary options
export const getRestaurantsByDietaryOption = async (option: string): Promise<Restaurant[]> => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .contains('dietary_options', [option])
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching restaurants by dietary option:', error);
    return [];
  }

  return data.map(transformRestaurant);
};
