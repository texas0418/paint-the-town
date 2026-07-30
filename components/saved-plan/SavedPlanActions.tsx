import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BookHeart,
  CalendarCheck,
  CalendarPlus,
  Check,
  CheckCircle2,
  Gift,
  HeartHandshake,
  Pencil,
  Share2,
} from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { DatePlan } from '@/types/planner';
import { JournalEntry } from '@/services/dateJournalService';

export interface SavedPlanActionsProps {
  plan: DatePlan;
  editing: boolean;
  savingEdits: boolean;
  isPartnersPlan: boolean;
  partnerLinked: boolean;
  partnerName: string | null;
  journalEntry: JournalEntry | null;
  sharingBusy: boolean;
  onSaveEdits: () => void;
  onCancelEdits: () => void;
  onMarkScheduled: () => void;
  onMarkCompleted: () => void;
  onOpenJournal: () => void;
  onStartEditing: () => void;
  onAddToCalendar: () => void;
  onShare: () => void;
  onToggleSharing: () => void;
  onSurpriseShare: () => void;
}

type Styles = ReturnType<typeof createStyles>;

function EditingActions(props: SavedPlanActionsProps & { styles: Styles; colors: ThemeColors }) {
  const { savingEdits, styles, colors } = props;
  return (
    <View style={styles.actions}>
      <Pressable
        style={[styles.primaryAction, savingEdits && { opacity: 0.6 }]}
        onPress={props.onSaveEdits}
        disabled={savingEdits}
      >
        {savingEdits ? (
          <ActivityIndicator size="small" color={colors.textLight} />
        ) : (
          <Check size={18} color={colors.textLight} />
        )}
        <Text style={styles.primaryActionText}>Save changes</Text>
      </Pressable>
      <Pressable style={styles.secondaryAction} onPress={props.onCancelEdits}>
        <Text style={styles.secondaryActionText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

function StatusActions(props: SavedPlanActionsProps & { styles: Styles; colors: ThemeColors }) {
  const { plan, journalEntry, styles, colors } = props;
  return (
    <>
      {plan.status === 'saved' && (
        <Pressable style={styles.primaryAction} onPress={props.onMarkScheduled}>
          <CalendarCheck size={18} color={colors.textLight} />
          <Text style={styles.primaryActionText}>Mark as scheduled</Text>
        </Pressable>
      )}
      {plan.status === 'scheduled' && (
        <Pressable style={styles.primaryAction} onPress={props.onMarkCompleted}>
          <CheckCircle2 size={18} color={colors.textLight} />
          <Text style={styles.primaryActionText}>We did it! Mark completed</Text>
        </Pressable>
      )}
      {plan.status === 'completed' && (
        <Pressable style={styles.journalAction} onPress={props.onOpenJournal}>
          <BookHeart size={17} color={colors.primaryLight} />
          <Text style={styles.journalActionText}>
            {journalEntry
              ? `In your journal · ${'♥'.repeat(journalEntry.rating)} — edit`
              : 'How was it? Add it to your date journal'}
          </Text>
        </Pressable>
      )}
    </>
  );
}

function SharingActions(props: SavedPlanActionsProps & { styles: Styles; colors: ThemeColors }) {
  const { plan, partnerLinked, partnerName, sharingBusy, styles, colors } = props;
  return (
    <>
      {partnerLinked && (
        <Pressable
          style={styles.journalAction}
          onPress={props.onToggleSharing}
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
              ? `Shared with ${partnerName ?? 'partner'} — tap to unshare`
              : 'Show this plan to your partner'}
          </Text>
        </Pressable>
      )}
      <Pressable style={styles.surpriseAction} onPress={props.onSurpriseShare}>
        <Gift size={16} color={colors.secondary} />
        <Text style={styles.surpriseActionText}>
          Share as a surprise — no spoilers, just when to be ready
        </Text>
      </Pressable>
    </>
  );
}

/** The action block under a saved plan: save/cancel in edit mode; otherwise
 *  status progression, journal, edit entry, calendar/share, and partner sharing. */
export function SavedPlanActions(props: SavedPlanActionsProps) {
  const { editing, isPartnersPlan, partnerName } = props;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (editing) return <EditingActions {...props} styles={styles} colors={colors} />;
  return (
    <View style={styles.actions}>
      {isPartnersPlan && (
        <View style={styles.partnerNote}>
          <HeartHandshake size={16} color={colors.secondary} />
          <Text style={styles.partnerNoteText}>Planned by {partnerName ?? 'your partner'}</Text>
        </View>
      )}
      {!isPartnersPlan && <StatusActions {...props} styles={styles} colors={colors} />}
      {!isPartnersPlan && (
        <Pressable style={styles.journalAction} onPress={props.onStartEditing}>
          <Pencil size={16} color={colors.primaryLight} />
          <Text style={styles.journalActionText}>
            Edit times & order — or just tap any stop&apos;s time
          </Text>
        </Pressable>
      )}
      <View style={styles.secondaryRow}>
        <Pressable style={styles.secondaryAction} onPress={props.onAddToCalendar}>
          <CalendarPlus size={17} color={colors.primaryLight} />
          <Text style={styles.secondaryActionText}>Add to calendar</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={props.onShare}>
          <Share2 size={17} color={colors.primaryLight} />
          <Text style={styles.secondaryActionText}>Share plan</Text>
        </Pressable>
      </View>
      {!isPartnersPlan && <SharingActions {...props} styles={styles} colors={colors} />}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
  });
