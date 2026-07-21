/* eslint-disable max-lines -- tracked in #1 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Clock,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  X,
  Check,
  Pencil,
  Heart,
  Gift,
  Home,
  Map,
  Plane,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useDateNight } from '@/contexts/DateNightContext';
import {
  ItineraryActivity,
  BudgetTier,
  ActivityType,
  PartnerProfile,
  TripScope,
} from '@/types/date-night';

const activityTypes: {
  value: ActivityType | 'dining' | 'drinks' | 'dessert' | 'transportation' | 'accommodation';
  label: string;
  emoji: string;
}[] = [
  { value: 'dining', label: 'Dining', emoji: '🍽️' },
  { value: 'drinks', label: 'Drinks', emoji: '🍸' },
  { value: 'dessert', label: 'Dessert', emoji: '🍰' },
  { value: 'romantic', label: 'Romantic', emoji: '💕' },
  { value: 'adventurous', label: 'Adventure', emoji: '🎢' },
  { value: 'relaxed', label: 'Relaxed', emoji: '😌' },
  { value: 'creative', label: 'Creative', emoji: '🎨' },
  { value: 'active', label: 'Active', emoji: '🏃' },
  { value: 'cultural', label: 'Cultural', emoji: '🏛️' },
  { value: 'social', label: 'Social', emoji: '🎉' },
  { value: 'intimate', label: 'Intimate', emoji: '🕯️' },
  { value: 'transportation', label: 'Transport', emoji: '🚗' },
  { value: 'accommodation', label: 'Stay', emoji: '🏨' },
];

const budgetTiers: BudgetTier[] = ['$', '$$', '$$$', '$$$$'];

const tripScopeOptions: { value: TripScope; label: string; icon: any; emoji: string }[] = [
  { value: 'local', label: 'Local', icon: Home, emoji: '📍' },
  { value: 'domestic', label: 'Domestic', icon: Map, emoji: '🚗' },
  { value: 'international', label: 'International', icon: Plane, emoji: '✈️' },
];

interface ActivityFormData {
  name: string;
  description: string;
  type: ActivityType | 'dining' | 'drinks' | 'dessert' | 'transportation' | 'accommodation';
  locationName: string;
  locationAddress: string;
  startTime: string;
  endTime: string;
  estimatedCost: BudgetTier;
  reservationRequired: boolean;
  notes: string;
}

const emptyActivity: ActivityFormData = {
  name: '',
  description: '',
  type: 'dining',
  locationName: '',
  locationAddress: '',
  startTime: '',
  endTime: '',
  estimatedCost: '$$',
  reservationRequired: false,
  notes: '',
};

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function BuildItineraryScreen() {
  const router = useRouter();
  const { partners, createItinerary, setCurrentItinerary } = useDateNight();

  // Itinerary details
  const [itineraryName, setItineraryName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPartner, setSelectedPartner] = useState<PartnerProfile | null>(
    partners.length > 0 ? partners[0] : null
  );
  const [isSurprise, setIsSurprise] = useState(false);
  const [overallBudget, setOverallBudget] = useState<BudgetTier>('$$');
  const [tripScope, setTripScope] = useState<TripScope>('local');
  const [destination, setDestination] = useState('');

  // Activities
  const [activities, setActivities] = useState<(ActivityFormData & { id: string })[]>([]);

  // Modals
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityForm, setActivityForm] = useState<ActivityFormData>(emptyActivity);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleAddActivity = () => {
    setEditingActivityId(null);
    setActivityForm(emptyActivity);
    setShowActivityModal(true);
  };

  const handleEditActivity = (activity: ActivityFormData & { id: string }) => {
    setEditingActivityId(activity.id);
    setActivityForm(activity);
    setShowActivityModal(true);
  };

  const handleSaveActivity = () => {
    if (!activityForm.name.trim()) {
      Alert.alert('Enter Name', 'Please enter an activity name.');
      return;
    }
    if (!activityForm.startTime.trim()) {
      Alert.alert('Enter Time', 'Please enter a start time.');
      return;
    }

    if (editingActivityId) {
      setActivities((prev) =>
        prev.map((a) =>
          a.id === editingActivityId ? { ...activityForm, id: editingActivityId } : a
        )
      );
    } else {
      setActivities((prev) => [...prev, { ...activityForm, id: generateId() }]);
    }

    setShowActivityModal(false);
    setActivityForm(emptyActivity);
    setEditingActivityId(null);
  };

  const handleDeleteActivity = (id: string) => {
    Alert.alert('Remove Activity', 'Are you sure you want to remove this activity?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setActivities((prev) => prev.filter((a) => a.id !== id)),
      },
    ]);
  };

  const handleMoveActivity = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === activities.length - 1) return;

    const newActivities = [...activities];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newActivities[index], newActivities[swapIndex]] = [
      newActivities[swapIndex],
      newActivities[index],
    ];
    setActivities(newActivities);
  };

  const handleSaveItinerary = () => {
    if (!itineraryName.trim()) {
      Alert.alert('Enter Name', 'Please give your date a name.');
      return;
    }
    if (!selectedPartner) {
      Alert.alert('Select Partner', 'Please select a partner for this date.');
      return;
    }
    if (activities.length === 0) {
      Alert.alert('Add Activities', 'Please add at least one activity to your date.');
      return;
    }
    if (tripScope !== 'local' && !destination.trim()) {
      Alert.alert('Enter Destination', 'Please enter a destination for your trip.');
      return;
    }

    const itineraryActivities: ItineraryActivity[] = activities.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      type: a.type,
      location: {
        name: a.locationName,
        address: a.locationAddress,
      },
      startTime: a.startTime,
      endTime: a.endTime,
      estimatedCost: a.estimatedCost,
      notes: a.notes,
      reservationRequired: a.reservationRequired,
      reservationMade: false,
    }));

    const itinerary = createItinerary({
      name: itineraryName,
      date: selectedDate.toISOString(),
      partnerId: selectedPartner.id,
      partnerName: selectedPartner.name,
      tripScope,
      destination: tripScope !== 'local' ? destination : undefined,
      activities: itineraryActivities,
      totalEstimatedCost: overallBudget,
      status: 'planned',
      isSurprise,
    });

    setCurrentItinerary(itinerary);

    Alert.alert('Date Created! 🎉', `Your date "${itineraryName}" has been saved.`, [
      { text: 'OK', onPress: () => router.push('/(tabs)/date-night') },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.headerGradient}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.textLight} />
          </Pressable>
          <Text style={styles.headerTitle}>Build Your Date</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Date Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date Name *</Text>
              <TextInput
                style={styles.textInput}
                value={itineraryName}
                onChangeText={setItineraryName}
                placeholder="e.g., Anniversary Dinner, Weekend Adventure"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.row}>
              <Pressable
                style={[styles.selectButton, { flex: 1 }]}
                onPress={() => setShowPartnerModal(true)}
              >
                <Users size={18} color={colors.primary} />
                <Text style={styles.selectButtonText} numberOfLines={1}>
                  {selectedPartner?.name || 'Select Partner'}
                </Text>
                <ChevronDown size={18} color={colors.textTertiary} />
              </Pressable>

              <Pressable
                style={[styles.selectButton, { flex: 1 }]}
                onPress={() => setShowDateModal(true)}
              >
                <Calendar size={18} color={colors.primary} />
                <Text style={styles.selectButtonText}>{formatDate(selectedDate)}</Text>
                <ChevronDown size={18} color={colors.textTertiary} />
              </Pressable>
            </View>
          </View>

          {/* Trip Scope Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trip Type</Text>
            <View style={styles.tripScopeContainer}>
              {tripScopeOptions.map((option) => {
                const isSelected = tripScope === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.tripScopeOption, isSelected && styles.tripScopeOptionSelected]}
                    onPress={() => setTripScope(option.value)}
                  >
                    <Text style={styles.tripScopeEmoji}>{option.emoji}</Text>
                    <Text
                      style={[styles.tripScopeLabel, isSelected && styles.tripScopeLabelSelected]}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.tripScopeCheck}>
                        <Check size={12} color={colors.textLight} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Destination Input */}
            {tripScope !== 'local' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {tripScope === 'domestic' ? 'City/Region *' : 'Country/City *'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={destination}
                  onChangeText={setDestination}
                  placeholder={
                    tripScope === 'domestic'
                      ? 'e.g., Napa Valley, Miami Beach'
                      : 'e.g., Paris, France'
                  }
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            )}
          </View>

          {/* Budget & Options */}
          <View style={styles.section}>
            <View style={styles.row}>
              <Pressable
                style={[styles.optionCard, isSurprise && styles.optionCardActive]}
                onPress={() => setIsSurprise(!isSurprise)}
              >
                <Gift size={20} color={isSurprise ? colors.textLight : colors.secondary} />
                <Text style={[styles.optionText, isSurprise && styles.optionTextActive]}>
                  Surprise
                </Text>
              </Pressable>

              <View style={styles.budgetSelector}>
                <Text style={styles.budgetLabel}>Budget:</Text>
                {budgetTiers.map((tier) => (
                  <Pressable
                    key={tier}
                    style={[styles.budgetChip, overallBudget === tier && styles.budgetChipActive]}
                    onPress={() => setOverallBudget(tier)}
                  >
                    <Text
                      style={[
                        styles.budgetChipText,
                        overallBudget === tier && styles.budgetChipTextActive,
                      ]}
                    >
                      {tier}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Activities Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Activities</Text>
              <Pressable style={styles.addButton} onPress={handleAddActivity}>
                <Plus size={18} color={colors.primary} />
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>

            {activities.length === 0 ? (
              <Pressable style={styles.emptyState} onPress={handleAddActivity}>
                <View style={styles.emptyIcon}>
                  <Plus size={32} color={colors.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No activities yet</Text>
                <Text style={styles.emptyDescription}>Tap to add your first activity</Text>
              </Pressable>
            ) : (
              activities.map((activity, index) => (
                <View key={activity.id} style={styles.activityCard}>
                  <View style={styles.activityOrder}>
                    <Pressable
                      onPress={() => handleMoveActivity(index, 'up')}
                      disabled={index === 0}
                      style={[styles.orderButton, index === 0 && styles.orderButtonDisabled]}
                    >
                      <Text style={styles.orderButtonText}>▲</Text>
                    </Pressable>
                    <Text style={styles.orderNumber}>{index + 1}</Text>
                    <Pressable
                      onPress={() => handleMoveActivity(index, 'down')}
                      disabled={index === activities.length - 1}
                      style={[
                        styles.orderButton,
                        index === activities.length - 1 && styles.orderButtonDisabled,
                      ]}
                    >
                      <Text style={styles.orderButtonText}>▼</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    style={styles.activityContent}
                    onPress={() => handleEditActivity(activity)}
                  >
                    <View style={styles.activityHeader}>
                      <View style={styles.activityTypeChip}>
                        <Text style={styles.activityTypeEmoji}>
                          {activityTypes.find((t) => t.value === activity.type)?.emoji || '📍'}
                        </Text>
                        <Text style={styles.activityTypeText}>
                          {activityTypes.find((t) => t.value === activity.type)?.label ||
                            activity.type}
                        </Text>
                      </View>
                      <Text style={styles.activityBudget}>{activity.estimatedCost}</Text>
                    </View>

                    <Text style={styles.activityName}>{activity.name}</Text>

                    <View style={styles.activityMeta}>
                      <View style={styles.metaItem}>
                        <Clock size={14} color={colors.textSecondary} />
                        <Text style={styles.metaText}>
                          {activity.startTime}
                          {activity.endTime ? ` - ${activity.endTime}` : ''}
                        </Text>
                      </View>
                      {activity.locationName && (
                        <View style={styles.metaItem}>
                          <MapPin size={14} color={colors.textSecondary} />
                          <Text style={styles.metaText} numberOfLines={1}>
                            {activity.locationName}
                          </Text>
                        </View>
                      )}
                    </View>

                    {activity.reservationRequired && (
                      <View style={styles.reservationBadge}>
                        <Clock size={12} color={colors.warning} />
                        <Text style={styles.reservationText}>Reservation needed</Text>
                      </View>
                    )}
                  </Pressable>

                  <View style={styles.activityActions}>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => handleEditActivity(activity)}
                    >
                      <Pencil size={18} color={colors.primary} />
                    </Pressable>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => handleDeleteActivity(activity.id)}
                    >
                      <Trash2 size={18} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              ))
            )}

            {activities.length > 0 && (
              <Pressable style={styles.addMoreButton} onPress={handleAddActivity}>
                <Plus size={20} color={colors.primary} />
                <Text style={styles.addMoreText}>Add Another Activity</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <Pressable style={styles.saveButton} onPress={handleSaveItinerary}>
            <Heart size={20} color={colors.textLight} />
            <Text style={styles.saveButtonText}>Save Date Plan</Text>
          </Pressable>
        </View>

        {/* Activity Modal */}
        <Modal
          visible={showActivityModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowActivityModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingActivityId ? 'Edit Activity' : 'Add Activity'}
                </Text>
                <Pressable onPress={() => setShowActivityModal(false)}>
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Activity Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={activityForm.name}
                    onChangeText={(text) => setActivityForm((prev) => ({ ...prev, name: text }))}
                    placeholder="e.g., Dinner at Chez Pierre"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.formInputMultiline]}
                    value={activityForm.description}
                    onChangeText={(text) =>
                      setActivityForm((prev) => ({ ...prev, description: text }))
                    }
                    placeholder="Add any details..."
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.typeOptions}>
                      {activityTypes.map((type) => (
                        <Pressable
                          key={type.value}
                          style={[
                            styles.typeOption,
                            activityForm.type === type.value && styles.typeOptionSelected,
                          ]}
                          onPress={() => setActivityForm((prev) => ({ ...prev, type: type.value }))}
                        >
                          <Text style={styles.typeEmoji}>{type.emoji}</Text>
                          <Text
                            style={[
                              styles.typeLabel,
                              activityForm.type === type.value && styles.typeLabelSelected,
                            ]}
                          >
                            {type.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Start Time *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={activityForm.startTime}
                      onChangeText={(text) =>
                        setActivityForm((prev) => ({ ...prev, startTime: text }))
                      }
                      placeholder="6:00 PM"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>End Time</Text>
                    <TextInput
                      style={styles.formInput}
                      value={activityForm.endTime}
                      onChangeText={(text) =>
                        setActivityForm((prev) => ({ ...prev, endTime: text }))
                      }
                      placeholder="8:00 PM"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Location Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={activityForm.locationName}
                    onChangeText={(text) =>
                      setActivityForm((prev) => ({ ...prev, locationName: text }))
                    }
                    placeholder="e.g., The Italian Place"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Address</Text>
                  <TextInput
                    style={styles.formInput}
                    value={activityForm.locationAddress}
                    onChangeText={(text) =>
                      setActivityForm((prev) => ({ ...prev, locationAddress: text }))
                    }
                    placeholder="123 Main Street"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Estimated Cost</Text>
                  <View style={styles.costOptions}>
                    {budgetTiers.map((tier) => (
                      <Pressable
                        key={tier}
                        style={[
                          styles.costOption,
                          activityForm.estimatedCost === tier && styles.costOptionSelected,
                        ]}
                        onPress={() =>
                          setActivityForm((prev) => ({ ...prev, estimatedCost: tier }))
                        }
                      >
                        <Text
                          style={[
                            styles.costLabel,
                            activityForm.estimatedCost === tier && styles.costLabelSelected,
                          ]}
                        >
                          {tier}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Notes</Text>
                  <TextInput
                    style={[styles.formInput, styles.formInputMultiline]}
                    value={activityForm.notes}
                    onChangeText={(text) => setActivityForm((prev) => ({ ...prev, notes: text }))}
                    placeholder="Any special notes..."
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={2}
                  />
                </View>

                <Pressable
                  style={styles.checkboxRow}
                  onPress={() =>
                    setActivityForm((prev) => ({
                      ...prev,
                      reservationRequired: !prev.reservationRequired,
                    }))
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      activityForm.reservationRequired && styles.checkboxActive,
                    ]}
                  >
                    {activityForm.reservationRequired && (
                      <Check size={14} color={colors.textLight} />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Reservation Required</Text>
                </Pressable>
              </ScrollView>

              <Pressable style={styles.modalButton} onPress={handleSaveActivity}>
                <Text style={styles.modalButtonText}>
                  {editingActivityId ? 'Save Changes' : 'Add Activity'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Partner Selection Modal */}
        <Modal
          visible={showPartnerModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPartnerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.modalContentSmall]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Partner</Text>
                <Pressable onPress={() => setShowPartnerModal(false)}>
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView style={styles.modalScroll}>
                {partners.length === 0 ? (
                  <View style={styles.noPartners}>
                    <Text style={styles.noPartnersText}>No partners added yet</Text>
                    <Pressable
                      style={styles.addPartnerButton}
                      onPress={() => {
                        setShowPartnerModal(false);
                        router.push('/date-night/add-partner');
                      }}
                    >
                      <Text style={styles.addPartnerButtonText}>Add Partner</Text>
                    </Pressable>
                  </View>
                ) : (
                  partners.map((partner) => (
                    <Pressable
                      key={partner.id}
                      style={[
                        styles.partnerOption,
                        selectedPartner?.id === partner.id && styles.partnerOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedPartner(partner);
                        setShowPartnerModal(false);
                      }}
                    >
                      <View style={styles.partnerAvatar}>
                        <Text style={styles.avatarText}>
                          {partner.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.partnerName}>{partner.name}</Text>
                      {selectedPartner?.id === partner.id && (
                        <Check size={20} color={colors.primary} />
                      )}
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Date Selection Modal */}
        <Modal
          visible={showDateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.modalContentSmall]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <Pressable onPress={() => setShowDateModal(false)}>
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateOptions}
              >
                {Array.from({ length: 14 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const isSelected = date.toDateString() === selectedDate.toDateString();

                  return (
                    <Pressable
                      key={i}
                      style={[styles.dateOption, isSelected && styles.dateOptionSelected]}
                      onPress={() => {
                        setSelectedDate(date);
                        setShowDateModal(false);
                      }}
                    >
                      <Text style={[styles.dateDayName, isSelected && styles.dateTextSelected]}>
                        {i === 0
                          ? 'Today'
                          : i === 1
                            ? 'Tmrw'
                            : date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                      <Text style={[styles.dateDayNumber, isSelected && styles.dateTextSelected]}>
                        {date.getDate()}
                      </Text>
                      <Text style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  tripScopeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tripScopeOption: {
    flex: 1,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    position: 'relative',
  },
  tripScopeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  tripScopeEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  tripScopeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  tripScopeLabelSelected: {
    color: colors.primary,
  },
  tripScopeCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
  },
  optionCardActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  optionTextActive: {
    color: colors.textLight,
  },
  budgetSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  budgetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  budgetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  budgetChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  budgetChipTextActive: {
    color: colors.textLight,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  activityOrder: {
    width: 40,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  orderButton: {
    padding: 4,
  },
  orderButtonDisabled: {
    opacity: 0.3,
  },
  orderButtonText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginVertical: 4,
  },
  activityContent: {
    flex: 1,
    padding: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
  },
  activityTypeEmoji: {
    fontSize: 12,
  },
  activityTypeText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activityBudget: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  activityMeta: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  reservationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: `${colors.warning}15`,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  reservationText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.warning,
  },
  activityActions: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
  },
  addMoreText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
  },
  bottomSpacer: {
    height: 120,
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalContentSmall: {
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  modalScroll: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  formInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  typeOption: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  typeEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  typeLabelSelected: {
    color: colors.primary,
  },
  costOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  costOption: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  costOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  costLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  costLabelSelected: {
    color: colors.primary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 15,
    color: colors.text,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textLight,
  },
  noPartners: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noPartnersText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  addPartnerButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addPartnerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
  },
  partnerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  partnerOptionSelected: {
    backgroundColor: `${colors.primary}08`,
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
  },
  partnerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  dateOptions: {
    paddingVertical: 16,
    gap: 10,
  },
  dateOption: {
    width: 70,
    paddingVertical: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
});
