// Anniversary Card Component for Paint the Town
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { UpcomingAnniversary, Anniversary, MilestoneLevel } from '../types/anniversary';

interface AnniversaryCardProps {
  item: UpcomingAnniversary | Anniversary;
  onPress?: () => void;
  onViewSuggestions?: () => void;
  compact?: boolean;
}

const LEVEL_COLORS: Record<MilestoneLevel, { bg: string; text: string; accent: string }> = {
  standard: { bg: '#F5F5F5', text: '#333333', accent: '#666666' },
  silver: { bg: '#E8E8E8', text: '#333333', accent: '#A0A0A0' },
  gold: { bg: '#FFF8E7', text: '#8B7355', accent: '#D4AF37' },
  platinum: { bg: '#F0F0F5', text: '#4A4A5A', accent: '#8E8EAA' },
  diamond: { bg: '#E8F4F8', text: '#2A5A6A', accent: '#89CFF0' },
};

const TYPE_ICONS: Record<string, string> = {
  relationship: '💑',
  wedding: '💒',
  engagement: '💍',
  first_date: '☕',
  first_trip: '✈️',
  custom: '🎉',
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getDaysText = (days: number): string => {
  if (days === 0) return 'Today! 🎉';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  if (days < 30) return `In ${Math.ceil(days / 7)} weeks`;
  return `In ${Math.ceil(days / 30)} months`;
};

export const AnniversaryCard: React.FC<AnniversaryCardProps> = ({
  item,
  onPress,
  onViewSuggestions,
  compact = false,
// eslint-disable-next-line complexity -- tracked in #1
}) => {
  const isUpcoming = 'daysUntil' in item;
  const anniversary = isUpcoming ? (item as UpcomingAnniversary).anniversary : (item as Anniversary);
  const upcomingData = isUpcoming ? (item as UpcomingAnniversary) : null;
  
  const milestoneLevel = upcomingData?.milestone?.level || 'standard';
  const colors = LEVEL_COLORS[milestoneLevel];
  const icon = TYPE_ICONS[anniversary.type] || '🎉';

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, { backgroundColor: colors.bg }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.compactIcon}>{icon}</Text>
        <View style={styles.compactContent}>
          <Text style={[styles.compactName, { color: colors.text }]} numberOfLines={1}>
            {anniversary.name}
          </Text>
          {upcomingData && (
            <Text style={[styles.compactDays, { color: colors.accent }]}>
              {getDaysText(upcomingData.daysUntil)}
            </Text>
          )}
        </View>
        {upcomingData?.milestone && (
          <View style={[styles.compactBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.compactBadgeText}>{upcomingData.yearsCompleting}yr</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.bg }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.headerContent}>
          <Text style={[styles.name, { color: colors.text }]}>{anniversary.name}</Text>
          {anniversary.partnerName && (
            <Text style={[styles.partner, { color: colors.accent }]}>
              with {anniversary.partnerName}
            </Text>
          )}
        </View>
        {upcomingData && (
          <View style={styles.countdownContainer}>
            <Text style={[styles.daysNumber, { color: colors.accent }]}>
              {upcomingData.daysUntil}
            </Text>
            <Text style={[styles.daysLabel, { color: colors.text }]}>
              {upcomingData.daysUntil === 1 ? 'day' : 'days'}
            </Text>
          </View>
        )}
      </View>

      {/* Milestone Badge */}
      {upcomingData?.milestone && (
        <View style={[styles.milestoneBanner, { borderColor: colors.accent }]}>
          <Text style={[styles.milestoneEmoji, { color: colors.accent }]}>
            {milestoneLevel === 'diamond' ? '💎' : 
             milestoneLevel === 'platinum' ? '✨' :
             milestoneLevel === 'gold' ? '🏆' :
             milestoneLevel === 'silver' ? '🥈' : '🎊'}
          </Text>
          <View style={styles.milestoneTextContainer}>
            <Text style={[styles.milestoneName, { color: colors.text }]}>
              {upcomingData.milestone.name}
            </Text>
            <Text style={[styles.milestoneYears, { color: colors.accent }]}>
              {upcomingData.yearsCompleting} {upcomingData.yearsCompleting === 1 ? 'Year' : 'Years'} Together
            </Text>
          </View>
        </View>
      )}

      {/* Date Info */}
      <View style={styles.dateRow}>
        <View style={styles.dateItem}>
          <Text style={[styles.dateLabel, { color: colors.accent }]}>Anniversary Date</Text>
          <Text style={[styles.dateValue, { color: colors.text }]}>
            {formatDate(anniversary.date)}
          </Text>
        </View>
        {upcomingData && (
          <View style={styles.dateItem}>
            <Text style={[styles.dateLabel, { color: colors.accent }]}>Upcoming</Text>
            <Text style={[styles.dateValue, { color: colors.text }]}>
              {formatDate(upcomingData.upcomingDate)}
            </Text>
          </View>
        )}
      </View>

      {/* Traditional & Modern Gift Info */}
      {upcomingData?.milestone?.traditionalGift && (
        <View style={styles.giftRow}>
          <View style={styles.giftItem}>
            <Text style={[styles.giftLabel, { color: colors.accent }]}>Traditional Gift</Text>
            <Text style={[styles.giftValue, { color: colors.text }]}>
              🎁 {upcomingData.milestone.traditionalGift}
            </Text>
          </View>
          {upcomingData.milestone.modernGift && (
            <View style={styles.giftItem}>
              <Text style={[styles.giftLabel, { color: colors.accent }]}>Modern Gift</Text>
              <Text style={[styles.giftValue, { color: colors.text }]}>
                ✨ {upcomingData.milestone.modernGift}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Suggestions Preview */}
      {upcomingData?.suggestions && upcomingData.suggestions.length > 0 && (
        <TouchableOpacity
          style={[styles.suggestionsButton, { borderColor: colors.accent }]}
          onPress={onViewSuggestions}
        >
          <Text style={[styles.suggestionsText, { color: colors.accent }]}>
            💡 View {upcomingData.suggestions.length} Celebration Ideas
          </Text>
        </TouchableOpacity>
      )}

      {/* Notes */}
      {anniversary.notes && (
        <View style={styles.notesContainer}>
          <Text style={[styles.notes, { color: colors.accent }]} numberOfLines={2}>
            📝 {anniversary.notes}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  headerContent: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  partner: {
    fontSize: 14,
    marginTop: 2,
  },
  countdownContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
  },
  daysNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  daysLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  milestoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  milestoneEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  milestoneTextContainer: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: '700',
  },
  milestoneYears: {
    fontSize: 13,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  giftRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  giftItem: {
    flex: 1,
  },
  giftLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  giftValue: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  suggestionsButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  suggestionsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  notes: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  compactIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  compactContent: {
    flex: 1,
  },
  compactName: {
    fontSize: 15,
    fontWeight: '600',
  },
  compactDays: {
    fontSize: 12,
    marginTop: 2,
  },
  compactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  compactBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default AnniversaryCard;
