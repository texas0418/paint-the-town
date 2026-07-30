import { useState } from 'react';
import { Alert, Platform, Share } from 'react-native';
import * as Calendar from 'expo-calendar';
import { DatePlan, PlanStop } from '@/types/planner';
import {
  deletePlan,
  replaceStop,
  updatePlanSharing,
  updatePlanStatus,
  updatePlanStops,
  updatePlanTitle,
} from '@/services/datePlanService';
import { getTasteProfile } from '@/services/tasteProfileService';
import { buildShareUrl, getSurpriseShareToken } from '@/services/planShareService';

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

async function createCalendarEvents(plan: DatePlan): Promise<void> {
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
}

/**
 * Every action a saved plan supports outside edit mode: status changes, venue
 * swap, thumbs feedback, sharing (plain + surprise + partner), calendar export,
 * rename, delete. The screen wires these to UI; navigation stays in the screen.
 */
export function useSavedPlanActions(
  plan: DatePlan | null,
  setPlan: (plan: DatePlan) => void,
  onDeleted: () => void
) {
  const [swappingOrder, setSwappingOrder] = useState<number | null>(null);
  const [sharingBusy, setSharingBusy] = useState(false);

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

  // Tap the header title to rename (own plans, iOS prompt).
  const handleRename = (isPartnersPlan: boolean) => {
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
      s.order === stop.order ? { ...s, feedback: s.feedback === verdict ? undefined : verdict } : s
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
      await createCalendarEvents(plan);
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
            onDeleted();
          } catch (e) {
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  return {
    swappingOrder,
    sharingBusy,
    handleToggleSharing,
    setStatus,
    handleShare,
    handleRename,
    handleSurpriseShare,
    handleFeedback,
    handleSwap,
    handleAddToCalendar,
    handleDelete,
  };
}
