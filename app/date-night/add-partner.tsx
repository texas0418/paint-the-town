import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import {
  ArrowLeft,
  User,
  Link as LinkIcon,
  UserPlus,
  Utensils,
  Activity,
  Sun,
  Clock,
  MapPin,
  DollarSign,
  ChevronRight,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useDateNight } from '@/contexts/DateNightContext';
import {
  CuisineType,
  DietaryRestriction,
  ActivityType,
  EnvironmentPreference,
  TimeOfDay,
  BudgetTier,
  DatePreferences,
} from '@/types/date-night';

type AddMethod = 'manual' | 'link' | null;

const cuisineOptions: { value: CuisineType; label: string }[] = [
  { value: 'italian', label: 'Italian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'indian', label: 'Indian' },
  { value: 'thai', label: 'Thai' },
  { value: 'french', label: 'French' },
  { value: 'american', label: 'American' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'korean', label: 'Korean' },
  { value: 'vietnamese', label: 'Vietnamese' },
  { value: 'greek', label: 'Greek' },
];

const dietaryOptions: { value: DietaryRestriction; label: string }[] = [
  { value: 'none', label: 'No Restrictions' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'dairy-free', label: 'Dairy-Free' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
];

const activityOptions: { value: ActivityType; label: string; emoji: string }[] = [
  { value: 'romantic', label: 'Romantic', emoji: '💕' },
  { value: 'adventurous', label: 'Adventurous', emoji: '🎢' },
  { value: 'relaxed', label: 'Relaxed', emoji: '😌' },
  { value: 'creative', label: 'Creative', emoji: '🎨' },
  { value: 'active', label: 'Active', emoji: '🏃' },
  { value: 'cultural', label: 'Cultural', emoji: '🏛️' },
  { value: 'social', label: 'Social', emoji: '🎉' },
  { value: 'intimate', label: 'Intimate', emoji: '🕯️' },
];

const environmentOptions: { value: EnvironmentPreference; label: string }[] = [
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'both', label: 'Both' },
];

const timeOptions: { value: TimeOfDay; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
];

const budgetOptions: { value: BudgetTier; label: string }[] = [
  { value: '$', label: '$' },
  { value: '$$', label: '$$' },
  { value: '$$$', label: '$$$' },
  { value: '$$$$', label: '$$$$' },
];

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function AddPartnerScreen() {
  const router = useRouter();
  const { addPartner, setSelectedPartner } = useDateNight();

  const [addMethod, setAddMethod] = useState<AddMethod>(null);
  const [partnerName, setPartnerName] = useState('');
  const [linkEmail, setLinkEmail] = useState('');
  const [step, setStep] = useState(1);

  const [preferences, setPreferences] = useState<DatePreferences>({
    cuisineTypes: [],
    dietaryRestrictions: ['none'],
    activityTypes: [],
    environmentPreference: 'both',
    preferredTimeOfDay: ['evening'],
    maxTravelDistance: 25,
    budgetTier: '$$',
  });

  const toggleArrayItem = <T extends string>(array: T[], item: T): T[] => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    }
    return [...array, item];
  };

  const handleLinkPartner = () => {
    if (!linkEmail.trim()) {
      Alert.alert('Enter Email', "Please enter your partner's email address.");
      return;
    }
    // TODO: send an invite
    Alert.alert(
      'Invite Sent!',
      `An invitation has been sent to ${linkEmail}. They'll need to accept it to link accounts.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleSavePartner = () => {
    if (!partnerName.trim()) {
      Alert.alert('Enter Name', "Please enter your partner's name.");
      return;
    }
    if (preferences.activityTypes.length === 0) {
      Alert.alert('Select Activities', 'Please select at least one activity type.');
      return;
    }

    const newPartner = addPartner({
      name: partnerName.trim(),
      isLinked: false,
      preferences,
    });

    setSelectedPartner(newPartner);

    Alert.alert(
      'Partner Added!',
      `${partnerName} has been added. You can now plan dates together!`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const renderMethodSelection = () => (
    <View style={styles.methodContainer}>
      <Text style={styles.methodTitle}>How would you like to add a partner?</Text>

      <Pressable style={styles.methodCard} onPress={() => setAddMethod('manual')}>
        <View style={[styles.methodIcon, { backgroundColor: `${colors.secondary}15` }]}>
          <UserPlus size={28} color={colors.secondary} />
        </View>
        <View style={styles.methodContent}>
          <Text style={styles.methodName}>Add Manually</Text>
          <Text style={styles.methodDescription}>
            Enter their preferences yourself based on what you know
          </Text>
        </View>
        <ChevronRight size={20} color={colors.textTertiary} />
      </Pressable>

      <Pressable style={styles.methodCard} onPress={() => setAddMethod('link')}>
        <View style={[styles.methodIcon, { backgroundColor: `${colors.primary}15` }]}>
          <LinkIcon size={28} color={colors.primary} />
        </View>
        <View style={styles.methodContent}>
          <Text style={styles.methodName}>Link Account</Text>
          <Text style={styles.methodDescription}>
            Invite them to link their Paint the Town account for synced preferences
          </Text>
        </View>
        <ChevronRight size={20} color={colors.textTertiary} />
      </Pressable>
    </View>
  );

  const renderLinkForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.linkHeader}>
        <View style={[styles.linkIcon, { backgroundColor: `${colors.primary}15` }]}>
          <LinkIcon size={32} color={colors.primary} />
        </View>
        <Text style={styles.linkTitle}>Link Partner Account</Text>
        <Text style={styles.linkDescription}>
          Enter your partner&apos;s email to send them an invite. Once they accept, their preferences
          will sync automatically.
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Partner&apos;s Email</Text>
        <TextInput
          style={styles.input}
          value={linkEmail}
          onChangeText={setLinkEmail}
          placeholder="partner@email.com"
          placeholderTextColor={colors.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <Pressable style={styles.primaryButton} onPress={handleLinkPartner}>
        <Text style={styles.primaryButtonText}>Send Invite</Text>
      </Pressable>
    </View>
  );

  const renderManualFormStep1 = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Partner&apos;s Name</Text>
        <TextInput
          style={styles.input}
          value={partnerName}
          onChangeText={setPartnerName}
          placeholder="Enter their name"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Activity size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Activity Preferences</Text>
        </View>
        <Text style={styles.sectionDescription}>What activities do they enjoy?</Text>
        <View style={styles.chipsContainer}>
          {activityOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.chip,
                preferences.activityTypes.includes(option.value) && styles.chipSelected,
              ]}
              onPress={() =>
                setPreferences((prev) => ({
                  ...prev,
                  activityTypes: toggleArrayItem(prev.activityTypes, option.value),
                }))
              }
            >
              <Text style={styles.chipEmoji}>{option.emoji}</Text>
              <Text
                style={[
                  styles.chipText,
                  preferences.activityTypes.includes(option.value) && styles.chipTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Sun size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Environment</Text>
        </View>
        <View style={styles.segmentedControl}>
          {environmentOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.segmentButton,
                preferences.environmentPreference === option.value && styles.segmentButtonSelected,
              ]}
              onPress={() =>
                setPreferences((prev) => ({
                  ...prev,
                  environmentPreference: option.value,
                }))
              }
            >
              <Text
                style={[
                  styles.segmentText,
                  preferences.environmentPreference === option.value && styles.segmentTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() => {
          if (!partnerName.trim()) {
            Alert.alert('Enter Name', "Please enter your partner's name.");
            return;
          }
          setStep(2);
        }}
      >
        <Text style={styles.primaryButtonText}>Next: Food Preferences</Text>
      </Pressable>
    </View>
  );

  const renderManualFormStep2 = () => (
    <View style={styles.formContainer}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Utensils size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Cuisine Preferences</Text>
        </View>
        <View style={styles.chipsContainer}>
          {cuisineOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.chipSmall,
                preferences.cuisineTypes.includes(option.value) && styles.chipSelected,
              ]}
              onPress={() =>
                setPreferences((prev) => ({
                  ...prev,
                  cuisineTypes: toggleArrayItem(prev.cuisineTypes, option.value),
                }))
              }
            >
              <Text
                style={[
                  styles.chipText,
                  preferences.cuisineTypes.includes(option.value) && styles.chipTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Utensils size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
        </View>
        <View style={styles.chipsContainer}>
          {dietaryOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.chipSmall,
                preferences.dietaryRestrictions.includes(option.value) && styles.chipSelected,
              ]}
              onPress={() => {
                if (option.value === 'none') {
                  setPreferences((prev) => ({
                    ...prev,
                    dietaryRestrictions: ['none'],
                  }));
                } else {
                  setPreferences((prev) => ({
                    ...prev,
                    dietaryRestrictions: toggleArrayItem(
                      prev.dietaryRestrictions.filter((d) => d !== 'none'),
                      option.value
                    ),
                  }));
                }
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  preferences.dietaryRestrictions.includes(option.value) && styles.chipTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <DollarSign size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Budget Preference</Text>
        </View>
        <View style={styles.budgetContainer}>
          {budgetOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.budgetOption,
                preferences.budgetTier === option.value && styles.budgetOptionSelected,
              ]}
              onPress={() =>
                setPreferences((prev) => ({
                  ...prev,
                  budgetTier: option.value,
                }))
              }
            >
              <Text
                style={[
                  styles.budgetLabel,
                  preferences.budgetTier === option.value && styles.budgetLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={styles.secondaryButton} onPress={() => setStep(1)}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable style={[styles.primaryButton, { flex: 2 }]} onPress={handleSavePartner}>
          <Text style={styles.primaryButtonText}>Save Partner</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.secondary, colors.secondaryLight]}
        style={styles.headerGradient}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              if (addMethod && step > 1) {
                setStep(1);
              } else if (addMethod) {
                setAddMethod(null);
              } else {
                router.back();
              }
            }}
          >
            <ArrowLeft size={22} color={colors.textLight} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {!addMethod
              ? 'Add Partner'
              : addMethod === 'link'
                ? 'Link Account'
                : `Add ${partnerName || 'Partner'}`}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {addMethod === 'manual' && (
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {!addMethod && renderMethodSelection()}
            {addMethod === 'link' && renderLinkForm()}
            {addMethod === 'manual' && step === 1 && renderManualFormStep1()}
            {addMethod === 'manual' && step === 2 && renderManualFormStep2()}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    height: 160,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textLight,
  },
  placeholder: {
    width: 44,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepDotActive: {
    backgroundColor: colors.textLight,
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  contentContainer: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  methodContainer: {
    gap: 16,
  },
  methodTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodContent: {
    flex: 1,
    marginLeft: 12,
  },
  methodName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  methodDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  formContainer: {
    gap: 20,
  },
  linkHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  linkIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  linkTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  linkDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sectionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSmall: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.textLight,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentButtonSelected: {
    backgroundColor: colors.surface,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  segmentTextSelected: {
    color: colors.primary,
  },
  budgetContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  budgetOption: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  budgetOptionSelected: {
    borderColor: colors.secondary,
    backgroundColor: `${colors.secondary}08`,
  },
  budgetLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  budgetLabelSelected: {
    color: colors.secondary,
  },
  primaryButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textLight,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
