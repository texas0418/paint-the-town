/* eslint-disable max-lines -- tracked in #1 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  ChevronRight,
  Check,
  ChevronLeft,
  User,
  Heart,
  UsersRound,
  UtensilsCrossed,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { destinations } from '@/mocks/destinations';
import { travelStyles, foodPreferences } from '@/mocks/preferences';
import { TravelStyle, Trip, DayItinerary, Activity } from '@/types';
import { useApp } from '@/contexts/AppContext';

const BUDGET_OPTIONS = [
  { id: 'budget', label: 'Budget', range: '$500 - $1,000', value: 750 },
  { id: 'moderate', label: 'Moderate', range: '$1,000 - $2,500', value: 1750 },
  { id: 'comfort', label: 'Comfort', range: '$2,500 - $5,000', value: 3750 },
  { id: 'luxury', label: 'Luxury', range: '$5,000 - $10,000', value: 7500 },
  { id: 'ultra', label: 'Ultra Luxury', range: '$10,000+', value: 15000 },
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ACTIVITY_TEMPLATES = [
  {
    name: 'Morning Exploration',
    category: 'Sightseeing',
    time: '09:00',
    duration: '2 hours',
    icon: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400',
  },
  {
    name: 'Local Cuisine Experience',
    category: 'Dining',
    time: '12:00',
    duration: '1.5 hours',
    icon: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
  },
  {
    name: 'Cultural Discovery',
    category: 'Cultural',
    time: '14:30',
    duration: '2 hours',
    icon: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400',
  },
  {
    name: 'Sunset Experience',
    category: 'Entertainment',
    time: '18:00',
    duration: '2 hours',
    icon: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  },
  {
    name: 'Evening Dinner',
    category: 'Dining',
    time: '20:00',
    duration: '2 hours',
    icon: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
  },
];

const generateItinerary = (
  destination: (typeof destinations)[0],
  startDate: Date,
  endDate: Date,
  budget: number
): DayItinerary[] => {
  const days: DayItinerary[] = [];
  const currentDate = new Date(startDate);
  let dayNum = 1;

  while (currentDate <= endDate) {
    const dayTitles = [
      `Arrival & ${destination.name} Discovery`,
      `Exploring ${destination.name}`,
      `Adventure Day in ${destination.name}`,
      `Cultural Immersion`,
      `Hidden Gems`,
      `Relaxation & Local Life`,
      `Departure Day`,
    ];

    const activities: Activity[] = ACTIVITY_TEMPLATES.slice(
      0,
      dayNum === 1
        ? 3
        : dayNum ===
            Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
          ? 2
          : 4
    ).map((template, idx) => ({
      id: `gen-${dayNum}-${idx}-${Date.now()}`,
      name: template.name,
      description: `Experience ${template.name.toLowerCase()} in ${destination.name}`,
      image: template.icon,
      duration: template.duration,
      price: Math.floor(budget * 0.05 * (Math.random() * 0.5 + 0.5)),
      currency: 'USD',
      category: template.category,
      rating: 4.5 + Math.random() * 0.4,
      time: template.time,
      location: destination.name,
      isBooked: false,
    }));

    days.push({
      day: dayNum,
      date: currentDate.toISOString().split('T')[0],
      title: dayTitles[(dayNum - 1) % dayTitles.length],
      activities,
    });

    currentDate.setDate(currentDate.getDate() + 1);
    dayNum++;
  }

  return days;
};

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function PlanTripScreen() {
  const router = useRouter();
  const { addTrip } = useApp();
  const [destination, setDestination] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [travelers, setTravelers] = useState(2);
  const [selectedDest, setSelectedDest] = useState<(typeof destinations)[0] | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [showBudgetPicker, setShowBudgetPicker] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<(typeof BUDGET_OPTIONS)[0] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTravelStylePicker, setShowTravelStylePicker] = useState(false);
  const [selectedTravelStyle, setSelectedTravelStyle] = useState<TravelStyle | null>(null);
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [selectedFoodPreferences, setSelectedFoodPreferences] = useState<string[]>([]);

  const getTravelStyleIcon = (iconName: string, isSelected: boolean) => {
    const iconColor = isSelected ? colors.textLight : colors.primary;
    const size = 24;
    switch (iconName) {
      case 'User':
        return <User size={size} color={iconColor} />;
      case 'Heart':
        return <Heart size={size} color={iconColor} />;
      case 'Users':
        return <Users size={size} color={iconColor} />;
      case 'UsersRound':
        return <UsersRound size={size} color={iconColor} />;
      default:
        return <User size={size} color={iconColor} />;
    }
  };

  const formatDateRange = () => {
    if (!startDate) return null;
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const start = startDate.toLocaleDateString('en-US', options);
    if (!endDate) return start;
    const end = endDate.toLocaleDateString('en-US', options);
    return `${start} - ${end}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);

    if (!startDate || (startDate && endDate)) {
      setStartDate(selected);
      setEndDate(null);
    } else {
      if (selected < startDate) {
        setEndDate(startDate);
        setStartDate(selected);
      } else {
        setEndDate(selected);
      }
    }
  };

  const isDateInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const current = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    return current > startDate && current < endDate;
  };

  const isDateSelected = (day: number) => {
    const current = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    if (startDate && current.toDateString() === startDate.toDateString()) return 'start';
    if (endDate && current.toDateString() === endDate.toDateString()) return 'end';
    return null;
  };

  const isPastDate = (day: number) => {
    const current = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return current < today;
  };

  const navigateMonth = (direction: number) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const filteredDestinations = destinations.filter(
    (d) =>
      d.name.toLowerCase().includes(destination.toLowerCase()) ||
      d.country.toLowerCase().includes(destination.toLowerCase())
  );

  const selectDestination = (dest: (typeof destinations)[0]) => {
    setSelectedDest(dest);
    setDestination(dest.name);
    setShowSuggestions(false);
  };

  const suggestedDestinations = destinations.slice(0, 3);

  const handleGenerateItinerary = async () => {
    if (!selectedDest) {
      Alert.alert('Missing Destination', 'Please select a destination to continue.');
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert('Missing Dates', 'Please select your travel dates to continue.');
      return;
    }
    if (!selectedBudget) {
      Alert.alert('Missing Budget', 'Please set your budget to continue.');
      return;
    }

    setIsGenerating(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const itinerary = generateItinerary(selectedDest, startDate, endDate, selectedBudget.value);

      const newTrip: Trip = {
        id: `trip-${Date.now()}`,
        destination: selectedDest,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'planning',
        totalBudget: selectedBudget.value * travelers,
        spentBudget: 0,
        currency: 'USD',
        travelers,
        itinerary,
        coverImage: selectedDest.image,
      };

      addTrip(newTrip);
      console.log('Trip created:', newTrip.id);

      router.replace(`/trip/${newTrip.id}`);
    } catch (error) {
      console.log('Error generating itinerary:', error);
      Alert.alert('Error', 'Failed to generate itinerary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleFoodPreference = (id: string) => {
    setSelectedFoodPreferences((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const getSelectedFoodNames = () => {
    if (selectedFoodPreferences.length === 0) return null;
    const names = selectedFoodPreferences
      .map((id) => foodPreferences.find((f) => f.id === id)?.name)
      .filter(Boolean);
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  };

  const isFormComplete =
    selectedDest && startDate && endDate && selectedBudget && selectedTravelStyle;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.headerGradient}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.aiIcon}>
              <Sparkles size={24} color={colors.textLight} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Plan with AI</Text>
              <Text style={styles.headerSubtitle}>Tell us about your dream trip</Text>
            </View>
          </View>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <X size={22} color={colors.textLight} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Where do you want to go?</Text>
            <View style={styles.inputContainer}>
              <MapPin size={20} color={colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Search destinations..."
                placeholderTextColor={colors.textTertiary}
                value={destination}
                onChangeText={(text) => {
                  setDestination(text);
                  setShowSuggestions(text.length > 0);
                  if (!text) setSelectedDest(null);
                }}
                onFocus={() => setShowSuggestions(destination.length > 0)}
              />
              {destination.length > 0 && (
                <Pressable
                  onPress={() => {
                    setDestination('');
                    setSelectedDest(null);
                  }}
                >
                  <X size={18} color={colors.textTertiary} />
                </Pressable>
              )}
            </View>

            {showSuggestions && filteredDestinations.length > 0 && (
              <View style={styles.suggestions}>
                {filteredDestinations.slice(0, 4).map((dest) => (
                  <Pressable
                    key={dest.id}
                    style={styles.suggestionItem}
                    onPress={() => selectDestination(dest)}
                  >
                    <Image
                      source={{ uri: dest.image }}
                      style={styles.suggestionImage}
                      contentFit="cover"
                    />
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionName}>{dest.name}</Text>
                      <Text style={styles.suggestionCountry}>{dest.country}</Text>
                    </View>
                    <ChevronRight size={18} color={colors.textTertiary} />
                  </Pressable>
                ))}
              </View>
            )}

            {!destination && (
              <View style={styles.quickPicks}>
                <Text style={styles.quickPicksLabel}>Popular choices</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickPicksContent}
                >
                  {suggestedDestinations.map((dest) => (
                    <Pressable
                      key={dest.id}
                      style={styles.quickPickCard}
                      onPress={() => selectDestination(dest)}
                    >
                      <Image
                        source={{ uri: dest.image }}
                        style={styles.quickPickImage}
                        contentFit="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.quickPickGradient}
                      />
                      <View style={styles.quickPickContent}>
                        <Text style={styles.quickPickName}>{dest.name}</Text>
                        <Text style={styles.quickPickCountry}>{dest.country}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>When are you traveling?</Text>
            <Pressable style={styles.inputContainer} onPress={() => setShowDatePicker(true)}>
              <Calendar size={20} color={startDate ? colors.primary : colors.textTertiary} />
              <Text style={startDate ? styles.inputText : styles.placeholderText}>
                {formatDateRange() || 'Select dates'}
              </Text>
              <ChevronRight size={18} color={colors.textTertiary} />
            </Pressable>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>How are you traveling?</Text>
            <Pressable style={styles.inputContainer} onPress={() => setShowTravelStylePicker(true)}>
              {selectedTravelStyle ? (
                getTravelStyleIcon(selectedTravelStyle.icon, false)
              ) : (
                <Users size={20} color={colors.textTertiary} />
              )}
              <Text style={selectedTravelStyle ? styles.inputText : styles.placeholderText}>
                {selectedTravelStyle ? selectedTravelStyle.name : 'Select travel style'}
              </Text>
              <ChevronRight size={18} color={colors.textTertiary} />
            </Pressable>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>How many travelers?</Text>
            <View style={styles.travelersContainer}>
              <Users size={20} color={colors.textTertiary} />
              <View style={styles.travelersControl}>
                <Pressable
                  style={[styles.controlButton, travelers <= 1 && styles.controlButtonDisabled]}
                  onPress={() => setTravelers(Math.max(1, travelers - 1))}
                  disabled={travelers <= 1}
                >
                  <Text style={styles.controlButtonText}>-</Text>
                </Pressable>
                <Text style={styles.travelersCount}>{travelers}</Text>
                <Pressable style={styles.controlButton} onPress={() => setTravelers(travelers + 1)}>
                  <Text style={styles.controlButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Budget per person</Text>
            <Pressable style={styles.inputContainer} onPress={() => setShowBudgetPicker(true)}>
              <DollarSign size={20} color={selectedBudget ? colors.primary : colors.textTertiary} />
              <Text style={selectedBudget ? styles.inputText : styles.placeholderText}>
                {selectedBudget
                  ? `${selectedBudget.label} (${selectedBudget.range})`
                  : 'Set your budget'}
              </Text>
              <ChevronRight size={18} color={colors.textTertiary} />
            </Pressable>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Food preferences</Text>
            <Pressable style={styles.inputContainer} onPress={() => setShowFoodPicker(true)}>
              <UtensilsCrossed
                size={20}
                color={selectedFoodPreferences.length > 0 ? colors.primary : colors.textTertiary}
              />
              <Text
                style={
                  selectedFoodPreferences.length > 0 ? styles.inputText : styles.placeholderText
                }
              >
                {getSelectedFoodNames() || 'Select cuisines you enjoy'}
              </Text>
              <ChevronRight size={18} color={colors.textTertiary} />
            </Pressable>
          </View>

          <View style={styles.aiNote}>
            <Sparkles size={16} color={colors.primaryLight} />
            <Text style={styles.aiNoteText}>
              Our AI will create a personalized itinerary based on your preferences and travel
              style.
            </Text>
          </View>

          <View style={styles.spacer} />
        </ScrollView>

        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Dates</Text>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              <View style={styles.calendarNav}>
                <Pressable onPress={() => navigateMonth(-1)} style={styles.navButton}>
                  <ChevronLeft size={24} color={colors.text} />
                </Pressable>
                <Text style={styles.calendarMonth}>
                  {MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </Text>
                <Pressable onPress={() => navigateMonth(1)} style={styles.navButton}>
                  <ChevronRight size={24} color={colors.text} />
                </Pressable>
              </View>

              <View style={styles.calendarDays}>
                {DAYS.map((day) => (
                  <Text key={day} style={styles.dayLabel}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {(() => {
                  const { firstDay, daysInMonth } = getDaysInMonth(calendarMonth);
                  const days = [];
                  for (let i = 0; i < firstDay; i++) {
                    days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
                  }
                  for (let day = 1; day <= daysInMonth; day++) {
                    const selected = isDateSelected(day);
                    const inRange = isDateInRange(day);
                    const past = isPastDate(day);
                    days.push(
                      <Pressable
                        key={day}
                        style={[
                          styles.dayCell,
                          inRange && styles.dayCellInRange,
                          selected === 'start' && styles.dayCellStart,
                          selected === 'end' && styles.dayCellEnd,
                        ]}
                        onPress={() => !past && handleDateSelect(day)}
                        disabled={past}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            past && styles.dayTextPast,
                            selected && styles.dayTextSelected,
                          ]}
                        >
                          {day}
                        </Text>
                      </Pressable>
                    );
                  }
                  return days;
                })()}
              </View>

              <View style={styles.datePreview}>
                <View style={styles.datePreviewItem}>
                  <Text style={styles.datePreviewLabel}>Start</Text>
                  <Text style={styles.datePreviewValue}>
                    {startDate
                      ? startDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Not selected'}
                  </Text>
                </View>
                <View style={styles.datePreviewDivider} />
                <View style={styles.datePreviewItem}>
                  <Text style={styles.datePreviewLabel}>End</Text>
                  <Text style={styles.datePreviewValue}>
                    {endDate
                      ? endDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Not selected'}
                  </Text>
                </View>
              </View>

              <Pressable
                style={[styles.modalButton, (!startDate || !endDate) && styles.modalButtonDisabled]}
                onPress={() => setShowDatePicker(false)}
                disabled={!startDate || !endDate}
              >
                <Text style={styles.modalButtonText}>Confirm Dates</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showTravelStylePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTravelStylePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>How are you traveling?</Text>
                <Pressable onPress={() => setShowTravelStylePicker(false)}>
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              <Text style={styles.budgetSubtitle}>This helps us tailor your itinerary</Text>

              <View style={styles.travelStyleOptions}>
                {travelStyles.map((style) => {
                  const isSelected = selectedTravelStyle?.id === style.id;
                  return (
                    <Pressable
                      key={style.id}
                      style={[styles.travelStyleCard, isSelected && styles.travelStyleCardSelected]}
                      onPress={() => setSelectedTravelStyle(style)}
                    >
                      <View
                        style={[
                          styles.travelStyleIcon,
                          isSelected && styles.travelStyleIconSelected,
                        ]}
                      >
                        {getTravelStyleIcon(style.icon, isSelected)}
                      </View>
                      <View style={styles.travelStyleInfo}>
                        <Text
                          style={[
                            styles.travelStyleName,
                            isSelected && styles.travelStyleNameSelected,
                          ]}
                        >
                          {style.name}
                        </Text>
                        <Text style={styles.travelStyleDesc}>{style.description}</Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkCircleSmall}>
                          <Check size={14} color={colors.textLight} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                style={[styles.modalButton, !selectedTravelStyle && styles.modalButtonDisabled]}
                onPress={() => setShowTravelStylePicker(false)}
                disabled={!selectedTravelStyle}
              >
                <Text style={styles.modalButtonText}>Confirm Style</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showBudgetPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowBudgetPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Budget</Text>
                <Pressable onPress={() => setShowBudgetPicker(false)}>
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              <Text style={styles.budgetSubtitle}>Per person, for the entire trip</Text>

              <View style={styles.budgetOptions}>
                {BUDGET_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.budgetOption,
                      selectedBudget?.id === option.id && styles.budgetOptionSelected,
                    ]}
                    onPress={() => setSelectedBudget(option)}
                  >
                    <View style={styles.budgetOptionContent}>
                      <Text
                        style={[
                          styles.budgetOptionLabel,
                          selectedBudget?.id === option.id && styles.budgetOptionLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.budgetOptionRange,
                          selectedBudget?.id === option.id && styles.budgetOptionRangeSelected,
                        ]}
                      >
                        {option.range}
                      </Text>
                    </View>
                    {selectedBudget?.id === option.id && <Check size={20} color={colors.primary} />}
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[styles.modalButton, !selectedBudget && styles.modalButtonDisabled]}
                onPress={() => setShowBudgetPicker(false)}
                disabled={!selectedBudget}
              >
                <Text style={styles.modalButtonText}>Confirm Budget</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showFoodPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFoodPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.foodModalContent]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Food Preferences</Text>
                <Pressable onPress={() => setShowFoodPicker(false)}>
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              <Text style={styles.budgetSubtitle}>
                Select cuisines you would like to experience
              </Text>

              <ScrollView
                style={styles.foodScrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.foodGrid}
              >
                {foodPreferences.map((food) => {
                  const isSelected = selectedFoodPreferences.includes(food.id);
                  return (
                    <Pressable
                      key={food.id}
                      style={[styles.foodChip, isSelected && styles.foodChipSelected]}
                      onPress={() => toggleFoodPreference(food.id)}
                    >
                      <Text style={styles.foodEmoji}>{food.emoji}</Text>
                      <Text
                        style={[styles.foodChipText, isSelected && styles.foodChipTextSelected]}
                      >
                        {food.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.foodCheckmark}>
                          <Check size={12} color={colors.textLight} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.foodFooter}>
                <Text style={styles.foodSelectedCount}>
                  {selectedFoodPreferences.length} selected
                </Text>
                <Pressable style={styles.modalButton} onPress={() => setShowFoodPicker(false)}>
                  <Text style={styles.modalButtonText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.footer}>
          <Pressable
            style={[
              styles.generateButton,
              (!isFormComplete || isGenerating) && styles.generateButtonDisabled,
            ]}
            disabled={!isFormComplete || isGenerating}
            onPress={handleGenerateItinerary}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={colors.textLight} />
            ) : (
              <Sparkles size={20} color={colors.textLight} />
            )}
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Generating...' : 'Generate Itinerary'}
            </Text>
          </Pressable>
        </View>
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
    height: 200,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  aiIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textLight,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.accent,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 20,
  },
  formSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    color: colors.textTertiary,
  },
  suggestions: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  suggestionImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  suggestionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  suggestionCountry: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quickPicks: {
    marginTop: 20,
  },
  quickPicksLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  quickPicksContent: {
    gap: 12,
  },
  quickPickCard: {
    width: 140,
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 12,
  },
  quickPickImage: {
    width: '100%',
    height: '100%',
  },
  quickPickGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  quickPickContent: {
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  quickPickName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  quickPickCountry: {
    fontSize: 12,
    color: colors.textLight,
    opacity: 0.85,
  },
  travelersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  travelersControl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  controlButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textLight,
  },
  travelersCount: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  aiNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 32,
    padding: 16,
    backgroundColor: colors.accent,
    borderRadius: 14,
  },
  aiNoteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryDark,
  },
  spacer: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  generateButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textLight,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  calendarNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  calendarDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellInRange: {
    backgroundColor: colors.accent,
  },
  dayCellStart: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  dayCellEnd: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  dayText: {
    fontSize: 16,
    color: colors.text,
  },
  dayTextPast: {
    color: colors.textTertiary,
  },
  dayTextSelected: {
    color: colors.textLight,
    fontWeight: '600',
  },
  datePreview: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  datePreviewItem: {
    flex: 1,
  },
  datePreviewLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  datePreviewValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  datePreviewDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textLight,
  },
  budgetSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  budgetOptions: {
    gap: 10,
    marginBottom: 24,
  },
  budgetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
  },
  budgetOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  budgetOptionContent: {
    flex: 1,
  },
  budgetOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  budgetOptionLabelSelected: {
    color: colors.primary,
  },
  budgetOptionRange: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  budgetOptionRangeSelected: {
    color: colors.primaryLight,
  },
  travelStyleOptions: {
    gap: 12,
    marginBottom: 24,
  },
  travelStyleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  travelStyleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  travelStyleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  travelStyleIconSelected: {
    backgroundColor: colors.primary,
  },
  travelStyleInfo: {
    flex: 1,
    marginLeft: 14,
  },
  travelStyleName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  travelStyleNameSelected: {
    color: colors.primaryDark,
  },
  travelStyleDesc: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  checkCircleSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodModalContent: {
    maxHeight: '80%',
  },
  foodScrollView: {
    maxHeight: 340,
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 16,
  },
  foodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 6,
  },
  foodChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  foodEmoji: {
    fontSize: 18,
  },
  foodChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  foodChipTextSelected: {
    color: colors.primaryDark,
  },
  foodCheckmark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  foodFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  foodSelectedCount: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
