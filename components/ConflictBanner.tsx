import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Lightbulb,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import {
  ConflictCheckResult,
  TimeConflict,
  getSeverityColor,
} from '@/types/timeConflicts';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ConflictBannerProps {
  conflictResult: ConflictCheckResult;
  onConflictPress?: (conflict: TimeConflict) => void;
  onDismiss?: () => void;
  collapsible?: boolean;
  showAllByDefault?: boolean;
  maxVisibleConflicts?: number;
}

// eslint-disable-next-line complexity -- tracked in #1
export default function ConflictBanner({
  conflictResult,
  onConflictPress,
  onDismiss,
  collapsible = true,
  showAllByDefault = false,
  maxVisibleConflicts = 3,
}: ConflictBannerProps) {
  const [isExpanded, setIsExpanded] = useState(showAllByDefault);
  const [isDismissed, setIsDismissed] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { hasErrors, hasWarnings, conflicts, summary } = conflictResult;

  // Don't render if no conflicts or dismissed
  if (conflicts.length === 0 || isDismissed) return null;

  // Only show errors and warnings in the banner (not infos)
  const significantConflicts = conflicts.filter(
    c => c.severity === 'error' || c.severity === 'warning'
  );

  if (significantConflicts.length === 0) return null;

  // Animation effects for errors
  // eslint-disable-next-line react-hooks/rules-of-hooks -- tracked in #2
  useEffect(() => {
    if (hasErrors) {
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [hasErrors]);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleDismiss = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDismissed(true);
    onDismiss?.();
  };

  const getBannerStyle = () => {
    if (hasErrors) {
      return {
        backgroundColor: `${colors.error}10`,
        borderColor: colors.error,
      };
    }
    if (hasWarnings) {
      return {
        backgroundColor: `${colors.warning}10`,
        borderColor: colors.warning,
      };
    }
    return {
      backgroundColor: `${colors.primary}10`,
      borderColor: colors.primary,
    };
  };

  const getHeaderIcon = () => {
    if (hasErrors) {
      return <AlertOctagon size={20} color={colors.error} />;
    }
    if (hasWarnings) {
      return <AlertTriangle size={20} color={colors.warning} />;
    }
    return <Info size={20} color={colors.primary} />;
  };

  const getHeaderText = () => {
    const parts: string[] = [];
    if (summary.errors > 0) {
      parts.push(`${summary.errors} ${summary.errors === 1 ? 'conflict' : 'conflicts'}`);
    }
    if (summary.warnings > 0) {
      parts.push(`${summary.warnings} ${summary.warnings === 1 ? 'warning' : 'warnings'}`);
    }
    return parts.join(', ');
  };

  const visibleConflicts = isExpanded
    ? significantConflicts
    : significantConflicts.slice(0, maxVisibleConflicts);

  const hasMoreConflicts = significantConflicts.length > maxVisibleConflicts;

  return (
    <Animated.View
      style={[
        styles.container,
        getBannerStyle(),
        {
          transform: [
            { translateX: shakeAnim },
            { scale: pulseAnim },
          ],
        },
      ]}
    >
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={collapsible ? toggleExpand : undefined}
        activeOpacity={collapsible ? 0.7 : 1}
      >
        <View style={styles.headerLeft}>
          {getHeaderIcon()}
          <Text style={[styles.headerText, hasErrors && { color: colors.error }]}>
            {getHeaderText()}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {onDismiss && (
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.dismissButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          {collapsible && hasMoreConflicts && (
            isExpanded ? (
              <ChevronUp size={18} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={18} color={colors.textSecondary} />
            )
          )}
        </View>
      </TouchableOpacity>

      {/* Conflict list */}
      <View style={styles.conflictList}>
        {visibleConflicts.map((conflict, index) => (
          <TouchableOpacity
            key={conflict.id}
            style={[
              styles.conflictItem,
              index === visibleConflicts.length - 1 && styles.conflictItemLast,
            ]}
            onPress={() => onConflictPress?.(conflict)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.severityDot,
                { backgroundColor: getSeverityColor(conflict.severity) },
              ]}
            />
            <View style={styles.conflictContent}>
              <Text style={styles.conflictMessage} numberOfLines={2}>
                {conflict.shortMessage}: {conflict.message.split('"').slice(1, 2).join('')}
              </Text>
              {conflict.suggestedFix && (
                <View style={styles.suggestionRow}>
                  <Lightbulb size={12} color={colors.textTertiary} />
                  <Text style={styles.suggestionText} numberOfLines={1}>
                    {conflict.suggestedFix}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Show more button */}
      {!isExpanded && hasMoreConflicts && (
        <TouchableOpacity style={styles.showMoreButton} onPress={toggleExpand}>
          <Text style={styles.showMoreText}>
            +{significantConflicts.length - maxVisibleConflicts} more issues
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dismissButton: {
    padding: 4,
  },
  conflictList: {
    paddingHorizontal: 12,
  },
  conflictItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  conflictItemLast: {
    paddingBottom: 12,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    marginRight: 10,
  },
  conflictContent: {
    flex: 1,
  },
  conflictMessage: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  suggestionText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
    flex: 1,
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
});
