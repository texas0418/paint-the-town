import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DestinationSuggestion, GeneratedPlan, PlanProgress, PlanStop } from '@/types/planner';
import { generatePlans, savePlan, suggestDestinations } from '@/services/datePlanService';
import {
  Phase,
  PlanMode,
  RESULTS_STORAGE_KEY,
  RESULTS_TTL_MS,
  chipToDate,
  loadingMessages,
} from '@/constants/planFormOptions';
import { PlanFormState } from './usePlanForm';

export const stopKey = (planIndex: number, stopOrder: number) => `${planIndex}:${stopOrder}`;

function toggleKey(prev: Set<string>, key: string): Set<string> {
  const next = new Set(prev);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

/**
 * Generation lifecycle for the plan-a-date screen: phase, destination
 * suggestions, generated plans, remix selection, and saving. Results are
 * persisted for 24h because each generation costs the user quota.
 */
export function usePlanGeneration(
  form: PlanFormState,
  params: { mode?: string; vibe?: string },
  onSaved: (planId: string) => void
) {
  const [phase, setPhase] = useState<Phase>('form');
  const [plans, setPlans] = useState<GeneratedPlan[]>([]);
  const [destinations, setDestinations] = useState<DestinationSuggestion[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<number | null>(0);
  const [expandedStops, setExpandedStops] = useState<Set<string>>(new Set());
  const [remixMode, setRemixMode] = useState(false);
  const [selectedStops, setSelectedStops] = useState<Set<string>>(new Set());
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { setPlanMode, setCity } = form;

  useEffect(() => {
    AsyncStorage.getItem(RESULTS_STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved: { plans?: GeneratedPlan[]; planMode?: PlanMode; savedAt?: number } =
          JSON.parse(raw);
        if (!saved.plans?.length) return;
        if (Date.now() - (saved.savedAt ?? 0) > RESULTS_TTL_MS) {
          AsyncStorage.removeItem(RESULTS_STORAGE_KEY).catch(() => {});
          return;
        }
        // Entering with an explicit different mode (e.g. tapping Vacation on
        // home) or a deep-linked vibe (anniversary nudge) means the user wants
        // a fresh plan — don't hijack them with old results. The stored
        // results stay for later.
        if (params.vibe) return;
        if (params.mode && saved.planMode && saved.planMode !== params.mode) return;
        setPlans(saved.plans);
        if (saved.planMode) setPlanMode(saved.planMode);
        setExpandedPlan(saved.plans.length === 1 ? 0 : null);
        // Don't clobber a generation the user already kicked off.
        setPhase((p) => (p === 'form' ? 'results' : p));
      })
      .catch((e) => console.error('Failed to restore plan results:', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== 'loading') return;
    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => Math.min(i + 1, loadingMessages.length - 1));
    }, 12000);
    return () => clearInterval(interval);
  }, [phase]);

  // Limit/error messages used to render at the bottom of the form, below the
  // fold — surface them as a popup so they're impossible to miss.
  const showGenerationError = (e: unknown) => {
    const message = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
    setError(message);
    setPhase('form');
    const lower = message.toLowerCase();
    const isLimit = lower.includes('limit') || lower.includes('premium');
    Alert.alert(isLimit ? 'Limit reached' : "Couldn't generate plans", message);
  };

  const handleSuggestDestinations = async () => {
    setError(null);
    setSuggesting(true);
    setLoadingMessageIndex(0);
    setPhase('loading');
    try {
      const result = await suggestDestinations({
        mode: 'suggest_destinations',
        city: form.profile.homeCity || 'not specified',
        date: chipToDate(form.dateChip),
        days: form.tripDays,
        budget: form.tripBudget,
        notes: form.notes.trim() || undefined,
        profile: form.profile,
      });
      if (!result.length) throw new Error('No destinations found. Please try again.');
      setDestinations(result);
      setPhase('destinations');
    } catch (e) {
      showGenerationError(e);
    } finally {
      setSuggesting(false);
    }
  };

  const handleGenerate = async (cityOverride?: string) => {
    const targetCity = (cityOverride ?? form.city).trim();
    if (targetCity.length < 2) {
      Alert.alert('Where to?', 'Please enter a city first.');
      return;
    }
    setError(null);
    setLoadingMessageIndex(0);
    setProgress(null);
    setPhase('loading');
    try {
      const result = await generatePlans(
        {
          mode: form.planMode,
          city: targetCity,
          date: chipToDate(form.dateChip),
          days: form.isVacation ? form.tripDays : undefined,
          startTime: form.startTime,
          durationHours: form.duration,
          budget: form.isVacation ? form.tripBudget : form.budget,
          notes: form.notes.trim() || undefined,
          vibes: form.vibes.length ? form.vibes : undefined,
          mustInclude: form.mustInclude.length ? form.mustInclude : undefined,
          profile: form.profile,
        },
        setProgress
      );
      if (!result.length) throw new Error('No plans were generated. Please try again.');
      setPlans(result);
      // Multiple plans start collapsed so the choice reads as clean headers.
      setExpandedPlan(result.length === 1 ? 0 : null);
      setExpandedStops(new Set());
      setRemixMode(false);
      setSelectedStops(new Set());
      setPhase('results');
      AsyncStorage.setItem(
        RESULTS_STORAGE_KEY,
        JSON.stringify({ plans: result, planMode: form.planMode, savedAt: Date.now() })
      ).catch(() => {});
    } catch (e) {
      showGenerationError(e);
    }
  };

  const handleSavePlan = async (plan: GeneratedPlan, index: number) => {
    setSavingIndex(index);
    try {
      const saved = await savePlan(plan);
      onSaved(saved.id);
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSavingIndex(null);
    }
  };

  const customStops: PlanStop[] = useMemo(() => {
    const stops: PlanStop[] = [];
    plans.forEach((plan, pi) => {
      plan.stops.forEach((stop) => {
        if (selectedStops.has(stopKey(pi, stop.order))) stops.push(stop);
      });
    });
    return stops
      .slice()
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((s, i) => ({ ...s, order: i + 1 }));
  }, [plans, selectedStops]);

  const buildCustomPlan = (
    title: string,
    defaultTitle: string,
    saveCity: string
  ): GeneratedPlan => ({
    title: title.trim() || defaultTitle,
    city: saveCity,
    vibe: 'Hand-picked from your favorite stops',
    planDate: chipToDate(form.dateChip) ?? null,
    startTime: customStops[0]?.time ?? form.startTime,
    totalBudget: form.budget,
    estimatedCost: customStops.reduce((sum, s) => sum + (s.estimatedCost || 0), 0),
    source: 'custom',
    stops: customStops,
  });

  const handleSaveCustom = async () => {
    if (customStops.length < 2) {
      Alert.alert('Pick more stops', 'Select at least 2 stops across the plans.');
      return;
    }
    const saveCity = plans[0]?.city ?? form.city;
    const defaultTitle = `Date night in ${saveCity.split(',')[0].trim()}`;

    const saveWithTitle = async (title: string) => {
      setSavingIndex(-1);
      try {
        const saved = await savePlan(buildCustomPlan(title, defaultTitle, saveCity));
        onSaved(saved.id);
      } catch (e) {
        Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
      } finally {
        setSavingIndex(null);
      }
    };

    if (Platform.OS !== 'ios') {
      // Alert.prompt is iOS-only; Android falls through to the smart default
      // (rename is always available on the saved plan afterwards).
      await saveWithTitle(defaultTitle);
      return;
    }
    Alert.prompt(
      'Name your date',
      'What should this plan be called?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: (title?: string) => saveWithTitle(title ?? defaultTitle) },
      ],
      'plain-text',
      defaultTitle
    );
  };

  return {
    phase,
    setPhase,
    plans,
    destinations,
    suggesting,
    expandedPlan,
    setExpandedPlan,
    expandedStops,
    remixMode,
    selectedStops,
    savingIndex,
    loadingMessageIndex,
    progress,
    error,
    customStops,
    handleSuggestDestinations,
    handleGenerate,
    handleSavePlan,
    handleSaveCustom,
    toggleRemix: () => setRemixMode((r) => !r),
    /** In remix mode a tap selects the stop; otherwise it expands it. */
    toggleStop: (key: string) =>
      remixMode
        ? setSelectedStops((prev) => toggleKey(prev, key))
        : setExpandedStops((prev) => toggleKey(prev, key)),
    pickDestination: (destCity: string) => {
      setCity(destCity);
      handleGenerate(destCity);
    },
  };
}
