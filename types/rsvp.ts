// ============================================================================
// RSVP Types for Paint the Town Date Nights
// ============================================================================

export type RSVPStatus = 'pending' | 'accepted' | 'declined' | 'tentative';

export interface RSVP {
  id: string;
  sharedItineraryId: string;
  itineraryId: string;

  // Partner info
  partnerName: string;
  partnerEmail?: string;
  partnerPhone?: string;

  // Response
  status: RSVPStatus;
  respondedAt?: string;

  // Availability
  canAttend: boolean;
  alternativeDates?: string[]; // ISO dates partner suggested
  preferredTime?: 'earlier' | 'same' | 'later';

  // Partner preferences
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string;
  dressCode?: string;
  specialRequests?: string;

  // Excitement level (fun addition)
  excitementLevel?: 1 | 2 | 3 | 4 | 5;
  reactionEmoji?: string;
  personalNote?: string;

  // Reminders
  reminderSent: boolean;
  reminderSentAt?: string;

  // Tracking
  createdAt: string;
  updatedAt: string;
  viewedAt?: string;
  expiresAt?: string;
}

export interface RSVPInvite {
  id: string;
  itineraryId: string;
  itineraryName: string;
  date: string;
  time?: string;

  // Creator info
  creatorName: string;
  personalMessage?: string;

  // Share info
  shareCode: string;
  shareUrl: string;

  // RSVP settings
  requireResponse: boolean;
  responseDeadline?: string;
  allowAlternativeDates: boolean;
  allowDietaryInfo: boolean;
  allowAccessibilityInfo: boolean;

  // Status
  rsvpStatus: RSVPStatus;

  // Preview (respects surprise mode)
  activityCount: number;
  surpriseCount: number;
  estimatedDuration?: string;
  neighborhood?: string;
}

export interface RSVPResponse {
  status: RSVPStatus;

  // If declining or tentative
  reason?: string;
  alternativeDates?: string[];
  preferredTime?: 'earlier' | 'same' | 'later';

  // Partner details
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string;
  specialRequests?: string;

  // Fun stuff
  excitementLevel?: 1 | 2 | 3 | 4 | 5;
  reactionEmoji?: string;
  personalNote?: string;
}

export interface RSVPReminder {
  id: string;
  rsvpId: string;
  type: 'initial' | 'follow_up' | 'final';
  scheduledFor: string;
  sentAt?: string;
  method: 'push' | 'sms' | 'email';
}

// ============================================================================
// RSVP Configuration
// ============================================================================

export const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥬' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
  { id: 'gluten_free', label: 'Gluten-Free', emoji: '🌾' },
  { id: 'dairy_free', label: 'Dairy-Free', emoji: '🥛' },
  { id: 'nut_allergy', label: 'Nut Allergy', emoji: '🥜' },
  { id: 'shellfish_allergy', label: 'Shellfish Allergy', emoji: '🦐' },
  { id: 'halal', label: 'Halal', emoji: '☪️' },
  { id: 'kosher', label: 'Kosher', emoji: '✡️' },
  { id: 'pescatarian', label: 'Pescatarian', emoji: '🐟' },
  { id: 'low_carb', label: 'Low-Carb', emoji: '🥩' },
];

export const REACTION_EMOJIS = ['😍', '🥰', '😊', '🤩', '💕', '❤️', '🔥', '✨', '🎉', '👏'];

export const EXCITEMENT_LABELS: Record<number, string> = {
  1: 'Sounds okay',
  2: 'Looking forward to it',
  3: 'Excited!',
  4: 'Very excited!',
  5: "Can't wait!!! 🎉",
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getRSVPStatusColor(status: RSVPStatus): string {
  switch (status) {
    case 'accepted':
      return '#22C55E'; // green
    case 'declined':
      return '#EF4444'; // red
    case 'tentative':
      return '#F59E0B'; // amber
    case 'pending':
      return '#6B7280'; // gray
    default:
      return '#6B7280';
  }
}

export function getRSVPStatusLabel(status: RSVPStatus): string {
  switch (status) {
    case 'accepted':
      return 'Accepted';
    case 'declined':
      return 'Declined';
    case 'tentative':
      return 'Maybe';
    case 'pending':
      return 'Awaiting Response';
    default:
      return 'Unknown';
  }
}

export function getRSVPStatusEmoji(status: RSVPStatus): string {
  switch (status) {
    case 'accepted':
      return '✅';
    case 'declined':
      return '❌';
    case 'tentative':
      return '🤔';
    case 'pending':
      return '⏳';
    default:
      return '❓';
  }
}

export function isRSVPExpired(rsvp: RSVP): boolean {
  if (!rsvp.expiresAt) return false;
  return new Date(rsvp.expiresAt) < new Date();
}

export function formatRSVPDeadline(deadline: string): string {
  const date = new Date(deadline);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) return 'Expired';
  if (diffHours < 1) return 'Less than 1 hour left';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} left`;
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `${diffDays} days left`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
