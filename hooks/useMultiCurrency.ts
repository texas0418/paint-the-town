// Paint the Town Multi-Currency - useMultiCurrency Hook

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Currency,
  CurrencyCode,
  ExchangeRate,
  Money,
  ConversionResult,
  CurrencyPreferences,
  FormatOptions,
  Expense,
  ExpenseCategory,
  ExpenseSummary,
  Budget,
  CashWallet,
  CashTransaction,
  TripCurrencySettings,
  QuickConversion,
  MultiCurrencyState,
} from '../types/currency';
import { currencyService } from '../services/currencyService';
import { MOCK_QUICK_CONVERSIONS } from '../mocks/mockCurrencyData';

interface UseMultiCurrencyOptions {
  tripId?: string;
  autoRefreshRates?: boolean;
  refreshInterval?: number; // minutes
}

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export function useMultiCurrency(options: UseMultiCurrencyOptions = {}) {
  const { tripId, autoRefreshRates = false, refreshInterval = 60 } = options;

  // Core state
  const [state, setState] = useState<MultiCurrencyState>({
    preferences: {
      homeCurrency: 'USD',
      displayCurrency: 'USD',
      showOriginalAmount: true,
      showConvertedAmount: true,
      autoConvert: true,
      roundingMode: 'nearest',
      roundingPrecision: 2,
      recentCurrencies: [],
      favoriteCurrencies: ['USD', 'EUR', 'GBP', 'JPY'],
    },
    tripSettings: null,
    rates: {},
    ratesLastUpdated: null,
    isLoadingRates: false,
    ratesError: null,
    expenses: [],
    expenseSummary: null,
    budget: null,
    cashWallet: null,
    quickConversions: MOCK_QUICK_CONVERSIONS,
    isLoading: true,
    error: null,
  });

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    initialize();
  }, [tripId]);

  useEffect(() => {
    if (autoRefreshRates) {
      const interval = setInterval(() => {
        refreshRates();
      }, refreshInterval * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefreshRates, refreshInterval]);

  const initialize = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await currencyService.initialize();
      
      const preferences = await currencyService.loadPreferences();
      const expenses = await currencyService.getExpenses(tripId);
      const summary = await currencyService.getExpenseSummary(tripId);
      const budget = await currencyService.getBudget(tripId);
      const cashWallet = await currencyService.getCashWallet();
      const tripSettings = tripId 
        ? await currencyService.getTripCurrencySettings(tripId)
        : null;

      setState(prev => ({
        ...prev,
        preferences,
        tripSettings,
        expenses,
        expenseSummary: summary,
        budget,
        cashWallet,
        ratesLastUpdated: currencyService.getRatesLastUpdated(),
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to initialize currency data',
      }));
    }
  }, [tripId]);

  // ============================================================================
  // CURRENCY DATA
  // ============================================================================

  const getCurrency = useCallback((code: CurrencyCode): Currency | undefined => {
    return currencyService.getCurrency(code);
  }, []);

  const getAllCurrencies = useCallback((): Currency[] => {
    return currencyService.getAllCurrencies();
  }, []);

  const searchCurrencies = useCallback((query: string): Currency[] => {
    return currencyService.searchCurrencies(query);
  }, []);

  const getPopularCurrencies = useCallback((): Currency[] => {
    return currencyService.getPopularCurrencies();
  }, []);

  // ============================================================================
  // PREFERENCES
  // ============================================================================

  const updatePreferences = useCallback(async (
    updates: Partial<CurrencyPreferences>
  ): Promise<void> => {
    const updated = await currencyService.savePreferences(updates);
    setState(prev => ({ ...prev, preferences: updated }));
  }, []);

  const setHomeCurrency = useCallback(async (code: CurrencyCode): Promise<void> => {
    await updatePreferences({ homeCurrency: code, displayCurrency: code });
    // Recalculate summaries
    const summary = await currencyService.getExpenseSummary(tripId);
    setState(prev => ({ ...prev, expenseSummary: summary }));
  }, [tripId, updatePreferences]);

  const toggleFavorite = useCallback(async (code: CurrencyCode): Promise<void> => {
    await currencyService.toggleFavoriteCurrency(code);
    const preferences = await currencyService.loadPreferences();
    setState(prev => ({ ...prev, preferences }));
  }, []);

  // ============================================================================
  // EXCHANGE RATES
  // ============================================================================

  const refreshRates = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoadingRates: true, ratesError: null }));
    
    try {
      const success = await currencyService.fetchLatestRates(state.preferences.homeCurrency);
      
      setState(prev => ({
        ...prev,
        isLoadingRates: false,
        ratesLastUpdated: currencyService.getRatesLastUpdated(),
        ratesError: success ? null : 'Failed to fetch rates',
      }));
      
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingRates: false,
        ratesError: 'Failed to fetch rates',
      }));
      return false;
    }
  }, [state.preferences.homeCurrency]);

  const getRate = useCallback((
    from: CurrencyCode,
    to: CurrencyCode
  ): ExchangeRate | null => {
    return currencyService.getRate(from, to);
  }, []);

  // ============================================================================
  // CONVERSION
  // ============================================================================

  const convert = useCallback((
    amount: number,
    from: CurrencyCode,
    to: CurrencyCode
  ): ConversionResult | null => {
    return currencyService.convert({ amount, from, to });
  }, []);

  const convertToHome = useCallback((money: Money): number | null => {
    const result = currencyService.convertToHome(money);
    return result?.amount ?? null;
  }, []);

  const format = useCallback((
    amount: number,
    currency: CurrencyCode,
    options?: FormatOptions
  ): string => {
    return currencyService.format(amount, currency, options);
  }, []);

  const formatMoney = useCallback((money: Money, options?: FormatOptions): string => {
    return currencyService.formatMoney(money, options);
  }, []);

  const formatWithConversion = useCallback((
    money: Money,
    targetCurrency?: CurrencyCode
  ): string => {
    return currencyService.formatWithConversion(money, targetCurrency);
  }, []);

  // ============================================================================
  // EXPENSES
  // ============================================================================

  const addExpense = useCallback(async (
    expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Expense> => {
    const newExpense = await currencyService.addExpense({
      ...expense,
      tripId: tripId || expense.tripId,
    });
    
    const expenses = await currencyService.getExpenses(tripId);
    const summary = await currencyService.getExpenseSummary(tripId);
    const budget = await currencyService.updateBudgetFromExpenses(tripId);
    
    setState(prev => ({
      ...prev,
      expenses,
      expenseSummary: summary,
      budget: budget || prev.budget,
    }));
    
    return newExpense;
  }, [tripId]);

  const updateExpense = useCallback(async (
    id: string,
    updates: Partial<Expense>
  ): Promise<Expense | null> => {
    const updated = await currencyService.updateExpense(id, updates);
    
    if (updated) {
      const expenses = await currencyService.getExpenses(tripId);
      const summary = await currencyService.getExpenseSummary(tripId);
      const budget = await currencyService.updateBudgetFromExpenses(tripId);
      
      setState(prev => ({
        ...prev,
        expenses,
        expenseSummary: summary,
        budget: budget || prev.budget,
      }));
    }
    
    return updated;
  }, [tripId]);

  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    const success = await currencyService.deleteExpense(id);
    
    if (success) {
      const expenses = await currencyService.getExpenses(tripId);
      const summary = await currencyService.getExpenseSummary(tripId);
      const budget = await currencyService.updateBudgetFromExpenses(tripId);
      
      setState(prev => ({
        ...prev,
        expenses,
        expenseSummary: summary,
        budget: budget || prev.budget,
      }));
    }
    
    return success;
  }, [tripId]);

  const getExpensesByCategory = useCallback((
    category: ExpenseCategory
  ): Expense[] => {
    return state.expenses.filter(e => e.category === category);
  }, [state.expenses]);

  const getExpensesByCurrency = useCallback((
    currency: CurrencyCode
  ): Expense[] => {
    return state.expenses.filter(e => e.currency === currency);
  }, [state.expenses]);

  // ============================================================================
  // BUDGET
  // ============================================================================

  const createBudget = useCallback(async (
    budget: Omit<Budget, 'spent' | 'remaining' | 'percentUsed'>
  ): Promise<Budget> => {
    const newBudget: Budget = {
      ...budget,
      spent: 0,
      remaining: budget.totalAmount,
      percentUsed: 0,
    };
    
    await currencyService.saveBudget(newBudget);
    const updated = await currencyService.updateBudgetFromExpenses(tripId);
    
    setState(prev => ({ ...prev, budget: updated || newBudget }));
    return updated || newBudget;
  }, [tripId]);

  const updateBudget = useCallback(async (
    updates: Partial<Budget>
  ): Promise<Budget | null> => {
    if (!state.budget) return null;
    
    const updated: Budget = { ...state.budget, ...updates };
    await currencyService.saveBudget(updated);
    const refreshed = await currencyService.updateBudgetFromExpenses(tripId);
    
    setState(prev => ({ ...prev, budget: refreshed || updated }));
    return refreshed || updated;
  }, [state.budget, tripId]);

  // ============================================================================
  // CASH WALLET
  // ============================================================================

  const addCashTransaction = useCallback(async (
    transaction: Omit<CashTransaction, 'id' | 'createdAt'>
  ): Promise<CashTransaction> => {
    const newTransaction = await currencyService.addCashTransaction(transaction);
    const wallet = await currencyService.getCashWallet();
    
    setState(prev => ({ ...prev, cashWallet: wallet }));
    return newTransaction;
  }, []);

  const withdrawCash = useCallback(async (
    currency: CurrencyCode,
    amount: number,
    description: string,
    fees?: number
  ): Promise<CashTransaction> => {
    return addCashTransaction({
      type: 'withdraw',
      currency,
      amount,
      description,
      fees,
      feesCurrency: currency,
      date: new Date().toISOString().split('T')[0],
    });
  }, [addCashTransaction]);

  const spendCash = useCallback(async (
    currency: CurrencyCode,
    amount: number,
    description: string
  ): Promise<CashTransaction> => {
    return addCashTransaction({
      type: 'spend',
      currency,
      amount,
      description,
      date: new Date().toISOString().split('T')[0],
    });
  }, [addCashTransaction]);

  const exchangeCash = useCallback(async (
    fromCurrency: CurrencyCode,
    fromAmount: number,
    toCurrency: CurrencyCode,
    toAmount: number,
    fees?: number
  ): Promise<CashTransaction> => {
    return addCashTransaction({
      type: 'exchange',
      fromCurrency,
      fromAmount,
      toCurrency,
      toAmount,
      exchangeRate: toAmount / fromAmount,
      currency: fromCurrency,
      amount: fromAmount,
      description: `Exchange ${fromCurrency} to ${toCurrency}`,
      fees,
      feesCurrency: fromCurrency,
      date: new Date().toISOString().split('T')[0],
    });
  }, [addCashTransaction]);

  const getCashBalance = useCallback((currency: CurrencyCode): number => {
    const balance = state.cashWallet?.balances.find(b => b.currency === currency);
    return balance?.amount || 0;
  }, [state.cashWallet]);

  // ============================================================================
  // QUICK CONVERSIONS
  // ============================================================================

  const addQuickConversion = useCallback((from: CurrencyCode, to: CurrencyCode) => {
    const existing = state.quickConversions.find(
      qc => qc.from === from && qc.to === to
    );
    
    if (existing) {
      setState(prev => ({
        ...prev,
        quickConversions: prev.quickConversions.map(qc =>
          qc.id === existing.id
            ? { ...qc, lastUsed: new Date().toISOString() }
            : qc
        ),
      }));
    } else {
      const newQc: QuickConversion = {
        id: `qc_${Date.now()}`,
        from,
        to,
        commonAmounts: [10, 20, 50, 100, 200],
        lastUsed: new Date().toISOString(),
      };
      setState(prev => ({
        ...prev,
        quickConversions: [newQc, ...prev.quickConversions].slice(0, 10),
      }));
    }
  }, [state.quickConversions]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const totalSpentInHomeCurrency = useMemo(() => {
    return state.expenseSummary?.totalInHomeCurrency || 0;
  }, [state.expenseSummary]);

  const budgetRemaining = useMemo(() => {
    return state.budget?.remaining || 0;
  }, [state.budget]);

  const budgetPercentUsed = useMemo(() => {
    return state.budget?.percentUsed || 0;
  }, [state.budget]);

  const cashTotalInHomeCurrency = useMemo(() => {
    return state.cashWallet?.totalInHomeCurrency || 0;
  }, [state.cashWallet]);

  const triggeredAlerts = useMemo(() => {
    return state.budget?.alerts.filter(a => a.triggered) || [];
  }, [state.budget]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    ...state,
    isReady: !state.isLoading,
    
    // Currency data
    getCurrency,
    getAllCurrencies,
    searchCurrencies,
    getPopularCurrencies,
    
    // Preferences
    updatePreferences,
    setHomeCurrency,
    toggleFavorite,
    homeCurrency: state.preferences.homeCurrency,
    favoriteCurrencies: state.preferences.favoriteCurrencies,
    recentCurrencies: state.preferences.recentCurrencies,
    
    // Rates
    refreshRates,
    getRate,
    ratesLastUpdated: state.ratesLastUpdated,
    isLoadingRates: state.isLoadingRates,
    
    // Conversion & formatting
    convert,
    convertToHome,
    format,
    formatMoney,
    formatWithConversion,
    
    // Expenses
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByCategory,
    getExpensesByCurrency,
    expenses: state.expenses,
    expenseSummary: state.expenseSummary,
    totalSpentInHomeCurrency,
    
    // Budget
    createBudget,
    updateBudget,
    budget: state.budget,
    budgetRemaining,
    budgetPercentUsed,
    triggeredAlerts,
    
    // Cash
    addCashTransaction,
    withdrawCash,
    spendCash,
    exchangeCash,
    getCashBalance,
    cashWallet: state.cashWallet,
    cashTotalInHomeCurrency,
    
    // Quick conversions
    quickConversions: state.quickConversions,
    addQuickConversion,
    
    // Utilities
    refresh: initialize,
  };
}
