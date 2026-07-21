/* eslint-disable max-lines -- tracked in #1 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
  Platform,
} from 'react-native';
import * as Calendar from 'expo-calendar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { buildReservationUrl, isReservable } from '@/utils/reservations';
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  DollarSign,
  Clock,
  ExternalLink,
  Trash2,
  CheckCircle2,
  CalendarCheck,
  Navigation,
  RefreshCw,
  CalendarClock,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Gift,
  CalendarPlus,
  BookHeart,
  HeartHandshake,
  Pencil,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Minus,
  Plus,
} from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { DatePlan, PlanStop } from '@/types/planner';
import {
  getPlan,
  updatePlanStatus,
  updatePlanTitle,
  deletePlan,
  updatePlanStops,
  updatePlanSharing,
  replaceStop,
} from '@/services/datePlanService';
import { PartnerState, getPartnerState } from '@/services/partnerService';
import { getTasteProfile } from '@/services/tasteProfileService';
import { JournalEntry, getEntryForPlan } from '@/services/dateJournalService';
import { buildShareUrl, getSurpriseShareToken } from '@/services/planShareService';
import { categoryIcons } from '@/app/plan-date';
import { MapPin as MapPinIcon } from 'lucide-react-native';

function directionsUrl(stop: PlanStop): string {
  const query = encodeURIComponent(`${stop.venueName}, ${stop.address}`);
  return Platform.OS === 'ios'
    ? `http://maps.apple.com/?q=${query}`
    : `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function formatPlanForShare(plan: DatePlan): string {
  const lines: string[] = [`${plan.title} — planned with Paint the Town`, plan.city];
  if (plan.planDate) lines.push(plan.planDate);
  lines.push('');
  let lastDay: number | undefined;
  for (const stop of plan.stops) {
    if (stop.day != null && stop.day !== lastDay) {
      lines.push(`— Day ${stop.day} —`);
      lastDay = stop.day;
    }
    lines.push(`${stop.time}  ${stop.name} @ ${stop.venueName}`);
    if (stop.address) lines.push(`        ${stop.address}`);
  }
  if (plan.estimatedCost) lines.push('', `Estimated total: ~$${Math.round(plan.estimatedCost)}`);
  return lines.join('\n');
}

const statusLabels: Record<DatePlan['status'], string> = {
  saved: 'Saved',
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function SavedPlanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [plan, setPlan] = useState<DatePlan | null>(null);
  const [journalEntry, setJournalEntry] = useState<JournalEntry | null>(null);
  const [partner, setPartner] = useState<PartnerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [swappingOrder, setSwappingOrder] = useState<number | null>(null);
  const [sharingBusy, setSharingBusy] = useState(false);
  // Edit mode: reorder stops and adjust times/durations, saved as one batch.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PlanStop[]>([]);
  const [timePickerFor, setTimePickerFor] = useState<number | null>(null);
  const [savingEdits, setSavingEdits] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getPlan(id)
        .then(setPlan)
        .catch((e) => console.error('Failed to load plan:', e))
        .finally(() => setLoading(false));
      getEntryForPlan(id)
        .then(setJournalEntry)
        .catch(() => {});
      getPartnerState()
        .then(setPartner)
        .catch(() => {});
    }, [id])
  );

  // RLS only ever serves my plans or my partner's shared ones, so ownership
  // reduces to "is this the linked partner's plan".
  const isPartnersPlan =
    !!plan && partner?.status === 'linked' && plan.ownerId === partner.partnerId;
  const partnerLinked = partner?.status === 'linked';

  const handleToggleSharing = async () => {
    if (!plan || sharingBusy) return;
    setSharingBusy(true);
    try {
      await updatePlanSharing(plan.id, !plan.sharedWithPartner);
      setPlan({ ...plan, sharedWithPartner: !plan.sharedWithPartner });
    } catch (e) {
      Alert.alert('Could not update sharing', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSharingBusy(false);
    }
  };

  const setStatus = async (status: DatePlan['status']): Promise<boolean> => {
    if (!plan) return false;
    try {
      await updatePlanStatus(plan.id, status);
      setPlan({ ...plan, status });
      return true;
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Please try again.');
      return false;
    }
  };

  const handleShare = async () => {
    if (!plan) return;
    try {
      await Share.share({ message: formatPlanForShare(plan) });
    } catch {
      // user dismissed the sheet — nothing to do
    }
  };

  const startEditing = () => {
    if (!plan) return;
    // Clean any overlaps the plan already carries so editing starts from a
    // valid, strictly-sequential timeline.
    setDraft(resolveOverlaps(plan.stops.map((s) => ({ ...s }))));
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setTimePickerFor(null);
  };

  const saveEditing = async () => {
    if (!plan) return;
    setSavingEdits(true);
    try {
      const renumbered = draft.map((s, i) => ({ ...s, order: i + 1 }));
      await updatePlanStops(plan.id, renumbered);
      setPlan({
        ...plan,
        stops: renumbered,
        estimatedCost: renumbered.reduce((sum, s) => sum + (s.estimatedCost || 0), 0),
      });
      setEditing(false);
      setTimePickerFor(null);
    } catch (e) {
      Alert.alert('Could not save changes', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSavingEdits(false);
    }
  };

  const minutesOf = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const hhmm = (min: number): string => {
    const w = ((min % 1440) + 1440) % 1440; // wrap so past-midnight shows a valid HH:MM
    return `${String(Math.floor(w / 60)).padStart(2, '0')}:${String(w % 60).padStart(2, '0')}`;
  };
  const shiftTime = (time: string, deltaMin: number): string => hhmm(minutesOf(time) + deltaMin);

  // Non-overlap invariant: no stop may start before the previous one ends.
  // A forward pass pushes any offending start down to the previous stop's end,
  // never pulls one earlier — so the first stop anchors the schedule.
  const resolveOverlaps = (stops: PlanStop[]): PlanStop[] => {
    const out = stops.map((s) => ({ ...s }));
    for (let k = 1; k < out.length; k++) {
      const prevEnd = minutesOf(out[k - 1].time) + (out[k - 1].durationMinutes || 60);
      if (minutesOf(out[k].time) < prevEnd) out[k].time = hhmm(prevEnd);
    }
    return out;
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.length) return;
    const next = draft.slice();
    [next[index], next[target]] = [next[target], next[index]];
    // Reordering keeps each stop's own time; reflow so the new order reads
    // top-to-bottom in time with no overlaps.
    setDraft(resolveOverlaps(next));
  };

  const timeToDate = (time: string): Date => {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h || 19, m || 0, 0, 0);
    return d;
  };

  const setStopTime = (index: number, picked: Date) => {
    const newTime = `${String(picked.getHours()).padStart(2, '0')}:${String(picked.getMinutes()).padStart(2, '0')}`;
    // Moving a stop drags everything after it by the same delta (gaps preserved),
    // then resolveOverlaps clamps if the new time collides with the stop above.
    const delta = minutesOf(newTime) - minutesOf(draft[index].time);
    const next = draft.map((s, i) =>
      i < index ? s : i === index ? { ...s, time: newTime } : { ...s, time: shiftTime(s.time, delta) }
    );
    setDraft(resolveOverlaps(next));
  };

  const nudgeDuration = (index: number, delta: number) => {
    const current = draft[index].durationMinutes || 60;
    const newDuration = Math.max(15, current + delta);
    const applied = newDuration - current; // 0 when clamped at the 15-min floor
    // Stretching a stop pushes everything after it later by the same amount.
    const next = draft.map((s, i) =>
      i < index
        ? s
        : i === index
          ? { ...s, durationMinutes: newDuration }
          : { ...s, time: shiftTime(s.time, applied) }
    );
    setDraft(resolveOverlaps(next));
  };

  // Tap the header title to rename (own plans, iOS prompt).
  const handleRename = () => {
    if (!plan || isPartnersPlan || Platform.OS !== 'ios') return;
    Alert.prompt(
      'Rename this date',
      undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rename',
          onPress: async (title?: string) => {
            const trimmed = (title ?? '').trim();
            if (!trimmed || trimmed === plan.title) return;
            try {
              await updatePlanTitle(plan.id, trimmed);
              setPlan({ ...plan, title: trimmed });
            } catch (e) {
              Alert.alert('Rename failed', e instanceof Error ? e.message : 'Please try again.');
            }
          },
        },
      ],
      'plain-text',
      plan.title
    );
  };

  // Surprise mode: the partner learns when to be ready and nothing else.
  const handleSurpriseShare = async () => {
    if (!plan) return;
    const when = plan.planDate
      ? new Date(`${plan.planDate}T12:00:00`).toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      : 'Soon';
    const time = plan.startTime ? plan.startTime.slice(0, 5) : 'evening';
    const stops = plan.stops.length;
    // Receive-the-date link: a spoiler-free card page the recipient can open
    // without the app. Falls back to the plain site if minting a token fails.
    const url = await getSurpriseShareToken(plan.id)
      .then(buildShareUrl)
      .catch(() => 'https://texas0418.github.io/paint-the-town/');
    try {
      await Share.share({
        message: [
          `${when}. Be ready at ${time}.`,
          `${stops} stops. All planned. That's all you get to know.`,
          `See your date card → ${url}`,
        ].join('\n'),
      });
    } catch {
      // user dismissed the sheet — nothing to do
    }
  };

  const handleFeedback = async (stop: PlanStop, verdict: 'up' | 'down') => {
    if (!plan) return;
    const stops = plan.stops.map((s) =>
      s.order === stop.order
        ? { ...s, feedback: s.feedback === verdict ? undefined : verdict }
        : s
    );
    setPlan({ ...plan, stops });
    try {
      await updatePlanStops(plan.id, stops);
    } catch (e) {
      Alert.alert('Could not save feedback', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const handleSwap = (stop: PlanStop) => {
    if (!plan) return;
    Alert.alert(
      `Swap ${stop.venueName}?`,
      'Paint the Town will find a different real venue for this slot that still fits your taste.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Find something else',
          onPress: async () => {
            setSwappingOrder(stop.order);
            try {
              const profile = await getTasteProfile();
              const replacement = await replaceStop({
                city: plan.city,
                date: plan.planDate,
                budget: plan.totalBudget,
                profile,
                stop,
                planVenues: plan.stops
                  .filter((s) => s.order !== stop.order)
                  .map((s) => s.venueName),
              });
              const stops = plan.stops.map((s) => (s.order === stop.order ? replacement : s));
              await updatePlanStops(plan.id, stops);
              setPlan({
                ...plan,
                stops,
                estimatedCost: stops.reduce((sum, s) => sum + (s.estimatedCost || 0), 0),
              });
            } catch (e) {
              Alert.alert('Swap failed', e instanceof Error ? e.message : 'Please try again.');
            } finally {
              setSwappingOrder(null);
            }
          },
        },
      ]
    );
  };

  const handleAddToCalendar = async () => {
    if (!plan?.planDate) {
      Alert.alert('No date set', 'This plan has a flexible date, so there is nothing to schedule.');
      return;
    }
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Calendar access needed', 'Allow calendar access in Settings to add plans.');
        return;
      }
      const defaultCalendar =
        Platform.OS === 'ios'
          ? await Calendar.getDefaultCalendarAsync()
          : (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).find(
              (c) => c.allowsModifications
            );
      if (!defaultCalendar) {
        Alert.alert('No calendar found', 'Could not find a writable calendar on this device.');
        return;
      }
      for (const stop of plan.stops) {
        const [h, m] = stop.time.split(':').map(Number);
        const start = new Date(`${plan.planDate}T12:00:00`);
        start.setDate(start.getDate() + ((stop.day ?? 1) - 1));
        start.setHours(h || 12, m || 0, 0, 0);
        const end = new Date(start.getTime() + (stop.durationMinutes || 90) * 60000);
        await Calendar.createEventAsync(defaultCalendar.id, {
          title: stop.name,
          startDate: start,
          endDate: end,
          location: `${stop.venueName}, ${stop.address}`,
          notes: `${stop.description}\n\nPlanned with Paint the Town — ${plan.title}`,
        });
      }
      Alert.alert('Added to calendar', `${plan.stops.length} events created.`);
    } catch (e) {
      Alert.alert('Calendar error', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const handleDelete = () => {
    if (!plan) return;
    Alert.alert('Delete this plan?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlan(plan.id);
            router.back();
          } catch (e) {
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.gradient.primary} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color={colors.textLight} />
            </Pressable>
            <Pressable style={{ flex: 1 }} onPress={handleRename}>
              <Text style={styles.headerTitle}>{plan ? plan.title : 'Date plan'}</Text>
            </Pressable>
            {isPartnersPlan ? (
              <View style={styles.backBtn} />
            ) : editing ? (
              <Pressable onPress={cancelEditing} style={styles.backBtn}>
                <X size={20} color={colors.textLight} />
              </Pressable>
            ) : (
              <Pressable onPress={handleDelete} style={styles.backBtn}>
                <Trash2 size={20} color={colors.textLight} />
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !plan ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Plan not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            {!!plan.vibe && <Text style={styles.vibe}>{plan.vibe}</Text>}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <MapPin size={15} color={colors.primary} />
                <Text style={styles.summaryText}>{plan.city}</Text>
              </View>
              <View style={styles.summaryItem}>
                <CalendarDays size={15} color={colors.primary} />
                <Text style={styles.summaryText}>{plan.planDate ?? 'Flexible'}</Text>
              </View>
              <View style={styles.summaryItem}>
                <DollarSign size={15} color={colors.primary} />
                <Text style={styles.summaryText}>~${Math.round(plan.estimatedCost ?? 0)}</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{statusLabels[plan.status]}</Text>
            </View>
          </View>

          {/* eslint-disable-next-line complexity -- tracked in #1 */}
          {(editing ? draft : plan.stops).map((stop, si) => {
            const stopsList = editing ? draft : plan.stops;
            const CategoryIcon = categoryIcons[stop.category] ?? MapPinIcon;
            const showDayHeader =
              stop.day != null && (si === 0 || stopsList[si - 1].day !== stop.day);
            return (
            <View key={stop.order}>
            {showDayHeader && <Text style={styles.dayHeader}>Day {stop.day}</Text>}
            <View style={styles.stopRow}>
              <View style={styles.stopTimeCol}>
                {/* Tapping a time is a second door into edit mode, opened
                    right at this stop's picker. */}
                <Pressable
                  disabled={editing || isPartnersPlan}
                  onPress={() => {
                    startEditing();
                    setTimePickerFor(stop.order);
                  }}
                >
                  <Text
                    style={[styles.stopTime, !editing && !isPartnersPlan && styles.stopTimeTappable]}
                    maxFontSizeMultiplier={1}
                  >
                    {stop.time.slice(0, 5)}
                  </Text>
                </Pressable>
                <View style={styles.stopMedallion}>
                  <CategoryIcon size={16} color={colors.primaryLight} />
                </View>
                <View style={styles.stopLine} />
              </View>
              <View style={styles.stopBody}>
                <Text style={styles.stopName}>{stop.name}</Text>
                <Text style={styles.stopVenue}>
                  {stop.venueName} · {stop.address}
                </Text>
                <Text style={styles.stopDesc}>{stop.description}</Text>
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
                    <Pressable
                      style={styles.stopMetaItem}
                      onPress={() => Linking.openURL(stop.url!)}
                    >
                      <ExternalLink size={13} color={colors.primaryLight} />
                      <Text style={[styles.stopMetaText, { color: colors.primaryLight }]}>
                        Website
                      </Text>
                    </Pressable>
                  )}
                </View>
                {editing ? (
                  <View style={styles.editControls}>
                    <View style={styles.editGroup}>
                      <Pressable
                        style={[styles.editBtn, si === 0 && styles.editBtnDisabled]}
                        onPress={() => moveStop(si, -1)}
                        disabled={si === 0}
                      >
                        <ChevronUp size={16} color={colors.primaryLight} />
                      </Pressable>
                      <Pressable
                        style={[
                          styles.editBtn,
                          si === (editing ? draft : plan.stops).length - 1 &&
                            styles.editBtnDisabled,
                        ]}
                        onPress={() => moveStop(si, 1)}
                        disabled={si === (editing ? draft : plan.stops).length - 1}
                      >
                        <ChevronDown size={16} color={colors.primaryLight} />
                      </Pressable>
                    </View>
                    <Pressable
                      style={styles.editBtnWide}
                      onPress={() =>
                        setTimePickerFor(timePickerFor === stop.order ? null : stop.order)
                      }
                    >
                      <Clock size={14} color={colors.primaryLight} />
                      <Text style={styles.editBtnText}>{stop.time.slice(0, 5)}</Text>
                    </Pressable>
                    <View style={styles.editGroup}>
                      <Pressable style={styles.editBtn} onPress={() => nudgeDuration(si, -15)}>
                        <Minus size={14} color={colors.primaryLight} />
                      </Pressable>
                      <Text style={styles.editBtnText}>{stop.durationMinutes} min</Text>
                      <Pressable style={styles.editBtn} onPress={() => nudgeDuration(si, 15)}>
                        <Plus size={14} color={colors.primaryLight} />
                      </Pressable>
                    </View>
                  </View>
                ) : null}
                {editing && timePickerFor === stop.order && (
                  <DateTimePicker
                    value={timeToDate(stop.time)}
                    mode="time"
                    minuteInterval={5}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, picked) => picked && setStopTime(si, picked)}
                  />
                )}
                {!editing && (
                <View style={styles.stopActions}>
                  {isReservable(stop) && (
                    <Pressable
                      style={[styles.stopActionBtn, styles.reserveBtn]}
                      onPress={() =>
                        Linking.openURL(buildReservationUrl(stop, plan.planDate, plan.city))
                      }
                    >
                      <CalendarClock size={14} color={colors.textLight} />
                      <Text style={[styles.stopActionText, styles.reserveText]}>Reserve</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.stopActionBtn}
                    onPress={() => Linking.openURL(directionsUrl(stop))}
                  >
                    <Navigation size={14} color={colors.primaryLight} />
                    <Text style={styles.stopActionText}>Directions</Text>
                  </Pressable>
                  {!isPartnersPlan && (
                  <Pressable
                    style={styles.stopActionBtn}
                    onPress={() => handleSwap(stop)}
                    disabled={swappingOrder !== null}
                  >
                    {swappingOrder === stop.order ? (
                      <ActivityIndicator size="small" color={colors.primaryLight} />
                    ) : (
                      <RefreshCw size={14} color={colors.primaryLight} />
                    )}
                    <Text style={styles.stopActionText}>
                      {swappingOrder === stop.order ? 'Swapping…' : 'Swap'}
                    </Text>
                  </Pressable>
                  )}
                  {!isPartnersPlan && (
                  <View style={styles.feedbackGroup}>
                    <Pressable
                      style={[
                        styles.feedbackBtn,
                        stop.feedback === 'up' && styles.feedbackBtnLoved,
                      ]}
                      onPress={() => handleFeedback(stop, 'up')}
                    >
                      <ThumbsUp
                        size={14}
                        color={stop.feedback === 'up' ? colors.textLight : colors.textTertiary}
                      />
                    </Pressable>
                    <Pressable
                      style={[
                        styles.feedbackBtn,
                        stop.feedback === 'down' && styles.feedbackBtnDisliked,
                      ]}
                      onPress={() => handleFeedback(stop, 'down')}
                    >
                      <ThumbsDown
                        size={14}
                        color={stop.feedback === 'down' ? colors.textLight : colors.textTertiary}
                      />
                    </Pressable>
                  </View>
                  )}
                </View>
                )}
              </View>
            </View>
            </View>
            );
          })}

          {editing ? (
            <View style={styles.actions}>
              <Pressable
                style={[styles.primaryAction, savingEdits && { opacity: 0.6 }]}
                onPress={saveEditing}
                disabled={savingEdits}
              >
                {savingEdits ? (
                  <ActivityIndicator size="small" color={colors.textLight} />
                ) : (
                  <Check size={18} color={colors.textLight} />
                )}
                <Text style={styles.primaryActionText}>Save changes</Text>
              </Pressable>
              <Pressable style={styles.secondaryAction} onPress={cancelEditing}>
                <Text style={styles.secondaryActionText}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
          <View style={styles.actions}>
            {isPartnersPlan && (
              <View style={styles.partnerNote}>
                <HeartHandshake size={16} color={colors.secondary} />
                <Text style={styles.partnerNoteText}>
                  Planned by {partner?.status === 'linked' ? partner.partnerName : 'your partner'}
                </Text>
              </View>
            )}
            {!isPartnersPlan && plan.status === 'saved' && (
              <Pressable style={styles.primaryAction} onPress={() => setStatus('scheduled')}>
                <CalendarCheck size={18} color={colors.textLight} />
                <Text style={styles.primaryActionText}>Mark as scheduled</Text>
              </Pressable>
            )}
            {!isPartnersPlan && plan.status === 'scheduled' && (
              <Pressable
                style={styles.primaryAction}
                onPress={async () => {
                  // Straight into the journal while the night is still fresh.
                  if (await setStatus('completed')) {
                    router.push(`/rate-date?planId=${plan.id}` as never);
                  }
                }}
              >
                <CheckCircle2 size={18} color={colors.textLight} />
                <Text style={styles.primaryActionText}>We did it! Mark completed</Text>
              </Pressable>
            )}
            {!isPartnersPlan && plan.status === 'completed' && (
              <Pressable
                style={styles.journalAction}
                onPress={() => router.push(`/rate-date?planId=${plan.id}` as never)}
              >
                <BookHeart size={17} color={colors.primaryLight} />
                <Text style={styles.journalActionText}>
                  {journalEntry
                    ? `In your journal · ${'♥'.repeat(journalEntry.rating)} — edit`
                    : 'How was it? Add it to your date journal'}
                </Text>
              </Pressable>
            )}
            {!isPartnersPlan && (
              <Pressable style={styles.journalAction} onPress={startEditing}>
                <Pencil size={16} color={colors.primaryLight} />
                <Text style={styles.journalActionText}>
                  Edit times & order — or just tap any stop&apos;s time
                </Text>
              </Pressable>
            )}
            <View style={styles.secondaryRow}>
              <Pressable style={styles.secondaryAction} onPress={handleAddToCalendar}>
                <CalendarPlus size={17} color={colors.primaryLight} />
                <Text style={styles.secondaryActionText}>Add to calendar</Text>
              </Pressable>
              <Pressable style={styles.secondaryAction} onPress={handleShare}>
                <Share2 size={17} color={colors.primaryLight} />
                <Text style={styles.secondaryActionText}>Share plan</Text>
              </Pressable>
            </View>
            {!isPartnersPlan && partnerLinked && (
              <Pressable
                style={styles.journalAction}
                onPress={handleToggleSharing}
                disabled={sharingBusy}
              >
                {sharingBusy ? (
                  <ActivityIndicator size="small" color={colors.primaryLight} />
                ) : (
                  <HeartHandshake
                    size={17}
                    color={plan.sharedWithPartner ? colors.secondary : colors.primaryLight}
                  />
                )}
                <Text
                  style={[
                    styles.journalActionText,
                    plan.sharedWithPartner && { color: colors.secondary },
                  ]}
                >
                  {plan.sharedWithPartner
                    ? `Shared with ${partner?.status === 'linked' ? partner.partnerName : 'partner'} — tap to unshare`
                    : 'Show this plan to your partner'}
                </Text>
              </Pressable>
            )}
            {!isPartnersPlan && (
              <Pressable style={styles.surpriseAction} onPress={handleSurpriseShare}>
                <Gift size={16} color={colors.secondary} />
                <Text style={styles.surpriseActionText}>
                  Share as a surprise — no spoilers, just when to be ready
                </Text>
              </Pressable>
            )}
          </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// eslint-disable-next-line max-lines-per-function -- tracked in #1
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
    fontWeight: '700',
    color: colors.textLight,
    flex: 1,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  vibe: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  stopRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
  },
  dayHeader: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.primaryLight,
    marginTop: 10,
    marginBottom: 4,
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
  stopTimeTappable: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
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
  stopName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
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
  actions: {
    marginTop: 20,
    gap: 12,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  journalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 13,
  },
  partnerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 4,
  },
  partnerNoteText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  journalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  surpriseAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    marginTop: 2,
  },
  surpriseActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 13,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  stopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  headerBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  editGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnDisabled: {
    opacity: 0.3,
  },
  editBtnWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryLight,
    fontVariant: ['tabular-nums'],
  },
  stopActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  stopActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  reserveBtn: {
    backgroundColor: colors.secondary,
  },
  reserveText: {
    color: colors.textLight,
    fontWeight: '700',
  },
  feedbackGroup: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 'auto',
  },
  feedbackBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackBtnLoved: {
    backgroundColor: colors.success,
  },
  feedbackBtnDisliked: {
    backgroundColor: colors.error,
  },
});
