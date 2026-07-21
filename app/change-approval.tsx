// Paint the Town Route Optimizer - Change Approval Screen

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouteOptimizer } from '../hooks/useRouteOptimizer';
import { RouteChange, OptimizationResult, ApprovalStatus } from '../types/routes';

interface ChangeApprovalScreenProps {
  navigation?: any;
  onApplyChanges?: () => void;
}

// eslint-disable-next-line max-lines-per-function -- tracked in #1
const ChangeApprovalScreen: React.FC<ChangeApprovalScreenProps> = ({
  navigation,
  onApplyChanges,
}) => {
  const {
    optimizationResult,
    session,
    approveChange,
    rejectChange,
    approveAllChanges,
    rejectAllChanges,
    applyApprovedChanges,
    isLoading,
  } = useRouteOptimizer();

  const [expandedChangeId, setExpandedChangeId] = useState<string | null>(null);

  const changes = optimizationResult?.changes || [];
  const approvals = session?.approvals || [];

  const getApprovalStatus = useCallback(
    (changeId: string): ApprovalStatus => {
      const approval = approvals.find((a) => a.changeId === changeId);
      return approval?.status || 'pending';
    },
    [approvals]
  );

  const stats = useMemo(() => {
    const approved = changes.filter((c) => getApprovalStatus(c.activityId) === 'approved').length;
    const rejected = changes.filter((c) => getApprovalStatus(c.activityId) === 'rejected').length;
    const pending = changes.filter((c) => getApprovalStatus(c.activityId) === 'pending').length;
    return { approved, rejected, pending, total: changes.length };
  }, [changes, getApprovalStatus]);

  const handleApprove = useCallback(
    async (changeId: string) => {
      await approveChange(changeId);
    },
    [approveChange]
  );

  const handleReject = useCallback(
    async (changeId: string) => {
      await rejectChange(changeId);
    },
    [rejectChange]
  );

  const handleApproveAll = useCallback(async () => {
    Alert.alert(
      'Approve All Changes',
      `Are you sure you want to approve all ${stats.pending} pending changes?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          onPress: async () => {
            await approveAllChanges();
          },
        },
      ]
    );
  }, [stats.pending, approveAllChanges]);

  const handleRejectAll = useCallback(async () => {
    Alert.alert(
      'Reject All Changes',
      'Are you sure you want to reject all changes and keep your original route?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject All',
          style: 'destructive',
          onPress: async () => {
            await rejectAllChanges();
            navigation?.goBack();
          },
        },
      ]
    );
  }, [rejectAllChanges, navigation]);

  const handleApply = useCallback(async () => {
    if (stats.approved === 0) {
      Alert.alert('No Changes Approved', 'Please approve at least one change to apply.');
      return;
    }

    Alert.alert(
      'Apply Changes',
      `Apply ${stats.approved} approved change${stats.approved > 1 ? 's' : ''} to your route?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            await applyApprovedChanges();
            onApplyChanges?.();
            navigation?.goBack();
          },
        },
      ]
    );
  }, [stats.approved, applyApprovedChanges, onApplyChanges, navigation]);

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getChangeIcon = (changeType: string): string => {
    const icons: Record<string, string> = {
      reordered: '🔄',
      time_adjusted: '⏰',
      mode_changed: '🚗',
      removed_warning: '✅',
    };
    return icons[changeType] || '📝';
  };

  const getStatusColor = (status: ApprovalStatus): string => {
    const colors: Record<ApprovalStatus, string> = {
      pending: '#FF9500',
      approved: '#34C759',
      rejected: '#FF3B30',
      modified: '#5856D6',
    };
    return colors[status];
  };

  const renderChangeCard = (change: RouteChange) => {
    const status = getApprovalStatus(change.activityId);
    const isExpanded = expandedChangeId === change.activityId;

    return (
      <View
        key={change.activityId}
        style={[
          styles.changeCard,
          status === 'approved' && styles.changeCardApproved,
          status === 'rejected' && styles.changeCardRejected,
        ]}
      >
        <TouchableOpacity
          style={styles.changeHeader}
          onPress={() => setExpandedChangeId(isExpanded ? null : change.activityId)}
          activeOpacity={0.7}
        >
          <View style={styles.changeHeaderLeft}>
            <Text style={styles.changeIcon}>{getChangeIcon(change.changeType)}</Text>
            <View style={styles.changeInfo}>
              <Text style={styles.changeName}>{change.activityName}</Text>
              <Text style={styles.changeType}>
                {change.changeType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.changeDescription}>
          <Text style={styles.descriptionText}>{change.description}</Text>
        </View>

        {isExpanded && (
          <View style={styles.changeDetails}>
            <View style={styles.comparisonContainer}>
              <View style={styles.comparisonSide}>
                <Text style={styles.comparisonLabel}>Before</Text>
                <View style={styles.comparisonBox}>
                  <Text style={styles.comparisonItem}>
                    Position: #{change.before.orderIndex + 1}
                  </Text>
                  <Text style={styles.comparisonItem}>
                    Time: {formatTime(change.before.startTime)}
                  </Text>
                  {change.before.travelMode && (
                    <Text style={styles.comparisonItem}>Travel: {change.before.travelMode}</Text>
                  )}
                </View>
              </View>

              <View style={styles.comparisonArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>

              <View style={styles.comparisonSide}>
                <Text style={styles.comparisonLabel}>After</Text>
                <View style={[styles.comparisonBox, styles.comparisonBoxAfter]}>
                  <Text style={styles.comparisonItem}>
                    Position: #{change.after.orderIndex + 1}
                  </Text>
                  <Text style={styles.comparisonItem}>
                    Time: {formatTime(change.after.startTime)}
                  </Text>
                  {change.after.travelMode && (
                    <Text style={styles.comparisonItem}>Travel: {change.after.travelMode}</Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.benefitContainer}>
              <Text style={styles.benefitLabel}>Benefit</Text>
              <Text style={styles.benefitText}>{change.benefit}</Text>
            </View>
          </View>
        )}

        {status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleReject(change.activityId)}
            >
              <Text style={styles.rejectButtonText}>Keep Original</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => handleApprove(change.activityId)}
            >
              <Text style={styles.approveButtonText}>Accept Change</Text>
            </TouchableOpacity>
          </View>
        )}

        {status !== 'pending' && (
          <TouchableOpacity
            style={styles.undoButton}
            onPress={() =>
              status === 'approved'
                ? handleReject(change.activityId)
                : handleApprove(change.activityId)
            }
          >
            <Text style={styles.undoButtonText}>
              {status === 'approved' ? 'Undo Approval' : 'Reconsider'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!optimizationResult) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No optimization results to review</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Review Changes</Text>
          <Text style={styles.headerSubtitle}>Approve the optimizations you want to apply</Text>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{optimizationResult.timeSaved}</Text>
            <Text style={styles.statLabel}>min saved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round((optimizationResult.distanceSaved / 1000) * 10) / 10}
            </Text>
            <Text style={styles.statLabel}>km saved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>+{optimizationResult.efficiencyGain}%</Text>
            <Text style={styles.statLabel}>efficiency</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFillApproved,
              { width: `${(stats.approved / stats.total) * 100}%` },
            ]}
          />
          <View
            style={[
              styles.progressFillRejected,
              { width: `${(stats.rejected / stats.total) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>
            <Text style={styles.progressApproved}>{stats.approved}</Text> approved
          </Text>
          <Text style={styles.progressLabel}>
            <Text style={styles.progressPending}>{stats.pending}</Text> pending
          </Text>
          <Text style={styles.progressLabel}>
            <Text style={styles.progressRejected}>{stats.rejected}</Text> rejected
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        {stats.pending > 0 && (
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={handleApproveAll}>
              <Text style={styles.quickActionText}>✓ Approve All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionBtn, styles.quickActionBtnSecondary]}
              onPress={handleRejectAll}
            >
              <Text style={styles.quickActionTextSecondary}>✗ Reject All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Changes List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {changes.length} Proposed Change{changes.length !== 1 ? 's' : ''}
          </Text>
          {changes.map(renderChangeCard)}
        </View>

        {/* Recommendations */}
        {optimizationResult.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Recommendations</Text>
            {optimizationResult.recommendations.map((rec) => (
              <View key={rec.id} style={styles.recommendationCard}>
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
                <Text style={styles.recommendationDesc}>{rec.description}</Text>
                <Text style={styles.recommendationImpact}>{rec.impact}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.applyButton, stats.approved === 0 && styles.applyButtonDisabled]}
          onPress={handleApply}
          disabled={isLoading || stats.approved === 0}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.applyButtonText}>
              Apply {stats.approved} Change{stats.approved !== 1 ? 's' : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  headerContent: {
    marginBottom: 20,
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
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  progressContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFillApproved: {
    height: '100%',
    backgroundColor: '#34C759',
  },
  progressFillRejected: {
    height: '100%',
    backgroundColor: '#FF3B30',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 13,
    color: '#888',
  },
  progressApproved: {
    color: '#34C759',
    fontWeight: '600',
  },
  progressPending: {
    color: '#FF9500',
    fontWeight: '600',
  },
  progressRejected: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionBtnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  quickActionTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B30',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  changeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  changeCardApproved: {
    borderLeftColor: '#34C759',
  },
  changeCardRejected: {
    borderLeftColor: '#FF3B30',
    opacity: 0.7,
  },
  changeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  changeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  changeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  changeInfo: {
    flex: 1,
  },
  changeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  changeType: {
    fontSize: 13,
    color: '#888',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  changeDescription: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  changeDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
    backgroundColor: '#fafafa',
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  comparisonSide: {
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    textAlign: 'center',
  },
  comparisonBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  comparisonBoxAfter: {
    borderColor: '#34C759',
    backgroundColor: '#F0FFF4',
  },
  comparisonItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  comparisonArrow: {
    width: 40,
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: '#ccc',
  },
  benefitContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
  },
  benefitLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 14,
    color: '#1B5E20',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  undoButton: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  undoButtonText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  recommendationDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  recommendationImpact: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  applyButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});

export default ChangeApprovalScreen;
