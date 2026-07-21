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
  AlertTriangle,
  CheckCircle,
  Info,
  Syringe,
  Heart,
  ChevronDown,
  ThermometerSun,
  Stethoscope,
  Activity,
  AlertCircle,
  ShieldCheck,
  TestTube,
} from 'lucide-react-native';
import colors from '@/constants/colors';

interface Country {
  code: string;
  name: string;
  flag: string;
}

interface Vaccination {
  name: string;
  status: 'required' | 'recommended' | 'situational';
  description: string;
  timing?: string;
}

interface HealthRequirement {
  destinationCode: string;
  destinationName: string;
  destinationFlag: string;
  riskLevel: 'low' | 'moderate' | 'high';
  vaccinations: Vaccination[];
  covidRequirements: {
    vaccination: 'required' | 'recommended' | 'none';
    testing: 'required' | 'conditional' | 'none';
    testType?: string;
    quarantine?: string;
    healthDeclaration: boolean;
    notes?: string;
  };
  diseases: {
    name: string;
    risk: 'low' | 'moderate' | 'high';
    prevention: string;
    regions?: string[];
  }[];
  healthInsurance: 'required' | 'recommended';
  insuranceMinCoverage?: string;
  waterSafety: 'safe' | 'caution' | 'unsafe';
  medicalFacilities: 'excellent' | 'good' | 'limited' | 'basic';
  emergencyNumber: string;
  healthTips: string[];
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
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
];

const healthRequirements: HealthRequirement[] = [
  {
    destinationCode: 'TH',
    destinationName: 'Thailand',
    destinationFlag: '🇹🇭',
    riskLevel: 'moderate',
    vaccinations: [
      {
        name: 'Hepatitis A',
        status: 'recommended',
        description: 'Spread through contaminated food/water',
        timing: '2-4 weeks before travel',
      },
      {
        name: 'Hepatitis B',
        status: 'recommended',
        description: 'Spread through blood/body fluids',
        timing: '6 months before (3 doses)',
      },
      {
        name: 'Typhoid',
        status: 'recommended',
        description: 'Common in areas with poor sanitation',
        timing: '2 weeks before travel',
      },
      {
        name: 'Japanese Encephalitis',
        status: 'situational',
        description: 'For rural areas, extended stays',
        timing: '1 month before travel',
      },
      {
        name: 'Rabies',
        status: 'situational',
        description: 'If contact with animals is likely',
        timing: '1 month before travel',
      },
      {
        name: 'Yellow Fever',
        status: 'required',
        description: 'Required if arriving from affected country',
        timing: '10 days before travel',
      },
    ],
    covidRequirements: {
      vaccination: 'none',
      testing: 'none',
      healthDeclaration: false,
      notes: 'No COVID-19 restrictions currently in place',
    },
    diseases: [
      {
        name: 'Dengue Fever',
        risk: 'moderate',
        prevention: 'Use insect repellent, wear long sleeves',
        regions: ['Bangkok', 'Chiang Mai', 'Phuket'],
      },
      {
        name: 'Malaria',
        risk: 'low',
        prevention: 'Antimalarial medication for border areas',
        regions: ['Cambodia border', 'Myanmar border'],
      },
      {
        name: 'Zika Virus',
        risk: 'low',
        prevention: 'Insect precautions, especially for pregnant women',
      },
    ],
    healthInsurance: 'recommended',
    insuranceMinCoverage: '$50,000 USD',
    waterSafety: 'caution',
    medicalFacilities: 'good',
    emergencyNumber: '1669',
    healthTips: [
      'Drink only bottled or boiled water',
      'Avoid ice in drinks from street vendors',
      'Use mosquito repellent containing DEET',
      'Private hospitals offer excellent care in major cities',
      'Pharmacies are well-stocked but check expiry dates',
    ],
    lastUpdated: '2024-01-15',
  },
  {
    destinationCode: 'BR',
    destinationName: 'Brazil',
    destinationFlag: '🇧🇷',
    riskLevel: 'high',
    vaccinations: [
      {
        name: 'Yellow Fever',
        status: 'required',
        description: 'Required for most areas',
        timing: '10 days before travel',
      },
      {
        name: 'Hepatitis A',
        status: 'recommended',
        description: 'Spread through contaminated food/water',
        timing: '2-4 weeks before',
      },
      {
        name: 'Hepatitis B',
        status: 'recommended',
        description: 'Spread through blood/body fluids',
        timing: '6 months before',
      },
      {
        name: 'Typhoid',
        status: 'recommended',
        description: 'For areas with poor sanitation',
        timing: '2 weeks before',
      },
      {
        name: 'Rabies',
        status: 'situational',
        description: 'For adventure travelers, rural areas',
        timing: '1 month before',
      },
      {
        name: 'Malaria',
        status: 'situational',
        description: 'Antimalarial drugs for Amazon region',
        timing: '1-2 weeks before',
      },
    ],
    covidRequirements: {
      vaccination: 'none',
      testing: 'none',
      healthDeclaration: false,
      notes: 'COVID restrictions have been lifted',
    },
    diseases: [
      {
        name: 'Yellow Fever',
        risk: 'high',
        prevention: 'Vaccination required for most regions',
        regions: ['Amazon', 'Pantanal', 'Most of interior'],
      },
      {
        name: 'Dengue Fever',
        risk: 'high',
        prevention: 'Mosquito protection essential',
        regions: ['All urban areas'],
      },
      { name: 'Zika Virus', risk: 'moderate', prevention: 'Avoid if pregnant, use repellent' },
      {
        name: 'Malaria',
        risk: 'moderate',
        prevention: 'Prophylaxis recommended',
        regions: ['Amazon basin'],
      },
    ],
    healthInsurance: 'recommended',
    insuranceMinCoverage: '$100,000 USD',
    waterSafety: 'caution',
    medicalFacilities: 'good',
    emergencyNumber: '192',
    healthTips: [
      'Yellow fever vaccine certificate may be checked',
      'Mosquito-borne diseases are common - protection essential',
      'Private hospitals recommended for serious conditions',
      'Carry proof of travel insurance',
      'Avoid tap water outside major cities',
    ],
    lastUpdated: '2024-01-12',
  },
  {
    destinationCode: 'JP',
    destinationName: 'Japan',
    destinationFlag: '🇯🇵',
    riskLevel: 'low',
    vaccinations: [
      {
        name: 'Routine Vaccines',
        status: 'recommended',
        description: 'MMR, Tetanus, Flu',
        timing: 'Check with doctor',
      },
      {
        name: 'Japanese Encephalitis',
        status: 'situational',
        description: 'For rural areas during summer',
        timing: '1 month before',
      },
      {
        name: 'Hepatitis B',
        status: 'situational',
        description: 'For extended stays or medical work',
        timing: '6 months before',
      },
    ],
    covidRequirements: {
      vaccination: 'none',
      testing: 'none',
      healthDeclaration: false,
      notes: 'All COVID-19 border measures lifted',
    },
    diseases: [
      {
        name: 'Japanese Encephalitis',
        risk: 'low',
        prevention: 'Vaccine for rural summer visits',
        regions: ['Rural areas'],
      },
    ],
    healthInsurance: 'recommended',
    insuranceMinCoverage: '$50,000 USD',
    waterSafety: 'safe',
    medicalFacilities: 'excellent',
    emergencyNumber: '119',
    healthTips: [
      'Tap water is safe to drink throughout Japan',
      'Medical care is excellent but expensive',
      'English-speaking doctors available in major cities',
      'Pharmacies may require prescriptions differently than home country',
      'Allergy sufferers should note cedar pollen season (Feb-Apr)',
    ],
    lastUpdated: '2024-01-14',
  },
  {
    destinationCode: 'IN',
    destinationName: 'India',
    destinationFlag: '🇮🇳',
    riskLevel: 'high',
    vaccinations: [
      {
        name: 'Hepatitis A',
        status: 'recommended',
        description: 'High risk through food/water',
        timing: '2-4 weeks before',
      },
      {
        name: 'Hepatitis B',
        status: 'recommended',
        description: 'For extended stays',
        timing: '6 months before',
      },
      {
        name: 'Typhoid',
        status: 'recommended',
        description: 'Very common in India',
        timing: '2 weeks before',
      },
      {
        name: 'Yellow Fever',
        status: 'required',
        description: 'If arriving from affected country',
        timing: '10 days before',
      },
      {
        name: 'Japanese Encephalitis',
        status: 'situational',
        description: 'For rural areas, monsoon season',
        timing: '1 month before',
      },
      {
        name: 'Rabies',
        status: 'situational',
        description: 'Stray animals common',
        timing: '1 month before',
      },
      {
        name: 'Cholera',
        status: 'situational',
        description: 'For humanitarian workers',
        timing: '1 week before',
      },
      {
        name: 'Malaria',
        status: 'situational',
        description: 'For certain regions',
        timing: '1-2 weeks before',
      },
    ],
    covidRequirements: {
      vaccination: 'none',
      testing: 'none',
      healthDeclaration: false,
      notes: 'COVID restrictions lifted for most travelers',
    },
    diseases: [
      {
        name: 'Dengue Fever',
        risk: 'high',
        prevention: 'Mosquito protection essential',
        regions: ['Urban areas', 'Monsoon season'],
      },
      {
        name: 'Malaria',
        risk: 'moderate',
        prevention: 'Prophylaxis for rural/forest areas',
        regions: ['Rural areas', 'Northeast'],
      },
      { name: 'Typhoid', risk: 'high', prevention: 'Vaccination + food/water precautions' },
      {
        name: 'Cholera',
        risk: 'moderate',
        prevention: 'Food/water precautions',
        regions: ['Bihar', 'West Bengal'],
      },
    ],
    healthInsurance: 'recommended',
    insuranceMinCoverage: '$100,000 USD',
    waterSafety: 'unsafe',
    medicalFacilities: 'limited',
    emergencyNumber: '112',
    healthTips: [
      'Never drink tap water - only bottled or boiled',
      'Avoid raw vegetables and unpeeled fruits',
      '"Delhi Belly" is common - carry anti-diarrheal medication',
      'Quality medical care in private hospitals in major cities',
      'Air quality can be poor - consider a mask in Delhi/NCR',
    ],
    lastUpdated: '2024-01-10',
  },
  {
    destinationCode: 'KE',
    destinationName: 'Kenya',
    destinationFlag: '🇰🇪',
    riskLevel: 'high',
    vaccinations: [
      {
        name: 'Yellow Fever',
        status: 'required',
        description: 'Certificate required for entry',
        timing: '10 days before',
      },
      {
        name: 'Hepatitis A',
        status: 'recommended',
        description: 'High risk through food/water',
        timing: '2-4 weeks before',
      },
      {
        name: 'Hepatitis B',
        status: 'recommended',
        description: 'For extended stays',
        timing: '6 months before',
      },
      {
        name: 'Typhoid',
        status: 'recommended',
        description: 'Common in Kenya',
        timing: '2 weeks before',
      },
      {
        name: 'Rabies',
        status: 'recommended',
        description: 'Animal bites are a risk',
        timing: '1 month before',
      },
      {
        name: 'Meningitis',
        status: 'situational',
        description: 'For dry season travel',
        timing: '2 weeks before',
      },
      {
        name: 'Cholera',
        status: 'situational',
        description: 'During outbreaks',
        timing: '1 week before',
      },
    ],
    covidRequirements: {
      vaccination: 'none',
      testing: 'none',
      healthDeclaration: false,
      notes: 'COVID restrictions have been removed',
    },
    diseases: [
      {
        name: 'Malaria',
        risk: 'high',
        prevention: 'Antimalarial medication essential',
        regions: ['Coast', 'Lake Victoria', 'Safari areas'],
      },
      { name: 'Yellow Fever', risk: 'moderate', prevention: 'Vaccination required' },
      { name: 'Cholera', risk: 'moderate', prevention: 'Water/food precautions' },
      {
        name: 'Dengue Fever',
        risk: 'moderate',
        prevention: 'Mosquito protection',
        regions: ['Coastal areas'],
      },
    ],
    healthInsurance: 'required',
    insuranceMinCoverage: '$100,000 USD',
    waterSafety: 'unsafe',
    medicalFacilities: 'limited',
    emergencyNumber: '999',
    healthTips: [
      'Malaria prophylaxis essential for most areas',
      'Yellow fever certificate is mandatory',
      'Drink only bottled water',
      'Medical evacuation insurance strongly recommended',
      'Bring adequate supply of prescription medications',
    ],
    lastUpdated: '2024-01-08',
  },
  {
    destinationCode: 'AE',
    destinationName: 'United Arab Emirates',
    destinationFlag: '🇦🇪',
    riskLevel: 'low',
    vaccinations: [
      {
        name: 'Routine Vaccines',
        status: 'recommended',
        description: 'MMR, Tetanus, Flu',
        timing: 'Check with doctor',
      },
      {
        name: 'Hepatitis A',
        status: 'recommended',
        description: 'For food safety',
        timing: '2-4 weeks before',
      },
      {
        name: 'Hepatitis B',
        status: 'situational',
        description: 'For longer stays',
        timing: '6 months before',
      },
    ],
    covidRequirements: {
      vaccination: 'none',
      testing: 'none',
      healthDeclaration: false,
      notes: 'No COVID requirements for entry',
    },
    diseases: [{ name: 'MERS-CoV', risk: 'low', prevention: 'Avoid contact with camels' }],
    healthInsurance: 'required',
    insuranceMinCoverage: '$50,000 USD',
    waterSafety: 'safe',
    medicalFacilities: 'excellent',
    emergencyNumber: '998',
    healthTips: [
      'World-class medical facilities available',
      'Health insurance is mandatory for visa',
      'Stay hydrated - extreme heat in summer',
      'Tap water is safe but most drink bottled',
      'Prescription medications may need documentation',
    ],
    lastUpdated: '2024-01-13',
  },
  {
    destinationCode: 'ID',
    destinationName: 'Indonesia',
    destinationFlag: '🇮🇩',
    riskLevel: 'moderate',
    vaccinations: [
      {
        name: 'Hepatitis A',
        status: 'recommended',
        description: 'High risk through food/water',
        timing: '2-4 weeks before',
      },
      {
        name: 'Hepatitis B',
        status: 'recommended',
        description: 'For extended stays',
        timing: '6 months before',
      },
      {
        name: 'Typhoid',
        status: 'recommended',
        description: 'Common outside major cities',
        timing: '2 weeks before',
      },
      {
        name: 'Yellow Fever',
        status: 'required',
        description: 'If arriving from affected country',
        timing: '10 days before',
      },
      {
        name: 'Japanese Encephalitis',
        status: 'situational',
        description: 'For rural areas',
        timing: '1 month before',
      },
      {
        name: 'Rabies',
        status: 'situational',
        description: 'Especially in Bali',
        timing: '1 month before',
      },
    ],
    covidRequirements: {
      vaccination: 'none',
      testing: 'none',
      healthDeclaration: false,
      notes: 'COVID entry requirements removed',
    },
    diseases: [
      {
        name: 'Dengue Fever',
        risk: 'high',
        prevention: 'Mosquito protection essential',
        regions: ['All islands'],
      },
      {
        name: 'Malaria',
        risk: 'moderate',
        prevention: 'Prophylaxis for eastern islands',
        regions: ['Papua', 'East Nusa Tenggara'],
      },
      { name: 'Rabies', risk: 'moderate', prevention: 'Avoid animal contact', regions: ['Bali'] },
    ],
    healthInsurance: 'recommended',
    insuranceMinCoverage: '$50,000 USD',
    waterSafety: 'unsafe',
    medicalFacilities: 'limited',
    emergencyNumber: '118',
    healthTips: [
      'Bali Belly is common - be cautious with food/water',
      'Rabies is present - avoid stray dogs and monkeys',
      'Quality hospitals mainly in Jakarta and Bali',
      'Medical evacuation insurance recommended',
      'Bring medications as supply can be unreliable',
    ],
    lastUpdated: '2024-01-11',
  },
  {
    destinationCode: 'EG',
    destinationName: 'Egypt',
    destinationFlag: '🇪🇬',
    riskLevel: 'moderate',
    vaccinations: [
      {
        name: 'Hepatitis A',
        status: 'recommended',
        description: 'Food/water contamination risk',
        timing: '2-4 weeks before',
      },
      {
        name: 'Hepatitis B',
        status: 'recommended',
        description: 'For extended stays',
        timing: '6 months before',
      },
      {
        name: 'Typhoid',
        status: 'recommended',
        description: 'Common in Egypt',
        timing: '2 weeks before',
      },
      {
        name: 'Yellow Fever',
        status: 'required',
        description: 'If arriving from affected country',
        timing: '10 days before',
      },
      {
        name: 'Rabies',
        status: 'situational',
        description: 'For animal exposure risk',
        timing: '1 month before',
      },
    ],
    covidRequirements: {
      vaccination: 'none',
      testing: 'none',
      healthDeclaration: false,
      notes: 'No COVID requirements currently',
    },
    diseases: [
      { name: 'Travelers Diarrhea', risk: 'high', prevention: 'Water/food precautions essential' },
      {
        name: 'Schistosomiasis',
        risk: 'moderate',
        prevention: 'Avoid freshwater swimming in Nile',
        regions: ['Nile River', 'Nile Delta'],
      },
    ],
    healthInsurance: 'recommended',
    insuranceMinCoverage: '$50,000 USD',
    waterSafety: 'unsafe',
    medicalFacilities: 'good',
    emergencyNumber: '123',
    healthTips: [
      'Drink only bottled water',
      'Avoid ice and raw vegetables',
      'Do not swim in the Nile or freshwater canals',
      'Heat stroke risk - stay hydrated',
      'Good private hospitals in Cairo and Alexandria',
    ],
    lastUpdated: '2024-01-09',
  },
];

const riskLevelConfig = {
  low: { label: 'Low Risk', color: colors.success, bgColor: '#E8F5E9' },
  moderate: { label: 'Moderate Risk', color: colors.warning, bgColor: '#FFF3E0' },
  high: { label: 'High Risk', color: colors.error, bgColor: '#FFEBEE' },
};

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function HealthRequirementsScreen() {
  const router = useRouter();
  const [selectedDestination, setSelectedDestination] = useState<Country | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [activeTab, setActiveTab] = useState<'vaccinations' | 'diseases' | 'tips'>('vaccinations');

  const requirement = useMemo(() => {
    if (!selectedDestination) return null;
    return healthRequirements.find((r) => r.destinationCode === selectedDestination.code) || null;
  }, [selectedDestination]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return countries;
    const query = countrySearch.toLowerCase();
    return countries.filter((c) => c.name.toLowerCase().includes(query));
  }, [countrySearch]);

  const filteredDestinations = useMemo(() => {
    if (!searchQuery) return healthRequirements;
    const query = searchQuery.toLowerCase();
    return healthRequirements.filter((r) => r.destinationName.toLowerCase().includes(query));
  }, [searchQuery]);

  const renderCountryItem = useCallback(
    ({ item }: { item: Country }) => (
      <Pressable
        style={styles.countryItem}
        onPress={() => {
          setSelectedDestination(item);
          setCountryModalVisible(false);
          setCountrySearch('');
        }}
      >
        <Text style={styles.countryFlag}>{item.flag}</Text>
        <Text style={styles.countryName}>{item.name}</Text>
        {selectedDestination?.code === item.code && (
          <CheckCircle size={20} color={colors.success} />
        )}
      </Pressable>
    ),
    [selectedDestination]
  );

  const renderVaccinations = () => {
    if (!requirement) return null;

    const requiredVaccines = requirement.vaccinations.filter((v) => v.status === 'required');
    const recommendedVaccines = requirement.vaccinations.filter((v) => v.status === 'recommended');
    const situationalVaccines = requirement.vaccinations.filter((v) => v.status === 'situational');

    return (
      <View style={styles.tabContent}>
        {requiredVaccines.length > 0 && (
          <View style={styles.vaccineSection}>
            <View style={styles.vaccineSectionHeader}>
              <View style={[styles.statusDot, { backgroundColor: colors.error }]} />
              <Text style={styles.vaccineSectionTitle}>Required</Text>
            </View>
            {requiredVaccines.map((vaccine, index) => (
              <View key={index} style={styles.vaccineCard}>
                <View style={styles.vaccineHeader}>
                  <Syringe size={18} color={colors.error} />
                  <Text style={styles.vaccineName}>{vaccine.name}</Text>
                </View>
                <Text style={styles.vaccineDesc}>{vaccine.description}</Text>
                {vaccine.timing && (
                  <View style={styles.vaccineTiming}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={styles.vaccineTimingText}>{vaccine.timing}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {recommendedVaccines.length > 0 && (
          <View style={styles.vaccineSection}>
            <View style={styles.vaccineSectionHeader}>
              <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.vaccineSectionTitle}>Recommended</Text>
            </View>
            {recommendedVaccines.map((vaccine, index) => (
              <View key={index} style={styles.vaccineCard}>
                <View style={styles.vaccineHeader}>
                  <Syringe size={18} color={colors.warning} />
                  <Text style={styles.vaccineName}>{vaccine.name}</Text>
                </View>
                <Text style={styles.vaccineDesc}>{vaccine.description}</Text>
                {vaccine.timing && (
                  <View style={styles.vaccineTiming}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={styles.vaccineTimingText}>{vaccine.timing}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {situationalVaccines.length > 0 && (
          <View style={styles.vaccineSection}>
            <View style={styles.vaccineSectionHeader}>
              <View style={[styles.statusDot, { backgroundColor: colors.primaryLight }]} />
              <Text style={styles.vaccineSectionTitle}>Situational</Text>
            </View>
            {situationalVaccines.map((vaccine, index) => (
              <View key={index} style={styles.vaccineCard}>
                <View style={styles.vaccineHeader}>
                  <Syringe size={18} color={colors.primaryLight} />
                  <Text style={styles.vaccineName}>{vaccine.name}</Text>
                </View>
                <Text style={styles.vaccineDesc}>{vaccine.description}</Text>
                {vaccine.timing && (
                  <View style={styles.vaccineTiming}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={styles.vaccineTimingText}>{vaccine.timing}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderDiseases = () => {
    if (!requirement) return null;

    return (
      <View style={styles.tabContent}>
        {requirement.diseases.map((disease, index) => {
          const riskConfig = riskLevelConfig[disease.risk];
          return (
            <View key={index} style={styles.diseaseCard}>
              <View style={styles.diseaseHeader}>
                <View style={styles.diseaseInfo}>
                  <Activity size={18} color={riskConfig.color} />
                  <Text style={styles.diseaseName}>{disease.name}</Text>
                </View>
                <View style={[styles.riskBadge, { backgroundColor: riskConfig.bgColor }]}>
                  <Text style={[styles.riskBadgeText, { color: riskConfig.color }]}>
                    {riskConfig.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.diseasePrevention}>{disease.prevention}</Text>
              {disease.regions && disease.regions.length > 0 && (
                <View style={styles.diseaseRegions}>
                  <Text style={styles.diseaseRegionsLabel}>Affected areas: </Text>
                  <Text style={styles.diseaseRegionsText}>{disease.regions.join(', ')}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderTips = () => {
    if (!requirement) return null;

    return (
      <View style={styles.tabContent}>
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <ThermometerSun size={22} color={colors.primary} />
            <Text style={styles.infoLabel}>Water Safety</Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color:
                    requirement.waterSafety === 'safe'
                      ? colors.success
                      : requirement.waterSafety === 'caution'
                        ? colors.warning
                        : colors.error,
                },
              ]}
            >
              {requirement.waterSafety === 'safe'
                ? 'Safe to Drink'
                : requirement.waterSafety === 'caution'
                  ? 'Use Caution'
                  : 'Not Safe'}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Stethoscope size={22} color={colors.primary} />
            <Text style={styles.infoLabel}>Medical Care</Text>
            <Text style={styles.infoValue}>{requirement.medicalFacilities}</Text>
          </View>
          <View style={styles.infoCard}>
            <Shield size={22} color={colors.primary} />
            <Text style={styles.infoLabel}>Insurance</Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color: requirement.healthInsurance === 'required' ? colors.error : colors.warning,
                },
              ]}
            >
              {requirement.healthInsurance === 'required' ? 'Required' : 'Recommended'}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <AlertCircle size={22} color={colors.primary} />
            <Text style={styles.infoLabel}>Emergency</Text>
            <Text style={styles.infoValue}>{requirement.emergencyNumber}</Text>
          </View>
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Health Tips</Text>
          {requirement.healthTips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <CheckCircle size={16} color={colors.success} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderDestinationCard = (req: HealthRequirement) => {
    const riskConfig = riskLevelConfig[req.riskLevel];
    const requiredCount = req.vaccinations.filter((v) => v.status === 'required').length;
    const recommendedCount = req.vaccinations.filter((v) => v.status === 'recommended').length;

    return (
      <Pressable
        key={req.destinationCode}
        style={styles.destinationCard}
        onPress={() => {
          const country = countries.find((c) => c.code === req.destinationCode);
          if (country) {
            setSelectedDestination(country);
          }
        }}
      >
        <View style={styles.destHeader}>
          <View style={styles.destInfo}>
            <Text style={styles.destFlag}>{req.destinationFlag}</Text>
            <View>
              <Text style={styles.destName}>{req.destinationName}</Text>
              <View style={styles.destMeta}>
                <Syringe size={12} color={colors.textSecondary} />
                <Text style={styles.destMetaText}>
                  {requiredCount > 0
                    ? `${requiredCount} required`
                    : `${recommendedCount} recommended`}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: riskConfig.bgColor }]}>
            <Text style={[styles.riskBadgeText, { color: riskConfig.color }]}>
              {riskConfig.label}
            </Text>
          </View>
        </View>
        <View style={styles.destFooter}>
          <Text style={styles.destUpdated}>Updated {req.lastUpdated}</Text>
          <ChevronRight size={18} color={colors.textTertiary} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.text} />
            </Pressable>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Health Requirements</Text>
              <Text style={styles.headerSubtitle}>Vaccinations & health info</Text>
            </View>
          </View>

          <Pressable
            style={styles.destinationSelector}
            onPress={() => setCountryModalVisible(true)}
          >
            <Heart size={20} color="#E91E63" />
            {selectedDestination ? (
              <View style={styles.selectedDestination}>
                <Text style={styles.destSelectorFlag}>{selectedDestination.flag}</Text>
                <Text style={styles.destSelectorName}>{selectedDestination.name}</Text>
              </View>
            ) : (
              <Text style={styles.destPlaceholder}>Select destination</Text>
            )}
            <ChevronDown size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {selectedDestination && requirement ? (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View
              style={[
                styles.riskBanner,
                { backgroundColor: riskLevelConfig[requirement.riskLevel].bgColor },
              ]}
            >
              <ShieldCheck size={24} color={riskLevelConfig[requirement.riskLevel].color} />
              <View style={styles.riskBannerInfo}>
                <Text
                  style={[
                    styles.riskBannerTitle,
                    { color: riskLevelConfig[requirement.riskLevel].color },
                  ]}
                >
                  {riskLevelConfig[requirement.riskLevel].label}
                </Text>
                <Text style={styles.riskBannerSubtitle}>Health risk assessment for travelers</Text>
              </View>
            </View>

            {requirement.covidRequirements.vaccination !== 'none' ||
            requirement.covidRequirements.testing !== 'none' ||
            requirement.covidRequirements.healthDeclaration ? (
              <View style={styles.covidSection}>
                <View style={styles.covidHeader}>
                  <TestTube size={20} color={colors.primary} />
                  <Text style={styles.covidTitle}>COVID-19 Requirements</Text>
                </View>
                {requirement.covidRequirements.vaccination !== 'none' && (
                  <View style={styles.covidItem}>
                    <Text style={styles.covidLabel}>Vaccination:</Text>
                    <Text
                      style={[
                        styles.covidValue,
                        {
                          color:
                            requirement.covidRequirements.vaccination === 'required'
                              ? colors.error
                              : colors.warning,
                        },
                      ]}
                    >
                      {requirement.covidRequirements.vaccination}
                    </Text>
                  </View>
                )}
                {requirement.covidRequirements.testing !== 'none' && (
                  <View style={styles.covidItem}>
                    <Text style={styles.covidLabel}>Testing:</Text>
                    <Text style={styles.covidValue}>{requirement.covidRequirements.testing}</Text>
                  </View>
                )}
                {requirement.covidRequirements.notes && (
                  <Text style={styles.covidNotes}>{requirement.covidRequirements.notes}</Text>
                )}
              </View>
            ) : (
              <View style={styles.covidSection}>
                <View style={styles.covidHeader}>
                  <CheckCircle size={20} color={colors.success} />
                  <Text style={styles.covidTitle}>No COVID-19 Requirements</Text>
                </View>
                {requirement.covidRequirements.notes && (
                  <Text style={styles.covidNotes}>{requirement.covidRequirements.notes}</Text>
                )}
              </View>
            )}

            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, activeTab === 'vaccinations' && styles.tabActive]}
                onPress={() => setActiveTab('vaccinations')}
              >
                <Syringe
                  size={16}
                  color={activeTab === 'vaccinations' ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[styles.tabText, activeTab === 'vaccinations' && styles.tabTextActive]}
                >
                  Vaccines
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeTab === 'diseases' && styles.tabActive]}
                onPress={() => setActiveTab('diseases')}
              >
                <Activity
                  size={16}
                  color={activeTab === 'diseases' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.tabText, activeTab === 'diseases' && styles.tabTextActive]}>
                  Diseases
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeTab === 'tips' && styles.tabActive]}
                onPress={() => setActiveTab('tips')}
              >
                <Info
                  size={16}
                  color={activeTab === 'tips' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.tabText, activeTab === 'tips' && styles.tabTextActive]}>
                  Tips
                </Text>
              </Pressable>
            </View>

            {activeTab === 'vaccinations' && renderVaccinations()}
            {activeTab === 'diseases' && renderDiseases()}
            {activeTab === 'tips' && renderTips()}

            <View style={styles.disclaimer}>
              <AlertTriangle size={16} color={colors.warning} />
              <Text style={styles.disclaimerText}>
                Health requirements can change. Always consult a healthcare professional and check
                official sources before traveling.
              </Text>
            </View>

            <Text style={styles.updateInfo}>Last updated: {requirement.lastUpdated}</Text>
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
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

            <Text style={styles.browseTitle}>Browse by Destination</Text>
            <View style={styles.destinationList}>
              {filteredDestinations.map(renderDestinationCard)}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      <Modal
        visible={countryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Destination</Text>
            <Pressable
              style={styles.modalClose}
              onPress={() => {
                setCountryModalVisible(false);
                setCountrySearch('');
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
              value={countrySearch}
              onChangeText={setCountrySearch}
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
    fontWeight: '700' as const,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  destinationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 12,
  },
  selectedDestination: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  destSelectorFlag: {
    fontSize: 24,
  },
  destSelectorName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  destPlaceholder: {
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
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  riskBannerInfo: {
    flex: 1,
  },
  riskBannerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  riskBannerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  covidSection: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  covidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  covidTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  covidItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  covidLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  covidValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    textTransform: 'capitalize' as const,
  },
  covidNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabContent: {
    marginBottom: 16,
  },
  vaccineSection: {
    marginBottom: 20,
  },
  vaccineSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  vaccineSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  vaccineCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  vaccineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  vaccineName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  vaccineDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  vaccineTiming: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  vaccineTimingText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  diseaseCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  diseaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  diseaseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  diseaseName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  diseasePrevention: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  diseaseRegions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  diseaseRegionsLabel: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  diseaseRegionsText: {
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
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
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 4,
    textTransform: 'capitalize' as const,
    textAlign: 'center' as const,
  },
  tipsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 14,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  updateInfo: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center' as const,
    marginTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  browseTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 14,
  },
  destinationList: {
    gap: 12,
  },
  destinationCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
  },
  destHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  destInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  destFlag: {
    fontSize: 32,
  },
  destName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.text,
  },
  destMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  destMetaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  destFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  destUpdated: {
    fontSize: 12,
    color: colors.textTertiary,
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
    fontWeight: '700' as const,
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
});
