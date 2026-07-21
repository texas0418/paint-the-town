// Milestone Suggestions Service for Paint the Town
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CelebrationPackage,
  PersonalizedSuggestion,
  GiftIdea,
  MilestoneTheme,
  getPackagesForMilestone,
  getSuggestionsForMilestone,
  getGiftIdeasForMilestone,
  getThemeForMilestone,
  isSpecialMilestone,
  getNextSpecialMilestone,
  getMilestoneCountdown,
  CELEBRATION_PACKAGES,
  PERSONALIZED_SUGGESTIONS,
  SPECIAL_MILESTONE_YEARS,
} from '../mocks/milestoneSuggestions';
import { Anniversary, Milestone, PriceRange, SuggestionCategory } from '../types/anniversary';
import anniversaryService from './anniversaryService';

const STORAGE_KEYS = {
  SAVED_PACKAGES: '@w4nder/saved_packages',
  SAVED_SUGGESTIONS: '@w4nder/saved_suggestions',
  PREFERENCE_HISTORY: '@w4nder/preference_history',
};

export interface MilestoneInsights {
  yearsCompleting: number;
  isSpecialMilestone: boolean;
  theme?: MilestoneTheme;
  traditionalGift?: string;
  modernGift?: string;
  packages: CelebrationPackage[];
  suggestions: PersonalizedSuggestion[];
  giftIdeas: GiftIdea[];
  nextSpecialMilestone?: { years: number; yearsUntil: number };
}

export interface PreferenceProfile {
  preferredCategories: SuggestionCategory[];
  preferredPriceRange: PriceRange[];
  preferredEmotionalTones: string[];
  savedPackageIds: string[];
  savedSuggestionIds: string[];
  viewedItems: { id: string; timestamp: string }[];
}

export interface FilterOptions {
  categories?: SuggestionCategory[];
  priceRanges?: PriceRange[];
  emotionalTones?: ('romantic' | 'adventurous' | 'relaxing' | 'celebratory' | 'nostalgic')[];
  bookableOnly?: boolean;
}

class MilestoneSuggestionsService {
  // Get comprehensive insights for a milestone year
  getMilestoneInsights(yearsCompleting: number, milestone?: Milestone): MilestoneInsights {
    const isSpecial = isSpecialMilestone(yearsCompleting);
    const theme = getThemeForMilestone(yearsCompleting);
    const packages = getPackagesForMilestone(yearsCompleting);
    const suggestions = getSuggestionsForMilestone(yearsCompleting);
    const giftIdeas = getGiftIdeasForMilestone(yearsCompleting);
    const nextSpecial = getMilestoneCountdown(yearsCompleting);

    return {
      yearsCompleting,
      isSpecialMilestone: isSpecial,
      theme,
      traditionalGift: milestone?.traditionalGift,
      modernGift: milestone?.modernGift,
      packages: isSpecial ? packages : [],
      suggestions,
      giftIdeas,
      nextSpecialMilestone: nextSpecial,
    };
  }

  // Get insights for an anniversary by ID
  async getMilestoneInsightsForAnniversary(
    anniversaryId: string
  ): Promise<MilestoneInsights | null> {
    const upcoming = await anniversaryService.getUpcomingAnniversaries(365);
    const upcomingAnn = upcoming.find((u) => u.anniversary.id === anniversaryId);

    if (!upcomingAnn) {
      const anniversary = await anniversaryService.getAnniversaryById(anniversaryId);
      if (!anniversary) return null;

      // Calculate years manually
      const date = new Date(anniversary.date);
      const now = new Date();
      let years = now.getFullYear() - date.getFullYear();
      if (
        now.getMonth() < date.getMonth() ||
        (now.getMonth() === date.getMonth() && now.getDate() < date.getDate())
      ) {
        years++;
      }
      return this.getMilestoneInsights(years);
    }

    return this.getMilestoneInsights(upcomingAnn.yearsCompleting, upcomingAnn.milestone);
  }

  // Filter packages by criteria
  filterPackages(packages: CelebrationPackage[], options: FilterOptions): CelebrationPackage[] {
    return packages.filter((pkg) => {
      if (options.priceRanges && options.priceRanges.length > 0) {
        if (!options.priceRanges.includes(pkg.priceRange)) return false;
      }
      return true;
    });
  }

  // Filter suggestions by criteria
  filterSuggestions(
    suggestions: PersonalizedSuggestion[],
    options: FilterOptions
  ): PersonalizedSuggestion[] {
    return suggestions.filter((sug) => {
      if (options.categories && options.categories.length > 0) {
        if (!options.categories.includes(sug.category)) return false;
      }
      if (options.priceRanges && options.priceRanges.length > 0) {
        if (!options.priceRanges.includes(sug.priceRange)) return false;
      }
      if (options.emotionalTones && options.emotionalTones.length > 0) {
        if (!options.emotionalTones.includes(sug.emotionalTone)) return false;
      }
      if (options.bookableOnly && !sug.bookable) return false;
      return true;
    });
  }

  // Saved packages management
  async getSavedPackages(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_PACKAGES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting saved packages:', error);
      return [];
    }
  }

  async toggleSavePackage(packageId: string): Promise<boolean> {
    const saved = await this.getSavedPackages();
    const index = saved.indexOf(packageId);

    if (index === -1) {
      saved.push(packageId);
    } else {
      saved.splice(index, 1);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_PACKAGES, JSON.stringify(saved));
    return index === -1; // Returns true if now saved
  }

  async isPackageSaved(packageId: string): Promise<boolean> {
    const saved = await this.getSavedPackages();
    return saved.includes(packageId);
  }

  // Saved suggestions management
  async getSavedSuggestions(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_SUGGESTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting saved suggestions:', error);
      return [];
    }
  }

  async toggleSaveSuggestion(suggestionId: string): Promise<boolean> {
    const saved = await this.getSavedSuggestions();
    const index = saved.indexOf(suggestionId);

    if (index === -1) {
      saved.push(suggestionId);
    } else {
      saved.splice(index, 1);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_SUGGESTIONS, JSON.stringify(saved));
    return index === -1;
  }

  async isSuggestionSaved(suggestionId: string): Promise<boolean> {
    const saved = await this.getSavedSuggestions();
    return saved.includes(suggestionId);
  }

  // Get featured packages across all milestones
  getFeaturedPackages(): CelebrationPackage[] {
    return CELEBRATION_PACKAGES.filter((p) => p.featured);
  }

  // Get all available special milestone years
  getSpecialMilestoneYears(): number[] {
    return [...SPECIAL_MILESTONE_YEARS];
  }

  // Search packages and suggestions
  searchIdeas(
    query: string,
    yearsCompleting?: number
  ): {
    packages: CelebrationPackage[];
    suggestions: PersonalizedSuggestion[];
    giftIdeas: GiftIdea[];
  } {
    const lowerQuery = query.toLowerCase();

    let packages = CELEBRATION_PACKAGES;
    let suggestions = PERSONALIZED_SUGGESTIONS;
    let giftIdeas: GiftIdea[] = [];

    // Filter by year if provided
    if (yearsCompleting !== undefined) {
      packages = getPackagesForMilestone(yearsCompleting);
      suggestions = getSuggestionsForMilestone(yearsCompleting);
      giftIdeas = getGiftIdeasForMilestone(yearsCompleting);
    }

    // Search in packages
    const matchedPackages = packages.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.themes.some((t) => t.toLowerCase().includes(lowerQuery)) ||
        p.highlights.some((h) => h.toLowerCase().includes(lowerQuery))
    );

    // Search in suggestions
    const matchedSuggestions = suggestions.filter(
      (s) =>
        s.title.toLowerCase().includes(lowerQuery) ||
        s.description.toLowerCase().includes(lowerQuery) ||
        s.themes.some((t) => t.toLowerCase().includes(lowerQuery)) ||
        s.bestFor.some((b) => b.toLowerCase().includes(lowerQuery))
    );

    // Search in gift ideas
    const matchedGifts = giftIdeas.filter(
      (g) =>
        g.name.toLowerCase().includes(lowerQuery) ||
        g.description.toLowerCase().includes(lowerQuery) ||
        g.traditionalTie.toLowerCase().includes(lowerQuery)
    );

    return {
      packages: matchedPackages,
      suggestions: matchedSuggestions,
      giftIdeas: matchedGifts,
    };
  }

  // Get budget-friendly options
  getBudgetFriendlyIdeas(
    yearsCompleting: number,
    maxPrice: PriceRange = '$$'
  ): {
    suggestions: PersonalizedSuggestion[];
    giftIdeas: GiftIdea[];
  } {
    const priceOrder: PriceRange[] = ['$', '$$', '$$$', '$$$$', '$$$$$'];
    const maxIndex = priceOrder.indexOf(maxPrice);

    const suggestions = getSuggestionsForMilestone(yearsCompleting).filter(
      (s) => priceOrder.indexOf(s.priceRange) <= maxIndex
    );

    const giftIdeas = getGiftIdeasForMilestone(yearsCompleting).filter(
      (g) => priceOrder.indexOf(g.priceRange) <= maxIndex
    );

    return { suggestions, giftIdeas };
  }

  // Get recommendations based on category preference
  getRecommendationsByCategory(
    yearsCompleting: number,
    category: SuggestionCategory
  ): PersonalizedSuggestion[] {
    return getSuggestionsForMilestone(yearsCompleting).filter((s) => s.category === category);
  }

  // Generate a personalized celebration plan
  generateCelebrationPlan(
    yearsCompleting: number,
    budget: PriceRange,
    preferences: {
      preferAdventure?: boolean;
      preferRelaxation?: boolean;
      preferNostalgia?: boolean;
    }
  ): {
    package?: CelebrationPackage;
    mainSuggestion?: PersonalizedSuggestion;
    additionalIdeas: PersonalizedSuggestion[];
    giftIdea?: GiftIdea;
  } {
    const priceOrder: PriceRange[] = ['$', '$$', '$$$', '$$$$', '$$$$$'];
    const budgetIndex = priceOrder.indexOf(budget);

    // Find matching package
    const packages = getPackagesForMilestone(yearsCompleting).filter(
      (p) => priceOrder.indexOf(p.priceRange) <= budgetIndex
    );

    const selectedPackage =
      packages.length > 0 ? packages[Math.floor(Math.random() * packages.length)] : undefined;

    // Determine emotional tone preference
    let preferredTone: 'romantic' | 'adventurous' | 'relaxing' | 'celebratory' | 'nostalgic' =
      'celebratory';
    if (preferences.preferAdventure) preferredTone = 'adventurous';
    else if (preferences.preferRelaxation) preferredTone = 'relaxing';
    else if (preferences.preferNostalgia) preferredTone = 'nostalgic';

    // Find matching suggestions
    const suggestions = getSuggestionsForMilestone(yearsCompleting).filter(
      (s) => priceOrder.indexOf(s.priceRange) <= budgetIndex
    );

    const mainSuggestion =
      suggestions.find((s) => s.emotionalTone === preferredTone) || suggestions[0];
    const additionalIdeas = suggestions.filter((s) => s.id !== mainSuggestion?.id).slice(0, 3);

    // Find gift idea
    const giftIdeas = getGiftIdeasForMilestone(yearsCompleting).filter(
      (g) => priceOrder.indexOf(g.priceRange) <= budgetIndex
    );
    const giftIdea =
      giftIdeas.length > 0 ? giftIdeas[Math.floor(Math.random() * giftIdeas.length)] : undefined;

    return {
      package: selectedPackage,
      mainSuggestion,
      additionalIdeas,
      giftIdea,
    };
  }

  // Get upcoming milestones with celebration ideas
  async getUpcomingMilestoneIdeas(daysAhead: number = 180): Promise<
    {
      anniversary: Anniversary;
      yearsCompleting: number;
      daysUntil: number;
      insights: MilestoneInsights;
    }[]
  > {
    const upcoming = await anniversaryService.getUpcomingAnniversaries(daysAhead);

    return upcoming.map((u) => ({
      anniversary: u.anniversary,
      yearsCompleting: u.yearsCompleting,
      daysUntil: u.daysUntil,
      insights: this.getMilestoneInsights(u.yearsCompleting, u.milestone),
    }));
  }
}

export const milestoneSuggestionsService = new MilestoneSuggestionsService();
export default milestoneSuggestionsService;
