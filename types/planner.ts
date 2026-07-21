// Core date-planning types: taste profile, generated plans, plan stops.
// These mirror the Supabase schema (user_preferences taste columns + date_plans).

export type VenueStyle = 'indoor' | 'outdoor' | 'both';

export interface TasteProfile {
  planFor: string | null; // travel_style: 'solo' | 'couple' | 'family' | 'group'
  foodLoves: string[];
  foodDislikes: string[];
  activityLoves: string[];
  activityDislikes: string[];
  musicGenres: string[];
  drinks: string[];
  venueStyle: VenueStyle;
  dateBudget: number; // typical total budget per date (USD, per couple)
  homeCity: string;
}

export const emptyTasteProfile: TasteProfile = {
  planFor: null,
  foodLoves: [],
  foodDislikes: [],
  activityLoves: [],
  activityDislikes: [],
  musicGenres: [],
  drinks: [],
  venueStyle: 'both',
  dateBudget: 150,
  homeCity: '',
};

export type PlanStopCategory =
  | 'food'
  | 'drinks'
  | 'activity'
  | 'entertainment'
  | 'outdoors'
  | 'culture'
  | 'other';

export interface PlanStop {
  order: number;
  day?: number; // 1-based day of a multi-day trip; absent for single-day dates
  feedback?: 'up' | 'down'; // user's post-date verdict, feeds future suggestions
  time: string; // "18:30"
  durationMinutes: number;
  category: PlanStopCategory;
  name: string; // "Dinner at Osteria Mozza"
  venueName: string; // "Osteria Mozza"
  address: string;
  description: string;
  estimatedCost: number; // USD for the whole party
  url?: string;
  reservationUrl?: string; // direct booking link (OpenTable/Resy/venue site) seen during research
  whyItMatches: string; // ties back to the user's taste profile
}

export type DatePlanStatus = 'saved' | 'scheduled' | 'completed' | 'cancelled';

export interface DatePlan {
  id: string;
  title: string;
  city: string;
  planDate: string | null; // ISO date
  startTime: string | null;
  totalBudget: number | null;
  estimatedCost: number | null;
  status: DatePlanStatus;
  source: 'ai' | 'custom';
  vibe: string | null; // one-line description, e.g. "Art, pasta & live rock"
  stops: PlanStop[];
  createdAt?: string;
}

/** A plan as returned by the AI, before it is saved. */
export type GeneratedPlan = Omit<DatePlan, 'id' | 'status' | 'createdAt'>;

export interface DestinationSuggestion {
  city: string;
  country: string;
  pitch: string; // one-liner selling the destination
  whyItMatches: string;
  estimatedTripCost: number; // rough all-in USD for the trip
  travelNote: string; // e.g. "3h drive from Austin" or "2.5h direct flight"
}

export interface GeneratePlanRequest {
  mode: 'plan_for_me' | 'single' | 'vacation' | 'suggest_destinations';
  city: string;
  date?: string; // ISO date (start date for vacations)
  days?: number; // vacation length in days (1-10)
  startTime?: string; // "18:00"
  durationHours?: number;
  budget: number; // total budget (whole trip for vacations)
  notes?: string;
  vibes?: string[]; // e.g. "Romantic", "First date" — steers tone in one shot
  mustInclude?: string[]; // e.g. "Dinner", "Live music" — hard requirements
  profile: TasteProfile;
  // Taste memory, gathered from past plans and injected automatically:
  avoidVenues?: string[];
  lovedVenues?: string[];
  dislikedVenues?: string[];
}

export interface PlanProgress {
  stage: 'starting' | 'scouting' | 'building' | 'done' | string;
  done: number | null;
  total: number | null;
}

export interface GeneratePlanResponse {
  plans: GeneratedPlan[];
}

// ---------------------------------------------------------------------------
// Option catalogs for the taste-profile quiz
// ---------------------------------------------------------------------------

export interface TasteOption {
  id: string;
  name: string;
  emoji: string;
}

export const musicGenreOptions: TasteOption[] = [
  { id: 'rock', name: 'Rock', emoji: '🎸' },
  { id: 'pop', name: 'Pop', emoji: '🎤' },
  { id: 'jazz', name: 'Jazz & Blues', emoji: '🎷' },
  { id: 'hip-hop', name: 'Hip-Hop & R&B', emoji: '🎧' },
  { id: 'electronic', name: 'Electronic & Dance', emoji: '🎛️' },
  { id: 'country', name: 'Country', emoji: '🤠' },
  { id: 'latin', name: 'Latin', emoji: '💃' },
  { id: 'classical', name: 'Classical', emoji: '🎻' },
  { id: 'indie', name: 'Indie & Alternative', emoji: '🎶' },
  { id: 'metal', name: 'Metal', emoji: '🤘' },
  { id: 'reggae', name: 'Reggae', emoji: '🌴' },
  { id: 'live-anything', name: 'Any Live Music', emoji: '🎫' },
];

export const drinkOptions: TasteOption[] = [
  { id: 'whiskey', name: 'Whiskey & Bourbon', emoji: '🥃' },
  { id: 'cocktails', name: 'Cocktails', emoji: '🍸' },
  { id: 'wine', name: 'Wine', emoji: '🍷' },
  { id: 'craft-beer', name: 'Craft Beer', emoji: '🍺' },
  { id: 'coffee-tea', name: 'Coffee & Tea', emoji: '☕' },
  { id: 'non-alcoholic', name: 'Non-Alcoholic', emoji: '🧃' },
];

// Extends the travel interests list with date-night specific activities
export const activityOptions: TasteOption[] = [
  { id: 'museums', name: 'Museums & Galleries', emoji: '🖼️' },
  { id: 'concerts', name: 'Concerts & Live Music', emoji: '🎫' },
  { id: 'movies', name: 'Movies', emoji: '🎬' },
  { id: 'theater', name: 'Plays & Theater', emoji: '🎭' },
  { id: 'comedy', name: 'Comedy Shows', emoji: '😂' },
  { id: 'bars', name: 'Bars & Lounges', emoji: '🍹' },
  { id: 'clubs', name: 'Clubs & Dancing', emoji: '🪩' },
  { id: 'outdoor', name: 'Outdoor & Parks', emoji: '🌳' },
  { id: 'sports', name: 'Sports & Games', emoji: '🏟️' },
  { id: 'markets', name: 'Local Markets', emoji: '🛍️' },
  { id: 'wellness', name: 'Spa & Wellness', emoji: '💆' },
  { id: 'classes', name: 'Classes & Workshops', emoji: '🎨' },
  { id: 'arcades', name: 'Arcades & Mini Golf', emoji: '🕹️' },
  { id: 'scenic', name: 'Scenic Views', emoji: '🌇' },
];
