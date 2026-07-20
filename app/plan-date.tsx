import React, { useEffect, useMemo, useState, ComponentType } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shuffle,
  CalendarDays,
  Plane,
  Dices,
  Compass,
  UtensilsCrossed,
  Martini,
  Ticket,
  Music,
  TreePine,
  Palette,
} from 'lucide-react-native';
import type { LucideProps } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { fonts } from '@/constants/typography';
import {
  TasteProfile,
  emptyTasteProfile,
  GeneratedPlan,
  PlanStop,
  PlanStopCategory,
  DestinationSuggestion,
  PlanProgress,
} from '@/types/planner';
import { getTasteProfile } from '@/services/tasteProfileService';
import { generatePlans, savePlan, suggestDestinations } from '@/services/datePlanService';

type Phase = 'form' | 'loading' | 'results' | 'destinations';

const dateChips = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'saturday', label: 'This Saturday' },
  { id: 'flexible', label: 'Flexible' },
];

const timeChips = [
  { id: '10:00', label: 'Morning' },
  { id: '14:00', label: 'Afternoon' },
  { id: '18:00', label: 'Evening' },
];

const durationChips = [
  { id: 3, label: '~3 hours' },
  { id: 5, label: '~5 hours' },
  { id: 8, label: 'All day' },
];

const dayCountChips = [
  { id: 2, label: '2 days' },
  { id: 3, label: '3 days' },
  { id: 5, label: '5 days' },
  { id: 7, label: '1 week' },
  { id: 10, label: '10 days' },
];

type PlanMode = 'plan_for_me' | 'single' | 'vacation';

export const categoryIcons: Record<PlanStopCategory, ComponentType<LucideProps>> = {
  food: UtensilsCrossed,
  drinks: Martini,
  activity: Ticket,
  entertainment: Music,
  outdoors: TreePine,
  culture: Palette,
  other: MapPin,
};

const loadingMessages = [
  'Reading your taste profile…',
  'Searching real venues near you…',
  'Checking hours and prices…',
  'Balancing the budget…',
  'Putting the schedule together…',
  'Almost there — polishing your plans…',
];

function chipToDate(chip: string): string | undefined {
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

export default function PlanDateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [phase, setPhase] = useState<Phase>('form');
  const [profile, setProfile] = useState<TasteProfile>(emptyTasteProfile);
  const [planMode, setPlanMode] = useState<PlanMode>(
    params.mode === 'single' ? 'single' : params.mode === 'vacation' ? 'vacation' : 'plan_for_me'
  );
  const [city, setCity] = useState('');
  const [dateChip, setDateChip] = useState('saturday');
  const [startTime, setStartTime] = useState('18:00');
  const [duration, setDuration] = useState(5);
  const [tripDays, setTripDays] = useState(3);
  const [budget, setBudget] = useState(150);
  const [tripBudget, setTripBudget] = useState(1000);
  const [notes, setNotes] = useState('');
  const isVacation = planMode === 'vacation';

  const [plans, setPlans] = useState<GeneratedPlan[]>([]);
  const [destinations, setDestinations] = useState<DestinationSuggestion[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<number | null>(0);
  const [remixMode, setRemixMode] = useState(false);
  const [selectedStops, setSelectedStops] = useState<Set<string>>(new Set());
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTasteProfile()
      .then((p) => {
        setProfile(p);
        if (p.homeCity) setCity(p.homeCity);
        if (p.dateBudget) setBudget(p.dateBudget);
      })
      .catch((e) => console.error('Failed to load taste profile:', e));
  }, []);

  useEffect(() => {
    if (phase !== 'loading') return;
    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => Math.min(i + 1, loadingMessages.length - 1));
    }, 12000);
    return () => clearInterval(interval);
  }, [phase]);

  const stopKey = (planIndex: number, stopOrder: number) => `${planIndex}:${stopOrder}`;

  const handleSuggestDestinations = async () => {
    setError(null);
    setSuggesting(true);
    setLoadingMessageIndex(0);
    setPhase('loading');
    try {
      const result = await suggestDestinations({
        mode: 'suggest_destinations',
        city: profile.homeCity || 'not specified',
        date: chipToDate(dateChip),
        days: tripDays,
        budget: tripBudget,
        notes: notes.trim() || undefined,
        profile,
      });
      if (!result.length) throw new Error('No destinations found. Please try again.');
      setDestinations(result);
      setPhase('destinations');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setPhase('form');
    } finally {
      setSuggesting(false);
    }
  };

  const handleGenerate = async (cityOverride?: string) => {
    const targetCity = (cityOverride ?? city).trim();
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
          mode: planMode,
          city: targetCity,
          date: chipToDate(dateChip),
          days: isVacation ? tripDays : undefined,
          startTime,
          durationHours: duration,
          budget: isVacation ? tripBudget : budget,
          notes: notes.trim() || undefined,
          profile,
        },
        setProgress
      );
      if (!result.length) throw new Error('No plans were generated. Please try again.');
      setPlans(result);
      setExpandedPlan(0);
      setRemixMode(false);
      setSelectedStops(new Set());
      setPhase('results');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setPhase('form');
    }
  };

  const handleSavePlan = async (plan: GeneratedPlan, index: number) => {
    setSavingIndex(index);
    try {
      const saved = await savePlan(plan);
      router.replace({ pathname: '/saved-plan', params: { id: saved.id } });
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

  const handleSaveCustom = async () => {
    if (customStops.length < 2) {
      Alert.alert('Pick more stops', 'Select at least 2 stops across the plans.');
      return;
    }
    const estimatedCost = customStops.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
    const custom: GeneratedPlan = {
      title: 'My Custom Date',
      city: plans[0]?.city ?? city,
      vibe: 'Hand-picked from your favorite stops',
      planDate: chipToDate(dateChip) ?? null,
      startTime: customStops[0]?.time ?? startTime,
      totalBudget: budget,
      estimatedCost,
      source: 'custom',
      stops: customStops,
    };
    setSavingIndex(-1);
    try {
      const saved = await savePlan(custom);
      router.replace({ pathname: '/saved-plan', params: { id: saved.id } });
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSavingIndex(null);
    }
  };

  const renderChipRow = <T extends string | number>(
    options: { id: T; label: string }[],
    value: T,
    onSelect: (v: T) => void
  ) => (
    <View style={styles.chipRow}>
      {options.map((o) => {
        const isSelected = value === o.id;
        return (
          <Pressable
            key={String(o.id)}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(o.id)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderForm = () => (
    <ScrollView
      style={styles.formScroll}
      contentContainerStyle={styles.formContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.modeRow}>
        {(
          [
            { id: 'plan_for_me', title: 'Plan it for me', desc: '3 dates to pick from', Icon: Sparkles },
            { id: 'single', title: 'One date', desc: 'Built around your notes', Icon: CalendarDays },
            { id: 'vacation', title: 'Vacation', desc: 'A multi-day trip anywhere', Icon: Plane },
          ] as const
        ).map(({ id, title, desc, Icon }) => {
          const isSelected = planMode === id;
          return (
            <Pressable
              key={id}
              style={[styles.modeCard, isSelected && styles.modeCardSelected]}
              onPress={() => setPlanMode(id)}
            >
              <Icon size={20} color={isSelected ? colors.textLight : colors.primary} />
              <Text style={[styles.modeTitle, isSelected && styles.modeTitleSelected]}>{title}</Text>
              <Text style={[styles.modeDesc, isSelected && styles.modeDescSelected]}>{desc}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>{isVacation ? 'Destination' : 'City'}</Text>
      <View style={styles.inputRow}>
        <MapPin size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder={isVacation ? 'e.g. San Diego, CA or Rome, Italy' : 'e.g. Los Angeles, CA'}
          placeholderTextColor={colors.textTertiary}
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
        />
      </View>
      {isVacation && (
        <Pressable style={styles.suggestButton} onPress={handleSuggestDestinations}>
          <Dices size={16} color={colors.primaryLight} />
          <Text style={styles.suggestButtonText}>
            Don't know where? Let W4nder pick 3 for you
          </Text>
        </Pressable>
      )}

      <Text style={styles.fieldLabel}>{isVacation ? 'Starting' : 'When'}</Text>
      {renderChipRow(dateChips.map((d) => ({ id: d.id, label: d.label })), dateChip, setDateChip)}
      {!isVacation &&
        renderChipRow(timeChips.map((t) => ({ id: t.id, label: t.label })), startTime, setStartTime)}

      <Text style={styles.fieldLabel}>How long</Text>
      {isVacation
        ? renderChipRow(dayCountChips, tripDays, setTripDays)
        : renderChipRow(durationChips, duration, setDuration)}

      <Text style={styles.fieldLabel}>
        {isVacation ? 'Trip budget: ' : 'Budget: '}
        <Text style={styles.budgetText}>
          ${isVacation ? tripBudget : budget}
          {(isVacation ? tripBudget >= 5000 : budget >= 500) ? '+' : ''}
        </Text>
      </Text>
      <Slider
        style={styles.slider}
        minimumValue={isVacation ? 200 : 25}
        maximumValue={isVacation ? 5000 : 500}
        step={isVacation ? 100 : 25}
        value={isVacation ? tripBudget : budget}
        onValueChange={isVacation ? setTripBudget : setBudget}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
      />

      <Text style={styles.fieldLabel}>Anything special? (optional)</Text>
      <TextInput
        style={styles.notesInput}
        placeholder='e.g. "It&apos;s our anniversary" or "somewhere quiet"'
        placeholderTextColor={colors.textTertiary}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Pressable style={styles.generateButton} onPress={() => handleGenerate()}>
        <Sparkles size={20} color={colors.textLight} />
        <Text style={styles.generateButtonText}>
          {planMode === 'plan_for_me'
            ? 'Plan it for me'
            : planMode === 'vacation'
              ? 'Plan my trip'
              : 'Build my date'}
        </Text>
      </Pressable>
    </ScrollView>
  );

  const progressLabel = () => {
    if (!progress || progress.stage === 'starting') return loadingMessages[loadingMessageIndex];
    if (progress.stage === 'scouting') return 'Scouting real venues that match your taste…';
    if (progress.stage === 'building') {
      const unit = isVacation ? 'days' : 'plans';
      if (progress.total && progress.total > 1) {
        return `Building your ${unit} — ${progress.done ?? 0} of ${progress.total} ready`;
      }
      return 'Building your plan…';
    }
    return 'Putting on the finishing touches…';
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingTitle}>
        {suggesting
          ? 'Finding your destination'
          : `Planning your ${isVacation ? 'trip to' : 'date in'} ${city}`}
      </Text>
      <Text style={styles.loadingMessage}>
        {suggesting ? 'Matching places to your taste…' : progressLabel()}
      </Text>
      {!suggesting && progress?.stage === 'building' && !!progress.total && progress.total > 1 && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(((progress.done ?? 0) / progress.total) * 100)}%` },
            ]}
          />
        </View>
      )}
      <Text style={styles.loadingHint}>
        We search real {suggesting ? 'destinations' : 'venues'}, so this can take a minute or two.
      </Text>
    </View>
  );

  const renderDestinations = () => (
    <ScrollView
      style={styles.formScroll}
      contentContainerStyle={styles.formContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.destinationsIntro}>
        Three trips that fit your taste and ${tripBudget} budget. Tap one to plan it.
      </Text>
      {destinations.map((dest, i) => (
        <Pressable
          key={i}
          style={styles.destCard}
          onPress={() => {
            setCity(dest.city);
            handleGenerate(dest.city);
          }}
        >
          <View style={styles.destIcon}>
            <Compass size={20} color={colors.primaryLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.destCity}>
              {dest.city}
              {dest.country && dest.country !== 'USA' && dest.country !== 'United States'
                ? `, ${dest.country}`
                : ''}
            </Text>
            <Text style={styles.destPitch}>{dest.pitch}</Text>
            <Text style={styles.destWhy}>{dest.whyItMatches}</Text>
            <View style={styles.destMeta}>
              <Text style={styles.destMetaText}>{dest.travelNote}</Text>
              <Text style={styles.destMetaText}>~${Math.round(dest.estimatedTripCost)} trip</Text>
            </View>
          </View>
          <ChevronDown
            size={18}
            color={colors.textTertiary}
            style={{ transform: [{ rotate: '-90deg' }] }}
          />
        </Pressable>
      ))}
      <Pressable style={styles.regenerateButton} onPress={() => setPhase('form')}>
        <Text style={styles.regenerateText}>Back — I'll pick myself</Text>
      </Pressable>
    </ScrollView>
  );

  const renderStop = (stop: PlanStop, planIndex: number) => {
    const key = stopKey(planIndex, stop.order);
    const isPicked = selectedStops.has(key);
    const CategoryIcon = categoryIcons[stop.category] ?? MapPin;
    return (
      <Pressable
        key={key}
        style={[styles.stopRow, remixMode && isPicked && styles.stopRowPicked]}
        onPress={() => {
          if (!remixMode) return;
          setSelectedStops((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
          });
        }}
      >
        <View style={styles.stopTimeCol}>
          <Text style={styles.stopTime} maxFontSizeMultiplier={1}>{stop.time}</Text>
          <View style={styles.stopMedallion}>
            <CategoryIcon size={16} color={colors.primaryLight} />
          </View>
          <View style={styles.stopLine} />
        </View>
        <View style={styles.stopBody}>
          <View style={styles.stopHeader}>
            <Text style={styles.stopName}>{stop.name}</Text>
            {remixMode && (
              <View style={[styles.pickCircle, isPicked && styles.pickCircleActive]}>
                {isPicked && <Check size={12} color={colors.textLight} />}
              </View>
            )}
          </View>
          <Text style={styles.stopVenue}>
            {stop.venueName} · {stop.address}
          </Text>
          <Text style={styles.stopDesc}>{stop.description}</Text>
          <Text style={styles.stopWhy}>{stop.whyItMatches}</Text>
          <View style={styles.stopMeta}>
            <View style={styles.stopMetaItem}>
              <DollarSign size={13} color={colors.textSecondary} />
              <Text style={styles.stopMetaText}>~${Math.round(stop.estimatedCost)}</Text>
            </View>
            <View style={styles.stopMetaItem}>
              <Clock size={13} color={colors.textSecondary} />
              <Text style={styles.stopMetaText}>{stop.durationMinutes} min</Text>
            </View>
            {!!stop.url && (
              <Pressable style={styles.stopMetaItem} onPress={() => Linking.openURL(stop.url!)}>
                <ExternalLink size={13} color={colors.primaryLight} />
                <Text style={[styles.stopMetaText, { color: colors.primaryLight }]}>Website</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderResults = () => (
    <>
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={[styles.formContent, remixMode && { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {plans.length > 1 && (
          <Pressable style={styles.remixToggle} onPress={() => setRemixMode(!remixMode)}>
            <Shuffle size={16} color={remixMode ? colors.textLight : colors.primary} />
            <Text style={[styles.remixToggleText, remixMode && { color: colors.textLight }]}>
              {remixMode ? 'Picking stops — tap stops you like' : 'Mix & match stops from each plan'}
            </Text>
          </Pressable>
        )}

        {plans.map((plan, index) => {
          const isExpanded = expandedPlan === index || plans.length === 1 || remixMode;
          return (
            <View key={index} style={styles.planCard}>
              <Pressable
                style={styles.planHeader}
                onPress={() => setExpandedPlan(isExpanded && !remixMode ? null : index)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planVibe}>{plan.vibe}</Text>
                  <View style={styles.planMeta}>
                    <Text style={styles.planMetaText}>
                      {plan.stops.length} stops · starts {plan.startTime} · ~$
                      {Math.round(plan.estimatedCost ?? 0)}
                    </Text>
                  </View>
                </View>
                {plans.length > 1 && !remixMode &&
                  (isExpanded ? (
                    <ChevronUp size={20} color={colors.textSecondary} />
                  ) : (
                    <ChevronDown size={20} color={colors.textSecondary} />
                  ))}
              </Pressable>

              {isExpanded && (
                <View style={styles.stopsContainer}>
                  {plan.stops.map((stop, si) => {
                    const showDayHeader =
                      stop.day != null && (si === 0 || plan.stops[si - 1].day !== stop.day);
                    return (
                      <React.Fragment key={`${index}:${stop.order}`}>
                        {showDayHeader && (
                          <Text style={styles.dayHeader}>Day {stop.day}</Text>
                        )}
                        {renderStop(stop, index)}
                      </React.Fragment>
                    );
                  })}
                  {!remixMode && (
                    <Pressable
                      style={[styles.saveButton, savingIndex === index && styles.saveButtonDisabled]}
                      onPress={() => handleSavePlan(plan, index)}
                      disabled={savingIndex !== null}
                    >
                      {savingIndex === index ? (
                        <ActivityIndicator color={colors.textLight} />
                      ) : (
                        <>
                          <Check size={18} color={colors.textLight} />
                          <Text style={styles.saveButtonText}>Save this plan</Text>
                        </>
                      )}
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <Pressable style={styles.regenerateButton} onPress={() => setPhase('form')}>
          <Text style={styles.regenerateText}>Change details & regenerate</Text>
        </Pressable>
      </ScrollView>

      {remixMode && (
        <View style={styles.remixBar}>
          <Text style={styles.remixBarText}>
            {customStops.length} stops · ~$
            {Math.round(customStops.reduce((s, x) => s + (x.estimatedCost || 0), 0))}
          </Text>
          <Pressable
            style={[styles.remixSaveButton, savingIndex === -1 && styles.saveButtonDisabled]}
            onPress={handleSaveCustom}
            disabled={savingIndex !== null}
          >
            {savingIndex === -1 ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Text style={styles.saveButtonText}>Create my plan</Text>
            )}
          </Pressable>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.gradient.primary} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color={colors.textLight} />
            </Pressable>
            <Text style={styles.headerTitle}>
              {phase === 'results'
                ? isVacation
                  ? 'Your trip'
                  : 'Your date plans'
                : phase === 'destinations'
                  ? 'Pick a destination'
                  : isVacation
                    ? 'Plan a trip'
                    : 'Plan a date'}
            </Text>
            <View style={styles.backBtn} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {phase === 'form' && renderForm()}
      {phase === 'loading' && renderLoading()}
      {phase === 'destinations' && renderDestinations()}
      {phase === 'results' && renderResults()}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.display,
    color: colors.textLight,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  modeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 5,
  },
  modeCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  modeTitleSelected: {
    color: colors.textLight,
  },
  modeDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  dayHeader: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.primaryLight,
    marginTop: 10,
    marginBottom: 6,
  },
  suggestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 6,
  },
  suggestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  destinationsIntro: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 21,
  },
  destCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  destIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destCity: {
    fontSize: 17,
    fontFamily: fonts.display,
    color: colors.text,
  },
  destPitch: {
    fontSize: 14,
    color: colors.text,
    marginTop: 4,
    lineHeight: 19,
  },
  destWhy: {
    fontSize: 13,
    color: colors.accentDark,
    fontStyle: 'italic',
    marginTop: 4,
  },
  destMeta: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
  },
  destMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeDescSelected: {
    color: colors.accent,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
    marginTop: 8,
  },
  budgetText: {
    color: colors.primary,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.textLight,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: colors.textLight,
    fontSize: 17,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  loadingTitle: {
    fontSize: 20,
    fontFamily: fonts.display,
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  loadingMessage: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingHint: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  progressTrack: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  remixToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  remixToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  planTitle: {
    fontSize: 19,
    fontFamily: fonts.display,
    color: colors.text,
  },
  planVibe: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  planMeta: {
    marginTop: 8,
  },
  planMetaText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  stopsContainer: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  stopRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  stopRowPicked: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  stopTimeCol: {
    alignItems: 'center',
    width: 56,
  },
  stopTime: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryLight,
    marginBottom: 6,
    fontVariant: ['tabular-nums'],
  },
  stopMedallion: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.borderLight,
    marginTop: 6,
    borderRadius: 1,
  },
  stopBody: {
    flex: 1,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  pickCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stopVenue: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  stopDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  stopWhy: {
    fontSize: 12,
    color: colors.accentDark,
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  stopMeta: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
  },
  stopMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stopMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  regenerateButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  regenerateText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  remixBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
  },
  remixBarText: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: '600',
  },
  remixSaveButton: {
    backgroundColor: colors.secondary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
});
