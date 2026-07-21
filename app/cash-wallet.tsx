// Paint the Town Multi-Currency - Cash Wallet Screen

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMultiCurrency } from '../hooks/useMultiCurrency';
import { CurrencyCode, CashTransaction } from '../types/currency';

interface CashWalletScreenProps {
  navigation?: any;
}

// eslint-disable-next-line max-lines-per-function -- tracked in #1
const CashWalletScreen: React.FC<CashWalletScreenProps> = ({ navigation }) => {
  const {
    cashWallet,
    cashTotalInHomeCurrency,
    homeCurrency,
    format,
    getCurrency,
    withdrawCash,
    spendCash,
    exchangeCash,
    getCashBalance,
    recentCurrencies,
    getPopularCurrencies,
  } = useMultiCurrency();

  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'withdraw' | 'spend' | 'exchange'>('withdraw');
  const [formData, setFormData] = useState({
    currency: homeCurrency as CurrencyCode,
    amount: '',
    description: '',
    // For exchange
    toCurrency: 'EUR' as CurrencyCode,
    toAmount: '',
    fees: '',
  });

  const handleOpenModal = (type: 'withdraw' | 'spend' | 'exchange') => {
    setModalType(type);
    setFormData({
      currency: homeCurrency,
      amount: '',
      description: '',
      toCurrency: 'EUR',
      toAmount: '',
      fees: '',
    });
    setShowAddModal(true);
  };

  const handleSubmit = useCallback(async () => {
    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    try {
      if (modalType === 'withdraw') {
        await withdrawCash(
          formData.currency,
          amount,
          formData.description || 'Cash withdrawal',
          formData.fees ? parseFloat(formData.fees) : undefined
        );
      } else if (modalType === 'spend') {
        const balance = getCashBalance(formData.currency);
        if (amount > balance) {
          Alert.alert(
            'Insufficient Cash',
            `You only have ${format(balance, formData.currency)} in ${formData.currency}`
          );
          return;
        }
        await spendCash(formData.currency, amount, formData.description || 'Cash expense');
      } else if (modalType === 'exchange') {
        const toAmount = parseFloat(formData.toAmount);
        if (!toAmount || toAmount <= 0) {
          Alert.alert('Invalid Amount', 'Please enter the amount received.');
          return;
        }
        await exchangeCash(
          formData.currency,
          amount,
          formData.toCurrency,
          toAmount,
          formData.fees ? parseFloat(formData.fees) : undefined
        );
      }

      setShowAddModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to complete transaction.');
    }
  }, [formData, modalType, withdrawCash, spendCash, exchangeCash, getCashBalance, format]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTransactionIcon = (type: CashTransaction['type']): string => {
    const icons: Record<string, string> = {
      withdraw: '🏧',
      spend: '💸',
      exchange: '🔄',
      receive: '💰',
      adjustment: '📝',
    };
    return icons[type] || '📝';
  };

  const renderTransactionCard = (transaction: CashTransaction) => {
    const currencyData = getCurrency(transaction.currency);
    const isPositive = transaction.type === 'withdraw' || transaction.type === 'receive';

    return (
      <View key={transaction.id} style={styles.transactionCard}>
        <View style={styles.transactionIcon}>
          <Text style={styles.transactionIconText}>{getTransactionIcon(transaction.type)}</Text>
        </View>

        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDesc}>{transaction.description}</Text>
          <Text style={styles.transactionMeta}>
            {formatDate(transaction.date)} • {transaction.type}
          </Text>
        </View>

        <View style={styles.transactionAmount}>
          {transaction.type === 'exchange' ? (
            <>
              <Text style={styles.transactionExchangeFrom}>
                -{format(transaction.fromAmount!, transaction.fromCurrency!)}
              </Text>
              <Text style={styles.transactionExchangeTo}>
                +{format(transaction.toAmount!, transaction.toCurrency!)}
              </Text>
            </>
          ) : (
            <Text
              style={[
                styles.transactionValue,
                isPositive ? styles.transactionPositive : styles.transactionNegative,
              ]}
            >
              {isPositive ? '+' : '-'}
              {format(transaction.amount, transaction.currency)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // eslint-disable-next-line complexity -- tracked in #1
  const renderModal = () => (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {modalType === 'withdraw'
              ? '🏧 Withdraw Cash'
              : modalType === 'spend'
                ? '💸 Spend Cash'
                : '🔄 Exchange Currency'}
          </Text>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* From Amount & Currency */}
          <Text style={styles.formLabel}>{modalType === 'exchange' ? 'From' : 'Amount'}</Text>
          <View style={styles.amountRow}>
            <TouchableOpacity
              style={styles.currencyPicker}
              onPress={() => {
                const currencies = [
                  homeCurrency,
                  ...recentCurrencies.filter((c) => c !== homeCurrency),
                ];
                const idx = currencies.indexOf(formData.currency);
                setFormData((prev) => ({
                  ...prev,
                  currency: currencies[(idx + 1) % currencies.length],
                }));
              }}
            >
              <Text style={styles.currencyPickerText}>
                {getCurrency(formData.currency)?.flag} {formData.currency}
              </Text>
            </TouchableOpacity>
            <TextInput
              style={styles.amountInput}
              value={formData.amount}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, amount: text }))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#999"
            />
          </View>

          {/* Show balance for spend */}
          {modalType === 'spend' && (
            <Text style={styles.balanceHint}>
              Available: {format(getCashBalance(formData.currency), formData.currency)}
            </Text>
          )}

          {/* Exchange To */}
          {modalType === 'exchange' && (
            <>
              <Text style={styles.formLabel}>To</Text>
              <View style={styles.amountRow}>
                <TouchableOpacity
                  style={styles.currencyPicker}
                  onPress={() => {
                    const currencies = getPopularCurrencies()
                      .map((c) => c.code)
                      .filter((c) => c !== formData.currency);
                    const idx = currencies.indexOf(formData.toCurrency);
                    setFormData((prev) => ({
                      ...prev,
                      toCurrency: currencies[(idx + 1) % currencies.length] as CurrencyCode,
                    }));
                  }}
                >
                  <Text style={styles.currencyPickerText}>
                    {getCurrency(formData.toCurrency)?.flag} {formData.toCurrency}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.amountInput}
                  value={formData.toAmount}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, toAmount: text }))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Show exchange rate */}
              {formData.amount && formData.toAmount && (
                <Text style={styles.rateHint}>
                  Rate: 1 {formData.currency} ={' '}
                  {(parseFloat(formData.toAmount) / parseFloat(formData.amount)).toFixed(4)}{' '}
                  {formData.toCurrency}
                </Text>
              )}
            </>
          )}

          {/* Description */}
          <Text style={styles.formLabel}>Description</Text>
          <TextInput
            style={styles.textInput}
            value={formData.description}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
            placeholder={
              modalType === 'withdraw'
                ? 'ATM location...'
                : modalType === 'spend'
                  ? 'What did you buy?'
                  : 'Exchange location...'
            }
            placeholderTextColor="#999"
          />

          {/* Fees */}
          {(modalType === 'withdraw' || modalType === 'exchange') && (
            <>
              <Text style={styles.formLabel}>Fees (optional)</Text>
              <View style={styles.amountRow}>
                <View style={styles.currencyPicker}>
                  <Text style={styles.currencyPickerText}>
                    {getCurrency(formData.currency)?.flag} {formData.currency}
                  </Text>
                </View>
                <TextInput
                  style={styles.amountInput}
                  value={formData.fees}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, fees: text }))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#999"
                />
              </View>
            </>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>
            {modalType === 'withdraw'
              ? 'Add Cash'
              : modalType === 'spend'
                ? 'Record Expense'
                : 'Exchange'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#34C759', '#30D158']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Cash Wallet</Text>
          <Text style={styles.totalAmount}>{format(cashTotalInHomeCurrency, homeCurrency)}</Text>
          <Text style={styles.totalLabel}>Total in {homeCurrency}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Balances */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cash on Hand</Text>
          <View style={styles.balancesGrid}>
            {cashWallet?.balances
              .filter((b) => b.amount > 0)
              .map((balance) => {
                const currencyData = getCurrency(balance.currency);
                return (
                  <View key={balance.currency} style={styles.balanceCard}>
                    <Text style={styles.balanceFlag}>{currencyData?.flag}</Text>
                    <Text style={styles.balanceAmount}>
                      {format(balance.amount, balance.currency)}
                    </Text>
                    <Text style={styles.balanceCurrency}>{currencyData?.name}</Text>
                  </View>
                );
              })}
            {(!cashWallet?.balances.length || !cashWallet.balances.some((b) => b.amount > 0)) && (
              <View style={styles.emptyBalances}>
                <Text style={styles.emptyIcon}>💵</Text>
                <Text style={styles.emptyText}>No cash recorded</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleOpenModal('withdraw')}
            >
              <Text style={styles.actionIcon}>🏧</Text>
              <Text style={styles.actionLabel}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenModal('spend')}>
              <Text style={styles.actionIcon}>💸</Text>
              <Text style={styles.actionLabel}>Spend</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleOpenModal('exchange')}
            >
              <Text style={styles.actionIcon}>🔄</Text>
              <Text style={styles.actionLabel}>Exchange</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {cashWallet?.transactions.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            cashWallet?.transactions.slice(0, 10).map(renderTransactionCard)
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {showAddModal && renderModal()}
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
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
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
  balancesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    flex: 1,
  },
  balanceFlag: {
    fontSize: 32,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  balanceCurrency: {
    fontSize: 12,
    color: '#888',
  },
  emptyBalances: {
    flex: 1,
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  transactionMeta: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionPositive: {
    color: '#34C759',
  },
  transactionNegative: {
    color: '#FF3B30',
  },
  transactionExchangeFrom: {
    fontSize: 14,
    color: '#FF3B30',
  },
  transactionExchangeTo: {
    fontSize: 14,
    color: '#34C759',
    marginTop: 2,
  },
  emptyTransactions: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalClose: {
    fontSize: 20,
    color: '#888',
  },
  modalContent: {
    padding: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    marginTop: 16,
  },
  amountRow: {
    flexDirection: 'row',
  },
  currencyPicker: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginRight: 12,
  },
  currencyPickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  amountInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  balanceHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  rateHint: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 8,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
  },
  submitButton: {
    backgroundColor: '#34C759',
    margin: 20,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  bottomPadding: {
    height: 40,
  },
});

export default CashWalletScreen;
