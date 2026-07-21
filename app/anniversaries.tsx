// ============================================================================
// Anniversary Tracker Screen
// Track milestones and get special celebration suggestions
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ArrowLeft,
  Plus,
  Heart,
  Calendar,
  Gift,
  Sparkles,
  Clock,
  ChevronRight,
  X,
  Check,
  Edit2,
  Trash2,
  Bell,
  PartyPopper,
  Star,
  Gem,
  Flower,
  Info,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useAnniversaryTracker } from '@/hooks/useAnniversaryTracker';
import {
  Anniversary,
  AnniversaryType,
  UpcomingAnniversary,
  MilestoneSuggestion,
  ANNIVERSARY_TYPES,
  getAnniversaryTypeConfig,
  formatDaysUntil,
  formatMilestone,
  getCostRangeLabel,
  calculateYearsAndMonths,
} from '@/types/anniversary';

const { width } = Dimensions.get('window');

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function AnniversaryTrackerScreen() {
  const router = useRouter();

  const {
    anniversaries,
    isLoading,
    upcomingAnniversaries,
    todayAnniversaries,
    thisWeekAnniversaries,
    addAnniversary,
    updateAnniversary,
    deleteAnniversary,
    markCelebrated,
    getSuggestionsForAnniversary,
    getGiftSuggestions,
    stats,
  } = useAnniversaryTracker();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAnniversary, setSelectedAnniversary] = useState<UpcomingAnniversary | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date: new Date(),
    type: 'first_date' as AnniversaryType,
    partnerName: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      date: new Date(),
      type: 'first_date',
      partnerName: '',
      notes: '',
    });
  };

  const handleAddAnniversary = async () => {
    if (!formData.date) {
      Alert.alert('Required', 'Please select a date');
      return;
    }

    const typeConfig = getAnniversaryTypeConfig(formData.type);

    await addAnniversary({
      name: formData.name || typeConfig.defaultName,
      date: formData.date.toISOString(),
      type: formData.type,
      partnerName: formData.partnerName || undefined,
      notes: formData.notes || undefined,
    });

    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = (anniversary: Anniversary) => {
    Alert.alert('Delete Anniversary?', `Are you sure you want to delete "${anniversary.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteAnniversary(anniversary.id),
      },
    ]);
  };

  const openDetails = (upcoming: UpcomingAnniversary) => {
    setSelectedAnniversary(upcoming);
    setShowDetailsModal(true);
  };

  // ============================================================================
  // Render Anniversary Card
  // ============================================================================

  const renderAnniversaryCard = (upcoming: UpcomingAnniversary, highlight = false) => {
    const { anniversary, milestone, daysUntil, yearsTotal, isToday } = upcoming;
    const typeConfig = getAnniversaryTypeConfig(anniversary.type);

    return (
      <Pressable
        key={anniversary.id}
        style={[
          styles.anniversaryCard,
          highlight && styles.anniversaryCardHighlight,
          isToday && styles.anniversaryCardToday,
        ]}
        onPress={() => openDetails(upcoming)}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.cardEmoji, { backgroundColor: typeConfig.color + '20' }]}>
            <Text style={styles.cardEmojiText}>{anniversary.emoji || typeConfig.emoji}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardName}>{anniversary.name}</Text>
          <Text style={styles.cardMeta}>
            {formatMilestone(yearsTotal)} • {formatDaysUntil(daysUntil)}
          </Text>

          {milestone?.traditionalGift && (
            <View style={styles.giftHint}>
              <Gift size={12} color={colors.primary} />
              <Text style={styles.giftHintText}>
                {milestone.traditionalGift} / {milestone.modernGift}
              </Text>
            </View>
          )}
        </View>

        <ChevronRight size={20} color={colors.textTertiary} />
      </Pressable>
    );
  };

  // ============================================================================
  // Render Add Modal
  // ============================================================================

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAddModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Pressable onPress={() => setShowAddModal(false)}>
            <X size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.modalTitle}>Add Anniversary</Text>
          <Pressable onPress={handleAddAnniversary}>
            <Check size={24} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Type Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typeOptions}
            >
              {ANNIVERSARY_TYPES.map((type) => (
                <Pressable
                  key={type.id}
                  style={[
                    styles.typeOption,
                    formData.type === type.id && {
                      backgroundColor: type.color,
                      borderColor: type.color,
                    },
                  ]}
                  onPress={() => setFormData({ ...formData, type: type.id })}
                >
                  <Text style={styles.typeEmoji}>{type.emoji}</Text>
                  <Text
                    style={[
                      styles.typeLabel,
                      formData.type === type.id && styles.typeLabelSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Calendar size={20} color={colors.primary} />
              <Text style={styles.dateButtonText}>
                {formData.date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={formData.date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) setFormData({ ...formData, date });
                }}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Custom Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder={getAnniversaryTypeConfig(formData.type).defaultName}
              placeholderTextColor={colors.textTertiary}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          {/* Partner Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Partner&apos;s Name (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Their name"
              placeholderTextColor={colors.textTertiary}
              value={formData.partnerName}
              onChangeText={(text) => setFormData({ ...formData, partnerName: text })}
            />
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Add any special memories or notes..."
              placeholderTextColor={colors.textTertiary}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // ============================================================================
  // Render Details Modal
  // ============================================================================

  const renderDetailsModal = () => {
    if (!selectedAnniversary) return null;

    const { anniversary, milestone, yearsTotal, daysUntil, isToday } = selectedAnniversary;
    const typeConfig = getAnniversaryTypeConfig(anniversary.type);
    const suggestions = getSuggestionsForAnniversary(anniversary.id, { limit: 6 });
    const gifts = getGiftSuggestions(yearsTotal);
    const { years, months, days } = calculateYearsAndMonths(anniversary.date);

    return (
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <LinearGradient
              colors={[typeConfig.color, typeConfig.color + 'CC']}
              style={styles.detailsHero}
            >
              <Pressable style={styles.detailsCloseBtn} onPress={() => setShowDetailsModal(false)}>
                <X size={24} color="#fff" />
              </Pressable>

              <View style={styles.detailsHeroContent}>
                <Text style={styles.detailsEmoji}>{anniversary.emoji || typeConfig.emoji}</Text>
                <Text style={styles.detailsName}>{anniversary.name}</Text>

                {anniversary.partnerName && (
                  <Text style={styles.detailsPartner}>with {anniversary.partnerName}</Text>
                )}

                <View style={styles.detailsStats}>
                  <View style={styles.detailsStat}>
                    <Text style={styles.detailsStatValue}>{years}</Text>
                    <Text style={styles.detailsStatLabel}>Years</Text>
                  </View>
                  <View style={styles.detailsStat}>
                    <Text style={styles.detailsStatValue}>{months}</Text>
                    <Text style={styles.detailsStatLabel}>Months</Text>
                  </View>
                  <View style={styles.detailsStat}>
                    <Text style={styles.detailsStatValue}>{days}</Text>
                    <Text style={styles.detailsStatLabel}>Days</Text>
                  </View>
                </View>

                <View style={styles.countdownBadge}>
                  <Clock size={14} color="#fff" />
                  <Text style={styles.countdownText}>
                    {isToday
                      ? '🎉 Today!'
                      : `${daysUntil} days until ${yearsTotal} year anniversary`}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.detailsBody}>
              {/* Traditional/Modern Gifts */}
              {(gifts.traditional || gifts.modern) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    <Gem size={18} color={colors.primary} /> Year {yearsTotal} Gifts
                  </Text>

                  <View style={styles.giftsGrid}>
                    {gifts.traditional && (
                      <View style={styles.giftCard}>
                        <Text style={styles.giftCardLabel}>Traditional</Text>
                        <Text style={styles.giftCardValue}>{gifts.traditional}</Text>
                      </View>
                    )}
                    {gifts.modern && (
                      <View style={styles.giftCard}>
                        <Text style={styles.giftCardLabel}>Modern</Text>
                        <Text style={styles.giftCardValue}>{gifts.modern}</Text>
                      </View>
                    )}
                    {gifts.flower && (
                      <View style={styles.giftCard}>
                        <Text style={styles.giftCardLabel}>Flower</Text>
                        <Text style={styles.giftCardValue}>{gifts.flower}</Text>
                      </View>
                    )}
                    {gifts.gemstone && (
                      <View style={styles.giftCard}>
                        <Text style={styles.giftCardLabel}>Gemstone</Text>
                        <Text style={styles.giftCardValue}>{gifts.gemstone}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Celebration Suggestions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Sparkles size={18} color={colors.primary} /> Celebration Ideas
                </Text>

                <View style={styles.suggestionsGrid}>
                  {suggestions.map((suggestion) => (
                    <View key={suggestion.id} style={styles.suggestionCard}>
                      <View style={styles.suggestionHeader}>
                        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                        <Text style={styles.suggestionCost}>
                          {getCostRangeLabel(suggestion.estimatedCost)}
                        </Text>
                      </View>
                      <Text style={styles.suggestionDesc} numberOfLines={2}>
                        {suggestion.description}
                      </Text>
                      <View style={styles.suggestionTags}>
                        {suggestion.tags.slice(0, 3).map((tag) => (
                          <View key={tag} style={styles.suggestionTag}>
                            <Text style={styles.suggestionTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Notes */}
              {anniversary.notes && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <View style={styles.notesCard}>
                    <Text style={styles.notesText}>{anniversary.notes}</Text>
                  </View>
                </View>
              )}

              {/* Actions */}
              <View style={styles.section}>
                {!isToday && (
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => {
                      // Navigate to create date night
                      setShowDetailsModal(false);
                      router.push('/date-night/create');
                    }}
                  >
                    <Heart size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Plan a Date Night</Text>
                  </Pressable>
                )}

                {isToday && (
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: colors.success }]}
                    onPress={() => {
                      markCelebrated(anniversary.id);
                      Alert.alert('🎉 Celebrated!', 'Hope you have a wonderful time!');
                    }}
                  >
                    <PartyPopper size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Mark as Celebrated</Text>
                  </Pressable>
                )}

                <Pressable
                  style={styles.dangerBtn}
                  onPress={() => {
                    setShowDetailsModal(false);
                    handleDelete(anniversary);
                  }}
                >
                  <Trash2 size={18} color={colors.error} />
                  <Text style={styles.dangerBtnText}>Delete Anniversary</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Anniversaries</Text>
          <Pressable style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Plus size={22} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Stats */}
          {stats.nextAnniversary && (
            <LinearGradient colors={[colors.primary, '#FF6B9D']} style={styles.heroCard}>
              <View style={styles.heroContent}>
                <Heart size={24} color="#fff" fill="#fff" />
                <Text style={styles.heroLabel}>Next Anniversary</Text>
                <Text style={styles.heroTitle}>{stats.nextAnniversary.anniversary.name}</Text>
                <Text style={styles.heroSubtitle}>
                  {formatDaysUntil(stats.nextAnniversary.daysUntil)} •{' '}
                  {stats.nextAnniversary.yearsTotal} years
                </Text>
              </View>
            </LinearGradient>
          )}

          {/* Today */}
          {todayAnniversaries.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <PartyPopper size={20} color={colors.warning} />
                <Text style={styles.sectionTitle}>Today! 🎉</Text>
              </View>
              {todayAnniversaries.map((a) => renderAnniversaryCard(a, true))}
            </View>
          )}

          {/* This Week */}
          {thisWeekAnniversaries.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Calendar size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>This Week</Text>
              </View>
              {thisWeekAnniversaries.map((a) => renderAnniversaryCard(a))}
            </View>
          )}

          {/* All Upcoming */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={colors.textSecondary} />
              <Text style={styles.sectionTitle}>All Anniversaries</Text>
            </View>
            {upcomingAnniversaries.length > 0 ? (
              upcomingAnniversaries.map((a) => renderAnniversaryCard(a))
            ) : (
              <View style={styles.emptyState}>
                <Heart size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No anniversaries yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add your special dates to get reminders and celebration ideas
                </Text>
                <Pressable style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
                  <Plus size={18} color="#fff" />
                  <Text style={styles.emptyBtnText}>Add Anniversary</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Modals */}
        {renderAddModal()}
        {renderDetailsModal()}
      </SafeAreaView>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },

  // Hero Card
  heroCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },

  // Anniversary Card
  anniversaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  anniversaryCardHighlight: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  anniversaryCardToday: {
    backgroundColor: colors.warning + '15',
    borderWidth: 2,
    borderColor: colors.warning,
  },
  cardLeft: {
    marginRight: 14,
  },
  cardEmoji: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmojiText: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  giftHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  giftHintText: {
    fontSize: 12,
    color: colors.primary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },

  // Input
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
  },

  // Type Options
  typeOptions: {
    gap: 10,
    paddingVertical: 4,
  },
  typeOption: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 90,
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    color: colors.text,
  },
  typeLabelSelected: {
    color: '#fff',
    fontWeight: '600',
  },

  // Details Modal
  detailsHero: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  detailsCloseBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsHeroContent: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  detailsEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  detailsName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  detailsPartner: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  detailsStats: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 24,
  },
  detailsStat: {
    alignItems: 'center',
  },
  detailsStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  detailsStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 20,
  },
  countdownText: {
    fontSize: 14,
    color: '#fff',
  },

  detailsBody: {
    padding: 16,
  },

  // Gifts Grid
  giftsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  giftCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
  },
  giftCardLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  giftCardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },

  // Suggestions
  suggestionsGrid: {
    gap: 12,
  },
  suggestionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  suggestionCost: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  suggestionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  suggestionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  suggestionTag: {
    backgroundColor: colors.primary + '15',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  suggestionTagText: {
    fontSize: 11,
    color: colors.primary,
  },

  // Notes
  notesCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },

  // Actions
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error + '15',
    paddingVertical: 14,
    borderRadius: 12,
  },
  dangerBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.error,
  },
});
