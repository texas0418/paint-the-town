import React, { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
} from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { categoryIcons } from '@/constants/categoryIcons';
import { useTheme } from '@/hooks/useTheme';
import { PlanStop } from '@/types/planner';
import { buildReservationUrl, isReservable } from '@/utils/reservations';

export interface PlanStopRowProps {
  stop: PlanStop;
  /** Remix mode turns the row into a multi-select target instead of an accordion. */
  remixMode: boolean;
  isPicked: boolean;
  isOpen: boolean;
  planDate: string | null;
  planCity: string;
  onPress: () => void;
}

/** A proposed stop in the results list: time rail, details, and cost/links. */
export function PlanStopRow({
  stop,
  remixMode,
  isPicked,
  isOpen,
  planDate,
  planCity,
  onPress,
}: PlanStopRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const CategoryIcon = categoryIcons[stop.category] ?? MapPin;

  const trailing = () => {
    if (remixMode) {
      return (
        <View style={[styles.pickCircle, isPicked && styles.pickCircleActive]}>
          {isPicked && <Check size={12} color={colors.textLight} />}
        </View>
      );
    }
    return isOpen ? (
      <ChevronUp size={16} color={colors.textTertiary} />
    ) : (
      <ChevronDown size={16} color={colors.textTertiary} />
    );
  };

  return (
    <Pressable
      style={[styles.stopRow, remixMode && isPicked && styles.stopRowPicked]}
      onPress={onPress}
    >
      <View style={styles.stopTimeCol}>
        <Text style={styles.stopTime} maxFontSizeMultiplier={1}>
          {stop.time}
        </Text>
        <View style={styles.stopMedallion}>
          <CategoryIcon size={16} color={colors.primaryLight} />
        </View>
        <View style={styles.stopLine} />
      </View>
      <View style={styles.stopBody}>
        <View style={styles.stopHeader}>
          <Text style={styles.stopName}>{stop.name}</Text>
          {trailing()}
        </View>
        <Text style={styles.stopVenue}>
          {stop.venueName} · {stop.address}
        </Text>
        {isOpen && (
          <>
            <Text style={styles.stopDesc}>{stop.description}</Text>
            <Text style={styles.stopWhy}>{stop.whyItMatches}</Text>
          </>
        )}
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
          {isReservable(stop) && (
            <Pressable
              style={styles.stopMetaItem}
              onPress={() => Linking.openURL(buildReservationUrl(stop, planDate, planCity))}
            >
              <CalendarClock size={13} color={colors.secondary} />
              <Text style={[styles.stopMetaText, { color: colors.secondary, fontWeight: '700' }]}>
                Reserve
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
  });
