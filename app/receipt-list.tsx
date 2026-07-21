// Paint the Town Receipt Scanner - Receipt List Screen

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useReceiptScanner } from '../hooks/useReceiptScanner';
import { Receipt, ReceiptStatus } from '../types/receipt';
import { EXPENSE_CATEGORIES } from '../mocks/mockReceiptData';

interface ReceiptListScreenProps {
  navigation?: any;
  tripId?: string;
}

const ReceiptListScreen: React.FC<ReceiptListScreenProps> = ({ navigation, tripId }) => {
  const { receipts, deleteReceipt, refreshReceipts, isLoading } = useReceiptScanner({ tripId });

  const [filter, setFilter] = useState<'all' | 'pending' | 'imported'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredReceipts = useMemo(() => {
    switch (filter) {
      case 'pending':
        return receipts.filter((r) => r.status === 'reviewing' || r.status === 'confirmed');
      case 'imported':
        return receipts.filter((r) => r.status === 'imported');
      default:
        return receipts.filter((r) => r.status !== 'discarded');
    }
  }, [receipts, filter]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshReceipts();
    setRefreshing(false);
  }, [refreshReceipts]);

  const handleDeleteReceipt = useCallback(
    (receipt: Receipt) => {
      Alert.alert('Delete Receipt', 'Are you sure you want to delete this receipt?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteReceipt(receipt.id),
        },
      ]);
    },
    [deleteReceipt]
  );

  const getCategoryInfo = (categoryId: string) => {
    return (
      EXPENSE_CATEGORIES.find((c) => c.id === categoryId) ||
      EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
    );
  };

  const getStatusColor = (status: ReceiptStatus): string => {
    const colors: Record<ReceiptStatus, string> = {
      capturing: '#FF9500',
      processing: '#FF9500',
      reviewing: '#007AFF',
      confirmed: '#34C759',
      imported: '#34C759',
      failed: '#FF3B30',
      discarded: '#8E8E93',
    };
    return colors[status] || '#8E8E93';
  };

  const getStatusLabel = (status: ReceiptStatus): string => {
    const labels: Record<ReceiptStatus, string> = {
      capturing: 'Capturing',
      processing: 'Processing',
      reviewing: 'Pending Review',
      confirmed: 'Ready to Import',
      imported: 'Imported',
      failed: 'Failed',
      discarded: 'Discarded',
    };
    return labels[status] || status;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderReceiptCard = (receipt: Receipt) => {
    const categoryInfo = getCategoryInfo(receipt.finalData?.category || 'other');

    return (
      <TouchableOpacity
        key={receipt.id}
        style={styles.receiptCard}
        onPress={() => navigation?.navigate('ReceiptReview', { receiptId: receipt.id })}
        onLongPress={() => handleDeleteReceipt(receipt)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: receipt.image.uri }} style={styles.receiptThumbnail} />

        <View style={styles.receiptInfo}>
          <Text style={styles.receiptMerchant} numberOfLines={1}>
            {receipt.finalData?.merchant || 'Unknown Merchant'}
          </Text>

          <View style={styles.receiptMeta}>
            <Text style={styles.receiptCategory}>
              {categoryInfo.icon} {categoryInfo.name}
            </Text>
            <Text style={styles.receiptDot}>•</Text>
            <Text style={styles.receiptDate}>
              {formatDate(receipt.finalData?.date || receipt.createdAt)}
            </Text>
          </View>

          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(receipt.status) + '20' }]}
          >
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(receipt.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(receipt.status) }]}>
              {getStatusLabel(receipt.status)}
            </Text>
          </View>
        </View>

        <View style={styles.receiptAmount}>
          <Text style={styles.amountValue}>
            {receipt.finalData?.currency || '$'} {receipt.finalData?.total?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const pendingCount = receipts.filter(
    (r) => r.status === 'reviewing' || r.status === 'confirmed'
  ).length;
  const importedCount = receipts.filter((r) => r.status === 'imported').length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation?.navigate('ReceiptCapture')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All ({receipts.filter((r) => r.status !== 'discarded').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterTabText, filter === 'pending' && styles.filterTabTextActive]}>
            Pending ({pendingCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'imported' && styles.filterTabActive]}
          onPress={() => setFilter('imported')}
        >
          <Text style={[styles.filterTabText, filter === 'imported' && styles.filterTabTextActive]}>
            Imported ({importedCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {filteredReceipts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>No receipts</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Scan your first receipt to get started'
                : filter === 'pending'
                  ? 'No pending receipts to review'
                  : 'No imported receipts yet'}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation?.navigate('ReceiptCapture')}
              >
                <Text style={styles.emptyButtonText}>Scan Receipt</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.receiptsList}>{filteredReceipts.map(renderReceiptCard)}</View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#F5F3FF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  filterTabTextActive: {
    color: '#667eea',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  receiptsList: {},
  receiptCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  receiptThumbnail: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  receiptInfo: {
    flex: 1,
    marginLeft: 12,
  },
  receiptMerchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  receiptMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptCategory: {
    fontSize: 13,
    color: '#666',
  },
  receiptDot: {
    fontSize: 13,
    color: '#ccc',
    marginHorizontal: 6,
  },
  receiptDate: {
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
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  receiptAmount: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomPadding: {
    height: 40,
  },
});

export default ReceiptListScreen;
