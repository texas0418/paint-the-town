/* eslint-disable max-lines -- tracked in #1 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Trophy,
  Globe,
  Plane,
  MapPin,
  Camera,
  Users,
  Star,
  Compass,
  Mountain,
  Palmtree,
  Building2,
  Ship,
  Train,
  Utensils,
  Heart,
  Zap,
  Crown,
  Medal,
  Target,
  Flag,
  Sunrise,
  Moon,
  X,
  Share2,
  ChevronRight,
} from 'lucide-react-native';
import colors from '@/constants/colors';

const { width } = Dimensions.get('window');

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'explorer' | 'adventurer' | 'social' | 'collector' | 'milestone';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  progress: number;
  target: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface TravelStats {
  countriesVisited: number;
  citiesVisited: number;
  totalMiles: number;
  totalTrips: number;
  photosShared: number;
  friendsInvited: number;
  reviewsWritten: number;
  level: number;
  currentXP: number;
  nextLevelXP: number;
}

const TIER_COLORS: Record<string, readonly [string, string]> = {
  bronze: ['#CD7F32', '#8B4513'] as const,
  silver: ['#C0C0C0', '#808080'] as const,
  gold: ['#FFD700', '#FFA500'] as const,
  platinum: ['#E5E4E2', '#B4B4B4'] as const,
};

const RARITY_COLORS = {
  common: colors.textSecondary,
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
};

const CATEGORY_INFO = {
  explorer: { label: 'Explorer', color: colors.primary },
  adventurer: { label: 'Adventurer', color: colors.secondary },
  social: { label: 'Social', color: '#EC4899' },
  collector: { label: 'Collector', color: colors.success },
  milestone: { label: 'Milestone', color: '#F59E0B' },
};

const mockStats: TravelStats = {
  countriesVisited: 12,
  citiesVisited: 34,
  totalMiles: 48750,
  totalTrips: 18,
  photosShared: 156,
  friendsInvited: 8,
  reviewsWritten: 23,
  level: 15,
  currentXP: 2350,
  nextLevelXP: 3000,
};

const mockAchievements: Achievement[] = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Complete your first trip',
    icon: Flag,
    category: 'milestone',
    tier: 'bronze',
    progress: 1,
    target: 1,
    isUnlocked: true,
    unlockedAt: '2024-03-15',
    xpReward: 100,
    rarity: 'common',
  },
  {
    id: '2',
    name: 'Globe Trotter',
    description: 'Visit 10 different countries',
    icon: Globe,
    category: 'explorer',
    tier: 'gold',
    progress: 12,
    target: 10,
    isUnlocked: true,
    unlockedAt: '2024-08-20',
    xpReward: 500,
    rarity: 'epic',
  },
  {
    id: '3',
    name: 'City Hopper',
    description: 'Visit 25 different cities',
    icon: Building2,
    category: 'explorer',
    tier: 'silver',
    progress: 34,
    target: 25,
    isUnlocked: true,
    unlockedAt: '2024-06-10',
    xpReward: 300,
    rarity: 'rare',
  },
  {
    id: '4',
    name: 'Mile High Club',
    description: 'Travel 50,000 miles total',
    icon: Plane,
    category: 'adventurer',
    tier: 'gold',
    progress: 48750,
    target: 50000,
    isUnlocked: false,
    xpReward: 750,
    rarity: 'epic',
  },
  {
    id: '5',
    name: 'Social Butterfly',
    description: 'Invite 10 friends to join',
    icon: Users,
    category: 'social',
    tier: 'silver',
    progress: 8,
    target: 10,
    isUnlocked: false,
    xpReward: 400,
    rarity: 'rare',
  },
  {
    id: '6',
    name: 'Shutterbug',
    description: 'Share 100 travel photos',
    icon: Camera,
    category: 'collector',
    tier: 'gold',
    progress: 156,
    target: 100,
    isUnlocked: true,
    unlockedAt: '2024-09-05',
    xpReward: 450,
    rarity: 'rare',
  },
  {
    id: '7',
    name: 'World Explorer',
    description: 'Visit 25 different countries',
    icon: Compass,
    category: 'explorer',
    tier: 'platinum',
    progress: 12,
    target: 25,
    isUnlocked: false,
    xpReward: 1000,
    rarity: 'legendary',
  },
  {
    id: '8',
    name: 'Mountain Climber',
    description: 'Visit 5 mountain destinations',
    icon: Mountain,
    category: 'adventurer',
    tier: 'bronze',
    progress: 3,
    target: 5,
    isUnlocked: false,
    xpReward: 200,
    rarity: 'common',
  },
  {
    id: '9',
    name: 'Beach Bum',
    description: 'Visit 10 beach destinations',
    icon: Palmtree,
    category: 'adventurer',
    tier: 'silver',
    progress: 7,
    target: 10,
    isUnlocked: false,
    xpReward: 350,
    rarity: 'rare',
  },
  {
    id: '10',
    name: 'Cruise Captain',
    description: 'Take 3 cruise trips',
    icon: Ship,
    category: 'adventurer',
    tier: 'gold',
    progress: 1,
    target: 3,
    isUnlocked: false,
    xpReward: 500,
    rarity: 'epic',
  },
  {
    id: '11',
    name: 'Train Enthusiast',
    description: 'Travel by train in 5 countries',
    icon: Train,
    category: 'adventurer',
    tier: 'silver',
    progress: 4,
    target: 5,
    isUnlocked: false,
    xpReward: 300,
    rarity: 'rare',
  },
  {
    id: '12',
    name: 'Foodie Explorer',
    description: 'Try local cuisine in 15 cities',
    icon: Utensils,
    category: 'collector',
    tier: 'gold',
    progress: 11,
    target: 15,
    isUnlocked: false,
    xpReward: 400,
    rarity: 'epic',
  },
  {
    id: '13',
    name: 'Review Master',
    description: 'Write 20 travel reviews',
    icon: Star,
    category: 'social',
    tier: 'silver',
    progress: 23,
    target: 20,
    isUnlocked: true,
    unlockedAt: '2024-10-12',
    xpReward: 350,
    rarity: 'rare',
  },
  {
    id: '14',
    name: 'Early Bird',
    description: 'Book 10 trips more than 60 days in advance',
    icon: Sunrise,
    category: 'collector',
    tier: 'bronze',
    progress: 6,
    target: 10,
    isUnlocked: false,
    xpReward: 250,
    rarity: 'common',
  },
  {
    id: '15',
    name: 'Night Owl',
    description: 'Experience nightlife in 10 cities',
    icon: Moon,
    category: 'adventurer',
    tier: 'silver',
    progress: 8,
    target: 10,
    isUnlocked: false,
    xpReward: 300,
    rarity: 'rare',
  },
  {
    id: '16',
    name: 'Loyal Traveler',
    description: 'Complete 25 trips',
    icon: Heart,
    category: 'milestone',
    tier: 'gold',
    progress: 18,
    target: 25,
    isUnlocked: false,
    xpReward: 600,
    rarity: 'epic',
  },
  {
    id: '17',
    name: 'Speed Runner',
    description: 'Book and complete a trip within 48 hours',
    icon: Zap,
    category: 'adventurer',
    tier: 'gold',
    progress: 1,
    target: 1,
    isUnlocked: true,
    unlockedAt: '2024-07-22',
    xpReward: 500,
    rarity: 'epic',
  },
  {
    id: '18',
    name: 'Premium Explorer',
    description: 'Stay at 5 five-star hotels',
    icon: Crown,
    category: 'collector',
    tier: 'platinum',
    progress: 2,
    target: 5,
    isUnlocked: false,
    xpReward: 800,
    rarity: 'legendary',
  },
  {
    id: '19',
    name: 'Centurion',
    description: 'Travel 100,000 miles total',
    icon: Medal,
    category: 'milestone',
    tier: 'platinum',
    progress: 48750,
    target: 100000,
    isUnlocked: false,
    xpReward: 1500,
    rarity: 'legendary',
  },
  {
    id: '20',
    name: 'Goal Setter',
    description: 'Add 10 destinations to bucket list',
    icon: Target,
    category: 'collector',
    tier: 'bronze',
    progress: 8,
    target: 10,
    isUnlocked: false,
    xpReward: 150,
    rarity: 'common',
  },
];

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function AchievementsScreen() {
  const [stats] = useState<TravelStats>(mockStats);
  const [achievements] = useState<Achievement[]>(mockAchievements);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalXP = achievements.filter((a) => a.isUnlocked).reduce((sum, a) => sum + a.xpReward, 0);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'explorer', label: 'Explorer' },
    { id: 'adventurer', label: 'Adventurer' },
    { id: 'social', label: 'Social' },
    { id: 'collector', label: 'Collector' },
    { id: 'milestone', label: 'Milestone' },
  ];

  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (a.isUnlocked && !b.isUnlocked) return -1;
    if (!a.isUnlocked && b.isUnlocked) return 1;
    return b.progress / b.target - a.progress / a.target;
  });

  const renderStatCard = useCallback(
    (label: string, value: string | number, icon: React.ReactNode) => (
      <View style={styles.statCard}>
        <View style={styles.statIcon}>{icon}</View>
        <Text style={styles.statValue}>{value.toLocaleString()}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    ),
    []
  );

  const renderAchievementBadge = useCallback((achievement: Achievement) => {
    const IconComponent = achievement.icon;
    const tierColors = TIER_COLORS[achievement.tier];
    const progressPercent = Math.min((achievement.progress / achievement.target) * 100, 100);

    return (
      <TouchableOpacity
        key={achievement.id}
        style={[styles.badgeCard, !achievement.isUnlocked && styles.badgeCardLocked]}
        onPress={() => setSelectedAchievement(achievement)}
        activeOpacity={0.7}
      >
        <View style={styles.badgeContent}>
          <LinearGradient
            colors={achievement.isUnlocked ? tierColors : ['#E2E8F0', '#CBD5E1']}
            style={styles.badgeIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <IconComponent
              size={28}
              color={achievement.isUnlocked ? '#FFFFFF' : colors.textTertiary}
            />
          </LinearGradient>

          <View style={styles.badgeInfo}>
            <View style={styles.badgeHeader}>
              <Text
                style={[styles.badgeName, !achievement.isUnlocked && styles.badgeNameLocked]}
                numberOfLines={1}
              >
                {achievement.name}
              </Text>
              <View
                style={[
                  styles.rarityBadge,
                  { backgroundColor: `${RARITY_COLORS[achievement.rarity]}20` },
                ]}
              >
                <Text style={[styles.rarityText, { color: RARITY_COLORS[achievement.rarity] }]}>
                  {achievement.rarity.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.badgeDescription} numberOfLines={1}>
              {achievement.description}
            </Text>

            {!achievement.isUnlocked && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {achievement.progress.toLocaleString()}/{achievement.target.toLocaleString()}
                </Text>
              </View>
            )}

            {achievement.isUnlocked && (
              <View style={styles.unlockedInfo}>
                <Trophy size={12} color={TIER_COLORS[achievement.tier][0]} />
                <Text style={styles.unlockedText}>Unlocked {achievement.unlockedAt}</Text>
              </View>
            )}
          </View>

          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>+{achievement.xpReward} XP</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, []);

  const renderAchievementModal = useCallback(() => {
    if (!selectedAchievement) return null;

    const IconComponent = selectedAchievement.icon;
    const tierColors = TIER_COLORS[selectedAchievement.tier];
    const progressPercent = Math.min(
      (selectedAchievement.progress / selectedAchievement.target) * 100,
      100
    );

    return (
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setSelectedAchievement(null)}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedAchievement(null)}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>

          <LinearGradient
            colors={selectedAchievement.isUnlocked ? tierColors : ['#E2E8F0', '#CBD5E1']}
            style={styles.modalBadgeIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <IconComponent
              size={48}
              color={selectedAchievement.isUnlocked ? '#FFFFFF' : colors.textTertiary}
            />
          </LinearGradient>

          <View
            style={[
              styles.modalRarityBadge,
              { backgroundColor: `${RARITY_COLORS[selectedAchievement.rarity]}20` },
            ]}
          >
            <Text
              style={[styles.modalRarityText, { color: RARITY_COLORS[selectedAchievement.rarity] }]}
            >
              {selectedAchievement.rarity.toUpperCase()}
            </Text>
          </View>

          <Text style={styles.modalTitle}>{selectedAchievement.name}</Text>
          <Text style={styles.modalDescription}>{selectedAchievement.description}</Text>

          <View style={styles.modalStats}>
            <View style={styles.modalStatItem}>
              <Text style={styles.modalStatLabel}>Tier</Text>
              <Text style={[styles.modalStatValue, { color: tierColors[0] }]}>
                {selectedAchievement.tier.charAt(0).toUpperCase() +
                  selectedAchievement.tier.slice(1)}
              </Text>
            </View>
            <View style={styles.modalStatItem}>
              <Text style={styles.modalStatLabel}>Category</Text>
              <Text
                style={[
                  styles.modalStatValue,
                  { color: CATEGORY_INFO[selectedAchievement.category].color },
                ]}
              >
                {CATEGORY_INFO[selectedAchievement.category].label}
              </Text>
            </View>
            <View style={styles.modalStatItem}>
              <Text style={styles.modalStatLabel}>XP Reward</Text>
              <Text style={styles.modalStatValue}>+{selectedAchievement.xpReward}</Text>
            </View>
          </View>

          <View style={styles.modalProgressSection}>
            <View style={styles.modalProgressHeader}>
              <Text style={styles.modalProgressLabel}>Progress</Text>
              <Text style={styles.modalProgressValue}>
                {selectedAchievement.progress.toLocaleString()} /{' '}
                {selectedAchievement.target.toLocaleString()}
              </Text>
            </View>
            <View style={styles.modalProgressBar}>
              <LinearGradient
                colors={
                  selectedAchievement.isUnlocked
                    ? tierColors
                    : [colors.primary, colors.primaryLight]
                }
                style={[styles.modalProgressFill, { width: `${progressPercent}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>

          {selectedAchievement.isUnlocked ? (
            <View style={styles.modalUnlockedSection}>
              <Trophy size={20} color={tierColors[0]} />
              <Text style={styles.modalUnlockedText}>
                Unlocked on {selectedAchievement.unlockedAt}
              </Text>
            </View>
          ) : (
            <View style={styles.modalLockedSection}>
              <Text style={styles.modalLockedText}>{Math.round(progressPercent)}% complete</Text>
            </View>
          )}

          {selectedAchievement.isUnlocked && (
            <TouchableOpacity style={styles.shareButton}>
              <Share2 size={18} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Share Achievement</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [selectedAchievement]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Achievements</Text>
            <View style={styles.levelBadge}>
              <Crown size={14} color="#FFD700" />
              <Text style={styles.levelText}>Level {stats.level}</Text>
            </View>
          </View>

          <View style={styles.xpSection}>
            <View style={styles.xpInfo}>
              <Text style={styles.xpLabel}>Experience Points</Text>
              <Text style={styles.xpValue}>
                {stats.currentXP.toLocaleString()} / {stats.nextLevelXP.toLocaleString()} XP
              </Text>
            </View>
            <View style={styles.xpBar}>
              <View
                style={[
                  styles.xpFill,
                  { width: `${(stats.currentXP / stats.nextLevelXP) * 100}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.overviewStats}>
            <View style={styles.overviewItem}>
              <Trophy size={20} color="#FFD700" />
              <Text style={styles.overviewValue}>
                {unlockedCount}/{achievements.length}
              </Text>
              <Text style={styles.overviewLabel}>Unlocked</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Zap size={20} color="#F59E0B" />
              <Text style={styles.overviewValue}>{totalXP.toLocaleString()}</Text>
              <Text style={styles.overviewLabel}>Total XP</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Travel Stats</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Countries',
              stats.countriesVisited,
              <Globe size={20} color={colors.primary} />
            )}
            {renderStatCard(
              'Cities',
              stats.citiesVisited,
              <MapPin size={20} color={colors.secondary} />
            )}
            {renderStatCard(
              'Miles',
              `${(stats.totalMiles / 1000).toFixed(1)}K`,
              <Plane size={20} color={colors.accentDark} />
            )}
            {renderStatCard(
              'Trips',
              stats.totalTrips,
              <Compass size={20} color={colors.success} />
            )}
          </View>
        </View>

        <View style={styles.categorySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category.id && styles.categoryChipTextActive,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.achievementsSection}>
          <View style={styles.achievementsHeader}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>
                {sortedAchievements.filter((a) => a.isUnlocked).length} unlocked
              </Text>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.achievementsList}>
            {sortedAchievements.map((achievement) => renderAchievementBadge(achievement))}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {selectedAchievement && renderAchievementModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  xpSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  xpInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  xpValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  xpBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginTop: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  overviewDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  scrollView: {
    flex: 1,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categorySection: {
    marginBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  achievementsSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  achievementsList: {
    gap: 12,
  },
  badgeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeCardLocked: {
    opacity: 0.85,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
  },
  badgeNameLocked: {
    color: colors.textSecondary,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  badgeDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500' as const,
  },
  unlockedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  unlockedText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  xpBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBadgeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalRarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  modalRarityText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  modalStatValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  modalProgressSection: {
    width: '100%',
    marginBottom: 16,
  },
  modalProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalProgressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalProgressValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  modalProgressBar: {
    height: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 5,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  modalUnlockedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  modalUnlockedText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalLockedSection: {
    marginBottom: 16,
  },
  modalLockedText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
