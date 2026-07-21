/**
 * Reservation deep links.
 *
 * v1 is link-outs, not API integrations: an OpenTable search pre-filled with
 * the venue, party of two, and the plan's date and time. OpenTable resolves
 * venue-name searches well, and its app opens via universal links when
 * installed. Non-restaurant stops don't get a reserve link.
 */

import { PlanStop } from '@/types/planner';

const RESERVABLE_CATEGORIES = new Set(['food', 'drinks']);

export function isReservable(stop: PlanStop): boolean {
  // A researched booking link wins regardless of category; otherwise
  // restaurants and bars get a search fallback (plenty of cocktail bars and
  // oyster bars take reservations too).
  return !!stop.reservationUrl || RESERVABLE_CATEGORIES.has(stop.category);
}

/**
 * Prefers the exact booking link captured during research (correct platform —
 * OpenTable, Resy, Tock, or the venue's own page). Falls back to an OpenTable
 * search for plans generated before reservationUrl existed.
 *
 * @param planDate ISO date (YYYY-MM-DD) or null when the plan is flexible.
 * @param city Included in the fallback search term to disambiguate venues.
 */
export function buildReservationUrl(
  stop: PlanStop,
  planDate: string | null,
  city: string
): string {
  if (stop.reservationUrl && /^https?:\/\//.test(stop.reservationUrl)) {
    return stop.reservationUrl;
  }
  // Bars are often Resy-only or book direct, so an OpenTable search would
  // dead-end — a reservations web search lands on whichever platform the
  // venue actually uses.
  if (stop.category !== 'food') {
    return `https://www.google.com/search?q=${encodeURIComponent(
      `${stop.venueName} ${city} reservations`
    )}`;
  }
  const params = new URLSearchParams({
    term: `${stop.venueName} ${city}`,
    covers: '2',
  });
  // Only pin a time when we actually know the date — a dateless dateTime
  // would quietly search for "today" and mislead.
  if (planDate && /^\d{4}-\d{2}-\d{2}$/.test(planDate) && /^\d{2}:\d{2}/.test(stop.time)) {
    params.set('dateTime', `${planDate}T${stop.time.slice(0, 5)}`);
  }
  return `https://www.opentable.com/s?${params.toString()}`;
}
