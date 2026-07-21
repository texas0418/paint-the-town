// Paint the Town Receipt Scanner - Receipt Card Component

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Receipt, ReceiptStatus } from '../types/receipt';
import { EXPENSE_CATEGORIES } from '../mocks/mockReceiptData';

interface ReceiptCardProps {
  receipt: Receipt;
  onPress?: () => void;
  onLongPress?: () => void;
  compact?: boolean;
}

const STATUS_CONFIG: Record<ReceiptStatus, { color: string; label: string; icon: string }> = {
  capturing: { color: '#FF9500', label: 'Capturing', icon: '📸' },
  processing: { color: '#FF9500', label: 'Processing', icon: '⏳' },
  reviewing: { color: '#007AFF', label: 'Review', icon: '👁️' },
  confirmed: { color: '#34C759', label: 'Ready', icon: '✓' },
  imported: { color: '#34C759', label: 'Imported', icon: '✅' },
  failed: { color: '#FF3B30', label: 'Failed', icon: '❌' },
  discarded: { color: '#8E8E93', label: 'Discarded', icon: '🗑️' },
};

const ReceiptCard: React.FC<ReceiptCardProps> = ({
  receipt,
  onPress,
  onLongPress,
  compact = false,
}) => {
  const statusConfig = STATUS_CONFIG[receipt.status];
  const categoryInfo = EXPENSE_CATEGORIES.find(
    c => c.id === receipt.finalData?.category
  ) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatAmount = (amount: number, currency: string): string => {
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥',
    };
    const symbol = symbols[currency] || currency + ' ';
    return `${symbol}${amount.toFixed(2)}`;
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: receipt.image.uri }}
          style={styles.compactThumbnail}
        />
        <View style={styles.compactInfo}>
          <Text style={styles.compactMerchant} numberOfLines={1}>
            {receipt.finalData?.merchant || 'Unknown'}
          </Text>
          <Text style={styles.compactAmount}>
            {formatAmount(receipt.finalData?.total || 0, receipt.finalData?.currency || 'USD')}
          </Text>
        </View>
        <View style={[styles.compactStatus, { backgroundColor: statusConfig.color }]}>
          <Text style={styles.compactStatusText}>{statusConfig.icon}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <Image
        source={{ uri: receipt.image.uri }}
        style={styles.thumbnail}
      />

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.merchant} numberOfLines={1}>
          {receipt.finalData?.merchant || 'Unknown Merchant'}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.category}>
            {categoryInfo.icon} {categoryInfo.name}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.date}>
            {formatDate(receipt.finalData?.date || receipt.createdAt)}
          </Text>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>

        {/* Confidence indicator */}
        {receipt.extraction && receipt.extraction.overallConfidence < 0.7 && (
          <View style={styles.warningBadge}>
            <Text style={styles.warningText}>⚠️ Low confidence</Text>
          </View>
        )}
      </View>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>
          {formatAmount(receipt.finalData?.total || 0, receipt.finalData?.currency || 'USD')}
        </Text>
        {receipt.finalData?.paymentMethod && (
          <Text style={styles.paymentMethod}>
            {receipt.finalData.paymentMethod === 'card' ? '💳' :
             receipt.finalData.paymentMethod === 'cash' ? '💵' : '📱'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  thumbnail: {
    width: 56,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  merchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 13,
    color: '#666',
  },
  dot: {
    fontSize: 13,
    color: '#ccc',
    marginHorizontal: 6,
  },
  date: {
    fontSize: 13,
    color: '#888',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  warningBadge: {
    marginTop: 4,
  },
  warningText: {
    fontSize: 11,
    color: '#FF9500',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  paymentMethod: {
    fontSize: 14,
    marginTop: 4,
  },
  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
    minWidth: 160,
  },
  compactThumbnail: {
    width: 40,
    height: 52,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  compactInfo: {
    flex: 1,
    marginLeft: 10,
  },
  compactMerchant: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  compactAmount: {
    fontSize: 13,
    color: '#666',
  },
  compactStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  compactStatusText: {
    fontSize: 12,
  },
});

export default ReceiptCard;
