// Suggestion Card Component for Paint the Town
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MilestoneSuggestion, SuggestionCategory, PriceRange } from '../types/anniversary';

interface SuggestionCardProps {
  suggestion: MilestoneSuggestion;
  onPress?: () => void;
  onBookmark?: () => void;
  onBook?: () => void;
}

const CATEGORY_CONFIG: Record<SuggestionCategory, { icon: string; color: string; label: string }> = {
  restaurant: { icon: '🍽️', color: '#E74C3C', label: 'Dining' },
  experience: { icon: '🎯', color: '#3498DB', label: 'Experience' },
  getaway: { icon: '🏝️', color: '#27AE60', label: 'Getaway' },
  gift: { icon: '🎁', color: '#9B59B6', label: 'Gift' },
  activity: { icon: '🎨', color: '#F39C12', label: 'Activity' },
  spa: { icon: '🧘', color: '#1ABC9C', label: 'Spa & Wellness' },
  entertainment: { icon: '🎭', color: '#E91E63', label: 'Entertainment' },
};

const PRICE_CONFIG: Record<PriceRange, { label: string; color: string }> = {
  '$': { label: 'Budget-Friendly', color: '#27AE60' },
  '$$': { label: 'Moderate', color: '#3498DB' },
  '$$$': { label: 'Upscale', color: '#F39C12' },
  '$$$$': { label: 'Luxury', color: '#E74C3C' },
  '$$$$$': { label: 'Ultra-Luxury', color: '#9B59B6' },
};

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onPress,
  onBookmark,
  onBook,
}) => {
  const categoryConfig = CATEGORY_CONFIG[suggestion.category];
  const priceConfig = PRICE_CONFIG[suggestion.priceRange];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Category Badge */}
      <View style={styles.header}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryConfig.color + '15' }]}>
          <Text style={styles.categoryIcon}>{categoryConfig.icon}</Text>
          <Text style={[styles.categoryLabel, { color: categoryConfig.color }]}>
            {categoryConfig.label}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={onBookmark}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.bookmarkIcon}>
            {suggestion.isBookmarked ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Image Placeholder */}
      <View style={[styles.imagePlaceholder, { backgroundColor: categoryConfig.color + '20' }]}>
        <Text style={styles.placeholderIcon}>{categoryConfig.icon}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{suggestion.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {suggestion.description}
        </Text>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {suggestion.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Price and Location */}
        <View style={styles.metaRow}>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceRange, { color: priceConfig.color }]}>
              {suggestion.priceRange}
            </Text>
            <Text style={styles.priceLabel}>{priceConfig.label}</Text>
          </View>
          {suggestion.location && (
            <View style={styles.locationContainer}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {suggestion.location}
              </Text>
            </View>
          )}
        </View>

        {/* Rating */}
        {suggestion.rating !== undefined && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingStars}>
              {'⭐'.repeat(Math.floor(suggestion.rating))}
            </Text>
            <Text style={styles.ratingValue}>{suggestion.rating.toFixed(1)}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          {onBook && (
            <TouchableOpacity
              style={[styles.bookButton, { backgroundColor: categoryConfig.color }]}
              onPress={onBook}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={onPress}
          >
            <Text style={[styles.detailsButtonText, { color: categoryConfig.color }]}>
              View Details
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Compact version for lists
export const SuggestionCardCompact: React.FC<SuggestionCardProps> = ({
  suggestion,
  onPress,
  onBookmark,
}) => {
  const categoryConfig = CATEGORY_CONFIG[suggestion.category];
  const priceConfig = PRICE_CONFIG[suggestion.priceRange];

  return (
    <TouchableOpacity
      style={styles.compactCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.compactIcon, { backgroundColor: categoryConfig.color + '20' }]}>
        <Text style={styles.compactIconText}>{categoryConfig.icon}</Text>
      </View>
      <View style={styles.compactContent}>
        <Text style={styles.compactTitle} numberOfLines={1}>{suggestion.title}</Text>
        <View style={styles.compactMeta}>
          <Text style={[styles.compactCategory, { color: categoryConfig.color }]}>
            {categoryConfig.label}
          </Text>
          <Text style={styles.compactDot}>•</Text>
          <Text style={[styles.compactPrice, { color: priceConfig.color }]}>
            {suggestion.priceRange}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.compactBookmark}
        onPress={onBookmark}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text>{suggestion.isBookmarked ? '❤️' : '🤍'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// Category Filter Pill Component
interface CategoryFilterProps {
  category: SuggestionCategory | 'all';
  isSelected: boolean;
  onPress: () => void;
}

export const CategoryFilterPill: React.FC<CategoryFilterProps> = ({
  category,
  isSelected,
  onPress,
}) => {
  const config = category === 'all' 
    ? { icon: '✨', color: '#666', label: 'All' }
    : CATEGORY_CONFIG[category];

  return (
    <TouchableOpacity
      style={[
        styles.filterPill,
        isSelected && { backgroundColor: config.color, borderColor: config.color },
      ]}
      onPress={onPress}
    >
      <Text style={styles.filterIcon}>{config.icon}</Text>
      <Text style={[
        styles.filterLabel,
        isSelected && { color: 'white' },
      ]}>
        {config.label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 0,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookmarkButton: {
    padding: 4,
  },
  bookmarkIcon: {
    fontSize: 20,
  },
  imagePlaceholder: {
    height: 140,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
    opacity: 0.6,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceRange: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    maxWidth: 120,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingStars: {
    fontSize: 12,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  bookButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  detailsButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  compactIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactIconText: {
    fontSize: 20,
  },
  compactContent: {
    flex: 1,
    marginLeft: 12,
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  compactCategory: {
    fontSize: 12,
    fontWeight: '500',
  },
  compactDot: {
    marginHorizontal: 6,
    color: '#CCC',
  },
  compactPrice: {
    fontSize: 12,
    fontWeight: '600',
  },
  compactBookmark: {
    padding: 4,
  },
  // Filter Pill styles
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
    backgroundColor: 'white',
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
});

export default SuggestionCard;
