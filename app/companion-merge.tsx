// Paint the Town Preference Sync - Companion Merge Screen

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePreferenceSync } from '../hooks/usePreferenceSync';
import {
  Companion,
  PreferenceConflict,
  ConflictResolution,
  MergedPreferences,
} from '../types/preferences';
import { MOCK_COMPANIONS, MOCK_CONFLICTS } from '../mocks/mockPreferenceData';

interface CompanionMergeScreenProps {
  navigation?: any;
  tripId?: string;
  onMergeComplete?: (merged: MergedPreferences) => void;
}

const RESOLUTION_OPTIONS: Array<{
  value: ConflictResolution;
  label: string;
  description: string;
}> = [
  { value: 'user_wins', label: 'My Preference', description: 'Use your preference' },
  { value: 'companion_wins', label: 'Their Preference', description: "Use companion's preference" },
  { value: 'strongest_wins', label: 'Strongest', description: 'Use whoever feels more strongly' },
  { value: 'average', label: 'Middle Ground', description: 'Find a compromise' },
  { value: 'either', label: 'Either Works', description: 'Accept both options' },
];

// eslint-disable-next-line max-lines-per-function -- tracked in #1
const CompanionMergeScreen: React.FC<CompanionMergeScreenProps> = ({
  navigation,
  tripId,
  onMergeComplete,
// eslint-disable-next-line complexity -- tracked in #1
}) => {
  const {
    preferences,
    companions: realCompanions,
    mergeWithCompanions,
    resolveConflict,
    mergedPreferences,
    conflicts,
    clearMergedPreferences,
  } = usePreferenceSync();

  // Use mock data if no real companions
  const companions = realCompanions.length > 0 ? realCompanions : MOCK_COMPANIONS;
  const displayConflicts = conflicts.length > 0 ? conflicts : MOCK_CONFLICTS;

  const [selectedCompanions, setSelectedCompanions] = useState<Set<string>>(new Set());
  const [isMerging, setIsMerging] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const [equalWeight, setEqualWeight] = useState(true);
  const [weights, setWeights] = useState<Record<string, number>>({});

  const syncedCompanions = useMemo(() => {
    return companions.filter((c) => c.syncEnabled && c.preferences);
  }, [companions]);

  const toggleCompanion = useCallback((companionId: string) => {
    setSelectedCompanions((prev) => {
      const next = new Set(prev);
      if (next.has(companionId)) {
        next.delete(companionId);
      } else {
        next.add(companionId);
      }
      return next;
    });
  }, []);

  const handleMerge = useCallback(async () => {
    if (selectedCompanions.size === 0) {
      Alert.alert(
        'Select Companions',
        'Please select at least one companion to merge preferences with.'
      );
      return;
    }

    setIsMerging(true);
    try {
      const companionIds = Array.from(selectedCompanions);
      const weightValues = equalWeight ? undefined : companionIds.map((id) => weights[id] || 0.5);

      const merged = await mergeWithCompanions(companionIds, weightValues);

      if (merged) {
        setShowConflicts(true);
        if (merged.unresolvedConflicts === 0) {
          Alert.alert('Merge Complete', 'Preferences merged successfully with no conflicts!', [
            { text: 'OK' },
          ]);
        }
      }
    } catch (error) {
      Alert.alert('Merge Failed', 'Unable to merge preferences. Please try again.');
    }
    setIsMerging(false);
  }, [selectedCompanions, equalWeight, weights, mergeWithCompanions]);

  const handleResolveConflict = useCallback(
    async (conflictId: string, resolution: ConflictResolution) => {
      await resolveConflict(conflictId, resolution);
    },
    [resolveConflict]
  );

  const handleComplete = useCallback(() => {
    if (mergedPreferences) {
      onMergeComplete?.(mergedPreferences);
    }
    navigation?.goBack();
  }, [mergedPreferences, onMergeComplete, navigation]);

  const unresolvedCount = useMemo(() => {
    return displayConflicts.filter((c) => !c.resolvedValue).length;
  }, [displayConflicts]);

  const renderCompanionCard = (companion: Companion) => {
    const isSelected = selectedCompanions.has(companion.id);
    const hasSyncedPrefs = companion.syncEnabled && companion.preferences;

    return (
      <TouchableOpacity
        key={companion.id}
        style={[
          styles.companionCard,
          isSelected && styles.companionCardSelected,
          !hasSyncedPrefs && styles.companionCardDisabled,
        ]}
        onPress={() => hasSyncedPrefs && toggleCompanion(companion.id)}
        disabled={!hasSyncedPrefs}
        activeOpacity={0.7}
      >
        <View style={styles.companionLeft}>
          <View style={[styles.companionAvatar, isSelected && styles.companionAvatarSelected]}>
            <Text style={styles.companionAvatarText}>{companion.name.charAt(0).toUpperCase()}</Text>
          </View>

          <View style={styles.companionInfo}>
            <Text style={styles.companionName}>{companion.name}</Text>
            <Text style={styles.companionRelation}>{companion.relationship}</Text>
            {companion.lastTripTogether && (
              <Text style={styles.companionLastTrip}>
                Last trip: {new Date(companion.lastTripTogether).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.companionRight}>
          {hasSyncedPrefs ? (
            <View style={[styles.syncBadge, isSelected && styles.syncBadgeSelected]}>
              <Text style={[styles.syncBadgeText, isSelected && styles.syncBadgeTextSelected]}>
                {isSelected ? '✓ Selected' : 'Synced'}
              </Text>
            </View>
          ) : (
            <View style={styles.inviteBadge}>
              <Text style={styles.inviteBadgeText}>Invite to Sync</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderWeightSlider = (companion: Companion) => {
    if (!selectedCompanions.has(companion.id) || equalWeight) return null;

    const weight = weights[companion.id] || 0.5;

    return (
      <View style={styles.weightContainer}>
        <Text style={styles.weightLabel}>{companion.name}&apos;s weight:</Text>
        <View style={styles.weightSlider}>
          <TouchableOpacity
            style={styles.weightBtn}
            onPress={() =>
              setWeights((prev) => ({
                ...prev,
                [companion.id]: Math.max(0.1, (prev[companion.id] || 0.5) - 0.1),
              }))
            }
          >
            <Text style={styles.weightBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.weightBar}>
            <View style={[styles.weightFill, { width: `${weight * 100}%` }]} />
          </View>
          <TouchableOpacity
            style={styles.weightBtn}
            onPress={() =>
              setWeights((prev) => ({
                ...prev,
                [companion.id]: Math.min(1, (prev[companion.id] || 0.5) + 0.1),
              }))
            }
          >
            <Text style={styles.weightBtnText}>+</Text>
          </TouchableOpacity>
          <Text style={styles.weightValue}>{Math.round(weight * 100)}%</Text>
        </View>
      </View>
    );
  };

  const renderConflictCard = (conflict: PreferenceConflict) => {
    const isResolved = !!conflict.resolvedValue;

    return (
      <View
        key={conflict.id}
        style={[styles.conflictCard, isResolved && styles.conflictCardResolved]}
      >
        <View style={styles.conflictHeader}>
          <View style={styles.conflictIcon}>
            <Text style={styles.conflictIconText}>{isResolved ? '✓' : '⚠️'}</Text>
          </View>
          <View style={styles.conflictInfo}>
            <Text style={styles.conflictTitle}>{conflict.displayName}</Text>
            <Text style={styles.conflictCategory}>{conflict.category}</Text>
          </View>
          {isResolved && (
            <View style={styles.resolvedBadge}>
              <Text style={styles.resolvedBadgeText}>Resolved</Text>
            </View>
          )}
        </View>

        <View style={styles.conflictComparison}>
          <View style={styles.conflictSide}>
            <Text style={styles.conflictSideLabel}>You</Text>
            <Text style={styles.conflictValue}>{formatConflictValue(conflict.userValue)}</Text>
            <View
              style={[
                styles.strengthBadge,
                { backgroundColor: getStrengthColor(conflict.userStrength) },
              ]}
            >
              <Text style={styles.strengthBadgeText}>{conflict.userStrength}</Text>
            </View>
          </View>

          <View style={styles.conflictVs}>
            <Text style={styles.conflictVsText}>vs</Text>
          </View>

          <View style={styles.conflictSide}>
            <Text style={styles.conflictSideLabel}>{conflict.companionName}</Text>
            <Text style={styles.conflictValue}>{formatConflictValue(conflict.companionValue)}</Text>
            <View
              style={[
                styles.strengthBadge,
                { backgroundColor: getStrengthColor(conflict.companionStrength) },
              ]}
            >
              <Text style={styles.strengthBadgeText}>{conflict.companionStrength}</Text>
            </View>
          </View>
        </View>

        {!isResolved && (
          <View style={styles.resolutionOptions}>
            {RESOLUTION_OPTIONS.slice(0, 3).map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.resolutionBtn}
                onPress={() => handleResolveConflict(conflict.id, option.value)}
              >
                <Text style={styles.resolutionBtnText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const formatConflictValue = (value: any): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) {
      return value.map((v) => v.type || v.style || v).join(', ');
    }
    if (value?.min !== undefined && value?.max !== undefined) {
      return `${value.min} - ${value.max}`;
    }
    if (value?.preferred) return value.preferred;
    return JSON.stringify(value);
  };

  const getStrengthColor = (strength: string): string => {
    const colors: Record<string, string> = {
      must_have: '#FF3B30',
      strong: '#FF9500',
      moderate: '#FFCC00',
      slight: '#34C759',
      neutral: '#8E8E93',
    };
    return colors[strength] || '#8E8E93';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Merge Preferences</Text>
          <Text style={styles.headerSubtitle}>Combine preferences for group travel</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {!showConflicts ? (
          <>
            {/* Companion Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Travel Companions</Text>
              <Text style={styles.sectionSubtitle}>
                Choose companions to merge preferences with
              </Text>

              {syncedCompanions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>👥</Text>
                  <Text style={styles.emptyText}>
                    No companions have synced their preferences yet. Invite them to sync for better
                    group planning!
                  </Text>
                </View>
              ) : (
                syncedCompanions.map(renderCompanionCard)
              )}
            </View>

            {/* Not Synced Companions */}
            {companions.filter((c) => !c.syncEnabled || !c.preferences).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Invite to Sync</Text>
                {companions
                  .filter((c) => !c.syncEnabled || !c.preferences)
                  .map(renderCompanionCard)}
              </View>
            )}

            {/* Weight Options */}
            {selectedCompanions.size > 0 && (
              <View style={styles.section}>
                <View style={styles.weightToggle}>
                  <View>
                    <Text style={styles.weightToggleLabel}>Equal Weight</Text>
                    <Text style={styles.weightToggleDesc}>
                      Give everyone&apos;s preferences equal importance
                    </Text>
                  </View>
                  <Switch
                    value={equalWeight}
                    onValueChange={setEqualWeight}
                    trackColor={{ false: '#ddd', true: '#667eea' }}
                    thumbColor="#fff"
                  />
                </View>

                {!equalWeight && syncedCompanions.map(renderWeightSlider)}
              </View>
            )}

            {/* Merge Button */}
            <TouchableOpacity
              style={[
                styles.mergeButton,
                selectedCompanions.size === 0 && styles.mergeButtonDisabled,
              ]}
              onPress={handleMerge}
              disabled={selectedCompanions.size === 0 || isMerging}
            >
              {isMerging ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mergeButtonText}>
                  Merge{' '}
                  {selectedCompanions.size > 0
                    ? `with ${selectedCompanions.size} companion${selectedCompanions.size > 1 ? 's' : ''}`
                    : 'Preferences'}
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Conflicts View */}
            <View style={styles.section}>
              <View style={styles.conflictSummary}>
                <Text style={styles.conflictSummaryIcon}>
                  {unresolvedCount === 0 ? '✅' : '⚠️'}
                </Text>
                <View>
                  <Text style={styles.conflictSummaryTitle}>
                    {unresolvedCount === 0
                      ? 'All Conflicts Resolved!'
                      : `${unresolvedCount} Conflict${unresolvedCount > 1 ? 's' : ''} to Resolve`}
                  </Text>
                  <Text style={styles.conflictSummarySubtitle}>
                    {displayConflicts.length} total preference differences found
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preference Conflicts</Text>
              {displayConflicts.map(renderConflictCard)}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setShowConflicts(false);
                  clearMergedPreferences();
                }}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, unresolvedCount > 0 && styles.primaryButtonDisabled]}
                onPress={handleComplete}
                disabled={unresolvedCount > 0}
              >
                <Text style={styles.primaryButtonText}>
                  {unresolvedCount > 0 ? 'Resolve Conflicts' : 'Apply Merged Preferences'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  headerContent: {},
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  companionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  companionCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#F5F3FF',
  },
  companionCardDisabled: {
    opacity: 0.6,
  },
  companionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companionAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  companionAvatarSelected: {
    backgroundColor: '#667eea',
  },
  companionAvatarText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#666',
  },
  companionInfo: {
    flex: 1,
  },
  companionName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  companionRelation: {
    fontSize: 14,
    color: '#888',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  companionLastTrip: {
    fontSize: 12,
    color: '#aaa',
  },
  companionRight: {},
  syncBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  syncBadgeSelected: {
    backgroundColor: '#667eea',
  },
  syncBadgeText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  syncBadgeTextSelected: {
    color: '#fff',
  },
  inviteBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  inviteBadgeText: {
    fontSize: 13,
    color: '#E65100',
    fontWeight: '600',
  },
  weightToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  weightToggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  weightToggleDesc: {
    fontSize: 13,
    color: '#888',
  },
  weightContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  weightLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  weightSlider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightBtnText: {
    fontSize: 20,
    color: '#666',
  },
  weightBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  weightFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 4,
  },
  weightValue: {
    width: 40,
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    textAlign: 'right',
  },
  mergeButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  mergeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  mergeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  conflictSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  conflictSummaryIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  conflictSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  conflictSummarySubtitle: {
    fontSize: 14,
    color: '#888',
  },
  conflictCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  conflictCardResolved: {
    borderLeftColor: '#34C759',
    opacity: 0.8,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  conflictIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conflictIconText: {
    fontSize: 18,
  },
  conflictInfo: {
    flex: 1,
  },
  conflictTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  conflictCategory: {
    fontSize: 13,
    color: '#888',
    textTransform: 'capitalize',
  },
  resolvedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resolvedBadgeText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  conflictComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  conflictSide: {
    flex: 1,
    alignItems: 'center',
  },
  conflictSideLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontWeight: '500',
  },
  conflictValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  strengthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  strengthBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  conflictVs: {
    width: 40,
    alignItems: 'center',
  },
  conflictVsText: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '600',
  },
  resolutionOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  resolutionBtn: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  resolutionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  primaryButton: {
    flex: 2,
    backgroundColor: '#667eea',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#ccc',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomPadding: {
    height: 40,
  },
});

export default CompanionMergeScreen;
