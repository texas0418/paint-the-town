// ============================================================================
// Sharing Types for Paint the Town Date Nights
// ============================================================================

export interface SharedItinerary {
  id: string;
  itineraryId: string;

  // Share settings
  shareCode: string; // 6-character code for easy sharing
  shareUrl: string;
  createdAt: string;
  expiresAt?: string;

  // Access control
  accessLevel: ShareAccessLevel;
  password?: string; // Optional password protection
  maxViews?: number;
  viewCount: number;

  // Surprise mode
  surpriseMode: SurpriseMode;
  surpriseActivities: string[]; // Activity IDs to hide

  // Partner info
  partnerName?: string;
  partnerViewed: boolean;
  lastViewedAt?: string;

  // Permissions
  canSeeLocation: boolean;
  canSeeCost: boolean;
  canSeeNotes: boolean;
  canAddToCalendar: boolean;
  canSuggestChanges: boolean;

  // Status
  isActive: boolean;
  revokedAt?: string;
}

export type ShareAccessLevel = 'view_only' | 'interactive' | 'collaborative';

export interface SurpriseMode {
  enabled: boolean;
  revealAt?: string; // ISO date when surprises auto-reveal
  revealOnArrival: boolean; // Reveal when partner arrives at location
  teaseLevel: TeaseLevel;
}

export type TeaseLevel =
  | 'full_mystery' // Shows only "Surprise Activity"
  | 'category_hint' // Shows "Surprise Dinner 🍽️"
  | 'time_only' // Shows time and duration, nothing else
  | 'neighborhood' // Shows general area but not exact location
  | 'custom'; // Custom reveal per activity

export interface SurpriseActivity {
  activityId: string;
  teaseLevel: TeaseLevel;
  customHint?: string; // e.g., "Wear comfortable shoes!"
  revealAt?: string;
  isRevealed: boolean;
}

export interface SharedViewActivity {
  id: string;

  // Always visible
  startTime: string;
  endTime?: string;
  duration?: number;
  order: number;

  // Conditionally visible based on surprise mode
  name: string | null;
  type: string | null;
  location: SharedLocation | null;
  description: string | null;
  estimatedCost: string | null;
  notes: string | null;
  imageUrl: string | null;

  // Surprise info
  isSurprise: boolean;
  surpriseHint?: string;
  teaseLevel?: TeaseLevel;

  // Travel info (may be hidden)
  travelTime?: number | null;
  travelMode?: string | null;
}

export interface SharedLocation {
  name: string | null;
  address: string | null;
  neighborhood?: string;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
}

export interface SharedItineraryView {
  id: string;
  name: string;
  date: string;

  // Partner greeting
  greeting?: string;
  partnerName: string;
  creatorName: string;

  // Summary (respects surprise mode)
  activityCount: number;
  surpriseCount: number;
  totalDuration?: number;

  // Activities
  activities: SharedViewActivity[];

  // Permissions
  canSeeLocation: boolean;
  canSeeCost: boolean;
  canAddToCalendar: boolean;

  // Metadata
  lastUpdated: string;
  shareSettings: {
    surpriseMode: SurpriseMode;
    accessLevel: ShareAccessLevel;
  };
}

export interface ShareInvite {
  shareCode: string;
  shareUrl: string;
  message: string;
  expiresAt?: string;
}

export interface PartnerSuggestion {
  id: string;
  sharedItineraryId: string;
  activityId?: string;

  type: 'time_change' | 'activity_swap' | 'add_activity' | 'note' | 'question';
  message: string;
  suggestedValue?: any;

  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
  response?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

export function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateShareUrl(shareCode: string): string {
  // In production, this would be your actual domain
  return `https://paintthetown.app/shared/${shareCode}`;
}

export function isShareExpired(share: SharedItinerary): boolean {
  if (!share.expiresAt) return false;
  return new Date(share.expiresAt) < new Date();
}

export function canViewShare(share: SharedItinerary, password?: string): boolean {
  if (!share.isActive) return false;
  if (isShareExpired(share)) return false;
  if (share.maxViews && share.viewCount >= share.maxViews) return false;
  if (share.password && share.password !== password) return false;
  return true;
}

export function getActivityDisplayInfo(
  activity: any,
  surpriseActivity?: SurpriseActivity,
  surpriseMode?: SurpriseMode
): SharedViewActivity {
  const isSurprise = surpriseActivity && !surpriseActivity.isRevealed;
  const teaseLevel = surpriseActivity?.teaseLevel || surpriseMode?.teaseLevel || 'full_mystery';

  // Always visible
  const baseInfo: SharedViewActivity = {
    id: activity.id,
    startTime: activity.startTime,
    endTime: activity.endTime,
    duration: activity.duration,
    order: activity.order || 0,
    isSurprise: !!isSurprise,
    teaseLevel: isSurprise ? teaseLevel : undefined,
    surpriseHint: surpriseActivity?.customHint,

    // Default to null, will be filled based on tease level
    name: null,
    type: null,
    location: null,
    description: null,
    estimatedCost: null,
    notes: null,
    imageUrl: null,
    travelTime: null,
    travelMode: null,
  };

  if (!isSurprise) {
    // Not a surprise - show everything
    return {
      ...baseInfo,
      name: activity.name,
      type: activity.type,
      location: activity.location
        ? {
            name: activity.location.name,
            address: activity.location.address,
            neighborhood: activity.location.neighborhood,
            coordinates: activity.location.coordinates,
          }
        : null,
      description: activity.description,
      estimatedCost: activity.estimatedCost,
      notes: activity.notes,
      imageUrl: activity.imageUrl,
      travelTime: activity.travelTime,
      travelMode: activity.travelMode,
    };
  }

  // Handle surprise tease levels
  switch (teaseLevel) {
    case 'full_mystery':
      return {
        ...baseInfo,
        name: '✨ Surprise Activity',
      };

    case 'category_hint':
      const categoryEmoji = getCategoryEmoji(activity.type);
      return {
        ...baseInfo,
        name: `Surprise ${getCategoryLabel(activity.type)} ${categoryEmoji}`,
        type: activity.type,
      };

    case 'time_only':
      return {
        ...baseInfo,
        name: '🎁 Something Special',
        travelTime: activity.travelTime,
      };

    case 'neighborhood':
      return {
        ...baseInfo,
        name: `Surprise in ${activity.location?.neighborhood || 'a special spot'}`,
        type: activity.type,
        location: activity.location
          ? {
              name: null,
              address: null,
              neighborhood: activity.location.neighborhood,
              coordinates: null,
            }
          : null,
      };

    case 'custom':
      return {
        ...baseInfo,
        name: surpriseActivity?.customHint || '✨ Surprise Activity',
      };

    default:
      return baseInfo;
  }
}

function getCategoryEmoji(type: string): string {
  const emojis: Record<string, string> = {
    dining: '🍽️',
    drinks: '🍸',
    entertainment: '🎭',
    outdoor: '🌳',
    wellness: '💆',
    adventure: '🎢',
    culture: '🎨',
    nightlife: '🌙',
    romantic: '💕',
    active: '🏃',
  };
  return emojis[type] || '✨';
}

function getCategoryLabel(type: string): string {
  const labels: Record<string, string> = {
    dining: 'Dinner',
    drinks: 'Drinks',
    entertainment: 'Entertainment',
    outdoor: 'Outdoor Activity',
    wellness: 'Wellness',
    adventure: 'Adventure',
    culture: 'Cultural Experience',
    nightlife: 'Night Out',
    romantic: 'Romantic Moment',
    active: 'Activity',
  };
  return labels[type] || 'Activity';
}
