// Paint the Town Receipt Scanner - useReceiptScanner Hook

import { useState, useCallback, useEffect, useMemo } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  Receipt,
  ReceiptStatus,
  ReceiptScannerSettings,
  ProcessingProgress,
  ProcessingError,
  ExpenseImportData,
  ReceiptScannerState,
} from '../types/receipt';
import { receiptService } from '../services/receiptService';

interface UseReceiptScannerOptions {
  tripId?: string;
  onImportSuccess?: (expenseId: string) => void;
}

export function useReceiptScanner(options: UseReceiptScannerOptions = {}) {
  const { tripId, onImportSuccess } = options;

  // Core state
  const [state, setState] = useState<ReceiptScannerState>({
    currentReceipt: null,
    isProcessing: false,
    processingProgress: null,
    processingError: null,
    receipts: [],
    settings: {
      autoDetectCurrency: true,
      autoDetectCategory: true,
      autoDetectPaymentMethod: true,
      defaultCurrency: 'USD',
      defaultCategory: 'other',
      defaultPaymentMethod: 'card',
      saveOriginalImage: true,
      generateThumbnail: true,
      thumbnailSize: 200,
      minimumConfidence: 0.6,
      maxStoredReceipts: 100,
      autoDeleteAfterDays: 90,
    },
    isCameraReady: false,
    flashMode: 'auto',
    isLoading: true,
    error: null,
  });

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    initialize();
  }, []);

  const initialize = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await receiptService.initialize();
      
      const settings = await receiptService.loadSettings();
      const receipts = tripId 
        ? await receiptService.getReceiptsByTrip(tripId)
        : await receiptService.getReceipts();
      
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      setState(prev => ({
        ...prev,
        settings,
        receipts,
        isCameraReady: status === 'granted',
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to initialize receipt scanner',
      }));
    }
  }, [tripId]);

  // ============================================================================
  // PROGRESS TRACKING
  // ============================================================================

  useEffect(() => {
    receiptService.setProgressCallback((progress) => {
      setState(prev => ({ ...prev, processingProgress: progress }));
    });
  }, []);

  // ============================================================================
  // CAPTURE
  // ============================================================================

  const captureFromCamera = useCallback(async (): Promise<Receipt | null> => {
    if (!state.isCameraReady) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setState(prev => ({ ...prev, error: 'Camera permission required' }));
        return null;
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [3, 4],
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      return await processImage(result.assets[0].uri);
    } catch (error) {
      setState(prev => ({
        ...prev,
        processingError: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to capture image',
          retryable: true,
        },
      }));
      return null;
    }
  }, [state.isCameraReady]);

  const pickFromGallery = useCallback(async (): Promise<Receipt | null> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setState(prev => ({ ...prev, error: 'Gallery permission required' }));
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [3, 4],
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      return await processImage(result.assets[0].uri);
    } catch (error) {
      setState(prev => ({
        ...prev,
        processingError: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to select image',
          retryable: true,
        },
      }));
      return null;
    }
  }, []);

  // ============================================================================
  // PROCESSING
  // ============================================================================

  const processImage = useCallback(async (imageUri: string): Promise<Receipt | null> => {
    setState(prev => ({
      ...prev,
      isProcessing: true,
      processingProgress: { stage: 'uploading', progress: 0, message: 'Starting...' },
      processingError: null,
    }));

    try {
      const receipt = await receiptService.processReceiptImage(imageUri, tripId);
      
      setState(prev => ({
        ...prev,
        currentReceipt: receipt,
        receipts: [receipt, ...prev.receipts.filter(r => r.id !== receipt.id)],
        isProcessing: false,
        processingProgress: null,
      }));

      return receipt;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingProgress: null,
        processingError: {
          code: 'OCR_FAILED',
          message: error.message || 'Failed to process receipt',
          retryable: true,
        },
      }));
      return null;
    }
  }, [tripId]);

  const retryProcessing = useCallback(async (): Promise<Receipt | null> => {
    if (!state.currentReceipt?.image?.uri) return null;
    return processImage(state.currentReceipt.image.uri);
  }, [state.currentReceipt, processImage]);

  // ============================================================================
  // CORRECTIONS
  // ============================================================================

  const updateCorrections = useCallback(async (
    corrections: Receipt['userCorrections']
  ): Promise<Receipt | null> => {
    if (!state.currentReceipt) return null;

    const updated = await receiptService.applyCorrections(
      state.currentReceipt.id,
      corrections
    );

    if (updated) {
      setState(prev => ({
        ...prev,
        currentReceipt: updated,
        receipts: prev.receipts.map(r => r.id === updated.id ? updated : r),
      }));
    }

    return updated;
  }, [state.currentReceipt]);

  const setMerchant = useCallback((merchant: string) => {
    return updateCorrections({ merchant });
  }, [updateCorrections]);

  const setDate = useCallback((date: string) => {
    return updateCorrections({ date });
  }, [updateCorrections]);

  const setTotal = useCallback((total: number) => {
    return updateCorrections({ total });
  }, [updateCorrections]);

  const setCurrency = useCallback((currency: string) => {
    return updateCorrections({ currency });
  }, [updateCorrections]);

  const setCategory = useCallback((category: string) => {
    return updateCorrections({ category });
  }, [updateCorrections]);

  const setDescription = useCallback((description: string) => {
    return updateCorrections({ description });
  }, [updateCorrections]);

  const setPaymentMethod = useCallback((
    paymentMethod: 'cash' | 'card' | 'mobile' | 'other'
  ) => {
    return updateCorrections({ paymentMethod });
  }, [updateCorrections]);

  // ============================================================================
  // CONFIRMATION & IMPORT
  // ============================================================================

  const confirmReceipt = useCallback(async (): Promise<Receipt | null> => {
    if (!state.currentReceipt) return null;

    const confirmed = await receiptService.confirmReceipt(state.currentReceipt.id);
    
    if (confirmed) {
      setState(prev => ({
        ...prev,
        currentReceipt: confirmed,
        receipts: prev.receipts.map(r => r.id === confirmed.id ? confirmed : r),
      }));
    }

    return confirmed;
  }, [state.currentReceipt]);

  const discardReceipt = useCallback(async (): Promise<boolean> => {
    if (!state.currentReceipt) return false;

    const success = await receiptService.discardReceipt(state.currentReceipt.id);
    
    if (success) {
      setState(prev => ({
        ...prev,
        currentReceipt: null,
        receipts: prev.receipts.filter(r => r.id !== state.currentReceipt?.id),
      }));
    }

    return success;
  }, [state.currentReceipt]);

  const getImportData = useCallback((): ExpenseImportData | null => {
    if (!state.currentReceipt) return null;
    return receiptService.getExpenseImportData(state.currentReceipt);
  }, [state.currentReceipt]);

  const markAsImported = useCallback(async (expenseId: string): Promise<boolean> => {
    if (!state.currentReceipt) return false;

    const updated = await receiptService.markAsImported(
      state.currentReceipt.id,
      expenseId
    );

    if (updated) {
      setState(prev => ({
        ...prev,
        currentReceipt: null,
        receipts: prev.receipts.map(r => r.id === updated.id ? updated : r),
      }));
      onImportSuccess?.(expenseId);
      return true;
    }

    return false;
  }, [state.currentReceipt, onImportSuccess]);

  // ============================================================================
  // RECEIPT MANAGEMENT
  // ============================================================================

  const loadReceipt = useCallback(async (receiptId: string): Promise<Receipt | null> => {
    const receipt = await receiptService.getReceipt(receiptId);
    
    if (receipt) {
      setState(prev => ({ ...prev, currentReceipt: receipt }));
    }

    return receipt;
  }, []);

  const deleteReceipt = useCallback(async (receiptId: string): Promise<boolean> => {
    const success = await receiptService.deleteReceipt(receiptId);
    
    if (success) {
      setState(prev => ({
        ...prev,
        receipts: prev.receipts.filter(r => r.id !== receiptId),
        currentReceipt: prev.currentReceipt?.id === receiptId ? null : prev.currentReceipt,
      }));
    }

    return success;
  }, []);

  const refreshReceipts = useCallback(async () => {
    const receipts = tripId
      ? await receiptService.getReceiptsByTrip(tripId)
      : await receiptService.getReceipts();
    
    setState(prev => ({ ...prev, receipts }));
  }, [tripId]);

  const clearCurrent = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentReceipt: null,
      processingError: null,
      processingProgress: null,
    }));
  }, []);

  // ============================================================================
  // SETTINGS
  // ============================================================================

  const updateSettings = useCallback(async (
    updates: Partial<ReceiptScannerSettings>
  ) => {
    const settings = await receiptService.saveSettings(updates);
    setState(prev => ({ ...prev, settings }));
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const pendingReceipts = useMemo(() => {
    return state.receipts.filter(r => 
      r.status === 'reviewing' || r.status === 'confirmed'
    );
  }, [state.receipts]);

  const importedReceipts = useMemo(() => {
    return state.receipts.filter(r => r.status === 'imported');
  }, [state.receipts]);

  const hasLowConfidence = useMemo(() => {
    if (!state.currentReceipt?.extraction) return false;
    return state.currentReceipt.extraction.overallConfidence < state.settings.minimumConfidence;
  }, [state.currentReceipt, state.settings.minimumConfidence]);

  const extractionSummary = useMemo(() => {
    if (!state.currentReceipt?.extraction) return null;
    const e = state.currentReceipt.extraction;
    return {
      hasMerchant: !!e.merchant,
      hasDate: !!e.date,
      hasTotal: !!e.total,
      hasCategory: !!e.suggestedCategory,
      itemCount: e.lineItems.length,
      confidence: e.overallConfidence,
    };
  }, [state.currentReceipt]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    ...state,
    isReady: !state.isLoading && state.isCameraReady,
    
    // Capture
    captureFromCamera,
    pickFromGallery,
    
    // Processing
    processImage,
    retryProcessing,
    
    // Corrections
    updateCorrections,
    setMerchant,
    setDate,
    setTotal,
    setCurrency,
    setCategory,
    setDescription,
    setPaymentMethod,
    
    // Confirmation & Import
    confirmReceipt,
    discardReceipt,
    getImportData,
    markAsImported,
    
    // Receipt management
    loadReceipt,
    deleteReceipt,
    refreshReceipts,
    clearCurrent,
    
    // Settings
    updateSettings,
    
    // Computed
    pendingReceipts,
    importedReceipts,
    hasLowConfidence,
    extractionSummary,
    
    // Utilities
    refresh: initialize,
  };
}
