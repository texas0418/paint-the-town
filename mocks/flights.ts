// ============================================================================
// Mock Flight Data for Paint the Town
// ============================================================================

import {
  FlightSearchResult,
  Airline,
  FlightProvider,
  Airport,
} from '@/types/flight';

// ============================================================================
// Airlines
// ============================================================================

export const AIRLINES: Record<string, Airline> = {
  DL: { code: 'DL', name: 'Delta Air Lines', alliance: 'skyteam', rating: 4.2 },
  UA: { code: 'UA', name: 'United Airlines', alliance: 'star', rating: 3.8 },
  AA: { code: 'AA', name: 'American Airlines', alliance: 'oneworld', rating: 3.9 },
  WN: { code: 'WN', name: 'Southwest Airlines', alliance: 'none', rating: 4.0 },
  B6: { code: 'B6', name: 'JetBlue Airways', alliance: 'none', rating: 4.3 },
  AS: { code: 'AS', name: 'Alaska Airlines', alliance: 'oneworld', rating: 4.4 },
  NK: { code: 'NK', name: 'Spirit Airlines', alliance: 'none', rating: 2.8 },
  F9: { code: 'F9', name: 'Frontier Airlines', alliance: 'none', rating: 2.9 },
  BA: { code: 'BA', name: 'British Airways', alliance: 'oneworld', rating: 4.1 },
  AF: { code: 'AF', name: 'Air France', alliance: 'skyteam', rating: 4.0 },
  LH: { code: 'LH', name: 'Lufthansa', alliance: 'star', rating: 4.2 },
  NH: { code: 'NH', name: 'ANA (All Nippon Airways)', alliance: 'star', rating: 4.7 },
  SQ: { code: 'SQ', name: 'Singapore Airlines', alliance: 'star', rating: 4.8 },
};

// ============================================================================
// Providers
// ============================================================================

export const PROVIDERS: FlightProvider[] = [
  { id: 'amadeus', name: 'Amadeus' },
  { id: 'skyscanner', name: 'Skyscanner' },
  { id: 'google', name: 'Google Flights' },
  { id: 'direct', name: 'Direct' },
];

// ============================================================================
// Generate Mock Results
// ============================================================================

function makeAirport(code: string, name: string, city: string, country: string): Airport {
  return { code, name, city, country };
}

const ATL = makeAirport('ATL', 'Hartsfield-Jackson', 'Atlanta', 'US');
const JFK = makeAirport('JFK', 'John F. Kennedy International', 'New York', 'US');
const LAX = makeAirport('LAX', 'Los Angeles International', 'Los Angeles', 'US');
const SFO = makeAirport('SFO', 'San Francisco International', 'San Francisco', 'US');
const ORD = makeAirport('ORD', "O'Hare International", 'Chicago', 'US');
const MIA = makeAirport('MIA', 'Miami International', 'Miami', 'US');
const LHR = makeAirport('LHR', 'Heathrow', 'London', 'UK');
const CDG = makeAirport('CDG', 'Charles de Gaulle', 'Paris', 'FR');
const NRT = makeAirport('NRT', 'Narita International', 'Tokyo', 'JP');
const CUN = makeAirport('CUN', 'Cancun International', 'Cancun', 'MX');
const DFW = makeAirport('DFW', 'Dallas/Fort Worth International', 'Dallas', 'US');
const BOS = makeAirport('BOS', 'Logan International', 'Boston', 'US');
const DEN = makeAirport('DEN', 'Denver International', 'Denver', 'US');
const SEA = makeAirport('SEA', 'Seattle-Tacoma International', 'Seattle', 'US');
const AUS = makeAirport('AUS', 'Austin-Bergstrom International', 'Austin', 'US');

// Helper to generate mock flight results for any city pair
// eslint-disable-next-line complexity -- tracked in #1
export function generateMockFlights(
  origin: Airport,
  destination: Airport,
  departDate: string,
  returnDate?: string,
  passengers: number = 1,
): FlightSearchResult[] {
  const basePrices = [189, 225, 267, 312, 348, 389, 425, 478, 529, 599, 649, 725];
  const airlineKeys = Object.keys(AIRLINES);

  const results: FlightSearchResult[] = [];

  for (let i = 0; i < 12; i++) {
    const airlineCode = airlineKeys[i % airlineKeys.length];
    const airline = AIRLINES[airlineCode];
    const basePrice = basePrices[i];
    const isNonstop = i < 4;
    const stops = isNonstop ? 0 : i < 8 ? 1 : 2;

    const baseDuration = isNonstop
      ? 120 + Math.floor(Math.random() * 180)
      : 240 + Math.floor(Math.random() * 300);

    const departHour = 6 + Math.floor(Math.random() * 16);
    const departMinute = Math.random() > 0.5 ? 0 : 30;
    const departTime = new Date(`${departDate}T${String(departHour).padStart(2, '0')}:${String(departMinute).padStart(2, '0')}:00`);
    const arriveTime = new Date(departTime.getTime() + baseDuration * 60000);

    const layoverAirports = [ORD, DFW, ATL, DEN, MIA];
    const layoverAirport = layoverAirports[i % layoverAirports.length];

    const segments = isNonstop
      ? [
          {
            airline,
            flightNumber: `${airlineCode}${1000 + i * 100 + Math.floor(Math.random() * 99)}`,
            aircraft: ['Boeing 737-800', 'Airbus A320', 'Boeing 787-9', 'Airbus A321neo'][i % 4],
            departure: {
              airport: origin,
              time: departTime.toISOString(),
              terminal: String(Math.ceil(Math.random() * 8)),
            },
            arrival: {
              airport: destination,
              time: arriveTime.toISOString(),
              terminal: String(Math.ceil(Math.random() * 6)),
            },
            duration: baseDuration,
            cabinClass: 'economy' as const,
            wifi: Math.random() > 0.3,
            power: Math.random() > 0.2,
            entertainment: Math.random() > 0.4,
          },
        ]
      : [
          {
            airline,
            flightNumber: `${airlineCode}${1000 + i * 100}`,
            aircraft: 'Boeing 737-800',
            departure: {
              airport: origin,
              time: departTime.toISOString(),
              terminal: String(Math.ceil(Math.random() * 8)),
            },
            arrival: {
              airport: layoverAirport,
              time: new Date(departTime.getTime() + (baseDuration * 0.45) * 60000).toISOString(),
            },
            duration: Math.floor(baseDuration * 0.45),
            cabinClass: 'economy' as const,
            wifi: true,
            power: true,
            entertainment: false,
          },
          {
            airline,
            flightNumber: `${airlineCode}${1000 + i * 100 + 1}`,
            aircraft: 'Airbus A320',
            departure: {
              airport: layoverAirport,
              time: new Date(departTime.getTime() + (baseDuration * 0.55) * 60000).toISOString(),
            },
            arrival: {
              airport: destination,
              time: arriveTime.toISOString(),
            },
            duration: Math.floor(baseDuration * 0.45),
            cabinClass: 'economy' as const,
            wifi: Math.random() > 0.4,
            power: true,
            entertainment: true,
          },
        ];

    const layoverDurations = !isNonstop
      ? [Math.floor(baseDuration * 0.1)]
      : undefined;

    const taxes = Math.round(basePrice * 0.15);
    const perPerson = basePrice;
    const total = perPerson * passengers + taxes;

    const tags: FlightSearchResult['tags'] = [];
    if (i === 0) tags.push('best_value');
    if (basePrice === Math.min(...basePrices)) tags.push('cheapest');
    if (isNonstop && baseDuration < 180) tags.push('fastest');
    if (departHour < 8) tags.push('early_bird');
    if (departHour >= 22) tags.push('red_eye');
    if (airline.rating && airline.rating >= 4.5) tags.push('recommended');

    const result: FlightSearchResult = {
      id: `flight-${i + 1}`,
      provider: PROVIDERS[i % PROVIDERS.length],
      outbound: {
        segments,
        totalDuration: baseDuration,
        stops,
        layoverDurations,
      },
      returnLeg: returnDate
        ? {
            segments: [
              {
                airline,
                flightNumber: `${airlineCode}${2000 + i * 100}`,
                aircraft: segments[0].aircraft,
                departure: {
                  airport: destination,
                  time: `${returnDate}T${String(10 + (i % 8)).padStart(2, '0')}:00:00`,
                  terminal: String(Math.ceil(Math.random() * 6)),
                },
                arrival: {
                  airport: origin,
                  time: `${returnDate}T${String(14 + (i % 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
                },
                duration: baseDuration + (isNonstop ? 0 : -30),
                cabinClass: 'economy',
                wifi: true,
                power: true,
                entertainment: true,
              },
            ],
            totalDuration: baseDuration + (isNonstop ? 0 : -30),
            stops: 0,
          }
        : undefined,
      price: basePrice,
      originalPrice: i % 3 === 0 ? Math.round(basePrice * 1.2) : undefined,
      currency: 'USD',
      pricePerPerson: perPerson,
      taxesAndFees: taxes,
      totalPrice: total,
      fareClass: ['Basic Economy', 'Main Cabin', 'Comfort+', 'Economy Saver'][i % 4],
      fareRules: {
        changeable: i % 3 !== 0,
        changeFee: i % 3 !== 0 ? 0 : 75,
        refundable: i % 4 === 2,
        refundFee: i % 4 === 2 ? 0 : undefined,
        seatSelection: i % 3 === 0 ? 'paid' : 'included',
        upgradable: i % 2 === 0,
      },
      baggage: {
        personal: { included: true },
        carryOn: { included: i % 3 !== 0, pieces: 1, weight: '22 lbs' },
        checked: {
          included: i % 4 === 2 || i % 4 === 3,
          pieces: i % 4 === 3 ? 2 : 1,
          weight: '50 lbs',
          fee: i % 4 < 2 ? 35 : undefined,
        },
      },
      tags,
      score: Math.max(50, 100 - i * 4 - stops * 10 + (airline.rating || 3) * 5),
    };

    results.push(result);
  }

  // Sort by score (best first)
  return results.sort((a, b) => b.score - a.score);
}

// ============================================================================
// Pre-built Popular Route Results
// ============================================================================

export const POPULAR_ROUTES = [
  { origin: ATL, destination: JFK, label: 'Atlanta → New York' },
  { origin: ATL, destination: LAX, label: 'Atlanta → Los Angeles' },
  { origin: ATL, destination: MIA, label: 'Atlanta → Miami' },
  { origin: ATL, destination: CUN, label: 'Atlanta → Cancun' },
  { origin: JFK, destination: LHR, label: 'New York → London' },
  { origin: JFK, destination: CDG, label: 'New York → Paris' },
  { origin: LAX, destination: NRT, label: 'Los Angeles → Tokyo' },
  { origin: SFO, destination: SEA, label: 'San Francisco → Seattle' },
];
