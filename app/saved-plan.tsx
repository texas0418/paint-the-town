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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
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
  ThumbsUp,
  ThumbsDown,
  Share2,
  CalendarPlus,
} from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { fonts } from '@/constants/typography';
import { DatePlan, PlanStop } from '@/types/planner';
import {
  getPlan,
  updatePlanStatus,
  deletePlan,
  updatePlanStops,
  replaceStop,
} from '@/services/datePlanService';
import { getTasteProfile } from '@/services/tasteProfileService';
import { categoryIcons } from '@/app/plan-date';
import { MapPin as MapPinIcon } from 'lucide-react-native';

function directionsUrl(stop: PlanStop): string {
  const query = encodeURIComponent(`${stop.venueName}, ${stop.address}`);
  return Platform.OS === 'ios'
    ? `http://maps.apple.com/?q=${query}`
    : `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function formatPlanForShare(plan: DatePlan): string {
  const lines: string[] = [`${plan.title} — planned with W4nder 🥂`, plan.city];
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

export default function SavedPlanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [plan, setPlan] = useState<DatePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [swappingOrder, setSwappingOrder] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getPlan(id)
        .then(setPlan)
        .catch((e) => console.error('Failed to load plan:', e))
        .finally(() => setLoading(false));
    }, [id])
  );

  const setStatus = async (status: DatePlan['status']) => {
    if (!plan) return;
    try {
      await updatePlanStatus(plan.id, status);
      setPlan({ ...plan, status });
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Please try again.');
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
      'W4nder will find a different real venue for this slot that still fits your taste.',
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
          notes: `${stop.description}\n\nPlanned with W4nder — ${plan.title}`,
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
      <LinearGradient colors={[colors.secondary, colors.secondaryLight]} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color={colors.textLight} />
            </Pressable>
            <Text style={styles.headerTitle}>{plan ? plan.title : 'Date plan'}</Text>
            <Pressable onPress={handleDelete} style={styles.backBtn}>
              <Trash2 size={20} color={colors.textLight} />
            </Pressable>
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

          {plan.stops.map((stop, si) => {
            const CategoryIcon = categoryIcons[stop.category] ?? MapPinIcon;
            const showDayHeader =
              stop.day != null && (si === 0 || plan.stops[si - 1].day !== stop.day);
            return (
            <View key={stop.order}>
            {showDayHeader && <Text style={styles.dayHeader}>Day {stop.day}</Text>}
            <View style={styles.stopRow}>
              <View style={styles.stopTimeCol}>
                <Text style={styles.stopTime}>{stop.time}</Text>
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
                <View style={styles.stopActions}>
                  <Pressable
                    style={styles.stopActionBtn}
                    onPress={() => Linking.openURL(directionsUrl(stop))}
                  >
                    <Navigation size={14} color={colors.primaryLight} />
                    <Text style={styles.stopActionText}>Directions</Text>
                  </Pressable>
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
                </View>
              </View>
            </View>
            </View>
            );
          })}

          <View style={styles.actions}>
            {plan.status === 'saved' && (
              <Pressable style={styles.primaryAction} onPress={() => setStatus('scheduled')}>
                <CalendarCheck size={18} color={colors.textLight} />
                <Text style={styles.primaryActionText}>Mark as scheduled</Text>
              </Pressable>
            )}
            {plan.status === 'scheduled' && (
              <Pressable style={styles.primaryAction} onPress={() => setStatus('completed')}>
                <CheckCircle2 size={18} color={colors.textLight} />
                <Text style={styles.primaryActionText}>We did it! Mark completed</Text>
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
          </View>
        </ScrollView>
      )}
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
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.primaryLight,
    marginTop: 10,
    marginBottom: 4,
  },
  stopTimeCol: {
    alignItems: 'center',
    width: 48,
  },
  stopTime: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryLight,
    marginBottom: 6,
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  stopVenue: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stopDesc: {
    fontSize: 14,
    color: colors.text,
    marginTop: 6,
    lineHeight: 19,
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
    gap: 10,
    marginTop: 10,
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
