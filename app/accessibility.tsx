import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Eye,
  Ear,
  Accessibility,
  Brain,
  UtensilsCrossed,
  MessageCircle,
  Heart,
  ChevronRight,
  Plus,
  X,
  Check,
  Info,
  AlertTriangle,
  Shield,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { AccessibilitySettings } from '@/types';

const defaultSettings: AccessibilitySettings = {
  visualAssistance: {
    enabled: false,
    largeText: false,
    highContrast: false,
    reduceMotion: false,
    screenReaderOptimized: false,
  },
  hearingAssistance: {
    enabled: false,
    visualAlerts: false,
    captionsPreferred: false,
  },
  mobilityAssistance: {
    enabled: false,
    wheelchairAccessRequired: false,
    limitedWalkingDistance: false,
    maxWalkingDistance: undefined,
    elevatorRequired: false,
    groundFloorPreferred: false,
  },
  cognitiveAssistance: {
    enabled: false,
    simplifiedInterface: false,
    extraReminders: false,
    detailedInstructions: false,
  },
  dietaryNeeds: {
    enabled: false,
    restrictions: [],
    allergies: [],
    preferences: [],
  },
  communicationPreferences: {
    preferredLanguage: 'English',
    needsTranslationAssist: false,
    signLanguageInterpreter: false,
  },
  emergencyInfo: {
    medicalConditions: [],
    medications: [],
    bloodType: undefined,
    emergencyInstructions: undefined,
  },
};

const dietaryOptions = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Kosher',
  'Halal',
  'Low-Sodium',
  'Diabetic-Friendly',
  'Nut-Free',
  'Shellfish-Free',
];

const allergyOptions = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Wheat',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
  'Sulfites',
];

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function AccessibilityScreen() {
  const router = useRouter();
  const { user, updateUser } = useApp();
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [expandedSection, setExpandedSection] = useState<string | null>('visual');
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');

  const updateSettings = useCallback(
    <K extends keyof AccessibilitySettings>(
      category: K,
      updates: Partial<AccessibilitySettings[K]>
    ) => {
      setSettings((prev) => ({
        ...prev,
        [category]: { ...prev[category], ...updates },
      }));
    },
    []
  );

  const toggleSection = useCallback((section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  const addToList = useCallback(
    (category: 'dietaryNeeds' | 'emergencyInfo', field: string, value: string) => {
      if (!value.trim()) return;

      setSettings((prev) => {
        const categoryData = prev[category] as Record<string, unknown>;
        const currentList = Array.isArray(categoryData[field])
          ? (categoryData[field] as string[])
          : [];
        if (currentList.includes(value.trim())) return prev;

        return {
          ...prev,
          [category]: {
            ...prev[category],
            [field]: [...currentList, value.trim()],
          },
        };
      });
    },
    []
  );

  const removeFromList = useCallback(
    (category: 'dietaryNeeds' | 'emergencyInfo', field: string, value: string) => {
      setSettings((prev) => {
        const categoryData = prev[category] as Record<string, unknown>;
        const currentList = Array.isArray(categoryData[field])
          ? (categoryData[field] as string[])
          : [];
        return {
          ...prev,
          [category]: {
            ...prev[category],
            [field]: currentList.filter((item: string) => item !== value),
          },
        };
      });
    },
    []
  );

  const handleSave = useCallback(() => {
    const accessibilityNeeds: string[] = [];

    if (settings.visualAssistance.enabled) accessibilityNeeds.push('Visual Assistance');
    if (settings.hearingAssistance.enabled) accessibilityNeeds.push('Hearing Assistance');
    if (settings.mobilityAssistance.enabled) accessibilityNeeds.push('Mobility Assistance');
    if (settings.mobilityAssistance.wheelchairAccessRequired)
      accessibilityNeeds.push('Wheelchair Access');
    if (settings.cognitiveAssistance.enabled) accessibilityNeeds.push('Cognitive Assistance');

    updateUser({
      accessibilityNeeds,
      dietaryRestrictions: [
        ...settings.dietaryNeeds.restrictions,
        ...settings.dietaryNeeds.allergies,
      ],
    });

    Alert.alert(
      'Settings Saved',
      'Your accessibility preferences have been saved and will be applied to your travel recommendations.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  }, [settings, updateUser, router]);

  const renderToggleRow = (
    label: string,
    value: boolean,
    onToggle: (val: boolean) => void,
    description?: string
  ) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description && <Text style={styles.toggleDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.surface}
      />
    </View>
  );

  const renderChipSelector = (
    options: string[],
    selected: string[],
    onSelect: (value: string) => void,
    onRemove: (value: string) => void
  ) => (
    <View style={styles.chipsContainer}>
      <View style={styles.selectedChips}>
        {selected.map((item) => (
          <Pressable key={item} style={styles.selectedChip} onPress={() => onRemove(item)}>
            <Text style={styles.selectedChipText}>{item}</Text>
            <X size={14} color={colors.textLight} />
          </Pressable>
        ))}
      </View>
      <View style={styles.availableChips}>
        {options
          .filter((o) => !selected.includes(o))
          .map((option) => (
            <Pressable key={option} style={styles.availableChip} onPress={() => onSelect(option)}>
              <Plus size={12} color={colors.primary} />
              <Text style={styles.availableChipText}>{option}</Text>
            </Pressable>
          ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Accessibility Settings</Text>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Check size={24} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoBanner}>
            <Info size={20} color={colors.primary} />
            <Text style={styles.infoBannerText}>
              These settings help personalize your travel experience and filter recommendations
              based on your needs.
            </Text>
          </View>

          <Pressable style={styles.sectionHeader} onPress={() => toggleSection('visual')}>
            <View style={styles.sectionIcon}>
              <Eye size={22} color={colors.primary} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Visual Assistance</Text>
              <Text style={styles.sectionSubtitle}>Display and vision preferences</Text>
            </View>
            <ChevronRight
              size={20}
              color={colors.textTertiary}
              style={{ transform: [{ rotate: expandedSection === 'visual' ? '90deg' : '0deg' }] }}
            />
          </Pressable>
          {expandedSection === 'visual' && (
            <View style={styles.sectionContent}>
              {renderToggleRow(
                'Enable Visual Assistance',
                settings.visualAssistance.enabled,
                (val) => updateSettings('visualAssistance', { enabled: val }),
                'Show accessibility features in search results'
              )}
              {settings.visualAssistance.enabled && (
                <>
                  {renderToggleRow('Large Text', settings.visualAssistance.largeText, (val) =>
                    updateSettings('visualAssistance', { largeText: val })
                  )}
                  {renderToggleRow('High Contrast', settings.visualAssistance.highContrast, (val) =>
                    updateSettings('visualAssistance', { highContrast: val })
                  )}
                  {renderToggleRow('Reduce Motion', settings.visualAssistance.reduceMotion, (val) =>
                    updateSettings('visualAssistance', { reduceMotion: val })
                  )}
                  {renderToggleRow(
                    'Screen Reader Optimized',
                    settings.visualAssistance.screenReaderOptimized,
                    (val) => updateSettings('visualAssistance', { screenReaderOptimized: val })
                  )}
                </>
              )}
            </View>
          )}

          <Pressable style={styles.sectionHeader} onPress={() => toggleSection('hearing')}>
            <View style={styles.sectionIcon}>
              <Ear size={22} color={colors.secondary} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Hearing Assistance</Text>
              <Text style={styles.sectionSubtitle}>Audio and alert preferences</Text>
            </View>
            <ChevronRight
              size={20}
              color={colors.textTertiary}
              style={{ transform: [{ rotate: expandedSection === 'hearing' ? '90deg' : '0deg' }] }}
            />
          </Pressable>
          {expandedSection === 'hearing' && (
            <View style={styles.sectionContent}>
              {renderToggleRow(
                'Enable Hearing Assistance',
                settings.hearingAssistance.enabled,
                (val) => updateSettings('hearingAssistance', { enabled: val }),
                'Filter for hearing-accessible venues'
              )}
              {settings.hearingAssistance.enabled && (
                <>
                  {renderToggleRow(
                    'Visual Alerts',
                    settings.hearingAssistance.visualAlerts,
                    (val) => updateSettings('hearingAssistance', { visualAlerts: val }),
                    'Flash screen for notifications'
                  )}
                  {renderToggleRow(
                    'Prefer Captions',
                    settings.hearingAssistance.captionsPreferred,
                    (val) => updateSettings('hearingAssistance', { captionsPreferred: val }),
                    'Show captioned content when available'
                  )}
                </>
              )}
            </View>
          )}

          <Pressable style={styles.sectionHeader} onPress={() => toggleSection('mobility')}>
            <View style={styles.sectionIcon}>
              <Accessibility size={22} color={colors.success} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Mobility Assistance</Text>
              <Text style={styles.sectionSubtitle}>Movement and access needs</Text>
            </View>
            <ChevronRight
              size={20}
              color={colors.textTertiary}
              style={{ transform: [{ rotate: expandedSection === 'mobility' ? '90deg' : '0deg' }] }}
            />
          </Pressable>
          {expandedSection === 'mobility' && (
            <View style={styles.sectionContent}>
              {renderToggleRow(
                'Enable Mobility Assistance',
                settings.mobilityAssistance.enabled,
                (val) => updateSettings('mobilityAssistance', { enabled: val }),
                'Filter for wheelchair-accessible locations'
              )}
              {settings.mobilityAssistance.enabled && (
                <>
                  {renderToggleRow(
                    'Wheelchair Access Required',
                    settings.mobilityAssistance.wheelchairAccessRequired,
                    (val) => updateSettings('mobilityAssistance', { wheelchairAccessRequired: val })
                  )}
                  {renderToggleRow(
                    'Limited Walking Distance',
                    settings.mobilityAssistance.limitedWalkingDistance,
                    (val) => updateSettings('mobilityAssistance', { limitedWalkingDistance: val })
                  )}
                  {settings.mobilityAssistance.limitedWalkingDistance && (
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Max Walking Distance (meters)</Text>
                      <TextInput
                        style={styles.numberInput}
                        keyboardType="numeric"
                        value={settings.mobilityAssistance.maxWalkingDistance?.toString() || ''}
                        onChangeText={(val) =>
                          updateSettings('mobilityAssistance', {
                            maxWalkingDistance: val ? parseInt(val) : undefined,
                          })
                        }
                        placeholder="500"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </View>
                  )}
                  {renderToggleRow(
                    'Elevator Required',
                    settings.mobilityAssistance.elevatorRequired,
                    (val) => updateSettings('mobilityAssistance', { elevatorRequired: val })
                  )}
                  {renderToggleRow(
                    'Ground Floor Preferred',
                    settings.mobilityAssistance.groundFloorPreferred,
                    (val) => updateSettings('mobilityAssistance', { groundFloorPreferred: val })
                  )}
                </>
              )}
            </View>
          )}

          <Pressable style={styles.sectionHeader} onPress={() => toggleSection('cognitive')}>
            <View style={styles.sectionIcon}>
              <Brain size={22} color={colors.warning} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Cognitive Assistance</Text>
              <Text style={styles.sectionSubtitle}>Navigation and understanding help</Text>
            </View>
            <ChevronRight
              size={20}
              color={colors.textTertiary}
              style={{
                transform: [{ rotate: expandedSection === 'cognitive' ? '90deg' : '0deg' }],
              }}
            />
          </Pressable>
          {expandedSection === 'cognitive' && (
            <View style={styles.sectionContent}>
              {renderToggleRow(
                'Enable Cognitive Assistance',
                settings.cognitiveAssistance.enabled,
                (val) => updateSettings('cognitiveAssistance', { enabled: val })
              )}
              {settings.cognitiveAssistance.enabled && (
                <>
                  {renderToggleRow(
                    'Simplified Interface',
                    settings.cognitiveAssistance.simplifiedInterface,
                    (val) => updateSettings('cognitiveAssistance', { simplifiedInterface: val }),
                    'Show fewer options at a time'
                  )}
                  {renderToggleRow(
                    'Extra Reminders',
                    settings.cognitiveAssistance.extraReminders,
                    (val) => updateSettings('cognitiveAssistance', { extraReminders: val }),
                    'More frequent notifications and alerts'
                  )}
                  {renderToggleRow(
                    'Detailed Instructions',
                    settings.cognitiveAssistance.detailedInstructions,
                    (val) => updateSettings('cognitiveAssistance', { detailedInstructions: val }),
                    'Step-by-step guidance for activities'
                  )}
                </>
              )}
            </View>
          )}

          <Pressable style={styles.sectionHeader} onPress={() => toggleSection('dietary')}>
            <View style={styles.sectionIcon}>
              <UtensilsCrossed size={22} color={colors.accentDark} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Dietary Needs</Text>
              <Text style={styles.sectionSubtitle}>Food restrictions and allergies</Text>
            </View>
            <ChevronRight
              size={20}
              color={colors.textTertiary}
              style={{ transform: [{ rotate: expandedSection === 'dietary' ? '90deg' : '0deg' }] }}
            />
          </Pressable>
          {expandedSection === 'dietary' && (
            <View style={styles.sectionContent}>
              {renderToggleRow(
                'Enable Dietary Filters',
                settings.dietaryNeeds.enabled,
                (val) => updateSettings('dietaryNeeds', { enabled: val }),
                'Filter restaurants by dietary needs'
              )}
              {settings.dietaryNeeds.enabled && (
                <>
                  <Text style={styles.subsectionTitle}>Dietary Restrictions</Text>
                  {renderChipSelector(
                    dietaryOptions,
                    settings.dietaryNeeds.restrictions,
                    (val) => addToList('dietaryNeeds', 'restrictions', val),
                    (val) => removeFromList('dietaryNeeds', 'restrictions', val)
                  )}

                  <Text style={styles.subsectionTitle}>Allergies</Text>
                  <View style={styles.allergyWarning}>
                    <AlertTriangle size={16} color={colors.error} />
                    <Text style={styles.allergyWarningText}>
                      Always verify ingredients directly with restaurants
                    </Text>
                  </View>
                  {renderChipSelector(
                    allergyOptions,
                    settings.dietaryNeeds.allergies,
                    (val) => addToList('dietaryNeeds', 'allergies', val),
                    (val) => removeFromList('dietaryNeeds', 'allergies', val)
                  )}
                </>
              )}
            </View>
          )}

          <Pressable style={styles.sectionHeader} onPress={() => toggleSection('communication')}>
            <View style={styles.sectionIcon}>
              <MessageCircle size={22} color={colors.primaryLight} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Communication</Text>
              <Text style={styles.sectionSubtitle}>Language and communication needs</Text>
            </View>
            <ChevronRight
              size={20}
              color={colors.textTertiary}
              style={{
                transform: [{ rotate: expandedSection === 'communication' ? '90deg' : '0deg' }],
              }}
            />
          </Pressable>
          {expandedSection === 'communication' && (
            <View style={styles.sectionContent}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Preferred Language</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.communicationPreferences.preferredLanguage}
                  onChangeText={(val) =>
                    updateSettings('communicationPreferences', { preferredLanguage: val })
                  }
                  placeholder="English"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              {renderToggleRow(
                'Translation Assistance',
                settings.communicationPreferences.needsTranslationAssist,
                (val) =>
                  updateSettings('communicationPreferences', { needsTranslationAssist: val }),
                'Automatic translation suggestions'
              )}
              {renderToggleRow(
                'Sign Language Interpreter',
                settings.communicationPreferences.signLanguageInterpreter,
                (val) =>
                  updateSettings('communicationPreferences', { signLanguageInterpreter: val }),
                'Filter for sign language services'
              )}
            </View>
          )}

          <Pressable style={styles.sectionHeader} onPress={() => toggleSection('emergency')}>
            <View style={styles.sectionIcon}>
              <Heart size={22} color={colors.error} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Emergency Medical Info</Text>
              <Text style={styles.sectionSubtitle}>Critical health information</Text>
            </View>
            <ChevronRight
              size={20}
              color={colors.textTertiary}
              style={{
                transform: [{ rotate: expandedSection === 'emergency' ? '90deg' : '0deg' }],
              }}
            />
          </Pressable>
          {expandedSection === 'emergency' && (
            <View style={styles.sectionContent}>
              <View style={styles.privacyNote}>
                <Shield size={16} color={colors.success} />
                <Text style={styles.privacyNoteText}>
                  This information is stored securely and only shared in emergencies
                </Text>
              </View>

              <Text style={styles.subsectionTitle}>Medical Conditions</Text>
              <View style={styles.addItemRow}>
                <TextInput
                  style={styles.addItemInput}
                  value={newCondition}
                  onChangeText={setNewCondition}
                  placeholder="Add condition..."
                  placeholderTextColor={colors.textTertiary}
                />
                <Pressable
                  style={styles.addButton}
                  onPress={() => {
                    addToList('emergencyInfo', 'medicalConditions', newCondition);
                    setNewCondition('');
                  }}
                >
                  <Plus size={20} color={colors.textLight} />
                </Pressable>
              </View>
              <View style={styles.itemsList}>
                {settings.emergencyInfo.medicalConditions.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.listItemText}>{item}</Text>
                    <Pressable
                      onPress={() => removeFromList('emergencyInfo', 'medicalConditions', item)}
                    >
                      <X size={16} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                ))}
              </View>

              <Text style={styles.subsectionTitle}>Current Medications</Text>
              <View style={styles.addItemRow}>
                <TextInput
                  style={styles.addItemInput}
                  value={newMedication}
                  onChangeText={setNewMedication}
                  placeholder="Add medication..."
                  placeholderTextColor={colors.textTertiary}
                />
                <Pressable
                  style={styles.addButton}
                  onPress={() => {
                    addToList('emergencyInfo', 'medications', newMedication);
                    setNewMedication('');
                  }}
                >
                  <Plus size={20} color={colors.textLight} />
                </Pressable>
              </View>
              <View style={styles.itemsList}>
                {settings.emergencyInfo.medications.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.listItemText}>{item}</Text>
                    <Pressable onPress={() => removeFromList('emergencyInfo', 'medications', item)}>
                      <X size={16} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                ))}
              </View>

              <Text style={styles.subsectionTitle}>Blood Type</Text>
              <View style={styles.bloodTypeGrid}>
                {bloodTypes.map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.bloodTypeChip,
                      settings.emergencyInfo.bloodType === type && styles.bloodTypeChipSelected,
                    ]}
                    onPress={() =>
                      updateSettings('emergencyInfo', {
                        bloodType: settings.emergencyInfo.bloodType === type ? undefined : type,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.bloodTypeText,
                        settings.emergencyInfo.bloodType === type && styles.bloodTypeTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.subsectionTitle}>Emergency Instructions</Text>
              <TextInput
                style={styles.multilineInput}
                value={settings.emergencyInfo.emergencyInstructions || ''}
                onChangeText={(val) =>
                  updateSettings('emergencyInfo', { emergencyInstructions: val })
                }
                placeholder="Any special instructions for emergency responders..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.saveButtonLarge} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Preferences</Text>
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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.accent,
    margin: 16,
    padding: 14,
    borderRadius: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleContainer: {
    flex: 1,
    marginLeft: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 15,
    color: colors.text,
  },
  toggleDescription: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  inputRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  numberInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    width: 100,
  },
  textInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 10,
  },
  chipsContainer: {
    gap: 12,
  },
  selectedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedChipText: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '500',
  },
  availableChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  availableChipText: {
    fontSize: 12,
    color: colors.text,
  },
  allergyWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  allergyWarningText: {
    fontSize: 12,
    color: colors.error,
    flex: 1,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  privacyNoteText: {
    fontSize: 12,
    color: colors.success,
    flex: 1,
  },
  addItemRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsList: {
    marginTop: 10,
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  listItemText: {
    fontSize: 14,
    color: colors.text,
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bloodTypeChip: {
    width: 60,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bloodTypeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bloodTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  bloodTypeTextSelected: {
    color: colors.textLight,
  },
  multilineInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    minHeight: 100,
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButtonLarge: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
});
