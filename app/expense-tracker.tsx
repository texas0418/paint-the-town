// Paint the Town Multi-Currency - Expense Tracker Screen

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
import { CurrencyCode, ExpenseCategory, Expense } from '../types/currency';
import { EXPENSE_CATEGORIES } from '../mocks/mockCurrencyData';

interface ExpenseTrackerScreenProps {
  navigation?: any;
  tripId?: string;
  route?: { params?: { filterCategory?: ExpenseCategory } };
}

// eslint-disable-next-line max-lines-per-function -- tracked in #1
const ExpenseTrackerScreen: React.FC<ExpenseTrackerScreenProps> = ({
  navigation,
  tripId,
  route,
// eslint-disable-next-line complexity -- tracked in #1
}) => {
  const initialCategory = route?.params?.filterCategory;

  const {
    expenses,
    expenseSummary,
    budget,
    homeCurrency,
    format,
    formatWithConversion,
    addExpense,
    deleteExpense,
    getCurrency,
    recentCurrencies,
    isLoading,
  } = useMultiCurrency({ tripId });

  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>(
    initialCategory || 'all'
  );
  const [newExpense, setNewExpense] = useState({
    amount: '',
    currency: homeCurrency as CurrencyCode,
    description: '',
    category: 'food_drink' as ExpenseCategory,
    vendor: '',
    paymentMethod: 'card' as 'cash' | 'card' | 'mobile' | 'other',
  });

  // Handle tap on expense to edit
  const handleEditExpense = useCallback(
    (expense: Expense) => {
      navigation?.navigate('ExpenseEdit', { expense });
    },
    [navigation]
  );

  const filteredExpenses = useMemo(() => {
    if (filterCategory === 'all') return expenses;
    return expenses.filter((e) => e.category === filterCategory);
  }, [expenses, filterCategory]);

  const handleAddExpense = useCallback(async () => {
    const amount = parseFloat(newExpense.amount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!newExpense.description.trim()) {
      Alert.alert('Missing Description', 'Please enter a description.');
      return;
    }

    try {
      await addExpense({
        amount,
        currency: newExpense.currency,
        description: newExpense.description,
        category: newExpense.category,
        vendor: newExpense.vendor || undefined,
        paymentMethod: newExpense.paymentMethod,
        date: new Date().toISOString(),
        tripId,
      });

      setShowAddForm(false);
      setNewExpense({
        amount: '',
        currency: homeCurrency,
        description: '',
        category: 'food_drink',
        vendor: '',
        paymentMethod: 'card',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense.');
    }
  }, [newExpense, addExpense, tripId, homeCurrency]);

  const handleDeleteExpense = useCallback(
    async (id: string) => {
      Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteExpense(id);
          },
        },
      ]);
    },
    [deleteExpense]
  );

  const getCategoryInfo = (category: ExpenseCategory) => {
    return EXPENSE_CATEGORIES.find((c) => c.id === category);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderExpenseCard = (expense: Expense) => {
    const categoryInfo = getCategoryInfo(expense.category);
    const currencyData = getCurrency(expense.currency);

    return (
      <TouchableOpacity
        key={expense.id}
        style={styles.expenseCard}
        onLongPress={() => handleDeleteExpense(expense.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIcon, { backgroundColor: categoryInfo?.color + '20' }]}>
          <Text style={styles.categoryIconText}>{categoryInfo?.icon}</Text>
        </View>

        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription} numberOfLines={1}>
            {expense.description}
          </Text>
          <Text style={styles.expenseDetails}>
            {categoryInfo?.name} • {formatDate(expense.date)}
            {expense.vendor && ` • ${expense.vendor}`}
          </Text>
        </View>

        <View style={styles.expenseAmounts}>
          <Text style={styles.expenseAmount}>
            {currencyData?.flag} {format(expense.amount, expense.currency)}
          </Text>
          {expense.convertedAmount && expense.convertedCurrency !== expense.currency && (
            <Text style={styles.expenseConverted}>
              ≈ {format(expense.convertedAmount, expense.convertedCurrency!)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderAddForm = () => (
    <View style={styles.addFormOverlay}>
      <View style={styles.addFormContainer}>
        <View style={styles.addFormHeader}>
          <Text style={styles.addFormTitle}>Add Expense</Text>
          <TouchableOpacity onPress={() => setShowAddForm(false)}>
            <Text style={styles.addFormClose}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Amount & Currency */}
        <View style={styles.formRow}>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>{getCurrency(newExpense.currency)?.symbol}</Text>
            <TextInput
              style={styles.amountFormInput}
              value={newExpense.amount}
              onChangeText={(text) => setNewExpense((prev) => ({ ...prev, amount: text }))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity
            style={styles.currencySelector}
            onPress={() => {
              // TODO: open a currency picker
              const currencies: CurrencyCode[] = [
                homeCurrency,
                ...recentCurrencies.filter((c) => c !== homeCurrency),
              ];
              const currentIndex = currencies.indexOf(newExpense.currency);
              const nextIndex = (currentIndex + 1) % currencies.length;
              setNewExpense((prev) => ({ ...prev, currency: currencies[nextIndex] }));
            }}
          >
            <Text style={styles.currencySelectorText}>
              {getCurrency(newExpense.currency)?.flag} {newExpense.currency}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <TextInput
          style={styles.formInput}
          value={newExpense.description}
          onChangeText={(text) => setNewExpense((prev) => ({ ...prev, description: text }))}
          placeholder="Description"
          placeholderTextColor="#999"
        />

        {/* Category */}
        <Text style={styles.formLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {EXPENSE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryOption,
                newExpense.category === cat.id && styles.categoryOptionActive,
                { borderColor: cat.color },
              ]}
              onPress={() => setNewExpense((prev) => ({ ...prev, category: cat.id }))}
            >
              <Text style={styles.categoryOptionIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.categoryOptionText,
                  newExpense.category === cat.id && { color: cat.color },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Vendor */}
        <TextInput
          style={styles.formInput}
          value={newExpense.vendor}
          onChangeText={(text) => setNewExpense((prev) => ({ ...prev, vendor: text }))}
          placeholder="Vendor (optional)"
          placeholderTextColor="#999"
        />

        {/* Payment Method */}
        <Text style={styles.formLabel}>Payment Method</Text>
        <View style={styles.paymentMethods}>
          {[
            { value: 'card', label: '💳 Card' },
            { value: 'cash', label: '💵 Cash' },
            { value: 'mobile', label: '📱 Mobile' },
          ].map((method) => (
            <TouchableOpacity
              key={method.value}
              style={[
                styles.paymentOption,
                newExpense.paymentMethod === method.value && styles.paymentOptionActive,
              ]}
              onPress={() =>
                setNewExpense((prev) => ({
                  ...prev,
                  paymentMethod: method.value as 'cash' | 'card' | 'mobile',
                }))
              }
            >
              <Text
                style={[
                  styles.paymentOptionText,
                  newExpense.paymentMethod === method.value && styles.paymentOptionTextActive,
                ]}
              >
                {method.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleAddExpense}>
          <Text style={styles.submitButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Expenses</Text>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryMain}>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={styles.summaryAmount}>
                {format(expenseSummary?.totalInHomeCurrency || 0, homeCurrency)}
              </Text>
            </View>

            {budget && (
              <View style={styles.budgetInfo}>
                <View style={styles.budgetBar}>
                  <View
                    style={[
                      styles.budgetFill,
                      { width: `${Math.min(budget.percentUsed, 100)}%` },
                      budget.percentUsed > 80 && styles.budgetFillWarning,
                    ]}
                  />
                </View>
                <Text style={styles.budgetText}>
                  {format(budget.remaining, budget.currency)} remaining
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]}
            onPress={() => setFilterCategory('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                filterCategory === 'all' && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {EXPENSE_CATEGORIES.slice(0, 6).map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterChip, filterCategory === cat.id && styles.filterChipActive]}
              onPress={() => setFilterCategory(cat.id)}
            >
              <Text style={styles.filterChipIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.filterChipText,
                  filterCategory === cat.id && styles.filterChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {/* Expenses List */}
        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add your first expense</Text>
          </View>
        ) : (
          <View style={styles.expensesList}>{filteredExpenses.map(renderExpenseCard)}</View>
        )}

        {/* Category Breakdown */}
        {expenseSummary && Object.keys(expenseSummary.byCategory).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Category</Text>
            <View style={styles.breakdownCard}>
              {Object.entries(expenseSummary.byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const catInfo = getCategoryInfo(category as ExpenseCategory);
                  const percentage = (amount / expenseSummary.totalInHomeCurrency) * 100;
                  return (
                    <View key={category} style={styles.breakdownRow}>
                      <View style={styles.breakdownLeft}>
                        <Text style={styles.breakdownIcon}>{catInfo?.icon}</Text>
                        <Text style={styles.breakdownName}>{catInfo?.name}</Text>
                      </View>
                      <View style={styles.breakdownRight}>
                        <Text style={styles.breakdownAmount}>{format(amount, homeCurrency)}</Text>
                        <View style={styles.breakdownBarContainer}>
                          <View
                            style={[
                              styles.breakdownBar,
                              { width: `${percentage}%`, backgroundColor: catInfo?.color },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {/* Currency Breakdown */}
        {expenseSummary && Object.keys(expenseSummary.byCurrency).length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Currency</Text>
            <View style={styles.currencyBreakdown}>
              {Object.entries(expenseSummary.byCurrency).map(([currency, amount]) => {
                const currencyData = getCurrency(currency as CurrencyCode);
                return (
                  <View key={currency} style={styles.currencyCard}>
                    <Text style={styles.currencyFlag}>{currencyData?.flag}</Text>
                    <Text style={styles.currencyAmount}>
                      {format(amount, currency as CurrencyCode)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(true)}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Add Form Modal */}
      {showAddForm && renderAddForm()}
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
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  summaryMain: {
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  budgetInfo: {},
  budgetBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  budgetFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  budgetFillWarning: {
    backgroundColor: '#FF9500',
  },
  budgetText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#667eea',
  },
  filterChipIcon: {
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
  },
  expensesList: {
    marginBottom: 24,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 20,
  },
  expenseInfo: {
    flex: 1,
    marginRight: 12,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  expenseDetails: {
    fontSize: 13,
    color: '#888',
  },
  expenseAmounts: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  expenseConverted: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
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
  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  breakdownName: {
    fontSize: 14,
    color: '#666',
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  breakdownBarContainer: {
    width: 80,
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    borderRadius: 2,
  },
  currencyBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  currencyFlag: {
    fontSize: 24,
    marginBottom: 4,
  },
  currencyAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  addButton: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addButtonText: {
    fontSize: 32,
    color: '#fff',
    marginTop: -2,
  },
  addFormOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  addFormContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  addFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  addFormTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addFormClose: {
    fontSize: 20,
    color: '#888',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  amountInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  currencySymbol: {
    fontSize: 24,
    color: '#888',
    marginRight: 8,
  },
  amountFormInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    paddingVertical: 12,
  },
  currencySelector: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  currencySelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  formInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionActive: {
    backgroundColor: '#fff',
  },
  categoryOptionIcon: {
    marginRight: 6,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  paymentMethods: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  paymentOption: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  paymentOptionActive: {
    backgroundColor: '#667eea',
  },
  paymentOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  paymentOptionTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  bottomPadding: {
    height: 100,
  },
});

export default ExpenseTrackerScreen;
