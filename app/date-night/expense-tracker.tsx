/* eslint-disable max-lines -- tracked in #1 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Receipt,
  PieChart,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Target,
  Wallet,
  CreditCard,
  Banknote,
  Share2,
  MoreHorizontal,
  Utensils,
  Wine,
  Ticket,
  Car,
  ShoppingBag,
  Heart,
  Bed,
  ParkingCircle,
  Camera,
  ImageIcon,
  Edit2,
  ChevronDown,
  RefreshCw,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useDateNight } from '@/contexts/DateNightContext';
import { useExpenseTracker, useSavingsGoals } from '@/hooks/useExpenseTracker';
import {
  ExpenseCategory,
  EXPENSE_CATEGORIES,
  getCategoryConfig,
  PAYMENT_APPS,
  SUPPORTED_CURRENCIES,
  getCurrencyByCode,
  formatCurrency,
  Expense,
} from '@/types/expense';

// ============================================================================
// Icon Mapping
// ============================================================================

const categoryIcons: Record<ExpenseCategory, typeof Utensils> = {
  dining: Utensils,
  drinks: Wine,
  entertainment: Ticket,
  transportation: Car,
  tickets: Ticket,
  accommodation: Bed,
  shopping: ShoppingBag,
  tips: Heart,
  parking: ParkingCircle,
  other: MoreHorizontal,
};

// ============================================================================
// Tab Types
// ============================================================================

type TabType = 'expenses' | 'budget' | 'split' | 'savings';

// ============================================================================
// Main Component
// ============================================================================

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function DateNightExpenseTrackerScreen() {
  const router = useRouter();
  const { id: itineraryId } = useLocalSearchParams<{ id: string }>();
  const { currentItinerary, itineraries } = useDateNight();

  // Find the itinerary
  const itinerary = itineraryId ? itineraries.find((i) => i.id === itineraryId) : currentItinerary;

  // State
  const [activeTab, setActiveTab] = useState<TabType>('expenses');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddSavings, setShowAddSavings] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  // Mock participants (would come from itinerary in real app)
  const participants = useMemo(
    () => [
      { id: 'user-1', name: 'You', paymentInfo: { venmo: 'yourvenmo' } },
      {
        id: 'partner-1',
        name: itinerary?.partnerName || 'Partner',
        paymentInfo: { venmo: 'partnervenmo' },
      },
    ],
    [itinerary?.partnerName]
  );

  // Convert activities
  const activities = useMemo(
    () =>
      itinerary?.activities.map((a) => ({
        id: a.id,
        name: a.name,
        estimatedCost: a.estimatedCost,
        category: a.type as ExpenseCategory,
      })) || [],
    [itinerary?.activities]
  );

  // Initialize hooks
  const {
    expenses,
    addExpense,
    editExpense,
    startEditingExpense,
    cancelEditing,
    editingExpense,
    deleteExpense,
    budgetSummary,
    splitSummary,
    totalSpent,
    isOverBudget,
    hasUnsettledBalances,
    settleUp,
    exportSummary,
    scanReceipt,
    pickReceiptFromGallery,
    createExpenseFromReceipt,
    isScanning,
    convertCurrency,
    supportedCurrencies,
    baseCurrency,
  } = useExpenseTracker({
    itineraryId: itinerary?.id || 'default',
    itineraryName: itinerary?.name || 'Date Night',
    participants,
    activities,
    currency: 'USD',
    baseCurrency: 'USD',
  });

  const { goals, activeGoals, createGoal, addContribution, deleteGoal, totalSaved } =
    useSavingsGoals();

  // Handle share
  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: exportSummary(),
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [exportSummary]);

  // Error state
  if (!itinerary) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Expense Tracker</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Receipt size={48} color={colors.textTertiary} />
            <Text style={styles.errorText}>No itinerary selected</Text>
            <Pressable style={styles.errorButton} onPress={() => router.back()}>
              <Text style={styles.errorButtonText}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ============================================================================
  // Render Tabs
  // ============================================================================

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['expenses', 'budget', 'split', 'savings'] as TabType[]).map((tab) => (
        <Pressable
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  // ============================================================================
  // Render Expenses Tab
  // ============================================================================

  const renderExpensesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryMain}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryAmount}>${totalSpent.toFixed(2)}</Text>
          <View style={styles.summaryMeta}>
            {isOverBudget ? (
              <>
                <TrendingUp size={14} color={colors.error} />
                <Text style={[styles.summaryMetaText, { color: colors.error }]}>Over budget</Text>
              </>
            ) : (
              <>
                <TrendingDown size={14} color={colors.success} />
                <Text style={[styles.summaryMetaText, { color: colors.success }]}>
                  Under budget
                </Text>
              </>
            )}
          </View>
        </View>
        <Pressable style={styles.addExpenseBtn} onPress={() => setShowAddExpense(true)}>
          <Plus size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Quick Actions - Receipt Scanning */}
      <View style={styles.quickActions}>
        <Pressable style={styles.quickActionBtn} onPress={handleScanReceipt} disabled={isScanning}>
          {isScanning ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Camera size={18} color={colors.primary} />
          )}
          <Text style={styles.quickActionText}>Scan Receipt</Text>
        </Pressable>
        <Pressable style={styles.quickActionBtn} onPress={handlePickReceipt} disabled={isScanning}>
          <ImageIcon size={18} color={colors.primary} />
          <Text style={styles.quickActionText}>From Gallery</Text>
        </Pressable>
      </View>

      {/* Expenses List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        {expenses.length > 0 ? (
          <View style={styles.expensesList}>
            {expenses.map((expense) => {
              const Icon = categoryIcons[expense.category] || MoreHorizontal;
              const config = getCategoryConfig(expense.category);
              const currencyInfo = expense.originalCurrency
                ? getCurrencyByCode(expense.originalCurrency)
                : null;

              return (
                <Pressable
                  key={expense.id}
                  style={styles.expenseCard}
                  onPress={() => handleEditExpense(expense)}
                  onLongPress={() => deleteExpense(expense.id)}
                >
                  <View style={[styles.expenseIcon, { backgroundColor: config.color + '20' }]}>
                    <Icon size={18} color={config.color} />
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseDescription}>{expense.description}</Text>
                    <Text style={styles.expenseMeta}>
                      {expense.activityName || config.label} • {expense.paidByName}
                    </Text>
                    {expense.originalCurrency && expense.originalCurrency !== baseCurrency && (
                      <Text style={styles.expenseOriginal}>
                        {currencyInfo?.flag}{' '}
                        {formatCurrency(expense.originalAmount || 0, expense.originalCurrency)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>-${expense.amount.toFixed(2)}</Text>
                    <Edit2 size={14} color={colors.textTertiary} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Receipt size={40} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Pressable style={styles.emptyButton} onPress={() => setShowAddExpense(true)}>
              <Plus size={16} color="#fff" />
              <Text style={styles.emptyButtonText}>Add First Expense</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // ============================================================================
  // Render Budget Tab
  // ============================================================================

  const renderBudgetTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Budget Overview */}
      <View style={styles.budgetOverview}>
        <View style={styles.budgetRow}>
          <View style={styles.budgetItem}>
            <Text style={styles.budgetItemLabel}>Estimated</Text>
            <Text style={styles.budgetItemValue}>${budgetSummary.totalEstimated.toFixed(2)}</Text>
          </View>
          <View style={styles.budgetDivider} />
          <View style={styles.budgetItem}>
            <Text style={styles.budgetItemLabel}>Actual</Text>
            <Text style={styles.budgetItemValue}>${budgetSummary.totalActual.toFixed(2)}</Text>
          </View>
          <View style={styles.budgetDivider} />
          <View style={styles.budgetItem}>
            <Text style={styles.budgetItemLabel}>Difference</Text>
            <Text
              style={[
                styles.budgetItemValue,
                { color: budgetSummary.totalDifference > 0 ? colors.error : colors.success },
              ]}
            >
              {budgetSummary.totalDifference >= 0 ? '+' : ''}$
              {budgetSummary.totalDifference.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(budgetSummary.percentageUsed, 100)}%`,
                  backgroundColor:
                    budgetSummary.percentageUsed > 100
                      ? colors.error
                      : budgetSummary.percentageUsed > 80
                        ? colors.warning
                        : colors.success,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {budgetSummary.percentageUsed.toFixed(0)}% of budget used
          </Text>
        </View>
      </View>

      {/* By Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>By Activity</Text>
        <View style={styles.activityList}>
          {budgetSummary.byActivity.map((item) => {
            const Icon = categoryIcons[item.category] || MoreHorizontal;
            const config = getCategoryConfig(item.category);

            return (
              <View key={item.activityId || item.activityName} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <View style={[styles.activityIcon, { backgroundColor: config.color + '20' }]}>
                    <Icon size={16} color={config.color} />
                  </View>
                  <Text style={styles.activityName} numberOfLines={1}>
                    {item.activityName}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          item.status === 'over'
                            ? colors.error + '20'
                            : item.status === 'under'
                              ? colors.success + '20'
                              : colors.primary + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            item.status === 'over'
                              ? colors.error
                              : item.status === 'under'
                                ? colors.success
                                : colors.primary,
                        },
                      ]}
                    >
                      {item.status === 'over'
                        ? 'Over'
                        : item.status === 'under'
                          ? 'Under'
                          : 'On Track'}
                    </Text>
                  </View>
                </View>

                <View style={styles.activityComparison}>
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonLabel}>Est.</Text>
                    <Text style={styles.comparisonValue}>${item.estimated.toFixed(0)}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.textTertiary} />
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonLabel}>Actual</Text>
                    <Text
                      style={[
                        styles.comparisonValue,
                        { color: item.actual > 0 ? colors.text : colors.textTertiary },
                      ]}
                    >
                      ${item.actual.toFixed(0)}
                    </Text>
                  </View>
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonLabel}>Diff</Text>
                    <Text
                      style={[
                        styles.comparisonValue,
                        { color: item.difference > 0 ? colors.error : colors.success },
                      ]}
                    >
                      {item.difference >= 0 ? '+' : ''}${item.difference.toFixed(0)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );

  // ============================================================================
  // Render Split Tab
  // ============================================================================

  const renderSplitTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Balances */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Who Paid What</Text>
        <View style={styles.balanceCards}>
          {splitSummary.participants.map((participant) => (
            <View key={participant.id} style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <View style={styles.balanceAvatar}>
                  <Text style={styles.balanceAvatarText}>
                    {participant.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.balanceName}>{participant.name}</Text>
              </View>

              <View style={styles.balanceDetails}>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Paid</Text>
                  <Text style={styles.balanceValue}>${participant.totalPaid.toFixed(2)}</Text>
                </View>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Owes</Text>
                  <Text style={styles.balanceValue}>${participant.totalOwed.toFixed(2)}</Text>
                </View>
                <View style={[styles.balanceRow, styles.balanceNet]}>
                  <Text style={styles.balanceLabel}>Net</Text>
                  <Text
                    style={[
                      styles.balanceNetValue,
                      { color: participant.netBalance >= 0 ? colors.success : colors.error },
                    ]}
                  >
                    {participant.netBalance >= 0 ? '+' : ''}${participant.netBalance.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Settlements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settle Up</Text>
        {splitSummary.settlements.length > 0 ? (
          <View style={styles.settlementsList}>
            {splitSummary.settlements.map((settlement, index) => (
              <View key={index} style={styles.settlementCard}>
                <View style={styles.settlementInfo}>
                  <Text style={styles.settlementText}>
                    <Text style={styles.settlementName}>{settlement.from.name}</Text>
                    {' owes '}
                    <Text style={styles.settlementName}>{settlement.to.name}</Text>
                  </Text>
                  <Text style={styles.settlementAmount}>${settlement.amount.toFixed(2)}</Text>
                </View>

                <View style={styles.paymentOptions}>
                  {PAYMENT_APPS.filter((app) => app.supportsSend)
                    .slice(0, 3)
                    .map((app) => (
                      <Pressable
                        key={app.id}
                        style={[styles.paymentButton, { backgroundColor: app.color + '20' }]}
                        onPress={() => settleUp(settlement)}
                      >
                        <Text style={[styles.paymentButtonText, { color: app.color }]}>
                          {app.name}
                        </Text>
                      </Pressable>
                    ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.settledCard}>
            <Check size={32} color={colors.success} />
            <Text style={styles.settledText}>All settled up! 🎉</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // ============================================================================
  // Render Savings Tab
  // ============================================================================

  const renderSavingsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Total Saved */}
      <View style={styles.savingsOverview}>
        <Target size={24} color={colors.primary} />
        <View style={styles.savingsInfo}>
          <Text style={styles.savingsLabel}>Total Saved</Text>
          <Text style={styles.savingsTotal}>${totalSaved.toFixed(2)}</Text>
        </View>
        <Pressable style={styles.addGoalBtn} onPress={() => setShowAddSavings(true)}>
          <Plus size={18} color={colors.primary} />
        </Pressable>
      </View>

      {/* Goals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Savings Goals</Text>
        {activeGoals.length > 0 ? (
          <View style={styles.goalsList}>
            {activeGoals.map((goal) => (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Text style={styles.goalPercent}>{goal.percentComplete.toFixed(0)}%</Text>
                </View>

                <View style={styles.goalProgress}>
                  <View style={styles.goalProgressBar}>
                    <View
                      style={[
                        styles.goalProgressFill,
                        {
                          width: `${goal.percentComplete}%`,
                          backgroundColor: goal.color || colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.goalDetails}>
                  <Text style={styles.goalAmount}>
                    ${goal.currentAmount.toFixed(0)} / ${goal.targetAmount.toFixed(0)}
                  </Text>
                  {goal.suggestedWeeklyAmount && (
                    <Text style={styles.goalSuggestion}>
                      Save ${goal.suggestedWeeklyAmount}/week
                    </Text>
                  )}
                </View>

                <View style={styles.goalActions}>
                  <Pressable
                    style={styles.contributeButton}
                    onPress={() => {
                      Alert.prompt(
                        'Add Contribution',
                        'Enter amount to save',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Add',
                            onPress: (amount) => {
                              if (amount && parseFloat(amount) > 0) {
                                addContribution(goal.id, parseFloat(amount));
                              }
                            },
                          },
                        ],
                        'plain-text',
                        '',
                        'decimal-pad'
                      );
                    }}
                  >
                    <Plus size={14} color={colors.primary} />
                    <Text style={styles.contributeButtonText}>Add Money</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Target size={40} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No savings goals</Text>
            <Text style={styles.emptySubtext}>Start saving for your next adventure!</Text>
            <Pressable style={styles.emptyButton} onPress={() => setShowAddSavings(true)}>
              <Plus size={16} color="#fff" />
              <Text style={styles.emptyButtonText}>Create Goal</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // ============================================================================
  // Add Expense Modal
  // ============================================================================

  // eslint-disable-next-line react-hooks/rules-of-hooks -- tracked in #2
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'dining' as ExpenseCategory,
    activityId: '',
    paidById: participants[0]?.id || '',
    splitType: 'equal' as const,
    expenseCurrency: 'USD',
  });

  // Receipt scanning handlers
  // eslint-disable-next-line react-hooks/rules-of-hooks -- tracked in #2
  const handleScanReceipt = useCallback(async () => {
    const result = await scanReceipt();
    if (result) {
      // Pre-fill form with scanned data
      setNewExpense((prev) => ({
        ...prev,
        description: result.merchantName || '',
        amount: result.total?.toString() || '',
        expenseCurrency: result.currency || 'USD',
      }));
      Alert.alert(
        'Receipt Scanned',
        result.total
          ? `Found: ${result.merchantName || 'Receipt'} - ${formatCurrency(result.total, result.currency || 'USD')}`
          : 'Could not extract amount automatically. Please enter manually.',
        [{ text: 'OK' }]
      );
    }
  }, [scanReceipt]);

  // eslint-disable-next-line react-hooks/rules-of-hooks -- tracked in #2
  const handlePickReceipt = useCallback(async () => {
    const result = await pickReceiptFromGallery();
    if (result) {
      setNewExpense((prev) => ({
        ...prev,
        description: result.merchantName || prev.description,
        amount: result.total?.toString() || prev.amount,
        expenseCurrency: result.currency || prev.expenseCurrency,
      }));
    }
  }, [pickReceiptFromGallery]);

  // Edit expense handler
  // eslint-disable-next-line react-hooks/rules-of-hooks -- tracked in #2
  const handleEditExpense = useCallback(
    (expense: Expense) => {
      setNewExpense({
        description: expense.description,
        amount: (expense.originalAmount || expense.amount).toString(),
        category: expense.category,
        activityId: expense.activityId || '',
        paidById: expense.paidBy,
        splitType: expense.splitType as 'equal' | 'paid_by_one',
        expenseCurrency: expense.originalCurrency || baseCurrency,
      });
      startEditingExpense(expense);
      setShowEditExpense(true);
    },
    [baseCurrency, startEditingExpense]
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks -- tracked in #2
  const handleSaveEdit = useCallback(() => {
    if (!editingExpense) return;

    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    editExpense(editingExpense.id, {
      description:
        newExpense.description || `${getCategoryConfig(newExpense.category).label} expense`,
      amount: parseFloat(newExpense.amount),
      expenseCurrency: newExpense.expenseCurrency,
      category: newExpense.category,
      activityId: newExpense.activityId || undefined,
      paidById: newExpense.paidById,
      splitType: newExpense.splitType,
    });

    setShowEditExpense(false);
    setNewExpense({
      description: '',
      amount: '',
      category: 'dining',
      activityId: '',
      paidById: participants[0]?.id || '',
      splitType: 'equal',
      expenseCurrency: 'USD',
    });
  }, [editingExpense, newExpense, editExpense, participants]);

  const handleAddExpense = () => {
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    addExpense({
      description:
        newExpense.description || `${getCategoryConfig(newExpense.category).label} expense`,
      amount: parseFloat(newExpense.amount),
      expenseCurrency: newExpense.expenseCurrency,
      category: newExpense.category,
      activityId: newExpense.activityId || undefined,
      paidById: newExpense.paidById,
      splitType: newExpense.splitType,
    });

    setShowAddExpense(false);
    setNewExpense({
      description: '',
      amount: '',
      category: 'dining',
      activityId: '',
      paidById: participants[0]?.id || '',
      splitType: 'equal',
      expenseCurrency: 'USD',
    });
  };

  const renderAddExpenseModal = () => (
    <Modal
      visible={showAddExpense}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAddExpense(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Pressable onPress={() => setShowAddExpense(false)}>
            <X size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.modalTitle}>Add Expense</Text>
          <Pressable onPress={handleAddExpense}>
            <Check size={24} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Amount with Currency */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount</Text>
            <View style={styles.amountRow}>
              <Pressable
                style={styles.currencySelector}
                onPress={() => setShowCurrencyPicker(true)}
              >
                <Text style={styles.currencyFlag}>
                  {getCurrencyByCode(newExpense.expenseCurrency)?.flag || '🌍'}
                </Text>
                <Text style={styles.currencyCode}>{newExpense.expenseCurrency}</Text>
                <ChevronDown size={16} color={colors.textSecondary} />
              </Pressable>
              <View style={styles.amountInputFlex}>
                <Text style={styles.currencySymbol}>
                  {getCurrencyByCode(newExpense.expenseCurrency)?.symbol || '$'}
                </Text>
                <TextInput
                  style={styles.amountField}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  value={newExpense.amount}
                  onChangeText={(text) => setNewExpense({ ...newExpense, amount: text })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            {newExpense.expenseCurrency !== baseCurrency && newExpense.amount && (
              <Text style={styles.conversionNote}>
                ≈ $
                {convertCurrency(
                  parseFloat(newExpense.amount) || 0,
                  newExpense.expenseCurrency,
                  baseCurrency
                ).convertedAmount.toFixed(2)}{' '}
                {baseCurrency}
              </Text>
            )}
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryOptions}
            >
              {EXPENSE_CATEGORIES.map((cat) => {
                const Icon = categoryIcons[cat.id];
                const isSelected = newExpense.category === cat.id;

                return (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      isSelected && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => setNewExpense({ ...newExpense, category: cat.id })}
                  >
                    <Icon size={18} color={isSelected ? '#fff' : cat.color} />
                    <Text style={[styles.categoryOptionText, isSelected && { color: '#fff' }]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Activity */}
          {activities.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Activity (Optional)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.activityOptions}
              >
                <Pressable
                  style={[
                    styles.activityOption,
                    !newExpense.activityId && styles.activityOptionSelected,
                  ]}
                  onPress={() => setNewExpense({ ...newExpense, activityId: '' })}
                >
                  <Text
                    style={[
                      styles.activityOptionText,
                      !newExpense.activityId && styles.activityOptionTextSelected,
                    ]}
                  >
                    None
                  </Text>
                </Pressable>
                {activities.map((activity) => (
                  <Pressable
                    key={activity.id}
                    style={[
                      styles.activityOption,
                      newExpense.activityId === activity.id && styles.activityOptionSelected,
                    ]}
                    onPress={() => setNewExpense({ ...newExpense, activityId: activity.id })}
                  >
                    <Text
                      style={[
                        styles.activityOptionText,
                        newExpense.activityId === activity.id && styles.activityOptionTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {activity.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Paid By */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Paid By</Text>
            <View style={styles.paidByOptions}>
              {participants.map((p) => (
                <Pressable
                  key={p.id}
                  style={[
                    styles.paidByOption,
                    newExpense.paidById === p.id && styles.paidByOptionSelected,
                  ]}
                  onPress={() => setNewExpense({ ...newExpense, paidById: p.id })}
                >
                  <View style={styles.paidByAvatar}>
                    <Text style={styles.paidByAvatarText}>{p.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text
                    style={[
                      styles.paidByName,
                      newExpense.paidById === p.id && styles.paidByNameSelected,
                    ]}
                  >
                    {p.name}
                  </Text>
                  {newExpense.paidById === p.id && <Check size={16} color={colors.primary} />}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Split Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Split</Text>
            <View style={styles.splitOptions}>
              {[
                { id: 'equal', label: 'Split Equally' },
                { id: 'paid_by_one', label: 'No Split' },
              ].map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.splitOption,
                    newExpense.splitType === option.id && styles.splitOptionSelected,
                  ]}
                  onPress={() => setNewExpense({ ...newExpense, splitType: option.id as any })}
                >
                  <Text
                    style={[
                      styles.splitOptionText,
                      newExpense.splitType === option.id && styles.splitOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="What was this expense for?"
              placeholderTextColor={colors.textTertiary}
              value={newExpense.description}
              onChangeText={(text) => setNewExpense({ ...newExpense, description: text })}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // Edit Expense Modal
  const renderEditExpenseModal = () => (
    <Modal
      visible={showEditExpense}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        setShowEditExpense(false);
        cancelEditing();
      }}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Pressable
            onPress={() => {
              setShowEditExpense(false);
              cancelEditing();
            }}
          >
            <X size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.modalTitle}>Edit Expense</Text>
          <Pressable onPress={handleSaveEdit}>
            <Check size={24} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Amount with Currency */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount</Text>
            <View style={styles.amountRow}>
              <Pressable
                style={styles.currencySelector}
                onPress={() => setShowCurrencyPicker(true)}
              >
                <Text style={styles.currencyFlag}>
                  {getCurrencyByCode(newExpense.expenseCurrency)?.flag || '🌍'}
                </Text>
                <Text style={styles.currencyCode}>{newExpense.expenseCurrency}</Text>
                <ChevronDown size={16} color={colors.textSecondary} />
              </Pressable>
              <View style={styles.amountInputFlex}>
                <Text style={styles.currencySymbol}>
                  {getCurrencyByCode(newExpense.expenseCurrency)?.symbol || '$'}
                </Text>
                <TextInput
                  style={styles.amountField}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  value={newExpense.amount}
                  onChangeText={(text) => setNewExpense({ ...newExpense, amount: text })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            {newExpense.expenseCurrency !== baseCurrency && newExpense.amount && (
              <Text style={styles.conversionNote}>
                ≈ $
                {convertCurrency(
                  parseFloat(newExpense.amount) || 0,
                  newExpense.expenseCurrency,
                  baseCurrency
                ).convertedAmount.toFixed(2)}{' '}
                {baseCurrency}
              </Text>
            )}
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryOptions}
            >
              {EXPENSE_CATEGORIES.map((cat) => {
                const Icon = categoryIcons[cat.id];
                const isSelected = newExpense.category === cat.id;

                return (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      isSelected && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => setNewExpense({ ...newExpense, category: cat.id })}
                  >
                    <Icon size={18} color={isSelected ? '#fff' : cat.color} />
                    <Text style={[styles.categoryOptionText, isSelected && { color: '#fff' }]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Paid By */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Paid By</Text>
            <View style={styles.paidByOptions}>
              {participants.map((p) => (
                <Pressable
                  key={p.id}
                  style={[
                    styles.paidByOption,
                    newExpense.paidById === p.id && styles.paidByOptionSelected,
                  ]}
                  onPress={() => setNewExpense({ ...newExpense, paidById: p.id })}
                >
                  <View style={styles.paidByAvatar}>
                    <Text style={styles.paidByAvatarText}>{p.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text
                    style={[
                      styles.paidByName,
                      newExpense.paidById === p.id && styles.paidByNameSelected,
                    ]}
                  >
                    {p.name}
                  </Text>
                  {newExpense.paidById === p.id && <Check size={16} color={colors.primary} />}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="What was this expense for?"
              placeholderTextColor={colors.textTertiary}
              value={newExpense.description}
              onChangeText={(text) => setNewExpense({ ...newExpense, description: text })}
            />
          </View>

          {/* Delete Button */}
          {editingExpense && (
            <Pressable
              style={styles.deleteExpenseBtn}
              onPress={() => {
                Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      deleteExpense(editingExpense.id);
                      setShowEditExpense(false);
                      cancelEditing();
                    },
                  },
                ]);
              }}
            >
              <Text style={styles.deleteExpenseBtnText}>Delete Expense</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // Currency Picker Modal
  const renderCurrencyPicker = () => (
    <Modal
      visible={showCurrencyPicker}
      animationType="slide"
      transparent
      onRequestClose={() => setShowCurrencyPicker(false)}
    >
      <View style={styles.currencyPickerOverlay}>
        <View style={styles.currencyPickerSheet}>
          <View style={styles.currencyPickerHeader}>
            <Text style={styles.currencyPickerTitle}>Select Currency</Text>
            <Pressable onPress={() => setShowCurrencyPicker(false)}>
              <X size={24} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.currencyList}>
            {SUPPORTED_CURRENCIES.map((curr) => (
              <Pressable
                key={curr.code}
                style={[
                  styles.currencyItem,
                  newExpense.expenseCurrency === curr.code && styles.currencyItemSelected,
                ]}
                onPress={() => {
                  setNewExpense({ ...newExpense, expenseCurrency: curr.code });
                  setShowCurrencyPicker(false);
                }}
              >
                <Text style={styles.currencyItemFlag}>{curr.flag}</Text>
                <View style={styles.currencyItemInfo}>
                  <Text style={styles.currencyItemCode}>{curr.code}</Text>
                  <Text style={styles.currencyItemName}>{curr.name}</Text>
                </View>
                <Text style={styles.currencyItemSymbol}>{curr.symbol}</Text>
                {newExpense.expenseCurrency === curr.code && (
                  <Check size={20} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Expenses</Text>
            <Text style={styles.headerSubtitle}>{itinerary.name}</Text>
          </View>
          <Pressable style={styles.shareButton} onPress={handleShare}>
            <Share2 size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Tabs */}
        {renderTabs()}

        {/* Tab Content */}
        {activeTab === 'expenses' && renderExpensesTab()}
        {activeTab === 'budget' && renderBudgetTab()}
        {activeTab === 'split' && renderSplitTab()}
        {activeTab === 'savings' && renderSavingsTab()}
      </SafeAreaView>

      {/* Modals */}
      {renderAddExpenseModal()}
      {renderEditExpenseModal()}
      {renderCurrencyPicker()}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  shareButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Summary Card
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryMain: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  summaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  summaryMetaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  addExpenseBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },

  // Expenses List
  expensesList: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  expenseMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  expenseOriginal: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary + '15',
    paddingVertical: 12,
    borderRadius: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.card,
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Budget
  budgetOverview: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetItem: {
    flex: 1,
    alignItems: 'center',
  },
  budgetItemLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  budgetItemValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  budgetDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  progressContainer: {
    marginTop: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },

  // Activity List
  activityList: {
    gap: 10,
  },
  activityCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activityComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  comparisonValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },

  // Split / Balances
  balanceCards: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  balanceName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 10,
  },
  balanceDetails: {
    gap: 6,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  balanceNet: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  balanceNetValue: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Settlements
  settlementsList: {
    gap: 12,
  },
  settlementCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
  },
  settlementInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settlementText: {
    fontSize: 14,
    color: colors.text,
  },
  settlementName: {
    fontWeight: '600',
  },
  settlementAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  settledCard: {
    backgroundColor: colors.success + '10',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  settledText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    marginTop: 8,
  },

  // Savings
  savingsOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  savingsInfo: {
    flex: 1,
    marginLeft: 12,
  },
  savingsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  savingsTotal: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  addGoalBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalsList: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  goalPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  goalProgress: {
    marginBottom: 12,
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalAmount: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  goalSuggestion: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  goalActions: {
    alignItems: 'flex-start',
  },
  contributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  contributeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountField: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 16,
    marginLeft: 8,
  },
  categoryOptions: {
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  activityOptions: {
    gap: 8,
  },
  activityOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activityOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    maxWidth: 120,
  },
  activityOptionTextSelected: {
    color: '#fff',
  },
  paidByOptions: {
    gap: 10,
  },
  paidByOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paidByOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  paidByAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidByAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  paidByName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 12,
  },
  paidByNameSelected: {
    color: colors.primary,
  },
  splitOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  splitOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  splitOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  splitOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  splitOptionTextSelected: {
    color: '#fff',
  },
  descriptionInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Amount Row with Currency
  amountRow: {
    flexDirection: 'row',
    gap: 10,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyFlag: {
    fontSize: 20,
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  amountInputFlex: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencySymbol: {
    fontSize: 20,
    color: colors.textTertiary,
  },
  conversionNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    marginLeft: 4,
  },

  // Currency Picker Modal
  currencyPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  currencyPickerSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  currencyPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  currencyPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  currencyList: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  currencyItemSelected: {
    backgroundColor: colors.primary + '15',
  },
  currencyItemFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  currencyItemInfo: {
    flex: 1,
  },
  currencyItemCode: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  currencyItemName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  currencyItemSymbol: {
    fontSize: 16,
    color: colors.textTertiary,
    marginRight: 12,
  },

  // Delete button
  deleteExpenseBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 24,
    marginBottom: 40,
  },
  deleteExpenseBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.error,
  },
});
