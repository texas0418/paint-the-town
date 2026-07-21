// Paint the Town Receipt Scanner - OCR Service

import {
  OCRResult,
  OCRTextBlock,
  ReceiptExtractionResult,
  ExtractedAmount,
  ExtractedDate,
  ExtractedMerchant,
  ExtractedLineItem,
  ProcessingProgress,
  ProcessingError,
  MerchantTemplate,
} from '../types/receipt';

// ============================================================================
// MERCHANT TEMPLATES (for better recognition)
// ============================================================================

const MERCHANT_TEMPLATES: MerchantTemplate[] = [
  {
    id: 'starbucks',
    name: 'Starbucks',
    aliases: ['starbucks coffee', 'sbux'],
    category: 'food_drink',
    patterns: {
      namePatterns: [/starbucks/i, /sbux/i],
    },
  },
  {
    id: 'uber',
    name: 'Uber',
    aliases: ['uber technologies', 'uber trip'],
    category: 'transportation',
    patterns: {
      namePatterns: [/uber/i],
    },
  },
  {
    id: 'mcdonalds',
    name: "McDonald's",
    aliases: ['mcdonald', 'mcd'],
    category: 'food_drink',
    patterns: {
      namePatterns: [/mcdonald/i, /mcd['']?s/i],
    },
  },
  {
    id: 'amazon',
    name: 'Amazon',
    aliases: ['amazon.com', 'amzn'],
    category: 'shopping',
    patterns: {
      namePatterns: [/amazon/i, /amzn/i],
    },
  },
  {
    id: 'walgreens',
    name: 'Walgreens',
    aliases: [],
    category: 'health',
    patterns: {
      namePatterns: [/walgreens/i],
    },
  },
];

// ============================================================================
// CURRENCY PATTERNS
// ============================================================================

const CURRENCY_PATTERNS: { pattern: RegExp; code: string; symbol: string }[] = [
  { pattern: /\$\s*[\d,]+\.?\d*/g, code: 'USD', symbol: '$' },
  { pattern: /€\s*[\d,]+\.?\d*/g, code: 'EUR', symbol: '€' },
  { pattern: /£\s*[\d,]+\.?\d*/g, code: 'GBP', symbol: '£' },
  { pattern: /¥\s*[\d,]+/g, code: 'JPY', symbol: '¥' },
  { pattern: /[\d,]+\.?\d*\s*USD/gi, code: 'USD', symbol: '$' },
  { pattern: /[\d,]+\.?\d*\s*EUR/gi, code: 'EUR', symbol: '€' },
];

// ============================================================================
// AMOUNT PATTERNS
// ============================================================================

const TOTAL_PATTERNS = [
  /total[:\s]+[$€£¥]?\s*([\d,]+\.?\d*)/i,
  /grand\s*total[:\s]+[$€£¥]?\s*([\d,]+\.?\d*)/i,
  /amount\s*due[:\s]+[$€£¥]?\s*([\d,]+\.?\d*)/i,
  /balance\s*due[:\s]+[$€£¥]?\s*([\d,]+\.?\d*)/i,
  /[$€£¥]\s*([\d,]+\.?\d*)\s*$/m,
];

const SUBTOTAL_PATTERNS = [
  /subtotal[:\s]+[$€£¥]?\s*([\d,]+\.?\d*)/i,
  /sub\s*total[:\s]+[$€£¥]?\s*([\d,]+\.?\d*)/i,
];

const TAX_PATTERNS = [
  /tax[:\s]+[$€£¥]?\s*([\d,]+\.?\d*)/i,
  /vat[:\s]+[$€£¥]?\s*([\d,]+\.?\d*)/i,
  /gst[:\s]+[$€£¥]?\s*([\d,]+\.?\d*)/i,
  /hst[:\s]+[$€£¥]?\s*([\d,]+\.?\d*)/i,
];

const TIP_PATTERNS = [
  /tip[:\s]+[$€£¥]?\s*([\d,]+\.?\d*)/i,
  /gratuity[:\s]+[$€£¥]?\s*([\d,]+\.?\d*)/i,
  /service\s*charge[:\s]+[$€£¥]?\s*([\d,]+\.?\d*)/i,
];

// ============================================================================
// DATE PATTERNS
// ============================================================================

const DATE_PATTERNS = [
  // MM/DD/YYYY or MM-DD-YYYY
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
  // YYYY/MM/DD or YYYY-MM-DD
  /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
  // Month DD, YYYY
  /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i,
  // DD Month YYYY
  /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{4})/i,
];

// ============================================================================
// CATEGORY KEYWORDS
// ============================================================================

const CATEGORY_KEYWORDS: { category: string; keywords: string[] }[] = [
  {
    category: 'food_drink',
    keywords: [
      'restaurant',
      'cafe',
      'coffee',
      'food',
      'drink',
      'bar',
      'pub',
      'bistro',
      'diner',
      'pizza',
      'burger',
      'sushi',
      'bakery',
    ],
  },
  {
    category: 'transportation',
    keywords: [
      'uber',
      'lyft',
      'taxi',
      'metro',
      'bus',
      'train',
      'airline',
      'flight',
      'parking',
      'gas',
      'fuel',
      'petrol',
    ],
  },
  {
    category: 'accommodation',
    keywords: ['hotel', 'motel', 'inn', 'hostel', 'airbnb', 'booking', 'lodging', 'resort'],
  },
  {
    category: 'shopping',
    keywords: ['store', 'shop', 'mall', 'market', 'retail', 'amazon', 'walmart', 'target'],
  },
  {
    category: 'activities',
    keywords: [
      'museum',
      'tour',
      'ticket',
      'attraction',
      'park',
      'zoo',
      'aquarium',
      'theater',
      'cinema',
    ],
  },
  {
    category: 'health',
    keywords: ['pharmacy', 'drug', 'medical', 'hospital', 'clinic', 'doctor', 'cvs', 'walgreens'],
  },
  {
    category: 'entertainment',
    keywords: ['concert', 'show', 'event', 'game', 'sports', 'club', 'nightlife'],
  },
];

// ============================================================================
// OCR SERVICE
// ============================================================================

class OCRService {
  private progressCallback: ((progress: ProcessingProgress) => void) | null = null;

  setProgressCallback(callback: (progress: ProcessingProgress) => void): void {
    this.progressCallback = callback;
  }

  private updateProgress(
    stage: ProcessingProgress['stage'],
    progress: number,
    message: string
  ): void {
    this.progressCallback?.({ stage, progress, message });
  }

  // ============================================================================
  // MAIN PROCESSING
  // ============================================================================

  async processReceipt(imageUri: string): Promise<ReceiptExtractionResult> {
    try {
      // Stage 1: Upload/prepare image
      this.updateProgress('uploading', 10, 'Preparing image...');
      await this.simulateDelay(500);

      // Stage 2: Run OCR
      this.updateProgress('analyzing', 30, 'Analyzing receipt...');
      const ocrResult = await this.performOCR(imageUri);

      // Stage 3: Extract data
      this.updateProgress('extracting', 60, 'Extracting information...');
      const extraction = await this.extractReceiptData(ocrResult);

      // Stage 4: Categorize
      this.updateProgress('categorizing', 90, 'Categorizing expense...');
      const categorized = await this.categorizeReceipt(extraction);

      // Complete
      this.updateProgress('complete', 100, 'Processing complete');

      return categorized;
    } catch (error) {
      throw this.createError('OCR_FAILED', 'Failed to process receipt', error);
    }
  }

  // ============================================================================
  // OCR (Mock implementation - replace with real API)
  // ============================================================================

  private async performOCR(imageUri: string): Promise<OCRResult> {
    await this.simulateDelay(800);

    // In production, this would call:
    // - Google Cloud Vision API
    // - AWS Textract
    // - Azure Computer Vision
    // - Tesseract.js
    // - A dedicated receipt API like Veryfi, Taggun, etc.

    // For demo, return mock OCR based on random receipt type
    const receiptType = Math.random();

    let mockText: string;
    if (receiptType < 0.33) {
      mockText = this.generateCafeReceipt();
    } else if (receiptType < 0.66) {
      mockText = this.generateRestaurantReceipt();
    } else {
      mockText = this.generateRetailReceipt();
    }

    const blocks = this.textToBlocks(mockText);

    return {
      fullText: mockText,
      blocks,
      language: 'en',
      confidence: 0.85 + Math.random() * 0.1,
      processedAt: new Date().toISOString(),
    };
  }

  private textToBlocks(text: string): OCRTextBlock[] {
    const lines = text.split('\n').filter((line) => line.trim());
    return lines.map((line, index) => ({
      text: line,
      confidence: 0.8 + Math.random() * 0.2,
      boundingBox: {
        x: 10,
        y: 20 + index * 25,
        width: 280,
        height: 20,
      },
      type: 'line' as const,
    }));
  }

  // ============================================================================
  // DATA EXTRACTION
  // ============================================================================

  private async extractReceiptData(ocrResult: OCRResult): Promise<ReceiptExtractionResult> {
    await this.simulateDelay(300);

    const text = ocrResult.fullText;

    // Extract merchant
    const merchant = this.extractMerchant(text, ocrResult.blocks);

    // Extract date
    const date = this.extractDate(text);

    // Detect currency
    const currency = this.detectCurrency(text);

    // Extract amounts
    const total = this.extractAmount(text, TOTAL_PATTERNS, 'total');
    const subtotal = this.extractAmount(text, SUBTOTAL_PATTERNS, 'subtotal');
    const tax = this.extractAmount(text, TAX_PATTERNS, 'tax');
    const tip = this.extractAmount(text, TIP_PATTERNS, 'tip');

    // Extract line items
    const lineItems = this.extractLineItems(text);

    // Detect payment method
    const paymentMethod = this.detectPaymentMethod(text);

    // Calculate overall confidence
    const confidences = [
      merchant?.confidence || 0,
      date?.confidence || 0,
      total?.confidence || 0,
      currency.confidence,
    ];
    const overallConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

    return {
      merchant,
      date,
      total,
      subtotal,
      tax,
      tip,
      lineItems,
      paymentMethod,
      currency,
      suggestedCategory: null, // Will be filled in categorize step
      rawOCR: ocrResult,
      overallConfidence,
      extractedAt: new Date().toISOString(),
    };
  }

  private extractMerchant(text: string, blocks: OCRTextBlock[]): ExtractedMerchant | null {
    // Try matching known templates first
    for (const template of MERCHANT_TEMPLATES) {
      for (const pattern of template.patterns.namePatterns) {
        if (pattern.test(text)) {
          return {
            name: template.name,
            confidence: 0.95,
            originalText: template.name,
          };
        }
      }
    }

    // Otherwise, assume first line is merchant name
    const firstLine = blocks[0]?.text?.trim();
    if (firstLine && firstLine.length > 2 && firstLine.length < 50) {
      return {
        name: this.cleanMerchantName(firstLine),
        confidence: 0.7,
        originalText: firstLine,
      };
    }

    return null;
  }

  private cleanMerchantName(name: string): string {
    return name
      .replace(/[#*]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private extractDate(text: string): ExtractedDate | null {
    for (const pattern of DATE_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const parsedDate = this.parseDate(match);
        if (parsedDate) {
          return {
            date: parsedDate,
            confidence: 0.85,
            originalText: match[0],
          };
        }
      }
    }

    // Default to today if no date found
    return {
      date: new Date().toISOString().split('T')[0],
      confidence: 0.3,
      originalText: '',
    };
  }

  private parseDate(match: RegExpMatchArray): string | null {
    try {
      // Handle different date formats
      const monthNames: Record<string, number> = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };

      let year: number, month: number, day: number;

      // Check if contains month name
      const monthMatch = match[0]
        .toLowerCase()
        .match(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/);
      if (monthMatch) {
        month = monthNames[monthMatch[0]];
        // Find numbers
        const numbers = match[0].match(/\d+/g) || [];
        day = parseInt(numbers[0], 10);
        year = parseInt(numbers[1], 10);
        if (year < 100) year += 2000;
      } else {
        // Numeric format
        const parts = match[0].split(/[\/\-]/);
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1;
          day = parseInt(parts[2], 10);
        } else {
          // MM-DD-YYYY
          month = parseInt(parts[0], 10) - 1;
          day = parseInt(parts[1], 10);
          year = parseInt(parts[2], 10);
          if (year < 100) year += 2000;
        }
      }

      const date = new Date(year, month, day);
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  private detectCurrency(text: string): {
    code: string;
    confidence: number;
    detectedSymbol: string;
  } {
    for (const { pattern, code, symbol } of CURRENCY_PATTERNS) {
      if (pattern.test(text)) {
        return { code, confidence: 0.9, detectedSymbol: symbol };
      }
    }
    return { code: 'USD', confidence: 0.5, detectedSymbol: '$' };
  }

  private extractAmount(
    text: string,
    patterns: RegExp[],
    type: ExtractedAmount['type']
  ): ExtractedAmount | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amountStr = match[1] || match[0];
        const amount = parseFloat(amountStr.replace(/[,$]/g, ''));
        if (!isNaN(amount) && amount > 0) {
          return {
            value: amount,
            currency: 'USD',
            confidence: 0.85,
            originalText: match[0],
            type,
          };
        }
      }
    }
    return null;
  }

  private extractLineItems(text: string): ExtractedLineItem[] {
    const items: ExtractedLineItem[] = [];
    const lines = text.split('\n');

    // Look for lines with prices
    const itemPattern = /^(.+?)\s+[$€£]?([\d,]+\.?\d*)$/;

    for (const line of lines) {
      const match = line.match(itemPattern);
      if (match && match[1].length > 2 && match[1].length < 40) {
        const price = parseFloat(match[2].replace(/,/g, ''));
        if (!isNaN(price) && price > 0 && price < 1000) {
          // Exclude totals, tax, etc.
          const lowerLine = line.toLowerCase();
          if (
            !lowerLine.includes('total') &&
            !lowerLine.includes('tax') &&
            !lowerLine.includes('tip') &&
            !lowerLine.includes('subtotal') &&
            !lowerLine.includes('change')
          ) {
            items.push({
              description: match[1].trim(),
              totalPrice: price,
              confidence: 0.7,
              originalText: line,
            });
          }
        }
      }
    }

    return items;
  }

  // eslint-disable-next-line complexity -- tracked in #1
  private detectPaymentMethod(text: string): ReceiptExtractionResult['paymentMethod'] {
    const lowerText = text.toLowerCase();

    // Check for card
    const cardPatterns = [
      /visa/i,
      /mastercard/i,
      /amex/i,
      /american express/i,
      /debit/i,
      /credit/i,
      /card\s*ending/i,
      /\*{4}\d{4}/,
    ];

    for (const pattern of cardPatterns) {
      if (pattern.test(text)) {
        // Try to extract last 4 digits
        const lastFour = text.match(/\*{4}(\d{4})|ending\s*in\s*(\d{4})|x{4}(\d{4})/i);
        return {
          type: 'card',
          lastFourDigits: lastFour?.[1] || lastFour?.[2] || lastFour?.[3],
          cardType: /visa/i.test(text)
            ? 'Visa'
            : /mastercard/i.test(text)
              ? 'Mastercard'
              : /amex/i.test(text)
                ? 'Amex'
                : undefined,
          confidence: 0.85,
        };
      }
    }

    // Check for cash
    if (/cash/i.test(text) || /change due/i.test(text) || /cash tendered/i.test(text)) {
      return { type: 'cash', confidence: 0.85 };
    }

    // Check for mobile payment
    if (/apple pay/i.test(text) || /google pay/i.test(text) || /mobile/i.test(text)) {
      return { type: 'mobile', confidence: 0.85 };
    }

    return { type: 'unknown', confidence: 0.3 };
  }

  // ============================================================================
  // CATEGORIZATION
  // ============================================================================

  private async categorizeReceipt(
    extraction: ReceiptExtractionResult
  ): Promise<ReceiptExtractionResult> {
    await this.simulateDelay(200);

    const text = extraction.rawOCR.fullText.toLowerCase();
    const merchantName = extraction.merchant?.name?.toLowerCase() || '';

    // Check merchant templates first
    for (const template of MERCHANT_TEMPLATES) {
      if (template.patterns.namePatterns.some((p) => p.test(merchantName))) {
        return {
          ...extraction,
          suggestedCategory: {
            category: template.category,
            confidence: 0.95,
            reason: `Recognized merchant: ${template.name}`,
          },
        };
      }
    }

    // Check keywords
    for (const { category, keywords } of CATEGORY_KEYWORDS) {
      const matchedKeywords = keywords.filter(
        (kw) => text.includes(kw) || merchantName.includes(kw)
      );
      if (matchedKeywords.length > 0) {
        return {
          ...extraction,
          suggestedCategory: {
            category,
            confidence: Math.min(0.5 + matchedKeywords.length * 0.15, 0.9),
            reason: `Matched keywords: ${matchedKeywords.join(', ')}`,
          },
        };
      }
    }

    // Default
    return {
      ...extraction,
      suggestedCategory: {
        category: 'other',
        confidence: 0.3,
        reason: 'No specific category detected',
      },
    };
  }

  // ============================================================================
  // MOCK RECEIPT GENERATORS
  // ============================================================================

  private generateCafeReceipt(): string {
    const cafes = ['Starbucks Coffee', 'Blue Bottle Coffee', "Peet's Coffee", 'Costa Coffee'];
    const cafe = cafes[Math.floor(Math.random() * cafes.length)];
    const date = this.randomRecentDate();
    const items = [
      { name: 'Latte', price: 4.95 },
      { name: 'Cappuccino', price: 4.75 },
      { name: 'Croissant', price: 3.5 },
      { name: 'Muffin', price: 3.25 },
    ];
    const selectedItems = items.slice(0, 1 + Math.floor(Math.random() * 2));
    const subtotal = selectedItems.reduce((sum, i) => sum + i.price, 0);
    const tax = Math.round(subtotal * 0.0825 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    return `
${cafe}
123 Main Street
San Francisco, CA 94102

${date}  10:${15 + Math.floor(Math.random() * 45)} AM

${selectedItems.map((i) => `${i.name.padEnd(20)} $${i.price.toFixed(2)}`).join('\n')}

Subtotal              $${subtotal.toFixed(2)}
Tax                   $${tax.toFixed(2)}
Total                 $${total.toFixed(2)}

VISA ****1234
Thank you!
    `.trim();
  }

  private generateRestaurantReceipt(): string {
    const restaurants = ['The Italian Kitchen', 'Golden Dragon', 'Le Petit Bistro', 'Sushi House'];
    const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
    const date = this.randomRecentDate();
    const items = [
      { name: 'Pasta Carbonara', price: 18.95 },
      { name: 'Caesar Salad', price: 12.5 },
      { name: 'Glass of Wine', price: 9.0 },
      { name: 'Tiramisu', price: 8.5 },
    ];
    const selectedItems = items.slice(0, 2 + Math.floor(Math.random() * 2));
    const subtotal = selectedItems.reduce((sum, i) => sum + i.price, 0);
    const tax = Math.round(subtotal * 0.0875 * 100) / 100;
    const tip = Math.round(subtotal * 0.18 * 100) / 100;
    const total = Math.round((subtotal + tax + tip) * 100) / 100;

    return `
${restaurant}
456 Oak Avenue
New York, NY 10001
(212) 555-1234

Date: ${date}
Table: 12
Server: Mike

${selectedItems.map((i) => `${i.name.padEnd(20)} $${i.price.toFixed(2)}`).join('\n')}

Subtotal              $${subtotal.toFixed(2)}
Tax                   $${tax.toFixed(2)}
Tip                   $${tip.toFixed(2)}
------------------------
TOTAL                 $${total.toFixed(2)}

Mastercard ending 5678
Thank you for dining with us!
    `.trim();
  }

  private generateRetailReceipt(): string {
    const stores = ['Target', 'Walmart', 'CVS Pharmacy', 'Walgreens'];
    const store = stores[Math.floor(Math.random() * stores.length)];
    const date = this.randomRecentDate();
    const items = [
      { name: 'Toothpaste', price: 4.99 },
      { name: 'Shampoo', price: 7.49 },
      { name: 'Batteries', price: 12.99 },
      { name: 'Snacks', price: 5.49 },
      { name: 'Water Bottle', price: 1.99 },
    ];
    const selectedItems = items.slice(0, 2 + Math.floor(Math.random() * 3));
    const subtotal = selectedItems.reduce((sum, i) => sum + i.price, 0);
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    return `
${store}
789 Shopping Center Dr
Chicago, IL 60601

${date}

${selectedItems.map((i) => `${i.name.padEnd(20)} $${i.price.toFixed(2)}`).join('\n')}

SUBTOTAL              $${subtotal.toFixed(2)}
TAX                   $${tax.toFixed(2)}
TOTAL                 $${total.toFixed(2)}

CASH TENDERED         $${(Math.ceil(total / 5) * 5).toFixed(2)}
CHANGE                $${(Math.ceil(total / 5) * 5 - total).toFixed(2)}

Thank you for shopping!
    `.trim();
  }

  private randomRecentDate(): string {
    const daysAgo = Math.floor(Math.random() * 14);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private createError(
    code: ProcessingError['code'],
    message: string,
    details?: any
  ): ProcessingError {
    return {
      code,
      message,
      details: details?.message || String(details),
      retryable: code !== 'INVALID_IMAGE',
    };
  }
}

export const ocrService = new OCRService();
