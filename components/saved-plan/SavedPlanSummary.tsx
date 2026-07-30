import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CalendarDays, DollarSign, MapPin } from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { DatePlan } from '@/types/planner';

const statusLabels: Record<DatePlan['status'], string> = {
  saved: 'Saved',
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Summary card above the timeline: vibe, city/date/cost, and status badge. */
export function SavedPlanSummary({ plan }: { plan: DatePlan }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
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
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
  });
