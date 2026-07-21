// Add/Edit Anniversary Screen for Paint the Town
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAnniversary } from '../hooks/useAnniversary';
import anniversaryService from '../services/anniversaryService';
import { AnniversaryType, CreateAnniversaryInput, Anniversary } from '../types/anniversary';

interface AddAnniversaryScreenProps {
  navigation: any;
  route?: {
    params?: {
      anniversaryId?: string;
    };
  };
}

const ANNIVERSARY_TYPES: {
  value: AnniversaryType;
  label: string;
  icon: string;
  description: string;
}[] = [
  { value: 'wedding', label: 'Wedding', icon: '💒', description: 'Your wedding date' },
  {
    value: 'relationship',
    label: 'Relationship',
    icon: '💑',
    description: 'When you became a couple',
  },
  { value: 'engagement', label: 'Engagement', icon: '💍', description: 'The proposal date' },
  { value: 'first_date', label: 'First Date', icon: '☕', description: 'Your first date together' },
  { value: 'first_trip', label: 'First Trip', icon: '✈️', description: 'Your first trip together' },
  { value: 'custom', label: 'Custom', icon: '🎉', description: 'Any special date' },
];

const REMINDER_OPTIONS = [
  { days: 30, label: '1 month before' },
  { days: 14, label: '2 weeks before' },
  { days: 7, label: '1 week before' },
  { days: 3, label: '3 days before' },
  { days: 1, label: '1 day before' },
  { days: 0, label: 'On the day' },
];

export const AddAnniversaryScreen: React.FC<AddAnniversaryScreenProps> = ({
  navigation,
  route,
}) => {
  const { createAnniversary, updateAnniversary, refresh } = useAnniversary();
  const editId = route?.params?.anniversaryId;
  const isEditing = !!editId;

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<AnniversaryType>('relationship');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedReminders, setSelectedReminders] = useState<number[]>([7, 3, 1]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing anniversary if editing
  useEffect(() => {
    const loadAnniversary = async () => {
      if (editId) {
        const anniversary = await anniversaryService.getAnniversaryById(editId);
        if (anniversary) {
          setName(anniversary.name);
          setType(anniversary.type);
          setDate(new Date(anniversary.date));
          setPartnerName(anniversary.partnerName || '');
          setNotes(anniversary.notes || '');
          setSelectedReminders(anniversary.reminderDays);
        }
      }
    };
    loadAnniversary();
  }, [editId]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const toggleReminder = (days: number) => {
    setSelectedReminders((prev) => {
      if (prev.includes(days)) {
        return prev.filter((d) => d !== days);
      }
      return [...prev, days].sort((a, b) => b - a);
    });
  };

  const formatDate = (d: Date): string => {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for this anniversary.');
      return false;
    }
    if (date > new Date()) {
      Alert.alert('Invalid Date', 'Anniversary date cannot be in the future.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const input: CreateAnniversaryInput = {
        name: name.trim(),
        type,
        date: date.toISOString().split('T')[0],
        partnerName: partnerName.trim() || undefined,
        notes: notes.trim() || undefined,
        reminderDays: selectedReminders,
      };

      let success;
      if (isEditing && editId) {
        success = await updateAnniversary(editId, input);
      } else {
        success = await createAnniversary(input);
      }

      if (success) {
        await refresh();
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to save anniversary. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Anniversary' : 'New Anniversary'}
          </Text>
          <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
            <Text style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Anniversary Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type of Anniversary</Text>
            <View style={styles.typeGrid}>
              {ANNIVERSARY_TYPES.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.typeCard, type === item.value && styles.typeCardSelected]}
                  onPress={() => setType(item.value)}
                >
                  <Text style={styles.typeIcon}>{item.icon}</Text>
                  <Text style={[styles.typeLabel, type === item.value && styles.typeLabelSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Name Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Anniversary Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Our Wedding Anniversary"
              placeholderTextColor="#999"
              maxLength={50}
            />
          </View>

          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={styles.dateText}>{formatDate(date)}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Partner Name (Optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Partner's Name</Text>
            <Text style={styles.sectionSubtitle}>Optional</Text>
            <TextInput
              style={styles.input}
              value={partnerName}
              onChangeText={setPartnerName}
              placeholder="Their name"
              placeholderTextColor="#999"
              maxLength={30}
            />
          </View>

          {/* Reminders */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reminders</Text>
            <Text style={styles.sectionSubtitle}>Get notified before your anniversary</Text>
            <View style={styles.reminderGrid}>
              {REMINDER_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item.days}
                  style={[
                    styles.reminderChip,
                    selectedReminders.includes(item.days) && styles.reminderChipSelected,
                  ]}
                  onPress={() => toggleReminder(item.days)}
                >
                  <Text
                    style={[
                      styles.reminderText,
                      selectedReminders.includes(item.days) && styles.reminderTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.sectionSubtitle}>Add any special memories or details</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Special memories, plans, or ideas..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{notes.length}/500</Text>
          </View>

          {/* Preview Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewIcon}>
                  {ANNIVERSARY_TYPES.find((t) => t.value === type)?.icon}
                </Text>
                <View style={styles.previewContent}>
                  <Text style={styles.previewName}>{name || 'Your Anniversary'}</Text>
                  {partnerName && <Text style={styles.previewPartner}>with {partnerName}</Text>}
                </View>
              </View>
              <Text style={styles.previewDate}>{formatDate(date)}</Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  saveButtonDisabled: {
    color: '#CCC',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginHorizontal: -6,
  },
  typeCard: {
    width: '30%',
    marginHorizontal: '1.66%',
    marginBottom: 12,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  typeIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  typeLabelSelected: {
    color: '#FF6B6B',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  notesInput: {
    height: 100,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  reminderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  reminderChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reminderChipSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  reminderText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  reminderTextSelected: {
    color: 'white',
  },
  previewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  previewContent: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  previewPartner: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  previewDate: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default AddAnniversaryScreen;
