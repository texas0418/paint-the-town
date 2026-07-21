import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  DollarSign,
  Clock,
  MapPin,
  ChevronRight,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  Home,
  Map,
  Plane,
  Globe,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useDateNight } from '@/contexts/DateNightContext';
import { BudgetTier, DateSuggestion, TripScope } from '@/types/date-night';

const budgetOptions: { value: BudgetTier; label: string; range: string }[] = [
  { value: '$', label: '$', range: 'Under $50' },
  { value: '$$', label: '$$', range: '$50-150' },
  { value: '$$$', label: '$$$', range: '$150-300' },
  { value: '$$$$', label: '$$$$', range: '$300+' },
];

const tripScopeOptions: { value: TripScope; label: string; icon: any; description: string }[] = [
  { value: 'local', label: 'Local', icon: Home, description: 'Nearby in your city' },
  { value: 'domestic', label: 'Domestic', icon: Map, description: 'Within the country' },
  { value: 'international', label: 'International', icon: Plane, description: 'Abroad' },
];

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function GeneratePlanScreen() {
  const router = useRouter();
  const {
    selectedPartner,
    suggestions,
    generateSuggestions,
    isGenerating,
    createItinerary,
    setCurrentItinerary,
  } = useDateNight();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBudget, setSelectedBudget] = useState<BudgetTier>('$$');
  const [selectedTripScope, setSelectedTripScope] = useState<TripScope>('local');
  const [destination, setDestination] = useState('');
  const [isSurprise, setIsSurprise] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<DateSuggestion | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDateLabel = (date: Date, index: number) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const handleGenerate = async () => {
    if (!selectedPartner) return;
    await generateSuggestions(
      selectedPartner.id,
      selectedBudget,
      selectedDate.toISOString(),
      selectedTripScope
    );
    setHasGenerated(true);
    setSelectedSuggestion(null);
  };

  const handleSelectSuggestion = (suggestion: DateSuggestion) => {
    setSelectedSuggestion(suggestion);
  };

  const handleCustomize = () => {
    if (!selectedSuggestion || !selectedPartner) return;

    const itinerary = createItinerary({
      name: selectedSuggestion.title,
      date: selectedDate.toISOString(),
      partnerId: selectedPartner.id,
      partnerName: selectedPartner.name,
      tripScope: selectedTripScope,
      destination:
        selectedTripScope !== 'local' ? destination || selectedSuggestion.destination : undefined,
      activities: selectedSuggestion.activities.map((a, i) => ({
        ...a,
        id: `activity-${i}`,
      })),
      totalEstimatedCost: selectedSuggestion.estimatedTotalCost,
      status: 'draft',
      isSurprise,
    });

    setCurrentItinerary(itinerary);
    router.push(`/date-night/edit-itinerary?id=${itinerary.id}`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.secondary, colors.secondaryLight]}
        style={styles.headerGradient}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.textLight} />
          </Pressable>
          <Text style={styles.headerTitle}>Plan Your Date</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Partner Info */}
          {selectedPartner && (
            <View style={styles.partnerBanner}>
              <View style={styles.partnerAvatar}>
                <Text style={styles.partnerInitial}>
                  {selectedPartner.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.partnerText}>
                Planning a date with <Text style={styles.partnerName}>{selectedPartner.name}</Text>
              </Text>
            </View>
          )}

          {/* Trip Scope Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Globe size={20} color={colors.secondary} />
              <Text style={styles.sectionTitle}>Trip Type</Text>
            </View>
            <View style={styles.tripScopeContainer}>
              {tripScopeOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = selectedTripScope === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.tripScopeOption, isSelected && styles.tripScopeOptionSelected]}
                    onPress={() => setSelectedTripScope(option.value)}
                  >
                    <View
                      style={[styles.tripScopeIcon, isSelected && styles.tripScopeIconSelected]}
                    >
                      <IconComponent
                        size={22}
                        color={isSelected ? colors.textLight : colors.secondary}
                      />
                    </View>
                    <Text
                      style={[styles.tripScopeLabel, isSelected && styles.tripScopeLabelSelected]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[styles.tripScopeDesc, isSelected && styles.tripScopeDescSelected]}
                    >
                      {option.description}
                    </Text>
                    {isSelected && (
                      <View style={styles.tripScopeCheck}>
                        <Check size={14} color={colors.textLight} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Destination Input for non-local trips */}
            {selectedTripScope !== 'local' && (
              <View style={styles.destinationContainer}>
                <Text style={styles.destinationLabel}>
                  {selectedTripScope === 'domestic' ? 'City/Region' : 'Country/City'}
                </Text>
                <TextInput
                  style={styles.destinationInput}
                  value={destination}
                  onChangeText={setDestination}
                  placeholder={
                    selectedTripScope === 'domestic'
                      ? 'e.g., Napa Valley, Miami'
                      : 'e.g., Paris, Tokyo'
                  }
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            )}
          </View>

          {/* Date Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={colors.secondary} />
              <Text style={styles.sectionTitle}>When?</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.datesContainer}
            >
              {generateDates().map((date, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.dateCard,
                    selectedDate.toDateString() === date.toDateString() && styles.dateCardSelected,
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text
                    style={[
                      styles.dateDayName,
                      selectedDate.toDateString() === date.toDateString() &&
                        styles.dateTextSelected,
                    ]}
                  >
                    {formatDateLabel(date, index)}
                  </Text>
                  <Text
                    style={[
                      styles.dateDayNumber,
                      selectedDate.toDateString() === date.toDateString() &&
                        styles.dateTextSelected,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  <Text
                    style={[
                      styles.dateMonth,
                      selectedDate.toDateString() === date.toDateString() &&
                        styles.dateTextSelected,
                    ]}
                  >
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Budget Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <DollarSign size={20} color={colors.secondary} />
              <Text style={styles.sectionTitle}>Budget</Text>
            </View>
            <View style={styles.budgetContainer}>
              {budgetOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.budgetCard,
                    selectedBudget === option.value && styles.budgetCardSelected,
                  ]}
                  onPress={() => setSelectedBudget(option.value)}
                >
                  <Text
                    style={[
                      styles.budgetLabel,
                      selectedBudget === option.value && styles.budgetTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.budgetRange,
                      selectedBudget === option.value && styles.budgetRangeSelected,
                    ]}
                  >
                    {option.range}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Surprise Toggle */}
          <Pressable style={styles.surpriseToggle} onPress={() => setIsSurprise(!isSurprise)}>
            <View style={styles.surpriseContent}>
              {isSurprise ? (
                <EyeOff size={24} color={colors.secondary} />
              ) : (
                <Eye size={24} color={colors.textSecondary} />
              )}
              <View style={styles.surpriseText}>
                <Text style={styles.surpriseTitle}>Surprise Mode</Text>
                <Text style={styles.surpriseDescription}>
                  Keep the details hidden from your partner
                </Text>
              </View>
            </View>
            <View style={[styles.toggle, isSurprise && styles.toggleActive]}>
              <View style={[styles.toggleDot, isSurprise && styles.toggleDotActive]} />
            </View>
          </Pressable>

          {/* Generate Button */}
          <Pressable
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <>
                {hasGenerated ? (
                  <RefreshCw size={20} color={colors.textLight} />
                ) : (
                  <Sparkles size={20} color={colors.textLight} />
                )}
                <Text style={styles.generateButtonText}>
                  {hasGenerated ? 'Regenerate Ideas' : 'Generate Date Ideas'}
                </Text>
              </>
            )}
          </Pressable>

          {/* Suggestions */}
          {hasGenerated && suggestions.length > 0 && (
            <View style={styles.suggestionsSection}>
              <Text style={styles.suggestionsTitle}>
                {selectedTripScope === 'local'
                  ? 'Local Date Ideas'
                  : selectedTripScope === 'domestic'
                    ? 'Domestic Getaway Ideas'
                    : 'International Adventure Ideas'}
              </Text>
              {suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion.id}
                  style={[
                    styles.suggestionCard,
                    selectedSuggestion?.id === suggestion.id && styles.suggestionCardSelected,
                  ]}
                  onPress={() => handleSelectSuggestion(suggestion)}
                >
                  <Image source={{ uri: suggestion.imageUrl }} style={styles.suggestionImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.suggestionGradient}
                  />
                  <View style={styles.suggestionBadge}>
                    <Text style={styles.suggestionBadgeText}>{suggestion.matchScore}% Match</Text>
                  </View>
                  {suggestion.destination && (
                    <View style={styles.destinationBadge}>
                      <MapPin size={12} color={colors.textLight} />
                      <Text style={styles.destinationBadgeText}>{suggestion.destination}</Text>
                    </View>
                  )}
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                    <Text style={styles.suggestionDescription} numberOfLines={2}>
                      {suggestion.description}
                    </Text>
                    <View style={styles.suggestionMeta}>
                      <View style={styles.metaItem}>
                        <Clock size={14} color={colors.textLight} />
                        <Text style={styles.metaText}>{suggestion.estimatedDuration}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <DollarSign size={14} color={colors.textLight} />
                        <Text style={styles.metaText}>{suggestion.estimatedTotalCost}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MapPin size={14} color={colors.textLight} />
                        <Text style={styles.metaText}>{suggestion.activities.length} stops</Text>
                      </View>
                    </View>
                  </View>
                  {selectedSuggestion?.id === suggestion.id && (
                    <View style={styles.selectedOverlay}>
                      <Check size={32} color={colors.textLight} />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          )}

          {hasGenerated && suggestions.length === 0 && (
            <View style={styles.noSuggestionsContainer}>
              <Text style={styles.noSuggestionsText}>
                No suggestions found for your criteria. Try adjusting your budget or trip type.
              </Text>
            </View>
          )}

          {/* Selected Suggestion Preview */}
          {selectedSuggestion && (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>Itinerary Preview</Text>
              <View style={styles.timeline}>
                {selectedSuggestion.activities.map((activity, index) => (
                  <View key={index} style={styles.timelineItem}>
                    <View style={styles.timelineDot}>
                      <View style={styles.timelineDotInner} />
                    </View>
                    {index < selectedSuggestion.activities.length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTime}>{activity.startTime}</Text>
                      <Text style={styles.timelineName}>{activity.name}</Text>
                      <Text style={styles.timelineLocation}>{activity.location.name}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <Pressable style={styles.customizeButton} onPress={handleCustomize}>
                <Text style={styles.customizeButtonText}>Customize This Date</Text>
                <ChevronRight size={20} color={colors.textLight} />
              </Pressable>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
    height: 140,
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
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
  },
  contentContainer: {
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  partnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
  },
  partnerText: {
    marginLeft: 12,
    fontSize: 15,
    color: colors.textSecondary,
  },
  partnerName: {
    fontWeight: '600',
    color: colors.text,
  },
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
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  tripScopeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  tripScopeOption: {
    flex: 1,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    position: 'relative',
  },
  tripScopeOptionSelected: {
    borderColor: colors.secondary,
    backgroundColor: `${colors.secondary}08`,
  },
  tripScopeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.secondary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tripScopeIconSelected: {
    backgroundColor: colors.secondary,
  },
  tripScopeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  tripScopeLabelSelected: {
    color: colors.secondary,
  },
  tripScopeDesc: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  tripScopeDescSelected: {
    color: colors.secondary,
  },
  tripScopeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationContainer: {
    marginTop: 16,
  },
  destinationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  destinationInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  datesContainer: {
    gap: 10,
  },
  dateCard: {
    width: 70,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  dateCardSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  dateDayName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateDayNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  dateMonth: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dateTextSelected: {
    color: colors.textLight,
  },
  budgetContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  budgetCard: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  budgetCardSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  budgetLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  budgetRange: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  budgetTextSelected: {
    color: colors.textLight,
  },
  budgetRangeSelected: {
    color: colors.textLight,
    opacity: 0.9,
  },
  surpriseToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  surpriseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  surpriseText: {
    flex: 1,
  },
  surpriseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  surpriseDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    backgroundColor: colors.border,
    borderRadius: 15,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: colors.secondary,
  },
  toggleDot: {
    width: 26,
    height: 26,
    backgroundColor: colors.surface,
    borderRadius: 13,
  },
  toggleDotActive: {
    transform: [{ translateX: 20 }],
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textLight,
  },
  suggestionsSection: {
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  suggestionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    height: 220,
    position: 'relative',
  },
  suggestionCardSelected: {
    borderWidth: 3,
    borderColor: colors.secondary,
  },
  suggestionImage: {
    width: '100%',
    height: '100%',
  },
  suggestionGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  suggestionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  suggestionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  destinationBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  destinationBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textLight,
  },
  suggestionContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  suggestionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 13,
    color: colors.textLight,
    opacity: 0.9,
    marginBottom: 12,
  },
  suggestionMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textLight,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(244, 132, 95, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSuggestionsContainer: {
    padding: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    alignItems: 'center',
  },
  noSuggestionsText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  previewSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  timeline: {
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${colors.secondary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
  },
  timelineLine: {
    position: 'absolute',
    left: 11,
    top: 24,
    bottom: 0,
    width: 2,
    backgroundColor: colors.border,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 16,
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
  },
  timelineName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  timelineLocation: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  customizeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textLight,
  },
  bottomSpacer: {
    height: 40,
  },
});
