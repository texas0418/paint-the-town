// ============================================================================
// QR Code Generation Types for Paint the Town
// Generate QR codes for sharing trips, itineraries, confirmations, and more
// ============================================================================

// ============================================================================
// Shareable Content Types
// ============================================================================

export type ShareableContentType =
  | 'trip'
  | 'itinerary'
  | 'date_night'
  | 'activity'
  | 'confirmation'
  | 'restaurant'
  | 'parking'
  | 'contact'
  | 'location'
  | 'profile'
  | 'invite'
  | 'custom';

export interface ShareableContent {
  type: ShareableContentType;
  id: string;
  title: string;
  subtitle?: string;
  description?: string;

  // The data to encode
  payload: SharePayload;

  // Display options
  displayOptions?: QRDisplayOptions;

  // Metadata
  createdAt: string;
  expiresAt?: string;
  createdBy?: string;
}

export type SharePayload =
  | TripSharePayload
  | ItinerarySharePayload
  | DateNightSharePayload
  | ActivitySharePayload
  | ConfirmationSharePayload
  | LocationSharePayload
  | ContactSharePayload
  | InviteSharePayload
  | CustomSharePayload;

// ============================================================================
// Payload Types
// ============================================================================

export interface TripSharePayload {
  type: 'trip';
  tripId: string;
  shareCode: string;
  shareUrl: string;
  destination?: string;
  dates?: {
    start: string;
    end: string;
  };
  includeItinerary?: boolean;
}

export interface ItinerarySharePayload {
  type: 'itinerary';
  itineraryId: string;
  shareCode: string;
  shareUrl: string;
  activityCount?: number;
  date?: string;
}

export interface DateNightSharePayload {
  type: 'date_night';
  itineraryId: string;
  shareCode: string;
  shareUrl: string;
  partnerName?: string;
  isSurprise?: boolean;
  accessLevel?: 'view_only' | 'collaborate' | 'full_access';
}

export interface ActivitySharePayload {
  type: 'activity';
  activityId: string;
  name: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  date?: string;
  time?: string;
  bookingUrl?: string;
}

export interface ConfirmationSharePayload {
  type: 'confirmation';
  confirmationId: string;
  confirmationNumber: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  ticketCode?: string;
}

export interface LocationSharePayload {
  type: 'location';
  name: string;
  address?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  placeId?: string; // Google Place ID
  mapsUrl?: string;
}

export interface ContactSharePayload {
  type: 'contact';
  name: string;
  phone?: string;
  email?: string;
  organization?: string;
  title?: string;
  website?: string;
  address?: string;
  notes?: string;
}

export interface InviteSharePayload {
  type: 'invite';
  inviteCode: string;
  inviteUrl: string;
  inviterName?: string;
  message?: string;
  expiresAt?: string;
  maxUses?: number;
}

export interface CustomSharePayload {
  type: 'custom';
  data: string;
  format?: 'url' | 'text' | 'json' | 'vcard';
}

// ============================================================================
// QR Code Options
// ============================================================================

export interface QRCodeOptions {
  // Size
  size: number;

  // Colors
  foregroundColor: string;
  backgroundColor: string;

  // Error correction level
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';

  // Logo/branding
  logo?: {
    uri: string;
    size: number;
    borderRadius?: number;
    backgroundColor?: string;
  };

  // Styling
  style?: QRCodeStyle;

  // Quiet zone (margin)
  quietZone: number;
}

export type QRCodeStyle = 'square' | 'rounded' | 'dots' | 'fluid';

export const DEFAULT_QR_OPTIONS: QRCodeOptions = {
  size: 250,
  foregroundColor: '#000000',
  backgroundColor: '#FFFFFF',
  errorCorrectionLevel: 'M',
  quietZone: 4,
};

// ============================================================================
// Display Options
// ============================================================================

export interface QRDisplayOptions {
  // Show content preview
  showPreview: boolean;

  // Card styling
  cardStyle?: 'minimal' | 'branded' | 'ticket' | 'pass';

  // Colors
  accentColor?: string;

  // Header
  showHeader: boolean;
  headerIcon?: string;

  // Footer
  showFooter: boolean;
  footerText?: string;

  // Actions
  showShareButton: boolean;
  showSaveButton: boolean;
  showCopyButton: boolean;
}

export const DEFAULT_DISPLAY_OPTIONS: QRDisplayOptions = {
  showPreview: true,
  cardStyle: 'branded',
  showHeader: true,
  showFooter: true,
  footerText: 'Scan with any QR reader',
  showShareButton: true,
  showSaveButton: true,
  showCopyButton: true,
};

// ============================================================================
// QR Code Result
// ============================================================================

export interface GeneratedQRCode {
  id: string;
  content: ShareableContent;

  // QR data
  qrDataUrl: string; // Base64 data URL
  qrSvg?: string; // SVG string

  // Encoded value
  encodedValue: string;

  // Options used
  options: QRCodeOptions;

  // Metadata
  generatedAt: string;
  expiresAt?: string;

  // Stats (if tracked)
  scanCount?: number;
  lastScannedAt?: string;
}

// ============================================================================
// Share Actions
// ============================================================================

export type ShareAction =
  | 'copy_link'
  | 'share_image'
  | 'save_image'
  | 'share_native'
  | 'add_to_wallet'
  | 'send_sms'
  | 'send_email'
  | 'airdrop';

export interface ShareResult {
  success: boolean;
  action: ShareAction;
  error?: string;
  savedPath?: string;
}

// ============================================================================
// Component Props
// ============================================================================

export interface QRCodeGeneratorProps {
  content: ShareableContent;
  options?: Partial<QRCodeOptions>;
  displayOptions?: Partial<QRDisplayOptions>;
  onGenerated?: (qr: GeneratedQRCode) => void;
  onShare?: (result: ShareResult) => void;
}

export interface QRCodeViewerProps {
  qrCode: GeneratedQRCode;
  showActions?: boolean;
  onClose?: () => void;
  onShare?: (action: ShareAction) => void;
}

export interface QRCodeShareSheetProps {
  visible: boolean;
  onClose: () => void;
  content: ShareableContent;
  onShareComplete?: (result: ShareResult) => void;
}

// ============================================================================
// Content Type Config
// ============================================================================

export interface ContentTypeConfig {
  icon: string;
  label: string;
  color: string;
  urlPrefix: string;
}

export const CONTENT_TYPE_CONFIG: Record<ShareableContentType, ContentTypeConfig> = {
  trip: {
    icon: '✈️',
    label: 'Trip',
    color: '#3B82F6',
    urlPrefix: 'w4nder://trip/',
  },
  itinerary: {
    icon: '📋',
    label: 'Itinerary',
    color: '#8B5CF6',
    urlPrefix: 'w4nder://itinerary/',
  },
  date_night: {
    icon: '💕',
    label: 'Date Night',
    color: '#EC4899',
    urlPrefix: 'w4nder://date/',
  },
  activity: {
    icon: '🎯',
    label: 'Activity',
    color: '#F59E0B',
    urlPrefix: 'w4nder://activity/',
  },
  confirmation: {
    icon: '🎫',
    label: 'Confirmation',
    color: '#10B981',
    urlPrefix: 'w4nder://confirmation/',
  },
  restaurant: {
    icon: '🍽️',
    label: 'Restaurant',
    color: '#EF4444',
    urlPrefix: 'w4nder://restaurant/',
  },
  parking: {
    icon: '🅿️',
    label: 'Parking',
    color: '#6366F1',
    urlPrefix: 'w4nder://parking/',
  },
  contact: {
    icon: '👤',
    label: 'Contact',
    color: '#06B6D4',
    urlPrefix: '', // Uses vCard format
  },
  location: {
    icon: '📍',
    label: 'Location',
    color: '#22C55E',
    urlPrefix: 'geo:',
  },
  profile: {
    icon: '👋',
    label: 'Profile',
    color: '#8B5CF6',
    urlPrefix: 'w4nder://profile/',
  },
  invite: {
    icon: '💌',
    label: 'Invite',
    color: '#F472B6',
    urlPrefix: 'w4nder://invite/',
  },
  custom: {
    icon: '🔗',
    label: 'Link',
    color: '#64748B',
    urlPrefix: '',
  },
};

// ============================================================================
// URL Scheme Types
// ============================================================================

export type URLScheme =
  | 'w4nder' // App deep link
  | 'https' // Web URL
  | 'geo' // Location
  | 'tel' // Phone
  | 'mailto' // Email
  | 'sms' // SMS
  | 'data'; // Data URI

// ============================================================================
// vCard Format (for contacts)
// ============================================================================

export interface VCardData {
  version: '3.0' | '4.0';
  formattedName: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  title?: string;
  email?: string[];
  phone?: { type: string; number: string }[];
  address?: {
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  website?: string;
  note?: string;
}
