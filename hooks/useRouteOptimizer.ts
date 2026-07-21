// Paint the Town Time-Optimized Routes - useRouteOptimizer Hook

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Activity,
  Route,
  RouteChange,
  OptimizationResult,
  OptimizationStrategy,
  TransportPreferences,
  OptimizationConstraints,
  Location,
  ApprovalStatus,
} from '../types/routes';
import { routeOptimizationService } from '../services/routeOptimizationService';

interface UseRouteOptimizerOptions {
  autoOptimize?: boolean;
  defaultStrategy?: OptimizationStrategy;
}

const DEFAULT_TRANSPORT_PREFS: TransportPreferences = {
  preferredModes: ['walking', 'transit', 'rideshare'],
  maxWalkingDistance: 1500,
  maxWalkingDuration: 20,
};

const DEFAULT_CONSTRAINTS: OptimizationConstraints = {
  startTime: '09:00',
  endTime: '21:00',
  lunchWindow: { start: '12:00', end: '14:00' },
  dinnerWindow: { start: '18:00', end: '20:00' },
};

export function useRouteOptimizer(options: UseRouteOptimizerOptions = {}) {
  const { autoOptimize = false, defaultStrategy = 'balanced' } = options;

  // Core state
  const [activities, setActivitiesState] = useState<Activity[]>([]);
  const [originalRoute, setOriginalRoute] = useState<Route | null>(null);
  const [optimizedRoute, setOptimizedRoute] = useState<Route | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);

  // Status
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Settings
  const [strategy, setStrategy] = useState<OptimizationStrategy>(defaultStrategy);
  const [transportPreferences, setTransportPreferences] = useState<TransportPreferences>(DEFAULT_TRANSPORT_PREFS);
  const [constraints, setConstraints] = useState<OptimizationConstraints>(DEFAULT_CONSTRAINTS);
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Approval tracking
  const [approvedChanges, setApprovedChanges] = useState<Set<string>>(new Set());
  const [rejectedChanges, setRejectedChanges] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Session-style approvals for ChangeApprovalScreen compatibility
  const session = useMemo(() => {
    if (!optimizationResult) return null;
    const approvals = optimizationResult.changes.map(change => ({
      changeId: change.activityId || change.id,
      status: approvedChanges.has(change.activityId || change.id) 
        ? 'approved' as ApprovalStatus
        : rejectedChanges.has(change.activityId || change.id)
        ? 'rejected' as ApprovalStatus
        : 'pending' as ApprovalStatus,
    }));
    return { approvals, status: 'reviewing' as const };
  }, [optimizationResult, approvedChanges, rejectedChanges]);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (autoOptimize && activities.length >= 2 && isReady) {
      optimize();
    }
  }, [activities, autoOptimize, isReady]);

  // Activity management
  const setActivities = useCallback((newActivities: Activity[]) => {
    setActivitiesState(newActivities);
    setOptimizationResult(null);
    setApprovedChanges(new Set());
    setRejectedChanges(new Set());
  }, []);

  const addActivity = useCallback((activity: Activity) => {
    setActivitiesState(prev => [...prev, activity]);
    setOptimizationResult(null);
  }, []);

  const updateActivity = useCallback((activity: Activity) => {
    setActivitiesState(prev => prev.map(a => a.id === activity.id ? activity : a));
    setOptimizationResult(null);
  }, []);

  const removeActivity = useCallback((activityId: string) => {
    setActivitiesState(prev => prev.filter(a => a.id !== activityId));
    setOptimizationResult(null);
  }, []);

  const reorderActivities = useCallback((fromIndex: number, toIndex: number) => {
    setActivitiesState(prev => {
      const newList = [...prev];
      const [removed] = newList.splice(fromIndex, 1);
      newList.splice(toIndex, 0, removed);
      return newList;
    });
    setOptimizationResult(null);
  }, []);

  const lockActivity = useCallback((activityId: string, locked: boolean) => {
    setActivitiesState(prev => prev.map(a => 
      a.id === activityId ? { ...a, isLocked: locked } : a
    ));
  }, []);

  // Optimization
  const optimize = useCallback(async (): Promise<OptimizationResult | null> => {
    if (activities.length < 2) {
      setError('Need at least 2 activities to optimize');
      return null;
    }

    setIsOptimizing(true);
    setError(null);
    setApprovedChanges(new Set());
    setRejectedChanges(new Set());

    try {
      const result = await routeOptimizationService.optimizeRoute(
        activities,
        date,
        strategy,
        transportPreferences,
        constraints,
        startLocation || undefined,
        endLocation || undefined
      );

      setOriginalRoute(result.originalRoute);
      setOptimizedRoute(result.optimizedRoute);
      setOptimizationResult(result);

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, [activities, date, strategy, transportPreferences, constraints, startLocation, endLocation]);

  // Approval management
  const pendingChanges = useMemo(() => {
    if (!optimizationResult) return [];
    return optimizationResult.changes.filter(c => 
      !approvedChanges.has(c.id) && !rejectedChanges.has(c.id)
    );
  }, [optimizationResult, approvedChanges, rejectedChanges]);

  const approveChange = useCallback((changeId: string) => {
    setApprovedChanges(prev => new Set([...prev, changeId]));
    setRejectedChanges(prev => {
      const next = new Set(prev);
      next.delete(changeId);
      return next;
    });
  }, []);

  const rejectChange = useCallback((changeId: string) => {
    setRejectedChanges(prev => new Set([...prev, changeId]));
    setApprovedChanges(prev => {
      const next = new Set(prev);
      next.delete(changeId);
      return next;
    });
  }, []);

  const approveAll = useCallback(() => {
    if (!optimizationResult) return;
    setApprovedChanges(new Set(optimizationResult.changes.map(c => c.id)));
    setRejectedChanges(new Set());
  }, [optimizationResult]);

  const rejectAll = useCallback(() => {
    if (!optimizationResult) return;
    setRejectedChanges(new Set(optimizationResult.changes.map(c => c.id)));
    setApprovedChanges(new Set());
  }, [optimizationResult]);

  const applyApprovedChanges = useCallback(async (): Promise<Route | null> => {
    if (!optimizationResult || !optimizedRoute) return null;

    // Full approval - use optimized route
    if (approvedChanges.size === optimizationResult.changes.length) {
      setActivitiesState(optimizedRoute.stops.map(s => s.activity));
      return optimizedRoute;
    }

    // Partial - apply only approved changes
    const newOrder = [...activities];
    for (const change of optimizationResult.changes) {
      if (!approvedChanges.has(change.id)) continue;
      if (change.changeType === 'reorder' && change.fromPosition && change.toPosition) {
        const [item] = newOrder.splice(change.fromPosition - 1, 1);
        newOrder.splice(change.toPosition - 1, 0, item);
      }
    }

    setActivitiesState(newOrder);
    
    const newRoute = routeOptimizationService.buildRoute(
      newOrder,
      date,
      constraints.startTime,
      transportPreferences,
      startLocation || undefined,
      endLocation || undefined
    );

    setOriginalRoute(newRoute);
    setOptimizationResult(null);
    return newRoute;
  }, [optimizationResult, optimizedRoute, approvedChanges, activities, date, 
      constraints, transportPreferences, startLocation, endLocation]);

  const approvalStatus = useMemo((): ApprovalStatus => {
    if (!optimizationResult) return 'pending';
    const total = optimizationResult.changes.length;
    if (total === 0) return 'approved';
    if (approvedChanges.size === total) return 'approved';
    if (rejectedChanges.size === total) return 'rejected';
    if (approvedChanges.size > 0 || rejectedChanges.size > 0) return 'partially_approved';
    return 'pending';
  }, [optimizationResult, approvedChanges, rejectedChanges]);

  // Metrics
  const timeSaved = optimizationResult?.timeSaved || 0;
  const distanceSaved = optimizationResult?.distanceSaved || 0;
  const scoreImprovement = optimizationResult 
    ? optimizationResult.score - optimizationResult.originalScore 
    : 0;

  // Utilities
  const calculateTravelTime = useCallback((from: Activity, to: Activity): number => {
    const mode = transportPreferences.preferredModes[0] || 'transit';
    return routeOptimizationService.estimateTravelTime(
      from.location.coordinates,
      to.location.coordinates,
      mode
    );
  }, [transportPreferences]);

  const estimateTotalDuration = useCallback((): number => {
    if (activities.length === 0) return 0;
    let total = activities.reduce((sum, a) => sum + a.duration, 0);
    for (let i = 0; i < activities.length - 1; i++) {
      total += calculateTravelTime(activities[i], activities[i + 1]);
    }
    return total;
  }, [activities, calculateTravelTime]);

  const reset = useCallback(() => {
    setActivitiesState([]);
    setOriginalRoute(null);
    setOptimizedRoute(null);
    setOptimizationResult(null);
    setApprovedChanges(new Set());
    setRejectedChanges(new Set());
    setError(null);
  }, []);

  return {
    // State
    isReady,
    activities,
    originalRoute,
    optimizedRoute,
    optimizationResult,
    
    // Activity management
    setActivities,
    addActivity,
    updateActivity,
    removeActivity,
    reorderActivities,
    lockActivity,
    
    // Optimization
    optimize,
    isOptimizing,
    strategy,
    setStrategy,
    
    // Approval
    pendingChanges,
    approveChange,
    rejectChange,
    approveAll,
    rejectAll,
    applyApprovedChanges,
    approvalStatus,
    
    // Metrics
    timeSaved,
    distanceSaved,
    scoreImprovement,
    
    // Settings
    transportPreferences,
    setTransportPreferences,
    constraints,
    setConstraints,
    startLocation,
    setStartLocation,
    endLocation,
    setEndLocation,
    date,
    setDate,
    
    // Utilities
    calculateTravelTime,
    estimateTotalDuration,
    reset,
    error,
  };
}

export default useRouteOptimizer;
