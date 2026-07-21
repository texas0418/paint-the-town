// Paint the Town Preference Sync - Main Dashboard Screen

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePreferenceSync } from '../hooks/usePreferenceSync';
import { PreferenceCategory, LearningInsight } from '../types/preferences';
import { PREFERENCE_CATEGORIES, STRENGTH_COLORS, SOURCE_LABELS } from '../mocks/mockPreferenceData';

interface PreferenceSyncScreenProps {
  navigation?: any;
  onEditCategory?: (category: PreferenceCategory) => void;
  onMergeCompanions?: () => void;
  onViewSuggestionSettings?: () => void;
}

// eslint-disable-next-line max-lines-per-function -- tracked in #1
const PreferenceSyncScreen: React.FC<PreferenceSyncScreenProps> = ({
  navigation,
  onEditCategory,
  onMergeCompanions,
  onViewSuggestionSettings,
}) => {
  const {
    isReady,
    preferences,
    companions,
    syncStatus,
    lastSyncTime,
    pendingInsights,
    learningInsights,
    getCategoryCompleteness,
    syncNow,
    applyInsight,
    rejectInsight,
    exportPreferences,
    refresh,
  } = usePreferenceSync();

  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  // Calculate overall completeness
  const overallCompleteness = useMemo(() => {
    if (!isReady) return 0;
    const categories: PreferenceCategory[] = [
      'dining',
      'activities',
      'accommodation',
      'transportation',
      'budget',
      'timing',
      'accessibility',
      'social',
    ];
    const total = categories.reduce((sum, cat) => sum + getCategoryCompleteness(cat), 0);
    return Math.round(total / categories.length);
  }, [isReady, getCategoryCompleteness]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await syncNow();
      Alert.alert('Sync Complete', 'Your preferences have been synced successfully.');
    } catch (error) {
      Alert.alert('Sync Failed', 'Unable to sync preferences. Please try again.');
    }
    setSyncing(false);
  }, [syncNow]);

  const handleExport = useCallback(async () => {
    const json = await exportPreferences();
    if (json) {
      try {
        await Share.share({
          message: json,
          title: 'Paint the Town Preferences Export',
        });
      } catch (error) {
        Alert.alert('Export Failed', 'Unable to share preferences.');
      }
    }
  }, [exportPreferences]);

  const handleApplyInsight = useCallback(
    async (insightId: string) => {
      const success = await applyInsight(insightId);
      if (success) {
        Alert.alert('Applied', 'Preference updated based on your activity.');
      }
    },
    [applyInsight]
  );

  const handleRejectInsight = useCallback(
    async (insightId: string) => {
      await rejectInsight(insightId);
    },
    [rejectInsight]
  );

  const formatLastSync = useCallback((timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  }, []);

  const getSyncStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'synced':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'syncing':
        return '#007AFF';
      case 'error':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  }, []);

  const renderHeader = () => (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Preference Sync</Text>
        <Text style={styles.headerSubtitle}>Personalize your travel experience</Text>

        {/* Sync Status Badge */}
        <View style={styles.syncBadge}>
          <View style={[styles.syncDot, { backgroundColor: getSyncStatusColor(syncStatus) }]} />
          <Text style={styles.syncText}>
            {syncStatus === 'synced'
              ? 'Synced'
              : syncStatus === 'pending'
                ? 'Changes pending'
                : syncStatus}
          </Text>
          <Text style={styles.syncTime}>• {formatLastSync(lastSyncTime)}</Text>
        </View>
      </View>

      {/* Completeness Ring */}
      <View style={styles.completenessContainer}>
        <View style={styles.completenessRing}>
          <Text style={styles.completenessValue}>{overallCompleteness}%</Text>
          <Text style={styles.completenessLabel}>Complete</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity
        style={[styles.quickAction, syncing && styles.quickActionDisabled]}
        onPress={handleSync}
        disabled={syncing}
      >
        {syncing ? (
          <ActivityIndicator color="#667eea" size="small" />
        ) : (
          <Text style={styles.quickActionIcon}>🔄</Text>
        )}
        <Text style={styles.quickActionText}>Sync Now</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickAction}
        onPress={onMergeCompanions || (() => navigation?.navigate('CompanionMerge'))}
      >
        <Text style={styles.quickActionIcon}>👥</Text>
        <Text style={styles.quickActionText}>Merge</Text>
        {companions.length > 0 && (
          <View style={styles.quickActionBadge}>
            <Text style={styles.quickActionBadgeText}>{companions.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickAction}
        onPress={onViewSuggestionSettings || (() => navigation?.navigate('SuggestionSettings'))}
      >
        <Text style={styles.quickActionIcon}>⚙️</Text>
        <Text style={styles.quickActionText}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.quickAction} onPress={handleExport}>
        <Text style={styles.quickActionIcon}>📤</Text>
        <Text style={styles.quickActionText}>Export</Text>
      </TouchableOpacity>
    </View>
  );

  const renderInsightCard = (insight: LearningInsight) => {
    const isExpanded = expandedInsight === insight.id;

    return (
      <TouchableOpacity
        key={insight.id}
        style={styles.insightCard}
        onPress={() => setExpandedInsight(isExpanded ? null : insight.id)}
        activeOpacity={0.8}
      >
        <View style={styles.insightHeader}>
          <View style={styles.insightIcon}>
            <Text style={styles.insightIconText}>💡</Text>
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightText}>{insight.insight}</Text>
            <View style={styles.insightMeta}>
              <View style={[styles.confidenceBadge, { opacity: insight.confidence }]}>
                <Text style={styles.confidenceText}>
                  {Math.round(insight.confidence * 100)}% confident
                </Text>
              </View>
            </View>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.insightExpanded}>
            <Text style={styles.insightSuggestion}>
              Suggested: Update {insight.suggestedUpdate.field} preference
            </Text>
            <Text style={styles.insightReason}>{insight.suggestedUpdate.reason}</Text>

            <View style={styles.insightActions}>
              <TouchableOpacity
                style={styles.insightApply}
                onPress={() => handleApplyInsight(insight.id)}
              >
                <Text style={styles.insightApplyText}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.insightReject}
                onPress={() => handleRejectInsight(insight.id)}
              >
                <Text style={styles.insightRejectText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderLearningInsights = () => {
    if (pendingInsights.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Learning Insights</Text>
          <View style={styles.insightCount}>
            <Text style={styles.insightCountText}>{pendingInsights.length} new</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.insightsScroll}
        >
          {pendingInsights.map(renderInsightCard)}
        </ScrollView>
      </View>
    );
  };

  const renderCategoryCard = (category: (typeof PREFERENCE_CATEGORIES)[0]) => {
    const completeness = getCategoryCompleteness(category.id as PreferenceCategory);

    return (
      <TouchableOpacity
        key={category.id}
        style={styles.categoryCard}
        onPress={() =>
          onEditCategory?.(category.id as PreferenceCategory) ||
          navigation?.navigate('PreferenceEditor', { category: category.id })
        }
        activeOpacity={0.7}
      >
        <View style={styles.categoryIcon}>
          <Text style={styles.categoryIconText}>{category.icon}</Text>
        </View>

        <View style={styles.categoryContent}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryDescription} numberOfLines={1}>
            {category.description}
          </Text>

          {/* Progress bar */}
          <View style={styles.categoryProgress}>
            <View style={styles.categoryProgressBg}>
              <View style={[styles.categoryProgressFill, { width: `${completeness}%` }]} />
            </View>
            <Text style={styles.categoryProgressText}>{completeness}%</Text>
          </View>
        </View>

        <Text style={styles.categoryChevron}>›</Text>
      </TouchableOpacity>
    );
  };

  const renderCategories = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Preference Categories</Text>
      </View>

      <View style={styles.categoriesGrid}>{PREFERENCE_CATEGORIES.map(renderCategoryCard)}</View>
    </View>
  );

  const renderCompanions = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Travel Companions</Text>
        <TouchableOpacity
          style={styles.addCompanionBtn}
          onPress={() => navigation?.navigate('AddCompanion')}
        >
          <Text style={styles.addCompanionText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {companions.length === 0 ? (
        <View style={styles.emptyCompanions}>
          <Text style={styles.emptyCompanionsIcon}>👥</Text>
          <Text style={styles.emptyCompanionsText}>
            Add travel companions to merge preferences for group trips
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.companionsScroll}
        >
          {companions.map((companion) => (
            <TouchableOpacity
              key={companion.id}
              style={styles.companionCard}
              onPress={() => navigation?.navigate('CompanionDetail', { companionId: companion.id })}
            >
              <View style={styles.companionAvatar}>
                <Text style={styles.companionAvatarText}>
                  {companion.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.companionName}>{companion.name}</Text>
              <Text style={styles.companionRelation}>{companion.relationship}</Text>
              {companion.syncEnabled ? (
                <View style={styles.companionSynced}>
                  <Text style={styles.companionSyncedText}>✓ Synced</Text>
                </View>
              ) : (
                <View style={styles.companionNotSynced}>
                  <Text style={styles.companionNotSyncedText}>Invite</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderStats = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {learningInsights.filter((i) => i.status === 'accepted').length}
          </Text>
          <Text style={styles.statLabel}>Insights Applied</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{companions.filter((c) => c.syncEnabled).length}</Text>
          <Text style={styles.statLabel}>Synced Companions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{preferences?.version || 0}</Text>
          <Text style={styles.statLabel}>Preference Updates</Text>
        </View>
      </View>
    </View>
  );

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {renderHeader()}
      {renderQuickActions()}
      {renderLearningInsights()}
      {renderCategories()}
      {renderCompanions()}
      {renderStats()}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  syncText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  syncTime: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  completenessContainer: {
    alignItems: 'center',
  },
  completenessRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  completenessValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  completenessLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickAction: {
    alignItems: 'center',
    padding: 8,
    minWidth: 70,
  },
  quickActionDisabled: {
    opacity: 0.6,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  quickActionBadge: {
    position: 'absolute',
    top: 0,
    right: 10,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  insightCount: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  insightCountText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  insightsScroll: {
    paddingRight: 16,
  },
  insightCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightIconText: {
    fontSize: 20,
  },
  insightContent: {
    flex: 1,
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  insightMeta: {
    flexDirection: 'row',
  },
  confidenceBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '500',
  },
  insightExpanded: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  insightSuggestion: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  insightReason: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  insightActions: {
    flexDirection: 'row',
  },
  insightApply: {
    flex: 1,
    backgroundColor: '#667eea',
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  insightApplyText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  insightReject: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  insightRejectText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  categoriesGrid: {
    gap: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  categoryProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryProgressBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginRight: 8,
  },
  categoryProgressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  categoryProgressText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
    width: 35,
  },
  categoryChevron: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 8,
  },
  addCompanionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#667eea',
    borderRadius: 12,
  },
  addCompanionText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  emptyCompanions: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyCompanionsIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyCompanionsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  companionsScroll: {
    paddingRight: 16,
  },
  companionCard: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  companionAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  companionAvatarText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  companionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  companionRelation: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  companionSynced: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  companionSyncedText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
  companionNotSynced: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  companionNotSyncedText: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});

export default PreferenceSyncScreen;
