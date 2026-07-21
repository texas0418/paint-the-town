// Paint the Town Multi-Currency - Category Budget Screen

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMultiCurrency } from '../hooks/useMultiCurrency';
import { ExpenseCategory, CurrencyCode } from '../types/currency';
import { EXPENSE_CATEGORIES } from '../mocks/mockCurrencyData';

interface CategoryBudget {
  category: ExpenseCategory;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

interface CategoryBudgetScreenProps {
  navigation?: any;
  tripId?: string;
}

// eslint-disable-next-line max-lines-per-function -- tracked in #1
const CategoryBudgetScreen: React.FC<CategoryBudgetScreenProps> = ({ navigation, tripId }) => {
  const {
    budget,
    expenses,
    homeCurrency,
    format,
    updateBudget,
    createBudget,
    getCurrency,
    isLoading,
  } = useMultiCurrency({ tripId });

  const [isEditing, setIsEditing] = useState(false);
  const [editedBudgets, setEditedBudgets] = useState<Record<string, string>>({});
  const [totalBudgetInput, setTotalBudgetInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);

  // Calculate spending by category
  const spendingByCategory = useMemo(() => {
    const result: Record<ExpenseCategory, number> = {
      accommodation: 0,
      transportation: 0,
      food_drink: 0,
      activities: 0,
      shopping: 0,
      entertainment: 0,
      health: 0,
      communication: 0,
      fees: 0,
      tips: 0,
      other: 0,
    };

    expenses.forEach((expense) => {
      const amount = expense.convertedAmount || expense.amount;
      result[expense.category] = (result[expense.category] || 0) + amount;
    });

    return result;
  }, [expenses]);

  // Calculate category budgets with spending
  const categoryBudgets: CategoryBudget[] = useMemo(() => {
    return EXPENSE_CATEGORIES.map((cat) => {
      const budgetAmount = budget?.categoryBudgets?.[cat.id] || 0;
      const spent = spendingByCategory[cat.id as ExpenseCategory] || 0;
      const remaining = Math.max(0, budgetAmount - spent);
      const percentUsed = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

      return {
        category: cat.id as ExpenseCategory,
        budgetAmount,
        spent,
        remaining,
        percentUsed,
      };
    });
  }, [budget, spendingByCategory]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalBudget = budget?.totalAmount || 0;
    const totalSpent = Object.values(spendingByCategory).reduce((a, b) => a + b, 0);
    const totalRemaining = Math.max(0, totalBudget - totalSpent);
    const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      budget: totalBudget,
      spent: totalSpent,
      remaining: totalRemaining,
      percentUsed,
    };
  }, [budget, spendingByCategory]);

  // Initialize edit state
  const startEditing = useCallback(() => {
    const initial: Record<string, string> = {};
    EXPENSE_CATEGORIES.forEach((cat) => {
      initial[cat.id] = (budget?.categoryBudgets?.[cat.id] || 0).toString();
    });
    setEditedBudgets(initial);
    setTotalBudgetInput((budget?.totalAmount || 0).toString());
    setIsEditing(true);
  }, [budget]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const categoryBudgetsData: Record<string, number> = {};
      let totalFromCategories = 0;

      EXPENSE_CATEGORIES.forEach((cat) => {
        const amount = parseFloat(editedBudgets[cat.id]) || 0;
        if (amount > 0) {
          categoryBudgetsData[cat.id] = amount;
          totalFromCategories += amount;
        }
      });

      const totalAmount = parseFloat(totalBudgetInput) || totalFromCategories;

      if (budget) {
        await updateBudget({
          totalAmount,
          categoryBudgets: categoryBudgetsData,
        });
      } else {
        await createBudget({
          id: `budget_${tripId || 'default'}_${Date.now()}`,
          tripId: tripId || undefined,
          name: tripId ? `Trip Budget` : 'Overall Budget',
          totalAmount,
          currency: homeCurrency,
          categoryBudgets: categoryBudgetsData,
          alerts: [
            {
              id: 'a1',
              type: 'threshold',
              threshold: 50,
              message: '50% of budget used',
              triggered: false,
            },
            {
              id: 'a2',
              type: 'threshold',
              threshold: 80,
              message: '80% of budget used',
              triggered: false,
            },
            {
              id: 'a3',
              type: 'threshold',
              threshold: 100,
              message: 'Budget exceeded!',
              triggered: false,
            },
          ],
        });
      }

      setIsEditing(false);
      Alert.alert('Saved', 'Budget updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save budget.');
    } finally {
      setIsSaving(false);
    }
  }, [budget, editedBudgets, totalBudgetInput, updateBudget, createBudget, tripId, homeCurrency]);

  const getProgressColor = (percent: number): string => {
    if (percent >= 100) return '#FF3B30';
    if (percent >= 80) return '#FF9500';
    if (percent >= 50) return '#FFCC00';
    return '#34C759';
  };

  const getCategoryInfo = (categoryId: string) => {
    return (
      EXPENSE_CATEGORIES.find((c) => c.id === categoryId) ||
      EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
    );
  };

  const currencySymbol = getCurrency(homeCurrency)?.symbol || '$';

  const renderCategoryBudgetCard = (catBudget: CategoryBudget) => {
    const categoryInfo = getCategoryInfo(catBudget.category);
    const progressColor = getProgressColor(catBudget.percentUsed);

    if (isEditing) {
      return (
        <View key={catBudget.category} style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
              <Text style={styles.categoryIconText}>{categoryInfo.icon}</Text>
            </View>
            <Text style={styles.categoryName}>{categoryInfo.name}</Text>
          </View>
          <View style={styles.editInputContainer}>
            <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
            <TextInput
              style={styles.budgetInput}
              value={editedBudgets[catBudget.category]}
              onChangeText={(text) => {
                setEditedBudgets((prev) => ({ ...prev, [catBudget.category]: text }));
              }}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#999"
            />
          </View>
          <Text style={styles.spentHint}>Spent: {format(catBudget.spent, homeCurrency)}</Text>
        </View>
      );
    }

    // Only show categories with budgets or spending
    if (catBudget.budgetAmount === 0 && catBudget.spent === 0) {
      return null;
    }

    return (
      <TouchableOpacity
        key={catBudget.category}
        style={styles.categoryCard}
        onPress={() =>
          navigation?.navigate('ExpenseTracker', { filterCategory: catBudget.category })
        }
      >
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
            <Text style={styles.categoryIconText}>{categoryInfo.icon}</Text>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{categoryInfo.name}</Text>
            <Text style={styles.categorySpent}>{format(catBudget.spent, homeCurrency)} spent</Text>
          </View>
          <View style={styles.categoryBudgetInfo}>
            <Text style={styles.categoryBudgetAmount}>
              {catBudget.budgetAmount > 0
                ? format(catBudget.budgetAmount, homeCurrency)
                : 'No budget'}
            </Text>
            {catBudget.budgetAmount > 0 && (
              <Text style={[styles.categoryRemaining, { color: progressColor }]}>
                {catBudget.remaining > 0
                  ? `${format(catBudget.remaining, homeCurrency)} left`
                  : 'Over budget'}
              </Text>
            )}
          </View>
        </View>

        {catBudget.budgetAmount > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, catBudget.percentUsed)}%`,
                    backgroundColor: progressColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressPercent, { color: progressColor }]}>
              {Math.round(catBudget.percentUsed)}%
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Category Budgets</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => (isEditing ? handleSave() : startEditing())}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Total Budget Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Total Budget</Text>
            {isEditing ? (
              <View style={styles.totalEditContainer}>
                <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                <TextInput
                  style={styles.totalInput}
                  value={totalBudgetInput}
                  onChangeText={setTotalBudgetInput}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
              </View>
            ) : (
              <Text style={styles.summaryAmount}>{format(totals.budget, homeCurrency)}</Text>
            )}
          </View>

          {!isEditing && totals.budget > 0 && (
            <>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Spent</Text>
                  <Text style={styles.summaryValue}>{format(totals.spent, homeCurrency)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Remaining</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: totals.remaining > 0 ? '#34C759' : '#FF3B30' },
                    ]}
                  >
                    {format(totals.remaining, homeCurrency)}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryProgress}>
                <View style={styles.summaryProgressBar}>
                  <View
                    style={[
                      styles.summaryProgressFill,
                      {
                        width: `${Math.min(100, totals.percentUsed)}%`,
                        backgroundColor: getProgressColor(totals.percentUsed),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.summaryProgressText}>
                  {Math.round(totals.percentUsed)}% used
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Category Budgets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Category</Text>

          {isEditing ? (
            // Show all categories when editing
            EXPENSE_CATEGORIES.map((cat) =>
              renderCategoryBudgetCard({
                category: cat.id as ExpenseCategory,
                budgetAmount: budget?.categoryBudgets?.[cat.id] || 0,
                spent: spendingByCategory[cat.id as ExpenseCategory] || 0,
                remaining: 0,
                percentUsed: 0,
              })
            )
          ) : (
            // Show only categories with budget or spending
            <>
              {categoryBudgets
                .filter((cb) => cb.budgetAmount > 0 || cb.spent > 0)
                .map(renderCategoryBudgetCard)}

              {categoryBudgets.every((cb) => cb.budgetAmount === 0 && cb.spent === 0) && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📊</Text>
                  <Text style={styles.emptyTitle}>No budgets set</Text>
                  <Text style={styles.emptyText}>Tap &quot;Edit&quot; to set budgets for each category</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Quick Stats */}
        {!isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Insights</Text>

            <View style={styles.insightsContainer}>
              {/* Highest spending category */}
              {(() => {
                const sorted = [...categoryBudgets]
                  .filter((cb) => cb.spent > 0)
                  .sort((a, b) => b.spent - a.spent);

                if (sorted.length === 0) return null;

                const highest = sorted[0];
                const highestInfo = getCategoryInfo(highest.category);

                return (
                  <View style={styles.insightCard}>
                    <Text style={styles.insightIcon}>📈</Text>
                    <View style={styles.insightInfo}>
                      <Text style={styles.insightLabel}>Highest Spending</Text>
                      <Text style={styles.insightValue}>
                        {highestInfo.icon} {highestInfo.name}
                      </Text>
                      <Text style={styles.insightAmount}>
                        {format(highest.spent, homeCurrency)}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Over budget categories */}
              {(() => {
                const overBudget = categoryBudgets.filter(
                  (cb) => cb.budgetAmount > 0 && cb.percentUsed >= 100
                );

                if (overBudget.length === 0) return null;

                return (
                  <View style={[styles.insightCard, styles.warningCard]}>
                    <Text style={styles.insightIcon}>⚠️</Text>
                    <View style={styles.insightInfo}>
                      <Text style={styles.insightLabel}>Over Budget</Text>
                      <Text style={styles.insightValue}>
                        {overBudget.length} {overBudget.length === 1 ? 'category' : 'categories'}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Categories under 50% */}
              {(() => {
                const underHalf = categoryBudgets.filter(
                  (cb) => cb.budgetAmount > 0 && cb.percentUsed < 50
                );

                if (underHalf.length === 0) return null;

                return (
                  <View style={[styles.insightCard, styles.successCard]}>
                    <Text style={styles.insightIcon}>✅</Text>
                    <View style={styles.insightInfo}>
                      <Text style={styles.insightLabel}>On Track</Text>
                      <Text style={styles.insightValue}>
                        {underHalf.length} {underHalf.length === 1 ? 'category' : 'categories'}{' '}
                        under 50%
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Cancel button when editing */}
      {isEditing && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  totalEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalInput: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'right',
    minWidth: 120,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '600',
    color: '#888',
    marginRight: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e8e8e8',
    marginHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  summaryProgress: {
    alignItems: 'center',
  },
  summaryProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  summaryProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryProgressText: {
    fontSize: 13,
    color: '#888',
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
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  categorySpent: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  categoryBudgetInfo: {
    alignItems: 'flex-end',
  },
  categoryBudgetAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  categoryRemaining: {
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  editInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  budgetInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    paddingVertical: 12,
    textAlign: 'right',
  },
  spentHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
  },
  successCard: {
    backgroundColor: '#E8F5E9',
  },
  insightIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  insightInfo: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  insightAmount: {
    fontSize: 14,
    color: '#667eea',
    marginTop: 2,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#666',
  },
  bottomPadding: {
    height: 40,
  },
});

export default CategoryBudgetScreen;
