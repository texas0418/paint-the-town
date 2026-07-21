/* eslint-disable max-lines -- tracked in #1 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Search,
  X,
  ChevronRight,
  Shield,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  Info,
  Globe,
  Stamp,
  Plane,
  CreditCard,
  ChevronDown,
  Star,
} from 'lucide-react-native';
import colors from '@/constants/colors';

interface Country {
  code: string;
  name: string;
  flag: string;
}

interface VisaRequirement {
  destinationCode: string;
  destinationName: string;
  destinationFlag: string;
  visaType: 'visa_free' | 'visa_on_arrival' | 'e_visa' | 'visa_required';
  maxStay: string;
  validity?: string;
  processingTime?: string;
  fee?: string;
  documents: string[];
  notes: string[];
  healthRequirements?: string[];
  covidRestrictions?: string;
  lastUpdated: string;
}

const countries: Country[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
];

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
const getVisaRequirements = (passportCode: string): VisaRequirement[] => {
  const baseRequirements: VisaRequirement[] = [
    {
      destinationCode: 'JP',
      destinationName: 'Japan',
      destinationFlag: '🇯🇵',
      visaType:
        passportCode === 'US' ||
        passportCode === 'GB' ||
        passportCode === 'CA' ||
        passportCode === 'AU' ||
        passportCode === 'SG'
          ? 'visa_free'
          : 'visa_required',
      maxStay: '90 days',
      documents: [
        'Valid passport (6+ months)',
        'Return ticket',
        'Proof of accommodation',
        'Sufficient funds',
      ],
      notes: [
        'Passport must be valid for duration of stay',
        'May need to show itinerary at immigration',
      ],
      healthRequirements: ['No mandatory vaccinations'],
      lastUpdated: '2024-01-15',
    },
    {
      destinationCode: 'TH',
      destinationName: 'Thailand',
      destinationFlag: '🇹🇭',
      visaType:
        passportCode === 'US' ||
        passportCode === 'GB' ||
        passportCode === 'CA' ||
        passportCode === 'AU' ||
        passportCode === 'DE' ||
        passportCode === 'FR'
          ? 'visa_free'
          : passportCode === 'CN' || passportCode === 'IN'
            ? 'visa_on_arrival'
            : 'e_visa',
      maxStay: passportCode === 'US' || passportCode === 'GB' ? '30 days' : '15 days',
      fee: passportCode === 'CN' || passportCode === 'IN' ? '$35 USD' : undefined,
      documents: ['Valid passport (6+ months)', 'Passport photo', 'Return ticket', 'Hotel booking'],
      notes: ['Can extend stay at immigration office', 'Visa exemption extendable for 30 days'],
      healthRequirements: ['Yellow fever certificate if arriving from affected area'],
      lastUpdated: '2024-01-10',
    },
    {
      destinationCode: 'US',
      destinationName: 'United States',
      destinationFlag: '🇺🇸',
      visaType:
        passportCode === 'GB' ||
        passportCode === 'AU' ||
        passportCode === 'JP' ||
        passportCode === 'DE' ||
        passportCode === 'FR' ||
        passportCode === 'SG' ||
        passportCode === 'KR'
          ? 'e_visa'
          : 'visa_required',
      maxStay: '90 days',
      processingTime:
        passportCode === 'GB' || passportCode === 'AU' ? '72 hours (ESTA)' : '3-6 weeks',
      fee: passportCode === 'GB' || passportCode === 'AU' ? '$21 USD (ESTA)' : '$185 USD',
      documents: [
        'Valid passport',
        'ESTA approval or visa',
        'Return ticket',
        'Proof of funds',
        'Travel itinerary',
      ],
      notes: ['ESTA valid for 2 years', 'Interview required for visa', 'Biometrics required'],
      lastUpdated: '2024-01-12',
    },
    {
      destinationCode: 'GB',
      destinationName: 'United Kingdom',
      destinationFlag: '🇬🇧',
      visaType:
        passportCode === 'US' ||
        passportCode === 'CA' ||
        passportCode === 'AU' ||
        passportCode === 'JP' ||
        passportCode === 'SG' ||
        passportCode === 'KR'
          ? 'e_visa'
          : passportCode === 'DE' ||
              passportCode === 'FR' ||
              passportCode === 'IT' ||
              passportCode === 'ES'
            ? 'visa_free'
            : 'visa_required',
      maxStay: '6 months',
      processingTime: passportCode === 'US' ? 'Instant (ETA)' : '3 weeks',
      fee: passportCode === 'US' || passportCode === 'CA' ? '£10 (ETA)' : '£100',
      documents: [
        'Valid passport',
        'ETA or visa',
        'Proof of accommodation',
        'Return ticket',
        'Financial evidence',
      ],
      notes: ['ETA required from 2024 for visa-exempt nationals', 'Cannot work on tourist visa'],
      lastUpdated: '2024-01-14',
    },
    {
      destinationCode: 'AU',
      destinationName: 'Australia',
      destinationFlag: '🇦🇺',
      visaType:
        passportCode === 'US' ||
        passportCode === 'GB' ||
        passportCode === 'CA' ||
        passportCode === 'JP' ||
        passportCode === 'SG' ||
        passportCode === 'KR'
          ? 'e_visa'
          : 'visa_required',
      maxStay: '90 days',
      processingTime: '24-48 hours (ETA)',
      fee: '$20 AUD (ETA)',
      documents: [
        'Valid passport (6+ months)',
        'ETA or visa',
        'Return ticket',
        'Proof of funds',
        'Health insurance recommended',
      ],
      notes: [
        'Strict biosecurity laws',
        'Declare all food and organic items',
        'Working Holiday visa available for some',
      ],
      healthRequirements: ['No mandatory vaccinations', 'Health insurance strongly recommended'],
      lastUpdated: '2024-01-11',
    },
    {
      destinationCode: 'FR',
      destinationName: 'France',
      destinationFlag: '🇫🇷',
      visaType:
        passportCode === 'US' ||
        passportCode === 'GB' ||
        passportCode === 'CA' ||
        passportCode === 'AU' ||
        passportCode === 'JP' ||
        passportCode === 'SG' ||
        passportCode === 'KR'
          ? 'visa_free'
          : 'visa_required',
      maxStay: '90 days in 180-day period',
      processingTime: passportCode === 'IN' || passportCode === 'CN' ? '15 days' : undefined,
      fee: passportCode === 'IN' || passportCode === 'CN' ? '€80' : undefined,
      documents: [
        'Valid passport (3+ months beyond stay)',
        'Schengen visa if required',
        'Travel insurance (€30,000 coverage)',
        'Accommodation proof',
        'Return ticket',
      ],
      notes: [
        'Part of Schengen Area',
        '90/180 day rule applies to all Schengen countries combined',
        'ETIAS required from 2025 for visa-exempt travelers',
      ],
      lastUpdated: '2024-01-13',
    },
    {
      destinationCode: 'AE',
      destinationName: 'United Arab Emirates',
      destinationFlag: '🇦🇪',
      visaType:
        passportCode === 'US' ||
        passportCode === 'GB' ||
        passportCode === 'CA' ||
        passportCode === 'AU' ||
        passportCode === 'DE' ||
        passportCode === 'FR'
          ? 'visa_free'
          : passportCode === 'IN' || passportCode === 'CN'
            ? 'e_visa'
            : 'visa_on_arrival',
      maxStay: passportCode === 'US' || passportCode === 'GB' ? '30 days' : '14 days',
      processingTime: passportCode === 'IN' ? '3-5 days' : undefined,
      fee: passportCode === 'IN' ? '$90 USD' : undefined,
      documents: [
        'Valid passport (6+ months)',
        'Passport photo',
        'Return ticket',
        'Hotel booking',
        'Proof of funds',
      ],
      notes: [
        'Can extend visa for 30 days',
        'Respect local customs and dress codes',
        'Alcohol only in licensed venues',
      ],
      lastUpdated: '2024-01-08',
    },
    {
      destinationCode: 'SG',
      destinationName: 'Singapore',
      destinationFlag: '🇸🇬',
      visaType:
        passportCode === 'US' ||
        passportCode === 'GB' ||
        passportCode === 'CA' ||
        passportCode === 'AU' ||
        passportCode === 'DE' ||
        passportCode === 'FR' ||
        passportCode === 'JP' ||
        passportCode === 'KR'
          ? 'visa_free'
          : passportCode === 'IN' || passportCode === 'CN'
            ? 'e_visa'
            : 'visa_required',
      maxStay: '30-90 days',
      processingTime: passportCode === 'IN' ? '3 days' : undefined,
      fee: passportCode === 'IN' ? '$30 USD' : undefined,
      documents: [
        'Valid passport (6+ months)',
        'Return ticket',
        'Proof of accommodation',
        'Sufficient funds',
        'SG Arrival Card',
      ],
      notes: [
        'SG Arrival Card must be filled within 3 days of arrival',
        'Strict laws - chewing gum prohibited',
        'Heavy fines for littering',
      ],
      healthRequirements: ['Yellow fever certificate if arriving from affected area'],
      lastUpdated: '2024-01-09',
    },
    {
      destinationCode: 'BR',
      destinationName: 'Brazil',
      destinationFlag: '🇧🇷',
      visaType:
        passportCode === 'US' ||
        passportCode === 'CA' ||
        passportCode === 'AU' ||
        passportCode === 'JP'
          ? 'e_visa'
          : passportCode === 'GB' ||
              passportCode === 'DE' ||
              passportCode === 'FR' ||
              passportCode === 'IT'
            ? 'visa_free'
            : 'visa_required',
      maxStay: '90 days',
      processingTime: '5-10 days',
      fee: '$80 USD',
      documents: [
        'Valid passport (6+ months)',
        'e-Visa or visa',
        'Return ticket',
        'Proof of accommodation',
        'Yellow fever vaccination',
      ],
      notes: [
        'Yellow fever vaccine recommended for Amazon region',
        'Register with Federal Police if staying 90+ days',
      ],
      healthRequirements: [
        'Yellow fever vaccination strongly recommended',
        'Malaria prophylaxis for Amazon',
      ],
      lastUpdated: '2024-01-07',
    },
    {
      destinationCode: 'IN',
      destinationName: 'India',
      destinationFlag: '🇮🇳',
      visaType:
        passportCode === 'JP' || passportCode === 'SG' || passportCode === 'KR'
          ? 'visa_free'
          : 'e_visa',
      maxStay: passportCode === 'JP' ? '30 days' : '60 days',
      processingTime: '3-5 days',
      fee: '$25-100 USD',
      validity: '1 year (multiple entry)',
      documents: [
        'Valid passport (6+ months)',
        'e-Visa',
        'Passport photo',
        'Return ticket',
        'Proof of accommodation',
      ],
      notes: [
        'e-Visa available for 150+ countries',
        'Medical and Business e-Visas also available',
        'Register with FRRO for stays over 180 days',
      ],
      healthRequirements: ['No mandatory vaccinations', 'Typhoid & Hepatitis A recommended'],
      lastUpdated: '2024-01-06',
    },
    {
      destinationCode: 'MX',
      destinationName: 'Mexico',
      destinationFlag: '🇲🇽',
      visaType:
        passportCode === 'US' ||
        passportCode === 'GB' ||
        passportCode === 'CA' ||
        passportCode === 'AU' ||
        passportCode === 'JP' ||
        passportCode === 'DE' ||
        passportCode === 'FR'
          ? 'visa_free'
          : 'visa_required',
      maxStay: '180 days',
      documents: [
        'Valid passport',
        'FMM tourist card (free)',
        'Return ticket',
        'Proof of accommodation',
      ],
      notes: [
        'FMM card issued on arrival',
        'Keep FMM card safe - needed on departure',
        'Can be fined for overstaying',
      ],
      healthRequirements: ['No mandatory vaccinations'],
      lastUpdated: '2024-01-05',
    },
    {
      destinationCode: 'NZ',
      destinationName: 'New Zealand',
      destinationFlag: '🇳🇿',
      visaType:
        passportCode === 'US' ||
        passportCode === 'GB' ||
        passportCode === 'CA' ||
        passportCode === 'DE' ||
        passportCode === 'FR' ||
        passportCode === 'JP'
          ? 'e_visa'
          : 'visa_required',
      maxStay: '90 days',
      processingTime: '72 hours (NZeTA)',
      fee: '$17-23 NZD (NZeTA)',
      documents: [
        'Valid passport',
        'NZeTA',
        'Return ticket',
        'Proof of funds ($1000/month)',
        'Travel insurance recommended',
      ],
      notes: [
        'NZeTA required for visa-waiver travelers',
        'Strict biosecurity - declare all food/organic items',
        'IVL levy included in NZeTA',
      ],
      healthRequirements: ['No mandatory vaccinations'],
      lastUpdated: '2024-01-04',
    },
  ];

  return baseRequirements.filter((req) => req.destinationCode !== passportCode);
};

const visaTypeConfig = {
  visa_free: {
    label: 'Visa Free',
    color: colors.success,
    bgColor: '#E8F5E9',
    icon: CheckCircle,
    description: 'No visa required',
  },
  visa_on_arrival: {
    label: 'Visa on Arrival',
    color: colors.warning,
    bgColor: '#FFF3E0',
    icon: Stamp,
    description: 'Get visa at airport',
  },
  e_visa: {
    label: 'e-Visa / ETA',
    color: colors.primaryLight,
    bgColor: '#E3F2FD',
    icon: Globe,
    description: 'Apply online before travel',
  },
  visa_required: {
    label: 'Visa Required',
    color: colors.error,
    bgColor: '#FFEBEE',
    icon: FileText,
    description: 'Embassy/consulate application',
  },
};

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function VisaRequirementsScreen() {
  const router = useRouter();
  const [selectedPassport, setSelectedPassport] = useState<Country | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [passportModalVisible, setPassportModalVisible] = useState(false);
  const [passportSearch, setPassportSearch] = useState('');
  const [selectedRequirement, setSelectedRequirement] = useState<VisaRequirement | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const requirements = useMemo(() => {
    if (!selectedPassport) return [];
    return getVisaRequirements(selectedPassport.code);
  }, [selectedPassport]);

  const filteredRequirements = useMemo(() => {
    let filtered = requirements;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => r.destinationName.toLowerCase().includes(query));
    }

    if (filterType) {
      filtered = filtered.filter((r) => r.visaType === filterType);
    }

    return filtered.sort((a, b) => {
      const order = ['visa_free', 'visa_on_arrival', 'e_visa', 'visa_required'];
      return order.indexOf(a.visaType) - order.indexOf(b.visaType);
    });
  }, [requirements, searchQuery, filterType]);

  const filteredCountries = useMemo(() => {
    if (!passportSearch) return countries;
    const query = passportSearch.toLowerCase();
    return countries.filter((c) => c.name.toLowerCase().includes(query));
  }, [passportSearch]);

  const stats = useMemo(() => {
    return {
      visaFree: requirements.filter((r) => r.visaType === 'visa_free').length,
      visaOnArrival: requirements.filter((r) => r.visaType === 'visa_on_arrival').length,
      eVisa: requirements.filter((r) => r.visaType === 'e_visa').length,
      visaRequired: requirements.filter((r) => r.visaType === 'visa_required').length,
    };
  }, [requirements]);

  const renderCountryItem = useCallback(
    ({ item }: { item: Country }) => (
      <Pressable
        style={styles.countryItem}
        onPress={() => {
          setSelectedPassport(item);
          setPassportModalVisible(false);
          setPassportSearch('');
        }}
      >
        <Text style={styles.countryFlag}>{item.flag}</Text>
        <Text style={styles.countryName}>{item.name}</Text>
        {selectedPassport?.code === item.code && <CheckCircle size={20} color={colors.success} />}
      </Pressable>
    ),
    [selectedPassport]
  );

  const renderRequirementCard = useCallback((req: VisaRequirement) => {
    const config = visaTypeConfig[req.visaType];
    const IconComponent = config.icon;

    return (
      <Pressable
        key={req.destinationCode}
        style={styles.requirementCard}
        onPress={() => setSelectedRequirement(req)}
      >
        <View style={styles.reqHeader}>
          <View style={styles.destinationInfo}>
            <Text style={styles.destinationFlag}>{req.destinationFlag}</Text>
            <View>
              <Text style={styles.destinationName}>{req.destinationName}</Text>
              <Text style={styles.maxStay}>Max stay: {req.maxStay}</Text>
            </View>
          </View>
          <View style={[styles.visaBadge, { backgroundColor: config.bgColor }]}>
            <IconComponent size={14} color={config.color} />
            <Text style={[styles.visaBadgeText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.reqDetails}>
          {req.processingTime && (
            <View style={styles.detailRow}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={styles.detailText}>{req.processingTime}</Text>
            </View>
          )}
          {req.fee && (
            <View style={styles.detailRow}>
              <CreditCard size={14} color={colors.textSecondary} />
              <Text style={styles.detailText}>{req.fee}</Text>
            </View>
          )}
        </View>

        <View style={styles.reqFooter}>
          <Text style={styles.lastUpdated}>Updated {req.lastUpdated}</Text>
          <ChevronRight size={18} color={colors.textTertiary} />
        </View>
      </Pressable>
    );
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.text} />
            </Pressable>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Visa Checker</Text>
              <Text style={styles.headerSubtitle}>Check entry requirements</Text>
            </View>
          </View>

          <Pressable style={styles.passportSelector} onPress={() => setPassportModalVisible(true)}>
            <Shield size={20} color={colors.primary} />
            {selectedPassport ? (
              <View style={styles.selectedPassport}>
                <Text style={styles.passportFlag}>{selectedPassport.flag}</Text>
                <Text style={styles.passportName}>{selectedPassport.name} Passport</Text>
              </View>
            ) : (
              <Text style={styles.passportPlaceholder}>Select your passport</Text>
            )}
            <ChevronDown size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {selectedPassport ? (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.statsContainer}>
              <Pressable
                style={[styles.statCard, filterType === 'visa_free' && styles.statCardActive]}
                onPress={() => setFilterType(filterType === 'visa_free' ? null : 'visa_free')}
              >
                <View
                  style={[styles.statIcon, { backgroundColor: visaTypeConfig.visa_free.bgColor }]}
                >
                  <CheckCircle size={18} color={visaTypeConfig.visa_free.color} />
                </View>
                <Text style={styles.statNumber}>{stats.visaFree}</Text>
                <Text style={styles.statLabel}>Visa Free</Text>
              </Pressable>

              <Pressable
                style={[styles.statCard, filterType === 'visa_on_arrival' && styles.statCardActive]}
                onPress={() =>
                  setFilterType(filterType === 'visa_on_arrival' ? null : 'visa_on_arrival')
                }
              >
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: visaTypeConfig.visa_on_arrival.bgColor },
                  ]}
                >
                  <Stamp size={18} color={visaTypeConfig.visa_on_arrival.color} />
                </View>
                <Text style={styles.statNumber}>{stats.visaOnArrival}</Text>
                <Text style={styles.statLabel}>On Arrival</Text>
              </Pressable>

              <Pressable
                style={[styles.statCard, filterType === 'e_visa' && styles.statCardActive]}
                onPress={() => setFilterType(filterType === 'e_visa' ? null : 'e_visa')}
              >
                <View style={[styles.statIcon, { backgroundColor: visaTypeConfig.e_visa.bgColor }]}>
                  <Globe size={18} color={visaTypeConfig.e_visa.color} />
                </View>
                <Text style={styles.statNumber}>{stats.eVisa}</Text>
                <Text style={styles.statLabel}>e-Visa</Text>
              </Pressable>

              <Pressable
                style={[styles.statCard, filterType === 'visa_required' && styles.statCardActive]}
                onPress={() =>
                  setFilterType(filterType === 'visa_required' ? null : 'visa_required')
                }
              >
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: visaTypeConfig.visa_required.bgColor },
                  ]}
                >
                  <FileText size={18} color={visaTypeConfig.visa_required.color} />
                </View>
                <Text style={styles.statNumber}>{stats.visaRequired}</Text>
                <Text style={styles.statLabel}>Required</Text>
              </Pressable>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search destinations..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X size={18} color={colors.textTertiary} />
                </Pressable>
              )}
            </View>

            {filterType && (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>
                  Showing: {visaTypeConfig[filterType as keyof typeof visaTypeConfig].label}
                </Text>
                <Pressable onPress={() => setFilterType(null)}>
                  <X size={16} color={colors.primary} />
                </Pressable>
              </View>
            )}

            <Text style={styles.resultsCount}>
              {filteredRequirements.length} destination
              {filteredRequirements.length !== 1 ? 's' : ''}
            </Text>

            <View style={styles.requirementsList}>
              {filteredRequirements.map(renderRequirementCard)}
            </View>

            <View style={styles.disclaimer}>
              <AlertTriangle size={16} color={colors.warning} />
              <Text style={styles.disclaimerText}>
                Visa requirements can change. Always verify with the embassy or official government
                sources before traveling.
              </Text>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Shield size={48} color={colors.primaryLight} />
            </View>
            <Text style={styles.emptyTitle}>Select Your Passport</Text>
            <Text style={styles.emptyText}>
              Choose your passport nationality to see visa requirements for destinations worldwide.
            </Text>
            <Pressable style={styles.selectButton} onPress={() => setPassportModalVisible(true)}>
              <Text style={styles.selectButtonText}>Select Passport</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>

      <Modal
        visible={passportModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPassportModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Passport</Text>
            <Pressable
              style={styles.modalClose}
              onPress={() => {
                setPassportModalVisible(false);
                setPassportSearch('');
              }}
            >
              <X size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.modalSearch}>
            <Search size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search countries..."
              placeholderTextColor={colors.textTertiary}
              value={passportSearch}
              onChangeText={setPassportSearch}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredCountries}
            renderItem={renderCountryItem}
            keyExtractor={(item) => item.code}
            contentContainerStyle={styles.countryList}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>

      <Modal
        visible={!!selectedRequirement}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedRequirement(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {selectedRequirement && (
            <>
              <View style={styles.modalHeader}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailFlag}>{selectedRequirement.destinationFlag}</Text>
                  <Text style={styles.detailTitle}>{selectedRequirement.destinationName}</Text>
                </View>
                <Pressable style={styles.modalClose} onPress={() => setSelectedRequirement(null)}>
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.detailContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.detailScrollContent}
              >
                <View
                  style={[
                    styles.visaTypeBanner,
                    { backgroundColor: visaTypeConfig[selectedRequirement.visaType].bgColor },
                  ]}
                >
                  {React.createElement(visaTypeConfig[selectedRequirement.visaType].icon, {
                    size: 24,
                    color: visaTypeConfig[selectedRequirement.visaType].color,
                  })}
                  <View style={styles.visaTypeInfo}>
                    <Text
                      style={[
                        styles.visaTypeLabel,
                        { color: visaTypeConfig[selectedRequirement.visaType].color },
                      ]}
                    >
                      {visaTypeConfig[selectedRequirement.visaType].label}
                    </Text>
                    <Text style={styles.visaTypeDesc}>
                      {visaTypeConfig[selectedRequirement.visaType].description}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Clock size={20} color={colors.primary} />
                    <Text style={styles.infoLabel}>Max Stay</Text>
                    <Text style={styles.infoValue}>{selectedRequirement.maxStay}</Text>
                  </View>
                  {selectedRequirement.processingTime && (
                    <View style={styles.infoItem}>
                      <Plane size={20} color={colors.primary} />
                      <Text style={styles.infoLabel}>Processing</Text>
                      <Text style={styles.infoValue}>{selectedRequirement.processingTime}</Text>
                    </View>
                  )}
                  {selectedRequirement.fee && (
                    <View style={styles.infoItem}>
                      <CreditCard size={20} color={colors.primary} />
                      <Text style={styles.infoLabel}>Fee</Text>
                      <Text style={styles.infoValue}>{selectedRequirement.fee}</Text>
                    </View>
                  )}
                  {selectedRequirement.validity && (
                    <View style={styles.infoItem}>
                      <Star size={20} color={colors.primary} />
                      <Text style={styles.infoLabel}>Validity</Text>
                      <Text style={styles.infoValue}>{selectedRequirement.validity}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Required Documents</Text>
                  {selectedRequirement.documents.map((doc, index) => (
                    <View key={index} style={styles.listItem}>
                      <CheckCircle size={16} color={colors.success} />
                      <Text style={styles.listItemText}>{doc}</Text>
                    </View>
                  ))}
                </View>

                {selectedRequirement.healthRequirements &&
                  selectedRequirement.healthRequirements.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Health Requirements</Text>
                      {selectedRequirement.healthRequirements.map((req, index) => (
                        <View key={index} style={styles.listItem}>
                          <Info size={16} color={colors.primaryLight} />
                          <Text style={styles.listItemText}>{req}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Important Notes</Text>
                  {selectedRequirement.notes.map((note, index) => (
                    <View key={index} style={styles.noteItem}>
                      <AlertTriangle size={16} color={colors.warning} />
                      <Text style={styles.noteText}>{note}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.updateInfo}>
                  Last updated: {selectedRequirement.lastUpdated}
                </Text>
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
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
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  passportSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 12,
  },
  selectedPassport: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  passportFlag: {
    fontSize: 24,
  },
  passportName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  passportPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: colors.textTertiary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statCardActive: {
    borderColor: colors.primary,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 16,
  },
  filterTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
  resultsCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  requirementsList: {
    gap: 12,
  },
  requirementCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  reqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  destinationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  destinationFlag: {
    fontSize: 32,
  },
  destinationName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  maxStay: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  visaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  visaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reqDetails: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  reqFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 14,
    marginTop: 24,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  selectButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    margin: 20,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  countryList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 14,
  },
  countryFlag: {
    fontSize: 28,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailFlag: {
    fontSize: 32,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  detailContent: {
    flex: 1,
  },
  detailScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  visaTypeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  visaTypeInfo: {
    flex: 1,
  },
  visaTypeLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  visaTypeDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  infoItem: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 14,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  updateInfo: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 12,
  },
});
