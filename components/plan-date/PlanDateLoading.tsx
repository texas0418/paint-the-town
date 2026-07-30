import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { PlanProgress } from '@/types/planner';
import { loadingMessages } from '@/constants/planFormOptions';

export interface PlanDateLoadingProps {
  /** True while finding destinations rather than building a plan. */
  suggesting: boolean;
  isVacation: boolean;
  city: string;
  progress: PlanProgress | null;
  loadingMessageIndex: number;
}

/** Server-reported stage beats the rotating copy once real progress arrives. */
function progressLabel(
  progress: PlanProgress | null,
  loadingMessageIndex: number,
  isVacation: boolean
): string {
  if (!progress || progress.stage === 'starting') return loadingMessages[loadingMessageIndex];
  if (progress.stage === 'scouting') return 'Scouting real venues that match your taste…';
  if (progress.stage === 'building') {
    if (progress.total && progress.total > 1) {
      const unit = isVacation ? 'days' : 'plans';
      return `Building your ${unit} — ${progress.done ?? 0} of ${progress.total} ready`;
    }
    return 'Building your plan…';
  }
  return 'Putting on the finishing touches…';
}

export function PlanDateLoading({
  suggesting,
  isVacation,
  city,
  progress,
  loadingMessageIndex,
}: PlanDateLoadingProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const showBar =
    !suggesting && progress?.stage === 'building' && !!progress.total && progress.total > 1;
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingTitle}>
        {suggesting
          ? 'Finding your destination'
          : `Planning your ${isVacation ? 'trip to' : 'date in'} ${city}`}
      </Text>
      <Text style={styles.loadingMessage}>
        {suggesting
          ? 'Matching places to your taste…'
          : progressLabel(progress, loadingMessageIndex, isVacation)}
      </Text>
      {showBar && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(((progress!.done ?? 0) / progress!.total!) * 100)}%` },
            ]}
          />
        </View>
      )}
      <Text style={styles.loadingHint}>
        We search real {suggesting ? 'destinations' : 'venues'}, so this can take a minute or two.
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      gap: 12,
    },
    loadingTitle: {
      fontSize: 20,
      fontWeight: '700',
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
  });
