// Suggestions Screen for Paint the Town
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import { useAnniversary } from '../hooks/useAnniversary';
import anniversaryService from '../services/anniversaryService';
import { SuggestionCard, CategoryFilterPill } from '../components/SuggestionCard';
import {
  MilestoneSuggestion,
  SuggestionCategory,
  Anniversary,
  Milestone,
  PriceRange,
} from '../types/anniversary';

interface SuggestionsScreenProps {
  navigation: any;
  route: {
    params: {
      anniversaryId: string;
    };
  };
}

const CATEGORIES: (SuggestionCategory | 'all')[] = [
  'all',
  'restaurant',
  'experience',
  'getaway',
  'spa',
  'activity',
  'entertainment',
  'gift',
];

const PRICE_FILTERS: { value: PriceRange | 'all'; label: string }[] = [
  { value: 'all', label: 'All Prices' },
  { value: '$', label: 'Budget $' },
  { value: '$$', label: 'Moderate $$' },
  { value: '$$$', label: 'Upscale $$$' },
  { value: '$$$$', label: 'Luxury $$$$' },
  { value: '$$$$$', label: 'Ultra $$$$$' },
];

export const SuggestionsScreen: React.FC<SuggestionsScreenProps> = ({ navigation, route }) => {
  const { anniversaryId } = route.params;
  const { toggleSuggestionBookmark } = useAnniversary();

  const [anniversary, setAnniversary] = useState<Anniversary | null>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [suggestions, setSuggestions] = useState<MilestoneSuggestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SuggestionCategory | 'all'>('all');
  const [selectedPrice, setSelectedPrice] = useState<PriceRange | 'all'>('all');
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<MilestoneSuggestion | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadData = useCallback(async () => {
    const ann = await anniversaryService.getAnniversaryById(anniversaryId);
    if (ann) {
      setAnniversary(ann);

      const upcoming = await anniversaryService.getUpcomingAnniversaries(365);
      const upcomingAnn = upcoming.find((u) => u.anniversary.id === anniversaryId);
      if (upcomingAnn?.milestone) {
        setMilestone(upcomingAnn.milestone);
      }

      const sugs = await anniversaryService.getSuggestionsForAnniversary(anniversaryId);
      setSuggestions(sugs);
    }
  }, [anniversaryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleBookmark = async (suggestionId: string) => {
    await toggleSuggestionBookmark(suggestionId);
    setSuggestions((prev) =>
      prev.map((s) => (s.id === suggestionId ? { ...s, isBookmarked: !s.isBookmarked } : s))
    );
  };

  const handleViewDetails = (suggestion: MilestoneSuggestion) => {
    setSelectedSuggestion(suggestion);
    setShowDetailModal(true);
  };

  const handleBook = (suggestion: MilestoneSuggestion) => {
    // TODO: integrate with the booking system
    // For now, we'll navigate or show booking options
    if (suggestion.bookingUrl) {
      Linking.openURL(suggestion.bookingUrl);
    } else {
      // Navigate to appropriate booking flow
      switch (suggestion.category) {
        case 'restaurant':
          navigation.navigate('RestaurantBooking', { suggestionId: suggestion.id });
          break;
        case 'experience':
        case 'activity':
          navigation.navigate('ActivityBooking', { suggestionId: suggestion.id });
          break;
        case 'getaway':
          navigation.navigate('TripPlanning', { suggestionId: suggestion.id });
          break;
        default:
          // Generic search or booking
          break;
      }
    }
  };

  const filteredSuggestions = suggestions.filter((s) => {
    if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
    if (selectedPrice !== 'all' && s.priceRange !== selectedPrice) return false;
    if (showBookmarked && !s.isBookmarked) return false;
    return true;
  });

  const bookmarkedCount = suggestions.filter((s) => s.isBookmarked).length;

  const renderHeader = () => (
    <View>
      {/* Anniversary & Milestone Info */}
      {anniversary && milestone && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{anniversary.name}</Text>
          <View style={styles.milestoneTag}>
            <Text style={styles.milestoneTagText}>{milestone.name}</Text>
          </View>
          {milestone.traditionalGift && (
            <Text style={styles.giftHint}>
              💡 Traditional gift theme: {milestone.traditionalGift}
            </Text>
          )}
        </View>
      )}

      {/* Category Filters */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterContainer}
        renderItem={({ item }) => (
          <CategoryFilterPill
            category={item}
            isSelected={selectedCategory === item}
            onPress={() => setSelectedCategory(item)}
          />
        )}
      />

      {/* Secondary Filters */}
      <View style={styles.secondaryFilters}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.priceFilterContainer}
        >
          {PRICE_FILTERS.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.priceChip, selectedPrice === item.value && styles.priceChipActive]}
              onPress={() => setSelectedPrice(item.value)}
            >
              <Text
                style={[
                  styles.priceChipText,
                  selectedPrice === item.value && styles.priceChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.bookmarkedToggle, showBookmarked && styles.bookmarkedToggleActive]}
          onPress={() => setShowBookmarked(!showBookmarked)}
        >
          <Text style={styles.bookmarkedIcon}>{showBookmarked ? '❤️' : '🤍'}</Text>
          <Text style={[styles.bookmarkedText, showBookmarked && styles.bookmarkedTextActive]}>
            {bookmarkedCount}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredSuggestions.length} {filteredSuggestions.length === 1 ? 'idea' : 'ideas'}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>No ideas match your filters</Text>
      <Text style={styles.emptySubtitle}>Try adjusting your category or price filters</Text>
      <TouchableOpacity
        style={styles.clearButton}
        onPress={() => {
          setSelectedCategory('all');
          setSelectedPrice('all');
          setShowBookmarked(false);
        }}
      >
        <Text style={styles.clearButtonText}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Celebration Ideas</Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={filteredSuggestions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SuggestionCard
            suggestion={item}
            onPress={() => handleViewDetails(item)}
            onBookmark={() => handleToggleBookmark(item.id)}
            onBook={() => handleBook(item)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>

          {selectedSuggestion && (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalIcon}>
                {selectedSuggestion.category === 'restaurant'
                  ? '🍽️'
                  : selectedSuggestion.category === 'experience'
                    ? '🎯'
                    : selectedSuggestion.category === 'getaway'
                      ? '🏝️'
                      : selectedSuggestion.category === 'spa'
                        ? '🧘'
                        : selectedSuggestion.category === 'activity'
                          ? '🎨'
                          : selectedSuggestion.category === 'entertainment'
                            ? '🎭'
                            : '🎁'}
              </Text>
              <Text style={styles.modalTitle}>{selectedSuggestion.title}</Text>
              <Text style={styles.modalDescription}>{selectedSuggestion.description}</Text>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Price Range</Text>
                <Text style={styles.modalPrice}>{selectedSuggestion.priceRange}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Why It&apos;s Perfect</Text>
                <View style={styles.modalReasons}>
                  {milestone?.traditionalGift && (
                    <View style={styles.reasonItem}>
                      <Text style={styles.reasonIcon}>🎁</Text>
                      <Text style={styles.reasonText}>
                        Fits the {milestone.traditionalGift} theme
                      </Text>
                    </View>
                  )}
                  <View style={styles.reasonItem}>
                    <Text style={styles.reasonIcon}>💝</Text>
                    <Text style={styles.reasonText}>Creates lasting memories together</Text>
                  </View>
                  <View style={styles.reasonItem}>
                    <Text style={styles.reasonIcon}>⭐</Text>
                    <Text style={styles.reasonText}>Highly rated by other couples</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {selectedSuggestion.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalBookmarkButton}
                  onPress={() => handleToggleBookmark(selectedSuggestion.id)}
                >
                  <Text style={styles.modalBookmarkText}>
                    {selectedSuggestion.isBookmarked ? '❤️ Saved' : '🤍 Save for Later'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalBookButton}
                  onPress={() => {
                    setShowDetailModal(false);
                    handleBook(selectedSuggestion);
                  }}
                >
                  <Text style={styles.modalBookText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  listContent: {
    paddingBottom: 40,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  milestoneTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  milestoneTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D4AF37',
  },
  giftHint: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  secondaryFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  priceFilterContainer: {
    flex: 1,
    paddingRight: 12,
  },
  priceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'white',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  priceChipActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  priceChipText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  priceChipTextActive: {
    color: 'white',
  },
  bookmarkedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bookmarkedToggleActive: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FF6B6B',
  },
  bookmarkedIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  bookmarkedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  bookmarkedTextActive: {
    color: '#FF6B6B',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    padding: 16,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  modalClose: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  modalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  modalReasons: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  reasonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  reasonText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 40,
  },
  modalBookmarkButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    marginRight: 10,
  },
  modalBookmarkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  modalBookButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  modalBookText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
});

export default SuggestionsScreen;
