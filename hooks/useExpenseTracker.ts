import { useState, useCallback, useMemo, useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Expense,
  ExpenseCategory,
  SplitType,
  SplitDetails,
  SplitParticipant,
  PaymentMethod,
  PaymentRequest,
  BudgetComparison,
  ItineraryBudgetSummary,
  ParticipantBalance,
  Settlement,
  SplitSummary,
  SavingsGoal,
  SavingsContribution,
  PAYMENT_APPS,
  ReceiptOCRData,
  ReceiptLineItem,
  Currency,
  ExchangeRate,
  SUPPORTED_CURRENCIES,
  getCurrencyByCode,
  formatCurrency,
} from '@/types/expense';

// ============================================================================
// Types
// ============================================================================

interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
  paymentInfo?: {
    venmo?: string;
    paypal?: string;
    phone?: string;
  };
}

interface Activity {
  id: string;
  name: string;
  estimatedCost: string | number;
  category?: ExpenseCategory;
}

interface UseExpenseTrackerOptions {
  itineraryId: string;
  itineraryName: string;
  participants: Participant[];
  activities?: Activity[];
  currency?: string;
  baseCurrency?: string; // Default currency for conversions
  initialExpenses?: Expense[];
}

// ============================================================================
// Mock Exchange Rates (Replace with API in production)
// ============================================================================

const MOCK_EXCHANGE_RATES: Record<string, number> = {
  'USD_EUR': 0.92,
  'USD_GBP': 0.79,
  'USD_JPY': 149.50,
  'USD_CAD': 1.36,
  'USD_AUD': 1.53,
  'USD_CHF': 0.88,
  'USD_CNY': 7.24,
  'USD_INR': 83.12,
  'USD_MXN': 17.15,
  'USD_BRL': 4.97,
  'USD_KRW': 1325.50,
  'USD_SGD': 1.34,
  'USD_HKD': 7.82,
  'USD_THB': 35.50,
  'EUR_USD': 1.09,
  'EUR_GBP': 0.86,
  'GBP_USD': 1.27,
  'GBP_EUR': 1.16,
  'JPY_USD': 0.0067,
};

const getExchangeRate = (from: string, to: string): number => {
  if (from === to) return 1;
  
  const directKey = `${from}_${to}`;
  if (MOCK_EXCHANGE_RATES[directKey]) {
    return MOCK_EXCHANGE_RATES[directKey];
  }
  
  // Try inverse
  const inverseKey = `${to}_${from}`;
  if (MOCK_EXCHANGE_RATES[inverseKey]) {
    return 1 / MOCK_EXCHANGE_RATES[inverseKey];
  }
  
  // Try through USD
  const toUSD = MOCK_EXCHANGE_RATES[`${from}_USD`] || (1 / (MOCK_EXCHANGE_RATES[`USD_${from}`] || 1));
  const fromUSD = MOCK_EXCHANGE_RATES[`USD_${to}`] || (1 / (MOCK_EXCHANGE_RATES[`${to}_USD`] || 1));
  
  return toUSD * fromUSD;
};

// ============================================================================
// Utility Functions
// ============================================================================

const generateId = () => `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const parseEstimatedCost = (cost: string | number): number => {
  if (typeof cost === 'number') return cost;
  
  // Parse $, $$, $$$, $$$$ format
  const dollarSigns = (cost.match(/\$/g) || []).length;
  const priceMap: Record<number, number> = {
    1: 25,
    2: 50,
    3: 100,
    4: 200,
  };
  return priceMap[dollarSigns] || 50;
};

// ============================================================================
// Main Hook
// ============================================================================

export function useExpenseTracker({
  itineraryId,
  itineraryName,
  participants,
  activities = [],
  currency = 'USD',
  baseCurrency = 'USD',
  initialExpenses = [],
}: UseExpenseTrackerOptions) {
  // State
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // ============================================================================
  // Currency Conversion
  // ============================================================================
  
  const convertCurrency = useCallback((
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): { convertedAmount: number; exchangeRate: number } => {
    const rate = getExchangeRate(fromCurrency, toCurrency);
    return {
      convertedAmount: Math.round(amount * rate * 100) / 100,
      exchangeRate: rate,
    };
  }, []);

  // ============================================================================
  // Receipt Scanning with OCR
  // ============================================================================
  
  const scanReceipt = useCallback(async (): Promise<ReceiptOCRData | null> => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to scan receipts.');
        return null;
      }

      setIsScanning(true);

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        setIsScanning(false);
        return null;
      }

      const imageUri = result.assets[0].uri;
      
      // Simulate OCR processing (replace with actual OCR service like Google Vision, AWS Textract, etc.)
      const ocrData = await simulateOCR(imageUri);
      
      setIsScanning(false);
      return ocrData;
    } catch (error) {
      console.error('Receipt scanning failed:', error);
      setIsScanning(false);
      Alert.alert('Scan Failed', 'Could not process the receipt. Please try again or enter manually.');
      return null;
    }
  }, []);

  const pickReceiptFromGallery = useCallback(async (): Promise<ReceiptOCRData | null> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library access is needed to select receipts.');
        return null;
      }

      setIsScanning(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        setIsScanning(false);
        return null;
      }

      const imageUri = result.assets[0].uri;
      const ocrData = await simulateOCR(imageUri);
      
      setIsScanning(false);
      return ocrData;
    } catch (error) {
      console.error('Gallery selection failed:', error);
      setIsScanning(false);
      return null;
    }
  }, []);

  // Simulated OCR - Replace with actual OCR API integration
  const simulateOCR = async (imageUri: string): Promise<ReceiptOCRData> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In production, send imageUri to OCR service like:
    // - Google Cloud Vision API
    // - AWS Textract
    // - Microsoft Azure Computer Vision
    // - Tesseract.js (on-device)
    
    // Return simulated extracted data
    // This would be replaced with actual parsed data from OCR
    return {
      imageUri,
      scannedAt: new Date().toISOString(),
      confidence: 0.85,
      merchantName: undefined, // Would be extracted
      date: undefined,
      total: undefined,
      currency: undefined,
      items: [],
      rawText: 'OCR text would appear here',
    };
  };

  const createExpenseFromReceipt = useCallback((
    receiptData: ReceiptOCRData,
    overrides?: Partial<{
      description: string;
      amount: number;
      category: ExpenseCategory;
      currency: string;
      paidById: string;
    }>
  ): Expense | null => {
    const amount = overrides?.amount || receiptData.total;
    if (!amount || amount <= 0) {
      Alert.alert('Amount Required', 'Please enter the expense amount manually.');
      return null;
    }

    const expenseCurrency = overrides?.currency || receiptData.currency || currency;
    const paidById = overrides?.paidById || participants[0]?.id;
    const paidBy = participants.find(p => p.id === paidById);

    // Convert to base currency if different
    let convertedAmount = amount;
    let exchangeRate = 1;
    if (expenseCurrency !== baseCurrency) {
      const conversion = convertCurrency(amount, expenseCurrency, baseCurrency);
      convertedAmount = conversion.convertedAmount;
      exchangeRate = conversion.exchangeRate;
    }

    const expense: Expense = {
      id: generateId(),
      itineraryId,
      description: overrides?.description || receiptData.merchantName || 'Scanned Receipt',
      amount: convertedAmount,
      currency: baseCurrency,
      originalAmount: amount,
      originalCurrency: expenseCurrency,
      exchangeRate: expenseCurrency !== baseCurrency ? exchangeRate : undefined,
      convertedAmount: expenseCurrency !== baseCurrency ? convertedAmount : undefined,
      category: overrides?.category || 'other',
      date: receiptData.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      paidBy: paidById,
      paidByName: paidBy?.name || 'Unknown',
      splitType: 'equal',
      splitDetails: {
        participants: participants.map(p => ({
          id: p.id,
          name: p.name,
          owes: convertedAmount / participants.length,
          paid: p.id === paidById ? convertedAmount : 0,
          settled: p.id === paidById,
        })),
        settlementStatus: 'pending',
      },
      receiptUrl: receiptData.imageUri,
      receiptData,
      isEstimated: false,
    };

    setExpenses(prev => [...prev, expense]);
    return expense;
  }, [itineraryId, participants, currency, baseCurrency, convertCurrency]);

  // ============================================================================
  // Add Expense with Multi-Currency Support
  // ============================================================================
  
  const addExpense = useCallback((
    data: {
      description: string;
      amount: number;
      category: ExpenseCategory;
      expenseCurrency?: string; // Currency of the expense
      activityId?: string;
      paidById: string;
      splitType?: SplitType;
      splitParticipantIds?: string[];
      customSplit?: { participantId: string; amount?: number; percentage?: number }[];
      paymentMethod?: PaymentMethod;
      notes?: string;
      receiptUrl?: string;
      receiptData?: ReceiptOCRData;
      isEstimated?: boolean;
    }
  ): Expense => {
    const paidBy = participants.find(p => p.id === data.paidById);
    const activity = activities.find(a => a.id === data.activityId);
    const expenseCurrency = data.expenseCurrency || currency;
    
    // Convert to base currency if different
    let finalAmount = data.amount;
    let exchangeRate: number | undefined;
    let convertedAmount: number | undefined;
    
    if (expenseCurrency !== baseCurrency) {
      const conversion = convertCurrency(data.amount, expenseCurrency, baseCurrency);
      finalAmount = conversion.convertedAmount;
      exchangeRate = conversion.exchangeRate;
      convertedAmount = conversion.convertedAmount;
    }
    
    // Calculate split details
    const splitType = data.splitType || 'equal';
    const splitParticipants = data.splitParticipantIds 
      ? participants.filter(p => data.splitParticipantIds!.includes(p.id))
      : participants;
    
    let splitDetails: SplitDetails | undefined;
    
    if (splitType !== 'paid_by_one') {
      const participantSplits: SplitParticipant[] = splitParticipants.map(p => {
        let owes = 0;
        
        if (splitType === 'equal') {
          owes = finalAmount / splitParticipants.length;
        } else if (splitType === 'percentage' && data.customSplit) {
          const custom = data.customSplit.find(c => c.participantId === p.id);
          owes = custom?.percentage ? (finalAmount * custom.percentage / 100) : 0;
        } else if (splitType === 'exact' && data.customSplit) {
          const custom = data.customSplit.find(c => c.participantId === p.id);
          owes = custom?.amount || 0;
        }
        
        return {
          id: p.id,
          name: p.name,
          owes: Math.round(owes * 100) / 100,
          paid: p.id === data.paidById ? finalAmount : 0,
          settled: p.id === data.paidById,
        };
      });
      
      splitDetails = {
        participants: participantSplits,
        settlementStatus: 'pending',
      };
    }
    
    const expense: Expense = {
      id: generateId(),
      itineraryId,
      activityId: data.activityId,
      activityName: activity?.name,
      description: data.description,
      amount: finalAmount,
      currency: baseCurrency,
      originalAmount: expenseCurrency !== baseCurrency ? data.amount : undefined,
      originalCurrency: expenseCurrency !== baseCurrency ? expenseCurrency : undefined,
      exchangeRate,
      convertedAmount,
      category: data.category,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      paidBy: data.paidById,
      paidByName: paidBy?.name || 'Unknown',
      paymentMethod: data.paymentMethod,
      splitType,
      splitDetails,
      notes: data.notes,
      receiptUrl: data.receiptUrl,
      receiptData: data.receiptData,
      isEstimated: data.isEstimated || false,
      estimatedAmount: activity ? parseEstimatedCost(activity.estimatedCost) : undefined,
    };
    
    setExpenses(prev => [...prev, expense]);
    return expense;
  }, [itineraryId, participants, activities, currency, baseCurrency, convertCurrency]);

  // ============================================================================
  // Edit Expense
  // ============================================================================
  
  const startEditingExpense = useCallback((expense: Expense) => {
    setEditingExpense(expense);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingExpense(null);
  }, []);

  const editExpense = useCallback((
    id: string,
    updates: {
      description?: string;
      amount?: number;
      expenseCurrency?: string;
      category?: ExpenseCategory;
      activityId?: string;
      paidById?: string;
      splitType?: SplitType;
      notes?: string;
      paymentMethod?: PaymentMethod;
    }
  ): Expense | null => {
    const existingExpense = expenses.find(e => e.id === id);
    if (!existingExpense) return null;

    let finalAmount = updates.amount ?? existingExpense.amount;
    let exchangeRate: number | undefined = existingExpense.exchangeRate;
    let convertedAmount: number | undefined = existingExpense.convertedAmount;
    let originalAmount: number | undefined = existingExpense.originalAmount;
    let originalCurrency: string | undefined = existingExpense.originalCurrency;

    // Handle currency change
    const newCurrency = updates.expenseCurrency;
    if (newCurrency && updates.amount !== undefined) {
      if (newCurrency !== baseCurrency) {
        const conversion = convertCurrency(updates.amount, newCurrency, baseCurrency);
        finalAmount = conversion.convertedAmount;
        exchangeRate = conversion.exchangeRate;
        convertedAmount = conversion.convertedAmount;
        originalAmount = updates.amount;
        originalCurrency = newCurrency;
      } else {
        exchangeRate = undefined;
        convertedAmount = undefined;
        originalAmount = undefined;
        originalCurrency = undefined;
      }
    }

    // Update paidBy info
    let paidById = updates.paidById ?? existingExpense.paidBy;
    let paidByName = existingExpense.paidByName;
    if (updates.paidById) {
      const paidBy = participants.find(p => p.id === updates.paidById);
      paidByName = paidBy?.name || 'Unknown';
    }

    // Update activity info
    let activityName = existingExpense.activityName;
    if (updates.activityId !== undefined) {
      const activity = activities.find(a => a.id === updates.activityId);
      activityName = activity?.name;
    }

    // Recalculate split if amount or split type changed
    let splitDetails = existingExpense.splitDetails;
    const splitType = updates.splitType ?? existingExpense.splitType;
    
    if ((updates.amount !== undefined || updates.splitType !== undefined || updates.paidById !== undefined) 
        && splitType !== 'paid_by_one' && splitDetails) {
      splitDetails = {
        ...splitDetails,
        participants: splitDetails.participants.map(p => ({
          ...p,
          owes: finalAmount / splitDetails!.participants.length,
          paid: p.id === paidById ? finalAmount : 0,
          settled: p.id === paidById,
        })),
        settlementStatus: 'pending',
      };
    }

    const updatedExpense: Expense = {
      ...existingExpense,
      description: updates.description ?? existingExpense.description,
      amount: finalAmount,
      originalAmount,
      originalCurrency,
      exchangeRate,
      convertedAmount,
      category: updates.category ?? existingExpense.category,
      activityId: updates.activityId ?? existingExpense.activityId,
      activityName,
      paidBy: paidById,
      paidByName,
      splitType,
      splitDetails,
      notes: updates.notes ?? existingExpense.notes,
      paymentMethod: updates.paymentMethod ?? existingExpense.paymentMethod,
      updatedAt: new Date().toISOString(),
    };

    setExpenses(prev => prev.map(exp => 
      exp.id === id ? updatedExpense : exp
    ));
    setEditingExpense(null);

    return updatedExpense;
  }, [expenses, participants, activities, baseCurrency, convertCurrency]);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    setExpenses(prev => prev.map(exp => 
      exp.id === id ? { ...exp, ...updates, updatedAt: new Date().toISOString() } : exp
    ));
  }, []);
  
  const deleteExpense = useCallback((id: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setExpenses(prev => prev.filter(exp => exp.id !== id)),
        },
      ]
    );
  }, []);

  // ============================================================================
  // Budget vs Actual Calculations
  // ============================================================================
  
  const budgetSummary = useMemo((): ItineraryBudgetSummary => {
    // Calculate totals
    const totalActual = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalEstimated = activities.reduce((sum, act) => 
      sum + parseEstimatedCost(act.estimatedCost), 0
    );
    
    // By category
    const byCategory = {} as Record<ExpenseCategory, { estimated: number; actual: number; difference: number }>;
    
    expenses.forEach(exp => {
      if (!byCategory[exp.category]) {
        byCategory[exp.category] = { estimated: 0, actual: 0, difference: 0 };
      }
      byCategory[exp.category].actual += exp.amount;
    });
    
    activities.forEach(act => {
      const cat = act.category || 'other';
      if (!byCategory[cat]) {
        byCategory[cat] = { estimated: 0, actual: 0, difference: 0 };
      }
      byCategory[cat].estimated += parseEstimatedCost(act.estimatedCost);
    });
    
    Object.keys(byCategory).forEach(cat => {
      const c = byCategory[cat as ExpenseCategory];
      c.difference = c.actual - c.estimated;
    });
    
    // By activity
    const byActivity: BudgetComparison[] = activities.map(act => {
      const activityExpenses = expenses.filter(exp => exp.activityId === act.id);
      const actual = activityExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const estimated = parseEstimatedCost(act.estimatedCost);
      const difference = actual - estimated;
      const percentageDiff = estimated > 0 ? (difference / estimated) * 100 : 0;
      
      let status: 'under' | 'on_track' | 'over' = 'on_track';
      if (percentageDiff < -10) status = 'under';
      else if (percentageDiff > 10) status = 'over';
      
      return {
        activityId: act.id,
        activityName: act.name,
        category: act.category || 'other',
        estimated,
        actual,
        difference,
        percentageDiff,
        status,
      };
    });
    
    // Overall status
    const totalDifference = totalActual - totalEstimated;
    const percentageUsed = totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0;
    let overallStatus: 'under' | 'on_track' | 'over' = 'on_track';
    if (percentageUsed < 90) overallStatus = 'under';
    else if (percentageUsed > 110) overallStatus = 'over';
    
    return {
      itineraryId,
      itineraryName,
      totalEstimated,
      totalActual,
      totalDifference,
      byCategory,
      byActivity,
      overallStatus,
      percentageUsed,
    };
  }, [expenses, activities, itineraryId, itineraryName]);

  // ============================================================================
  // Cost Split Calculations
  // ============================================================================
  
  const splitSummary = useMemo((): SplitSummary => {
    // Calculate balances for each participant
    const balances: ParticipantBalance[] = participants.map(p => {
      let totalPaid = 0;
      let totalOwed = 0;
      
      expenses.forEach(exp => {
        // What this person paid
        if (exp.paidBy === p.id) {
          totalPaid += exp.amount;
        }
        
        // What this person owes
        if (exp.splitDetails) {
          const participant = exp.splitDetails.participants.find(sp => sp.id === p.id);
          if (participant) {
            totalOwed += participant.owes;
          }
        } else if (exp.splitType === 'paid_by_one' && exp.paidBy !== p.id) {
          // No split - only payer is responsible
          totalOwed += 0;
        }
      });
      
      return {
        id: p.id,
        name: p.name,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalOwed: Math.round(totalOwed * 100) / 100,
        netBalance: Math.round((totalPaid - totalOwed) * 100) / 100,
      };
    });
    
    // Calculate settlements (who owes whom)
    const settlements: Settlement[] = [];
    
    // Simple algorithm: people who owe money pay people who are owed money
    const debtors = balances.filter(b => b.netBalance < 0).sort((a, b) => a.netBalance - b.netBalance);
    const creditors = balances.filter(b => b.netBalance > 0).sort((a, b) => b.netBalance - a.netBalance);
    
    let i = 0, j = 0;
    const tempDebtors = debtors.map(d => ({ ...d, remaining: Math.abs(d.netBalance) }));
    const tempCreditors = creditors.map(c => ({ ...c, remaining: c.netBalance }));
    
    while (i < tempDebtors.length && j < tempCreditors.length) {
      const debtor = tempDebtors[i];
      const creditor = tempCreditors[j];
      
      const amount = Math.min(debtor.remaining, creditor.remaining);
      
      if (amount > 0.01) {
        settlements.push({
          from: { id: debtor.id, name: debtor.name },
          to: { id: creditor.id, name: creditor.name },
          amount: Math.round(amount * 100) / 100,
          currency,
        });
      }
      
      debtor.remaining -= amount;
      creditor.remaining -= amount;
      
      if (debtor.remaining < 0.01) i++;
      if (creditor.remaining < 0.01) j++;
    }
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const isSettled = settlements.length === 0 || 
      settlements.every(s => s.amount < 0.01);
    
    return {
      participants: balances,
      settlements,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      currency,
      isSettled,
    };
  }, [expenses, participants, currency]);

  // ============================================================================
  // Payment Integration
  // ============================================================================
  
  const sendPaymentRequest = useCallback(async (
    toParticipantId: string,
    amount: number,
    method: PaymentMethod,
    note?: string
  ): Promise<boolean> => {
    const toParticipant = participants.find(p => p.id === toParticipantId);
    if (!toParticipant) return false;
    
    const paymentApp = PAYMENT_APPS.find(app => app.id === method);
    if (!paymentApp) {
      Alert.alert('Payment Method', 'This payment method is not supported.');
      return false;
    }
    
    // Build deep link
    let url = '';
    const encodedNote = encodeURIComponent(note || `Paint the Town: ${itineraryName}`);
    
    switch (method) {
      case 'venmo':
        const venmoUsername = toParticipant.paymentInfo?.venmo;
        if (venmoUsername) {
          url = `venmo://paycharge?txn=pay&recipients=${venmoUsername}&amount=${amount}&note=${encodedNote}`;
        } else {
          url = `venmo://paycharge?txn=pay&amount=${amount}&note=${encodedNote}`;
        }
        break;
        
      case 'paypal':
        const paypalUsername = toParticipant.paymentInfo?.paypal;
        if (paypalUsername) {
          url = `https://paypal.me/${paypalUsername}/${amount}`;
        }
        break;
        
      case 'zelle':
        // Zelle typically opens bank app
        Alert.alert(
          'Send via Zelle',
          `Send $${amount.toFixed(2)} to ${toParticipant.name}\n\nOpen your banking app to send via Zelle.`,
          [{ text: 'OK' }]
        );
        return true;
        
      case 'cash':
        Alert.alert(
          'Cash Payment',
          `Pay $${amount.toFixed(2)} in cash to ${toParticipant.name}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Mark as Paid',
              onPress: () => markSettlementPaid(toParticipantId, amount),
            },
          ]
        );
        return true;
        
      default:
        Alert.alert('Payment', `Pay $${amount.toFixed(2)} to ${toParticipant.name}`);
        return true;
    }
    
    if (url) {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        
        // Create payment request record
        const request: PaymentRequest = {
          id: generateId(),
          fromParticipantId: participants[0].id, // Assuming first participant is current user
          toParticipantId,
          amount,
          currency,
          status: 'sent',
          expenseIds: [],
          createdAt: new Date().toISOString(),
          paymentMethod: method,
          note,
        };
        setPaymentRequests(prev => [...prev, request]);
        
        return true;
      } else {
        // Fallback to web
        if (paymentApp.webFallback) {
          await Linking.openURL(paymentApp.webFallback);
          return true;
        }
        Alert.alert('App Not Found', `Please install ${paymentApp.name} to use this payment method.`);
        return false;
      }
    }
    
    return false;
  }, [participants, itineraryName, currency]);
  
  const markSettlementPaid = useCallback((participantId: string, amount: number) => {
    // Update expenses to mark participant's splits as settled
    setExpenses(prev => prev.map(exp => {
      if (exp.splitDetails) {
        const updatedParticipants = exp.splitDetails.participants.map(sp => {
          if (sp.id === participantId && !sp.settled) {
            return { ...sp, settled: true, paid: sp.owes };
          }
          return sp;
        });
        
        const allSettled = updatedParticipants.every(sp => sp.settled);
        
        return {
          ...exp,
          splitDetails: {
            ...exp.splitDetails,
            participants: updatedParticipants,
            settlementStatus: allSettled ? 'settled' : 'partial',
          },
        };
      }
      return exp;
    }));
  }, []);

  // ============================================================================
  // Quick Actions
  // ============================================================================
  
  const settleUp = useCallback((settlement: Settlement) => {
    Alert.alert(
      'Settle Up',
      `${settlement.from.name} owes ${settlement.to.name} ${currency} ${settlement.amount.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Venmo', onPress: () => sendPaymentRequest(settlement.to.id, settlement.amount, 'venmo') },
        { text: 'PayPal', onPress: () => sendPaymentRequest(settlement.to.id, settlement.amount, 'paypal') },
        { text: 'Cash', onPress: () => sendPaymentRequest(settlement.to.id, settlement.amount, 'cash') },
      ]
    );
  }, [currency, sendPaymentRequest]);

  // ============================================================================
  // Export & Share
  // ============================================================================
  
  const exportSummary = useCallback((): string => {
    const lines = [
      `💰 ${itineraryName} - Expense Summary`,
      ``,
      `Total Spent: ${currency} ${splitSummary.totalExpenses.toFixed(2)}`,
      `Budget: ${currency} ${budgetSummary.totalEstimated.toFixed(2)}`,
      `Difference: ${budgetSummary.totalDifference >= 0 ? '+' : ''}${currency} ${budgetSummary.totalDifference.toFixed(2)}`,
      ``,
      `📊 By Category:`,
      ...Object.entries(budgetSummary.byCategory).map(([cat, data]) => 
        `  ${cat}: ${currency} ${data.actual.toFixed(2)}`
      ),
      ``,
      `👥 Balances:`,
      ...splitSummary.participants.map(p => 
        `  ${p.name}: ${p.netBalance >= 0 ? 'owed' : 'owes'} ${currency} ${Math.abs(p.netBalance).toFixed(2)}`
      ),
      ``,
      `💸 Settlements:`,
      ...splitSummary.settlements.map(s => 
        `  ${s.from.name} → ${s.to.name}: ${currency} ${s.amount.toFixed(2)}`
      ),
    ];
    
    return lines.join('\n');
  }, [itineraryName, currency, splitSummary, budgetSummary]);

  return {
    // State
    expenses,
    paymentRequests,
    isLoading,
    isScanning,
    editingExpense,
    
    // Expense CRUD
    addExpense,
    updateExpense,
    editExpense,
    startEditingExpense,
    cancelEditing,
    deleteExpense,
    
    // Receipt Scanning
    scanReceipt,
    pickReceiptFromGallery,
    createExpenseFromReceipt,
    
    // Currency
    convertCurrency,
    baseCurrency,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    
    // Summaries
    budgetSummary,
    splitSummary,
    
    // Payments
    sendPaymentRequest,
    markSettlementPaid,
    settleUp,
    
    // Export
    exportSummary,
    
    // Computed
    totalSpent: splitSummary.totalExpenses,
    isOverBudget: budgetSummary.overallStatus === 'over',
    hasUnsettledBalances: !splitSummary.isSettled,
  };
}

// ============================================================================
// Savings Goal Hook
// ============================================================================

interface UseSavingsGoalsOptions {
  initialGoals?: SavingsGoal[];
}

export function useSavingsGoals({ initialGoals = [] }: UseSavingsGoalsOptions = {}) {
  const [goals, setGoals] = useState<SavingsGoal[]>(initialGoals);

  const createGoal = useCallback((
    data: {
      name: string;
      targetAmount: number;
      currency?: string;
      targetDate?: string;
      linkedItineraryId?: string;
      linkedItineraryName?: string;
      description?: string;
      color?: string;
    }
  ): SavingsGoal => {
    const goal: SavingsGoal = {
      id: generateId(),
      name: data.name,
      description: data.description,
      targetAmount: data.targetAmount,
      currentAmount: 0,
      currency: data.currency || 'USD',
      targetDate: data.targetDate,
      linkedItineraryId: data.linkedItineraryId,
      linkedItineraryName: data.linkedItineraryName,
      percentComplete: 0,
      remainingAmount: data.targetAmount,
      contributions: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      color: data.color,
    };
    
    // Calculate suggested weekly amount if target date provided
    if (data.targetDate) {
      const weeksRemaining = Math.ceil(
        (new Date(data.targetDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)
      );
      goal.weeksRemaining = weeksRemaining;
      goal.suggestedWeeklyAmount = weeksRemaining > 0 
        ? Math.ceil(data.targetAmount / weeksRemaining) 
        : data.targetAmount;
    }
    
    setGoals(prev => [...prev, goal]);
    return goal;
  }, []);

  const addContribution = useCallback((
    goalId: string,
    amount: number,
    note?: string,
    source: 'manual' | 'automatic' | 'roundup' = 'manual'
  ) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id !== goalId) return goal;
      
      const contribution: SavingsContribution = {
        id: generateId(),
        amount,
        date: new Date().toISOString(),
        note,
        source,
      };
      
      const newCurrent = goal.currentAmount + amount;
      const newRemaining = Math.max(0, goal.targetAmount - newCurrent);
      const newPercent = Math.min(100, (newCurrent / goal.targetAmount) * 100);
      
      const isComplete = newCurrent >= goal.targetAmount;
      
      return {
        ...goal,
        currentAmount: newCurrent,
        remainingAmount: newRemaining,
        percentComplete: newPercent,
        contributions: [...goal.contributions, contribution],
        status: isComplete ? 'completed' : goal.status,
        completedAt: isComplete ? new Date().toISOString() : undefined,
      };
    }));
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    setGoals(prev => prev.map(goal => 
      goal.id === id ? { ...goal, ...updates } : goal
    ));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this savings goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setGoals(prev => prev.filter(g => g.id !== id)),
        },
      ]
    );
  }, []);

  const activeGoals = useMemo(() => 
    goals.filter(g => g.status === 'active'), [goals]);
  
  const completedGoals = useMemo(() => 
    goals.filter(g => g.status === 'completed'), [goals]);

  const totalSaved = useMemo(() => 
    goals.reduce((sum, g) => sum + g.currentAmount, 0), [goals]);

  return {
    goals,
    activeGoals,
    completedGoals,
    totalSaved,
    createGoal,
    addContribution,
    updateGoal,
    deleteGoal,
  };
}

export default useExpenseTracker;
