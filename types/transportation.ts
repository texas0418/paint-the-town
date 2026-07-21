// Transportation Mode Types for Paint the Town

export type TransportationMode = 'car' | 'transit' | 'walking' | 'rideshare' | 'bike';

export interface TransportationOption {
  mode: TransportationMode;
  icon: string; // Lucide icon name
  label: string;
  description: string;
  color: string;
}

export interface ItineraryLeg {
  id: string;
  fromActivityId: string;
  toActivityId: string;
  transportationMode: TransportationMode;
  estimatedDuration: number; // minutes
  estimatedDistance: number; // miles
  notes?: string;
  // Route details (populated after calculation)
  route?: RouteDetails;
}

export interface RouteDetails {
  polyline?: string; // encoded polyline for map display
  steps: RouteStep[];
  totalDuration: number; // minutes
  totalDistance: number; // miles
  trafficCondition?: 'light' | 'moderate' | 'heavy';
  departureTime?: string;
  arrivalTime?: string;
}

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver?: string;
  transitDetails?: TransitDetails;
}

export interface TransitDetails {
  lineName: string;
  lineColor?: string;
  vehicleType: 'bus' | 'subway' | 'train' | 'tram' | 'ferry';
  departureStop: string;
  arrivalStop: string;
  numStops: number;
  departureTime: string;
  arrivalTime: string;
}

// Extended ItineraryActivity with transportation to next activity
export interface ActivityWithTransport {
  id: string;
  name: string;
  description: string;
  type: string;
  location: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  startTime: string;
  endTime: string;
  estimatedCost: '$' | '$$' | '$$$' | '$$$$';
  notes?: string;
  reservationRequired: boolean;
  reservationMade: boolean;
  imageUrl?: string;
  // Transportation to next activity
  transportToNext?: ItineraryLeg;
}

// Transportation mode options with metadata
export const TRANSPORTATION_OPTIONS: TransportationOption[] = [
  {
    mode: 'car',
    icon: 'Car',
    label: 'Drive',
    description: 'Personal vehicle',
    color: '#3B82F6', // blue
  },
  {
    mode: 'transit',
    icon: 'Train',
    label: 'Transit',
    description: 'Bus, subway, train',
    color: '#8B5CF6', // purple
  },
  {
    mode: 'walking',
    icon: 'Footprints',
    label: 'Walk',
    description: 'On foot',
    color: '#10B981', // green
  },
  {
    mode: 'rideshare',
    icon: 'CarTaxiFront',
    label: 'Rideshare',
    description: 'Uber, Lyft',
    color: '#F59E0B', // amber
  },
  {
    mode: 'bike',
    icon: 'Bike',
    label: 'Bike',
    description: 'Bicycle or scooter',
    color: '#EC4899', // pink
  },
];

// Helper to get option by mode
export function getTransportOption(mode: TransportationMode): TransportationOption {
  return TRANSPORTATION_OPTIONS.find((opt) => opt.mode === mode) || TRANSPORTATION_OPTIONS[0];
}

// Duration estimates by mode (rough multipliers based on driving time)
export const MODE_DURATION_MULTIPLIERS: Record<TransportationMode, number> = {
  car: 1.0,
  transit: 1.5,
  walking: 4.0,
  rideshare: 1.1,
  bike: 2.0,
};
