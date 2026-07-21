// Anniversary List Screen for Paint the Town
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAnniversary } from '../hooks/useAnniversary';
import { AnniversaryCard } from '../components/AnniversaryCard';
import { UpcomingAnniversary, AnniversaryType } from '../types/anniversary';

interface AnniversaryListScreenProps {
  navigation: any;
}

const TYPE_FILTER_OPTIONS: { value: AnniversaryType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '✨' },
  { value: 'wedding', label: 'Wedding', icon: '💒' },
  { value: 'relationship', label: 'Relationship', icon: '💑' },
  { value: 'engagement', label: 'Engagement', icon: '💍' },
  { value: 'first_date', label: 'First Date', icon: '☕' },
  { value: 'first_trip', label: 'First Trip', icon: '✈️' },
  { value: 'custom', label: 'Custom', icon: '🎉' },
];

export const AnniversaryListScreen: React.FC<AnniversaryListScreenProps> = ({ navigation }) => {
  const { upcomingAnniversaries, stats, unreadReminders, isLoading, loadUpcoming, refresh } =
    useAnniversary();

  const [selectedType, setSelectedType] = useState<AnniversaryType | 'all'>('all');

  const filteredAnniversaries =
    selectedType === 'all'
      ? upcomingAnniversaries
      : upcomingAnniversaries.filter((ua) => ua.anniversary.type === selectedType);

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handleAnniversaryPress = (item: UpcomingAnniversary) => {
    navigation.navigate('AnniversaryDetail', { anniversaryId: item.anniversary.id });
  };

  const handleViewSuggestions = (item: UpcomingAnniversary) => {
    navigation.navigate('Suggestions', { anniversaryId: item.anniversary.id });
  };

  const renderStatsCard = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalAnniversaries}</Text>
            <Text style={styles.statLabel}>Tracked</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.upcomingThisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{unreadReminders.length}</Text>
            <Text style={styles.statLabel}>Reminders</Text>
          </View>
        </View>

        {stats.nextMilestone && (
          <TouchableOpacity
            style={styles.nextMilestoneCard}
            onPress={() =>
              navigation.navigate('AnniversaryDetail', {
                anniversaryId: stats.nextMilestone!.anniversary.id,
              })
            }
          >
            <View style={styles.nextMilestoneIcon}>
              <Text style={styles.milestoneEmoji}>
                {stats.nextMilestone.milestone.level === 'diamond'
                  ? '💎'
                  : stats.nextMilestone.milestone.level === 'platinum'
                    ? '✨'
                    : stats.nextMilestone.milestone.level === 'gold'
                      ? '🏆'
                      : '🎊'}
              </Text>
            </View>
            <View style={styles.nextMilestoneContent}>
              <Text style={styles.nextMilestoneLabel}>Next Milestone</Text>
              <Text style={styles.nextMilestoneName}>{stats.nextMilestone.milestone.name}</Text>
              <Text style={styles.nextMilestoneDays}>
                {stats.nextMilestone.daysUntil === 0
                  ? 'Today!'
                  : `In ${stats.nextMilestone.daysUntil} days`}
              </Text>
            </View>
            <Text style={styles.nextMilestoneArrow}>→</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFilterPills = () => (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={TYPE_FILTER_OPTIONS}
      keyExtractor={(item) => item.value}
      contentContainerStyle={styles.filterContainer}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.filterPill, selectedType === item.value && styles.filterPillActive]}
          onPress={() => setSelectedType(item.value)}
        >
          <Text style={styles.filterIcon}>{item.icon}</Text>
          <Text
            style={[styles.filterLabel, selectedType === item.value && styles.filterLabelActive]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
    />
  );

  const renderHeader = () => (
    <View>
      {renderStatsCard()}
      {renderFilterPills()}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Anniversaries</Text>
        <Text style={styles.sectionCount}>{filteredAnniversaries.length}</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💝</Text>
      <Text style={styles.emptyTitle}>No Anniversaries Yet</Text>
      <Text style={styles.emptySubtitle}>Start tracking special dates with your loved one</Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('AddAnniversary')}
      >
        <Text style={styles.emptyButtonText}>Add Your First Anniversary</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Anniversaries</Text>
          <Text style={styles.headerSubtitle}>Never miss a special moment</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddAnniversary')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredAnniversaries}
        keyExtractor={(item) => item.anniversary.id}
        renderItem={({ item }) => (
          <AnniversaryCard
            item={item}
            onPress={() => handleAnniversaryPress(item)}
            onViewSuggestions={() => handleViewSuggestions(item)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={upcomingAnniversaries.length === 0 ? renderEmptyState : null}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    fontSize: 28,
    color: 'white',
    fontWeight: '300',
    marginTop: -2,
  },
  listContent: {
    paddingBottom: 100,
  },
  statsCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
  },
  nextMilestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  nextMilestoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneEmoji: {
    fontSize: 24,
  },
  nextMilestoneContent: {
    flex: 1,
    marginLeft: 12,
  },
  nextMilestoneLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextMilestoneName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 2,
  },
  nextMilestoneDays: {
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '600',
    marginTop: 2,
  },
  nextMilestoneArrow: {
    fontSize: 18,
    color: '#CCC',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterPillActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  filterLabel: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  filterLabelActive: {
    color: 'white',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sectionCount: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default AnniversaryListScreen;
