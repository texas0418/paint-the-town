// Milestone Detail Screen for Paint the Town
// Showcases special suggestions and celebration ideas for milestone anniversaries
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Share,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import milestoneSuggestionsService, {
  MilestoneInsights,
} from '../services/milestoneSuggestionsService';
import {
  CelebrationPackage,
  PersonalizedSuggestion,
  GiftIdea,
  MilestoneTheme,
  MILESTONE_THEMES,
} from '../mocks/milestoneSuggestions';
import { Anniversary, Milestone, PriceRange } from '../types/anniversary';
import anniversaryService from '../services/anniversaryService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 64;

interface MilestoneDetailScreenProps {
  navigation: any;
  route: {
    params: {
      anniversaryId: string;
      yearsCompleting: number;
    };
  };
}

// Theme gradient colors by milestone level
const THEME_GRADIENTS: Record<string, [string, string, string]> = {
  fresh_start: ['#7CB342', '#8BC34A', '#9CCC65'],
  solid_foundation: ['#8D6E63', '#A1887F', '#BCAAA4'],
  golden_moments: ['#FFB300', '#FFC107', '#FFD54F'],
  silver_celebration: ['#78909C', '#90A4AE', '#B0BEC5'],
  timeless_love: ['#7E57C2', '#9575CD', '#B39DDB'],
  default: ['#FF6B6B', '#FF8E8E', '#FFB4B4'],
};

// Emoji for price ranges
const PRICE_EMOJI: Record<PriceRange, string> = {
  $: '💰',
  $$: '💰💰',
  $$$: '💰💰💰',
  $$$$: '💰💰💰💰',
  $$$$$: '💎',
};

export const MilestoneDetailScreen: React.FC<MilestoneDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { anniversaryId, yearsCompleting } = route.params;

  const [anniversary, setAnniversary] = useState<Anniversary | null>(null);
  const [insights, setInsights] = useState<MilestoneInsights | null>(null);
  const [savedPackages, setSavedPackages] = useState<string[]>([]);
  const [savedSuggestions, setSavedSuggestions] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CelebrationPackage | null>(null);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'packages' | 'ideas' | 'gifts'>('packages');

  // Animation
  const scrollY = new Animated.Value(0);
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const loadData = useCallback(async () => {
    // Load anniversary
    const ann = await anniversaryService.getAnniversaryById(anniversaryId);
    setAnniversary(ann);

    // Load milestone insights
    const milestoneInsights = milestoneSuggestionsService.getMilestoneInsights(yearsCompleting);
    setInsights(milestoneInsights);

    // Load saved items
    const packages = await milestoneSuggestionsService.getSavedPackages();
    const suggestions = await milestoneSuggestionsService.getSavedSuggestions();
    setSavedPackages(packages);
    setSavedSuggestions(suggestions);
  }, [anniversaryId, yearsCompleting]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const theme = useMemo(() => {
    return (
      insights?.theme || MILESTONE_THEMES.find((t) => t.milestoneYears.includes(yearsCompleting))
    );
  }, [insights, yearsCompleting]);

  const gradientColors = useMemo(() => {
    return THEME_GRADIENTS[theme?.id || 'default'];
  }, [theme]);

  const handleToggleSavePackage = async (packageId: string) => {
    const isSaved = await milestoneSuggestionsService.toggleSavePackage(packageId);
    setSavedPackages((prev) =>
      isSaved ? [...prev, packageId] : prev.filter((id) => id !== packageId)
    );
  };

  const handleToggleSaveSuggestion = async (suggestionId: string) => {
    const isSaved = await milestoneSuggestionsService.toggleSaveSuggestion(suggestionId);
    setSavedSuggestions((prev) =>
      isSaved ? [...prev, suggestionId] : prev.filter((id) => id !== suggestionId)
    );
  };

  const handleShareMilestone = async () => {
    try {
      await Share.share({
        message: `🎉 We're celebrating our ${yearsCompleting} year anniversary! ${theme?.emoji || '💕'}`,
        title: `${yearsCompleting} Year Anniversary`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handlePlanCelebration = () => {
    navigation.navigate('CelebrationPlanner', {
      anniversaryId,
      yearsCompleting,
      theme: theme?.id,
    });
  };

  const renderHeroSection = () => (
    <LinearGradient colors={gradientColors} style={styles.heroSection}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.shareButton} onPress={handleShareMilestone}>
        <Text style={styles.shareButtonText}>📤</Text>
      </TouchableOpacity>

      <View style={styles.heroContent}>
        <Text style={styles.milestoneEmoji}>{theme?.emoji || '💕'}</Text>
        <Text style={styles.yearsText}>{yearsCompleting}</Text>
        <Text style={styles.yearsLabel}>{yearsCompleting === 1 ? 'Year' : 'Years'}</Text>

        {theme && (
          <View style={styles.themeTag}>
            <Text style={styles.themeTagText}>{theme.name}</Text>
          </View>
        )}

        {anniversary && <Text style={styles.anniversaryName}>{anniversary.name}</Text>}

        {/* Traditional/Modern Gift Display */}
        {(insights?.traditionalGift || insights?.modernGift) && (
          <View style={styles.giftThemes}>
            {insights.traditionalGift && (
              <View style={styles.giftThemePill}>
                <Text style={styles.giftThemeLabel}>Traditional</Text>
                <Text style={styles.giftThemeValue}>{insights.traditionalGift}</Text>
              </View>
            )}
            {insights.modernGift && (
              <View style={styles.giftThemePill}>
                <Text style={styles.giftThemeLabel}>Modern</Text>
                <Text style={styles.giftThemeValue}>{insights.modernGift}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {insights?.isSpecialMilestone && (
        <View style={styles.specialBadge}>
          <Text style={styles.specialBadgeText}>✨ Special Milestone</Text>
        </View>
      )}
    </LinearGradient>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'packages' && styles.tabActive]}
        onPress={() => setActiveTab('packages')}
      >
        <Text style={[styles.tabText, activeTab === 'packages' && styles.tabTextActive]}>
          🎁 Packages
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'ideas' && styles.tabActive]}
        onPress={() => setActiveTab('ideas')}
      >
        <Text style={[styles.tabText, activeTab === 'ideas' && styles.tabTextActive]}>
          💡 Ideas
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'gifts' && styles.tabActive]}
        onPress={() => setActiveTab('gifts')}
      >
        <Text style={[styles.tabText, activeTab === 'gifts' && styles.tabTextActive]}>
          🎀 Gifts
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPackageCard = (pkg: CelebrationPackage) => {
    const isSaved = savedPackages.includes(pkg.id);

    return (
      <TouchableOpacity
        key={pkg.id}
        style={styles.packageCard}
        onPress={() => {
          setSelectedPackage(pkg);
          setShowPackageModal(true);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
          style={styles.packageCardGradient}
        >
          {pkg.featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>⭐ Featured</Text>
            </View>
          )}

          <View style={styles.packageHeader}>
            <View style={styles.packageTitleRow}>
              <Text style={styles.packageName}>{pkg.name}</Text>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleToggleSavePackage(pkg.id)}
              >
                <Text style={styles.saveButtonText}>{isSaved ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.packageTagline}>{pkg.tagline}</Text>
          </View>

          <View style={styles.packageMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Duration</Text>
              <Text style={styles.metaValue}>
                {pkg.durationDays} {pkg.durationDays === 1 ? 'Day' : 'Days'}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Price Range</Text>
              <Text style={styles.metaValue}>{PRICE_EMOJI[pkg.priceRange]}</Text>
            </View>
          </View>

          <View style={styles.highlightsContainer}>
            {pkg.highlights.slice(0, 3).map((highlight, index) => (
              <View key={index} style={styles.highlightItem}>
                <Text style={styles.highlightDot}>•</Text>
                <Text style={styles.highlightText}>{highlight}</Text>
              </View>
            ))}
          </View>

          <View style={styles.packageFooter}>
            <View style={styles.themeTags}>
              {pkg.themes.slice(0, 3).map((themeTag, index) => (
                <View key={index} style={styles.themeChip}>
                  <Text style={styles.themeChipText}>{themeTag}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View Details →</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderSuggestionCard = (suggestion: PersonalizedSuggestion) => {
    const isSaved = savedSuggestions.includes(suggestion.id);
    const emotionEmojis: Record<string, string> = {
      romantic: '💕',
      adventurous: '🚀',
      relaxing: '🧘',
      celebratory: '🎉',
      nostalgic: '📸',
    };

    return (
      <View key={suggestion.id} style={styles.suggestionCard}>
        <View style={styles.suggestionHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {suggestion.category === 'restaurant'
                ? '🍽️'
                : suggestion.category === 'experience'
                  ? '🎯'
                  : suggestion.category === 'getaway'
                    ? '🏝️'
                    : suggestion.category === 'spa'
                      ? '🧘'
                      : suggestion.category === 'activity'
                        ? '🎨'
                        : suggestion.category === 'entertainment'
                          ? '🎭'
                          : '🎁'}{' '}
              {suggestion.category}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleToggleSaveSuggestion(suggestion.id)}>
            <Text style={styles.saveIcon}>{isSaved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
        <Text style={styles.suggestionSubtitle}>{suggestion.subtitle}</Text>
        <Text style={styles.suggestionDescription}>{suggestion.description}</Text>

        <View style={styles.suggestionMeta}>
          <Text style={styles.suggestionPrice}>{suggestion.priceRange}</Text>
          <Text style={styles.suggestionEmotion}>
            {emotionEmojis[suggestion.emotionalTone]} {suggestion.emotionalTone}
          </Text>
        </View>

        <View style={styles.bestForContainer}>
          <Text style={styles.bestForLabel}>Best for:</Text>
          <View style={styles.bestForTags}>
            {suggestion.bestFor.map((item, index) => (
              <Text key={index} style={styles.bestForTag}>
                {item}
              </Text>
            ))}
          </View>
        </View>

        {suggestion.tips.length > 0 && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
            {suggestion.tips.map((tip, index) => (
              <Text key={index} style={styles.tipItem}>
                • {tip}
              </Text>
            ))}
          </View>
        )}

        {suggestion.bookable && (
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => {
              navigation.navigate('Suggestions', {
                anniversaryId,
                prefilter: suggestion.category,
              });
            }}
          >
            <Text style={styles.bookButtonText}>Find & Book →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderGiftCard = (gift: GiftIdea) => (
    <View key={gift.id} style={styles.giftCard}>
      <View style={styles.giftHeader}>
        <Text style={styles.giftName}>{gift.name}</Text>
        <Text style={styles.giftPrice}>{gift.priceRange}</Text>
      </View>

      <Text style={styles.giftDescription}>{gift.description}</Text>

      <View style={styles.giftMeta}>
        <View style={styles.traditionalTie}>
          <Text style={styles.traditionalTieLabel}>Traditional tie:</Text>
          <Text style={styles.traditionalTieValue}>{gift.traditionalTie}</Text>
        </View>
        {gift.personalizable && (
          <View style={styles.personalizableBadge}>
            <Text style={styles.personalizableBadgeText}>✨ Personalizable</Text>
          </View>
        )}
      </View>

      <View style={styles.whereToFind}>
        <Text style={styles.whereToFindLabel}>Where to find:</Text>
        <Text style={styles.whereToFindValue}>{gift.whereToFind}</Text>
      </View>
    </View>
  );

  const renderPackagesTab = () => {
    if (!insights?.isSpecialMilestone || insights.packages.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>No Celebration Packages</Text>
          <Text style={styles.emptySubtitle}>
            Curated packages are available for special milestone years (1, 5, 10, 15, 20, 25, 30,
            40, 50, 60)
          </Text>
          {insights?.nextSpecialMilestone && (
            <View style={styles.nextMilestoneInfo}>
              <Text style={styles.nextMilestoneText}>
                🎯 Next special milestone: Year {insights.nextSpecialMilestone.years}
                {'\n'}({insights.nextSpecialMilestone.yearsUntil} years away)
              </Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.packagesContainer}>
        {insights.packages.map((pkg) => renderPackageCard(pkg))}
      </View>
    );
  };

  const renderIdeasTab = () => {
    if (!insights || insights.suggestions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💡</Text>
          <Text style={styles.emptyTitle}>No Suggestions Yet</Text>
          <Text style={styles.emptySubtitle}>
            Check back later for personalized celebration ideas
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.ideasContainer}>
        {insights.suggestions.map((suggestion) => renderSuggestionCard(suggestion))}
      </View>
    );
  };

  const renderGiftsTab = () => {
    if (!insights || insights.giftIdeas.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎁</Text>
          <Text style={styles.emptyTitle}>No Gift Ideas</Text>
          <Text style={styles.emptySubtitle}>
            Gift suggestions are curated for special milestone years
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.giftsContainer}>
        {insights.giftIdeas.map((gift) => renderGiftCard(gift))}
      </View>
    );
  };

  const renderPackageModal = () => (
    <Modal
      visible={showPackageModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowPackageModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowPackageModal(false)}>
            <Text style={styles.modalClose}>✕ Close</Text>
          </TouchableOpacity>
          {selectedPackage && (
            <TouchableOpacity onPress={() => handleToggleSavePackage(selectedPackage.id)}>
              <Text style={styles.modalSave}>
                {savedPackages.includes(selectedPackage.id) ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {selectedPackage && (
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHero}>
              <Text style={styles.modalPackageName}>{selectedPackage.name}</Text>
              <Text style={styles.modalPackageTagline}>{selectedPackage.tagline}</Text>
            </View>

            <View style={styles.modalMetaRow}>
              <View style={styles.modalMetaItem}>
                <Text style={styles.modalMetaLabel}>Duration</Text>
                <Text style={styles.modalMetaValue}>
                  {selectedPackage.durationDays}{' '}
                  {selectedPackage.durationDays === 1 ? 'Day' : 'Days'}
                </Text>
              </View>
              <View style={styles.modalMetaItem}>
                <Text style={styles.modalMetaLabel}>Investment</Text>
                <Text style={styles.modalMetaValue}>{selectedPackage.priceRange}</Text>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>About This Package</Text>
              <Text style={styles.modalDescription}>{selectedPackage.description}</Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>What's Included</Text>
              {selectedPackage.includes.map((item, index) => (
                <View key={index} style={styles.inclusionItem}>
                  <View style={styles.inclusionIcon}>
                    <Text style={styles.inclusionIconText}>
                      {item.category === 'restaurant'
                        ? '🍽️'
                        : item.category === 'experience'
                          ? '🎯'
                          : item.category === 'getaway'
                            ? '🏨'
                            : item.category === 'spa'
                              ? '🧘'
                              : item.category === 'activity'
                                ? '🎨'
                                : item.category === 'gift'
                                  ? '🎁'
                                  : '✨'}
                    </Text>
                  </View>
                  <View style={styles.inclusionContent}>
                    <Text style={styles.inclusionTitle}>{item.title}</Text>
                    <Text style={styles.inclusionDescription}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Highlights</Text>
              {selectedPackage.highlights.map((highlight, index) => (
                <View key={index} style={styles.modalHighlightItem}>
                  <Text style={styles.modalHighlightIcon}>✓</Text>
                  <Text style={styles.modalHighlightText}>{highlight}</Text>
                </View>
              ))}
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Themes</Text>
              <View style={styles.modalThemes}>
                {selectedPackage.themes.map((themeTag, index) => (
                  <View key={index} style={styles.modalThemeChip}>
                    <Text style={styles.modalThemeChipText}>{themeTag}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.planWithPackageButton}
              onPress={() => {
                setShowPackageModal(false);
                navigation.navigate('CelebrationPlanner', {
                  anniversaryId,
                  yearsCompleting,
                  packageId: selectedPackage.id,
                });
              }}
            >
              <Text style={styles.planWithPackageButtonText}>
                Plan Celebration with This Package
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header (appears on scroll) */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <LinearGradient colors={gradientColors} style={styles.stickyHeaderGradient}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.stickyBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.stickyTitle}>
            {yearsCompleting} Year {theme?.emoji}
          </Text>
          <TouchableOpacity onPress={handleShareMilestone}>
            <Text style={styles.stickyShareText}>📤</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {renderHeroSection()}
        {renderTabBar()}

        <View style={styles.tabContent}>
          {activeTab === 'packages' && renderPackagesTab()}
          {activeTab === 'ideas' && renderIdeasTab()}
          {activeTab === 'gifts' && renderGiftsTab()}
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handlePlanCelebration}>
        <LinearGradient colors={gradientColors} style={styles.fabGradient}>
          <Text style={styles.fabIcon}>✨</Text>
          <Text style={styles.fabText}>Plan Celebration</Text>
        </LinearGradient>
      </TouchableOpacity>

      {renderPackageModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  stickyHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  stickyBackText: {
    fontSize: 24,
    color: 'white',
  },
  stickyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  stickyShareText: {
    fontSize: 20,
  },
  heroSection: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: 'white',
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 22,
  },
  heroContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  milestoneEmoji: {
    fontSize: 60,
    marginBottom: 8,
  },
  yearsText: {
    fontSize: 72,
    fontWeight: '800',
    color: 'white',
    lineHeight: 80,
  },
  yearsLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginTop: -8,
  },
  themeTag: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  themeTagText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  anniversaryName: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 12,
    textAlign: 'center',
  },
  giftThemes: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  giftThemePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  giftThemeLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  giftThemeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    marginTop: 2,
  },
  specialBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  specialBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -15,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#F0F0F0',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#333',
  },
  tabContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  packagesContainer: {
    gap: 16,
  },
  packageCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  packageCardGradient: {
    padding: 20,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
  },
  packageHeader: {
    marginBottom: 16,
  },
  packageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  packageName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 12,
  },
  saveButton: {
    padding: 4,
  },
  saveButtonText: {
    fontSize: 20,
  },
  packageTagline: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  packageMeta: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  metaDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  highlightsContainer: {
    marginBottom: 16,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  highlightDot: {
    fontSize: 16,
    color: '#FF6B6B',
    marginRight: 8,
    lineHeight: 22,
  },
  highlightText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  packageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeTags: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  themeChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  themeChipText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  ideasContainer: {
    gap: 16,
  },
  suggestionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'capitalize',
  },
  saveIcon: {
    fontSize: 20,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  suggestionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  suggestionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 12,
  },
  suggestionPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  suggestionEmotion: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  bestForContainer: {
    marginBottom: 12,
  },
  bestForLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  bestForTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  bestForTag: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tipsContainer: {
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  bookButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  giftsContainer: {
    gap: 16,
  },
  giftCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  giftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  giftName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 12,
  },
  giftPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  giftDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  giftMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  traditionalTie: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  traditionalTieLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 6,
  },
  traditionalTieValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  personalizableBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  personalizableBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
  },
  whereToFind: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
  },
  whereToFindLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  whereToFindValue: {
    fontSize: 13,
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
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
    lineHeight: 22,
  },
  nextMilestoneInfo: {
    marginTop: 20,
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextMilestoneText: {
    fontSize: 14,
    color: '#D4AF37',
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  fabIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  fabText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  modalClose: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  modalSave: {
    fontSize: 24,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalHero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalPackageName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  modalPackageTagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalMetaRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modalMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  modalMetaLabel: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalMetaValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B6B',
    marginTop: 4,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  inclusionItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inclusionIcon: {
    width: 44,
    height: 44,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  inclusionIconText: {
    fontSize: 20,
  },
  inclusionContent: {
    flex: 1,
  },
  inclusionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  inclusionDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  modalHighlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  modalHighlightIcon: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 10,
    fontWeight: '700',
  },
  modalHighlightText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  modalThemes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalThemeChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  modalThemeChipText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  planWithPackageButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  planWithPackageButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});

export default MilestoneDetailScreen;
