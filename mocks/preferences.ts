/**
 * Onboarding / taste-profile option lists.
 *
 * Types live here rather than in the type barrel: these shapes exist only to
 * describe this data, and the travel-era barrel they came from is gone.
 */

export interface TravelStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface FoodPreference {
  id: string;
  name: string;
  icon: string;
  emoji: string;
}

export const travelStyles: TravelStyle[] = [
  {
    id: 'solo',
    name: 'Solo Explorer',
    description: 'Independent adventures at your own pace',
    icon: 'User',
  },
  {
    id: 'couple',
    name: 'Romantic Getaway',
    description: 'Intimate experiences for two',
    icon: 'Heart',
  },
  {
    id: 'family',
    name: 'Family Fun',
    description: 'Kid-friendly activities for all ages',
    icon: 'Users',
  },
  {
    id: 'group',
    name: 'Group Adventure',
    description: 'Shared experiences with friends',
    icon: 'UsersRound',
  },
];

export const foodPreferences: FoodPreference[] = [
  { id: 'italian', name: 'Italian', icon: 'Pizza', emoji: '🍝' },
  { id: 'chinese', name: 'Chinese', icon: 'Soup', emoji: '🥡' },
  { id: 'japanese', name: 'Japanese & Sushi', icon: 'Fish', emoji: '🍣' },
  { id: 'mexican', name: 'Mexican', icon: 'Flame', emoji: '🌮' },
  { id: 'indian', name: 'Indian', icon: 'Leaf', emoji: '🍛' },
  { id: 'thai', name: 'Thai', icon: 'Citrus', emoji: '🍜' },
  { id: 'middle-eastern', name: 'Middle Eastern', icon: 'Salad', emoji: '🧆' },
  { id: 'french', name: 'French', icon: 'Croissant', emoji: '🥐' },
  { id: 'korean', name: 'Korean', icon: 'Beef', emoji: '🍖' },
  { id: 'mediterranean', name: 'Mediterranean', icon: 'Grape', emoji: '🫒' },
  { id: 'american', name: 'American', icon: 'Sandwich', emoji: '🍔' },
  { id: 'vietnamese', name: 'Vietnamese', icon: 'Carrot', emoji: '🍲' },
  { id: 'greek', name: 'Greek', icon: 'Utensils', emoji: '🥙' },
  { id: 'spanish', name: 'Spanish', icon: 'Wine', emoji: '🥘' },
  { id: 'seafood', name: 'Seafood', icon: 'Shell', emoji: '🦐' },
  { id: 'vegetarian', name: 'Vegetarian', icon: 'Vegan', emoji: '🥗' },
  { id: 'steakhouse', name: 'Steakhouse', icon: 'Beef', emoji: '🥩' },
  { id: 'bbq', name: 'BBQ & Grill', icon: 'Flame', emoji: '🔥' },
];
