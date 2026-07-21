// Paint the Town Receipt Scanner - Receipt Service

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Receipt,
  ReceiptImage,
  ReceiptStatus,
  ReceiptExtractionResult,
  ReceiptScannerSettings,
  ExpenseImportData,
  ImportResult,
  ProcessingProgress,
} from '../types/receipt';
import { ocrService } from './ocrService';

const STORAGE_KEYS = {
  RECEIPTS: '@w4nder/receipts',
  SETTINGS: '@w4nder/receipt_settings',
};

const DEFAULT_SETTINGS: ReceiptScannerSettings = {
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
};

class ReceiptService {
  private settings: ReceiptScannerSettings = DEFAULT_SETTINGS;
  private progressCallback: ((progress: ProcessingProgress) => void) | null = null;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(): Promise<void> {
    await this.loadSettings();
  }

  // ============================================================================
  // SETTINGS
  // ============================================================================

  async loadSettings(): Promise<ReceiptScannerSettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load receipt settings:', error);
    }
    return this.settings;
  }

  async saveSettings(updates: Partial<ReceiptScannerSettings>): Promise<ReceiptScannerSettings> {
    this.settings = { ...this.settings, ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    return this.settings;
  }

  getSettings(): ReceiptScannerSettings {
    return this.settings;
  }

  // ============================================================================
  // PROCESSING CALLBACK
  // ============================================================================

  setProgressCallback(callback: (progress: ProcessingProgress) => void): void {
    this.progressCallback = callback;
    ocrService.setProgressCallback(callback);
  }

  // ============================================================================
  // RECEIPT CRUD
  // ============================================================================

  async getReceipts(): Promise<Receipt[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.RECEIPTS);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load receipts:', error);
      return [];
    }
  }

  async getReceipt(id: string): Promise<Receipt | null> {
    const receipts = await this.getReceipts();
    return receipts.find((r) => r.id === id) || null;
  }

  async saveReceipt(receipt: Receipt): Promise<Receipt> {
    const receipts = await this.getReceipts();
    const index = receipts.findIndex((r) => r.id === receipt.id);

    if (index >= 0) {
      receipts[index] = { ...receipt, updatedAt: new Date().toISOString() };
    } else {
      receipts.unshift(receipt);
    }

    // Trim to max receipts
    const trimmed = receipts.slice(0, this.settings.maxStoredReceipts);

    await AsyncStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(trimmed));
    return receipt;
  }

  async deleteReceipt(id: string): Promise<boolean> {
    const receipts = await this.getReceipts();
    const filtered = receipts.filter((r) => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(filtered));
    return filtered.length !== receipts.length;
  }

  async clearOldReceipts(): Promise<number> {
    const receipts = await this.getReceipts();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.settings.autoDeleteAfterDays);

    const filtered = receipts.filter(
      (r) => r.status === 'imported' || new Date(r.createdAt) > cutoffDate
    );

    const removed = receipts.length - filtered.length;
    if (removed > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(filtered));
    }

    return removed;
  }

  // ============================================================================
  // PROCESSING
  // ============================================================================

  async processReceiptImage(imageUri: string, tripId?: string): Promise<Receipt> {
    const now = new Date().toISOString();

    // Create initial receipt
    const receipt: Receipt = {
      id: `receipt_${Date.now()}`,
      image: {
        uri: imageUri,
        width: 0,
        height: 0,
        mimeType: 'image/jpeg',
        takenAt: now,
      },
      status: 'processing',
      extraction: null,
      userCorrections: {},
      finalData: null,
      tripId,
      createdAt: now,
      updatedAt: now,
    };

    await this.saveReceipt(receipt);

    try {
      // Run OCR and extraction
      const extraction = await ocrService.processReceipt(imageUri);

      receipt.extraction = extraction;
      receipt.status = 'reviewing';

      // Build final data from extraction
      receipt.finalData = this.buildFinalData(extraction);

      await this.saveReceipt(receipt);
      return receipt;
    } catch (error) {
      receipt.status = 'failed';
      await this.saveReceipt(receipt);
      throw error;
    }
  }

  private buildFinalData(extraction: ReceiptExtractionResult): Receipt['finalData'] {
    return {
      merchant: extraction.merchant?.name || 'Unknown Merchant',
      date: extraction.date?.date || new Date().toISOString().split('T')[0],
      total: extraction.total?.value || 0,
      currency: extraction.currency?.code || this.settings.defaultCurrency,
      category: extraction.suggestedCategory?.category || this.settings.defaultCategory,
      description: this.buildDescription(extraction),
      paymentMethod: this.mapPaymentMethod(extraction.paymentMethod?.type),
    };
  }

  private buildDescription(extraction: ReceiptExtractionResult): string {
    const merchant = extraction.merchant?.name;
    const itemCount = extraction.lineItems.length;

    if (itemCount > 0 && itemCount <= 3) {
      return extraction.lineItems.map((i) => i.description).join(', ');
    }

    if (merchant) {
      return `Purchase at ${merchant}`;
    }

    return 'Receipt purchase';
  }

  private mapPaymentMethod(type: string | undefined): 'cash' | 'card' | 'mobile' | 'other' {
    if (type === 'cash' || type === 'card' || type === 'mobile') {
      return type;
    }
    return this.settings.defaultPaymentMethod;
  }

  // ============================================================================
  // USER CORRECTIONS
  // ============================================================================

  async applyCorrections(
    receiptId: string,
    corrections: Receipt['userCorrections']
  ): Promise<Receipt | null> {
    const receipt = await this.getReceipt(receiptId);
    if (!receipt) return null;

    receipt.userCorrections = { ...receipt.userCorrections, ...corrections };

    // Rebuild final data with corrections
    if (receipt.finalData) {
      receipt.finalData = {
        ...receipt.finalData,
        ...(corrections.merchant && { merchant: corrections.merchant }),
        ...(corrections.date && { date: corrections.date }),
        ...(corrections.total !== undefined && { total: corrections.total }),
        ...(corrections.currency && { currency: corrections.currency }),
        ...(corrections.category && { category: corrections.category }),
        ...(corrections.description && { description: corrections.description }),
        ...(corrections.paymentMethod && { paymentMethod: corrections.paymentMethod }),
      };
    }

    await this.saveReceipt(receipt);
    return receipt;
  }

  async confirmReceipt(receiptId: string): Promise<Receipt | null> {
    const receipt = await this.getReceipt(receiptId);
    if (!receipt) return null;

    receipt.status = 'confirmed';
    await this.saveReceipt(receipt);
    return receipt;
  }

  async discardReceipt(receiptId: string): Promise<boolean> {
    const receipt = await this.getReceipt(receiptId);
    if (!receipt) return false;

    receipt.status = 'discarded';
    await this.saveReceipt(receipt);
    return true;
  }

  // ============================================================================
  // EXPENSE INTEGRATION
  // ============================================================================

  getExpenseImportData(receipt: Receipt): ExpenseImportData | null {
    if (!receipt.finalData) return null;

    return {
      amount: receipt.finalData.total,
      currency: receipt.finalData.currency,
      description: receipt.finalData.description,
      category: receipt.finalData.category,
      vendor: receipt.finalData.merchant,
      date: receipt.finalData.date,
      paymentMethod: receipt.finalData.paymentMethod,
      receiptImageUri: receipt.image.uri,
      receiptId: receipt.id,
      tripId: receipt.tripId,
    };
  }

  async markAsImported(receiptId: string, expenseId: string): Promise<Receipt | null> {
    const receipt = await this.getReceipt(receiptId);
    if (!receipt) return null;

    receipt.status = 'imported';
    receipt.expenseId = expenseId;
    receipt.importedAt = new Date().toISOString();

    await this.saveReceipt(receipt);
    return receipt;
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<ReceiptStatus, number>;
    totalImported: number;
    averageConfidence: number;
  }> {
    const receipts = await this.getReceipts();

    const byStatus: Record<string, number> = {
      capturing: 0,
      processing: 0,
      reviewing: 0,
      confirmed: 0,
      imported: 0,
      failed: 0,
      discarded: 0,
    };

    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const receipt of receipts) {
      byStatus[receipt.status] = (byStatus[receipt.status] || 0) + 1;

      if (receipt.extraction?.overallConfidence) {
        totalConfidence += receipt.extraction.overallConfidence;
        confidenceCount++;
      }
    }

    return {
      total: receipts.length,
      byStatus: byStatus as Record<ReceiptStatus, number>,
      totalImported: byStatus.imported || 0,
      averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
    };
  }

  // ============================================================================
  // FILTERING
  // ============================================================================

  async getReceiptsByStatus(status: ReceiptStatus): Promise<Receipt[]> {
    const receipts = await this.getReceipts();
    return receipts.filter((r) => r.status === status);
  }

  async getReceiptsByTrip(tripId: string): Promise<Receipt[]> {
    const receipts = await this.getReceipts();
    return receipts.filter((r) => r.tripId === tripId);
  }

  async getPendingReceipts(): Promise<Receipt[]> {
    const receipts = await this.getReceipts();
    return receipts.filter((r) => r.status === 'reviewing' || r.status === 'confirmed');
  }
}

export const receiptService = new ReceiptService();
