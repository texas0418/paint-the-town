// Paint the Town Multi-Currency - Type Definitions

// ============================================================================
// CURRENCY CORE TYPES
// ============================================================================

export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CNY'
  | 'AUD'
  | 'CAD'
  | 'CHF'
  | 'HKD'
  | 'SGD'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'NZD'
  | 'MXN'
  | 'BRL'
  | 'INR'
  | 'KRW'
  | 'THB'
  | 'MYR'
  | 'IDR'
  | 'PHP'
  | 'VND'
  | 'TWD'
  | 'ZAR'
  | 'TRY'
  | 'PLN'
  | 'CZK'
  | 'HUF'
  | 'ILS'
  | 'AED'
  | 'SAR'
  | 'RUB'
  | 'CLP'
  | 'COP'
  | 'PEN'
  | 'ARS'
  | 'EGP'
  | 'MAD'
  | 'NGN';

export interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
  decimalSeparator: '.' | ',';
  thousandsSeparator: ',' | '.' | ' ' | '';
  flag: string; // Emoji flag
  country: string;
}

export interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  inverseRate: number;
  timestamp: string;
  source: 'api' | 'manual' | 'cached';
}

export interface ExchangeRateHistory {
  from: CurrencyCode;
  to: CurrencyCode;
  rates: Array<{
    date: string;
    rate: number;
  }>;
}

// ============================================================================
// MONEY & AMOUNTS
// ============================================================================

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface ConvertedMoney extends Money {
  originalAmount: number;
  originalCurrency: CurrencyCode;
  exchangeRate: number;
  convertedAt: string;
}

export interface MoneyRange {
  min: Money;
  max: Money;
}

// ============================================================================
// USER SETTINGS
// ============================================================================

export interface CurrencyPreferences {
  homeCurrency: CurrencyCode;
  displayCurrency: CurrencyCode;
  showOriginalAmount: boolean;
  showConvertedAmount: boolean;
  autoConvert: boolean;
  roundingMode: 'none' | 'nearest' | 'up' | 'down';
  roundingPrecision: number;
  recentCurrencies: CurrencyCode[];
  favoriteCurrencies: CurrencyCode[];
}

export interface TripCurrencySettings {
  tripId: string;
  primaryCurrency: CurrencyCode;
  localCurrencies: CurrencyCode[];
  budgetCurrency: CurrencyCode;
  lockedRates: ExchangeRate[]; // User-set rates for trip
}

// ============================================================================
// EXPENSES & TRANSACTIONS
// ============================================================================

export type ExpenseCategory =
  | 'accommodation'
  | 'transportation'
  | 'food_drink'
  | 'activities'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'communication'
  | 'fees'
  | 'tips'
  | 'other';

export interface Expense {
  id: string;
  tripId?: string;

  // Amount
  amount: number;
  currency: CurrencyCode;
  convertedAmount?: number;
  convertedCurrency?: CurrencyCode;
  exchangeRateUsed?: number;

  // Details
  description: string;
  category: ExpenseCategory;
  subcategory?: string;
  vendor?: string;
  location?: string;

  // Metadata
  date: string;
  time?: string;
  paymentMethod?: 'cash' | 'card' | 'mobile' | 'other';
  receiptImageUri?: string;
  notes?: string;
  tags?: string[];

  // Splitting
  isSplit?: boolean;
  splitWith?: string[];
  myShare?: number;

  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummary {
  totalInHomeCurrency: number;
  homeCurrency: CurrencyCode;
  byCategory: Record<ExpenseCategory, number>;
  byCurrency: Record<CurrencyCode, number>;
  byDate: Record<string, number>;
  count: number;
  averagePerDay: number;
}

// ============================================================================
// BUDGET
// ============================================================================

export interface Budget {
  id: string;
  tripId?: string;
  name: string;

  totalAmount: number;
  currency: CurrencyCode;

  // Allocation
  categoryBudgets?: Partial<Record<ExpenseCategory, number>>;
  dailyBudget?: number;

  // Tracking
  spent: number;
  remaining: number;
  percentUsed: number;

  startDate: string;
  endDate: string;

  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  id: string;
  type: 'threshold' | 'overspent' | 'daily_exceeded' | 'category_exceeded';
  threshold?: number; // Percentage
  category?: ExpenseCategory;
  message: string;
  triggered: boolean;
  triggeredAt?: string;
}

// ============================================================================
// CONVERSION & CALCULATOR
// ============================================================================

export interface ConversionRequest {
  amount: number;
  from: CurrencyCode;
  to: CurrencyCode;
  date?: string; // For historical rate
}

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: CurrencyCode;
  convertedAmount: number;
  convertedCurrency: CurrencyCode;
  rate: number;
  rateDate: string;
  rateSource: 'api' | 'manual' | 'cached';
}

export interface QuickConversion {
  id: string;
  from: CurrencyCode;
  to: CurrencyCode;
  commonAmounts: number[];
  lastUsed: string;
}

// ============================================================================
// CASH TRACKING
// ============================================================================

export interface CashBalance {
  currency: CurrencyCode;
  amount: number;
  lastUpdated: string;
}

export interface CashTransaction {
  id: string;
  type: 'withdraw' | 'exchange' | 'spend' | 'receive' | 'adjustment';

  // For exchange
  fromCurrency?: CurrencyCode;
  fromAmount?: number;
  toCurrency?: CurrencyCode;
  toAmount?: number;
  exchangeRate?: number;

  // For spend/receive/withdraw
  currency: CurrencyCode;
  amount: number;

  description: string;
  location?: string;
  fees?: number;
  feesCurrency?: CurrencyCode;

  date: string;
  createdAt: string;
}

export interface CashWallet {
  balances: CashBalance[];
  transactions: CashTransaction[];
  totalInHomeCurrency: number;
  homeCurrency: CurrencyCode;
}

// ============================================================================
// FORMATTING
// ============================================================================

export interface FormatOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  showSign?: boolean;
  compact?: boolean; // 1.2K instead of 1,200
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}

export type FormatStyle =
  | 'standard' // $1,234.56
  | 'compact' // $1.2K
  | 'accounting' // ($1,234.56) for negative
  | 'code' // 1,234.56 USD
  | 'symbol_after'; // 1,234.56 $

// ============================================================================
// UI STATE
// ============================================================================

export interface MultiCurrencyState {
  // Settings
  preferences: CurrencyPreferences;
  tripSettings: TripCurrencySettings | null;

  // Rates
  rates: Record<string, ExchangeRate>; // Key: "USD_EUR"
  ratesLastUpdated: string | null;
  isLoadingRates: boolean;
  ratesError: string | null;

  // Expenses
  expenses: Expense[];
  expenseSummary: ExpenseSummary | null;

  // Budget
  budget: Budget | null;

  // Cash
  cashWallet: CashWallet | null;

  // Quick conversions
  quickConversions: QuickConversion[];

  // UI
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ExchangeRateAPIResponse {
  success: boolean;
  base: CurrencyCode;
  date: string;
  rates: Record<CurrencyCode, number>;
  timestamp?: number;
}
