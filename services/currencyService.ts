// Paint the Town Multi-Currency - Currency Service

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Currency,
  CurrencyCode,
  ExchangeRate,
  Money,
  ConvertedMoney,
  ConversionRequest,
  ConversionResult,
  CurrencyPreferences,
  FormatOptions,
  FormatStyle,
  Expense,
  ExpenseSummary,
  ExpenseCategory,
  Budget,
  CashWallet,
  CashBalance,
  CashTransaction,
  TripCurrencySettings,
} from '../types/currency';
import { CURRENCIES, MOCK_EXCHANGE_RATES } from '../mocks/mockCurrencyData';

const STORAGE_KEYS = {
  PREFERENCES: '@w4nder/currency_preferences',
  RATES: '@w4nder/exchange_rates',
  RATES_TIMESTAMP: '@w4nder/rates_timestamp',
  EXPENSES: '@w4nder/expenses',
  BUDGET: '@w4nder/budget',
  CASH_WALLET: '@w4nder/cash_wallet',
  TRIP_SETTINGS: '@w4nder/trip_currency_settings',
  QUICK_CONVERSIONS: '@w4nder/quick_conversions',
};

const DEFAULT_PREFERENCES: CurrencyPreferences = {
  homeCurrency: 'USD',
  displayCurrency: 'USD',
  showOriginalAmount: true,
  showConvertedAmount: true,
  autoConvert: true,
  roundingMode: 'nearest',
  roundingPrecision: 2,
  recentCurrencies: [],
  favoriteCurrencies: ['USD', 'EUR', 'GBP', 'JPY'],
};

class CurrencyService {
  private rates: Map<string, ExchangeRate> = new Map();
  private ratesTimestamp: string | null = null;
  private preferences: CurrencyPreferences = DEFAULT_PREFERENCES;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(): Promise<void> {
    await this.loadPreferences();
    await this.loadRates();
  }

  // ============================================================================
  // CURRENCY DATA
  // ============================================================================

  getCurrency(code: CurrencyCode): Currency | undefined {
    return CURRENCIES.find((c) => c.code === code);
  }

  getAllCurrencies(): Currency[] {
    return CURRENCIES;
  }

  searchCurrencies(query: string): Currency[] {
    const lowerQuery = query.toLowerCase();
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(lowerQuery) ||
        c.name.toLowerCase().includes(lowerQuery) ||
        c.country.toLowerCase().includes(lowerQuery)
    );
  }

  getPopularCurrencies(): Currency[] {
    const popularCodes: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF'];
    return popularCodes.map((code) => this.getCurrency(code)!).filter(Boolean);
  }

  // ============================================================================
  // PREFERENCES
  // ============================================================================

  async loadPreferences(): Promise<CurrencyPreferences> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (stored) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load currency preferences:', error);
    }
    return this.preferences;
  }

  async savePreferences(prefs: Partial<CurrencyPreferences>): Promise<CurrencyPreferences> {
    this.preferences = { ...this.preferences, ...prefs };
    await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(this.preferences));
    return this.preferences;
  }

  getPreferences(): CurrencyPreferences {
    return this.preferences;
  }

  async setHomeCurrency(code: CurrencyCode): Promise<void> {
    await this.savePreferences({ homeCurrency: code });
  }

  async addRecentCurrency(code: CurrencyCode): Promise<void> {
    const recent = [code, ...this.preferences.recentCurrencies.filter((c) => c !== code)].slice(
      0,
      10
    );
    await this.savePreferences({ recentCurrencies: recent });
  }

  async toggleFavoriteCurrency(code: CurrencyCode): Promise<void> {
    const favorites = this.preferences.favoriteCurrencies.includes(code)
      ? this.preferences.favoriteCurrencies.filter((c) => c !== code)
      : [...this.preferences.favoriteCurrencies, code];
    await this.savePreferences({ favoriteCurrencies: favorites });
  }

  // ============================================================================
  // EXCHANGE RATES
  // ============================================================================

  async loadRates(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.RATES);
      const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.RATES_TIMESTAMP);

      if (stored) {
        const ratesArray: ExchangeRate[] = JSON.parse(stored);
        ratesArray.forEach((rate) => {
          this.rates.set(`${rate.from}_${rate.to}`, rate);
        });
        this.ratesTimestamp = timestamp;
      } else {
        // Load mock rates
        this.loadMockRates();
      }
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
      this.loadMockRates();
    }
  }

  private loadMockRates(): void {
    MOCK_EXCHANGE_RATES.forEach((rate) => {
      this.rates.set(`${rate.from}_${rate.to}`, rate);
    });
    this.ratesTimestamp = new Date().toISOString();
  }

  async fetchLatestRates(baseCurrency: CurrencyCode = 'USD'): Promise<boolean> {
    try {
      // In production, this would call a real API
      // For now, we use mock rates with slight variations
      const timestamp = new Date().toISOString();

      MOCK_EXCHANGE_RATES.forEach((rate) => {
        // Add small random variation to simulate live rates
        const variation = 1 + (Math.random() - 0.5) * 0.02;
        const updatedRate: ExchangeRate = {
          ...rate,
          rate: rate.rate * variation,
          inverseRate: 1 / (rate.rate * variation),
          timestamp,
          source: 'api',
        };
        this.rates.set(`${rate.from}_${rate.to}`, updatedRate);
      });

      this.ratesTimestamp = timestamp;

      // Persist rates
      const ratesArray = Array.from(this.rates.values());
      await AsyncStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(ratesArray));
      await AsyncStorage.setItem(STORAGE_KEYS.RATES_TIMESTAMP, timestamp);

      return true;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      return false;
    }
  }

  getRate(from: CurrencyCode, to: CurrencyCode): ExchangeRate | null {
    if (from === to) {
      return {
        from,
        to,
        rate: 1,
        inverseRate: 1,
        timestamp: new Date().toISOString(),
        source: 'cached',
      };
    }

    // Try direct rate
    const directKey = `${from}_${to}`;
    if (this.rates.has(directKey)) {
      return this.rates.get(directKey)!;
    }

    // Try inverse rate
    const inverseKey = `${to}_${from}`;
    if (this.rates.has(inverseKey)) {
      const inverse = this.rates.get(inverseKey)!;
      return {
        from,
        to,
        rate: inverse.inverseRate,
        inverseRate: inverse.rate,
        timestamp: inverse.timestamp,
        source: inverse.source,
      };
    }

    // Try cross rate via USD
    if (from !== 'USD' && to !== 'USD') {
      const fromUSD = this.getRate(from, 'USD');
      const USDTo = this.getRate('USD', to);
      if (fromUSD && USDTo) {
        return {
          from,
          to,
          rate: fromUSD.rate * USDTo.rate,
          inverseRate: 1 / (fromUSD.rate * USDTo.rate),
          timestamp: new Date().toISOString(),
          source: 'cached',
        };
      }
    }

    return null;
  }

  getRatesLastUpdated(): string | null {
    return this.ratesTimestamp;
  }

  // ============================================================================
  // CONVERSION
  // ============================================================================

  convert(request: ConversionRequest): ConversionResult | null {
    const { amount, from, to } = request;

    if (from === to) {
      return {
        originalAmount: amount,
        originalCurrency: from,
        convertedAmount: amount,
        convertedCurrency: to,
        rate: 1,
        rateDate: new Date().toISOString(),
        rateSource: 'cached',
      };
    }

    const rate = this.getRate(from, to);
    if (!rate) return null;

    let convertedAmount = amount * rate.rate;

    // Apply rounding
    if (this.preferences.roundingMode !== 'none') {
      const precision = Math.pow(10, this.preferences.roundingPrecision);
      switch (this.preferences.roundingMode) {
        case 'nearest':
          convertedAmount = Math.round(convertedAmount * precision) / precision;
          break;
        case 'up':
          convertedAmount = Math.ceil(convertedAmount * precision) / precision;
          break;
        case 'down':
          convertedAmount = Math.floor(convertedAmount * precision) / precision;
          break;
      }
    }

    return {
      originalAmount: amount,
      originalCurrency: from,
      convertedAmount,
      convertedCurrency: to,
      rate: rate.rate,
      rateDate: rate.timestamp,
      rateSource: rate.source,
    };
  }

  convertToHome(money: Money): ConvertedMoney | null {
    const result = this.convert({
      amount: money.amount,
      from: money.currency,
      to: this.preferences.homeCurrency,
    });

    if (!result) return null;

    return {
      amount: result.convertedAmount,
      currency: result.convertedCurrency,
      originalAmount: result.originalAmount,
      originalCurrency: result.originalCurrency,
      exchangeRate: result.rate,
      convertedAt: result.rateDate,
    };
  }

  // ============================================================================
  // FORMATTING
  // ============================================================================

  format(amount: number, currencyCode: CurrencyCode, options: FormatOptions = {}): string {
    const currency = this.getCurrency(currencyCode);
    if (!currency) return `${amount} ${currencyCode}`;

    const {
      showSymbol = true,
      showCode = false,
      showSign = false,
      compact = false,
      maximumFractionDigits = currency.decimalPlaces,
      minimumFractionDigits = currency.decimalPlaces,
    } = options;

    let formattedAmount: string;
    const absAmount = Math.abs(amount);

    if (compact && absAmount >= 1000) {
      if (absAmount >= 1000000000) {
        formattedAmount = (absAmount / 1000000000).toFixed(1) + 'B';
      } else if (absAmount >= 1000000) {
        formattedAmount = (absAmount / 1000000).toFixed(1) + 'M';
      } else {
        formattedAmount = (absAmount / 1000).toFixed(1) + 'K';
      }
    } else {
      formattedAmount = absAmount.toLocaleString('en-US', {
        minimumFractionDigits,
        maximumFractionDigits,
      });

      // Replace separators based on currency
      if (currency.decimalSeparator === ',') {
        formattedAmount = formattedAmount
          .replace(/,/g, 'TEMP')
          .replace(/\./g, ',')
          .replace(/TEMP/g, '.');
      }
    }

    // Build final string
    let result = '';

    if (showSign && amount > 0) result += '+';
    if (amount < 0) result += '-';

    if (showSymbol) {
      if (currency.symbolPosition === 'before') {
        result += currency.symbol + formattedAmount;
      } else {
        result += formattedAmount + ' ' + currency.symbol;
      }
    } else {
      result += formattedAmount;
    }

    if (showCode) {
      result += ' ' + currencyCode;
    }

    return result;
  }

  formatMoney(money: Money, options?: FormatOptions): string {
    return this.format(money.amount, money.currency, options);
  }

  formatWithConversion(money: Money, targetCurrency?: CurrencyCode): string {
    const target = targetCurrency || this.preferences.homeCurrency;
    const original = this.format(money.amount, money.currency);

    if (money.currency === target) return original;

    const converted = this.convert({
      amount: money.amount,
      from: money.currency,
      to: target,
    });

    if (!converted) return original;

    return `${original} (${this.format(converted.convertedAmount, target)})`;
  }

  // ============================================================================
  // EXPENSES
  // ============================================================================

  async getExpenses(tripId?: string): Promise<Expense[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (!stored) return [];

      const expenses: Expense[] = JSON.parse(stored);
      return tripId ? expenses.filter((e) => e.tripId === tripId) : expenses;
    } catch (error) {
      console.error('Failed to load expenses:', error);
      return [];
    }
  }

  async addExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    const newExpense: Expense = {
      ...expense,
      id: `exp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto-convert if enabled
    if (this.preferences.autoConvert && expense.currency !== this.preferences.homeCurrency) {
      const converted = this.convert({
        amount: expense.amount,
        from: expense.currency,
        to: this.preferences.homeCurrency,
      });
      if (converted) {
        newExpense.convertedAmount = converted.convertedAmount;
        newExpense.convertedCurrency = converted.convertedCurrency;
        newExpense.exchangeRateUsed = converted.rate;
      }
    }

    const expenses = await this.getExpenses();
    expenses.push(newExpense);
    await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

    // Track recent currency
    await this.addRecentCurrency(expense.currency);

    return newExpense;
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    const expenses = await this.getExpenses();
    const index = expenses.findIndex((e) => e.id === id);
    if (index === -1) return null;

    expenses[index] = {
      ...expenses[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    return expenses[index];
  }

  async deleteExpense(id: string): Promise<boolean> {
    const expenses = await this.getExpenses();
    const filtered = expenses.filter((e) => e.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
    return filtered.length !== expenses.length;
  }

  async getExpenseSummary(tripId?: string): Promise<ExpenseSummary> {
    const expenses = await this.getExpenses(tripId);
    const homeCurrency = this.preferences.homeCurrency;

    const summary: ExpenseSummary = {
      totalInHomeCurrency: 0,
      homeCurrency,
      byCategory: {} as Record<ExpenseCategory, number>,
      byCurrency: {} as Record<CurrencyCode, number>,
      byDate: {},
      count: expenses.length,
      averagePerDay: 0,
    };

    const dates = new Set<string>();

    for (const expense of expenses) {
      // Total in home currency
      if (expense.currency === homeCurrency) {
        summary.totalInHomeCurrency += expense.amount;
      } else if (expense.convertedAmount && expense.convertedCurrency === homeCurrency) {
        summary.totalInHomeCurrency += expense.convertedAmount;
      } else {
        const converted = this.convert({
          amount: expense.amount,
          from: expense.currency,
          to: homeCurrency,
        });
        if (converted) {
          summary.totalInHomeCurrency += converted.convertedAmount;
        }
      }

      // By category
      summary.byCategory[expense.category] =
        (summary.byCategory[expense.category] || 0) + expense.amount;

      // By currency
      summary.byCurrency[expense.currency] =
        (summary.byCurrency[expense.currency] || 0) + expense.amount;

      // By date
      const date = expense.date.split('T')[0];
      dates.add(date);
      summary.byDate[date] = (summary.byDate[date] || 0) + expense.amount;
    }

    summary.averagePerDay = dates.size > 0 ? summary.totalInHomeCurrency / dates.size : 0;

    return summary;
  }

  // ============================================================================
  // BUDGET
  // ============================================================================

  async getBudget(tripId?: string): Promise<Budget | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.BUDGET);
      if (!stored) return null;

      const budgets: Budget[] = JSON.parse(stored);
      return budgets.find((b) => b.tripId === tripId) || budgets[0] || null;
    } catch (error) {
      console.error('Failed to load budget:', error);
      return null;
    }
  }

  async saveBudget(budget: Budget): Promise<Budget> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.BUDGET);
      const budgets: Budget[] = stored ? JSON.parse(stored) : [];

      const index = budgets.findIndex((b) => b.id === budget.id);
      if (index >= 0) {
        budgets[index] = budget;
      } else {
        budgets.push(budget);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(budgets));
      return budget;
    } catch (error) {
      console.error('Failed to save budget:', error);
      throw error;
    }
  }

  async updateBudgetFromExpenses(tripId?: string): Promise<Budget | null> {
    const budget = await this.getBudget(tripId);
    if (!budget) return null;

    const summary = await this.getExpenseSummary(tripId);

    // Convert total to budget currency if needed
    let spent = summary.totalInHomeCurrency;
    if (budget.currency !== this.preferences.homeCurrency) {
      const converted = this.convert({
        amount: spent,
        from: this.preferences.homeCurrency,
        to: budget.currency,
      });
      if (converted) {
        spent = converted.convertedAmount;
      }
    }

    budget.spent = spent;
    budget.remaining = budget.totalAmount - spent;
    budget.percentUsed = (spent / budget.totalAmount) * 100;

    // Check alerts
    budget.alerts.forEach((alert) => {
      if (alert.type === 'threshold' && alert.threshold) {
        alert.triggered = budget.percentUsed >= alert.threshold;
        if (alert.triggered && !alert.triggeredAt) {
          alert.triggeredAt = new Date().toISOString();
        }
      } else if (alert.type === 'overspent') {
        alert.triggered = budget.remaining < 0;
        if (alert.triggered && !alert.triggeredAt) {
          alert.triggeredAt = new Date().toISOString();
        }
      }
    });

    await this.saveBudget(budget);
    return budget;
  }

  // ============================================================================
  // CASH WALLET
  // ============================================================================

  async getCashWallet(): Promise<CashWallet> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CASH_WALLET);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load cash wallet:', error);
    }

    return {
      balances: [],
      transactions: [],
      totalInHomeCurrency: 0,
      homeCurrency: this.preferences.homeCurrency,
    };
  }

  async saveCashWallet(wallet: CashWallet): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CASH_WALLET, JSON.stringify(wallet));
  }

  async addCashTransaction(
    transaction: Omit<CashTransaction, 'id' | 'createdAt'>
  ): Promise<CashTransaction> {
    const wallet = await this.getCashWallet();

    const newTransaction: CashTransaction = {
      ...transaction,
      id: `cash_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    wallet.transactions.unshift(newTransaction);

    // Update balances
    if (transaction.type === 'exchange') {
      // Decrease from currency
      this.updateCashBalance(wallet, transaction.fromCurrency!, -transaction.fromAmount!);
      // Increase to currency
      this.updateCashBalance(wallet, transaction.toCurrency!, transaction.toAmount!);
    } else if (transaction.type === 'withdraw' || transaction.type === 'receive') {
      this.updateCashBalance(wallet, transaction.currency, transaction.amount);
    } else if (transaction.type === 'spend') {
      this.updateCashBalance(wallet, transaction.currency, -transaction.amount);
    } else if (transaction.type === 'adjustment') {
      this.updateCashBalance(wallet, transaction.currency, transaction.amount);
    }

    // Calculate total in home currency
    wallet.totalInHomeCurrency = wallet.balances.reduce((total, balance) => {
      if (balance.currency === this.preferences.homeCurrency) {
        return total + balance.amount;
      }
      const converted = this.convert({
        amount: balance.amount,
        from: balance.currency,
        to: this.preferences.homeCurrency,
      });
      return total + (converted?.convertedAmount || 0);
    }, 0);

    wallet.homeCurrency = this.preferences.homeCurrency;

    await this.saveCashWallet(wallet);
    return newTransaction;
  }

  private updateCashBalance(wallet: CashWallet, currency: CurrencyCode, amount: number): void {
    const balance = wallet.balances.find((b) => b.currency === currency);
    if (balance) {
      balance.amount += amount;
      balance.lastUpdated = new Date().toISOString();
    } else {
      wallet.balances.push({
        currency,
        amount,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  // ============================================================================
  // TRIP SETTINGS
  // ============================================================================

  async getTripCurrencySettings(tripId: string): Promise<TripCurrencySettings | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TRIP_SETTINGS);
      if (!stored) return null;

      const allSettings: TripCurrencySettings[] = JSON.parse(stored);
      return allSettings.find((s) => s.tripId === tripId) || null;
    } catch (error) {
      console.error('Failed to load trip settings:', error);
      return null;
    }
  }

  async saveTripCurrencySettings(settings: TripCurrencySettings): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TRIP_SETTINGS);
      const allSettings: TripCurrencySettings[] = stored ? JSON.parse(stored) : [];

      const index = allSettings.findIndex((s) => s.tripId === settings.tripId);
      if (index >= 0) {
        allSettings[index] = settings;
      } else {
        allSettings.push(settings);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.TRIP_SETTINGS, JSON.stringify(allSettings));
    } catch (error) {
      console.error('Failed to save trip settings:', error);
      throw error;
    }
  }
}

export const currencyService = new CurrencyService();
