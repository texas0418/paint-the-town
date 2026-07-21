// Paint the Town Receipt Scanner - Receipt Review Screen

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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useReceiptScanner } from '../hooks/useReceiptScanner';
import { EXPENSE_CATEGORIES } from '../mocks/mockReceiptData';

interface ReceiptReviewScreenProps {
  navigation?: any;
  route?: { params?: { receiptId?: string } };
  onImport?: (expenseData: any) => Promise<string>;
}

const ReceiptReviewScreen: React.FC<ReceiptReviewScreenProps> = ({
  navigation,
  route,
  onImport,
}) => {
  const receiptId = route?.params?.receiptId;

  const {
    currentReceipt,
    loadReceipt,
    updateCorrections,
    confirmReceipt,
    discardReceipt,
    getImportData,
    markAsImported,
    hasLowConfidence,
    extractionSummary,
    isLoading,
  } = useReceiptScanner();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState({
    merchant: '',
    date: '',
    total: '',
    currency: 'USD',
    category: 'other',
    description: '',
    paymentMethod: 'card' as 'cash' | 'card' | 'mobile' | 'other',
  });
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Load receipt on mount
  useEffect(() => {
    if (receiptId) {
      loadReceipt(receiptId);
    }
  }, [receiptId, loadReceipt]);

  // Update edited data when receipt loads
  useEffect(() => {
    if (currentReceipt?.finalData) {
      setEditedData({
        merchant: currentReceipt.finalData.merchant,
        date: currentReceipt.finalData.date,
        total: currentReceipt.finalData.total.toString(),
        currency: currentReceipt.finalData.currency,
        category: currentReceipt.finalData.category,
        description: currentReceipt.finalData.description,
        paymentMethod: currentReceipt.finalData.paymentMethod,
      });
    }
  }, [currentReceipt]);

  const handleSaveEdits = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateCorrections({
        merchant: editedData.merchant,
        date: editedData.date,
        total: parseFloat(editedData.total) || 0,
        currency: editedData.currency,
        category: editedData.category,
        description: editedData.description,
        paymentMethod: editedData.paymentMethod,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }, [editedData, updateCorrections]);

  const handleImport = useCallback(async () => {
    const importData = getImportData();
    if (!importData) return;

    setIsSaving(true);
    try {
      let expenseId: string;

      if (onImport) {
        // Use provided import function
        expenseId = await onImport(importData);
      } else {
        // Mock import - in real app, call expense service
        expenseId = `exp_${Date.now()}`;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      await markAsImported(expenseId);

      Alert.alert('Receipt Imported', 'The receipt has been added to your expenses.', [
        {
          text: 'OK',
          onPress: () => navigation?.navigate('ExpenseTracker'),
        },
      ]);
    } catch (error) {
      Alert.alert('Import Failed', 'Failed to import receipt to expenses.');
    } finally {
      setIsSaving(false);
    }
  }, [getImportData, onImport, markAsImported, navigation]);

  const handleDiscard = useCallback(() => {
    Alert.alert('Discard Receipt', 'Are you sure you want to discard this receipt?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await discardReceipt();
          navigation?.goBack();
        },
      },
    ]);
  }, [discardReceipt, navigation]);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#34C759';
    if (confidence >= 0.6) return '#FF9500';
    return '#FF3B30';
  };

  const getCategoryInfo = (categoryId: string) => {
    return (
      EXPENSE_CATEGORIES.find((c) => c.id === categoryId) ||
      EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
    );
  };

  const formatDate = (dateStr: string): string => {
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

  if (isLoading || !currentReceipt) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  const extraction = currentReceipt.extraction;
  const finalData = currentReceipt.finalData;
  const categoryInfo = getCategoryInfo(editedData.category);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Receipt</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.editButtonText}>{isEditing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Receipt Image */}
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={() => {
            /* Open full screen image viewer */
          }}
        >
          <Image
            source={{ uri: currentReceipt.image.uri }}
            style={styles.receiptImage}
            resizeMode="contain"
          />
          <View style={styles.imageOverlay}>
            <Text style={styles.imageOverlayText}>Tap to enlarge</Text>
          </View>
        </TouchableOpacity>

        {/* Confidence Banner */}
        {hasLowConfidence && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Low confidence - please verify the extracted data
            </Text>
          </View>
        )}

        {/* Extracted Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Extracted Information</Text>

          {/* Merchant */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>Merchant</Text>
              {extraction?.merchant && (
                <View
                  style={[
                    styles.confidenceBadge,
                    { backgroundColor: getConfidenceColor(extraction.merchant.confidence) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.confidenceText,
                      { color: getConfidenceColor(extraction.merchant.confidence) },
                    ]}
                  >
                    {Math.round(extraction.merchant.confidence * 100)}%
                  </Text>
                </View>
              )}
            </View>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedData.merchant}
                onChangeText={(text) => setEditedData((prev) => ({ ...prev, merchant: text }))}
                placeholder="Enter merchant name"
              />
            ) : (
              <Text style={styles.fieldValue}>{finalData?.merchant || 'Not detected'}</Text>
            )}
          </View>

          {/* Date */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>Date</Text>
              {extraction?.date && (
                <View
                  style={[
                    styles.confidenceBadge,
                    { backgroundColor: getConfidenceColor(extraction.date.confidence) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.confidenceText,
                      { color: getConfidenceColor(extraction.date.confidence) },
                    ]}
                  >
                    {Math.round(extraction.date.confidence * 100)}%
                  </Text>
                </View>
              )}
            </View>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedData.date}
                onChangeText={(text) => setEditedData((prev) => ({ ...prev, date: text }))}
                placeholder="YYYY-MM-DD"
              />
            ) : (
              <Text style={styles.fieldValue}>
                {finalData?.date ? formatDate(finalData.date) : 'Not detected'}
              </Text>
            )}
          </View>

          {/* Total */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>Total Amount</Text>
              {extraction?.total && (
                <View
                  style={[
                    styles.confidenceBadge,
                    { backgroundColor: getConfidenceColor(extraction.total.confidence) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.confidenceText,
                      { color: getConfidenceColor(extraction.total.confidence) },
                    ]}
                  >
                    {Math.round(extraction.total.confidence * 100)}%
                  </Text>
                </View>
              )}
            </View>
            {isEditing ? (
              <View style={styles.amountRow}>
                <TouchableOpacity
                  style={styles.currencyPicker}
                  onPress={() => {
                    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
                    const idx = currencies.indexOf(editedData.currency);
                    setEditedData((prev) => ({
                      ...prev,
                      currency: currencies[(idx + 1) % currencies.length],
                    }));
                  }}
                >
                  <Text style={styles.currencyText}>{editedData.currency}</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  value={editedData.total}
                  onChangeText={(text) => setEditedData((prev) => ({ ...prev, total: text }))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
              </View>
            ) : (
              <Text style={styles.fieldValueLarge}>
                {finalData?.currency} {finalData?.total.toFixed(2)}
              </Text>
            )}
          </View>

          {/* Category */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>Category</Text>
              {extraction?.suggestedCategory && (
                <View
                  style={[
                    styles.confidenceBadge,
                    {
                      backgroundColor:
                        getConfidenceColor(extraction.suggestedCategory.confidence) + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.confidenceText,
                      { color: getConfidenceColor(extraction.suggestedCategory.confidence) },
                    ]}
                  >
                    {Math.round(extraction.suggestedCategory.confidence * 100)}%
                  </Text>
                </View>
              )}
            </View>
            {isEditing ? (
              <TouchableOpacity
                style={styles.categorySelector}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text style={styles.categorySelectorIcon}>{categoryInfo.icon}</Text>
                <Text style={styles.categorySelectorText}>{categoryInfo.name}</Text>
                <Text style={styles.categorySelectorArrow}>▼</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.categoryDisplay}>
                <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
                <Text style={styles.categoryName}>{categoryInfo.name}</Text>
              </View>
            )}
          </View>

          {/* Payment Method */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Payment Method</Text>
            {isEditing ? (
              <View style={styles.paymentOptions}>
                {(['cash', 'card', 'mobile'] as const).map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.paymentOption,
                      editedData.paymentMethod === method && styles.paymentOptionActive,
                    ]}
                    onPress={() => setEditedData((prev) => ({ ...prev, paymentMethod: method }))}
                  >
                    <Text style={styles.paymentOptionIcon}>
                      {method === 'cash' ? '💵' : method === 'card' ? '💳' : '📱'}
                    </Text>
                    <Text
                      style={[
                        styles.paymentOptionText,
                        editedData.paymentMethod === method && styles.paymentOptionTextActive,
                      ]}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.categoryDisplay}>
                <Text style={styles.categoryIcon}>
                  {finalData?.paymentMethod === 'cash'
                    ? '💵'
                    : finalData?.paymentMethod === 'card'
                      ? '💳'
                      : '📱'}
                </Text>
                <Text style={styles.categoryName}>
                  {finalData?.paymentMethod?.charAt(0).toUpperCase() +
                    finalData?.paymentMethod?.slice(1)}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Description</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                value={editedData.description}
                onChangeText={(text) => setEditedData((prev) => ({ ...prev, description: text }))}
                placeholder="Enter description"
                multiline
              />
            ) : (
              <Text style={styles.fieldValue}>{finalData?.description}</Text>
            )}
          </View>
        </View>

        {/* Line Items (if any) */}
        {extraction?.lineItems && extraction.lineItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items ({extraction.lineItems.length})</Text>
            <View style={styles.lineItemsCard}>
              {extraction.lineItems.map((item, idx) => (
                <View key={idx} style={styles.lineItem}>
                  <Text style={styles.lineItemDesc} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text style={styles.lineItemPrice}>${item.totalPrice.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {isEditing ? (
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdits} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.importButton}
              onPress={handleImport}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.importButtonText}>Import to Expenses</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Category Picker Modal */}
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
                    editedData.category === cat.id && styles.pickerOptionActive,
                  ]}
                  onPress={() => {
                    setEditedData((prev) => ({ ...prev, category: cat.id }));
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionIcon}>{cat.icon}</Text>
                  <Text style={styles.pickerOptionText}>{cat.name}</Text>
                  {editedData.category === cat.id && (
                    <Text style={styles.pickerOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#1a1a1a',
    height: 200,
    position: 'relative',
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageOverlayText: {
    fontSize: 12,
    color: '#fff',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  fieldValueLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  amountRow: {
    flexDirection: 'row',
  },
  currencyPicker: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginRight: 8,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  categorySelectorIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  categorySelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  categorySelectorArrow: {
    fontSize: 12,
    color: '#888',
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  categoryName: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  paymentOptionActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  paymentOptionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  paymentOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  paymentOptionTextActive: {
    color: '#fff',
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  lineItemsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  lineItemDesc: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 16,
  },
  lineItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
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
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  discardButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  discardButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#666',
  },
  importButton: {
    flex: 2,
    backgroundColor: '#34C759',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  importButtonText: {
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
  pickerOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  pickerOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  pickerOptionCheck: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
});

export default ReceiptReviewScreen;
