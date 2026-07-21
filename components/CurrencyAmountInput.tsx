// Paint the Town Multi-Currency - Currency Amount Input Component

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { CurrencyCode, Currency, Money } from '../types/currency';
import { CURRENCIES } from '../mocks/mockCurrencyData';

interface CurrencyAmountInputProps {
  value: Money;
  onChange: (value: Money) => void;
  label?: string;
  placeholder?: string;
  showConversion?: boolean;
  convertTo?: CurrencyCode;
  convertedAmount?: number;
  allowedCurrencies?: CurrencyCode[];
  recentCurrencies?: CurrencyCode[];
  favoriteCurrencies?: CurrencyCode[];
  disabled?: boolean;
  error?: string;
  style?: object;
}

const CurrencyAmountInput: React.FC<CurrencyAmountInputProps> = ({
  value,
  onChange,
  label,
  placeholder = '0.00',
  showConversion = false,
  convertTo,
  convertedAmount,
  allowedCurrencies,
  recentCurrencies = [],
  favoriteCurrencies = [],
  disabled = false,
  error,
  style,
}) => {
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [inputText, setInputText] = useState(value.amount ? value.amount.toString() : '');

  const currentCurrency = useMemo(() => {
    return CURRENCIES.find(c => c.code === value.currency);
  }, [value.currency]);

  const availableCurrencies = useMemo(() => {
    if (allowedCurrencies) {
      return CURRENCIES.filter(c => allowedCurrencies.includes(c.code));
    }
    return CURRENCIES;
  }, [allowedCurrencies]);

  const handleAmountChange = useCallback((text: string) => {
    // Allow only numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    let formatted = parts[0];
    if (parts.length > 1) {
      formatted += '.' + parts[1].slice(0, currentCurrency?.decimalPlaces || 2);
    }
    
    setInputText(formatted);
    
    const numValue = parseFloat(formatted) || 0;
    onChange({ ...value, amount: numValue });
  }, [value, onChange, currentCurrency]);

  const handleCurrencySelect = useCallback((code: CurrencyCode) => {
    onChange({ ...value, currency: code });
    setShowCurrencyPicker(false);
  }, [value, onChange]);

  const formatAmount = (amount: number, currency: CurrencyCode): string => {
    const curr = CURRENCIES.find(c => c.code === currency);
    if (!curr) return `${amount} ${currency}`;
    
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: curr.decimalPlaces,
      maximumFractionDigits: curr.decimalPlaces,
    });
    
    return curr.symbolPosition === 'before'
      ? `${curr.symbol}${formatted}`
      : `${formatted} ${curr.symbol}`;
  };

  const renderCurrencyPicker = () => (
    <Modal
      visible={showCurrencyPicker}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCurrencyPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Currency</Text>
            <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
              <Text style={styles.pickerClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.pickerList}>
            {/* Favorites */}
            {favoriteCurrencies.length > 0 && (
              <View style={styles.pickerSection}>
                <Text style={styles.pickerSectionTitle}>⭐ Favorites</Text>
                {favoriteCurrencies.map(code => {
                  const currency = CURRENCIES.find(c => c.code === code);
                  if (!currency) return null;
                  return (
                    <TouchableOpacity
                      key={code}
                      style={[
                        styles.currencyOption,
                        value.currency === code && styles.currencyOptionSelected,
                      ]}
                      onPress={() => handleCurrencySelect(code)}
                    >
                      <Text style={styles.currencyFlag}>{currency.flag}</Text>
                      <View style={styles.currencyInfo}>
                        <Text style={styles.currencyCode}>{code}</Text>
                        <Text style={styles.currencyName}>{currency.name}</Text>
                      </View>
                      {value.currency === code && (
                        <Text style={styles.selectedCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Recent */}
            {recentCurrencies.length > 0 && (
              <View style={styles.pickerSection}>
                <Text style={styles.pickerSectionTitle}>🕐 Recent</Text>
                {recentCurrencies.filter(c => !favoriteCurrencies.includes(c)).slice(0, 5).map(code => {
                  const currency = CURRENCIES.find(c => c.code === code);
                  if (!currency) return null;
                  return (
                    <TouchableOpacity
                      key={code}
                      style={[
                        styles.currencyOption,
                        value.currency === code && styles.currencyOptionSelected,
                      ]}
                      onPress={() => handleCurrencySelect(code)}
                    >
                      <Text style={styles.currencyFlag}>{currency.flag}</Text>
                      <View style={styles.currencyInfo}>
                        <Text style={styles.currencyCode}>{code}</Text>
                        <Text style={styles.currencyName}>{currency.name}</Text>
                      </View>
                      {value.currency === code && (
                        <Text style={styles.selectedCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* All currencies */}
            <View style={styles.pickerSection}>
              <Text style={styles.pickerSectionTitle}>All Currencies</Text>
              {availableCurrencies.map(currency => (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.currencyOption,
                    value.currency === currency.code && styles.currencyOptionSelected,
                  ]}
                  onPress={() => handleCurrencySelect(currency.code)}
                >
                  <Text style={styles.currencyFlag}>{currency.flag}</Text>
                  <View style={styles.currencyInfo}>
                    <Text style={styles.currencyCode}>{currency.code}</Text>
                    <Text style={styles.currencyName}>{currency.name}</Text>
                  </View>
                  {value.currency === currency.code && (
                    <Text style={styles.selectedCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        disabled && styles.inputContainerDisabled,
        error && styles.inputContainerError,
      ]}>
        {/* Currency Selector */}
        <TouchableOpacity
          style={styles.currencySelector}
          onPress={() => !disabled && setShowCurrencyPicker(true)}
          disabled={disabled}
        >
          <Text style={styles.currencySelectorFlag}>{currentCurrency?.flag}</Text>
          <Text style={styles.currencySelectorCode}>{value.currency}</Text>
          <Text style={styles.currencySelectorArrow}>▼</Text>
        </TouchableOpacity>

        {/* Amount Input */}
        <TextInput
          style={styles.amountInput}
          value={inputText}
          onChangeText={handleAmountChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType="decimal-pad"
          editable={!disabled}
        />
      </View>

      {/* Conversion Display */}
      {showConversion && convertTo && convertedAmount !== undefined && (
        <View style={styles.conversionRow}>
          <Text style={styles.conversionText}>
            ≈ {formatAmount(convertedAmount, convertTo)}
          </Text>
        </View>
      )}

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Currency Picker Modal */}
      {renderCurrencyPicker()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputContainerDisabled: {
    opacity: 0.6,
  },
  inputContainerError: {
    borderColor: '#FF3B30',
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  currencySelectorFlag: {
    fontSize: 20,
    marginRight: 6,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 14,
    textAlign: 'right',
  },
  conversionRow: {
    marginTop: 6,
    alignItems: 'flex-end',
  },
  conversionText: {
    fontSize: 14,
    color: '#888',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
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
    marginBottom: 8,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  currencyOptionSelected: {
    backgroundColor: '#F5F3FF',
  },
  currencyFlag: {
    fontSize: 24,
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
  selectedCheck: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: '600',
  },
});

export default CurrencyAmountInput;
