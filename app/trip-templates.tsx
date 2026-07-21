import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Search,
  Star,
  Clock,
  DollarSign,
  MapPin,
  Heart,
  Users,
  Mountain,
  Landmark,
  Leaf,
  UtensilsCrossed,
  PiggyBank,
  Crown,
  User,
  Accessibility,
  ChevronRight,
  Calendar,
  Check,
  Sparkles,
  Filter,
  X,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { tripTemplates, templateCategories, getFeaturedTemplates } from '@/mocks/templates';
import { TripTemplate, TripTemplateCategory, TemplateDayPlan } from '@/types';
import React from 'react';

const { width } = Dimensions.get('window');

const getCategoryIcon = (iconName: string, size: number, color: string) => {
  const icons: Record<string, React.ReactNode> = {
    Heart: <Heart size={size} color={color} />,
    Mountain: <Mountain size={size} color={color} />,
    Users: <Users size={size} color={color} />,
    Landmark: <Landmark size={size} color={color} />,
    Leaf: <Leaf size={size} color={color} />,
    UtensilsCrossed: <UtensilsCrossed size={size} color={color} />,
    PiggyBank: <PiggyBank size={size} color={color} />,
    Crown: <Crown size={size} color={color} />,
    User: <User size={size} color={color} />,
    Accessibility: <Accessibility size={size} color={color} />,
  };
  return icons[iconName] || <Sparkles size={size} color={color} />;
};

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function TripTemplatesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TripTemplateCategory | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TripTemplate | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredTemplates = useMemo(() => {
    let results = tripTemplates;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.destination.name.toLowerCase().includes(query) ||
          t.destination.country.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (selectedCategory) {
      results = results.filter((t) => t.category === selectedCategory);
    }

    return results;
  }, [searchQuery, selectedCategory]);

  const featuredTemplates = useMemo(() => getFeaturedTemplates(), []);

  const handleUseTemplate = useCallback(
    (template: TripTemplate) => {
      Alert.alert(
        'Use This Template?',
        `Start planning your trip to ${template.destination.name} based on "${template.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Planning',
            onPress: () => {
              console.log('Using template:', template.id);
              router.push('/plan-trip');
            },
          },
        ]
      );
    },
    [router]
  );

  const renderCategoryChip = useCallback(
    (category: (typeof templateCategories)[0]) => {
      const isSelected = selectedCategory === category.id;
      return (
        <Pressable
          key={category.id}
          style={[styles.categoryChip, isSelected && { backgroundColor: category.color }]}
          onPress={() => setSelectedCategory(isSelected ? null : category.id)}
        >
          {getCategoryIcon(category.icon, 16, isSelected ? colors.textLight : category.color)}
          <Text style={[styles.categoryChipText, isSelected && { color: colors.textLight }]}>
            {category.name}
          </Text>
        </Pressable>
      );
    },
    [selectedCategory]
  );

  const renderTemplateCard = useCallback(
    (template: TripTemplate, featured = false) => (
      <Pressable
        key={template.id}
        style={[styles.templateCard, featured && styles.featuredCard]}
        onPress={() => setSelectedTemplate(template)}
      >
        <Image
          source={{ uri: template.image }}
          style={[styles.templateImage, featured && styles.featuredImage]}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.templateGradient}
        />
        {template.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
        <View style={styles.templateContent}>
          <View style={styles.templateMeta}>
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor:
                    templateCategories.find((c) => c.id === template.category)?.color ||
                    colors.primary,
                },
              ]}
            >
              <Text style={styles.categoryBadgeText}>{template.category}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Star size={12} color="#FFC107" fill="#FFC107" />
              <Text style={styles.ratingText}>{template.rating}</Text>
            </View>
          </View>
          <Text style={styles.templateName} numberOfLines={2}>
            {template.name}
          </Text>
          <View style={styles.templateLocation}>
            <MapPin size={12} color={colors.textLight} />
            <Text style={styles.templateLocationText}>
              {template.destination.name}, {template.destination.country}
            </Text>
          </View>
          <View style={styles.templateInfo}>
            <View style={styles.templateInfoItem}>
              <Clock size={12} color={colors.accent} />
              <Text style={styles.templateInfoText}>{template.duration} days</Text>
            </View>
            <View style={styles.templateInfoItem}>
              <DollarSign size={12} color={colors.accent} />
              <Text style={styles.templateInfoText}>
                {template.estimatedBudget.min.toLocaleString()}-
                {template.estimatedBudget.max.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    ),
    []
  );

  const renderTemplateDetail = useCallback(() => {
    if (!selectedTemplate) return null;

    const category = templateCategories.find((c) => c.id === selectedTemplate.category);

    return (
      <View style={styles.detailOverlay}>
        <SafeAreaView style={styles.detailContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailHeader}>
              <Image
                source={{ uri: selectedTemplate.image }}
                style={styles.detailImage}
                contentFit="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.9)']}
                style={styles.detailImageGradient}
              />
              <Pressable style={styles.detailClose} onPress={() => setSelectedTemplate(null)}>
                <X size={24} color={colors.textLight} />
              </Pressable>
              <View style={styles.detailHeaderContent}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: category?.color || colors.primary },
                  ]}
                >
                  <Text style={styles.categoryBadgeText}>{selectedTemplate.category}</Text>
                </View>
                <Text style={styles.detailTitle}>{selectedTemplate.name}</Text>
                <View style={styles.detailLocation}>
                  <MapPin size={14} color={colors.textLight} />
                  <Text style={styles.detailLocationText}>
                    {selectedTemplate.destination.name}, {selectedTemplate.destination.country}
                  </Text>
                </View>
                <View style={styles.detailStats}>
                  <View style={styles.detailStat}>
                    <Star size={14} color="#FFC107" fill="#FFC107" />
                    <Text style={styles.detailStatText}>
                      {selectedTemplate.rating} ({selectedTemplate.reviewCount})
                    </Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Users size={14} color={colors.accent} />
                    <Text style={styles.detailStatText}>
                      {selectedTemplate.usageCount.toLocaleString()} used
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.detailBody}>
              <View style={styles.quickInfo}>
                <View style={styles.quickInfoItem}>
                  <Clock size={20} color={colors.primary} />
                  <Text style={styles.quickInfoLabel}>Duration</Text>
                  <Text style={styles.quickInfoValue}>{selectedTemplate.duration} days</Text>
                </View>
                <View style={styles.quickInfoItem}>
                  <DollarSign size={20} color={colors.primary} />
                  <Text style={styles.quickInfoLabel}>Budget</Text>
                  <Text style={styles.quickInfoValue}>
                    {selectedTemplate.estimatedBudget.currency}{' '}
                    {selectedTemplate.estimatedBudget.min.toLocaleString()}-
                    {selectedTemplate.estimatedBudget.max.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.quickInfoItem}>
                  <Calendar size={20} color={colors.primary} />
                  <Text style={styles.quickInfoLabel}>Best Season</Text>
                  <Text style={styles.quickInfoValue} numberOfLines={2}>
                    {selectedTemplate.bestSeason}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About This Trip</Text>
                <Text style={styles.description}>{selectedTemplate.description}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Highlights</Text>
                <View style={styles.highlightsList}>
                  {selectedTemplate.highlights.map((highlight, index) => (
                    <View key={index} style={styles.highlightItem}>
                      <Check size={16} color={colors.success} />
                      <Text style={styles.highlightText}>{highlight}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Best For</Text>
                <View style={styles.tagsList}>
                  {selectedTemplate.bestFor.map((item, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Day-by-Day Itinerary</Text>
                {selectedTemplate.dayPlans.map((day, index) => (
                  <View key={index} style={styles.dayCard}>
                    <View style={styles.dayHeader}>
                      <View style={styles.dayNumber}>
                        <Text style={styles.dayNumberText}>Day {day.day}</Text>
                      </View>
                      <Text style={styles.dayTheme}>{day.theme}</Text>
                    </View>
                    <View style={styles.dayActivities}>
                      {day.activities.slice(0, 3).map((activity, actIndex) => (
                        <View key={actIndex} style={styles.activityItem}>
                          <View style={styles.activityDot} />
                          <View style={styles.activityContent}>
                            <Text style={styles.activityName}>{activity.name}</Text>
                            <Text style={styles.activityMeta}>
                              {activity.duration} •{' '}
                              {activity.estimatedCost > 0
                                ? `${activity.currency} ${activity.estimatedCost}`
                                : 'Free'}
                            </Text>
                          </View>
                        </View>
                      ))}
                      {day.activities.length > 3 && (
                        <Text style={styles.moreActivities}>
                          +{day.activities.length - 3} more activities
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {selectedTemplate.accessibilityScore >= 3 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Accessibility</Text>
                  <View style={styles.accessibilityScore}>
                    <Accessibility size={20} color={colors.primary} />
                    <View style={styles.accessibilityStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <View
                          key={star}
                          style={[
                            styles.accessibilityStar,
                            star <= selectedTemplate.accessibilityScore &&
                              styles.accessibilityStarFilled,
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={styles.accessibilityLabel}>
                      {selectedTemplate.accessibilityScore >= 4
                        ? 'Highly Accessible'
                        : 'Moderately Accessible'}
                    </Text>
                  </View>
                  <View style={styles.accessibilityFeatures}>
                    {selectedTemplate.accessibilityFeatures.map((feature, index) => (
                      <View key={index} style={styles.accessibilityFeature}>
                        <Check size={14} color={colors.success} />
                        <Text style={styles.accessibilityFeatureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Packing Essentials</Text>
                <View style={styles.packingList}>
                  {selectedTemplate.packingEssentials.map((item, index) => (
                    <View key={index} style={styles.packingItem}>
                      <Text style={styles.packingItemText}>• {item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Local Tips</Text>
                {selectedTemplate.localTips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Sparkles size={14} color={colors.warning} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.detailFooter}>
            <View style={styles.priceInfo}>
              <Text style={styles.priceLabel}>Estimated Budget</Text>
              <Text style={styles.priceValue}>
                {selectedTemplate.estimatedBudget.currency}{' '}
                {selectedTemplate.estimatedBudget.min.toLocaleString()} -{' '}
                {selectedTemplate.estimatedBudget.max.toLocaleString()}
              </Text>
            </View>
            <Pressable
              style={styles.useTemplateButton}
              onPress={() => handleUseTemplate(selectedTemplate)}
            >
              <Text style={styles.useTemplateButtonText}>Use Template</Text>
              <ChevronRight size={20} color={colors.textLight} />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }, [selectedTemplate, handleUseTemplate]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.headerGradient}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.textLight} />
          </Pressable>
          <Text style={styles.headerTitle}>Trip Templates</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search templates, destinations..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {templateCategories.map(renderCategoryChip)}
          </ScrollView>

          {!selectedCategory && !searchQuery && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Featured Templates</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredScroll}
              >
                {featuredTemplates.map((template) => renderTemplateCard(template, true))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCategory
                  ? `${templateCategories.find((c) => c.id === selectedCategory)?.name} Templates`
                  : searchQuery
                    ? 'Search Results'
                    : 'All Templates'}
              </Text>
              <Text style={styles.resultsCount}>{filteredTemplates.length} templates</Text>
            </View>
            <View style={styles.templatesGrid}>
              {filteredTemplates.map((template) => renderTemplateCard(template))}
            </View>
            {filteredTemplates.length === 0 && (
              <View style={styles.emptyState}>
                <Search size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No templates found</Text>
                <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
              </View>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>

      {selectedTemplate && renderTemplateDetail()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textLight,
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    fontSize: 16,
    color: colors.text,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  featuredScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  templatesGrid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  templateCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    height: 200,
  },
  featuredCard: {
    width: width - 64,
    height: 220,
  },
  templateImage: {
    width: '100%',
    height: '100%',
  },
  featuredImage: {
    height: '100%',
  },
  templateGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textLight,
  },
  templateContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textLight,
    textTransform: 'capitalize',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 4,
  },
  templateLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  templateLocationText: {
    fontSize: 12,
    color: colors.textLight,
    opacity: 0.9,
  },
  templateInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  templateInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateInfoText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  bottomPadding: {
    height: 40,
  },
  detailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  detailContainer: {
    flex: 1,
  },
  detailHeader: {
    height: 300,
    position: 'relative',
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailImageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  detailClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textLight,
    marginTop: 8,
  },
  detailLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  detailLocationText: {
    fontSize: 14,
    color: colors.textLight,
    opacity: 0.9,
  },
  detailStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  detailStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailStatText: {
    fontSize: 13,
    color: colors.textLight,
  },
  detailBody: {
    padding: 20,
  },
  quickInfo: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  quickInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickInfoLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 6,
  },
  quickInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  highlightsList: {
    gap: 10,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  highlightText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  dayNumber: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dayNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
  },
  dayTheme: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  dayActivities: {
    paddingLeft: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryLight,
    marginTop: 6,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  activityMeta: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  moreActivities: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  accessibilityScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  accessibilityStars: {
    flexDirection: 'row',
    gap: 4,
  },
  accessibilityStar: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  accessibilityStarFilled: {
    backgroundColor: colors.primary,
  },
  accessibilityLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  accessibilityFeatures: {
    gap: 8,
  },
  accessibilityFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accessibilityFeatureText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  packingList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  packingItem: {
    width: '50%',
    paddingVertical: 4,
  },
  packingItemText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
    backgroundColor: colors.surfaceSecondary,
    padding: 12,
    borderRadius: 10,
  },
  tipText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  detailFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceInfo: {},
  priceLabel: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  useTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  useTemplateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
  },
});
