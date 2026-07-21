/* eslint-disable max-lines -- tracked in #1 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeftRight,
  ChevronDown,
  Search,
  X,
  Clock,
  Calculator,
  Wifi,
  WifiOff,
  TrendingUp,
  RefreshCw,
  Plus,
  Trash2,
  Star,
} from 'lucide-react-native';
import colors from '@/constants/colors';

const { width } = Dimensions.get('window');

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

interface ExchangeRate {
  [key: string]: number;
}

interface ConversionHistory {
  id: string;
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  timestamp: number;
}

interface SpendingItem {
  id: string;
  description: string;
  amount: number;
  currency: string;
  convertedAmount: number;
}

const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿' },
];

const MOCK_RATES: ExchangeRate = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  AUD: 1.53,
  CAD: 1.36,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.12,
  MXN: 17.15,
  BRL: 4.97,
  KRW: 1328.5,
  SGD: 1.34,
  HKD: 7.82,
  NOK: 10.62,
  SEK: 10.42,
  DKK: 6.87,
  NZD: 1.64,
  ZAR: 18.65,
  THB: 35.23,
  AED: 3.67,
  PHP: 55.89,
  IDR: 15678.5,
  MYR: 4.72,
  VND: 24365.0,
  TRY: 32.15,
  PLN: 3.98,
  CZK: 22.75,
};

const STORAGE_KEYS = {
  RATES: 'currency_rates',
  LAST_UPDATED: 'rates_last_updated',
  HISTORY: 'conversion_history',
  FAVORITES: 'favorite_currencies',
  SPENDING: 'spending_items',
};

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function CurrencyConverterScreen() {
  const router = useRouter();
  const [fromCurrency, setFromCurrency] = useState<Currency>(CURRENCIES[0]);
  const [toCurrency, setToCurrency] = useState<Currency>(CURRENCIES[1]);
  const [amount, setAmount] = useState('1');
  const [rates, setRates] = useState<ExchangeRate>(MOCK_RATES);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState<'from' | 'to' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<ConversionHistory[]>([]);
  const [favorites, setFavorites] = useState<string[]>(['USD', 'EUR', 'GBP', 'JPY']);
  const [activeTab, setActiveTab] = useState<'converter' | 'calculator'>('converter');
  const [spendingItems, setSpendingItems] = useState<SpendingItem[]>([]);
  const [newSpendingDesc, setNewSpendingDesc] = useState('');
  const [newSpendingAmount, setNewSpendingAmount] = useState('');
  const [homeCurrency, setHomeCurrency] = useState<Currency>(CURRENCIES[0]);

  useEffect(() => {
    loadStoredData();
    fetchRates();
  }, []);

  const loadStoredData = async () => {
    try {
      const [storedRates, storedLastUpdated, storedHistory, storedFavorites, storedSpending] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.RATES),
          AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATED),
          AsyncStorage.getItem(STORAGE_KEYS.HISTORY),
          AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
          AsyncStorage.getItem(STORAGE_KEYS.SPENDING),
        ]);

      if (storedRates) {
        setRates(JSON.parse(storedRates));
      }
      if (storedLastUpdated) {
        setLastUpdated(new Date(storedLastUpdated));
      }
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
      if (storedSpending) {
        setSpendingItems(JSON.parse(storedSpending));
      }
    } catch (error) {
      console.log('Error loading stored data:', error);
    }
  };

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const fluctuatedRates = { ...MOCK_RATES };
      Object.keys(fluctuatedRates).forEach((key) => {
        if (key !== 'USD') {
          const fluctuation = 1 + (Math.random() - 0.5) * 0.02;
          fluctuatedRates[key] = MOCK_RATES[key] * fluctuation;
        }
      });

      setRates(fluctuatedRates);
      setLastUpdated(new Date());
      setIsOnline(true);

      await AsyncStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(fluctuatedRates));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
    } catch (error) {
      console.log('Error fetching rates, using offline mode:', error);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  const convertAmount = useCallback(
    (value: number, from: string, to: string): number => {
      if (from === to) return value;
      const fromRate = rates[from] || 1;
      const toRate = rates[to] || 1;
      return (value / fromRate) * toRate;
    },
    [rates]
  );

  const convertedAmount = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    return convertAmount(numAmount, fromCurrency.code, toCurrency.code);
  }, [amount, fromCurrency.code, toCurrency.code, convertAmount]);

  const exchangeRate = useMemo(() => {
    return convertAmount(1, fromCurrency.code, toCurrency.code);
  }, [fromCurrency.code, toCurrency.code, convertAmount]);

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const saveToHistory = useCallback(async () => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) return;

    const newEntry: ConversionHistory = {
      id: Date.now().toString(),
      from: fromCurrency.code,
      to: toCurrency.code,
      amount: numAmount,
      result: convertedAmount,
      rate: exchangeRate,
      timestamp: Date.now(),
    };

    const updatedHistory = [newEntry, ...history.slice(0, 19)];
    setHistory(updatedHistory);
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
  }, [amount, fromCurrency.code, toCurrency.code, convertedAmount, exchangeRate, history]);

  const toggleFavorite = async (code: string) => {
    const updated = favorites.includes(code)
      ? favorites.filter((f) => f !== code)
      : [...favorites, code];
    setFavorites(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
  };

  const filteredCurrencies = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return CURRENCIES.filter(
      (c) => c.code.toLowerCase().includes(query) || c.name.toLowerCase().includes(query)
    ).sort((a, b) => {
      const aFav = favorites.includes(a.code);
      const bFav = favorites.includes(b.code);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  }, [searchQuery, favorites]);

  const selectCurrency = (currency: Currency) => {
    if (showCurrencyPicker === 'from') {
      setFromCurrency(currency);
    } else {
      setToCurrency(currency);
    }
    setShowCurrencyPicker(null);
    setSearchQuery('');
  };

  const addSpendingItem = async () => {
    if (!newSpendingDesc.trim() || !newSpendingAmount.trim()) return;

    const amt = parseFloat(newSpendingAmount) || 0;
    const converted = convertAmount(amt, toCurrency.code, homeCurrency.code);

    const newItem: SpendingItem = {
      id: Date.now().toString(),
      description: newSpendingDesc.trim(),
      amount: amt,
      currency: toCurrency.code,
      convertedAmount: converted,
    };

    const updated = [...spendingItems, newItem];
    setSpendingItems(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SPENDING, JSON.stringify(updated));
    setNewSpendingDesc('');
    setNewSpendingAmount('');
  };

  const removeSpendingItem = async (id: string) => {
    const updated = spendingItems.filter((item) => item.id !== id);
    setSpendingItems(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SPENDING, JSON.stringify(updated));
  };

  const clearSpending = async () => {
    setSpendingItems([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.SPENDING);
  };

  const totalSpending = useMemo(() => {
    return spendingItems.reduce((sum, item) => sum + item.convertedAmount, 0);
  }, [spendingItems]);

  const formatNumber = (num: number, decimals = 2): string => {
    if (num >= 1000000) {
      return num.toLocaleString('en-US', { maximumFractionDigits: decimals });
    }
    return num.toFixed(decimals);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getCurrencyByCode = (code: string): Currency => {
    return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
  };

  const renderCurrencyPicker = () => (
    <Modal
      visible={showCurrencyPicker !== null}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Currency</Text>
          <Pressable
            style={styles.closeButton}
            onPress={() => {
              setShowCurrencyPicker(null);
              setSearchQuery('');
            }}
          >
            <X size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search currency..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        <FlatList
          data={filteredCurrencies}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.currencyItem,
                (showCurrencyPicker === 'from' ? fromCurrency : toCurrency).code === item.code &&
                  styles.currencyItemSelected,
              ]}
              onPress={() => selectCurrency(item)}
            >
              <Text style={styles.currencyFlag}>{item.flag}</Text>
              <View style={styles.currencyInfo}>
                <Text style={styles.currencyCode}>{item.code}</Text>
                <Text style={styles.currencyName}>{item.name}</Text>
              </View>
              <Pressable style={styles.favoriteButton} onPress={() => toggleFavorite(item.code)}>
                <Star
                  size={20}
                  color={favorites.includes(item.code) ? colors.warning : colors.textTertiary}
                  fill={favorites.includes(item.code) ? colors.warning : 'transparent'}
                />
              </Pressable>
            </Pressable>
          )}
          contentContainerStyle={styles.currencyList}
        />
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Currency Converter',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.textLight,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            {isOnline ? (
              <Wifi size={16} color={colors.success} />
            ) : (
              <WifiOff size={16} color={colors.warning} />
            )}
            <Text
              style={[styles.statusText, { color: isOnline ? colors.success : colors.warning }]}
            >
              {isOnline ? 'Live Rates' : 'Offline Mode'}
            </Text>
          </View>
          {lastUpdated && (
            <View style={styles.statusItem}>
              <Clock size={14} color={colors.textTertiary} />
              <Text style={styles.statusTextSmall}>Updated {formatTime(lastUpdated)}</Text>
            </View>
          )}
          <Pressable style={styles.refreshButton} onPress={fetchRates} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <RefreshCw size={18} color={colors.primary} />
            )}
          </Pressable>
        </View>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'converter' && styles.tabActive]}
            onPress={() => setActiveTab('converter')}
          >
            <ArrowLeftRight
              size={18}
              color={activeTab === 'converter' ? colors.primary : colors.textTertiary}
            />
            <Text style={[styles.tabText, activeTab === 'converter' && styles.tabTextActive]}>
              Converter
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'calculator' && styles.tabActive]}
            onPress={() => setActiveTab('calculator')}
          >
            <Calculator
              size={18}
              color={activeTab === 'calculator' ? colors.primary : colors.textTertiary}
            />
            <Text style={[styles.tabText, activeTab === 'calculator' && styles.tabTextActive]}>
              Spending
            </Text>
          </Pressable>
        </View>

        {activeTab === 'converter' ? (
          <View style={styles.converterContent}>
            <View style={styles.converterCard}>
              <View style={styles.currencyRow}>
                <Text style={styles.currencyLabel}>From</Text>
                <Pressable
                  style={styles.currencySelector}
                  onPress={() => setShowCurrencyPicker('from')}
                >
                  <Text style={styles.currencySelectorFlag}>{fromCurrency.flag}</Text>
                  <Text style={styles.currencySelectorCode}>{fromCurrency.code}</Text>
                  <ChevronDown size={18} color={colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>{fromCurrency.symbol}</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  onBlur={saveToHistory}
                />
              </View>

              <Pressable style={styles.swapButton} onPress={swapCurrencies}>
                <ArrowLeftRight size={22} color={colors.textLight} />
              </Pressable>

              <View style={styles.currencyRow}>
                <Text style={styles.currencyLabel}>To</Text>
                <Pressable
                  style={styles.currencySelector}
                  onPress={() => setShowCurrencyPicker('to')}
                >
                  <Text style={styles.currencySelectorFlag}>{toCurrency.flag}</Text>
                  <Text style={styles.currencySelectorCode}>{toCurrency.code}</Text>
                  <ChevronDown size={18} color={colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.resultContainer}>
                <Text style={styles.currencySymbolLarge}>{toCurrency.symbol}</Text>
                <Text style={styles.resultAmount}>{formatNumber(convertedAmount)}</Text>
              </View>

              <View style={styles.rateInfo}>
                <TrendingUp size={14} color={colors.textSecondary} />
                <Text style={styles.rateText}>
                  1 {fromCurrency.code} = {formatNumber(exchangeRate, 4)} {toCurrency.code}
                </Text>
              </View>
            </View>

            {history.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>Recent Conversions</Text>
                {history.slice(0, 5).map((item) => {
                  const from = getCurrencyByCode(item.from);
                  const to = getCurrencyByCode(item.to);
                  return (
                    <Pressable
                      key={item.id}
                      style={styles.historyItem}
                      onPress={() => {
                        setFromCurrency(from);
                        setToCurrency(to);
                        setAmount(item.amount.toString());
                      }}
                    >
                      <View style={styles.historyFlags}>
                        <Text style={styles.historyFlag}>{from.flag}</Text>
                        <Text style={styles.historyArrow}>→</Text>
                        <Text style={styles.historyFlag}>{to.flag}</Text>
                      </View>
                      <View style={styles.historyDetails}>
                        <Text style={styles.historyAmount}>
                          {from.symbol}
                          {formatNumber(item.amount)} → {to.symbol}
                          {formatNumber(item.result)}
                        </Text>
                        <Text style={styles.historyTime}>
                          {new Date(item.timestamp).toLocaleDateString()}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.quickConvert}>
              <Text style={styles.sectionTitle}>Quick Convert from {fromCurrency.code}</Text>
              <View style={styles.quickConvertGrid}>
                {[10, 50, 100, 500].map((val) => (
                  <Pressable
                    key={val}
                    style={styles.quickConvertItem}
                    onPress={() => setAmount(val.toString())}
                  >
                    <Text style={styles.quickConvertFrom}>
                      {fromCurrency.symbol}
                      {val}
                    </Text>
                    <Text style={styles.quickConvertTo}>
                      {toCurrency.symbol}
                      {formatNumber(convertAmount(val, fromCurrency.code, toCurrency.code))}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.calculatorContent}>
            <View style={styles.homeCurrencyCard}>
              <Text style={styles.homeCurrencyLabel}>Your Home Currency</Text>
              <Pressable
                style={styles.homeCurrencySelector}
                onPress={() => {
                  setShowCurrencyPicker('from');
                }}
              >
                <Text style={styles.homeCurrencyFlag}>{homeCurrency.flag}</Text>
                <Text style={styles.homeCurrencyCode}>{homeCurrency.code}</Text>
                <ChevronDown size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.addSpendingCard}>
              <Text style={styles.cardTitle}>Add Expense</Text>
              <View style={styles.spendingInputRow}>
                <TextInput
                  style={styles.spendingDescInput}
                  placeholder="Description (e.g., Dinner)"
                  placeholderTextColor={colors.textTertiary}
                  value={newSpendingDesc}
                  onChangeText={setNewSpendingDesc}
                />
              </View>
              <View style={styles.spendingAmountRow}>
                <Pressable
                  style={styles.spendingCurrencyPicker}
                  onPress={() => setShowCurrencyPicker('to')}
                >
                  <Text style={styles.spendingCurrencyFlag}>{toCurrency.flag}</Text>
                  <Text style={styles.spendingCurrencyCode}>{toCurrency.code}</Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </Pressable>
                <TextInput
                  style={styles.spendingAmountInput}
                  placeholder="Amount"
                  placeholderTextColor={colors.textTertiary}
                  value={newSpendingAmount}
                  onChangeText={setNewSpendingAmount}
                  keyboardType="decimal-pad"
                />
                <Pressable style={styles.addSpendingButton} onPress={addSpendingItem}>
                  <Plus size={20} color={colors.textLight} />
                </Pressable>
              </View>
            </View>

            <View style={styles.spendingListCard}>
              <View style={styles.spendingListHeader}>
                <Text style={styles.cardTitle}>Your Spending</Text>
                {spendingItems.length > 0 && (
                  <Pressable onPress={clearSpending}>
                    <Text style={styles.clearText}>Clear All</Text>
                  </Pressable>
                )}
              </View>

              {spendingItems.length === 0 ? (
                <View style={styles.emptySpending}>
                  <Calculator size={40} color={colors.textTertiary} />
                  <Text style={styles.emptyText}>No expenses added yet</Text>
                  <Text style={styles.emptySubtext}>
                    Add your spending to track your trip budget
                  </Text>
                </View>
              ) : (
                <View>
                  {spendingItems.map((item) => {
                    const currency = getCurrencyByCode(item.currency);
                    return (
                      <View key={item.id} style={styles.spendingItem}>
                        <View style={styles.spendingItemInfo}>
                          <Text style={styles.spendingItemDesc}>{item.description}</Text>
                          <Text style={styles.spendingItemAmount}>
                            {currency.flag} {currency.symbol}
                            {formatNumber(item.amount)}
                          </Text>
                        </View>
                        <View style={styles.spendingItemConverted}>
                          <Text style={styles.spendingItemConvertedAmount}>
                            {homeCurrency.symbol}
                            {formatNumber(item.convertedAmount)}
                          </Text>
                          <Pressable
                            style={styles.removeButton}
                            onPress={() => removeSpendingItem(item.id)}
                          >
                            <Trash2 size={16} color={colors.error} />
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {spendingItems.length > 0 && (
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total Spending</Text>
                <Text style={styles.totalAmount}>
                  {homeCurrency.symbol}
                  {formatNumber(totalSpending)}
                </Text>
                <Text style={styles.totalSubtext}>in {homeCurrency.name}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {renderCurrencyPicker()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusTextSmall: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  refreshButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  converterContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  converterCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currencyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  currencySelectorFlag: {
    fontSize: 20,
  },
  currencySelectorCode: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  swapButton: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 12,
  },
  currencySymbolLarge: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 8,
  },
  resultAmount: {
    flex: 1,
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
  },
  rateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  rateText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  historySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  historyFlags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyFlag: {
    fontSize: 20,
  },
  historyArrow: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  historyDetails: {
    flex: 1,
    marginLeft: 14,
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  historyTime: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  quickConvert: {
    marginBottom: 20,
  },
  quickConvertGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickConvertItem: {
    width: (width - 44) / 2,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
  },
  quickConvertFrom: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  quickConvertTo: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  calculatorContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  homeCurrencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  homeCurrencyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  homeCurrencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  homeCurrencyFlag: {
    fontSize: 20,
  },
  homeCurrencyCode: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  addSpendingCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  spendingInputRow: {
    marginBottom: 12,
  },
  spendingDescInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  spendingAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spendingCurrencyPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  spendingCurrencyFlag: {
    fontSize: 18,
  },
  spendingCurrencyCode: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  spendingAmountInput: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  addSpendingButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spendingListCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  spendingListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  emptySpending: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  spendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  spendingItemInfo: {
    flex: 1,
  },
  spendingItemDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  spendingItemAmount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  spendingItemConverted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spendingItemConvertedAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  removeButton: {
    padding: 6,
  },
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.accent,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textLight,
  },
  totalSubtext: {
    fontSize: 14,
    color: colors.accent,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  currencyList: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  currencyItemSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  currencyFlag: {
    fontSize: 28,
    marginRight: 14,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  currencyName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  favoriteButton: {
    padding: 8,
  },
});
