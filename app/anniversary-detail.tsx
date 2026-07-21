// Anniversary Detail Screen for Paint the Town
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Share,
} from 'react-native';
import { useAnniversary } from '../hooks/useAnniversary';
import anniversaryService from '../services/anniversaryService';
import { SuggestionCardCompact } from '../components/SuggestionCard';
import { Anniversary, Milestone, MilestoneSuggestion, MilestoneLevel } from '../types/anniversary';

interface AnniversaryDetailScreenProps {
  navigation: any;
  route: {
    params: {
      anniversaryId: string;
    };
  };
}

const LEVEL_COLORS: Record<MilestoneLevel, { bg: string; accent: string }> = {
  standard: { bg: '#F5F5F5', accent: '#666666' },
  silver: { bg: '#E8E8E8', accent: '#A0A0A0' },
  gold: { bg: '#FFF8E7', accent: '#D4AF37' },
  platinum: { bg: '#F0F0F5', accent: '#8E8EAA' },
  diamond: { bg: '#E8F4F8', accent: '#89CFF0' },
};

const TYPE_ICONS: Record<string, string> = {
  relationship: '💑',
  wedding: '💒',
  engagement: '💍',
  first_date: '☕',
  first_trip: '✈️',
  custom: '🎉',
};

export const AnniversaryDetailScreen: React.FC<AnniversaryDetailScreenProps> = ({
  navigation,
  route,
// eslint-disable-next-line complexity -- tracked in #1
}) => {
  const { anniversaryId } = route.params;
  const { deleteAnniversary, getMilestoneProgress, toggleSuggestionBookmark, refresh } =
    useAnniversary();

  const [anniversary, setAnniversary] = useState<Anniversary | null>(null);
  const [suggestions, setSuggestions] = useState<MilestoneSuggestion[]>([]);
  const [milestoneInfo, setMilestoneInfo] = useState<{
    yearsCompleting: number;
    daysUntil: number;
    milestone: Milestone | null;
  } | null>(null);
  const [progress, setProgress] = useState({
    current: 0,
    next: undefined as Milestone | undefined,
    progress: 0,
  });

  const loadData = useCallback(async () => {
    const ann = await anniversaryService.getAnniversaryById(anniversaryId);
    if (ann) {
      setAnniversary(ann);

      // Get milestone progress
      const prog = getMilestoneProgress(ann.date);
      setProgress(prog);

      // Calculate upcoming info
      const originalDate = new Date(ann.date);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const currentYear = now.getFullYear();

      let nextAnniversary = new Date(currentYear, originalDate.getMonth(), originalDate.getDate());
      if (nextAnniversary < now) {
        nextAnniversary = new Date(
          currentYear + 1,
          originalDate.getMonth(),
          originalDate.getDate()
        );
      }

      const daysUntil = Math.ceil(
        (nextAnniversary.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const yearsCompleting = nextAnniversary.getFullYear() - originalDate.getFullYear();

      // Get milestone for upcoming anniversary
      const upcomingData = await anniversaryService.getUpcomingAnniversaries(365);
      const upcoming = upcomingData.find((u) => u.anniversary.id === anniversaryId);

      setMilestoneInfo({
        yearsCompleting,
        daysUntil,
        milestone: upcoming?.milestone || null,
      });

      // Load suggestions
      const sugs = await anniversaryService.getSuggestionsForAnniversary(anniversaryId);
      setSuggestions(sugs);
    }
  }, [anniversaryId, getMilestoneProgress]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = () => {
    navigation.navigate('AddAnniversary', { anniversaryId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Anniversary',
      'Are you sure you want to delete this anniversary? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteAnniversary(anniversaryId);
            if (success) {
              await refresh();
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!anniversary || !milestoneInfo) return;

    try {
      await Share.share({
        message: `🎉 ${anniversary.name}\n${milestoneInfo.yearsCompleting} ${milestoneInfo.yearsCompleting === 1 ? 'year' : 'years'} together!\n${milestoneInfo.daysUntil === 0 ? 'Today!' : `Coming up in ${milestoneInfo.daysUntil} days`}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleToggleBookmark = async (suggestionId: string) => {
    await toggleSuggestionBookmark(suggestionId);
    setSuggestions((prev) =>
      prev.map((s) => (s.id === suggestionId ? { ...s, isBookmarked: !s.isBookmarked } : s))
    );
  };

  if (!anniversary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const colors = milestoneInfo?.milestone?.level
    ? LEVEL_COLORS[milestoneInfo.milestone.level]
    : LEVEL_COLORS.standard;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerAction}>
            <Text style={styles.headerActionText}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEdit} style={styles.headerAction}>
            <Text style={styles.headerActionText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerAction}>
            <Text style={styles.headerActionText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: colors.bg }]}>
          <Text style={styles.heroIcon}>{TYPE_ICONS[anniversary.type] || '🎉'}</Text>
          <Text style={styles.heroName}>{anniversary.name}</Text>
          {anniversary.partnerName && (
            <Text style={[styles.heroPartner, { color: colors.accent }]}>
              with {anniversary.partnerName}
            </Text>
          )}

          {/* Countdown */}
          {milestoneInfo && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownNumber}>{milestoneInfo.daysUntil}</Text>
              <Text style={styles.countdownLabel}>
                {milestoneInfo.daysUntil === 0
                  ? "It's Today! 🎉"
                  : milestoneInfo.daysUntil === 1
                    ? 'day until'
                    : 'days until'}
              </Text>
              <Text style={[styles.countdownYears, { color: colors.accent }]}>
                Year {milestoneInfo.yearsCompleting}
              </Text>
            </View>
          )}
        </View>

        {/* Milestone Section */}
        {milestoneInfo?.milestone && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Upcoming Milestone</Text>
            <View style={[styles.milestoneCard, { borderLeftColor: colors.accent }]}>
              <Text style={styles.milestoneName}>{milestoneInfo.milestone.name}</Text>
              <Text style={styles.milestoneDescription}>{milestoneInfo.milestone.description}</Text>

              {milestoneInfo.milestone.traditionalGift && (
                <View style={styles.giftRow}>
                  <View style={styles.giftItem}>
                    <Text style={styles.giftLabel}>Traditional Gift</Text>
                    <Text style={styles.giftValue}>
                      🎁 {milestoneInfo.milestone.traditionalGift}
                    </Text>
                  </View>
                  {milestoneInfo.milestone.modernGift && (
                    <View style={styles.giftItem}>
                      <Text style={styles.giftLabel}>Modern Gift</Text>
                      <Text style={styles.giftValue}>✨ {milestoneInfo.milestone.modernGift}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Journey Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressYears}>{progress.current} years</Text>
              {progress.next && (
                <Text style={styles.progressNext}>Next milestone: {progress.next.name}</Text>
              )}
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress.progress}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{Math.round(progress.progress)}%</Text>
          </View>
        </View>

        {/* Anniversary Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Anniversary Date</Text>
              <Text style={styles.detailValue}>
                {new Date(anniversary.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>
                {TYPE_ICONS[anniversary.type]} {anniversary.type.replace('_', ' ')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reminders</Text>
              <Text style={styles.detailValue}>
                {anniversary.reminderDays
                  .map((d) => (d === 0 ? 'On the day' : `${d} day${d > 1 ? 's' : ''} before`))
                  .join(', ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {anniversary.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{anniversary.notes}</Text>
            </View>
          </View>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💡 Celebration Ideas</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Suggestions', { anniversaryId })}
              >
                <Text style={styles.seeAllButton}>See All →</Text>
              </TouchableOpacity>
            </View>
            {suggestions.slice(0, 3).map((suggestion) => (
              <SuggestionCardCompact
                key={suggestion.id}
                suggestion={suggestion}
                onBookmark={() => handleToggleBookmark(suggestion.id)}
                onPress={() => navigation.navigate('Suggestions', { anniversaryId })}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerAction: {
    padding: 8,
    marginLeft: 8,
  },
  headerActionText: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  heroPartner: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
  },
  countdownContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FF6B6B',
  },
  countdownLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  countdownYears: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  seeAllButton: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  milestoneCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  milestoneName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  giftRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  giftItem: {
    flex: 1,
  },
  giftLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  giftValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  progressInfo: {
    marginBottom: 12,
  },
  progressYears: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  progressNext: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  notesCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  notesText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default AnniversaryDetailScreen;
