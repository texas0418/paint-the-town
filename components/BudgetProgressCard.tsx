// Paint the Town Multi-Currency - Budget Progress Card Component

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ExpenseCategory } from '../types/currency';
import { EXPENSE_CATEGORIES } from '../mocks/mockCurrencyData';

interface BudgetProgressCardProps {
  // For category budget
  category?: ExpenseCategory;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  
  // For overall budget
  title?: string;
  
  // Budget data
  budgetAmount: number;
  spentAmount: number;
  currency: string;
  
  // Display options
  showRemaining?: boolean;
  showPercentage?: boolean;
  compact?: boolean;
  
  // Formatting
  formatAmount?: (amount: number, currency: string) => string;
  
  // Interaction
  onPress?: () => void;
}

const BudgetProgressCard: React.FC<BudgetProgressCardProps> = ({
  category,
  categoryName,
  categoryIcon,
  categoryColor,
  title,
  budgetAmount,
  spentAmount,
  currency,
  showRemaining = true,
  showPercentage = true,
  compact = false,
  formatAmount,
  onPress,
// eslint-disable-next-line complexity -- tracked in #1
}) => {
  // Get category info if category is provided
  const catInfo = category
    ? EXPENSE_CATEGORIES.find(c => c.id === category)
    : null;
  
  const displayName = categoryName || catInfo?.name || title || 'Budget';
  const displayIcon = categoryIcon || catInfo?.icon || '💰';
  const displayColor = categoryColor || catInfo?.color || '#667eea';
  
  // Calculate values
  const remaining = Math.max(0, budgetAmount - spentAmount);
  const percentUsed = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
  const isOverBudget = spentAmount > budgetAmount;
  
  // Progress bar color based on percentage
  const getProgressColor = (): string => {
    if (percentUsed >= 100) return '#FF3B30';
    if (percentUsed >= 80) return '#FF9500';
    if (percentUsed >= 50) return '#FFCC00';
    return '#34C759';
  };
  
  // Format amount helper
  const format = (amount: number): string => {
    if (formatAmount) {
      return formatAmount(amount, currency);
    }
    return `${currency} ${amount.toFixed(2)}`;
  };
  
  const progressColor = getProgressColor();
  
  const content = (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: displayColor + '20' }]}>
          <Text style={styles.icon}>{displayIcon}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.subtitle}>
            {format(spentAmount)} of {format(budgetAmount)}
          </Text>
        </View>
        {showRemaining && (
          <View style={styles.remainingContainer}>
            <Text style={[
              styles.remainingAmount,
              isOverBudget && styles.overBudget,
            ]}>
              {isOverBudget ? '-' : ''}{format(isOverBudget ? spentAmount - budgetAmount : remaining)}
            </Text>
            <Text style={styles.remainingLabel}>
              {isOverBudget ? 'over' : 'left'}
            </Text>
          </View>
        )}
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, percentUsed)}%`,
                backgroundColor: progressColor,
              },
            ]}
          />
          {isOverBudget && (
            <View
              style={[
                styles.overflowIndicator,
                { left: '100%' },
              ]}
            />
          )}
        </View>
        {showPercentage && (
          <Text style={[styles.percentage, { color: progressColor }]}>
            {Math.round(percentUsed)}%
          </Text>
        )}
      </View>
      
      {/* Alert badges */}
      {!compact && isOverBudget && (
        <View style={styles.alertBadge}>
          <Text style={styles.alertText}>⚠️ Over budget by {format(spentAmount - budgetAmount)}</Text>
        </View>
      )}
    </View>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  
  return content;
};

// Mini version for dashboard
interface BudgetProgressMiniProps {
  category?: ExpenseCategory;
  budgetAmount: number;
  spentAmount: number;
  onPress?: () => void;
}

export const BudgetProgressMini: React.FC<BudgetProgressMiniProps> = ({
  category,
  budgetAmount,
  spentAmount,
  onPress,
}) => {
  const catInfo = category
    ? EXPENSE_CATEGORIES.find(c => c.id === category)
    : null;
  
  const percentUsed = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
  
  const getProgressColor = (): string => {
    if (percentUsed >= 100) return '#FF3B30';
    if (percentUsed >= 80) return '#FF9500';
    return '#34C759';
  };
  
  const content = (
    <View style={styles.miniContainer}>
      <Text style={styles.miniIcon}>{catInfo?.icon || '💰'}</Text>
      <View style={styles.miniProgress}>
        <View
          style={[
            styles.miniProgressFill,
            {
              width: `${Math.min(100, percentUsed)}%`,
              backgroundColor: getProgressColor(),
            },
          ]}
        />
      </View>
      <Text style={[styles.miniPercent, { color: getProgressColor() }]}>
        {Math.round(percentUsed)}%
      </Text>
    </View>
  );
  
  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  }
  
  return content;
};

// Summary card for multiple budgets
interface BudgetSummaryCardProps {
  totalBudget: number;
  totalSpent: number;
  currency: string;
  categoriesOverBudget: number;
  categoriesOnTrack: number;
  formatAmount?: (amount: number, currency: string) => string;
  onPress?: () => void;
}

export const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
  totalBudget,
  totalSpent,
  currency,
  categoriesOverBudget,
  categoriesOnTrack,
  formatAmount,
  onPress,
}) => {
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remaining = Math.max(0, totalBudget - totalSpent);
  
  const format = (amount: number): string => {
    if (formatAmount) return formatAmount(amount, currency);
    return `${currency} ${amount.toFixed(2)}`;
  };
  
  const getProgressColor = (): string => {
    if (percentUsed >= 100) return '#FF3B30';
    if (percentUsed >= 80) return '#FF9500';
    return '#34C759';
  };
  
  const content = (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Budget Overview</Text>
        <Text style={styles.summaryAmount}>{format(remaining)} left</Text>
      </View>
      
      <View style={styles.summaryProgressBar}>
        <View
          style={[
            styles.summaryProgressFill,
            {
              width: `${Math.min(100, percentUsed)}%`,
              backgroundColor: getProgressColor(),
            },
          ]}
        />
      </View>
      
      <View style={styles.summaryStats}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>{format(totalSpent)}</Text>
          <Text style={styles.summaryStatLabel}>Spent</Text>
        </View>
        <View style={styles.summaryStatDivider} />
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>{format(totalBudget)}</Text>
          <Text style={styles.summaryStatLabel}>Budget</Text>
        </View>
        <View style={styles.summaryStatDivider} />
        <View style={styles.summaryStat}>
          <Text style={[
            styles.summaryStatValue,
            { color: getProgressColor() }
          ]}>
            {Math.round(percentUsed)}%
          </Text>
          <Text style={styles.summaryStatLabel}>Used</Text>
        </View>
      </View>
      
      {(categoriesOverBudget > 0 || categoriesOnTrack > 0) && (
        <View style={styles.summaryBadges}>
          {categoriesOverBudget > 0 && (
            <View style={[styles.summaryBadge, styles.warningBadge]}>
              <Text style={styles.warningBadgeText}>
                ⚠️ {categoriesOverBudget} over
              </Text>
            </View>
          )}
          {categoriesOnTrack > 0 && (
            <View style={[styles.summaryBadge, styles.successBadge]}>
              <Text style={styles.successBadgeText}>
                ✅ {categoriesOnTrack} on track
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
  
  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  }
  
  return content;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  containerCompact: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  remainingContainer: {
    alignItems: 'flex-end',
  },
  remainingAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34C759',
  },
  overBudget: {
    color: '#FF3B30',
  },
  remainingLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  overflowIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#FF3B30',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 44,
    textAlign: 'right',
  },
  alertBadge: {
    marginTop: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  alertText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
  },
  // Mini styles
  miniContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    minWidth: 100,
  },
  miniIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  miniProgress: {
    flex: 1,
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  miniPercent: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Summary styles
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  summaryProgressBar: {
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  summaryProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatDivider: {
    width: 1,
    backgroundColor: '#e8e8e8',
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  summaryBadges: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  summaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  warningBadge: {
    backgroundColor: '#FFF3E0',
  },
  warningBadgeText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
  },
  successBadge: {
    backgroundColor: '#E8F5E9',
  },
  successBadgeText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
});

export default BudgetProgressCard;
