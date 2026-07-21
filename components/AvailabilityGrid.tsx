import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Check, X, Minus } from 'lucide-react-native';
import colors from '@/constants/colors';
import {
  MutualAvailability,
  MutualTimeSlot,
  DayOfWeek,
  DAY_LABELS,
  DAYS_OF_WEEK,
} from '@/types/availability';
import {
  formatTimeRange,
  formatDuration,
  getQualityColor,
} from '@/utils/availabilityUtils';

interface AvailabilityGridProps {
  mutualAvailability: MutualAvailability[];
  userColor: string;
  partnerColor: string;
  onSlotPress?: (date: string, slot: MutualTimeSlot) => void;
  selectedSlot?: { date: string; slotStart: number } | null;
  weeksToShow?: number;
  startDate?: Date;
}

interface DayCell {
  date: string;
  dayOfWeek: DayOfWeek;
  dayNumber: number;
  month: string;
  isToday: boolean;
  isPast: boolean;
  availability?: MutualAvailability;
}

export default function AvailabilityGrid({
  mutualAvailability,
  userColor,
  partnerColor,
  onSlotPress,
  selectedSlot,
  weeksToShow = 4,
  startDate = new Date(),
}: AvailabilityGridProps) {
  // Generate calendar data
  const calendarData = useMemo(() => {
    const availabilityMap = new Map<string, MutualAvailability>();
    mutualAvailability.forEach((a) => availabilityMap.set(a.date, a));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weeks: DayCell[][] = [];
    const currentDate = new Date(startDate);
    
    // Start from the beginning of the week
    currentDate.setDate(currentDate.getDate() - currentDate.getDay());
    currentDate.setHours(0, 0, 0, 0);

    for (let week = 0; week < weeksToShow; week++) {
      const weekDays: DayCell[] = [];
      
      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = DAYS_OF_WEEK[currentDate.getDay()];
        
        weekDays.push({
          date: dateStr,
          dayOfWeek,
          dayNumber: currentDate.getDate(),
          month: currentDate.toLocaleDateString('en-US', { month: 'short' }),
          isToday: currentDate.getTime() === today.getTime(),
          isPast: currentDate < today,
          availability: availabilityMap.get(dateStr),
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      weeks.push(weekDays);
    }

    return weeks;
  }, [mutualAvailability, startDate, weeksToShow]);

  // eslint-disable-next-line complexity -- tracked in #1
  const renderDayCell = (day: DayCell) => {
    const hasAvailability = day.availability && day.availability.slots.length > 0;
    const isSelected = selectedSlot?.date === day.date;
    const bestSlot = day.availability?.slots[0];

    return (
      <TouchableOpacity
        key={day.date}
        style={[
          styles.dayCell,
          day.isToday && styles.dayCellToday,
          day.isPast && styles.dayCellPast,
          hasAvailability && styles.dayCellAvailable,
          isSelected && styles.dayCellSelected,
          day.availability?.isIdeal && styles.dayCellIdeal,
        ]}
        onPress={() => {
          if (hasAvailability && bestSlot && onSlotPress) {
            onSlotPress(day.date, bestSlot);
          }
        }}
        disabled={day.isPast || !hasAvailability}
        activeOpacity={0.7}
      >
        {/* Month label for 1st of month */}
        {day.dayNumber === 1 && (
          <Text style={styles.monthLabel}>{day.month}</Text>
        )}
        
        {/* Day number */}
        <Text style={[
          styles.dayNumber,
          day.isToday && styles.dayNumberToday,
          day.isPast && styles.dayNumberPast,
          hasAvailability && styles.dayNumberAvailable,
          isSelected && styles.dayNumberSelected,
        ]}>
          {day.dayNumber}
        </Text>
        
        {/* Availability indicator */}
        {!day.isPast && (
          <View style={styles.availabilityIndicator}>
            {hasAvailability ? (
              <View style={[
                styles.availabilityDot,
                { backgroundColor: getQualityColor(bestSlot!.quality) },
              ]} />
            ) : (
              <View style={styles.noAvailabilityDot} />
            )}
          </View>
        )}
        
        {/* Slot count badge */}
        {hasAvailability && day.availability!.slots.length > 1 && (
          <View style={styles.slotCountBadge}>
            <Text style={styles.slotCountText}>
              {day.availability!.slots.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with day labels */}
      <View style={styles.header}>
        {DAYS_OF_WEEK.map((day) => (
          <View key={day} style={styles.headerCell}>
            <Text style={styles.headerText}>{DAY_LABELS[day]}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {calendarData.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map(renderDayCell)}
          </View>
        ))}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Perfect</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Good</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
          <Text style={styles.legendText}>Possible</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendDotEmpty} />
          <Text style={styles.legendText}>Busy</Text>
        </View>
      </View>
    </View>
  );
}

// Slot detail card shown when a day is selected
interface SlotDetailCardProps {
  date: string;
  dayOfWeek: DayOfWeek;
  slots: MutualTimeSlot[];
  onSlotSelect: (slot: MutualTimeSlot) => void;
  onClose: () => void;
}

export function SlotDetailCard({
  date,
  dayOfWeek,
  slots,
  onSlotSelect,
  onClose,
}: SlotDetailCardProps) {
  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.detailCard}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailDate}>{displayDate}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.detailSubtitle}>
        {slots.length} available {slots.length === 1 ? 'time' : 'times'}
      </Text>

      <View style={styles.slotsContainer}>
        {slots.map((slot, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.slotCard,
              { borderLeftColor: getQualityColor(slot.quality) },
            ]}
            onPress={() => onSlotSelect(slot)}
            activeOpacity={0.7}
          >
            <View style={styles.slotMain}>
              <Text style={styles.slotTime}>
                {formatTimeRange(slot.start, slot.end)}
              </Text>
              <Text style={styles.slotDuration}>
                {formatDuration(slot.durationMinutes)}
              </Text>
            </View>

            <View style={styles.slotMeta}>
              <View style={[
                styles.qualityBadge,
                { backgroundColor: `${getQualityColor(slot.quality)}15` },
              ]}>
                <Text style={[
                  styles.qualityText,
                  { color: getQualityColor(slot.quality) },
                ]}>
                  {slot.quality === 'ideal' ? '★ Perfect' : 
                   slot.quality === 'good' ? 'Good' : 'Possible'}
                </Text>
              </View>

              <View style={styles.prefsRow}>
                <View style={styles.prefItem}>
                  <Text style={styles.prefLabel}>You</Text>
                  {slot.matchesPreferences.user1 ? (
                    <Check size={14} color={colors.success} />
                  ) : (
                    <Minus size={14} color={colors.textTertiary} />
                  )}
                </View>
                <View style={styles.prefItem}>
                  <Text style={styles.prefLabel}>Partner</Text>
                  {slot.matchesPreferences.user2 ? (
                    <Check size={14} color={colors.success} />
                  ) : (
                    <Minus size={14} color={colors.textTertiary} />
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 2,
    position: 'relative',
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayCellPast: {
    opacity: 0.4,
  },
  dayCellAvailable: {
    backgroundColor: `${colors.success}10`,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellIdeal: {
    backgroundColor: `${colors.success}20`,
  },
  monthLabel: {
    position: 'absolute',
    top: 2,
    left: 4,
    fontSize: 8,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  dayNumberToday: {
    fontWeight: '700',
    color: colors.primary,
  },
  dayNumberPast: {
    color: colors.textTertiary,
  },
  dayNumberAvailable: {
    color: colors.text,
  },
  dayNumberSelected: {
    color: '#fff',
  },
  availabilityIndicator: {
    position: 'absolute',
    bottom: 4,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  noAvailabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  slotCountBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  slotCountText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDotEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  // Detail card styles
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailDate: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  detailSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  slotsContainer: {
    gap: 8,
  },
  slotCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
  },
  slotMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotTime: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  slotDuration: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  slotMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  prefsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  prefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prefLabel: {
    fontSize: 11,
    color: colors.textTertiary,
  },
});
