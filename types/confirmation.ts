// Confirmation Storage Types for Paint the Town
// Store and manage booking confirmations, tickets, and QR codes

// ============================================================================
// Confirmation Types
// ============================================================================

export type ConfirmationType =
  | 'restaurant'
  | 'activity'
  | 'flight'
  | 'hotel'
  | 'car_rental'
  | 'event'
  | 'transportation'
  | 'other';

export type ConfirmationStatus =
  | 'upcoming'
  | 'active' // Currently in use (e.g., checked in)
  | 'completed'
  | 'cancelled'
  | 'expired';

export interface Confirmation {
  id: string;

  // Type and provider
  type: ConfirmationType;
  provider: string; // "OpenTable", "Viator", "United Airlines", etc.
  providerColor?: string;
  providerLogo?: string;

  // Booking details
  confirmationNumber: string;
  bookingReference?: string; // Secondary reference if needed

  // What was booked
  title: string;
  subtitle?: string; // e.g., "Table for 2" or "2 Adults"
  description?: string;

  // When
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;
  displayDateTime: string; // Formatted for display
  timezone?: string;

  // Where
  location: {
    name: string;
    address?: string;
    city?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    meetingPoint?: string;
    instructions?: string;
  };

  // Tickets/QR codes
  tickets?: Ticket[];

  // Contact
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };

  // Pricing
  pricing?: {
    total: number;
    currency: string;
    isPaid: boolean;
    paymentMethod?: string;
  };

  // Status
  status: ConfirmationStatus;

  // Cancellation
  cancellation?: {
    policy: string;
    deadline?: string;
    refundable: boolean;
    refundAmount?: number;
  };

  // Notes
  notes?: string;
  specialRequests?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  source: 'manual' | 'auto' | 'import'; // How it was added

  // Linking
  itineraryId?: string;
  linkedConfirmations?: string[]; // Related bookings

  // Raw data (for reference)
  rawData?: Record<string, any>;
}

// ============================================================================
// Ticket Types
// ============================================================================

export interface Ticket {
  id: string;

  // Ticket info
  type: 'qr_code' | 'barcode' | 'pdf' | 'passbook' | 'image' | 'text';
  label?: string; // "Adult Ticket", "VIP Pass", etc.

  // Code data
  code?: string; // The actual code string
  codeFormat?: 'qr' | 'code128' | 'code39' | 'ean13' | 'pdf417';

  // Visual
  imageUri?: string; // Local file URI or base64
  imageUrl?: string; // Remote URL

  // PDF
  pdfUri?: string;
  pdfUrl?: string;

  // Passbook/Wallet
  passbookUrl?: string;

  // Holder info
  holderName?: string;
  seat?: string;
  section?: string;
  row?: string;
  gate?: string;

  // Validity
  validFrom?: string;
  validUntil?: string;
  isUsed: boolean;
  usedAt?: string;

  // Metadata
  createdAt: string;
}

// ============================================================================
// Storage Types
// ============================================================================

export interface ConfirmationFilter {
  types?: ConfirmationType[];
  status?: ConfirmationStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  provider?: string;
  searchQuery?: string;
}

export interface ConfirmationSort {
  field: 'date' | 'createdAt' | 'title' | 'type';
  direction: 'asc' | 'desc';
}

export interface ConfirmationGroup {
  label: string;
  confirmations: Confirmation[];
}

// ============================================================================
// Import/Export Types
// ============================================================================

export interface ImportSource {
  type: 'email' | 'calendar' | 'photo' | 'manual' | 'share';
  data: any;
}

export interface ExportFormat {
  type: 'json' | 'pdf' | 'calendar' | 'share';
}

// ============================================================================
// Constants
// ============================================================================

export const CONFIRMATION_TYPE_CONFIG: Record<
  ConfirmationType,
  {
    label: string;
    icon: string;
    color: string;
  }
> = {
  restaurant: {
    label: 'Restaurant',
    icon: 'Utensils',
    color: '#F59E0B',
  },
  activity: {
    label: 'Activity',
    icon: 'Ticket',
    color: '#8B5CF6',
  },
  flight: {
    label: 'Flight',
    icon: 'Plane',
    color: '#3B82F6',
  },
  hotel: {
    label: 'Hotel',
    icon: 'Building2',
    color: '#10B981',
  },
  car_rental: {
    label: 'Car Rental',
    icon: 'Car',
    color: '#EC4899',
  },
  event: {
    label: 'Event',
    icon: 'CalendarDays',
    color: '#EF4444',
  },
  transportation: {
    label: 'Transportation',
    icon: 'Train',
    color: '#06B6D4',
  },
  other: {
    label: 'Other',
    icon: 'FileText',
    color: '#6B7280',
  },
};

export const STATUS_CONFIG: Record<
  ConfirmationStatus,
  {
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  upcoming: {
    label: 'Upcoming',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  active: {
    label: 'Active',
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  completed: {
    label: 'Completed',
    color: '#6B7280',
    bgColor: '#F3F4F6',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#EF4444',
    bgColor: '#FEF2F2',
  },
  expired: {
    label: 'Expired',
    color: '#9CA3AF',
    bgColor: '#F9FAFB',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getConfirmationTypeConfig(type: ConfirmationType) {
  return CONFIRMATION_TYPE_CONFIG[type] || CONFIRMATION_TYPE_CONFIG.other;
}

export function getStatusConfig(status: ConfirmationStatus) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.upcoming;
}

export function formatConfirmationNumber(number: string): string {
  // Format for display (e.g., add spaces every 4 chars)
  return number.replace(/(.{4})/g, '$1 ').trim();
}

export function isConfirmationActive(confirmation: Confirmation): boolean {
  const now = new Date();
  const confirmationDate = new Date(confirmation.date);

  if (confirmation.status === 'cancelled' || confirmation.status === 'expired') {
    return false;
  }

  // Check if it's today
  const today = now.toISOString().split('T')[0];
  return confirmation.date === today;
}

export function isConfirmationUpcoming(confirmation: Confirmation): boolean {
  const now = new Date();
  const confirmationDate = new Date(confirmation.date + 'T23:59:59');
  return confirmationDate > now && confirmation.status === 'upcoming';
}

export function isConfirmationPast(confirmation: Confirmation): boolean {
  const now = new Date();
  const confirmationDate = new Date(confirmation.date + 'T23:59:59');
  return confirmationDate < now;
}

export function sortConfirmations(
  confirmations: Confirmation[],
  sort: ConfirmationSort
): Confirmation[] {
  return [...confirmations].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }

    return sort.direction === 'asc' ? comparison : -comparison;
  });
}

export function groupConfirmationsByDate(confirmations: Confirmation[]): ConfirmationGroup[] {
  const groups: Map<string, Confirmation[]> = new Map();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  for (const conf of confirmations) {
    let label: string;

    if (conf.date === today) {
      label = 'Today';
    } else if (conf.date === tomorrow) {
      label = 'Tomorrow';
    } else if (conf.date < today) {
      label = 'Past';
    } else {
      // Format as "February 14, 2024"
      label = new Date(conf.date + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(conf);
  }

  // Convert to array and sort groups
  const groupOrder = ['Today', 'Tomorrow'];
  const result: ConfirmationGroup[] = [];

  // Add Today and Tomorrow first if they exist
  for (const label of groupOrder) {
    if (groups.has(label)) {
      result.push({ label, confirmations: groups.get(label)! });
      groups.delete(label);
    }
  }

  // Add remaining groups sorted by date
  const remainingGroups = Array.from(groups.entries())
    .filter(([label]) => label !== 'Past')
    .sort(([, a], [, b]) => new Date(a[0].date).getTime() - new Date(b[0].date).getTime());

  for (const [label, confs] of remainingGroups) {
    result.push({ label, confirmations: confs });
  }

  // Add Past at the end
  if (groups.has('Past')) {
    result.push({ label: 'Past', confirmations: groups.get('Past')! });
  }

  return result;
}

export function generateTicketId(): string {
  return `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export function generateConfirmationId(): string {
  return `conf-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
