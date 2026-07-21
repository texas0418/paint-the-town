// Paint the Town Receipt Scanner - Type Definitions

// ============================================================================
// OCR & EXTRACTION
// ============================================================================

export interface OCRBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRTextBlock {
  text: string;
  confidence: number;
  boundingBox: OCRBoundingBox;
  type: 'line' | 'word' | 'paragraph';
}

export interface OCRResult {
  fullText: string;
  blocks: OCRTextBlock[];
  language: string;
  confidence: number;
  processedAt: string;
}

export interface ExtractedAmount {
  value: number;
  currency: string;
  confidence: number;
  originalText: string;
  boundingBox?: OCRBoundingBox;
  type: 'total' | 'subtotal' | 'tax' | 'tip' | 'item' | 'unknown';
}

export interface ExtractedDate {
  date: string; // ISO format
  confidence: number;
  originalText: string;
  boundingBox?: OCRBoundingBox;
}

export interface ExtractedMerchant {
  name: string;
  confidence: number;
  originalText: string;
  boundingBox?: OCRBoundingBox;
  address?: string;
  phone?: string;
  website?: string;
}

export interface ExtractedLineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
  confidence: number;
  originalText: string;
}

export interface ReceiptExtractionResult {
  // Primary fields
  merchant: ExtractedMerchant | null;
  date: ExtractedDate | null;
  total: ExtractedAmount | null;

  // Additional amounts
  subtotal: ExtractedAmount | null;
  tax: ExtractedAmount | null;
  tip: ExtractedAmount | null;

  // Line items
  lineItems: ExtractedLineItem[];

  // Payment info
  paymentMethod: {
    type: 'cash' | 'card' | 'mobile' | 'unknown';
    lastFourDigits?: string;
    cardType?: string;
    confidence: number;
  } | null;

  // Metadata
  currency: {
    code: string;
    confidence: number;
    detectedSymbol: string;
  };

  // Category suggestion
  suggestedCategory: {
    category: string;
    confidence: number;
    reason: string;
  } | null;

  // Raw OCR
  rawOCR: OCRResult;

  // Overall confidence
  overallConfidence: number;
  extractedAt: string;
}

// ============================================================================
// RECEIPT
// ============================================================================

export type ReceiptStatus =
  | 'capturing' // Taking photo
  | 'processing' // Running OCR
  | 'reviewing' // User reviewing extracted data
  | 'confirmed' // User confirmed, ready to import
  | 'imported' // Imported to expense tracker
  | 'failed' // OCR or processing failed
  | 'discarded'; // User discarded

export interface ReceiptImage {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
  fileSize?: number;
  takenAt: string;
}

export interface Receipt {
  id: string;

  // Image
  image: ReceiptImage;
  thumbnailUri?: string;

  // Status
  status: ReceiptStatus;

  // Extraction results
  extraction: ReceiptExtractionResult | null;

  // User corrections (overrides extraction)
  userCorrections: {
    merchant?: string;
    date?: string;
    total?: number;
    currency?: string;
    category?: string;
    description?: string;
    paymentMethod?: 'cash' | 'card' | 'mobile' | 'other';
  };

  // Final values (extraction + corrections)
  finalData: {
    merchant: string;
    date: string;
    total: number;
    currency: string;
    category: string;
    description: string;
    paymentMethod: 'cash' | 'card' | 'mobile' | 'other';
  } | null;

  // Link to expense
  expenseId?: string;
  tripId?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  importedAt?: string;
}

// ============================================================================
// PROCESSING
// ============================================================================

export interface ProcessingProgress {
  stage: 'uploading' | 'analyzing' | 'extracting' | 'categorizing' | 'complete';
  progress: number; // 0-100
  message: string;
}

export interface ProcessingError {
  code: 'UPLOAD_FAILED' | 'OCR_FAILED' | 'EXTRACTION_FAILED' | 'NETWORK_ERROR' | 'INVALID_IMAGE';
  message: string;
  details?: string;
  retryable: boolean;
}

// ============================================================================
// SETTINGS
// ============================================================================

export interface ReceiptScannerSettings {
  // Auto-detection
  autoDetectCurrency: boolean;
  autoDetectCategory: boolean;
  autoDetectPaymentMethod: boolean;

  // Default values
  defaultCurrency: string;
  defaultCategory: string;
  defaultPaymentMethod: 'cash' | 'card' | 'mobile' | 'other';

  // Processing
  saveOriginalImage: boolean;
  generateThumbnail: boolean;
  thumbnailSize: number;

  // Quality
  minimumConfidence: number; // 0-1, below this show warning

  // Storage
  maxStoredReceipts: number;
  autoDeleteAfterDays: number;
}

// ============================================================================
// TEMPLATES
// ============================================================================

export interface MerchantTemplate {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  currency?: string;
  logoUrl?: string;
  patterns: {
    namePatterns: RegExp[];
    totalPatterns?: RegExp[];
    datePatterns?: RegExp[];
  };
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

export interface BatchScanResult {
  id: string;
  receipts: Receipt[];
  totalProcessed: number;
  successful: number;
  failed: number;
  startedAt: string;
  completedAt?: string;
}

// ============================================================================
// UI STATE
// ============================================================================

export interface ReceiptScannerState {
  // Current receipt being processed
  currentReceipt: Receipt | null;

  // Processing
  isProcessing: boolean;
  processingProgress: ProcessingProgress | null;
  processingError: ProcessingError | null;

  // All receipts
  receipts: Receipt[];

  // Settings
  settings: ReceiptScannerSettings;

  // Camera
  isCameraReady: boolean;
  flashMode: 'on' | 'off' | 'auto';

  // UI
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// EXPENSE INTEGRATION
// ============================================================================

export interface ExpenseImportData {
  amount: number;
  currency: string;
  description: string;
  category: string;
  vendor: string;
  date: string;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'other';
  receiptImageUri: string;
  receiptId: string;
  tripId?: string;
  notes?: string;
  tags?: string[];
}

export interface ImportResult {
  success: boolean;
  expenseId?: string;
  error?: string;
}
