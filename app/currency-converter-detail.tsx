// Paint the Town Multi-Currency - Currency Converter Screen

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMultiCurrency } from '../hooks/useMultiCurrency';
import { CurrencyCode, Currency } from '../types/currency';

interface CurrencyConverterScreenProps {
  navigation?: any;
}

const CurrencyConverterScreen: React.FC<CurrencyConverterScreenProps> = ({ navigation }) => {
  const {
    convert,
    format,
    getCurrency,
    getPopularCurrencies,
    favoriteCurrencies,
    recentCurrencies,
    quickConversions,
    addQuickConversion,
    refreshRates,
    ratesLastUpdated,
    isLoadingRates,
    homeCurrency,
  } = useMultiCurrency();

  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>(homeCurrency);
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('EUR');
  const [amount, setAmount] = useState<string>('100');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const fromCurrencyData = getCurrency(fromCurrency);
  const toCurrencyData = getCurrency(toCurrency);

  const conversionResult = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    return convert(numAmount, fromCurrency, toCurrency);
  }, [amount, fromCurrency, toCurrency, convert]);

  const handleSwapCurrencies = useCallback(() => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  }, [fromCurrency, toCurrency]);

  const handleQuickAmount = useCallback((value: number) => {
    setAmount(value.toString());
  }, []);

  const handleSelectCurrency = useCallback(
    (code: CurrencyCode, isFrom: boolean) => {
      if (isFrom) {
        setFromCurrency(code);
        setShowFromPicker(false);
      } else {
        setToCurrency(code);
        setShowToPicker(false);
      }
      addQuickConversion(isFrom ? code : fromCurrency, isFrom ? toCurrency : code);
    },
    [fromCurrency, toCurrency, addQuickConversion]
  );

  const quickAmounts = [10, 20, 50, 100, 200, 500, 1000];

  const formatLastUpdated = (): string => {
    if (!ratesLastUpdated) return 'Never';
    const date = new Date(ratesLastUpdated);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const renderCurrencyPicker = (isFrom: boolean) => {
    const popular = getPopularCurrencies();
    const favorites = favoriteCurrencies
      .map((code) => getCurrency(code))
      .filter(Boolean) as Currency[];
    const recent = recentCurrencies.map((code) => getCurrency(code)).filter(Boolean) as Currency[];

    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select {isFrom ? 'From' : 'To'} Currency</Text>
            <TouchableOpacity
              onPress={() => (isFrom ? setShowFromPicker(false) : setShowToPicker(false))}
            >
              <Text style={styles.pickerClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.pickerList}>
            {favorites.length > 0 && (
              <View style={styles.pickerSection}>
                <Text style={styles.pickerSectionTitle}>⭐ Favorites</Text>
                {favorites.map((currency) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={styles.currencyOption}
                    onPress={() => handleSelectCurrency(currency.code, isFrom)}
                  >
                    <Text style={styles.currencyFlag}>{currency.flag}</Text>
                    <View style={styles.currencyInfo}>
                      <Text style={styles.currencyCode}>{currency.code}</Text>
                      <Text style={styles.currencyName}>{currency.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {recent.length > 0 && (
              <View style={styles.pickerSection}>
                <Text style={styles.pickerSectionTitle}>🕐 Recent</Text>
                {recent.slice(0, 5).map((currency) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={styles.currencyOption}
                    onPress={() => handleSelectCurrency(currency.code, isFrom)}
                  >
                    <Text style={styles.currencyFlag}>{currency.flag}</Text>
                    <View style={styles.currencyInfo}>
                      <Text style={styles.currencyCode}>{currency.code}</Text>
                      <Text style={styles.currencyName}>{currency.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.pickerSection}>
              <Text style={styles.pickerSectionTitle}>🌍 Popular</Text>
              {popular.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={styles.currencyOption}
                  onPress={() => handleSelectCurrency(currency.code, isFrom)}
                >
                  <Text style={styles.currencyFlag}>{currency.flag}</Text>
                  <View style={styles.currencyInfo}>
                    <Text style={styles.currencyCode}>{currency.code}</Text>
                    <Text style={styles.currencyName}>{currency.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Currency Converter</Text>
          <View style={styles.ratesInfo}>
            <Text style={styles.ratesText}>Rates updated: {formatLastUpdated()}</Text>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={refreshRates}
              disabled={isLoadingRates}
            >
              {isLoadingRates ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.refreshBtnText}>↻</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Converter Card */}
        <View style={styles.converterCard}>
          {/* From Currency */}
          <TouchableOpacity style={styles.currencyRow} onPress={() => setShowFromPicker(true)}>
            <View style={styles.currencySelector}>
              <Text style={styles.currencySelectorFlag}>{fromCurrencyData?.flag}</Text>
              <Text style={styles.currencySelectorCode}>{fromCurrency}</Text>
              <Text style={styles.currencySelectorArrow}>▼</Text>
            </View>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#999"
            />
          </TouchableOpacity>

          {/* Swap Button */}
          <TouchableOpacity style={styles.swapButton} onPress={handleSwapCurrencies}>
            <Text style={styles.swapButtonText}>⇅</Text>
          </TouchableOpacity>

          {/* To Currency */}
          <TouchableOpacity style={styles.currencyRow} onPress={() => setShowToPicker(true)}>
            <View style={styles.currencySelector}>
              <Text style={styles.currencySelectorFlag}>{toCurrencyData?.flag}</Text>
              <Text style={styles.currencySelectorCode}>{toCurrency}</Text>
              <Text style={styles.currencySelectorArrow}>▼</Text>
            </View>
            <Text style={styles.convertedAmount}>
              {conversionResult
                ? format(conversionResult.convertedAmount, toCurrency, { showSymbol: false })
                : '0'}
            </Text>
          </TouchableOpacity>

          {/* Rate Info */}
          {conversionResult && (
            <View style={styles.rateInfoBox}>
              <Text style={styles.rateInfoText}>
                1 {fromCurrency} = {conversionResult.rate.toFixed(4)} {toCurrency}
              </Text>
              <Text style={styles.rateInfoInverse}>
                1 {toCurrency} = {(1 / conversionResult.rate).toFixed(4)} {fromCurrency}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Amounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Amounts</Text>
          <View style={styles.quickAmountsGrid}>
            {quickAmounts.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.quickAmountBtn,
                  parseFloat(amount) === value && styles.quickAmountBtnActive,
                ]}
                onPress={() => handleQuickAmount(value)}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    parseFloat(amount) === value && styles.quickAmountTextActive,
                  ]}
                >
                  {fromCurrencyData?.symbol}
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Conversions */}
        {quickConversions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Pairs</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickConversions.slice(0, 5).map((qc) => {
                const fromData = getCurrency(qc.from);
                const toData = getCurrency(qc.to);
                return (
                  <TouchableOpacity
                    key={qc.id}
                    style={styles.recentPairCard}
                    onPress={() => {
                      setFromCurrency(qc.from);
                      setToCurrency(qc.to);
                    }}
                  >
                    <View style={styles.recentPairFlags}>
                      <Text style={styles.recentPairFlag}>{fromData?.flag}</Text>
                      <Text style={styles.recentPairArrow}>→</Text>
                      <Text style={styles.recentPairFlag}>{toData?.flag}</Text>
                    </View>
                    <Text style={styles.recentPairCodes}>
                      {qc.from}/{qc.to}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Conversion Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conversion Table</Text>
          <View style={styles.tableCard}>
            {[1, 5, 10, 20, 50, 100, 500, 1000].map((value) => {
              const result = convert(value, fromCurrency, toCurrency);
              return (
                <View key={value} style={styles.tableRow}>
                  <Text style={styles.tableFrom}>{format(value, fromCurrency)}</Text>
                  <Text style={styles.tableEquals}>=</Text>
                  <Text style={styles.tableTo}>
                    {result ? format(result.convertedAmount, toCurrency) : '-'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Currency Pickers */}
      {showFromPicker && renderCurrencyPicker(true)}
      {showToPicker && renderCurrencyPicker(false)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  headerContent: {},
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  ratesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratesText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshBtnText: {
    fontSize: 18,
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  converterCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 16,
  },
  currencySelectorFlag: {
    fontSize: 24,
    marginRight: 8,
  },
  currencySelectorCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 4,
  },
  currencySelectorArrow: {
    fontSize: 10,
    color: '#888',
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'right',
  },
  convertedAmount: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#667eea',
    textAlign: 'right',
  },
  swapButton: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    elevation: 4,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  swapButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  rateInfoBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  rateInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  rateInfoInverse: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  quickAmountBtnActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  quickAmountTextActive: {
    color: '#fff',
  },
  recentPairCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  recentPairFlags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentPairFlag: {
    fontSize: 24,
  },
  recentPairArrow: {
    fontSize: 14,
    color: '#ccc',
    marginHorizontal: 8,
  },
  recentPairCodes: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  tableFrom: {
    flex: 1,
    fontSize: 15,
    color: '#666',
  },
  tableEquals: {
    width: 30,
    textAlign: 'center',
    fontSize: 14,
    color: '#ccc',
  },
  tableTo: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'right',
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pickerClose: {
    fontSize: 20,
    color: '#888',
  },
  pickerList: {
    padding: 16,
  },
  pickerSection: {
    marginBottom: 20,
  },
  pickerSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 12,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  currencyFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  currencyName: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  bottomPadding: {
    height: 40,
  },
});

export default CurrencyConverterScreen;
