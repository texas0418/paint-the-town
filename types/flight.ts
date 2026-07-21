// ============================================================================
// Flight Search & Booking Types for Paint the Town
// ============================================================================

export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';
export type TripType = 'round_trip' | 'one_way' | 'multi_city';
export type SortOption = 'best' | 'cheapest' | 'fastest' | 'earliest' | 'latest';
export type StopFilter = 'any' | 'nonstop' | '1_stop' | '2_plus';

// ============================================================================
// Search Parameters
// ============================================================================

export interface FlightSearchParams {
  tripType: TripType;
  origin: Airport;
  destination: Airport;
  departDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD (for round_trip)
  passengers: PassengerCount;
  cabinClass: CabinClass;
}

export interface PassengerCount {
  adults: number;
  children: number;
  infants: number;
}

export interface Airport {
  code: string; // IATA code
  name: string;
  city: string;
  country: string;
}

// ============================================================================
// Search Results
// ============================================================================

export interface FlightSearchResult {
  id: string;
  provider: FlightProvider;

  // Outbound leg
  outbound: FlightLeg;

  // Return leg (round_trip only)
  returnLeg?: FlightLeg;

  // Pricing
  price: number;
  originalPrice?: number; // Before discount
  currency: string;
  pricePerPerson: number;
  taxesAndFees: number;
  totalPrice: number;

  // Fare details
  fareClass: string;
  fareRules: FareRules;

  // Baggage
  baggage: BaggageAllowance;

  // Tags
  tags: FlightTag[];
  score: number; // 0-100 composite quality score
}

export type FlightTag =
  | 'best_value'
  | 'cheapest'
  | 'fastest'
  | 'recommended'
  | 'eco_friendly'
  | 'red_eye'
  | 'early_bird'
  | 'late_night';

export interface FlightLeg {
  segments: FlightSegment[];
  totalDuration: number; // minutes
  stops: number;
  layoverDurations?: number[]; // minutes between segments
}

export interface FlightSegment {
  airline: Airline;
  flightNumber: string;
  aircraft?: string;

  departure: {
    airport: Airport;
    time: string; // ISO datetime
    terminal?: string;
    gate?: string;
  };

  arrival: {
    airport: Airport;
    time: string; // ISO datetime
    terminal?: string;
  };

  duration: number; // minutes
  distance?: number; // miles
  cabinClass: CabinClass;
  seatPitch?: string; // e.g., "32 inches"
  wifi: boolean;
  power: boolean;
  entertainment: boolean;
}

export interface Airline {
  code: string; // IATA
  name: string;
  logo?: string;
  alliance?: 'star' | 'oneworld' | 'skyteam' | 'none';
  rating?: number;
}

export interface FareRules {
  changeable: boolean;
  changeFee?: number;
  refundable: boolean;
  refundFee?: number;
  cancelDeadline?: string;
  seatSelection: 'included' | 'paid' | 'not_available';
  upgradable: boolean;
}

export interface BaggageAllowance {
  carryOn: { included: boolean; pieces: number; weight?: string };
  checked: { included: boolean; pieces: number; weight?: string; fee?: number };
  personal: { included: boolean };
}

// ============================================================================
// Providers
// ============================================================================

export interface FlightProvider {
  id: string;
  name: string; // "Amadeus", "Skyscanner", "Google Flights", "Direct"
  logo?: string;
}

// ============================================================================
// Search Filters (applied client-side to results)
// ============================================================================

export interface FlightFilters {
  stops: StopFilter;
  priceRange: [number, number];
  airlines: string[]; // airline codes
  departureTimeRange: [number, number]; // hours 0-24
  arrivalTimeRange: [number, number];
  maxDuration: number; // minutes
  baggageIncluded: boolean;
  refundableOnly: boolean;
  sortBy: SortOption;
}

// ============================================================================
// Popular Airports (for autocomplete)
// ============================================================================

export const POPULAR_AIRPORTS: Airport[] = [
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', country: 'US' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'US' },
  { code: 'ORD', name: "O'Hare International", city: 'Chicago', country: 'US' },
  { code: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'US' },
  { code: 'DEN', name: 'Denver International', city: 'Denver', country: 'US' },
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'US' },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'US' },
  { code: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'US' },
  { code: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', country: 'US' },
  { code: 'MCO', name: 'Orlando International', city: 'Orlando', country: 'US' },
  { code: 'MIA', name: 'Miami International', city: 'Miami', country: 'US' },
  { code: 'BOS', name: 'Logan International', city: 'Boston', country: 'US' },
  { code: 'EWR', name: 'Newark Liberty International', city: 'Newark', country: 'US' },
  { code: 'MSP', name: 'Minneapolis-Saint Paul International', city: 'Minneapolis', country: 'US' },
  { code: 'DTW', name: 'Detroit Metropolitan Wayne County', city: 'Detroit', country: 'US' },
  { code: 'PHX', name: 'Phoenix Sky Harbor International', city: 'Phoenix', country: 'US' },
  { code: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', country: 'US' },
  { code: 'AUS', name: 'Austin-Bergstrom International', city: 'Austin', country: 'US' },
  { code: 'LHR', name: 'Heathrow', city: 'London', country: 'UK' },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'FR' },
  { code: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'JP' },
  { code: 'HND', name: 'Haneda', city: 'Tokyo', country: 'JP' },
  { code: 'FCO', name: 'Leonardo da Vinci-Fiumicino', city: 'Rome', country: 'IT' },
  { code: 'BCN', name: 'Josep Tarradellas Barcelona-El Prat', city: 'Barcelona', country: 'ES' },
  { code: 'CUN', name: 'Cancun International', city: 'Cancun', country: 'MX' },
  { code: 'SYD', name: 'Kingsford Smith International', city: 'Sydney', country: 'AU' },
  { code: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'IE' },
  { code: 'ICN', name: 'Incheon International', city: 'Seoul', country: 'KR' },
  { code: 'SIN', name: 'Changi', city: 'Singapore', country: 'SG' },
  { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'TH' },
];

// ============================================================================
// Cabin Class Display Config
// ============================================================================

export const CABIN_CLASS_CONFIG: Record<CabinClass, { label: string; shortLabel: string }> = {
  economy: { label: 'Economy', shortLabel: 'Econ' },
  premium_economy: { label: 'Premium Economy', shortLabel: 'Prem Econ' },
  business: { label: 'Business', shortLabel: 'Biz' },
  first: { label: 'First Class', shortLabel: 'First' },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatFlightTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function getStopsLabel(stops: number): string {
  if (stops === 0) return 'Nonstop';
  if (stops === 1) return '1 stop';
  return `${stops} stops`;
}

export function searchAirports(query: string): Airport[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return POPULAR_AIRPORTS.filter(
    (a) =>
      a.code.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q)
  ).slice(0, 8);
}
