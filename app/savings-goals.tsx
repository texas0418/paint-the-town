import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Target,
  Calendar,
  Check,
  X,
  Sparkles,
  TrendingUp,
  Clock,
  Gift,
  Plane,
  Heart,
  Music,
  ChevronRight,
  Trash2,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useSavingsGoals } from '@/hooks/useExpenseTracker';
import { SavingsGoal } from '@/types/expense';

// ============================================================================
// Goal Templates
// ============================================================================

const GOAL_TEMPLATES = [
  {
    id: 'romantic-dinner',
    name: 'Romantic Dinner',
    icon: Heart,
    color: '#F43F5E',
    suggestedAmount: 200,
    description: 'Save for a special dining experience',
  },
  {
    id: 'weekend-getaway',
    name: 'Weekend Getaway',
    icon: Plane,
    color: '#3B82F6',
    suggestedAmount: 500,
    description: 'Plan a romantic trip together',
  },
  {
    id: 'concert-tickets',
    name: 'Concert Tickets',
    icon: Music,
    color: '#8B5CF6',
    suggestedAmount: 300,
    description: 'See your favorite artist live',
  },
  {
    id: 'special-occasion',
    name: 'Special Occasion',
    icon: Gift,
    color: '#F59E0B',
    suggestedAmount: 400,
    description: 'Anniversary, birthday, or celebration',
  },
];

// ============================================================================
// Main Component
// ============================================================================

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function SavingsGoalsScreen() {
  const router = useRouter();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  // Form state
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    description: '',
    color: colors.primary,
  });
  const [contributionAmount, setContributionAmount] = useState('');

  // Hook
  const {
    goals,
    activeGoals,
    completedGoals,
    totalSaved,
    createGoal,
    addContribution,
    deleteGoal,
  } = useSavingsGoals();

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleCreateGoal = useCallback(() => {
    if (!newGoal.name.trim()) {
      Alert.alert('Enter Name', 'Please give your goal a name');
      return;
    }
    if (!newGoal.targetAmount || parseFloat(newGoal.targetAmount) <= 0) {
      Alert.alert('Enter Amount', 'Please enter a target amount');
      return;
    }

    createGoal({
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      targetDate: newGoal.targetDate || undefined,
      description: newGoal.description || undefined,
      color: newGoal.color,
    });

    setShowCreateModal(false);
    setNewGoal({
      name: '',
      targetAmount: '',
      targetDate: '',
      description: '',
      color: colors.primary,
    });
  }, [newGoal, createGoal]);

  const handleContribute = useCallback(() => {
    if (!selectedGoal) return;

    const amount = parseFloat(contributionAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    addContribution(selectedGoal.id, amount);
    setShowContributeModal(false);
    setContributionAmount('');
    setSelectedGoal(null);
  }, [selectedGoal, contributionAmount, addContribution]);

  const handleSelectTemplate = useCallback((template: (typeof GOAL_TEMPLATES)[0]) => {
    setNewGoal({
      name: template.name,
      targetAmount: template.suggestedAmount.toString(),
      targetDate: '',
      description: template.description,
      color: template.color,
    });
  }, []);

  const openContributeModal = useCallback((goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setShowContributeModal(true);
  }, []);

  // ============================================================================
  // Render Goal Card
  // ============================================================================

  const renderGoalCard = (goal: SavingsGoal) => {
    const daysRemaining = goal.targetDate
      ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : null;

    return (
      <View key={goal.id} style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View
            style={[styles.goalIcon, { backgroundColor: (goal.color || colors.primary) + '20' }]}
          >
            <Target size={20} color={goal.color || colors.primary} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalName}>{goal.name}</Text>
            {goal.description && (
              <Text style={styles.goalDescription} numberOfLines={1}>
                {goal.description}
              </Text>
            )}
          </View>
          <Pressable style={styles.deleteButton} onPress={() => deleteGoal(goal.id)}>
            <Trash2 size={18} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* Progress */}
        <View style={styles.goalProgress}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${goal.percentComplete}%`,
                  backgroundColor: goal.color || colors.primary,
                },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressAmount}>${goal.currentAmount.toFixed(0)}</Text>
            <Text style={styles.progressTarget}>of ${goal.targetAmount.toFixed(0)}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.goalStats}>
          <View style={styles.stat}>
            <TrendingUp size={14} color={colors.success} />
            <Text style={styles.statText}>{goal.percentComplete.toFixed(0)}% saved</Text>
          </View>
          {goal.remainingAmount > 0 && (
            <View style={styles.stat}>
              <Target size={14} color={colors.textSecondary} />
              <Text style={styles.statText}>${goal.remainingAmount.toFixed(0)} to go</Text>
            </View>
          )}
          {daysRemaining !== null && daysRemaining > 0 && (
            <View style={styles.stat}>
              <Clock size={14} color={colors.warning} />
              <Text style={styles.statText}>{daysRemaining} days left</Text>
            </View>
          )}
        </View>

        {/* Weekly suggestion */}
        {goal.suggestedWeeklyAmount && goal.status === 'active' && (
          <View style={styles.suggestionBox}>
            <Sparkles size={14} color={colors.primary} />
            <Text style={styles.suggestionText}>
              Save ${goal.suggestedWeeklyAmount}/week to reach your goal on time
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.goalActions}>
          <Pressable style={styles.contributeBtn} onPress={() => openContributeModal(goal)}>
            <Plus size={16} color="#fff" />
            <Text style={styles.contributeBtnText}>Add Money</Text>
          </Pressable>

          {goal.contributions.length > 0 && (
            <Pressable style={styles.historyBtn}>
              <Text style={styles.historyBtnText}>
                {goal.contributions.length} contribution{goal.contributions.length !== 1 ? 's' : ''}
              </Text>
              <ChevronRight size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  // ============================================================================
  // Render Create Modal
  // ============================================================================

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Pressable onPress={() => setShowCreateModal(false)}>
            <X size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.modalTitle}>New Savings Goal</Text>
          <Pressable onPress={handleCreateGoal}>
            <Check size={24} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Templates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Start</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templates}
            >
              {GOAL_TEMPLATES.map((template) => {
                const Icon = template.icon;
                const isSelected = newGoal.name === template.name;

                return (
                  <Pressable
                    key={template.id}
                    style={[
                      styles.templateCard,
                      isSelected && {
                        borderColor: template.color,
                        backgroundColor: template.color + '10',
                      },
                    ]}
                    onPress={() => handleSelectTemplate(template)}
                  >
                    <View style={[styles.templateIcon, { backgroundColor: template.color + '20' }]}>
                      <Icon size={24} color={template.color} />
                    </View>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateAmount}>${template.suggestedAmount}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Custom Goal Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Or Create Custom</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Anniversary Dinner"
                placeholderTextColor={colors.textTertiary}
                value={newGoal.name}
                onChangeText={(text) => setNewGoal({ ...newGoal, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Amount</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountField}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  value={newGoal.targetAmount}
                  onChangeText={(text) => setNewGoal({ ...newGoal, targetAmount: text })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Date (Optional)</Text>
              <Pressable style={styles.dateInput}>
                <Calendar size={18} color={colors.textTertiary} />
                <Text style={styles.dateInputText}>{newGoal.targetDate || 'Select date'}</Text>
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="What are you saving for?"
                placeholderTextColor={colors.textTertiary}
                value={newGoal.description}
                onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Color picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorOptions}>
                {['#3B82F6', '#8B5CF6', '#F43F5E', '#F59E0B', '#10B981', '#EC4899'].map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newGoal.color === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewGoal({ ...newGoal, color })}
                  >
                    {newGoal.color === color && <Check size={16} color="#fff" />}
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // ============================================================================
  // Render Contribute Modal
  // ============================================================================

  const renderContributeModal = () => (
    <Modal
      visible={showContributeModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowContributeModal(false)}
    >
      <View style={styles.contributeOverlay}>
        <View style={styles.contributeSheet}>
          <View style={styles.contributeHeader}>
            <Text style={styles.contributeTitle}>Add to &quot;{selectedGoal?.name}&quot;</Text>
            <Pressable onPress={() => setShowContributeModal(false)}>
              <X size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.contributeContent}>
            <View style={styles.amountInputLarge}>
              <Text style={styles.currencySymbolLarge}>$</Text>
              <TextInput
                style={styles.amountFieldLarge}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                value={contributionAmount}
                onChangeText={setContributionAmount}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            {/* Quick amounts */}
            <View style={styles.quickAmounts}>
              {[10, 25, 50, 100].map((amount) => (
                <Pressable
                  key={amount}
                  style={styles.quickAmountBtn}
                  onPress={() => setContributionAmount(amount.toString())}
                >
                  <Text style={styles.quickAmountText}>${amount}</Text>
                </Pressable>
              ))}
            </View>

            {selectedGoal && (
              <Text style={styles.contributeHint}>
                ${selectedGoal.remainingAmount.toFixed(0)} remaining to reach your goal
              </Text>
            )}

            <Pressable style={styles.confirmContributeBtn} onPress={handleContribute}>
              <Text style={styles.confirmContributeBtnText}>Add Money</Text>
            </Pressable>
          </View>
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
          <Text style={styles.headerTitle}>Savings Goals</Text>
          <Pressable style={styles.addButton} onPress={() => setShowCreateModal(true)}>
            <Plus size={22} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Total Saved Card */}
          <View style={styles.totalCard}>
            <View style={styles.totalIcon}>
              <Target size={28} color={colors.primary} />
            </View>
            <View style={styles.totalInfo}>
              <Text style={styles.totalLabel}>Total Saved</Text>
              <Text style={styles.totalAmount}>${totalSaved.toFixed(2)}</Text>
              <Text style={styles.totalMeta}>
                across {activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Active Goals */}
          {activeGoals.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Goals</Text>
              <View style={styles.goalsList}>{activeGoals.map(renderGoalCard)}</View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Target size={64} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Savings Goals</Text>
              <Text style={styles.emptyText}>
                Start saving for your dream date nights and adventures!
              </Text>
              <Pressable style={styles.emptyButton} onPress={() => setShowCreateModal(true)}>
                <Plus size={18} color="#fff" />
                <Text style={styles.emptyButtonText}>Create Your First Goal</Text>
              </Pressable>
            </View>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Completed 🎉</Text>
              <View style={styles.goalsList}>
                {completedGoals.map((goal) => (
                  <View key={goal.id} style={[styles.goalCard, styles.completedCard]}>
                    <View style={styles.goalHeader}>
                      <View style={[styles.goalIcon, { backgroundColor: colors.success + '20' }]}>
                        <Check size={20} color={colors.success} />
                      </View>
                      <View style={styles.goalInfo}>
                        <Text style={styles.goalName}>{goal.name}</Text>
                        <Text style={styles.completedText}>
                          Saved ${goal.targetAmount.toFixed(0)} ✓
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Modals */}
      {renderCreateModal()}
      {renderContributeModal()}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  // Total Card
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  totalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalInfo: {
    flex: 1,
    marginLeft: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  totalMeta: {
    fontSize: 13,
    color: colors.textSecondary,
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

  // Goals List
  goalsList: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  completedCard: {
    opacity: 0.7,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  goalName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  goalDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },

  // Progress
  goalProgress: {
    marginBottom: 12,
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  progressAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  progressTarget: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },

  // Stats
  goalStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Suggestion
  suggestionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
  },

  // Actions
  goalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contributeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  contributeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  completedText: {
    fontSize: 13,
    color: colors.success,
    marginTop: 2,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 24,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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

  // Templates
  templates: {
    gap: 12,
    paddingBottom: 8,
  },
  templateCard: {
    width: 120,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  templateAmount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Form
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  currencySymbol: {
    fontSize: 20,
    color: colors.textTertiary,
  },
  amountField: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 14,
    marginLeft: 4,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateInputText: {
    fontSize: 16,
    color: colors.textTertiary,
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  // Contribute Modal
  contributeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  contributeSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  contributeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contributeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  contributeContent: {
    padding: 20,
  },
  amountInputLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  currencySymbolLarge: {
    fontSize: 32,
    color: colors.textTertiary,
  },
  amountFieldLarge: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    minWidth: 100,
    textAlign: 'center',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  quickAmountBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  contributeHint: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmContributeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmContributeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
