// Paint the Town Multi-Currency - Expense Edit Screen

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMultiCurrency } from '../hooks/useMultiCurrency';
import { Expense, CurrencyCode, ExpenseCategory } from '../types/currency';
import { EXPENSE_CATEGORIES } from '../mocks/mockCurrencyData';

interface ExpenseEditScreenProps {
  navigation?: any;
  route?: { params?: { expenseId?: string; expense?: Expense } };
  onSave?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
}

const ExpenseEditScreen: React.FC<ExpenseEditScreenProps> = ({
  navigation,
  route,
  onSave,
  onDelete,
}) => {
  const expenseId = route?.params?.expenseId;
  const initialExpense = route?.params?.expense;

  const {
    expenses,
    updateExpense,
    deleteExpense,
    getCurrency,
    homeCurrency,
    recentCurrencies,
    favoriteCurrencies,
    format,
    isLoading,
  } = useMultiCurrency();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    currency: homeCurrency as CurrencyCode,
    description: '',
    category: 'other' as ExpenseCategory,
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'card' as 'cash' | 'card' | 'mobile' | 'other',
    notes: '',
    tags: [] as string[],
  });

  // Load expense on mount
  useEffect(() => {
    if (initialExpense) {
      setExpense(initialExpense);
      populateForm(initialExpense);
    } else if (expenseId) {
      const found = expenses.find((e) => e.id === expenseId);
      if (found) {
        setExpense(found);
        populateForm(found);
      }
    }
  }, [expenseId, initialExpense, expenses]);

  const populateForm = (exp: Expense) => {
    setFormData({
      amount: exp.amount.toString(),
      currency: exp.currency,
      description: exp.description,
      category: exp.category,
      vendor: exp.vendor || '',
      date: exp.date.split('T')[0],
      paymentMethod: exp.paymentMethod || 'card',
      notes: exp.notes || '',
      tags: exp.tags || [],
    });
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = useCallback(async () => {
    if (!expense) return;

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Missing Description', 'Please enter a description.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateExpense(expense.id, {
        amount,
        currency: formData.currency,
        description: formData.description,
        category: formData.category,
        vendor: formData.vendor || undefined,
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      });

      if (updated) {
        onSave?.(updated);
        setHasChanges(false);
        Alert.alert('Saved', 'Expense updated successfully.', [
          { text: 'OK', onPress: () => navigation?.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save expense.');
    } finally {
      setIsSaving(false);
    }
  }, [expense, formData, updateExpense, onSave, navigation]);

  const handleDelete = useCallback(() => {
    if (!expense) return;

    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteExpense(expense.id);
            if (success) {
              onDelete?.(expense.id);
              navigation?.goBack();
            }
          },
        },
      ]
    );
  }, [expense, deleteExpense, onDelete, navigation]);

  const handleBack = useCallback(() => {
    if (hasChanges) {
      Alert.alert('Unsaved Changes', 'You have unsaved changes. Discard them?', [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation?.goBack(),
        },
      ]);
    } else {
      navigation?.goBack();
    }
  }, [hasChanges, navigation]);

  const getCategoryInfo = (categoryId: string) => {
    return (
      EXPENSE_CATEGORIES.find((c) => c.id === categoryId) ||
      EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
    );
  };

  const formatDateDisplay = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading || !expense) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  const currencyData = getCurrency(formData.currency);
  const categoryInfo = getCategoryInfo(formData.category);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Expense</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Receipt Image (if attached) */}
        {expense.receiptImageUri && (
          <TouchableOpacity style={styles.receiptPreview}>
            <Image
              source={{ uri: expense.receiptImageUri }}
              style={styles.receiptImage}
              resizeMode="cover"
            />
            <View style={styles.receiptOverlay}>
              <Text style={styles.receiptText}>📄 Receipt attached</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Amount & Currency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <View style={styles.amountContainer}>
            <TouchableOpacity
              style={styles.currencySelector}
              onPress={() => setShowCurrencyPicker(true)}
            >
              <Text style={styles.currencyFlag}>{currencyData?.flag}</Text>
              <Text style={styles.currencyCode}>{formData.currency}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.amountInput}
              value={formData.amount}
              onChangeText={(text) => handleFieldChange('amount', text)}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={styles.textInput}
            value={formData.description}
            onChangeText={(text) => handleFieldChange('description', text)}
            placeholder="What was this expense for?"
            placeholderTextColor="#999"
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryPicker(true)}
          >
            <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
              <Text style={styles.categoryIconText}>{categoryInfo.icon}</Text>
            </View>
            <Text style={styles.categoryName}>{categoryInfo.name}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Vendor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendor (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.vendor}
            onChangeText={(text) => handleFieldChange('vendor', text)}
            placeholder="Store or business name"
            placeholderTextColor="#999"
          />
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => {
              // In production, show date picker
              // For now, allow manual entry
            }}
          >
            <Text style={styles.dateIcon}>📅</Text>
            <TextInput
              style={styles.dateInput}
              value={formData.date}
              onChangeText={(text) => handleFieldChange('date', text)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
            />
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            {[
              { value: 'card', label: 'Card', icon: '💳' },
              { value: 'cash', label: 'Cash', icon: '💵' },
              { value: 'mobile', label: 'Mobile', icon: '📱' },
              { value: 'other', label: 'Other', icon: '📝' },
            ].map((method) => (
              <TouchableOpacity
                key={method.value}
                style={[
                  styles.paymentOption,
                  formData.paymentMethod === method.value && styles.paymentOptionActive,
                ]}
                onPress={() => handleFieldChange('paymentMethod', method.value)}
              >
                <Text style={styles.paymentIcon}>{method.icon}</Text>
                <Text
                  style={[
                    styles.paymentLabel,
                    formData.paymentMethod === method.value && styles.paymentLabelActive,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            value={formData.notes}
            onChangeText={(text) => handleFieldChange('notes', text)}
            placeholder="Additional notes..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {formData.tags.map((tag, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.tag}
                onPress={() => {
                  const newTags = formData.tags.filter((_, i) => i !== idx);
                  handleFieldChange('tags', newTags);
                }}
              >
                <Text style={styles.tagText}>{tag}</Text>
                <Text style={styles.tagRemove}>×</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={() => {
                Alert.prompt('Add Tag', 'Enter a tag for this expense', (text) => {
                  if (text?.trim()) {
                    handleFieldChange('tags', [...formData.tags, text.trim()]);
                  }
                });
              }}
            >
              <Text style={styles.addTagText}>+ Add Tag</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Metadata */}
        <View style={styles.metadataSection}>
          <Text style={styles.metadataLabel}>Created</Text>
          <Text style={styles.metadataValue}>{new Date(expense.createdAt).toLocaleString()}</Text>
          {expense.updatedAt !== expense.createdAt && (
            <>
              <Text style={styles.metadataLabel}>Last Updated</Text>
              <Text style={styles.metadataValue}>
                {new Date(expense.updatedAt).toLocaleString()}
              </Text>
            </>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Currency Picker */}
      {showCurrencyPicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {[
                homeCurrency,
                ...favoriteCurrencies.filter((c) => c !== homeCurrency),
                ...recentCurrencies.filter(
                  (c) => c !== homeCurrency && !favoriteCurrencies.includes(c)
                ),
              ]
                .slice(0, 10)
                .map((code) => {
                  const currency = getCurrency(code);
                  return (
                    <TouchableOpacity
                      key={code}
                      style={[
                        styles.pickerOption,
                        formData.currency === code && styles.pickerOptionActive,
                      ]}
                      onPress={() => {
                        handleFieldChange('currency', code);
                        setShowCurrencyPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionFlag}>{currency?.flag}</Text>
                      <Text style={styles.pickerOptionCode}>{code}</Text>
                      <Text style={styles.pickerOptionName}>{currency?.name}</Text>
                      {formData.currency === code && (
                        <Text style={styles.pickerOptionCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Category Picker */}
      {showCategoryPicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.pickerOption,
                    formData.category === cat.id && styles.pickerOptionActive,
                  ]}
                  onPress={() => {
                    handleFieldChange('category', cat.id);
                    setShowCategoryPicker(false);
                  }}
                >
                  <View style={[styles.pickerCategoryIcon, { backgroundColor: cat.color + '20' }]}>
                    <Text>{cat.icon}</Text>
                  </View>
                  <Text style={styles.pickerCategoryName}>{cat.name}</Text>
                  {formData.category === cat.id && <Text style={styles.pickerOptionCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
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
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  receiptPreview: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  receiptOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  receiptText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderRightColor: '#e8e8e8',
  },
  currencyFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 4,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#888',
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 16,
    textAlign: 'right',
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 18,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  dateIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 14,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentOptionActive: {
    borderColor: '#667eea',
    backgroundColor: '#F5F3FF',
  },
  paymentIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  paymentLabelActive: {
    color: '#667eea',
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#fff',
    marginRight: 6,
  },
  tagRemove: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  addTagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  addTagText: {
    fontSize: 14,
    color: '#888',
  },
  metadataSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  metadataLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pickerClose: {
    fontSize: 20,
    color: '#888',
  },
  pickerList: {
    padding: 16,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  pickerOptionActive: {
    backgroundColor: '#F5F3FF',
  },
  pickerOptionFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  pickerOptionCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  pickerOptionName: {
    flex: 1,
    fontSize: 14,
    color: '#888',
  },
  pickerOptionCheck: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: '600',
  },
  pickerCategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pickerCategoryName: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  bottomPadding: {
    height: 40,
  },
});

export default ExpenseEditScreen;
