// Paint the Town Multi-Currency - Mock Data

import {
  Currency,
  CurrencyCode,
  ExchangeRate,
  Expense,
  ExpenseCategory,
  Budget,
  CashWallet,
  QuickConversion,
} from '../types/currency';

// ============================================================================
// CURRENCIES
// ============================================================================

export const CURRENCIES: Currency[] = [
  // Major currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇺🇸', country: 'United States' },
  { code: 'EUR', name: 'Euro', symbol: '€', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: '.', flag: '🇪🇺', country: 'European Union' },
  { code: 'GBP', name: 'British Pound', symbol: '£', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇬🇧', country: 'United Kingdom' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', symbolPosition: 'before', decimalPlaces: 0, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇯🇵', country: 'Japan' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇨🇳', country: 'China' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇦🇺', country: 'Australia' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇨🇦', country: 'Canada' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: "'", flag: '🇨🇭', country: 'Switzerland' },
  
  // Asian currencies
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇭🇰', country: 'Hong Kong' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇸🇬', country: 'Singapore' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', symbolPosition: 'before', decimalPlaces: 0, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇰🇷', country: 'South Korea' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇹🇭', country: 'Thailand' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇲🇾', country: 'Malaysia' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', symbolPosition: 'before', decimalPlaces: 0, decimalSeparator: ',', thousandsSeparator: '.', flag: '🇮🇩', country: 'Indonesia' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇵🇭', country: 'Philippines' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', symbolPosition: 'after', decimalPlaces: 0, decimalSeparator: ',', thousandsSeparator: '.', flag: '🇻🇳', country: 'Vietnam' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇹🇼', country: 'Taiwan' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇮🇳', country: 'India' },
  
  // European currencies
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: ' ', flag: '🇸🇪', country: 'Sweden' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: ' ', flag: '🇳🇴', country: 'Norway' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: '.', flag: '🇩🇰', country: 'Denmark' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: ' ', flag: '🇵🇱', country: 'Poland' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: ' ', flag: '🇨🇿', country: 'Czech Republic' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', symbolPosition: 'after', decimalPlaces: 0, decimalSeparator: ',', thousandsSeparator: ' ', flag: '🇭🇺', country: 'Hungary' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: '.', flag: '🇹🇷', country: 'Turkey' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: ' ', flag: '🇷🇺', country: 'Russia' },
  
  // Americas
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇲🇽', country: 'Mexico' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: '.', flag: '🇧🇷', country: 'Brazil' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: ',', thousandsSeparator: '.', flag: '🇦🇷', country: 'Argentina' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', symbolPosition: 'before', decimalPlaces: 0, decimalSeparator: ',', thousandsSeparator: '.', flag: '🇨🇱', country: 'Chile' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', symbolPosition: 'before', decimalPlaces: 0, decimalSeparator: ',', thousandsSeparator: '.', flag: '🇨🇴', country: 'Colombia' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇵🇪', country: 'Peru' },
  
  // Oceania
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇳🇿', country: 'New Zealand' },
  
  // Middle East & Africa
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇿🇦', country: 'South Africa' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇮🇱', country: 'Israel' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇦🇪', country: 'United Arab Emirates' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇸🇦', country: 'Saudi Arabia' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇪🇬', country: 'Egypt' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', symbolPosition: 'after', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇲🇦', country: 'Morocco' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', symbolPosition: 'before', decimalPlaces: 2, decimalSeparator: '.', thousandsSeparator: ',', flag: '🇳🇬', country: 'Nigeria' },
];

// ============================================================================
// EXCHANGE RATES (Base: USD)
// ============================================================================

const timestamp = new Date().toISOString();

export const MOCK_EXCHANGE_RATES: ExchangeRate[] = [
  // Major pairs
  { from: 'USD', to: 'EUR', rate: 0.92, inverseRate: 1.087, timestamp, source: 'api' },
  { from: 'USD', to: 'GBP', rate: 0.79, inverseRate: 1.266, timestamp, source: 'api' },
  { from: 'USD', to: 'JPY', rate: 149.50, inverseRate: 0.00669, timestamp, source: 'api' },
  { from: 'USD', to: 'CNY', rate: 7.24, inverseRate: 0.138, timestamp, source: 'api' },
  { from: 'USD', to: 'AUD', rate: 1.53, inverseRate: 0.654, timestamp, source: 'api' },
  { from: 'USD', to: 'CAD', rate: 1.36, inverseRate: 0.735, timestamp, source: 'api' },
  { from: 'USD', to: 'CHF', rate: 0.88, inverseRate: 1.136, timestamp, source: 'api' },
  
  // Asian currencies
  { from: 'USD', to: 'HKD', rate: 7.82, inverseRate: 0.128, timestamp, source: 'api' },
  { from: 'USD', to: 'SGD', rate: 1.34, inverseRate: 0.746, timestamp, source: 'api' },
  { from: 'USD', to: 'KRW', rate: 1320, inverseRate: 0.000758, timestamp, source: 'api' },
  { from: 'USD', to: 'THB', rate: 35.50, inverseRate: 0.0282, timestamp, source: 'api' },
  { from: 'USD', to: 'MYR', rate: 4.72, inverseRate: 0.212, timestamp, source: 'api' },
  { from: 'USD', to: 'IDR', rate: 15750, inverseRate: 0.0000635, timestamp, source: 'api' },
  { from: 'USD', to: 'PHP', rate: 55.80, inverseRate: 0.0179, timestamp, source: 'api' },
  { from: 'USD', to: 'VND', rate: 24500, inverseRate: 0.0000408, timestamp, source: 'api' },
  { from: 'USD', to: 'TWD', rate: 31.50, inverseRate: 0.0317, timestamp, source: 'api' },
  { from: 'USD', to: 'INR', rate: 83.20, inverseRate: 0.0120, timestamp, source: 'api' },
  
  // European currencies
  { from: 'USD', to: 'SEK', rate: 10.45, inverseRate: 0.0957, timestamp, source: 'api' },
  { from: 'USD', to: 'NOK', rate: 10.65, inverseRate: 0.0939, timestamp, source: 'api' },
  { from: 'USD', to: 'DKK', rate: 6.88, inverseRate: 0.145, timestamp, source: 'api' },
  { from: 'USD', to: 'PLN', rate: 4.02, inverseRate: 0.249, timestamp, source: 'api' },
  { from: 'USD', to: 'CZK', rate: 23.20, inverseRate: 0.0431, timestamp, source: 'api' },
  { from: 'USD', to: 'HUF', rate: 358, inverseRate: 0.00279, timestamp, source: 'api' },
  { from: 'USD', to: 'TRY', rate: 32.50, inverseRate: 0.0308, timestamp, source: 'api' },
  { from: 'USD', to: 'RUB', rate: 92.50, inverseRate: 0.0108, timestamp, source: 'api' },
  
  // Americas
  { from: 'USD', to: 'MXN', rate: 17.15, inverseRate: 0.0583, timestamp, source: 'api' },
  { from: 'USD', to: 'BRL', rate: 4.97, inverseRate: 0.201, timestamp, source: 'api' },
  { from: 'USD', to: 'ARS', rate: 875, inverseRate: 0.00114, timestamp, source: 'api' },
  { from: 'USD', to: 'CLP', rate: 925, inverseRate: 0.00108, timestamp, source: 'api' },
  { from: 'USD', to: 'COP', rate: 3950, inverseRate: 0.000253, timestamp, source: 'api' },
  { from: 'USD', to: 'PEN', rate: 3.72, inverseRate: 0.269, timestamp, source: 'api' },
  
  // Oceania
  { from: 'USD', to: 'NZD', rate: 1.64, inverseRate: 0.610, timestamp, source: 'api' },
  
  // Middle East & Africa
  { from: 'USD', to: 'ZAR', rate: 18.75, inverseRate: 0.0533, timestamp, source: 'api' },
  { from: 'USD', to: 'ILS', rate: 3.67, inverseRate: 0.272, timestamp, source: 'api' },
  { from: 'USD', to: 'AED', rate: 3.67, inverseRate: 0.272, timestamp, source: 'api' },
  { from: 'USD', to: 'SAR', rate: 3.75, inverseRate: 0.267, timestamp, source: 'api' },
  { from: 'USD', to: 'EGP', rate: 30.90, inverseRate: 0.0324, timestamp, source: 'api' },
  { from: 'USD', to: 'MAD', rate: 10.05, inverseRate: 0.0995, timestamp, source: 'api' },
  { from: 'USD', to: 'NGN', rate: 1550, inverseRate: 0.000645, timestamp, source: 'api' },
];

// ============================================================================
// SAMPLE EXPENSES
// ============================================================================

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp_001',
    tripId: 'trip_paris',
    amount: 45.50,
    currency: 'EUR',
    convertedAmount: 49.46,
    convertedCurrency: 'USD',
    exchangeRateUsed: 1.087,
    description: 'Lunch at Le Petit Cler',
    category: 'food_drink',
    vendor: 'Le Petit Cler',
    location: 'Paris, France',
    date: '2024-03-15',
    time: '13:30',
    paymentMethod: 'card',
    createdAt: '2024-03-15T13:30:00Z',
    updatedAt: '2024-03-15T13:30:00Z',
  },
  {
    id: 'exp_002',
    tripId: 'trip_paris',
    amount: 17.00,
    currency: 'EUR',
    convertedAmount: 18.48,
    convertedCurrency: 'USD',
    exchangeRateUsed: 1.087,
    description: 'Louvre Museum Entry',
    category: 'activities',
    vendor: 'Louvre Museum',
    location: 'Paris, France',
    date: '2024-03-15',
    time: '10:00',
    paymentMethod: 'card',
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
  },
  {
    id: 'exp_003',
    tripId: 'trip_tokyo',
    amount: 8500,
    currency: 'JPY',
    convertedAmount: 56.86,
    convertedCurrency: 'USD',
    exchangeRateUsed: 0.00669,
    description: 'Sushi Dinner at Tsukiji',
    category: 'food_drink',
    vendor: 'Sushi Dai',
    location: 'Tokyo, Japan',
    date: '2024-04-10',
    time: '19:00',
    paymentMethod: 'cash',
    createdAt: '2024-04-10T19:00:00Z',
    updatedAt: '2024-04-10T19:00:00Z',
  },
  {
    id: 'exp_004',
    tripId: 'trip_tokyo',
    amount: 2500,
    currency: 'JPY',
    convertedAmount: 16.73,
    convertedCurrency: 'USD',
    exchangeRateUsed: 0.00669,
    description: 'Metro Day Pass',
    category: 'transportation',
    vendor: 'Tokyo Metro',
    location: 'Tokyo, Japan',
    date: '2024-04-10',
    time: '08:00',
    paymentMethod: 'cash',
    createdAt: '2024-04-10T08:00:00Z',
    updatedAt: '2024-04-10T08:00:00Z',
  },
  {
    id: 'exp_005',
    tripId: 'trip_tokyo',
    amount: 15000,
    currency: 'JPY',
    convertedAmount: 100.35,
    convertedCurrency: 'USD',
    exchangeRateUsed: 0.00669,
    description: 'TeamLab Borderless Tickets',
    category: 'activities',
    vendor: 'TeamLab',
    location: 'Tokyo, Japan',
    date: '2024-04-11',
    time: '14:00',
    paymentMethod: 'card',
    createdAt: '2024-04-11T14:00:00Z',
    updatedAt: '2024-04-11T14:00:00Z',
  },
];

// ============================================================================
// SAMPLE BUDGET
// ============================================================================

export const MOCK_BUDGET: Budget = {
  id: 'budget_001',
  tripId: 'trip_tokyo',
  name: 'Tokyo Trip Budget',
  totalAmount: 2000,
  currency: 'USD',
  categoryBudgets: {
    accommodation: 800,
    food_drink: 500,
    activities: 300,
    transportation: 200,
    shopping: 200,
  },
  dailyBudget: 200,
  spent: 173.94,
  remaining: 1826.06,
  percentUsed: 8.7,
  startDate: '2024-04-10',
  endDate: '2024-04-20',
  alerts: [
    { id: 'alert_1', type: 'threshold', threshold: 50, message: '50% of budget used', triggered: false },
    { id: 'alert_2', type: 'threshold', threshold: 80, message: '80% of budget used', triggered: false },
    { id: 'alert_3', type: 'overspent', message: 'Budget exceeded', triggered: false },
  ],
};

// ============================================================================
// SAMPLE CASH WALLET
// ============================================================================

export const MOCK_CASH_WALLET: CashWallet = {
  balances: [
    { currency: 'JPY', amount: 50000, lastUpdated: '2024-04-10T09:00:00Z' },
    { currency: 'USD', amount: 200, lastUpdated: '2024-04-09T12:00:00Z' },
    { currency: 'EUR', amount: 150, lastUpdated: '2024-04-01T10:00:00Z' },
  ],
  transactions: [
    {
      id: 'cash_001',
      type: 'withdraw',
      currency: 'JPY',
      amount: 50000,
      description: 'ATM withdrawal at Narita Airport',
      location: 'Tokyo, Japan',
      fees: 220,
      feesCurrency: 'JPY',
      date: '2024-04-10',
      createdAt: '2024-04-10T09:00:00Z',
    },
    {
      id: 'cash_002',
      type: 'spend',
      currency: 'JPY',
      amount: 8500,
      description: 'Sushi dinner',
      location: 'Tokyo, Japan',
      date: '2024-04-10',
      createdAt: '2024-04-10T19:30:00Z',
    },
    {
      id: 'cash_003',
      type: 'exchange',
      fromCurrency: 'USD',
      fromAmount: 100,
      toCurrency: 'EUR',
      toAmount: 92,
      exchangeRate: 0.92,
      currency: 'USD',
      amount: 100,
      description: 'Currency exchange at airport',
      location: 'JFK Airport',
      fees: 5,
      feesCurrency: 'USD',
      date: '2024-03-14',
      createdAt: '2024-03-14T08:00:00Z',
    },
  ],
  totalInHomeCurrency: 698.50,
  homeCurrency: 'USD',
};

// ============================================================================
// QUICK CONVERSIONS
// ============================================================================

export const MOCK_QUICK_CONVERSIONS: QuickConversion[] = [
  { id: 'qc_1', from: 'USD', to: 'EUR', commonAmounts: [10, 20, 50, 100, 200], lastUsed: '2024-03-15T10:00:00Z' },
  { id: 'qc_2', from: 'USD', to: 'JPY', commonAmounts: [10, 20, 50, 100, 200], lastUsed: '2024-04-10T09:00:00Z' },
  { id: 'qc_3', from: 'JPY', to: 'USD', commonAmounts: [1000, 5000, 10000, 20000, 50000], lastUsed: '2024-04-10T19:00:00Z' },
  { id: 'qc_4', from: 'EUR', to: 'USD', commonAmounts: [10, 20, 50, 100, 200], lastUsed: '2024-03-16T12:00:00Z' },
];

// ============================================================================
// CATEGORY METADATA
// ============================================================================

export const EXPENSE_CATEGORIES: Array<{
  id: ExpenseCategory;
  name: string;
  icon: string;
  color: string;
}> = [
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
