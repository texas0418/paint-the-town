import React, { useState, useRef, useMemo, ComponentType } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import {
  User,
  Heart,
  Users,
  UsersRound,
  ChevronRight,
  Check,
  MapPin,
  Home,
  Trees,
  Blend,
} from 'lucide-react-native';
import type { LucideProps } from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { fonts } from '@/constants/typography';
import { travelStyles, foodPreferences } from '@/mocks/preferences';
import {
  activityOptions,
  musicGenreOptions,
  drinkOptions,
  TasteProfile,
  VenueStyle,
} from '@/types/planner';
import { saveTasteProfile } from '@/services/tasteProfileService';
import { useApp } from '@/contexts/AppContext';

const { width, height } = Dimensions.get('window');

const iconMap: Record<string, ComponentType<LucideProps>> = {
  User,
  Heart,
  Users,
  UsersRound,
};

const venueStyles: { id: VenueStyle; name: string; icon: ComponentType<LucideProps> }[] = [
  { id: 'indoor', name: 'Indoor', icon: Home },
  { id: 'outdoor', name: 'Outdoor', icon: Trees },
  { id: 'both', name: 'Both', icon: Blend },
];

const TOTAL_STEPS = 7; // steps 1..7 after welcome

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [planFor, setPlanFor] = useState<string | null>(null);
  const [activityLoves, setActivityLoves] = useState<string[]>([]);
  const [foodLoves, setFoodLoves] = useState<string[]>([]);
  const [foodDislikes, setFoodDislikes] = useState<string[]>([]);
  const [activityDislikes, setActivityDislikes] = useState<string[]>([]);
  const [musicGenres, setMusicGenres] = useState<string[]>([]);
  const [drinks, setDrinks] = useState<string[]>([]);
  const [venueStyle, setVenueStyle] = useState<VenueStyle>('both');
  const [dateBudget, setDateBudget] = useState(150);
  const [homeCity, setHomeCity] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setTimeout(callback, 150);
  };

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const budgetRangeId = (budget: number) => {
    if (budget < 100) return 'budget';
    if (budget < 250) return 'moderate';
    if (budget < 500) return 'comfort';
    return 'luxury';
  };

  const handleFinish = async () => {
    setSaving(true);
    const profile: TasteProfile = {
      planFor,
      foodLoves,
      foodDislikes,
      activityLoves,
      activityDislikes,
      musicGenres,
      drinks,
      venueStyle,
      dateBudget,
      homeCity: homeCity.trim(),
    };
    try {
      await saveTasteProfile(profile);
    } catch (error) {
      // Not fatal for onboarding — profile can be re-saved from the Taste Profile screen
      console.error('Failed to sync taste profile to Supabase:', error);
    }
    completeOnboarding({
      travelStyle: planFor,
      budgetRange: budgetRangeId(dateBudget),
      preferences: activityLoves,
      foodPreferences: foodLoves,
    });
    setSaving(false);
    router.replace('/');
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      animateTransition(() => setStep(step + 1));
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) animateTransition(() => setStep(step - 1));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return planFor !== null;
      case 2:
        return activityLoves.length >= 3;
      case 3:
        return foodLoves.length >= 2;
      case 4:
        return true; // dislikes are optional
      case 5:
        return musicGenres.length >= 1;
      case 6:
        return drinks.length >= 1;
      case 7:
        return homeCity.trim().length >= 2;
      default:
        return true;
    }
  };

  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800' }}
        style={styles.welcomeImage}
        contentFit="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)', colors.primaryDark]}
        style={styles.welcomeGradient}
      />
      <View style={styles.welcomeContent}>
        <Text style={styles.welcomeTitle}>W4nder</Text>
        <Text style={styles.welcomeSubtitle}>
          Great dates and trips, planned for you. Tell us what you love — we handle the rest.
        </Text>
        <View style={styles.welcomeFeatures}>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Real venues that match your taste</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Scheduled plans within your budget</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>"Plan it for me" — pick from 3 ready-made dates</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPlanFor = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Who do you usually plan for?</Text>
      <Text style={styles.stepSubtitle}>We'll tailor suggestions to your kind of outing</Text>
      <View style={styles.optionsGrid}>
        {travelStyles.map((style) => {
          const IconComponent = iconMap[style.icon];
          const isSelected = planFor === style.id;
          return (
            <Pressable
              key={style.id}
              style={[styles.styleCard, isSelected && styles.styleCardSelected]}
              onPress={() => setPlanFor(style.id)}
            >
              <View style={[styles.styleIconContainer, isSelected && styles.styleIconSelected]}>
                {IconComponent && (
                  <IconComponent size={28} color={isSelected ? colors.textLight : colors.primary} />
                )}
              </View>
              <Text style={[styles.styleName, isSelected && styles.styleNameSelected]}>
                {style.name}
              </Text>
              <Text style={styles.styleDesc}>{style.description}</Text>
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Check size={14} color={colors.textLight} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderChipStep = (
    title: string,
    subtitle: string,
    options: { id: string; name: string; emoji: string }[],
    selected: string[],
    onToggle: (id: string) => void,
    minLabel?: string
  ) => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
      <ScrollView
        style={styles.preferencesScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.preferencesContent}
      >
        <View style={styles.foodGrid}>
          {options.map((option) => {
            const isSelected = selected.includes(option.id);
            return (
              <Pressable
                key={option.id}
                style={[styles.foodChip, isSelected && styles.foodChipSelected]}
                onPress={() => onToggle(option.id)}
              >
                <Text style={styles.foodEmoji}>{option.emoji}</Text>
                <Text style={[styles.foodText, isSelected && styles.foodTextSelected]}>
                  {option.name}
                </Text>
                {isSelected && (
                  <View style={styles.foodCheck}>
                    <Check size={12} color={colors.textLight} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <Text style={styles.selectedCount}>
        {selected.length} selected {minLabel ?? ''}
      </Text>
    </View>
  );

  const renderDislikes = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Anything we should avoid?</Text>
      <Text style={styles.stepSubtitle}>Optional — we'll never suggest these</Text>
      <ScrollView
        style={styles.preferencesScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.preferencesContent}
      >
        <Text style={styles.sectionLabel}>Foods to skip</Text>
        <View style={styles.foodGrid}>
          {foodPreferences
            .filter((f) => !foodLoves.includes(f.id))
            .map((food) => {
              const isSelected = foodDislikes.includes(food.id);
              return (
                <Pressable
                  key={food.id}
                  style={[styles.foodChip, isSelected && styles.dislikeChipSelected]}
                  onPress={() => toggle(foodDislikes, setFoodDislikes, food.id)}
                >
                  <Text style={styles.foodEmoji}>{food.emoji}</Text>
                  <Text style={[styles.foodText, isSelected && styles.foodTextSelected]}>
                    {food.name}
                  </Text>
                </Pressable>
              );
            })}
        </View>
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Activities to skip</Text>
        <View style={styles.foodGrid}>
          {activityOptions
            .filter((a) => !activityLoves.includes(a.id))
            .map((activity) => {
              const isSelected = activityDislikes.includes(activity.id);
              return (
                <Pressable
                  key={activity.id}
                  style={[styles.foodChip, isSelected && styles.dislikeChipSelected]}
                  onPress={() => toggle(activityDislikes, setActivityDislikes, activity.id)}
                >
                  <Text style={styles.foodEmoji}>{activity.emoji}</Text>
                  <Text style={[styles.foodText, isSelected && styles.foodTextSelected]}>
                    {activity.name}
                  </Text>
                </Pressable>
              );
            })}
        </View>
      </ScrollView>
    </View>
  );

  const renderLogistics = () => (
    <KeyboardAvoidingView
      style={styles.stepContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.stepTitle}>Last step — the practical stuff</Text>
      <Text style={styles.stepSubtitle}>You can change all of this anytime</Text>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Indoor or outdoor?</Text>
        <View style={styles.venueRow}>
          {venueStyles.map((v) => {
            const IconComponent = v.icon;
            const isSelected = venueStyle === v.id;
            return (
              <Pressable
                key={v.id}
                style={[styles.venueCard, isSelected && styles.venueCardSelected]}
                onPress={() => setVenueStyle(v.id)}
              >
                <IconComponent size={22} color={isSelected ? colors.textLight : colors.primary} />
                <Text style={[styles.venueText, isSelected && styles.venueTextSelected]}>
                  {v.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Typical budget per date</Text>
        <Text style={styles.budgetValue}>
          ${dateBudget}
          {dateBudget >= 500 ? '+' : ''}
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={25}
          maximumValue={500}
          step={25}
          value={dateBudget}
          onValueChange={setDateBudget}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />

        <Text style={styles.sectionLabel}>Your city</Text>
        <View style={styles.cityInputRow}>
          <MapPin size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.cityInput}
            placeholder="e.g. Los Angeles, CA"
            placeholderTextColor={colors.textTertiary}
            value={homeCity}
            onChangeText={setHomeCity}
            autoCapitalize="words"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const steps = [
    renderWelcome,
    renderPlanFor,
    () =>
      renderChipStep(
        'What do you love to do?',
        'Pick at least 3 — museums, live music, bars, whatever makes a great day',
        activityOptions,
        activityLoves,
        (id) => toggle(activityLoves, setActivityLoves, id),
        activityLoves.length < 3 ? '(minimum 3)' : ''
      ),
    () =>
      renderChipStep(
        'What cuisines do you love?',
        'Pick at least 2 for personalized dining suggestions',
        foodPreferences,
        foodLoves,
        (id) => toggle(foodLoves, setFoodLoves, id),
        foodLoves.length < 2 ? '(minimum 2)' : ''
      ),
    renderDislikes,
    () =>
      renderChipStep(
        "What music are you into?",
        'We use this for concerts, bars and venues with live music',
        musicGenreOptions,
        musicGenres,
        (id) => toggle(musicGenres, setMusicGenres, id)
      ),
    () =>
      renderChipStep(
        'What do you like to drink?',
        'Whiskey bars, wine bars, cafés — this decides where nights end',
        drinkOptions,
        drinks,
        (id) => toggle(drinks, setDrinks, id)
      ),
    renderLogistics,
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.surfaceSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          {step > 0 && (
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          )}
          {step > 0 && (
            <View style={styles.progressContainer}>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((i) => (
                <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
              ))}
            </View>
          )}
          {step > 0 && <View style={styles.backButton} />}
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>{steps[step]()}</Animated.View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.nextButton, (!canProceed() || saving) && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed() || saving}
          >
            <Text style={styles.nextButtonText}>
              {step === 0 ? "Let's Begin" : step === TOTAL_STEPS ? 'Start Planning' : 'Continue'}
            </Text>
            <ChevronRight size={20} color={colors.textLight} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 60,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 18,
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  nextButtonText: {
    color: colors.textLight,
    fontSize: 17,
    fontWeight: '600',
  },
  welcomeContainer: {
    flex: 1,
    position: 'relative',
  },
  welcomeImage: {
    width: width,
    height: height * 0.55,
    position: 'absolute',
    top: -100,
  },
  welcomeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  welcomeTitle: {
    fontSize: 48,
    fontFamily: fonts.displayBold,
    color: colors.textLight,
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: colors.accent,
    lineHeight: 26,
    marginBottom: 32,
  },
  welcomeFeatures: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  featureText: {
    fontSize: 16,
    color: colors.textLight,
    opacity: 0.9,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontFamily: fonts.display,
    color: colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  styleCard: {
    width: (width - 52) / 2,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  styleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  styleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  styleIconSelected: {
    backgroundColor: colors.primary,
  },
  styleName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  styleNameSelected: {
    color: colors.primaryDark,
  },
  styleDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  checkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferencesScroll: {
    flex: 1,
  },
  preferencesContent: {
    paddingBottom: 20,
  },
  selectedCount: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  foodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  foodChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dislikeChipSelected: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  foodEmoji: {
    fontSize: 20,
  },
  foodText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  foodTextSelected: {
    color: colors.textLight,
  },
  foodCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  venueRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  venueCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  venueCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  venueText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  venueTextSelected: {
    color: colors.textLight,
  },
  budgetValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 28,
  },
  cityInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  cityInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
});
