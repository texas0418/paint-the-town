import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  Minus,
  Navigation,
  Plus,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { categoryIcons } from '@/constants/categoryIcons';
import { useTheme } from '@/hooks/useTheme';
import { PlanStop } from '@/types/planner';
import { buildReservationUrl, isReservable } from '@/utils/reservations';
import { timeToDate } from '@/utils/planTime';

function directionsUrl(stop: PlanStop): string {
  const query = encodeURIComponent(`${stop.venueName}, ${stop.address}`);
  return Platform.OS === 'ios'
    ? `http://maps.apple.com/?q=${query}`
    : `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export interface SavedPlanStopProps {
  stop: PlanStop;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  showDayHeader: boolean;
  editing: boolean;
  isPartnersPlan: boolean;
  swappingOrder: number | null;
  showTimePicker: boolean;
  planDate: string | null;
  planCity: string;
  onOpenTimeEditor: (order: number) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onToggleTimePicker: (order: number) => void;
  onPickTime: (index: number, picked: Date) => void;
  onNudgeDuration: (index: number, delta: number) => void;
  onSwap: (stop: PlanStop) => void;
  onFeedback: (stop: PlanStop, verdict: 'up' | 'down') => void;
}

type Styles = ReturnType<typeof createStyles>;

function EditControls(props: SavedPlanStopProps & { styles: Styles; colors: ThemeColors }) {
  const { stop, index, isFirst, isLast, styles, colors } = props;
  return (
    <View style={styles.editControls}>
      <View style={styles.editGroup}>
        <Pressable
          style={[styles.editBtn, isFirst && styles.editBtnDisabled]}
          onPress={() => props.onMove(index, -1)}
          disabled={isFirst}
        >
          <ChevronUp size={16} color={colors.primaryLight} />
        </Pressable>
        <Pressable
          style={[styles.editBtn, isLast && styles.editBtnDisabled]}
          onPress={() => props.onMove(index, 1)}
          disabled={isLast}
        >
          <ChevronDown size={16} color={colors.primaryLight} />
        </Pressable>
      </View>
      <Pressable style={styles.editBtnWide} onPress={() => props.onToggleTimePicker(stop.order)}>
        <Clock size={14} color={colors.primaryLight} />
        <Text style={styles.editBtnText}>{stop.time.slice(0, 5)}</Text>
      </Pressable>
      <View style={styles.editGroup}>
        <Pressable style={styles.editBtn} onPress={() => props.onNudgeDuration(index, -15)}>
          <Minus size={14} color={colors.primaryLight} />
        </Pressable>
        <Text style={styles.editBtnText}>{stop.durationMinutes} min</Text>
        <Pressable style={styles.editBtn} onPress={() => props.onNudgeDuration(index, 15)}>
          <Plus size={14} color={colors.primaryLight} />
        </Pressable>
      </View>
    </View>
  );
}

function StopActionsRow(props: SavedPlanStopProps & { styles: Styles; colors: ThemeColors }) {
  const { stop, isPartnersPlan, swappingOrder, planDate, planCity, styles, colors } = props;
  const swappingThis = swappingOrder === stop.order;
  return (
    <View style={styles.stopActions}>
      {isReservable(stop) && (
        <Pressable
          style={[styles.stopActionBtn, styles.reserveBtn]}
          onPress={() => Linking.openURL(buildReservationUrl(stop, planDate, planCity))}
        >
          <CalendarClock size={14} color={colors.textLight} />
          <Text style={[styles.stopActionText, styles.reserveText]}>Reserve</Text>
        </Pressable>
      )}
      <Pressable style={styles.stopActionBtn} onPress={() => Linking.openURL(directionsUrl(stop))}>
        <Navigation size={14} color={colors.primaryLight} />
        <Text style={styles.stopActionText}>Directions</Text>
      </Pressable>
      {!isPartnersPlan && (
        <Pressable
          style={styles.stopActionBtn}
          onPress={() => props.onSwap(stop)}
          disabled={swappingOrder !== null}
        >
          {swappingThis ? (
            <ActivityIndicator size="small" color={colors.primaryLight} />
          ) : (
            <RefreshCw size={14} color={colors.primaryLight} />
          )}
          <Text style={styles.stopActionText}>{swappingThis ? 'Swapping…' : 'Swap'}</Text>
        </Pressable>
      )}
      {!isPartnersPlan && (
        <View style={styles.feedbackGroup}>
          <Pressable
            style={[styles.feedbackBtn, stop.feedback === 'up' && styles.feedbackBtnLoved]}
            onPress={() => props.onFeedback(stop, 'up')}
          >
            <ThumbsUp
              size={14}
              color={stop.feedback === 'up' ? colors.textLight : colors.textTertiary}
            />
          </Pressable>
          <Pressable
            style={[styles.feedbackBtn, stop.feedback === 'down' && styles.feedbackBtnDisliked]}
            onPress={() => props.onFeedback(stop, 'down')}
          >
            <ThumbsDown
              size={14}
              color={stop.feedback === 'down' ? colors.textLight : colors.textTertiary}
            />
          </Pressable>
        </View>
      )}
    </View>
  );
}

/** One stop on the saved-plan timeline: header, time rail, details, and either
 *  edit controls (edit mode) or reserve/directions/swap/feedback actions. */
export function SavedPlanStop(props: SavedPlanStopProps) {
  const { stop, index, showDayHeader, editing, isPartnersPlan, showTimePicker } = props;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const CategoryIcon = categoryIcons[stop.category] ?? MapPin;
  return (
    <View>
      {showDayHeader && <Text style={styles.dayHeader}>Day {stop.day}</Text>}
      <View style={styles.stopRow}>
        <View style={styles.stopTimeCol}>
          {/* Tapping a time is a second door into edit mode, opened right at
              this stop's picker. */}
          <Pressable
            disabled={editing || isPartnersPlan}
            onPress={() => props.onOpenTimeEditor(stop.order)}
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
              <Pressable style={styles.stopMetaItem} onPress={() => Linking.openURL(stop.url!)}>
                <ExternalLink size={13} color={colors.primaryLight} />
                <Text style={[styles.stopMetaText, { color: colors.primaryLight }]}>Website</Text>
              </Pressable>
            )}
          </View>
          {editing && <EditControls {...props} styles={styles} colors={colors} />}
          {editing && showTimePicker && (
            <DateTimePicker
              value={timeToDate(stop.time)}
              mode="time"
              minuteInterval={5}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, picked) => picked && props.onPickTime(index, picked)}
            />
          )}
          {!editing && <StopActionsRow {...props} styles={styles} colors={colors} />}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    dayHeader: {
      fontWeight: '700',
      fontSize: 16,
      color: colors.primaryLight,
      marginTop: 10,
      marginBottom: 4,
    },
    stopRow: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 10,
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
    stopActions: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 10,
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
