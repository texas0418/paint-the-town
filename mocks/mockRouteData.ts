// Paint the Town Time-Optimized Routes - Mock Data

import { Activity, Location, OptimizationStrategy, TransportMode } from '../types/routes';

// ============================================================================
// SAMPLE LOCATIONS - Paris
// ============================================================================

export const MOCK_LOCATIONS: Record<string, Location> = {
  hotel: {
    id: 'loc_hotel',
    name: 'Hotel & Accommodation',
    address: '15 Rue de Rivoli, 75001 Paris',
    coordinates: { latitude: 48.8566, longitude: 2.3522 },
  },
  eiffel: {
    id: 'loc_eiffel',
    name: 'Eiffel Tower',
    address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
    coordinates: { latitude: 48.8584, longitude: 2.2945 },
  },
  louvre: {
    id: 'loc_louvre',
    name: 'Louvre Museum',
    address: 'Rue de Rivoli, 75001 Paris',
    coordinates: { latitude: 48.8606, longitude: 2.3376 },
  },
  notredame: {
    id: 'loc_notredame',
    name: 'Notre-Dame Cathedral',
    address: '6 Parvis Notre-Dame, 75004 Paris',
    coordinates: { latitude: 48.8530, longitude: 2.3499 },
  },
  sacrecoeur: {
    id: 'loc_sacrecoeur',
    name: 'Sacré-Cœur Basilica',
    address: '35 Rue du Chevalier de la Barre, 75018 Paris',
    coordinates: { latitude: 48.8867, longitude: 2.3431 },
  },
  arc: {
    id: 'loc_arc',
    name: 'Arc de Triomphe',
    address: 'Place Charles de Gaulle, 75008 Paris',
    coordinates: { latitude: 48.8738, longitude: 2.2950 },
  },
  orsay: {
    id: 'loc_orsay',
    name: "Musée d'Orsay",
    address: "1 Rue de la Légion d'Honneur, 75007 Paris",
    coordinates: { latitude: 48.8600, longitude: 2.3266 },
  },
  bistrot: {
    id: 'loc_bistrot',
    name: 'Le Petit Bistrot',
    address: '12 Rue Saint-Honoré, 75001 Paris',
    coordinates: { latitude: 48.8610, longitude: 2.3420 },
  },
  cafe: {
    id: 'loc_cafe',
    name: 'Café de la Paix',
    address: "5 Place de l'Opéra, 75009 Paris",
    coordinates: { latitude: 48.8706, longitude: 2.3315 },
  },
};

// ============================================================================
// SAMPLE ACTIVITIES
// ============================================================================

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'act_louvre',
    name: 'Visit Louvre Museum',
    description: "Explore the world's largest art museum",
    category: 'museum',
    location: MOCK_LOCATIONS.louvre,
    duration: 180,
    flexibility: 'preferred',
    preferredTimeWindow: { start: '09:00', end: '12:00' },
    operatingHours: [
      { dayOfWeek: 0, open: '09:00', close: '18:00' },
      { dayOfWeek: 1, open: '09:00', close: '18:00', isClosed: true },
      { dayOfWeek: 2, open: '09:00', close: '18:00' },
      { dayOfWeek: 3, open: '09:00', close: '21:45' },
      { dayOfWeek: 4, open: '09:00', close: '18:00' },
      { dayOfWeek: 5, open: '09:00', close: '21:45' },
      { dayOfWeek: 6, open: '09:00', close: '18:00' },
    ],
    priority: 5,
    estimatedCost: 17,
  },
  {
    id: 'act_eiffel',
    name: 'Eiffel Tower Visit',
    description: 'Climb the iconic tower for panoramic views',
    category: 'attraction',
    location: MOCK_LOCATIONS.eiffel,
    duration: 120,
    flexibility: 'flexible',
    preferredTimeWindow: { start: '14:00', end: '18:00' },
    priority: 5,
    estimatedCost: 26,
  },
  {
    id: 'act_lunch',
    name: 'Lunch at Le Petit Bistrot',
    description: 'Traditional French cuisine',
    category: 'dining',
    location: MOCK_LOCATIONS.bistrot,
    duration: 90,
    flexibility: 'fixed',
    preferredTimeWindow: { start: '12:00', end: '14:00' },
    requiresReservation: true,
    reservationTime: '2026-02-05T12:30:00',
    priority: 3,
    estimatedCost: 45,
    isLocked: true,
  },
  {
    id: 'act_notredame',
    name: 'Notre-Dame Exterior Visit',
    description: 'View the cathedral from outside during reconstruction',
    category: 'attraction',
    location: MOCK_LOCATIONS.notredame,
    duration: 45,
    flexibility: 'flexible',
    priority: 4,
    estimatedCost: 0,
  },
  {
    id: 'act_orsay',
    name: "Musée d'Orsay",
    description: 'Impressionist and post-impressionist masterpieces',
    category: 'museum',
    location: MOCK_LOCATIONS.orsay,
    duration: 150,
    flexibility: 'flexible',
    preferredTimeWindow: { start: '14:00', end: '17:00' },
    priority: 4,
    estimatedCost: 16,
  },
  {
    id: 'act_sacrecoeur',
    name: 'Sacré-Cœur & Montmartre',
    description: 'Visit the basilica and explore the artistic neighborhood',
    category: 'attraction',
    location: MOCK_LOCATIONS.sacrecoeur,
    duration: 120,
    flexibility: 'flexible',
    preferredTimeWindow: { start: '16:00', end: '19:00' },
    priority: 3,
    estimatedCost: 0,
  },
  {
    id: 'act_dinner',
    name: 'Dinner at Café de la Paix',
    description: 'Historic brasserie near the Opéra',
    category: 'dining',
    location: MOCK_LOCATIONS.cafe,
    duration: 120,
    flexibility: 'preferred',
    preferredTimeWindow: { start: '19:00', end: '21:00' },
    priority: 3,
    estimatedCost: 85,
  },
  {
    id: 'act_arc',
    name: 'Arc de Triomphe at Sunset',
    description: 'Climb for sunset views over Paris',
    category: 'attraction',
    location: MOCK_LOCATIONS.arc,
    duration: 60,
    flexibility: 'preferred',
    preferredTimeWindow: { start: '17:00', end: '19:00' },
    priority: 4,
    estimatedCost: 13,
  },
];

// Inefficient order for demo
export const INEFFICIENT_ORDER: Activity[] = [
  MOCK_ACTIVITIES.find(a => a.id === 'act_eiffel')!,
  MOCK_ACTIVITIES.find(a => a.id === 'act_sacrecoeur')!,
  MOCK_ACTIVITIES.find(a => a.id === 'act_louvre')!,
  MOCK_ACTIVITIES.find(a => a.id === 'act_lunch')!,
  MOCK_ACTIVITIES.find(a => a.id === 'act_arc')!,
  MOCK_ACTIVITIES.find(a => a.id === 'act_notredame')!,
  MOCK_ACTIVITIES.find(a => a.id === 'act_orsay')!,
  MOCK_ACTIVITIES.find(a => a.id === 'act_dinner')!,
];

// ============================================================================
// STRATEGY INFO
// ============================================================================

export const STRATEGY_INFO: Record<OptimizationStrategy, {
  name: string;
  description: string;
  icon: string;
  bestFor: string;
}> = {
  minimize_travel: {
    name: 'Minimize Travel',
    description: 'Spend less time traveling between locations',
    icon: '⏱️',
    bestFor: 'Maximize time at attractions',
  },
  minimize_distance: {
    name: 'Shortest Route',
    description: 'Find the most efficient path',
    icon: '📍',
    bestFor: 'Walking-heavy days',
  },
  priority_first: {
    name: 'Must-Sees First',
    description: 'High-priority activities early in the day',
    icon: '⭐',
    bestFor: "Don't miss key attractions",
  },
  chronological: {
    name: 'Time-Based',
    description: 'Respect preferred time windows',
    icon: '🕐',
    bestFor: 'Sunset views, opening times',
  },
  balanced: {
    name: 'Balanced',
    description: 'Optimize travel while respecting timing',
    icon: '⚖️',
    bestFor: 'Most trips (recommended)',
  },
};

// ============================================================================
// TRANSPORT MODE INFO
// ============================================================================

export const TRANSPORT_MODE_INFO: Record<TransportMode, {
  name: string;
  icon: string;
  description: string;
}> = {
  walking: { name: 'Walking', icon: '🚶', description: 'Free and scenic' },
  transit: { name: 'Transit', icon: '🚇', description: 'Metro, bus, trains' },
  rideshare: { name: 'Rideshare', icon: '🚗', description: 'Uber, Lyft' },
  taxi: { name: 'Taxi', icon: '🚕', description: 'Traditional taxi' },
  cycling: { name: 'Bike', icon: '🚲', description: 'Bike rental' },
  driving: { name: 'Driving', icon: '🚙', description: 'Rental car' },
};
