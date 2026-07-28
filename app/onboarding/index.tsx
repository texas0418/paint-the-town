import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { foodPreferences } from '@/mocks/preferences';
import {
  activityOptions,
  musicGenreOptions,
  drinkOptions,
  TasteProfile,
  VenueStyle,
} from '@/types/planner';
import { saveTasteProfile } from '@/services/tasteProfileService';
import { useApp } from '@/contexts/AppContext';
import {
  createStyles,
  WelcomeStep,
  PlanForStep,
  ChipStep,
  DislikesStep,
  LogisticsStep,
} from './StepViews';

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

  const steps = [
    () => <WelcomeStep styles={styles} colors={colors} />,
    () => <PlanForStep styles={styles} colors={colors} planFor={planFor} setPlanFor={setPlanFor} />,
    () => (
      <ChipStep
        styles={styles}
        colors={colors}
        title="What do you love to do?"
        subtitle="Pick at least 3 — museums, live music, bars, whatever makes a great day"
        options={activityOptions}
        selected={activityLoves}
        onToggle={(id) => toggle(activityLoves, setActivityLoves, id)}
        minLabel={activityLoves.length < 3 ? '(minimum 3)' : ''}
      />
    ),
    () => (
      <ChipStep
        styles={styles}
        colors={colors}
        title="What cuisines do you love?"
        subtitle="Pick at least 2 for personalized dining suggestions"
        options={foodPreferences}
        selected={foodLoves}
        onToggle={(id) => toggle(foodLoves, setFoodLoves, id)}
        minLabel={foodLoves.length < 2 ? '(minimum 2)' : ''}
      />
    ),
    () => (
      <DislikesStep
        styles={styles}
        foodLoves={foodLoves}
        foodDislikes={foodDislikes}
        setFoodDislikes={setFoodDislikes}
        activityLoves={activityLoves}
        activityDislikes={activityDislikes}
        setActivityDislikes={setActivityDislikes}
        toggle={toggle}
      />
    ),
    () => (
      <ChipStep
        styles={styles}
        colors={colors}
        title="What music are you into?"
        subtitle="We use this for concerts, bars and venues with live music"
        options={musicGenreOptions}
        selected={musicGenres}
        onToggle={(id) => toggle(musicGenres, setMusicGenres, id)}
      />
    ),
    () => (
      <ChipStep
        styles={styles}
        colors={colors}
        title="What do you like to drink?"
        subtitle="Whiskey bars, wine bars, cafés — this decides where nights end"
        options={drinkOptions}
        selected={drinks}
        onToggle={(id) => toggle(drinks, setDrinks, id)}
      />
    ),
    () => (
      <LogisticsStep
        styles={styles}
        colors={colors}
        venueStyle={venueStyle}
        setVenueStyle={setVenueStyle}
        dateBudget={dateBudget}
        setDateBudget={setDateBudget}
        homeCity={homeCity}
        setHomeCity={setHomeCity}
      />
    ),
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

        {/* Keyed by step so each step's ScrollView remounts at the top —
            otherwise the previous step's scroll offset carries over. */}
        <Animated.View key={step} style={[styles.content, { opacity: fadeAnim }]}>
          {steps[step]()}
        </Animated.View>

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
