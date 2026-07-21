import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Clock,
  ArrowDownUp,
  Moon,
  Coffee,
  X,
  Lightbulb,
  ChevronRight,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import {
  TimeConflict,
  ConflictType,
  ConflictSeverity,
  getSeverityColor,
  getConflictIcon,
} from '@/types/timeConflicts';

interface ConflictIndicatorProps {
  conflicts: TimeConflict[];
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  onPress?: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  AlertOctagon,
  AlertTriangle,
  Info,
  Clock,
  ArrowDownUp,
  Moon,
  Coffee,
};

export default function ConflictIndicator({
  conflicts,
  size = 'medium',
  showCount = true,
  onPress,
}: ConflictIndicatorProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Filter out info-level conflicts for the indicator
  const significantConflicts = conflicts.filter(
    c => c.severity === 'error' || c.severity === 'warning'
  );

  if (significantConflicts.length === 0) return null;

  // Get the most severe conflict
  const hasError = significantConflicts.some(c => c.severity === 'error');
  const primarySeverity: ConflictSeverity = hasError ? 'error' : 'warning';
  const primaryColor = getSeverityColor(primarySeverity);

  // Pulse animation for errors
  // eslint-disable-next-line react-hooks/rules-of-hooks -- tracked in #2
  useEffect(() => {
    if (hasError) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [hasError]);

  const sizeStyles = {
    small: { container: styles.containerSmall, icon: 12, text: styles.countSmall },
    medium: { container: styles.containerMedium, icon: 14, text: styles.countMedium },
    large: { container: styles.containerLarge, icon: 18, text: styles.countLarge },
  };

  const currentSize = sizeStyles[size];
  const IconComponent = hasError ? AlertOctagon : AlertTriangle;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Animated.View
        style={[
          styles.container,
          currentSize.container,
          { backgroundColor: `${primaryColor}15`, borderColor: primaryColor },
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <IconComponent size={currentSize.icon} color={primaryColor} />
        {showCount && significantConflicts.length > 1 && (
          <Text style={[styles.count, currentSize.text, { color: primaryColor }]}>
            {significantConflicts.length}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// Detailed conflict popup
interface ConflictDetailPopupProps {
  visible: boolean;
  conflicts: TimeConflict[];
  activityName: string;
  onClose: () => void;
  onNavigateToConflict?: (conflict: TimeConflict) => void;
}

export function ConflictDetailPopup({
  visible,
  conflicts,
  activityName,
  onClose,
  onNavigateToConflict,
}: ConflictDetailPopupProps) {
  const significantConflicts = conflicts.filter(
    c => c.severity === 'error' || c.severity === 'warning'
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <AlertTriangle size={20} color={colors.warning} />
              <Text style={styles.modalTitle}>Schedule Issues</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.activityLabel}>
            Affecting: <Text style={styles.activityName}>{activityName}</Text>
          </Text>

          <View style={styles.conflictsList}>
            {significantConflicts.map((conflict, index) => {
              const iconName = getConflictIcon(conflict.type);
              const IconComponent = ICON_MAP[iconName] || AlertTriangle;
              const severityColor = getSeverityColor(conflict.severity);

              return (
                <TouchableOpacity
                  key={conflict.id}
                  style={[
                    styles.conflictRow,
                    index < significantConflicts.length - 1 && styles.conflictRowBorder,
                  ]}
                  onPress={() => onNavigateToConflict?.(conflict)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.conflictIconContainer,
                      { backgroundColor: `${severityColor}15` },
                    ]}
                  >
                    <IconComponent size={16} color={severityColor} />
                  </View>

                  <View style={styles.conflictInfo}>
                    <Text style={styles.conflictType}>
                      {conflict.shortMessage}
                    </Text>
                    <Text style={styles.conflictDescription} numberOfLines={2}>
                      {conflict.message}
                    </Text>

                    {conflict.suggestedFix && (
                      <View style={styles.fixRow}>
                        <Lightbulb size={12} color={colors.success} />
                        <Text style={styles.fixText}>{conflict.suggestedFix}</Text>
                      </View>
                    )}
                  </View>

                  {onNavigateToConflict && (
                    <ChevronRight size={16} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Info conflicts (if any) */}
          {conflicts.some(c => c.severity === 'info') && (
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Notes</Text>
              {conflicts
                .filter(c => c.severity === 'info')
                .map(conflict => (
                  <View key={conflict.id} style={styles.infoRow}>
                    <Info size={12} color={colors.textTertiary} />
                    <Text style={styles.infoText}>{conflict.shortMessage}</Text>
                  </View>
                ))}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Inline conflict message (for use in activity cards)
interface InlineConflictMessageProps {
  conflict: TimeConflict;
  compact?: boolean;
}

export function InlineConflictMessage({
  conflict,
  compact = false,
}: InlineConflictMessageProps) {
  const severityColor = getSeverityColor(conflict.severity);
  const iconName = getConflictIcon(conflict.type);
  const IconComponent = ICON_MAP[iconName] || AlertTriangle;

  if (compact) {
    return (
      <View style={[styles.inlineCompact, { backgroundColor: `${severityColor}10` }]}>
        <IconComponent size={12} color={severityColor} />
        <Text style={[styles.inlineCompactText, { color: severityColor }]}>
          {conflict.shortMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.inlineFull, { borderColor: severityColor }]}>
      <View style={styles.inlineHeader}>
        <IconComponent size={14} color={severityColor} />
        <Text style={[styles.inlineTitle, { color: severityColor }]}>
          {conflict.shortMessage}
        </Text>
      </View>
      <Text style={styles.inlineMessage}>{conflict.message}</Text>
      {conflict.suggestedFix && (
        <View style={styles.inlineFix}>
          <Lightbulb size={12} color={colors.textTertiary} />
          <Text style={styles.inlineFixText}>{conflict.suggestedFix}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    gap: 4,
  },
  containerSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  containerMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  containerLarge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  count: {
    fontWeight: '600',
  },
  countSmall: {
    fontSize: 10,
  },
  countMedium: {
    fontSize: 12,
  },
  countLarge: {
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  activityLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  activityName: {
    fontWeight: '600',
    color: colors.text,
  },
  conflictsList: {
    padding: 16,
    paddingTop: 12,
  },
  conflictRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  conflictRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  conflictIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  conflictInfo: {
    flex: 1,
  },
  conflictType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  conflictDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  fixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: `${colors.success}10`,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  fixText: {
    fontSize: 12,
    color: colors.success,
    flex: 1,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  // Inline styles
  inlineCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inlineCompactText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inlineFull: {
    borderLeftWidth: 3,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 8,
  },
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  inlineMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  inlineFix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  inlineFixText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontStyle: 'italic',
    flex: 1,
  },
});
