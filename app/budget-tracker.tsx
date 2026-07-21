import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  PieChart,
  Plus,
  TrendingUp,
  TrendingDown,
  Utensils,
  Car,
  Building2,
  Ticket,
  ShoppingBag,
  MoreHorizontal,
  X,
  DollarSign,
  Calendar,
  Check,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Expense } from '@/types';

const categoryIcons: Record<string, typeof Utensils> = {
  food: Utensils,
  transport: Car,
  accommodation: Building2,
  activities: Ticket,
  shopping: ShoppingBag,
  other: MoreHorizontal,
};

const categoryColors: Record<string, string> = {
  food: colors.warning,
  transport: colors.primary,
  accommodation: colors.secondary,
  activities: colors.success,
  shopping: colors.primaryLight,
  other: colors.textSecondary,
};

export default function BudgetTrackerScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const { trips, addExpense } = useApp();

  const trip = trips.find((t) => t.id === tripId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'food' as Expense['category'],
    amount: '',
    description: '',
  });

  if (!trip) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Budget Tracker</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Trip not found</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const expenses = trip.expenses || [];
  const budgetProgress = (trip.spentBudget / trip.totalBudget) * 100;
  const remaining = trip.totalBudget - trip.spentBudget;
  const isOverBudget = remaining < 0;

  const expensesByCategory = expenses.reduce(
    (acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleAddExpense = () => {
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    const expense: Expense = {
      id: `expense-${Date.now()}`,
      tripId: trip.id,
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
      currency: trip.currency,
      description: newExpense.description || `${newExpense.category} expense`,
      date: new Date().toISOString(),
    };

    addExpense(trip.id, expense);
    setShowAddModal(false);
    setNewExpense({ category: 'food', amount: '', description: '' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Budget Tracker</Text>
          <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Plus size={22} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <Text style={styles.tripName}>{trip.destination.name}</Text>
            <View style={styles.budgetOverview}>
              <View style={styles.budgetMain}>
                <Text style={styles.spentLabel}>Spent</Text>
                <Text style={styles.spentAmount}>
                  {trip.currency} {trip.spentBudget.toLocaleString()}
                </Text>
                <Text style={styles.budgetTotal}>
                  of {trip.currency} {trip.totalBudget.toLocaleString()}
                </Text>
              </View>
              <View style={styles.budgetStatus}>
                {isOverBudget ? (
                  <TrendingUp size={24} color={colors.error} />
                ) : (
                  <TrendingDown size={24} color={colors.success} />
                )}
                <Text style={[styles.remainingAmount, isOverBudget && styles.overBudget]}>
                  {isOverBudget ? 'Over by' : 'Remaining'}
                  {'\n'}
                  {trip.currency} {Math.abs(remaining).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(budgetProgress, 100)}%`,
                      backgroundColor:
                        budgetProgress > 90
                          ? colors.error
                          : budgetProgress > 70
                            ? colors.warning
                            : colors.success,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{budgetProgress.toFixed(0)}% used</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            <View style={styles.categoriesGrid}>
              {Object.entries(categoryIcons).map(([cat, Icon]) => {
                const amount = expensesByCategory[cat] || 0;
                const percentage =
                  trip.spentBudget > 0 ? ((amount / trip.spentBudget) * 100).toFixed(0) : '0';

                return (
                  <View key={cat} style={styles.categoryCard}>
                    <View
                      style={[styles.categoryIcon, { backgroundColor: `${categoryColors[cat]}15` }]}
                    >
                      <Icon size={20} color={categoryColors[cat]} />
                    </View>
                    <Text style={styles.categoryName}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                    <Text style={styles.categoryAmount}>
                      {trip.currency} {amount.toLocaleString()}
                    </Text>
                    <Text style={styles.categoryPercentage}>{percentage}%</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            {expenses.length > 0 ? (
              <View style={styles.expensesList}>
                {expenses.slice(0, 10).map((expense) => {
                  const Icon = categoryIcons[expense.category] || MoreHorizontal;
                  return (
                    <View key={expense.id} style={styles.expenseItem}>
                      <View
                        style={[
                          styles.expenseIcon,
                          { backgroundColor: `${categoryColors[expense.category]}15` },
                        ]}
                      >
                        <Icon size={18} color={categoryColors[expense.category]} />
                      </View>
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseDescription}>{expense.description}</Text>
                        <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                      </View>
                      <Text style={styles.expenseAmount}>
                        -{expense.currency} {expense.amount.toLocaleString()}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyExpenses}>
                <PieChart size={40} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No expenses recorded yet</Text>
                <Pressable style={styles.addExpenseButton} onPress={() => setShowAddModal(true)}>
                  <Plus size={18} color={colors.textLight} />
                  <Text style={styles.addExpenseText}>Add Expense</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>Budget Tips</Text>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                💡 You&apos;re spending most on{' '}
                <Text style={styles.tipHighlight}>
                  {Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'food'}
                </Text>
                . Consider setting daily limits for this category.
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <Modal
          visible={showAddModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Expense</Text>
                <Pressable onPress={() => setShowAddModal(false)}>
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {Object.entries(categoryIcons).map(([cat, Icon]) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryOption,
                      newExpense.category === cat && styles.categoryOptionActive,
                    ]}
                    onPress={() =>
                      setNewExpense({ ...newExpense, category: cat as Expense['category'] })
                    }
                  >
                    <Icon
                      size={20}
                      color={newExpense.category === cat ? colors.textLight : categoryColors[cat]}
                    />
                    <Text
                      style={[
                        styles.categoryOptionText,
                        newExpense.category === cat && styles.categoryOptionTextActive,
                      ]}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Amount</Text>
              <View style={styles.amountInput}>
                <DollarSign size={20} color={colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  value={newExpense.amount}
                  onChangeText={(text) => setNewExpense({ ...newExpense, amount: text })}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.currencyLabel}>{trip.currency}</Text>
              </View>

              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="What was this expense for?"
                placeholderTextColor={colors.textTertiary}
                value={newExpense.description}
                onChangeText={(text) => setNewExpense({ ...newExpense, description: text })}
              />

              <Pressable
                style={[styles.saveButton, !newExpense.amount && styles.saveButtonDisabled]}
                onPress={handleAddExpense}
                disabled={!newExpense.amount}
              >
                <Check size={20} color={colors.textLight} />
                <Text style={styles.saveButtonText}>Save Expense</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    margin: 20,
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 24,
  },
  tripName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.accent,
    marginBottom: 16,
  },
  budgetOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  budgetMain: {},
  spentLabel: {
    fontSize: 14,
    color: colors.textLight,
    opacity: 0.8,
  },
  spentAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textLight,
  },
  budgetTotal: {
    fontSize: 14,
    color: colors.textLight,
    opacity: 0.7,
  },
  budgetStatus: {
    alignItems: 'flex-end',
  },
  remainingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    textAlign: 'right',
    marginTop: 4,
  },
  overBudget: {
    color: colors.error,
  },
  progressContainer: {
    marginTop: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.textLight,
    opacity: 0.8,
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  categoryPercentage: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  expensesList: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  expenseDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
  emptyExpenses: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 20,
  },
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addExpenseText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tipCard: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    padding: 16,
  },
  tipText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  tipHighlight: {
    fontWeight: '600',
    color: colors.primary,
  },
  bottomSpacer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  categoryScroll: {
    marginBottom: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  categoryOptionTextActive: {
    color: colors.textLight,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 14,
    marginLeft: 8,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  descriptionInput: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textLight,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
