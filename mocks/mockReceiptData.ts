// Paint the Town Receipt Scanner - Mock Data

import { Receipt, ReceiptScannerSettings } from '../types/receipt';

// ============================================================================
// EXPENSE CATEGORIES (shared with multi-currency module)
// ============================================================================

export const EXPENSE_CATEGORIES = [
  { id: 'accommodation', name: 'Accommodation', icon: '🏨', color: '#5856D6' },
  { id: 'transportation', name: 'Transportation', icon: '🚗', color: '#007AFF' },
  { id: 'food_drink', name: 'Food & Drink', icon: '🍽️', color: '#FF9500' },
  { id: 'activities', name: 'Activities', icon: '🎯', color: '#34C759' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#FF2D55' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎭', color: '#AF52DE' },
  { id: 'health', name: 'Health', icon: '💊', color: '#00C7BE' },
  { id: 'communication', name: 'Communication', icon: '📱', color: '#5AC8FA' },
  { id: 'fees', name: 'Fees & Charges', icon: '🏦', color: '#8E8E93' },
  { id: 'tips', name: 'Tips', icon: '💰', color: '#FFD60A' },
  { id: 'other', name: 'Other', icon: '📝', color: '#636366' },
];

// ============================================================================
// CURRENCY INFO
// ============================================================================

export const CURRENCY_SYMBOLS: Record<string, { symbol: string; position: 'before' | 'after' }> = {
  USD: { symbol: '$', position: 'before' },
  EUR: { symbol: '€', position: 'before' },
  GBP: { symbol: '£', position: 'before' },
  JPY: { symbol: '¥', position: 'before' },
  CNY: { symbol: '¥', position: 'before' },
  CAD: { symbol: 'C$', position: 'before' },
  AUD: { symbol: 'A$', position: 'before' },
  CHF: { symbol: 'CHF', position: 'before' },
};

// ============================================================================
// SAMPLE RECEIPTS
// ============================================================================

export const MOCK_RECEIPTS: Receipt[] = [
  {
    id: 'receipt_001',
    image: {
      uri: 'https://example.com/receipt1.jpg',
      width: 300,
      height: 400,
      mimeType: 'image/jpeg',
      takenAt: '2024-03-15T10:30:00Z',
    },
    status: 'reviewing',
    extraction: {
      merchant: {
        name: 'Starbucks Coffee',
        confidence: 0.95,
        originalText: 'STARBUCKS COFFEE',
      },
      date: {
        date: '2024-03-15',
        confidence: 0.9,
        originalText: '03/15/2024',
      },
      total: {
        value: 8.45,
        currency: 'USD',
        confidence: 0.92,
        originalText: 'TOTAL $8.45',
        type: 'total',
      },
      subtotal: {
        value: 7.70,
        currency: 'USD',
        confidence: 0.88,
        originalText: 'Subtotal $7.70',
        type: 'subtotal',
      },
      tax: {
        value: 0.75,
        currency: 'USD',
        confidence: 0.85,
        originalText: 'Tax $0.75',
        type: 'tax',
      },
      tip: null,
      lineItems: [
        { description: 'Grande Latte', totalPrice: 4.95, confidence: 0.8, originalText: 'Grande Latte      $4.95' },
        { description: 'Blueberry Muffin', totalPrice: 2.75, confidence: 0.8, originalText: 'Blueberry Muffin  $2.75' },
      ],
      paymentMethod: {
        type: 'card',
        lastFourDigits: '1234',
        cardType: 'Visa',
        confidence: 0.9,
      },
      currency: {
        code: 'USD',
        confidence: 0.95,
        detectedSymbol: '$',
      },
      suggestedCategory: {
        category: 'food_drink',
        confidence: 0.95,
        reason: 'Recognized merchant: Starbucks',
      },
      rawOCR: {
        fullText: 'STARBUCKS COFFEE\n123 Main St\n03/15/2024\nGrande Latte $4.95\nBlueberry Muffin $2.75\nSubtotal $7.70\nTax $0.75\nTOTAL $8.45\nVISA ****1234',
        blocks: [],
        language: 'en',
        confidence: 0.88,
        processedAt: '2024-03-15T10:31:00Z',
      },
      overallConfidence: 0.88,
      extractedAt: '2024-03-15T10:31:00Z',
    },
    userCorrections: {},
    finalData: {
      merchant: 'Starbucks Coffee',
      date: '2024-03-15',
      total: 8.45,
      currency: 'USD',
      category: 'food_drink',
      description: 'Grande Latte, Blueberry Muffin',
      paymentMethod: 'card',
    },
    createdAt: '2024-03-15T10:30:00Z',
    updatedAt: '2024-03-15T10:31:00Z',
  },
  {
    id: 'receipt_002',
    image: {
      uri: 'https://example.com/receipt2.jpg',
      width: 300,
      height: 400,
      mimeType: 'image/jpeg',
      takenAt: '2024-03-14T19:45:00Z',
    },
    status: 'imported',
    extraction: {
      merchant: {
        name: 'The Italian Kitchen',
        confidence: 0.85,
        originalText: 'THE ITALIAN KITCHEN',
      },
      date: {
        date: '2024-03-14',
        confidence: 0.88,
        originalText: 'March 14, 2024',
      },
      total: {
        value: 67.50,
        currency: 'USD',
        confidence: 0.9,
        originalText: 'Total: $67.50',
        type: 'total',
      },
      subtotal: {
        value: 52.00,
        currency: 'USD',
        confidence: 0.85,
        originalText: 'Subtotal $52.00',
        type: 'subtotal',
      },
      tax: {
        value: 5.50,
        currency: 'USD',
        confidence: 0.85,
        originalText: 'Tax $5.50',
        type: 'tax',
      },
      tip: {
        value: 10.00,
        currency: 'USD',
        confidence: 0.82,
        originalText: 'Tip $10.00',
        type: 'tip',
      },
      lineItems: [
        { description: 'Pasta Carbonara', totalPrice: 18.95, confidence: 0.8, originalText: 'Pasta Carbonara $18.95' },
        { description: 'Caesar Salad', totalPrice: 12.50, confidence: 0.8, originalText: 'Caesar Salad $12.50' },
        { description: 'Tiramisu', totalPrice: 8.50, confidence: 0.8, originalText: 'Tiramisu $8.50' },
        { description: 'Glass of Wine', totalPrice: 12.05, confidence: 0.75, originalText: 'Wine (Glass) $12.05' },
      ],
      paymentMethod: {
        type: 'card',
        lastFourDigits: '5678',
        cardType: 'Mastercard',
        confidence: 0.88,
      },
      currency: {
        code: 'USD',
        confidence: 0.95,
        detectedSymbol: '$',
      },
      suggestedCategory: {
        category: 'food_drink',
        confidence: 0.9,
        reason: 'Matched keywords: restaurant, wine',
      },
      rawOCR: {
        fullText: 'THE ITALIAN KITCHEN\n456 Oak Ave\nMarch 14, 2024\nPasta Carbonara $18.95\nCaesar Salad $12.50\nTiramisu $8.50\nWine (Glass) $12.05\nSubtotal $52.00\nTax $5.50\nTip $10.00\nTotal: $67.50\nMastercard ****5678',
        blocks: [],
        language: 'en',
        confidence: 0.85,
        processedAt: '2024-03-14T19:46:00Z',
      },
      overallConfidence: 0.85,
      extractedAt: '2024-03-14T19:46:00Z',
    },
    userCorrections: {},
    finalData: {
      merchant: 'The Italian Kitchen',
      date: '2024-03-14',
      total: 67.50,
      currency: 'USD',
      category: 'food_drink',
      description: 'Dinner at The Italian Kitchen',
      paymentMethod: 'card',
    },
    expenseId: 'exp_002',
    createdAt: '2024-03-14T19:45:00Z',
    updatedAt: '2024-03-14T19:50:00Z',
    importedAt: '2024-03-14T19:50:00Z',
  },
];

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

export const DEFAULT_SCANNER_SETTINGS: ReceiptScannerSettings = {
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

// ============================================================================
// KNOWN MERCHANTS (for better recognition)
// ============================================================================

export const KNOWN_MERCHANTS = [
  { name: 'Starbucks', aliases: ['starbucks coffee', 'sbux'], category: 'food_drink' },
  { name: 'McDonald\'s', aliases: ['mcdonalds', 'mcd'], category: 'food_drink' },
  { name: 'Uber', aliases: ['uber technologies', 'uber trip'], category: 'transportation' },
  { name: 'Lyft', aliases: ['lyft inc'], category: 'transportation' },
  { name: 'Amazon', aliases: ['amazon.com', 'amzn'], category: 'shopping' },
  { name: 'Walmart', aliases: ['wal-mart'], category: 'shopping' },
  { name: 'Target', aliases: ['target stores'], category: 'shopping' },
  { name: 'CVS', aliases: ['cvs pharmacy'], category: 'health' },
  { name: 'Walgreens', aliases: ['walgreen co'], category: 'health' },
  { name: 'Shell', aliases: ['shell oil'], category: 'transportation' },
  { name: 'Chevron', aliases: ['chevron gas'], category: 'transportation' },
  { name: 'Marriott', aliases: ['marriott hotels'], category: 'accommodation' },
  { name: 'Hilton', aliases: ['hilton hotels'], category: 'accommodation' },
];

// ============================================================================
// OCR TEST DATA
// ============================================================================

export const SAMPLE_OCR_TEXTS = {
  cafe: `STARBUCKS COFFEE
123 Main Street
San Francisco, CA 94102

03/15/2024  10:32 AM

Grande Latte              $4.95
Blueberry Muffin          $2.75

Subtotal                  $7.70
Tax                       $0.75
Total                     $8.45

VISA ****1234
Thank you!`,

  restaurant: `THE ITALIAN KITCHEN
456 Oak Avenue
New York, NY 10001
(212) 555-1234

Date: March 14, 2024
Table: 12
Server: Mike

Pasta Carbonara           $18.95
Caesar Salad              $12.50
Tiramisu                   $8.50
Glass of Wine              $9.00

Subtotal                  $48.95
Tax                        $4.90
Tip                       $10.00
------------------------
TOTAL                     $63.85

Mastercard ending 5678
Thank you for dining with us!`,

  retail: `TARGET
789 Shopping Center Dr
Chicago, IL 60601

03/16/2024

Toothpaste                 $4.99
Shampoo                    $7.49
Batteries                 $12.99
Snacks                     $5.49

SUBTOTAL                  $30.96
TAX                        $2.48
TOTAL                     $33.44

CASH TENDERED             $40.00
CHANGE                     $6.56

Thank you for shopping!`,
};
