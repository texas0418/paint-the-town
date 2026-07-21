// Time Conflict Detection Types and Utilities for Paint the Town

import { ActivityWithTransport } from './transportation';

// Conflict severity levels
export type ConflictSeverity = 'error' | 'warning' | 'info';

// Types of conflicts that can occur
export type ConflictType =
  | 'overlap' // Activities overlap in time
  | 'insufficient_travel' // Not enough time to travel between activities
  | 'tight_transition' // Very little buffer time
  | 'same_time' // Activities start at exact same time
  | 'reverse_order' // End time is before start time
  | 'past_midnight' // Activity spans past midnight (may be intentional)
  | 'long_gap'; // Unusually long gap between activities

export interface TimeConflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  message: string;
  shortMessage: string;
  activityIds: string[]; // IDs of affected activities
  suggestedFix?: string;
  details?: {
    overlapMinutes?: number;
    availableMinutes?: number;
    requiredMinutes?: number;
    gapMinutes?: number;
  };
}

export interface ConflictCheckResult {
  hasErrors: boolean;
  hasWarnings: boolean;
  conflicts: TimeConflict[];
  conflictsByActivity: Record<string, TimeConflict[]>;
  summary: {
    totalConflicts: number;
    errors: number;
    warnings: number;
    infos: number;
  };
}

// Configuration for conflict detection
export interface ConflictDetectionConfig {
  minBufferMinutes: number; // Minimum buffer time (default: 5)
  tightBufferMinutes: number; // Tight but acceptable buffer (default: 15)
  longGapMinutes: number; // Gap considered unusually long (default: 180)
  includeInfos: boolean; // Include informational notices (default: true)
  checkPastMidnight: boolean; // Flag activities past midnight (default: true)
}

const DEFAULT_CONFIG: ConflictDetectionConfig = {
  minBufferMinutes: 5,
  tightBufferMinutes: 15,
  longGapMinutes: 180,
  includeInfos: true,
  checkPastMidnight: true,
};

// Parse time string (HH:mm) to minutes since midnight
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Format minutes to time string
export function formatMinutesToTime(minutes: number): string {
  const normalizedMinutes = ((minutes % 1440) + 1440) % 1440; // Handle negative/overflow
  const hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

// Format duration in minutes to readable string
export function formatDuration(minutes: number): string {
  if (minutes < 0) return `-${formatDuration(Math.abs(minutes))}`;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Generate unique conflict ID
function generateConflictId(type: ConflictType, activityIds: string[]): string {
  return `conflict-${type}-${activityIds.join('-')}`;
}

// Check for overlap between two time ranges
function checkOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): { overlaps: boolean; overlapMinutes: number } {
  // Handle activities that span midnight
  if (end1 < start1) end1 += 1440;
  if (end2 < start2) end2 += 1440;

  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  const overlapMinutes = Math.max(0, overlapEnd - overlapStart);

  return {
    overlaps: overlapMinutes > 0,
    overlapMinutes,
  };
}

// Main conflict detection function
export function detectTimeConflicts(
  activities: ActivityWithTransport[],
  config: Partial<ConflictDetectionConfig> = {}
): ConflictCheckResult {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const conflicts: TimeConflict[] = [];
  const conflictsByActivity: Record<string, TimeConflict[]> = {};

  // Initialize conflictsByActivity for all activities
  activities.forEach((a) => {
    conflictsByActivity[a.id] = [];
  });

  // Sort activities by start time
  const sortedActivities = [...activities].sort((a, b) => {
    return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
  });

  // Check each activity
  // eslint-disable-next-line complexity -- tracked in #1
  sortedActivities.forEach((activity, index) => {
    const startMinutes = parseTimeToMinutes(activity.startTime);
    const endMinutes = parseTimeToMinutes(activity.endTime);

    // Check for reverse order (end before start, not spanning midnight)
    if (endMinutes < startMinutes && endMinutes > 360) {
      // If end is after 6 AM, it's probably an error, not a midnight span
      const conflict: TimeConflict = {
        id: generateConflictId('reverse_order', [activity.id]),
        type: 'reverse_order',
        severity: 'error',
        message: `"${activity.name}" has an end time (${formatMinutesToTime(endMinutes)}) before its start time (${formatMinutesToTime(startMinutes)})`,
        shortMessage: 'Invalid time range',
        activityIds: [activity.id],
        suggestedFix: 'Swap the start and end times, or adjust to span past midnight',
      };
      conflicts.push(conflict);
      conflictsByActivity[activity.id].push(conflict);
    }

    // Check for past midnight span (informational)
    if (mergedConfig.checkPastMidnight && endMinutes < startMinutes && endMinutes <= 360) {
      if (mergedConfig.includeInfos) {
        const conflict: TimeConflict = {
          id: generateConflictId('past_midnight', [activity.id]),
          type: 'past_midnight',
          severity: 'info',
          message: `"${activity.name}" spans past midnight (ends at ${formatMinutesToTime(endMinutes)})`,
          shortMessage: 'Spans midnight',
          activityIds: [activity.id],
        };
        conflicts.push(conflict);
        conflictsByActivity[activity.id].push(conflict);
      }
    }

    // Check against next activity
    const nextActivity = sortedActivities[index + 1];
    if (nextActivity) {
      const nextStartMinutes = parseTimeToMinutes(nextActivity.startTime);
      let adjustedEndMinutes = endMinutes;

      // Handle midnight spanning
      if (endMinutes < startMinutes) {
        adjustedEndMinutes = endMinutes + 1440;
      }

      // Check for overlap
      const { overlaps, overlapMinutes } = checkOverlap(
        startMinutes,
        adjustedEndMinutes,
        nextStartMinutes,
        parseTimeToMinutes(nextActivity.endTime)
      );

      if (overlaps) {
        // Check if same start time
        if (startMinutes === nextStartMinutes) {
          const conflict: TimeConflict = {
            id: generateConflictId('same_time', [activity.id, nextActivity.id]),
            type: 'same_time',
            severity: 'error',
            message: `"${activity.name}" and "${nextActivity.name}" both start at ${formatMinutesToTime(startMinutes)}`,
            shortMessage: 'Same start time',
            activityIds: [activity.id, nextActivity.id],
            suggestedFix: 'Stagger the start times or combine into one activity',
          };
          conflicts.push(conflict);
          conflictsByActivity[activity.id].push(conflict);
          conflictsByActivity[nextActivity.id].push(conflict);
        } else {
          const conflict: TimeConflict = {
            id: generateConflictId('overlap', [activity.id, nextActivity.id]),
            type: 'overlap',
            severity: 'error',
            message: `"${activity.name}" overlaps with "${nextActivity.name}" by ${formatDuration(overlapMinutes)}`,
            shortMessage: `${formatDuration(overlapMinutes)} overlap`,
            activityIds: [activity.id, nextActivity.id],
            suggestedFix: `End "${activity.name}" by ${formatMinutesToTime(nextStartMinutes)} or start "${nextActivity.name}" later`,
            details: { overlapMinutes },
          };
          conflicts.push(conflict);
          conflictsByActivity[activity.id].push(conflict);
          conflictsByActivity[nextActivity.id].push(conflict);
        }
      } else {
        // Check transition time
        const gapMinutes = nextStartMinutes - adjustedEndMinutes;
        const travelTime = activity.transportToNext?.estimatedDuration || 0;
        const bufferTime = gapMinutes - travelTime;

        // Insufficient travel time
        if (travelTime > 0 && bufferTime < 0) {
          const conflict: TimeConflict = {
            id: generateConflictId('insufficient_travel', [activity.id, nextActivity.id]),
            type: 'insufficient_travel',
            severity: 'error',
            message: `Not enough time to travel from "${activity.name}" to "${nextActivity.name}". Need ${formatDuration(travelTime)}, only have ${formatDuration(gapMinutes)}`,
            shortMessage: `Need ${formatDuration(Math.abs(bufferTime))} more`,
            activityIds: [activity.id, nextActivity.id],
            suggestedFix: `Extend gap by ${formatDuration(Math.abs(bufferTime))} or choose faster transportation`,
            details: {
              availableMinutes: gapMinutes,
              requiredMinutes: travelTime,
            },
          };
          conflicts.push(conflict);
          conflictsByActivity[activity.id].push(conflict);
          conflictsByActivity[nextActivity.id].push(conflict);
        }
        // Tight transition (under minimum buffer)
        else if (bufferTime >= 0 && bufferTime < mergedConfig.minBufferMinutes) {
          const conflict: TimeConflict = {
            id: generateConflictId('tight_transition', [activity.id, nextActivity.id]),
            type: 'tight_transition',
            severity: 'warning',
            message: `Very tight transition between "${activity.name}" and "${nextActivity.name}" (only ${formatDuration(bufferTime)} buffer)`,
            shortMessage: `${formatDuration(bufferTime)} buffer`,
            activityIds: [activity.id, nextActivity.id],
            suggestedFix: 'Add more buffer time for unexpected delays',
            details: {
              availableMinutes: gapMinutes,
              requiredMinutes: travelTime,
            },
          };
          conflicts.push(conflict);
          conflictsByActivity[activity.id].push(conflict);
          conflictsByActivity[nextActivity.id].push(conflict);
        }
        // Slightly tight (under preferred buffer)
        else if (
          bufferTime >= mergedConfig.minBufferMinutes &&
          bufferTime < mergedConfig.tightBufferMinutes
        ) {
          if (mergedConfig.includeInfos) {
            const conflict: TimeConflict = {
              id: generateConflictId('tight_transition', [activity.id, nextActivity.id]),
              type: 'tight_transition',
              severity: 'info',
              message: `Limited buffer time (${formatDuration(bufferTime)}) between "${activity.name}" and "${nextActivity.name}"`,
              shortMessage: `${formatDuration(bufferTime)} buffer`,
              activityIds: [activity.id, nextActivity.id],
              details: {
                availableMinutes: gapMinutes,
                requiredMinutes: travelTime,
              },
            };
            conflicts.push(conflict);
            conflictsByActivity[activity.id].push(conflict);
            conflictsByActivity[nextActivity.id].push(conflict);
          }
        }
        // Long gap
        else if (gapMinutes > mergedConfig.longGapMinutes && mergedConfig.includeInfos) {
          const conflict: TimeConflict = {
            id: generateConflictId('long_gap', [activity.id, nextActivity.id]),
            type: 'long_gap',
            severity: 'info',
            message: `${formatDuration(gapMinutes)} gap between "${activity.name}" and "${nextActivity.name}"`,
            shortMessage: `${formatDuration(gapMinutes)} gap`,
            activityIds: [activity.id, nextActivity.id],
            suggestedFix: 'Consider adding another activity during this time',
            details: { gapMinutes },
          };
          conflicts.push(conflict);
          conflictsByActivity[activity.id].push(conflict);
          conflictsByActivity[nextActivity.id].push(conflict);
        }
      }
    }
  });

  // Calculate summary
  const summary = {
    totalConflicts: conflicts.length,
    errors: conflicts.filter((c) => c.severity === 'error').length,
    warnings: conflicts.filter((c) => c.severity === 'warning').length,
    infos: conflicts.filter((c) => c.severity === 'info').length,
  };

  return {
    hasErrors: summary.errors > 0,
    hasWarnings: summary.warnings > 0,
    conflicts,
    conflictsByActivity,
    summary,
  };
}

// Get the most severe conflict for an activity
export function getMostSevereConflict(conflicts: TimeConflict[]): TimeConflict | null {
  if (conflicts.length === 0) return null;

  const severityOrder: ConflictSeverity[] = ['error', 'warning', 'info'];

  for (const severity of severityOrder) {
    const conflict = conflicts.find((c) => c.severity === severity);
    if (conflict) return conflict;
  }

  return conflicts[0];
}

// Get color for severity
export function getSeverityColor(severity: ConflictSeverity): string {
  switch (severity) {
    case 'error':
      return '#EF4444'; // red
    case 'warning':
      return '#F59E0B'; // amber
    case 'info':
      return '#3B82F6'; // blue
    default:
      return '#6B7280'; // gray
  }
}

// Get icon name for conflict type
export function getConflictIcon(type: ConflictType): string {
  switch (type) {
    case 'overlap':
    case 'same_time':
      return 'AlertOctagon';
    case 'insufficient_travel':
      return 'Clock';
    case 'tight_transition':
      return 'AlertTriangle';
    case 'reverse_order':
      return 'ArrowDownUp';
    case 'past_midnight':
      return 'Moon';
    case 'long_gap':
      return 'Coffee';
    default:
      return 'AlertCircle';
  }
}
