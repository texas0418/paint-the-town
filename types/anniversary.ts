// Anniversary Tracker Types for Paint the Town

export type AnniversaryType =
  | 'relationship'
  | 'wedding'
  | 'engagement'
  | 'first_date'
  | 'first_trip'
  | 'custom';

export type MilestoneLevel = 'standard' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Anniversary {
  id: string;
  name: string;
  type: AnniversaryType;
  date: string; // ISO date string (YYYY-MM-DD)
  partnerId?: string;
  partnerName?: string;
  notes?: string;
  reminderDays: number[]; // Days before to remind (e.g., [7, 3, 1])
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  years: number;
  name: string;
  traditionalGift?: string;
  modernGift?: string;
  level: MilestoneLevel;
  description: string;
}

export interface MilestoneSuggestion {
  id: string;
  anniversaryId: string;
  milestone: Milestone;
  category: SuggestionCategory;
  title: string;
  description: string;
  priceRange: PriceRange;
  imageUrl?: string;
  bookingUrl?: string;
  location?: string;
  rating?: number;
  tags: string[];
  isBookmarked: boolean;
}

export type SuggestionCategory =
  | 'restaurant'
  | 'experience'
  | 'getaway'
  | 'gift'
  | 'activity'
  | 'spa'
  | 'entertainment';

export type PriceRange = '$' | '$$' | '$$$' | '$$$$' | '$$$$$';

export interface UpcomingAnniversary {
  anniversary: Anniversary;
  daysUntil: number;
  upcomingDate: string;
  yearsCompleting: number;
  milestone?: Milestone;
  suggestions: MilestoneSuggestion[];
}

export interface AnniversaryStats {
  totalAnniversaries: number;
  upcomingThisMonth: number;
  nextMilestone?: {
    anniversary: Anniversary;
    milestone: Milestone;
    daysUntil: number;
  };
}

export interface AnniversaryReminder {
  id: string;
  anniversaryId: string;
  scheduledDate: string;
  daysBeforeAnniversary: number;
  isRead: boolean;
  createdAt: string;
}

export interface CreateAnniversaryInput {
  name: string;
  type: AnniversaryType;
  date: string;
  partnerName?: string;
  notes?: string;
  reminderDays?: number[];
}

export interface UpdateAnniversaryInput {
  name?: string;
  type?: AnniversaryType;
  date?: string;
  partnerName?: string;
  notes?: string;
  reminderDays?: number[];
  isActive?: boolean;
}

// Filter and sort options
export interface AnniversaryFilters {
  types?: AnniversaryType[];
  isActive?: boolean;
  hasUpcomingMilestone?: boolean;
}

export type AnniversarySortOption =
  | 'date_asc'
  | 'date_desc'
  | 'name_asc'
  | 'name_desc'
  | 'upcoming';
