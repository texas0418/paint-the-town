// Paint the Town Route Optimizer - Route Comparison Component

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Route, OptimizationResult } from '../types/routes';

interface RouteComparisonCardProps {
  result: OptimizationResult;
  showDetails?: boolean;
}

const RouteComparisonCard: React.FC<RouteComparisonCardProps> = ({
  result,
  showDetails = false,
}) => {
  const { originalRoute, optimizedRoute, timeSaved, distanceSaved, efficiencyGain } = result;

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const renderComparisonRow = (
    label: string,
    originalValue: string,
    optimizedValue: string,
    improvement: string,
    isPositive: boolean = true
  ) => (
    <View style={styles.comparisonRow}>
      <Text style={styles.comparisonLabel}>{label}</Text>
      <View style={styles.comparisonValues}>
        <Text style={styles.originalValue}>{originalValue}</Text>
        <Text style={styles.arrow}>→</Text>
        <Text style={[styles.optimizedValue, isPositive && styles.optimizedValuePositive]}>
          {optimizedValue}
        </Text>
        <View style={[styles.improvementBadge, isPositive && styles.improvementBadgePositive]}>
          <Text style={[styles.improvementText, isPositive && styles.improvementTextPositive]}>
            {improvement}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>✨</Text>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Route Optimized</Text>
          <Text style={styles.headerSubtitle}>
            {result.reorderedCount} activities reordered
          </Text>
        </View>
        <View style={styles.efficiencyBadge}>
          <Text style={styles.efficiencyValue}>+{efficiencyGain}%</Text>
          <Text style={styles.efficiencyLabel}>efficiency</Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>⏱️</Text>
          <Text style={styles.metricValue}>{timeSaved}</Text>
          <Text style={styles.metricLabel}>min saved</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>📍</Text>
          <Text style={styles.metricValue}>{formatDistance(distanceSaved)}</Text>
          <Text style={styles.metricLabel}>shorter</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>🔄</Text>
          <Text style={styles.metricValue}>{result.changes.length}</Text>
          <Text style={styles.metricLabel}>changes</Text>
        </View>
      </View>

      {/* Detailed Comparison */}
      {showDetails && (
        <View style={styles.detailedComparison}>
          <Text style={styles.sectionTitle}>Detailed Comparison</Text>
          
          {renderComparisonRow(
            'Total Duration',
            formatDuration(originalRoute.totalDuration),
            formatDuration(optimizedRoute.totalDuration),
            `-${timeSaved}min`,
            true
          )}
          
          {renderComparisonRow(
            'Travel Time',
            formatDuration(originalRoute.totalTravelTime),
            formatDuration(optimizedRoute.totalTravelTime),
            `-${originalRoute.totalTravelTime - optimizedRoute.totalTravelTime}min`,
            true
          )}
          
          {renderComparisonRow(
            'Total Distance',
            formatDistance(originalRoute.totalDistance),
            formatDistance(optimizedRoute.totalDistance),
            `-${formatDistance(distanceSaved)}`,
            true
          )}
          
          {renderComparisonRow(
            'Efficiency',
            `${originalRoute.efficiency}%`,
            `${optimizedRoute.efficiency}%`,
            `+${efficiencyGain}%`,
            true
          )}
          
          {renderComparisonRow(
            'Warnings',
            `${originalRoute.warnings.length}`,
            `${optimizedRoute.warnings.length}`,
            originalRoute.warnings.length > optimizedRoute.warnings.length 
              ? `-${originalRoute.warnings.length - optimizedRoute.warnings.length}`
              : '0',
            originalRoute.warnings.length > optimizedRoute.warnings.length
          )}
        </View>
      )}

      {/* Timeline Preview */}
      <View style={styles.timelinePreview}>
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineLabel}>Original</Text>
          <Text style={styles.timelineLabel}>Optimized</Text>
        </View>
        <View style={styles.timelineRows}>
          <View style={styles.timelineColumn}>
            {originalRoute.activities.slice(0, 4).map((activity, idx) => (
              <View key={idx} style={styles.timelineItem}>
                <Text style={styles.timelineNumber}>{idx + 1}</Text>
                <Text style={styles.timelineName} numberOfLines={1}>
                  {activity.name}
                </Text>
              </View>
            ))}
            {originalRoute.activities.length > 4 && (
              <Text style={styles.moreText}>
                +{originalRoute.activities.length - 4} more
              </Text>
            )}
          </View>
          
          <View style={styles.timelineArrows}>
            {optimizedRoute.activities.slice(0, 4).map((activity, idx) => {
              const originalIdx = originalRoute.activities.findIndex(a => a.id === activity.id);
              const moved = originalIdx !== idx;
              return (
                <View key={idx} style={styles.arrowContainer}>
                  <Text style={[styles.timelineArrow, moved && styles.timelineArrowMoved]}>
                    {moved ? '↗' : '→'}
                  </Text>
                </View>
              );
            })}
          </View>
          
          <View style={styles.timelineColumn}>
            {optimizedRoute.activities.slice(0, 4).map((activity, idx) => {
              const originalIdx = originalRoute.activities.findIndex(a => a.id === activity.id);
              const moved = originalIdx !== idx;
              return (
                <View key={idx} style={[styles.timelineItem, moved && styles.timelineItemMoved]}>
                  <Text style={[styles.timelineNumber, moved && styles.timelineNumberMoved]}>
                    {idx + 1}
                  </Text>
                  <Text style={[styles.timelineName, moved && styles.timelineNameMoved]} numberOfLines={1}>
                    {activity.name}
                  </Text>
                </View>
              );
            })}
            {optimizedRoute.activities.length > 4 && (
              <Text style={styles.moreText}>
                +{optimizedRoute.activities.length - 4} more
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F3FF',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerIconText: {
    fontSize: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  efficiencyBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  efficiencyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  efficiencyLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  metricLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  detailedComparison: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  comparisonValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalValue: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  arrow: {
    fontSize: 12,
    color: '#ccc',
    marginRight: 8,
  },
  optimizedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  optimizedValuePositive: {
    color: '#34C759',
  },
  improvementBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  improvementBadgePositive: {
    backgroundColor: '#E8F5E9',
  },
  improvementText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  improvementTextPositive: {
    color: '#34C759',
  },
  timelinePreview: {
    padding: 16,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  timelineLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineRows: {
    flexDirection: 'row',
  },
  timelineColumn: {
    flex: 1,
  },
  timelineArrows: {
    width: 40,
    alignItems: 'center',
  },
  arrowContainer: {
    height: 36,
    justifyContent: 'center',
  },
  timelineArrow: {
    fontSize: 16,
    color: '#ccc',
  },
  timelineArrowMoved: {
    color: '#34C759',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  timelineItemMoved: {
    backgroundColor: '#E8F5E9',
  },
  timelineNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  timelineNumberMoved: {
    backgroundColor: '#34C759',
    color: '#fff',
  },
  timelineName: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  timelineNameMoved: {
    color: '#2E7D32',
    fontWeight: '500',
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default RouteComparisonCard;
