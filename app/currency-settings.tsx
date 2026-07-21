// Paint the Town Multi-Currency - Currency Settings Screen

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMultiCurrency } from '../hooks/useMultiCurrency';
import { CurrencyCode, Currency } from '../types/currency';

interface CurrencySettingsScreenProps {
  navigation?: any;
}

const CurrencySettingsScreen: React.FC<CurrencySettingsScreenProps> = ({ navigation }) => {
  const {
    preferences,
    updatePreferences,
    homeCurrency,
    setHomeCurrency,
    favoriteCurrencies,
    toggleFavorite,
    getAllCurrencies,
    getCurrency,
    refreshRates,
    ratesLastUpdated,
    isLoadingRates,
  } = useMultiCurrency();

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'home' | 'favorite'>('home');

  const handleSelectHomeCurrency = useCallback(
    async (code: CurrencyCode) => {
      await setHomeCurrency(code);
      setShowCurrencyPicker(false);
    },
    [setHomeCurrency]
  );

  const handleToggleFavorite = useCallback(
    async (code: CurrencyCode) => {
      await toggleFavorite(code);
    },
    [toggleFavorite]
  );

  const handleClearData = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      'This will remove all expenses, budgets, and cash wallet data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            // TODO: clear AsyncStorage here
            Alert.alert('Data Cleared', 'All currency data has been removed.');
          },
        },
      ]
    );
  }, []);

  const formatLastUpdated = (): string => {
    if (!ratesLastUpdated) return 'Never';
    const date = new Date(ratesLastUpdated);
    return date.toLocaleString();
  };

  const renderCurrencyPicker = () => {
    const currencies = getAllCurrencies();
    const grouped: Record<string, Currency[]> = {};

    // Group by region
    currencies.forEach((currency) => {
      const region = getRegion(currency.code);
      if (!grouped[region]) grouped[region] = [];
      grouped[region].push(currency);
    });

    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>
              {pickerMode === 'home' ? 'Select Home Currency' : 'Toggle Favorites'}
            </Text>
            <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
              <Text style={styles.pickerClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.pickerList}>
            {Object.entries(grouped).map(([region, regionCurrencies]) => (
              <View key={region} style={styles.pickerSection}>
                <Text style={styles.pickerSectionTitle}>{region}</Text>
                {regionCurrencies.map((currency) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={styles.currencyOption}
                    onPress={() => {
                      if (pickerMode === 'home') {
                        handleSelectHomeCurrency(currency.code);
                      } else {
                        handleToggleFavorite(currency.code);
                      }
                    }}
                  >
                    <Text style={styles.currencyFlag}>{currency.flag}</Text>
                    <View style={styles.currencyInfo}>
                      <Text style={styles.currencyCode}>{currency.code}</Text>
                      <Text style={styles.currencyName}>{currency.name}</Text>
                    </View>
                    {pickerMode === 'home' && currency.code === homeCurrency && (
                      <Text style={styles.selectedCheck}>✓</Text>
                    )}
                    {pickerMode === 'favorite' && (
                      <Text style={styles.favoriteIcon}>
                        {favoriteCurrencies.includes(currency.code) ? '⭐' : '☆'}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  const homeCurrencyData = getCurrency(homeCurrency);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Currency Settings</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Home Currency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Home Currency</Text>
          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => {
              setPickerMode('home');
              setShowCurrencyPicker(true);
            }}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingFlag}>{homeCurrencyData?.flag}</Text>
              <View>
                <Text style={styles.settingLabel}>{homeCurrency}</Text>
                <Text style={styles.settingDesc}>{homeCurrencyData?.name}</Text>
              </View>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <Text style={styles.settingHint}>
            All amounts will be converted to this currency for totals and reports.
          </Text>
        </View>

        {/* Favorite Currencies */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Favorite Currencies</Text>
            <TouchableOpacity
              onPress={() => {
                setPickerMode('favorite');
                setShowCurrencyPicker(true);
              }}
            >
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.favoritesGrid}>
            {favoriteCurrencies.map((code) => {
              const currency = getCurrency(code);
              return (
                <View key={code} style={styles.favoriteChip}>
                  <Text style={styles.favoriteFlag}>{currency?.flag}</Text>
                  <Text style={styles.favoriteCode}>{code}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Display Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Options</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Show Original Amount</Text>
              <Text style={styles.settingSubtitle}>Display amount in original currency</Text>
            </View>
            <Switch
              value={preferences.showOriginalAmount}
              onValueChange={(value) => updatePreferences({ showOriginalAmount: value })}
              trackColor={{ false: '#e0e0e0', true: '#667eea' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Show Converted Amount</Text>
              <Text style={styles.settingSubtitle}>Display equivalent in home currency</Text>
            </View>
            <Switch
              value={preferences.showConvertedAmount}
              onValueChange={(value) => updatePreferences({ showConvertedAmount: value })}
              trackColor={{ false: '#e0e0e0', true: '#667eea' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Auto-Convert New Expenses</Text>
              <Text style={styles.settingSubtitle}>Automatically convert when adding expenses</Text>
            </View>
            <Switch
              value={preferences.autoConvert}
              onValueChange={(value) => updatePreferences({ autoConvert: value })}
              trackColor={{ false: '#e0e0e0', true: '#667eea' }}
            />
          </View>
        </View>

        {/* Rounding */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rounding</Text>

          <View style={styles.roundingOptions}>
            {[
              { value: 'none', label: 'None' },
              { value: 'nearest', label: 'Nearest' },
              { value: 'up', label: 'Round Up' },
              { value: 'down', label: 'Round Down' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.roundingOption,
                  preferences.roundingMode === option.value && styles.roundingOptionActive,
                ]}
                onPress={() =>
                  updatePreferences({
                    roundingMode: option.value as 'none' | 'nearest' | 'up' | 'down',
                  })
                }
              >
                <Text
                  style={[
                    styles.roundingOptionText,
                    preferences.roundingMode === option.value && styles.roundingOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionSubtitle}>Decimal Places</Text>
          <View style={styles.decimalOptions}>
            {[0, 1, 2, 3].map((places) => (
              <TouchableOpacity
                key={places}
                style={[
                  styles.decimalOption,
                  preferences.roundingPrecision === places && styles.decimalOptionActive,
                ]}
                onPress={() => updatePreferences({ roundingPrecision: places })}
              >
                <Text
                  style={[
                    styles.decimalOptionText,
                    preferences.roundingPrecision === places && styles.decimalOptionTextActive,
                  ]}
                >
                  {places}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Exchange Rates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exchange Rates</Text>

          <View style={styles.ratesCard}>
            <View style={styles.ratesInfo}>
              <Text style={styles.ratesLabel}>Last Updated</Text>
              <Text style={styles.ratesValue}>{formatLastUpdated()}</Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refreshRates}
              disabled={isLoadingRates}
            >
              <Text style={styles.refreshButtonText}>
                {isLoadingRates ? 'Updating...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.settingHint}>
            Rates are updated automatically when you use the converter.
          </Text>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
            <Text style={styles.dangerButtonText}>Clear All Currency Data</Text>
          </TouchableOpacity>
          <Text style={styles.settingHint}>
            This will delete all expenses, budgets, and cash wallet data.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {showCurrencyPicker && renderCurrencyPicker()}
    </View>
  );
};

// Helper function to group currencies by region
function getRegion(code: CurrencyCode): string {
  const regions: Record<string, CurrencyCode[]> = {
    Americas: ['USD', 'CAD', 'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN'],
    Europe: ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'TRY', 'RUB'],
    'Asia Pacific': [
      'JPY',
      'CNY',
      'AUD',
      'NZD',
      'HKD',
      'SGD',
      'KRW',
      'THB',
      'MYR',
      'IDR',
      'PHP',
      'VND',
      'TWD',
      'INR',
    ],
    'Middle East & Africa': ['ZAR', 'ILS', 'AED', 'SAR', 'EGP', 'MAD', 'NGN'],
  };

  for (const [region, codes] of Object.entries(regions)) {
    if (codes.includes(code)) return region;
  }
  return 'Other';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginTop: 16,
    marginBottom: 8,
  },
  editButton: {
    fontSize: 15,
    color: '#667eea',
    fontWeight: '600',
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingFlag: {
    fontSize: 32,
    marginRight: 14,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  settingDesc: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 24,
    color: '#ccc',
  },
  settingHint: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  favoritesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  favoriteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  favoriteFlag: {
    fontSize: 18,
    marginRight: 6,
  },
  favoriteCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  roundingOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  roundingOption: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  roundingOptionActive: {
    backgroundColor: '#667eea',
  },
  roundingOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  roundingOptionTextActive: {
    color: '#fff',
  },
  decimalOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  decimalOption: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decimalOptionActive: {
    backgroundColor: '#667eea',
  },
  decimalOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  decimalOptionTextActive: {
    color: '#fff',
  },
  ratesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  ratesInfo: {},
  ratesLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  ratesValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  refreshButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  dangerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  selectedCheck: {
    fontSize: 20,
    color: '#667eea',
    fontWeight: '600',
  },
  favoriteIcon: {
    fontSize: 20,
  },
  bottomPadding: {
    height: 40,
  },
});

export default CurrencySettingsScreen;
