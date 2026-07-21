// Celebration Planner Screen for Paint the Town
// Interactive wizard to create personalized celebration plans
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import milestoneSuggestionsService from '../services/milestoneSuggestionsService';
import {
  CelebrationPackage,
  PersonalizedSuggestion,
  GiftIdea,
  getPackagesForMilestone,
  getSuggestionsForMilestone,
  getGiftIdeasForMilestone,
} from '../mocks/milestoneSuggestions';
import { PriceRange, SuggestionCategory } from '../types/anniversary';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface CelebrationPlannerScreenProps {
  navigation: any;
  route: {
    params: {
      anniversaryId: string;
      yearsCompleting: number;
      theme?: string;
      packageId?: string;
    };
  };
}

interface CelebrationPlan {
  id: string;
  anniversaryId: string;
  yearsCompleting: number;
  name: string;
  budget: PriceRange;
  preferences: {
    adventurous: boolean;
    relaxing: boolean;
    nostalgic: boolean;
    romantic: boolean;
  };
  selectedPackage?: CelebrationPackage;
  selectedSuggestions: PersonalizedSuggestion[];
  selectedGift?: GiftIdea;
  notes: string;
  createdAt: string;
}

const BUDGET_OPTIONS: { value: PriceRange; label: string; description: string; emoji: string }[] = [
  { value: '$', label: 'Budget-Friendly', description: 'Sweet gestures under $100', emoji: '💚' },
  { value: '$$', label: 'Moderate', description: 'Nice experiences $100-300', emoji: '💙' },
  { value: '$$$', label: 'Splurge', description: 'Special treats $300-1000', emoji: '💜' },
  { value: '$$$$', label: 'Luxury', description: 'Premium experiences $1000+', emoji: '💛' },
  {
    value: '$$$$$',
    label: 'Ultimate',
    description: 'No limits - make it unforgettable',
    emoji: '💎',
  },
];

const PREFERENCE_OPTIONS = [
  {
    key: 'adventurous',
    label: 'Adventurous',
    emoji: '🚀',
    description: 'Try something new & exciting',
  },
  { key: 'relaxing', label: 'Relaxing', emoji: '🧘', description: 'Unwind and reconnect' },
  { key: 'nostalgic', label: 'Nostalgic', emoji: '📸', description: 'Celebrate your journey' },
  { key: 'romantic', label: 'Romantic', emoji: '💕', description: 'Classic love & intimacy' },
];

const STORAGE_KEY = '@w4nder/celebration_plans';

type WizardStep = 'budget' | 'preferences' | 'package' | 'ideas' | 'gift' | 'review';

export const CelebrationPlannerScreen: React.FC<CelebrationPlannerScreenProps> = ({
  navigation,
  route,
}) => {
  const { anniversaryId, yearsCompleting, theme, packageId } = route.params;

  const [currentStep, setCurrentStep] = useState<WizardStep>('budget');
  const [planName, setPlanName] = useState(`Year ${yearsCompleting} Celebration`);
  const [selectedBudget, setSelectedBudget] = useState<PriceRange | null>(null);
  const [preferences, setPreferences] = useState({
    adventurous: false,
    relaxing: false,
    nostalgic: false,
    romantic: false,
  });
  const [selectedPackage, setSelectedPackage] = useState<CelebrationPackage | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<PersonalizedSuggestion[]>([]);
  const [selectedGift, setSelectedGift] = useState<GiftIdea | null>(null);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Get available options based on budget
  const availablePackages = useMemo(() => {
    if (!selectedBudget) return [];
    const priceOrder: PriceRange[] = ['$', '$$', '$$$', '$$$$', '$$$$$'];
    const budgetIndex = priceOrder.indexOf(selectedBudget);
    return getPackagesForMilestone(yearsCompleting).filter(
      (p) => priceOrder.indexOf(p.priceRange) <= budgetIndex
    );
  }, [selectedBudget, yearsCompleting]);

  const availableSuggestions = useMemo(() => {
    if (!selectedBudget) return [];
    const priceOrder: PriceRange[] = ['$', '$$', '$$$', '$$$$', '$$$$$'];
    const budgetIndex = priceOrder.indexOf(selectedBudget);

    let suggestions = getSuggestionsForMilestone(yearsCompleting).filter(
      (s) => priceOrder.indexOf(s.priceRange) <= budgetIndex
    );

    // Filter by preferences if any are selected
    const activePrefs = Object.entries(preferences)
      .filter(([_, active]) => active)
      .map(([key]) => key);

    if (activePrefs.length > 0) {
      suggestions = suggestions.filter((s) => {
        if (activePrefs.includes('adventurous') && s.emotionalTone === 'adventurous') return true;
        if (activePrefs.includes('relaxing') && s.emotionalTone === 'relaxing') return true;
        if (activePrefs.includes('nostalgic') && s.emotionalTone === 'nostalgic') return true;
        if (activePrefs.includes('romantic') && s.emotionalTone === 'romantic') return true;
        return activePrefs.length === 0;
      });
    }

    return suggestions;
  }, [selectedBudget, yearsCompleting, preferences]);

  const availableGifts = useMemo(() => {
    if (!selectedBudget) return [];
    const priceOrder: PriceRange[] = ['$', '$$', '$$$', '$$$$', '$$$$$'];
    const budgetIndex = priceOrder.indexOf(selectedBudget);
    return getGiftIdeasForMilestone(yearsCompleting).filter(
      (g) => priceOrder.indexOf(g.priceRange) <= budgetIndex
    );
  }, [selectedBudget, yearsCompleting]);

  const togglePreference = (key: string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const toggleSuggestion = (suggestion: PersonalizedSuggestion) => {
    setSelectedSuggestions((prev) => {
      const exists = prev.find((s) => s.id === suggestion.id);
      if (exists) {
        return prev.filter((s) => s.id !== suggestion.id);
      }
      if (prev.length >= 5) {
        Alert.alert('Maximum Selected', 'You can select up to 5 celebration ideas');
        return prev;
      }
      return [...prev, suggestion];
    });
  };

  const steps: WizardStep[] = ['budget', 'preferences', 'package', 'ideas', 'gift', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 'budget':
        return selectedBudget !== null;
      case 'preferences':
        return true; // Preferences are optional
      case 'package':
        return true; // Package is optional
      case 'ideas':
        return true; // Ideas are optional but we encourage at least one
      case 'gift':
        return true; // Gift is optional
      case 'review':
        return true;
      default:
        return true;
    }
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    } else {
      navigation.goBack();
    }
  };

  const savePlan = async () => {
    setIsSaving(true);
    try {
      const plan: CelebrationPlan = {
        id: `plan_${Date.now()}`,
        anniversaryId,
        yearsCompleting,
        name: planName,
        budget: selectedBudget!,
        preferences,
        selectedPackage: selectedPackage || undefined,
        selectedSuggestions,
        selectedGift: selectedGift || undefined,
        notes,
        createdAt: new Date().toISOString(),
      };

      // Load existing plans
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      const existingPlans: CelebrationPlan[] = existingData ? JSON.parse(existingData) : [];

      // Add new plan
      existingPlans.push(plan);

      // Save
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existingPlans));

      Alert.alert(
        '🎉 Plan Saved!',
        'Your celebration plan has been saved. You can access it from your anniversary details.',
        [
          {
            text: 'Share Plan',
            onPress: () => sharePlan(plan),
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving plan:', error);
      Alert.alert('Error', 'Failed to save plan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const sharePlan = async (plan: CelebrationPlan) => {
    const planText = generatePlanText(plan);
    try {
      await Share.share({
        message: planText,
        title: plan.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const generatePlanText = (plan: CelebrationPlan): string => {
    let text = `🎉 ${plan.name}\n`;
    text += `Year ${plan.yearsCompleting} Anniversary Celebration Plan\n\n`;

    text += `💰 Budget: ${plan.budget}\n\n`;

    if (plan.selectedPackage) {
      text += `📦 Package: ${plan.selectedPackage.name}\n`;
      text += `${plan.selectedPackage.description}\n\n`;
    }

    if (plan.selectedSuggestions.length > 0) {
      text += `💡 Celebration Ideas:\n`;
      plan.selectedSuggestions.forEach((s, i) => {
        text += `${i + 1}. ${s.title}\n`;
      });
      text += '\n';
    }

    if (plan.selectedGift) {
      text += `🎁 Gift Idea: ${plan.selectedGift.name}\n`;
      text += `${plan.selectedGift.description}\n\n`;
    }

    if (plan.notes) {
      text += `📝 Notes: ${plan.notes}\n`;
    }

    text += '\n— Created with Paint the Town 💕';

    return text;
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.stepText}>
        Step {currentStepIndex + 1} of {steps.length}
      </Text>
    </View>
  );

  const renderBudgetStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What's Your Budget? 💰</Text>
      <Text style={styles.stepSubtitle}>
        This helps us show you the best options within your comfort zone
      </Text>

      <View style={styles.optionsGrid}>
        {BUDGET_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.budgetOption,
              selectedBudget === option.value && styles.budgetOptionSelected,
            ]}
            onPress={() => setSelectedBudget(option.value)}
          >
            <Text style={styles.budgetEmoji}>{option.emoji}</Text>
            <Text
              style={[
                styles.budgetLabel,
                selectedBudget === option.value && styles.budgetLabelSelected,
              ]}
            >
              {option.label}
            </Text>
            <Text style={styles.budgetPrice}>{option.value}</Text>
            <Text style={styles.budgetDescription}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPreferencesStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What Vibe Are You Going For? ✨</Text>
      <Text style={styles.stepSubtitle}>
        Select all that apply (or skip if you're open to anything!)
      </Text>

      <View style={styles.preferencesGrid}>
        {PREFERENCE_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.preferenceOption,
              preferences[option.key as keyof typeof preferences] &&
                styles.preferenceOptionSelected,
            ]}
            onPress={() => togglePreference(option.key)}
          >
            <Text style={styles.preferenceEmoji}>{option.emoji}</Text>
            <Text
              style={[
                styles.preferenceLabel,
                preferences[option.key as keyof typeof preferences] &&
                  styles.preferenceLabelSelected,
              ]}
            >
              {option.label}
            </Text>
            <Text style={styles.preferenceDescription}>{option.description}</Text>
            {preferences[option.key as keyof typeof preferences] && (
              <View style={styles.checkMark}>
                <Text style={styles.checkMarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPackageStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose a Celebration Package 📦</Text>
      <Text style={styles.stepSubtitle}>Curated experiences for your milestone (optional)</Text>

      {availablePackages.length === 0 ? (
        <View style={styles.emptyPackages}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyText}>
            No curated packages available for Year {yearsCompleting} at this budget level.
          </Text>
          <Text style={styles.emptySubtext}>
            You can skip this step and choose individual ideas instead!
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.packagesScroll}
        >
          {availablePackages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[
                styles.packageCard,
                selectedPackage?.id === pkg.id && styles.packageCardSelected,
              ]}
              onPress={() => setSelectedPackage(selectedPackage?.id === pkg.id ? null : pkg)}
            >
              {pkg.featured && (
                <View style={styles.packageFeatured}>
                  <Text style={styles.packageFeaturedText}>⭐ Featured</Text>
                </View>
              )}
              <Text style={styles.packageName}>{pkg.name}</Text>
              <Text style={styles.packageTagline}>{pkg.tagline}</Text>
              <View style={styles.packageMeta}>
                <Text style={styles.packageMetaText}>
                  {pkg.durationDays}d • {pkg.priceRange}
                </Text>
              </View>
              <View style={styles.packageHighlights}>
                {pkg.highlights.slice(0, 2).map((h, i) => (
                  <Text key={i} style={styles.packageHighlight}>
                    • {h}
                  </Text>
                ))}
              </View>
              {selectedPackage?.id === pkg.id && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>✓ Selected</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedPackage && (
        <TouchableOpacity style={styles.clearSelection} onPress={() => setSelectedPackage(null)}>
          <Text style={styles.clearSelectionText}>Clear Selection</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderIdeasStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Add Celebration Ideas 💡</Text>
      <Text style={styles.stepSubtitle}>Select up to 5 ideas to include in your plan</Text>

      {selectedSuggestions.length > 0 && (
        <View style={styles.selectedCount}>
          <Text style={styles.selectedCountText}>{selectedSuggestions.length}/5 selected</Text>
        </View>
      )}

      <ScrollView style={styles.ideasScroll} showsVerticalScrollIndicator={false}>
        {availableSuggestions.map((suggestion) => {
          const isSelected = selectedSuggestions.find((s) => s.id === suggestion.id);

          return (
            <TouchableOpacity
              key={suggestion.id}
              style={[styles.ideaCard, isSelected && styles.ideaCardSelected]}
              onPress={() => toggleSuggestion(suggestion)}
            >
              <View style={styles.ideaHeader}>
                <View style={styles.ideaCategoryPill}>
                  <Text style={styles.ideaCategoryText}>
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
                                : '🎁'}
                  </Text>
                </View>
                <Text style={styles.ideaPrice}>{suggestion.priceRange}</Text>
              </View>
              <Text style={styles.ideaTitle}>{suggestion.title}</Text>
              <Text style={styles.ideaSubtitle}>{suggestion.subtitle}</Text>
              {isSelected && (
                <View style={styles.ideaSelectedBadge}>
                  <Text style={styles.ideaSelectedText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );

  const renderGiftStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Pick a Gift Idea 🎁</Text>
      <Text style={styles.stepSubtitle}>
        Traditional themes for Year {yearsCompleting} (optional)
      </Text>

      {availableGifts.length === 0 ? (
        <View style={styles.emptyPackages}>
          <Text style={styles.emptyEmoji}>🎁</Text>
          <Text style={styles.emptyText}>
            No gift ideas available for Year {yearsCompleting} at this budget level.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.giftsScroll} showsVerticalScrollIndicator={false}>
          {availableGifts.map((gift) => (
            <TouchableOpacity
              key={gift.id}
              style={[styles.giftCard, selectedGift?.id === gift.id && styles.giftCardSelected]}
              onPress={() => setSelectedGift(selectedGift?.id === gift.id ? null : gift)}
            >
              <View style={styles.giftHeader}>
                <Text style={styles.giftName}>{gift.name}</Text>
                <Text style={styles.giftPrice}>{gift.priceRange}</Text>
              </View>
              <Text style={styles.giftDescription}>{gift.description}</Text>
              <View style={styles.giftMeta}>
                <Text style={styles.giftTie}>🎀 Theme: {gift.traditionalTie}</Text>
                {gift.personalizable && (
                  <Text style={styles.giftPersonalizable}>✨ Personalizable</Text>
                )}
              </View>
              {selectedGift?.id === gift.id && (
                <View style={styles.giftSelectedBadge}>
                  <Text style={styles.giftSelectedText}>✓ Selected</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );

  const renderReviewStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Review Your Plan 📋</Text>
      <Text style={styles.stepSubtitle}>Here's everything you've put together</Text>

      <View style={styles.planNameInput}>
        <Text style={styles.inputLabel}>Plan Name</Text>
        <TextInput
          style={styles.textInput}
          value={planName}
          onChangeText={setPlanName}
          placeholder="Give your plan a name"
        />
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>💰 Budget</Text>
        <Text style={styles.reviewValue}>
          {BUDGET_OPTIONS.find((b) => b.value === selectedBudget)?.label} ({selectedBudget})
        </Text>
      </View>

      {Object.values(preferences).some((v) => v) && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>✨ Vibes</Text>
          <View style={styles.reviewTags}>
            {Object.entries(preferences)
              .filter(([_, active]) => active)
              .map(([key]) => (
                <View key={key} style={styles.reviewTag}>
                  <Text style={styles.reviewTagText}>
                    {PREFERENCE_OPTIONS.find((p) => p.key === key)?.label}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      )}

      {selectedPackage && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>📦 Package</Text>
          <View style={styles.reviewPackage}>
            <Text style={styles.reviewPackageName}>{selectedPackage.name}</Text>
            <Text style={styles.reviewPackageTagline}>{selectedPackage.tagline}</Text>
          </View>
        </View>
      )}

      {selectedSuggestions.length > 0 && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>💡 Ideas ({selectedSuggestions.length})</Text>
          {selectedSuggestions.map((s, i) => (
            <View key={s.id} style={styles.reviewIdea}>
              <Text style={styles.reviewIdeaNumber}>{i + 1}.</Text>
              <Text style={styles.reviewIdeaTitle}>{s.title}</Text>
            </View>
          ))}
        </View>
      )}

      {selectedGift && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>🎁 Gift</Text>
          <Text style={styles.reviewGift}>{selectedGift.name}</Text>
        </View>
      )}

      <View style={styles.notesSection}>
        <Text style={styles.inputLabel}>Notes (optional)</Text>
        <TextInput
          style={[styles.textInput, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any personal notes or reminders..."
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>{currentStepIndex === 0 ? '✕' : '←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan Celebration</Text>
        <View style={styles.headerButton} />
      </View>

      {renderStepIndicator()}

      <View style={styles.content}>
        {currentStep === 'budget' && renderBudgetStep()}
        {currentStep === 'preferences' && renderPreferencesStep()}
        {currentStep === 'package' && renderPackageStep()}
        {currentStep === 'ideas' && renderIdeasStep()}
        {currentStep === 'gift' && renderGiftStep()}
        {currentStep === 'review' && renderReviewStep()}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {currentStep === 'review' ? (
          <TouchableOpacity
            style={[styles.primaryButton, isSaving && styles.buttonDisabled]}
            onPress={savePlan}
            disabled={isSaving}
          >
            <LinearGradient colors={['#FF6B6B', '#FF8E8E']} style={styles.buttonGradient}>
              <Text style={styles.primaryButtonText}>
                {isSaving ? 'Saving...' : '🎉 Save Celebration Plan'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.skipButton} onPress={goNext}>
              <Text style={styles.skipButtonText}>{currentStep === 'budget' ? '' : 'Skip'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextButton, !canProceed() && styles.buttonDisabled]}
              onPress={goNext}
              disabled={!canProceed()}
            >
              <Text style={styles.nextButtonText}>Continue →</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  stepIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
  },
  stepText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  optionsGrid: {
    gap: 12,
  },
  budgetOption: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetOptionSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  budgetEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  budgetLabelSelected: {
    color: '#FF6B6B',
  },
  budgetPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  budgetDescription: {
    fontSize: 13,
    color: '#666',
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  preferenceOption: {
    width: (width - 52) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  preferenceOptionSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  preferenceEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  preferenceLabelSelected: {
    color: '#FF6B6B',
  },
  preferenceDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  checkMark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMarkText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyPackages: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  packagesScroll: {
    paddingRight: 20,
  },
  packageCard: {
    width: width - 80,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  packageCardSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  packageFeatured: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  packageFeaturedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
  },
  packageName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  packageTagline: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  packageMeta: {
    marginBottom: 12,
  },
  packageMetaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  packageHighlights: {
    gap: 4,
  },
  packageHighlight: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  clearSelection: {
    alignSelf: 'center',
    marginTop: 16,
    padding: 8,
  },
  clearSelectionText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  selectedCount: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  selectedCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
  },
  ideasScroll: {
    flex: 1,
  },
  ideaCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ideaCardSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ideaCategoryPill: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ideaCategoryText: {
    fontSize: 14,
  },
  ideaPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  ideaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ideaSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  ideaSelectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ideaSelectedText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  giftsScroll: {
    flex: 1,
  },
  giftCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  giftCardSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  giftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  giftName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 12,
  },
  giftPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  giftDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  giftMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  giftTie: {
    fontSize: 12,
    color: '#999',
  },
  giftPersonalizable: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  giftSelectedBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  giftSelectedText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  planNameInput: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reviewSection: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  reviewSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
    marginBottom: 8,
  },
  reviewValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reviewTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reviewTagText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  reviewPackage: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
  },
  reviewPackageName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  reviewPackageTagline: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  reviewIdea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewIdeaNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
    marginRight: 8,
    width: 20,
  },
  reviewIdeaTitle: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  reviewGift: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  notesSection: {
    marginTop: 8,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    minWidth: 60,
  },
  skipButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default CelebrationPlannerScreen;
