/* eslint-disable max-lines -- tracked in #1 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
  MapPin,
  Star,
  Heart,
  Plus,
  Check,
  X,
  ChevronRight,
  Target,
  Calendar,
  DollarSign,
  Flag,
  Sparkles,
  Filter,
  Search,
  Trash2,
  Edit3,
  TrendingUp,
  Award,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { destinations } from '@/mocks/destinations';
import { Destination, BucketListItem } from '@/types';

type FilterType = 'all' | 'wishlist' | 'visited';
type PriorityType = 'high' | 'medium' | 'low';

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function BucketListScreen() {
  const router = useRouter();
  const {
    bucketList,
    addToBucketList,
    removeFromBucketList,
    updateBucketListItem,
    markAsVisited,
    updateSavings,
    isInBucketList,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BucketListItem | null>(null);
  const [savingsInput, setSavingsInput] = useState('');

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const filteredItems = bucketList.filter((item) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'wishlist' && !item.isVisited) ||
      (activeFilter === 'visited' && item.isVisited);

    const matchesSearch =
      item.destination.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.destination.country.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const availableDestinations = destinations.filter((dest) => !isInBucketList(dest.id));

  const totalSavingsGoal = bucketList.reduce((sum, item) => sum + (item.savingsGoal || 0), 0);
  const totalCurrentSavings = bucketList.reduce((sum, item) => sum + (item.currentSavings || 0), 0);
  const savingsProgress = totalSavingsGoal > 0 ? (totalCurrentSavings / totalSavingsGoal) * 100 : 0;

  const handleAddDestination = useCallback(
    (destination: Destination) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      addToBucketList(destination, {
        savingsGoal: destination.avgPrice * 7,
        currentSavings: 0,
      });
      setShowAddModal(false);
    },
    [addToBucketList]
  );

  const handleRemoveItem = useCallback(
    (itemId: string) => {
      Alert.alert('Remove from Bucket List', 'Are you sure you want to remove this destination?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            removeFromBucketList(itemId);
          },
        },
      ]);
    },
    [removeFromBucketList]
  );

  const handleMarkVisited = useCallback(
    (itemId: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      markAsVisited(itemId);
    },
    [markAsVisited]
  );

  const handleUpdateSavings = useCallback(() => {
    if (selectedItem && savingsInput) {
      const amount = parseFloat(savingsInput);
      if (!isNaN(amount)) {
        updateSavings(selectedItem.id, amount);
        setSavingsInput('');
        setShowEditModal(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [selectedItem, savingsInput, updateSavings]);

  const handleUpdatePriority = useCallback(
    (itemId: string, priority: PriorityType) => {
      updateBucketListItem(itemId, { priority });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [updateBucketListItem]
  );

  const getPriorityColor = (priority: PriorityType) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
    }
  };

  const renderBucketItem = (item: BucketListItem) => {
    const progress = item.savingsGoal
      ? Math.min(100, ((item.currentSavings || 0) / item.savingsGoal) * 100)
      : 0;

    return (
      <Pressable
        key={item.id}
        style={[styles.bucketCard, item.isVisited && styles.visitedCard]}
        onPress={() => router.push(`/destination/${item.destination.id}`)}
      >
        <View style={styles.cardImageContainer}>
          <Image
            source={{ uri: item.destination.image }}
            style={styles.cardImage}
            contentFit="cover"
          />
          {item.isVisited && (
            <View style={styles.visitedBadge}>
              <Check size={14} color={colors.textLight} />
              <Text style={styles.visitedText}>Visited</Text>
            </View>
          )}
          <View
            style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}
          >
            <Flag size={12} color={colors.textLight} />
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleSection}>
              <Text style={styles.cardTitle}>{item.destination.name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color={colors.textSecondary} />
                <Text style={styles.cardLocation}>{item.destination.country}</Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <Star size={12} color={colors.warning} fill={colors.warning} />
              <Text style={styles.ratingText}>{item.destination.rating}</Text>
            </View>
          </View>

          {!item.isVisited && item.savingsGoal && item.savingsGoal > 0 && (
            <View style={styles.savingsSection}>
              <View style={styles.savingsHeader}>
                <Text style={styles.savingsLabel}>Savings Goal</Text>
                <Text style={styles.savingsAmount}>
                  ${(item.currentSavings || 0).toLocaleString()} / $
                  {item.savingsGoal.toLocaleString()}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress.toFixed(0)}% saved</Text>
            </View>
          )}

          <View style={styles.cardTags}>
            {item.destination.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.cardActions}>
            {!item.isVisited && (
              <>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedItem(item);
                    setShowEditModal(true);
                  }}
                >
                  <DollarSign size={16} color={colors.primary} />
                  <Text style={styles.actionText}>Add Savings</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.visitButton]}
                  onPress={() => handleMarkVisited(item.id)}
                >
                  <Check size={16} color={colors.success} />
                  <Text style={[styles.actionText, { color: colors.success }]}>Mark Visited</Text>
                </Pressable>
              </>
            )}
            <Pressable style={styles.deleteButton} onPress={() => handleRemoveItem(item.id)}>
              <Trash2 size={16} color={colors.error} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Bucket List',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => (
            <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Plus size={22} color={colors.primary} />
            </Pressable>
          ),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statsSection}>
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: `${colors.secondary}15` }]}>
                  <Heart size={20} color={colors.secondary} />
                </View>
                <Text style={styles.statValue}>{bucketList.length}</Text>
                <Text style={styles.statLabel}>Dream Trips</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
                  <Award size={20} color={colors.success} />
                </View>
                <Text style={styles.statValue}>{bucketList.filter((i) => i.isVisited).length}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <TrendingUp size={20} color={colors.primary} />
                </View>
                <Text style={styles.statValue}>{savingsProgress.toFixed(0)}%</Text>
                <Text style={styles.statLabel}>Savings</Text>
              </View>
            </View>

            {totalSavingsGoal > 0 && (
              <View style={styles.totalSavings}>
                <Text style={styles.totalSavingsLabel}>Total Savings Progress</Text>
                <View style={styles.totalProgressBar}>
                  <View style={[styles.totalProgressFill, { width: `${savingsProgress}%` }]} />
                </View>
                <Text style={styles.totalSavingsAmount}>
                  ${totalCurrentSavings.toLocaleString()} of ${totalSavingsGoal.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search destinations..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.filterSection}>
          {(['all', 'wishlist', 'visited'] as FilterType[]).map((filter) => (
            <Pressable
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => {
                setActiveFilter(filter);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter === 'all' ? 'All' : filter === 'wishlist' ? 'Wishlist' : 'Visited'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.listSection}>
          {filteredItems.length > 0 ? (
            filteredItems.map(renderBucketItem)
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Sparkles size={48} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {bucketList.length === 0 ? 'Start Your Bucket List' : 'No destinations found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {bucketList.length === 0
                  ? 'Add dream destinations you want to visit and track your progress'
                  : 'Try adjusting your filters or search'}
              </Text>
              {bucketList.length === 0 && (
                <Pressable style={styles.emptyButton} onPress={() => setShowAddModal(true)}>
                  <Plus size={18} color={colors.textLight} />
                  <Text style={styles.emptyButtonText}>Add Destination</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add to Bucket List</Text>
            <Pressable style={styles.closeButton} onPress={() => setShowAddModal(false)}>
              <X size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {availableDestinations.length > 0 ? (
              <View style={styles.destinationGrid}>
                {availableDestinations.map((dest) => (
                  <Pressable
                    key={dest.id}
                    style={styles.destinationCard}
                    onPress={() => handleAddDestination(dest)}
                  >
                    <Image
                      source={{ uri: dest.image }}
                      style={styles.destinationImage}
                      contentFit="cover"
                    />
                    <View style={styles.destinationOverlay}>
                      <Text style={styles.destinationName}>{dest.name}</Text>
                      <Text style={styles.destinationCountry}>{dest.country}</Text>
                      <View style={styles.destinationMeta}>
                        <Star size={12} color={colors.warning} fill={colors.warning} />
                        <Text style={styles.destinationRating}>{dest.rating}</Text>
                        <Text style={styles.destinationPrice}>~${dest.avgPrice}/day</Text>
                      </View>
                    </View>
                    <View style={styles.addOverlay}>
                      <Plus size={24} color={colors.textLight} />
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.emptyModal}>
                <Check size={48} color={colors.success} />
                <Text style={styles.emptyModalTitle}>All Added!</Text>
                <Text style={styles.emptyModalSubtitle}>
                  You&apos;ve added all available destinations to your bucket list
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>Add Savings</Text>
            {selectedItem && (
              <Text style={styles.editModalSubtitle}>{selectedItem.destination.name}</Text>
            )}

            <View style={styles.savingsInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.savingsInput}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={savingsInput}
                onChangeText={setSavingsInput}
                autoFocus
              />
            </View>

            {selectedItem && (
              <View style={styles.prioritySection}>
                <Text style={styles.priorityLabel}>Priority</Text>
                <View style={styles.priorityButtons}>
                  {(['high', 'medium', 'low'] as PriorityType[]).map((priority) => (
                    <Pressable
                      key={priority}
                      style={[
                        styles.priorityButton,
                        selectedItem.priority === priority && styles.priorityButtonActive,
                        {
                          borderColor: getPriorityColor(priority),
                          backgroundColor:
                            selectedItem.priority === priority
                              ? getPriorityColor(priority)
                              : 'transparent',
                        },
                      ]}
                      onPress={() => handleUpdatePriority(selectedItem.id, priority)}
                    >
                      <Text
                        style={[
                          styles.priorityButtonText,
                          {
                            color:
                              selectedItem.priority === priority
                                ? colors.textLight
                                : getPriorityColor(priority),
                          },
                        ]}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.editModalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  setSavingsInput('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleUpdateSavings}>
                <Text style={styles.saveButtonText}>Add Savings</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsSection: {
    padding: 20,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.border,
  },
  totalSavings: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalSavingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  totalProgressBar: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  totalProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  totalSavingsAmount: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'right',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.textLight,
  },
  listSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  bucketCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  visitedCard: {
    opacity: 0.85,
  },
  cardImageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  visitedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  visitedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  priorityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardLocation: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.warning}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warning,
  },
  savingsSection: {
    marginBottom: 12,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savingsLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  savingsAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.success,
    marginTop: 4,
    fontWeight: '500',
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  tag: {
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: `${colors.primary}10`,
  },
  visitButton: {
    backgroundColor: `${colors.success}10`,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${colors.error}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationGrid: {
    padding: 20,
    gap: 16,
  },
  destinationCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
  },
  destinationImage: {
    width: '100%',
    height: '100%',
  },
  destinationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  destinationName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textLight,
  },
  destinationCountry: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  destinationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  destinationRating: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  destinationPrice: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 8,
  },
  addOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyModal: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyModalSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  editModalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  savingsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginRight: 4,
  },
  savingsInput: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    minWidth: 80,
    textAlign: 'center',
  },
  prioritySection: {
    marginBottom: 20,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
  },
  priorityButtonActive: {},
  priorityButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
  },
});
