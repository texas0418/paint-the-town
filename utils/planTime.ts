import { PlanStop } from '@/types/planner';

/** "HH:MM" → minutes since midnight. */
export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Minutes since midnight → "HH:MM", wrapping so past-midnight stays a valid time. */
export function hhmm(min: number): string {
  const w = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(w / 60)).padStart(2, '0')}:${String(w % 60).padStart(2, '0')}`;
}

/** Shift an "HH:MM" time by a signed number of minutes. */
export function shiftTime(time: string, deltaMin: number): string {
  return hhmm(minutesOf(time) + deltaMin);
}

/** An "HH:MM" time as a Date today (for the native time picker). */
export function timeToDate(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 19, m || 0, 0, 0);
  return d;
}

/**
 * Non-overlap invariant: no stop may start before the previous one ends.
 * A forward pass pushes any offending start down to the previous stop's end,
 * never pulls one earlier — so the first stop anchors the schedule.
 */
export function resolveOverlaps(stops: PlanStop[]): PlanStop[] {
  const out = stops.map((s) => ({ ...s }));
  for (let k = 1; k < out.length; k++) {
    const prevEnd = minutesOf(out[k - 1].time) + (out[k - 1].durationMinutes || 60);
    if (minutesOf(out[k].time) < prevEnd) out[k].time = hhmm(prevEnd);
  }
  return out;
}
