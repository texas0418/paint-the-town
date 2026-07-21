// Paint the Town Time-Optimized Routes - Optimization Service

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Activity,
  Route,
  RouteStop,
  TravelSegment,
  Coordinates,
  TransportMode,
  TransportPreferences,
  OptimizationStrategy,
  OptimizationResult,
  OptimizationConstraints,
  RouteChange,
  Location,
} from '../types/routes';

const STORAGE_KEYS = {
  ROUTES: '@w4nder/optimized_routes',
  PREFERENCES: '@w4nder/route_preferences',
};

// Average speeds in km/h
const AVERAGE_SPEEDS: Record<TransportMode, number> = {
  walking: 5,
  cycling: 15,
  driving: 30,
  transit: 25,
  rideshare: 30,
  taxi: 30,
};

class RouteOptimizationService {
  // ============================================================================
  // DISTANCE & TRAVEL CALCULATIONS
  // ============================================================================

  calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371000; // Earth radius in meters
    const lat1 = this.toRadians(from.latitude);
    const lat2 = this.toRadians(to.latitude);
    const deltaLat = this.toRadians(to.latitude - from.latitude);
    const deltaLon = this.toRadians(to.longitude - from.longitude);

    const a =
      Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  estimateTravelTime(
    from: Coordinates,
    to: Coordinates,
    mode: TransportMode,
    departureTime?: Date
  ): number {
    const distance = this.calculateDistance(from, to);
    const speed = AVERAGE_SPEEDS[mode];
    let baseTime = (distance / 1000 / speed) * 60;

    // Rush hour adjustment
    if ((mode === 'driving' || mode === 'rideshare' || mode === 'taxi') && departureTime) {
      const hour = departureTime.getHours();
      if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        baseTime *= 1.5;
      }
    }

    // Transit buffer
    if (mode === 'transit') baseTime += 10;

    return Math.ceil(baseTime);
  }

  selectTransportMode(distance: number, prefs: TransportPreferences): TransportMode {
    if (distance <= prefs.maxWalkingDistance && prefs.preferredModes.includes('walking')) {
      return 'walking';
    }
    if (distance <= 5000 && prefs.preferredModes.includes('cycling')) {
      return 'cycling';
    }
    for (const mode of prefs.preferredModes) {
      if (['transit', 'rideshare', 'driving', 'taxi'].includes(mode)) {
        return mode;
      }
    }
    return 'transit';
  }

  // ============================================================================
  // ROUTE BUILDING
  // ============================================================================

  buildRoute(
    activities: Activity[],
    date: string,
    startTime: string,
    transportPrefs: TransportPreferences,
    startLocation?: Location,
    endLocation?: Location
  ): Route {
    const stops: RouteStop[] = [];
    const travelSegments: TravelSegment[] = [];

    let currentTime = this.parseDateTime(date, startTime);
    let totalTravelTime = 0;
    let totalDistance = 0;
    let totalWaitTime = 0;
    let activityTime = 0;

    let prevLocation = startLocation;

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];

      // Travel from previous location
      if (prevLocation) {
        const distance = this.calculateDistance(
          prevLocation.coordinates,
          activity.location.coordinates
        );
        const mode = this.selectTransportMode(distance, transportPrefs);
        const travelTime = this.estimateTravelTime(
          prevLocation.coordinates,
          activity.location.coordinates,
          mode,
          currentTime
        );

        travelSegments.push({
          id: `travel_${i}`,
          fromActivityId: i === 0 ? 'start' : activities[i - 1].id,
          toActivityId: activity.id,
          mode,
          distance,
          duration: travelTime,
          departureTime: currentTime.toISOString(),
          arrivalTime: new Date(currentTime.getTime() + travelTime * 60000).toISOString(),
        });

        currentTime = new Date(currentTime.getTime() + travelTime * 60000);
        totalTravelTime += travelTime;
        totalDistance += distance;
      }

      // Check wait time for opening
      let waitTime = 0;
      if (activity.operatingHours?.length) {
        const openTime = this.getOpeningTime(activity.operatingHours, currentTime);
        if (openTime && currentTime < openTime) {
          waitTime = Math.ceil((openTime.getTime() - currentTime.getTime()) / 60000);
          currentTime = openTime;
        }
      }

      const arrivalTime = new Date(currentTime);
      const departureTime = new Date(currentTime.getTime() + activity.duration * 60000);

      stops.push({
        id: `stop_${activity.id}`,
        activity,
        arrivalTime: arrivalTime.toISOString(),
        departureTime: departureTime.toISOString(),
        waitTime,
        order: i,
        wasReordered: false,
      });

      totalWaitTime += waitTime;
      activityTime += activity.duration;
      currentTime = departureTime;
      prevLocation = activity.location;
    }

    // Travel to end location
    if (endLocation && prevLocation) {
      const distance = this.calculateDistance(prevLocation.coordinates, endLocation.coordinates);
      const mode = this.selectTransportMode(distance, transportPrefs);
      const travelTime = this.estimateTravelTime(
        prevLocation.coordinates,
        endLocation.coordinates,
        mode,
        currentTime
      );

      travelSegments.push({
        id: 'travel_end',
        fromActivityId: activities[activities.length - 1]?.id || 'start',
        toActivityId: 'end',
        mode,
        distance,
        duration: travelTime,
        departureTime: currentTime.toISOString(),
        arrivalTime: new Date(currentTime.getTime() + travelTime * 60000).toISOString(),
      });

      totalTravelTime += travelTime;
      totalDistance += distance;
    }

    return {
      id: `route_${Date.now()}`,
      date,
      stops,
      travelSegments,
      totalDuration: totalTravelTime + totalWaitTime + activityTime,
      totalTravelTime,
      totalDistance,
      totalWaitTime,
      activityTime,
      startTime: this.parseDateTime(date, startTime).toISOString(),
      endTime: currentTime.toISOString(),
      startLocation,
      endLocation,
      isOptimized: false,
      createdAt: new Date().toISOString(),
    };
  }

  // ============================================================================
  // OPTIMIZATION ALGORITHMS
  // ============================================================================

  async optimizeRoute(
    activities: Activity[],
    date: string,
    strategy: OptimizationStrategy,
    transportPrefs: TransportPreferences,
    constraints: OptimizationConstraints,
    startLocation?: Location,
    endLocation?: Location
  ): Promise<OptimizationResult> {
    const originalRoute = this.buildRoute(
      activities,
      date,
      constraints.startTime,
      transportPrefs,
      startLocation,
      endLocation
    );

    // Separate fixed and flexible activities
    const fixed = activities.filter((a) => a.flexibility === 'fixed' || a.isLocked);
    const flexible = activities.filter((a) => a.flexibility !== 'fixed' && !a.isLocked);

    // Optimize based on strategy
    let optimizedOrder: Activity[];
    switch (strategy) {
      case 'minimize_travel':
        optimizedOrder = this.nearestNeighbor(flexible, fixed, startLocation);
        break;
      case 'minimize_distance':
        optimizedOrder = this.twoOptOptimize(this.nearestNeighbor(flexible, fixed, startLocation));
        break;
      case 'priority_first':
        optimizedOrder = this.priorityOptimize(flexible, fixed);
        break;
      case 'chronological':
        optimizedOrder = this.chronologicalOptimize(flexible, fixed);
        break;
      case 'balanced':
      default:
        optimizedOrder = this.balancedOptimize(flexible, fixed, startLocation, constraints);
    }

    const optimizedRoute = this.buildRoute(
      optimizedOrder,
      date,
      constraints.startTime,
      transportPrefs,
      startLocation,
      endLocation
    );
    optimizedRoute.isOptimized = true;

    // Mark reordered stops
    optimizedRoute.stops.forEach((stop, newIdx) => {
      const origIdx = activities.findIndex((a) => a.id === stop.activity.id);
      stop.originalOrder = origIdx;
      stop.wasReordered = origIdx !== newIdx;
      if (stop.wasReordered) {
        const origStop = originalRoute.stops.find((s) => s.activity.id === stop.activity.id);
        if (origStop) {
          stop.timeDelta = Math.round(
            (new Date(stop.arrivalTime).getTime() - new Date(origStop.arrivalTime).getTime()) /
              60000
          );
        }
      }
    });

    const changes = this.generateChanges(originalRoute, optimizedRoute, activities);
    const timeSaved = Math.max(0, originalRoute.totalTravelTime - optimizedRoute.totalTravelTime);
    const distanceSaved = Math.max(0, originalRoute.totalDistance - optimizedRoute.totalDistance);

    return {
      id: `opt_${Date.now()}`,
      originalRoute,
      optimizedRoute,
      strategy,
      timeSaved,
      distanceSaved,
      changes,
      changeCount: changes.length,
      score: this.calculateScore(optimizedRoute, constraints),
      originalScore: this.calculateScore(originalRoute, constraints),
      warnings: this.generateWarnings(optimizedRoute, constraints),
      calculatedAt: new Date().toISOString(),
    };
  }

  private nearestNeighbor(
    flexible: Activity[],
    fixed: Activity[],
    startLocation?: Location
  ): Activity[] {
    if (flexible.length === 0) return [...fixed];

    const result: Activity[] = [];
    const remaining = [...flexible];
    let currentCoords = startLocation?.coordinates || flexible[0].location.coordinates;

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const dist = this.calculateDistance(currentCoords, remaining[i].location.coordinates);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      const nearest = remaining.splice(nearestIdx, 1)[0];
      result.push(nearest);
      currentCoords = nearest.location.coordinates;
    }

    return this.mergeFixed(result, fixed);
  }

  private twoOptOptimize(route: Activity[]): Activity[] {
    let improved = true;
    let current = [...route];

    while (improved) {
      improved = false;
      for (let i = 0; i < current.length - 2; i++) {
        for (let j = i + 2; j < current.length; j++) {
          if (current[i].isLocked || current[j].isLocked) continue;

          const d1 = this.calculateDistance(
            current[i].location.coordinates,
            current[i + 1].location.coordinates
          );
          const d2 = this.calculateDistance(
            current[j].location.coordinates,
            current[(j + 1) % current.length].location.coordinates
          );
          const d3 = this.calculateDistance(
            current[i].location.coordinates,
            current[j].location.coordinates
          );
          const d4 = this.calculateDistance(
            current[i + 1].location.coordinates,
            current[(j + 1) % current.length].location.coordinates
          );

          if (d3 + d4 < d1 + d2) {
            // Reverse segment between i+1 and j
            const newRoute = current.slice(0, i + 1);
            for (let k = j; k > i; k--) {
              newRoute.push(current[k]);
            }
            for (let k = j + 1; k < current.length; k++) {
              newRoute.push(current[k]);
            }
            current = newRoute;
            improved = true;
          }
        }
      }
    }

    return current;
  }

  private priorityOptimize(flexible: Activity[], fixed: Activity[]): Activity[] {
    const sorted = [...flexible].sort((a, b) => b.priority - a.priority);
    return this.mergeFixed(sorted, fixed);
  }

  private chronologicalOptimize(flexible: Activity[], fixed: Activity[]): Activity[] {
    const sorted = [...flexible].sort((a, b) => {
      const aTime = a.preferredTimeWindow?.start || '12:00';
      const bTime = b.preferredTimeWindow?.start || '12:00';
      return aTime.localeCompare(bTime);
    });
    return this.mergeFixed(sorted, fixed);
  }

  private balancedOptimize(
    flexible: Activity[],
    fixed: Activity[],
    startLocation?: Location,
    constraints?: OptimizationConstraints
  ): Activity[] {
    let route = this.nearestNeighbor(flexible, fixed, startLocation);

    // Adjust for meal times
    if (constraints?.lunchWindow) {
      route = this.adjustForMealTime(route, 'dining', constraints.lunchWindow);
    }
    if (constraints?.dinnerWindow) {
      route = this.adjustForMealTime(route, 'dining', constraints.dinnerWindow);
    }

    return this.twoOptOptimize(route);
  }

  private mergeFixed(flexible: Activity[], fixed: Activity[]): Activity[] {
    if (fixed.length === 0) return flexible;

    const result = [...flexible];
    for (const f of fixed) {
      const targetTime = f.reservationTime || f.scheduledTime;
      if (!targetTime) {
        result.push(f);
        continue;
      }

      let insertIdx = 0;
      const targetDate = new Date(targetTime);
      for (let i = 0; i < result.length; i++) {
        const actTime = result[i].scheduledTime || result[i].preferredTimeWindow?.start;
        if (actTime && new Date(actTime) > targetDate) break;
        insertIdx = i + 1;
      }
      result.splice(insertIdx, 0, f);
    }

    return result;
  }

  private adjustForMealTime(
    route: Activity[],
    category: string,
    window: { start: string; end: string }
  ): Activity[] {
    const diningIdx = route.findIndex((a) => a.category === category);
    if (diningIdx === -1) return route;

    const windowMid = (this.parseTime(window.start) + this.parseTime(window.end)) / 2;
    let bestPos = diningIdx;
    let bestDiff = Infinity;

    for (let i = 0; i < route.length; i++) {
      const estTime = 9 * 60 + i * 90; // Rough estimate
      const diff = Math.abs(estTime - windowMid);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestPos = i;
      }
    }

    if (bestPos !== diningIdx) {
      const [dining] = route.splice(diningIdx, 1);
      route.splice(bestPos, 0, dining);
    }

    return route;
  }

  // ============================================================================
  // SCORING & ANALYSIS
  // ============================================================================

  private calculateScore(route: Route, constraints: OptimizationConstraints): number {
    let score = 100;

    const dayMinutes = this.parseTime(constraints.endTime) - this.parseTime(constraints.startTime);
    const travelRatio = route.totalTravelTime / dayMinutes;
    if (travelRatio > 0.2) score -= (travelRatio - 0.2) * 100;

    const waitRatio = route.totalWaitTime / dayMinutes;
    score -= waitRatio * 50;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateChanges(
    original: Route,
    optimized: Route,
    activities: Activity[]
  ): RouteChange[] {
    const changes: RouteChange[] = [];

    for (const optStop of optimized.stops) {
      const origStop = original.stops.find((s) => s.activity.id === optStop.activity.id);
      if (!origStop) continue;

      if (optStop.order !== origStop.order) {
        changes.push({
          id: `change_${optStop.activity.id}`,
          activityId: optStop.activity.id,
          activityName: optStop.activity.name,
          changeType: 'reorder',
          fromPosition: origStop.order + 1,
          toPosition: optStop.order + 1,
          originalTime: origStop.arrivalTime,
          newTime: optStop.arrivalTime,
          timeDelta: optStop.timeDelta,
          reason: this.getChangeReason(origStop, optStop),
          impact: this.getChangeImpact(optStop.timeDelta),
        });
      }
    }

    return changes;
  }

  private getChangeReason(orig: RouteStop, opt: RouteStop): string {
    if (opt.order < orig.order) return 'Moved earlier to reduce travel time';
    return 'Moved later to optimize route flow';
  }

  private getChangeImpact(timeDelta?: number): string {
    if (!timeDelta) return 'No significant time change';
    if (timeDelta > 0) return `Arrives ${timeDelta} minutes later`;
    return `Arrives ${Math.abs(timeDelta)} minutes earlier`;
  }

  private generateWarnings(route: Route, constraints: OptimizationConstraints) {
    const warnings: Array<{
      type: string;
      message: string;
      severity: 'low' | 'medium' | 'high';
      activityId?: string;
    }> = [];

    for (const segment of route.travelSegments) {
      if (segment.duration > 45) {
        warnings.push({
          type: 'long_travel',
          message: `Long travel time (${segment.duration} min) between activities`,
          severity: 'medium',
        });
      }
    }

    const endTime = new Date(route.endTime);
    const constraintEnd = this.parseTime(constraints.endTime);
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    if (endMinutes > constraintEnd) {
      warnings.push({
        type: 'late_finish',
        message: `Day ends ${endMinutes - constraintEnd} minutes later than preferred`,
        severity: 'medium',
      });
    }

    for (const stop of route.stops) {
      if (stop.waitTime && stop.waitTime > 30) {
        warnings.push({
          type: 'long_wait',
          activityId: stop.activity.id,
          message: `${stop.waitTime} minute wait at ${stop.activity.name}`,
          severity: 'low',
        });
      }
    }

    return warnings;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private parseDateTime(date: string, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getOpeningTime(hours: OperatingHours[], date: Date): Date | null {
    const dayOfWeek = date.getDay();
    const todayHours = hours.find((h) => h.dayOfWeek === dayOfWeek);
    if (!todayHours || todayHours.isClosed) return null;

    const [h, m] = todayHours.open.split(':').map(Number);
    const openTime = new Date(date);
    openTime.setHours(h, m, 0, 0);
    return openTime;
  }

  // ============================================================================
  // STORAGE
  // ============================================================================

  async saveRoute(route: Route): Promise<void> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ROUTES);
    const routes: Route[] = data ? JSON.parse(data) : [];
    const idx = routes.findIndex((r) => r.id === route.id);
    if (idx >= 0) routes[idx] = route;
    else routes.push(route);
    await AsyncStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes));
  }

  async getRoutes(): Promise<Route[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ROUTES);
    return data ? JSON.parse(data) : [];
  }
}

export const routeOptimizationService = new RouteOptimizationService();
