// Paint the Town Time-Optimized Routes - Route Optimizer Screen

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouteOptimizer } from '../hooks/useRouteOptimizer';
import { Activity, OptimizationStrategy, RouteChange } from '../types/routes';
import { INEFFICIENT_ORDER, STRATEGY_INFO, MOCK_LOCATIONS } from '../mocks/mockRouteData';

interface RouteOptimizerScreenProps {
  navigation?: any;
  route?: { params?: { activities?: Activity[] } };
  onApplyRoute?: (activities: Activity[]) => void;
}

const RouteOptimizerScreen: React.FC<RouteOptimizerScreenProps> = ({
  navigation,
  route: navRoute,
  onApplyRoute,
}) => {
  const {
    activities,
    setActivities,
    optimizationResult,
    optimize,
    isOptimizing,
    strategy,
    setStrategy,
    pendingChanges,
    approveChange,
    rejectChange,
    approveAll,
    rejectAll,
    applyApprovedChanges,
    timeSaved,
    distanceSaved,
    scoreImprovement,
    setStartLocation,
    setEndLocation,
    error,
  } = useRouteOptimizer();

  const [showComparison, setShowComparison] = useState(false);
  const [expandedChangeId, setExpandedChangeId] = useState<string | null>(null);

  useEffect(() => {
    const initial = navRoute?.params?.activities || INEFFICIENT_ORDER;
    setActivities(initial);
    setStartLocation(MOCK_LOCATIONS.hotel);
    setEndLocation(MOCK_LOCATIONS.hotel);
  }, []);

  const handleOptimize = useCallback(async () => {
    const result = await optimize();
    if (result) setShowComparison(true);
  }, [optimize]);

  const handleApplyChanges = useCallback(async () => {
    const newRoute = await applyApprovedChanges();
    if (newRoute) {
      Alert.alert('Route Updated!', 'Your optimized route has been applied.', [
        {
          text: 'Done',
          onPress: () => {
            onApplyRoute?.(newRoute.stops.map((s) => s.activity));
            navigation?.goBack();
          },
        },
      ]);
    }
  }, [applyApprovedChanges, onApplyRoute, navigation]);

  const formatDuration = (min: number) => {
    if (min < 60) return `${min}min`;
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  };

  const renderStrategySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Optimization Strategy</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strategyScroll}>
        {(Object.keys(STRATEGY_INFO) as OptimizationStrategy[]).map((s) => {
          const info = STRATEGY_INFO[s];
          const selected = strategy === s;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.strategyCard, selected && styles.strategyCardSelected]}
              onPress={() => setStrategy(s)}
            >
              <Text style={styles.strategyIcon}>{info.icon}</Text>
              <Text style={[styles.strategyName, selected && styles.strategyNameSelected]}>
                {info.name}
              </Text>
              <Text style={styles.strategyBestFor} numberOfLines={2}>
                {info.bestFor}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderCurrentRoute = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Current Route Order</Text>
      <View style={styles.routeList}>
        {activities.map((activity, idx) => (
          <View key={activity.id} style={styles.routeItem}>
            <View style={styles.routeNumber}>
              <Text style={styles.routeNumberText}>{idx + 1}</Text>
            </View>
            <View style={styles.routeContent}>
              <Text style={styles.routeName}>{activity.name}</Text>
              <Text style={styles.routeMeta}>
                {activity.duration} min • {activity.category}
                {activity.isLocked && ' • 🔒'}
              </Text>
            </View>
            {activity.preferredTimeWindow && (
              <Text style={styles.routeTime}>{activity.preferredTimeWindow.start}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderChangeCard = (change: RouteChange) => {
    const expanded = expandedChangeId === change.id;
    const isPending = pendingChanges.find((c) => c.id === change.id);

    return (
      <View key={change.id} style={styles.changeCard}>
        <TouchableOpacity
          style={styles.changeHeader}
          onPress={() => setExpandedChangeId(expanded ? null : change.id)}
        >
          <View style={styles.changeIcon}>
            <Text style={styles.changeIconText}>↕️</Text>
          </View>
          <View style={styles.changeContent}>
            <Text style={styles.changeName}>{change.activityName}</Text>
            <Text style={styles.changeDesc}>
              Move from #{change.fromPosition} → #{change.toPosition}
            </Text>
          </View>
          <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.changeDetails}>
            <Text style={styles.changeReason}>💡 {change.reason}</Text>
            <Text style={styles.changeImpact}>📊 {change.impact}</Text>
          </View>
        )}

        {isPending && (
          <View style={styles.changeActions}>
            <TouchableOpacity style={styles.approveBtn} onPress={() => approveChange(change.id)}>
              <Text style={styles.approveBtnText}>✓ Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectChange(change.id)}>
              <Text style={styles.rejectBtnText}>✕ Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderOptimizationResults = () => {
    if (!optimizationResult) return null;

    return (
      <>
        {/* Savings Summary */}
        <View style={styles.savingsCard}>
          <View style={styles.savingsMetric}>
            <Text style={styles.savingsValue}>-{formatDuration(timeSaved)}</Text>
            <Text style={styles.savingsLabel}>Travel Time</Text>
          </View>
          <View style={styles.savingsDivider} />
          <View style={styles.savingsMetric}>
            <Text style={styles.savingsValue}>-{(distanceSaved / 1000).toFixed(1)}km</Text>
            <Text style={styles.savingsLabel}>Distance</Text>
          </View>
          <View style={styles.savingsDivider} />
          <View style={styles.savingsMetric}>
            <Text style={[styles.savingsValue, scoreImprovement > 0 && styles.savingsPositive]}>
              +{scoreImprovement}
            </Text>
            <Text style={styles.savingsLabel}>Score</Text>
          </View>
        </View>

        {/* Warnings */}
        {optimizationResult.warnings.length > 0 && (
          <View style={styles.warningsBox}>
            {optimizationResult.warnings.map((w, i) => (
              <View key={i} style={styles.warningItem}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>{w.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Changes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Proposed Changes</Text>
            <Text style={styles.changeCount}>
              {pendingChanges.length} of {optimizationResult.changes.length} pending
            </Text>
          </View>

          {optimizationResult.changes.map(renderChangeCard)}

          <View style={styles.bulkActions}>
            <TouchableOpacity style={styles.bulkApprove} onPress={approveAll}>
              <Text style={styles.bulkApproveText}>Approve All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bulkReject} onPress={rejectAll}>
              <Text style={styles.bulkRejectText}>Reject All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Apply Button */}
        {pendingChanges.length < optimizationResult.changes.length && (
          <TouchableOpacity style={styles.applyButton} onPress={handleApplyChanges}>
            <Text style={styles.applyButtonText}>
              Apply {optimizationResult.changes.length - pendingChanges.length} Changes
            </Text>
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#00b894', '#00cec9']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Route Optimizer</Text>
          <Text style={styles.headerSubtitle}>
            {activities.length} activities •{' '}
            {showComparison ? 'Review changes' : 'Ready to optimize'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!showComparison ? (
          <>
            {renderStrategySelector()}
            {renderCurrentRoute()}
            <TouchableOpacity
              style={[styles.optimizeButton, isOptimizing && styles.optimizeButtonDisabled]}
              onPress={handleOptimize}
              disabled={isOptimizing || activities.length < 2}
            >
              {isOptimizing ? (
                <View style={styles.optimizingRow}>
                  <ActivityIndicator color="#fff" style={{ marginRight: 12 }} />
                  <Text style={styles.optimizeButtonText}>Calculating...</Text>
                </View>
              ) : (
                <Text style={styles.optimizeButtonText}>✨ Optimize Route</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {renderOptimizationResults()}
            <TouchableOpacity style={styles.backToRoute} onPress={() => setShowComparison(false)}>
              <Text style={styles.backToRouteText}>← Back to Route</Text>
            </TouchableOpacity>
          </>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  backButton: { marginBottom: 16 },
  backButtonText: { fontSize: 28, color: '#fff' },
  headerContent: {},
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)' },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  changeCount: { fontSize: 14, color: '#888' },
  strategyScroll: { marginBottom: 8 },
  strategyCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  strategyCardSelected: { borderColor: '#00b894', backgroundColor: '#E8FFF8' },
  strategyIcon: { fontSize: 28, marginBottom: 8 },
  strategyName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  strategyNameSelected: { color: '#00b894' },
  strategyBestFor: { fontSize: 11, color: '#888', lineHeight: 15 },
  routeList: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  routeNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00b894',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeNumberText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  routeContent: { flex: 1 },
  routeName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  routeMeta: { fontSize: 12, color: '#888' },
  routeTime: { fontSize: 13, color: '#00b894', fontWeight: '600' },
  optimizeButton: {
    backgroundColor: '#00b894',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  optimizeButtonDisabled: { backgroundColor: '#ccc' },
  optimizeButtonText: { fontSize: 17, fontWeight: '600', color: '#fff' },
  optimizingRow: { flexDirection: 'row', alignItems: 'center' },
  savingsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  savingsMetric: { flex: 1, alignItems: 'center' },
  savingsDivider: { width: 1, backgroundColor: '#e8e8e8', marginHorizontal: 12 },
  savingsValue: { fontSize: 20, fontWeight: '700', color: '#00b894', marginBottom: 4 },
  savingsPositive: { color: '#00b894' },
  savingsLabel: { fontSize: 12, color: '#888' },
  warningsBox: { backgroundColor: '#FFF9E6', borderRadius: 12, padding: 12, marginBottom: 16 },
  warningItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  warningIcon: { marginRight: 8 },
  warningText: { flex: 1, fontSize: 13, color: '#856404', lineHeight: 18 },
  changeCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  changeHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  changeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8FFF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  changeIconText: { fontSize: 18 },
  changeContent: { flex: 1 },
  changeName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  changeDesc: { fontSize: 13, color: '#888' },
  expandIcon: { color: '#ccc', fontSize: 12 },
  changeDetails: { padding: 16, paddingTop: 0, backgroundColor: '#f8f9fa' },
  changeReason: { fontSize: 13, color: '#666', marginBottom: 8, lineHeight: 18 },
  changeImpact: { fontSize: 13, color: '#00b894', fontWeight: '500' },
  changeActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  approveBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: '#E8FFF8' },
  approveBtnText: { fontSize: 14, fontWeight: '600', color: '#00b894' },
  rejectBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: '#FFF5F5' },
  rejectBtnText: { fontSize: 14, fontWeight: '600', color: '#FF3B30' },
  bulkActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  bulkApprove: {
    flex: 1,
    backgroundColor: '#E8FFF8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  bulkApproveText: { fontSize: 14, fontWeight: '600', color: '#00b894' },
  bulkReject: {
    flex: 1,
    backgroundColor: '#FFF5F5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  bulkRejectText: { fontSize: 14, fontWeight: '600', color: '#FF3B30' },
  applyButton: {
    backgroundColor: '#00b894',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  applyButtonText: { fontSize: 17, fontWeight: '600', color: '#fff' },
  backToRoute: { paddingVertical: 16, alignItems: 'center' },
  backToRouteText: { fontSize: 15, color: '#888' },
  errorBox: { backgroundColor: '#FFF5F5', borderRadius: 12, padding: 16, marginVertical: 16 },
  errorText: { fontSize: 14, color: '#FF3B30' },
  bottomPadding: { height: 40 },
});

export default RouteOptimizerScreen;
