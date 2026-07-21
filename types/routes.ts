// Paint the Town Time-Optimized Routes - Type Definitions

// ============================================================================
// LOCATION & COORDINATES
// ============================================================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  placeId?: string;
}

// ============================================================================
// ACTIVITY TYPES
// ============================================================================

export type ActivityCategory =
  | 'dining'
  | 'attraction'
  | 'museum'
  | 'outdoor'
  | 'shopping'
  | 'entertainment'
  | 'wellness'
  | 'transport'
  | 'accommodation'
  | 'other';

export type TimeFlexibility =
  | 'fixed' // Cannot move (reservations, flights)
  | 'preferred' // Has preferred time but can shift
  | 'flexible' // Can move freely
  | 'anytime'; // No time preference

export interface TimeWindow {
  start: string; // HH:mm
  end: string; // HH:mm
}

export interface OperatingHours {
  dayOfWeek: number; // 0-6 (Sun-Sat)
  open: string;
  close: string;
  isClosed?: boolean;
}

export interface Activity {
  id: string;
  name: string;
  description?: string;
  category: ActivityCategory;
  location: Location;

  // Timing
  scheduledTime?: string;
  duration: number; // Minutes
  flexibility: TimeFlexibility;
  preferredTimeWindow?: TimeWindow;

  // Constraints
  operatingHours?: OperatingHours[];
  requiresReservation?: boolean;
  reservationTime?: string;
  lastEntryTime?: string;

  // Priority
  priority: number; // 1-5
  isLocked?: boolean;
  mustBeBefore?: string[];
  mustBeAfter?: string[];

  // Metadata
  estimatedCost?: number;
  imageUrl?: string;
  notes?: string;
}

// ============================================================================
// TRANSPORT
// ============================================================================

export type TransportMode = 'walking' | 'driving' | 'transit' | 'cycling' | 'rideshare' | 'taxi';

export interface TravelSegment {
  id: string;
  fromActivityId: string;
  toActivityId: string;
  mode: TransportMode;
  distance: number; // Meters
  duration: number; // Minutes
  departureTime: string;
  arrivalTime: string;
  cost?: number;
  polyline?: string;
}

export interface TransportPreferences {
  preferredModes: TransportMode[];
  maxWalkingDistance: number;
  maxWalkingDuration: number;
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  wheelchairAccessible?: boolean;
}

// ============================================================================
// ROUTE & OPTIMIZATION
// ============================================================================

export interface RouteStop {
  id: string;
  activity: Activity;
  arrivalTime: string;
  departureTime: string;
  waitTime?: number;
  order: number;
  originalOrder?: number;
  timeDelta?: number;
  wasReordered: boolean;
}

export interface Route {
  id: string;
  date: string;
  stops: RouteStop[];
  travelSegments: TravelSegment[];

  // Summary
  totalDuration: number;
  totalTravelTime: number;
  totalDistance: number;
  totalWaitTime: number;
  activityTime: number;

  startTime: string;
  endTime: string;
  startLocation?: Location;
  endLocation?: Location;

  isOptimized: boolean;
  createdAt: string;
}

export type OptimizationStrategy =
  | 'minimize_travel'
  | 'minimize_distance'
  | 'chronological'
  | 'priority_first'
  | 'balanced';

export interface OptimizationConstraints {
  startTime: string;
  endTime: string;
  lunchWindow?: TimeWindow;
  dinnerWindow?: TimeWindow;
  maxConsecutiveActivities?: number;
  breakDuration?: number;
}

export interface RouteChange {
  id: string;
  activityId: string;
  activityName: string;
  changeType: 'reorder' | 'reschedule' | 'change_transport';
  fromPosition?: number;
  toPosition?: number;
  originalTime?: string;
  newTime?: string;
  timeDelta?: number;
  reason: string;
  impact: string;
  isApproved?: boolean;
}

export interface OptimizationResult {
  id: string;
  originalRoute: Route;
  optimizedRoute: Route;
  strategy: OptimizationStrategy;

  // Savings
  timeSaved: number;
  distanceSaved: number;

  // Changes
  changes: RouteChange[];
  changeCount: number;

  // Score
  score: number;
  originalScore: number;

  // Warnings
  warnings: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    activityId?: string;
  }>;

  calculatedAt: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'partially_approved' | 'rejected';

// ============================================================================
// UI STATE
// ============================================================================

export interface RouteOptimizerState {
  activities: Activity[];
  originalRoute: Route | null;
  optimizedRoute: Route | null;
  optimizationResult: OptimizationResult | null;

  strategy: OptimizationStrategy;
  transportPreferences: TransportPreferences;
  constraints: OptimizationConstraints;

  pendingChanges: RouteChange[];
  approvedChanges: string[];
  rejectedChanges: string[];

  isOptimizing: boolean;
  error: string | null;
}
