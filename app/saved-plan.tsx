import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { DatePlan, PlanStop } from '@/types/planner';
import { getPlan } from '@/services/datePlanService';
import { PartnerState, getPartnerState } from '@/services/partnerService';
import { JournalEntry, getEntryForPlan } from '@/services/dateJournalService';
import { usePlanEditor } from '@/hooks/usePlanEditor';
import { useSavedPlanActions } from '@/hooks/useSavedPlanActions';
import { SavedPlanHeader } from '@/components/saved-plan/SavedPlanHeader';
import { SavedPlanSummary } from '@/components/saved-plan/SavedPlanSummary';
import { SavedPlanStop } from '@/components/saved-plan/SavedPlanStop';
import { SavedPlanActions } from '@/components/saved-plan/SavedPlanActions';

/** Multi-day plans get a "Day N" header at each day boundary. */
function startsNewDay(stops: PlanStop[], index: number): boolean {
  const stop = stops[index];
  if (stop.day == null) return false;
  return index === 0 || stops[index - 1].day !== stop.day;
}

export default function SavedPlanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [plan, setPlan] = useState<DatePlan | null>(null);
  const [journalEntry, setJournalEntry] = useState<JournalEntry | null>(null);
  const [partner, setPartner] = useState<PartnerState | null>(null);
  const [loading, setLoading] = useState(true);

  const editor = usePlanEditor(plan, setPlan);
  const actions = useSavedPlanActions(plan, setPlan, () => router.back());

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
  const linked = partner?.status === 'linked' ? partner : null;
  const isPartnersPlan = !!plan && !!linked && plan.ownerId === linked.partnerId;
  const openJournal = () => plan && router.push(`/rate-date?planId=${plan.id}` as never);
  const stops = editor.editing ? editor.draft : (plan?.stops ?? []);

  const body = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    if (!plan) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Plan not found.</Text>
        </View>
      );
    }
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SavedPlanSummary plan={plan} />

        {stops.map((stop, si) => (
          <SavedPlanStop
            key={stop.order}
            stop={stop}
            index={si}
            isFirst={si === 0}
            isLast={si === stops.length - 1}
            showDayHeader={startsNewDay(stops, si)}
            editing={editor.editing}
            isPartnersPlan={isPartnersPlan}
            swappingOrder={actions.swappingOrder}
            showTimePicker={editor.timePickerFor === stop.order}
            planDate={plan.planDate}
            planCity={plan.city}
            onOpenTimeEditor={editor.openEditorAt}
            onMove={editor.moveStop}
            onToggleTimePicker={editor.toggleTimePicker}
            onPickTime={editor.setStopTime}
            onNudgeDuration={editor.nudgeDuration}
            onSwap={actions.handleSwap}
            onFeedback={actions.handleFeedback}
          />
        ))}

        <SavedPlanActions
          plan={plan}
          editing={editor.editing}
          savingEdits={editor.savingEdits}
          isPartnersPlan={isPartnersPlan}
          partnerLinked={!!linked}
          partnerName={linked?.partnerName ?? null}
          journalEntry={journalEntry}
          sharingBusy={actions.sharingBusy}
          onSaveEdits={editor.saveEditing}
          onCancelEdits={editor.cancelEditing}
          onMarkScheduled={() => actions.setStatus('scheduled')}
          onMarkCompleted={async () => {
            // Straight into the journal while the night is still fresh.
            if (await actions.setStatus('completed')) openJournal();
          }}
          onOpenJournal={openJournal}
          onStartEditing={editor.startEditing}
          onAddToCalendar={actions.handleAddToCalendar}
          onShare={actions.handleShare}
          onToggleSharing={actions.handleToggleSharing}
          onSurpriseShare={actions.handleSurpriseShare}
        />
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <SavedPlanHeader
        title={plan?.title ?? 'Date plan'}
        isPartnersPlan={isPartnersPlan}
        editing={editor.editing}
        onBack={() => router.back()}
        onRename={() => actions.handleRename(isPartnersPlan)}
        onCancelEditing={editor.cancelEditing}
        onDelete={actions.handleDelete}
      />
      {body()}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
  });
