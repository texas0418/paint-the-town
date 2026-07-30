/** Shared vocabulary for the plan-a-date form, its loading state, and results. */

export type Phase = 'form' | 'loading' | 'results' | 'destinations';
export type PlanMode = 'plan_for_me' | 'single' | 'vacation';

// Generated plans survive the app being backgrounded/killed (each generation
// costs quota, so losing results is losing money). Restored for up to 24h.
export const RESULTS_STORAGE_KEY = 'w4nder:lastPlanResults';
export const RESULTS_TTL_MS = 24 * 60 * 60 * 1000;

export const dateChips = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'saturday', label: 'This Saturday' },
  { id: 'flexible', label: 'Flexible' },
];

export const timeChips = [
  { id: '10:00', label: 'Morning' },
  { id: '14:00', label: 'Afternoon' },
  { id: '18:00', label: 'Evening' },
];

export const durationChips = [
  { id: 3, label: '~3 hours' },
  { id: 5, label: '~5 hours' },
  { id: 8, label: 'All day' },
];

export const dayCountChips = [
  { id: 2, label: '2 days' },
  { id: 3, label: '3 days' },
  { id: 5, label: '5 days' },
  { id: 7, label: '1 week' },
  { id: 10, label: '10 days' },
];

// Optional steering chips: the more users say upfront, the less they need to
// regenerate (each generation costs quota).
export const vibeChips = [
  'Romantic',
  'Adventurous',
  'Chill & cozy',
  'Fancy',
  'Casual',
  'First date',
  'Anniversary',
];

export const mustIncludeChips = [
  'Dinner',
  'Drinks',
  'Live music',
  'Activity',
  'Dessert',
  'Outdoors',
];

export const loadingMessages = [
  'Reading your taste profile…',
  'Searching real venues near you…',
  'Checking hours and prices…',
  'Balancing the budget…',
  'Putting the schedule together…',
  'Almost there — polishing your plans…',
];

/** Resolve a date chip to an ISO date, or undefined for "flexible". */
export function chipToDate(chip: string): string | undefined {
  const now = new Date();
  if (chip === 'today') return now.toISOString().slice(0, 10);
  if (chip === 'tomorrow') {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  if (chip === 'saturday') {
    const d = new Date(now);
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
    return d.toISOString().slice(0, 10);
  }
  return undefined; // flexible
}
