/* eslint-disable max-lines -- tracked in #1 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  RefreshControl,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  MapPin,
  Bell,
  BellOff,
  Search,
  Filter,
  Clock,
  ChevronRight,
  AlertCircle,
  Megaphone,
  CloudLightning,
  Heart,
  ShieldAlert,
  Siren,
  Phone,
  Globe,
  CheckCircle,
  X,
  Plus,
  Trash2,
  Info,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { SafetyAlert, SafetySubscription, EmergencyService } from '@/types';

const MOCK_ALERTS: SafetyAlert[] = [
  {
    id: '1',
    type: 'advisory',
    severity: 'moderate',
    title: 'Travel Advisory: Political Unrest',
    description:
      'Ongoing political demonstrations in the capital city. Avoid government buildings and central plaza areas. Public transportation may be disrupted.',
    location: {
      city: 'Bangkok',
      country: 'Thailand',
      region: 'Central',
    },
    issuedAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-01-21T08:30:00Z',
    source: 'US Department of State',
    affectedAreas: ['Ratchaprasong', 'Democracy Monument', 'Government House'],
    recommendations: [
      'Avoid large gatherings and protests',
      'Monitor local news and social media',
      'Keep travel documents accessible',
      'Register with your embassy',
    ],
    isActive: true,
    isRead: false,
  },
  {
    id: '2',
    type: 'protest',
    severity: 'high',
    title: 'Large-Scale Protests Expected',
    description:
      'Major protests planned for the weekend in downtown area. Road closures and transport disruptions expected. Businesses may close early.',
    location: {
      city: 'Paris',
      country: 'France',
      region: 'Île-de-France',
    },
    issuedAt: '2024-01-19T10:00:00Z',
    updatedAt: '2024-01-20T16:00:00Z',
    expiresAt: '2024-01-22T23:59:00Z',
    source: 'French Ministry of Interior',
    affectedAreas: ['Champs-Élysées', 'Place de la République', 'Bastille'],
    recommendations: [
      'Avoid city center on Saturday and Sunday',
      'Use metro instead of surface transport',
      'Keep hotel contact information handy',
      'Have alternative plans ready',
    ],
    isActive: true,
    isRead: false,
  },
  {
    id: '3',
    type: 'natural_disaster',
    severity: 'critical',
    title: 'Tropical Storm Warning',
    description:
      'Tropical Storm approaching coastal areas. Heavy rainfall and strong winds expected for the next 48 hours. Flash flooding possible in low-lying areas.',
    location: {
      city: 'Cancun',
      country: 'Mexico',
      region: 'Quintana Roo',
    },
    issuedAt: '2024-01-21T06:00:00Z',
    updatedAt: '2024-01-21T12:00:00Z',
    source: 'National Hurricane Center',
    affectedAreas: ['Cancun', 'Playa del Carmen', 'Tulum', 'Cozumel'],
    recommendations: [
      'Stay indoors and away from windows',
      'Stock up on water and essentials',
      'Follow hotel evacuation instructions',
      'Do not attempt water activities',
      'Keep devices charged',
    ],
    isActive: true,
    isRead: true,
  },
  {
    id: '4',
    type: 'health',
    severity: 'moderate',
    title: 'Dengue Fever Outbreak',
    description:
      'Increased cases of dengue fever reported in urban areas. Mosquito-borne illness risk elevated during rainy season.',
    location: {
      country: 'Vietnam',
      region: 'Southern Region',
    },
    issuedAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
    source: 'WHO',
    affectedAreas: ['Ho Chi Minh City', 'Da Nang', 'Nha Trang'],
    recommendations: [
      'Use mosquito repellent with DEET',
      'Wear long sleeves and pants',
      'Sleep under mosquito nets',
      'Seek medical attention if symptoms appear',
    ],
    isActive: true,
    isRead: true,
  },
  {
    id: '5',
    type: 'crime',
    severity: 'low',
    title: 'Increased Pickpocket Activity',
    description:
      'Reports of increased pickpocket activity in tourist areas and public transport. Be vigilant with personal belongings.',
    location: {
      city: 'Barcelona',
      country: 'Spain',
      region: 'Catalonia',
    },
    issuedAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z',
    source: 'Local Police Advisory',
    affectedAreas: ['Las Ramblas', 'Sagrada Familia', 'Metro Lines'],
    recommendations: [
      'Use money belts or hidden pouches',
      'Keep bags zipped and in front of you',
      'Be extra careful in crowded areas',
      'Avoid displaying expensive items',
    ],
    isActive: true,
    isRead: true,
  },
  {
    id: '6',
    type: 'emergency',
    severity: 'high',
    title: 'Airport Closure',
    description:
      'Main international airport temporarily closed due to security incident. Flights diverted to nearby airports. Significant delays expected.',
    location: {
      city: 'London',
      country: 'United Kingdom',
    },
    issuedAt: '2024-01-21T08:00:00Z',
    updatedAt: '2024-01-21T10:00:00Z',
    expiresAt: '2024-01-21T18:00:00Z',
    source: 'UK Civil Aviation Authority',
    affectedAreas: ['Heathrow Airport', 'Surrounding roads'],
    recommendations: [
      'Check flight status before leaving',
      'Contact airline for rebooking options',
      'Consider alternative airports',
      'Allow extra travel time',
    ],
    isActive: true,
    isRead: false,
  },
];

const MOCK_SUBSCRIPTIONS: SafetySubscription[] = [
  { id: '1', country: 'Japan', city: 'Tokyo', isActive: true, notificationsEnabled: true },
  { id: '2', country: 'France', isActive: true, notificationsEnabled: true },
  { id: '3', country: 'Thailand', city: 'Bangkok', isActive: true, notificationsEnabled: false },
];

const EMERGENCY_SERVICES: EmergencyService[] = [
  {
    id: '1',
    country: 'United States',
    police: '911',
    ambulance: '911',
    fire: '911',
    tourist: '1-888-407-4747',
  },
  {
    id: '2',
    country: 'United Kingdom',
    police: '999',
    ambulance: '999',
    fire: '999',
    tourist: '+44 20 7008 1500',
  },
  {
    id: '3',
    country: 'Japan',
    police: '110',
    ambulance: '119',
    fire: '119',
    tourist: '03-3501-8431',
  },
  {
    id: '4',
    country: 'France',
    police: '17',
    ambulance: '15',
    fire: '18',
    tourist: '+33 1 43 17 53 53',
  },
  { id: '5', country: 'Thailand', police: '191', ambulance: '1669', fire: '199', tourist: '1155' },
  { id: '6', country: 'Mexico', police: '911', ambulance: '911', fire: '911', tourist: '078' },
];

const SEVERITY_CONFIG = {
  low: { color: colors.success, bg: '#E8F5E9', label: 'Low' },
  moderate: { color: colors.warning, bg: '#FFF3E0', label: 'Moderate' },
  high: { color: '#E65100', bg: '#FFE0B2', label: 'High' },
  critical: { color: colors.error, bg: '#FFEBEE', label: 'Critical' },
};

const TYPE_CONFIG = {
  advisory: { icon: Info, label: 'Advisory', color: colors.primary },
  emergency: { icon: Siren, label: 'Emergency', color: colors.error },
  protest: { icon: Megaphone, label: 'Protest', color: colors.warning },
  natural_disaster: { icon: CloudLightning, label: 'Natural Disaster', color: '#7B1FA2' },
  health: { icon: Heart, label: 'Health', color: '#00897B' },
  crime: { icon: ShieldAlert, label: 'Crime', color: '#5D4037' },
  terrorism: { icon: AlertTriangle, label: 'Security', color: colors.error },
};

type FilterType =
  | 'all'
  | 'advisory'
  | 'emergency'
  | 'protest'
  | 'natural_disaster'
  | 'health'
  | 'crime';
type SeverityFilter = 'all' | 'low' | 'moderate' | 'high' | 'critical';

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function SafetyAlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<SafetyAlert[]>(MOCK_ALERTS);
  const [subscriptions, setSubscriptions] = useState<SafetySubscription[]>(MOCK_SUBSCRIPTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'subscriptions'>('alerts');

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.location.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.location.city?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    return matchesSearch && matchesType && matchesSeverity && alert.isActive;
  });

  const criticalAlerts = filteredAlerts.filter(
    (a) => a.severity === 'critical' || a.severity === 'high'
  );
  const otherAlerts = filteredAlerts.filter(
    (a) => a.severity !== 'critical' && a.severity !== 'high'
  );

  const markAsRead = (alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)));
  };

  const toggleSubscriptionNotification = (subId: string) => {
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === subId ? { ...s, notificationsEnabled: !s.notificationsEnabled } : s
      )
    );
  };

  const removeSubscription = (subId: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== subId));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const callEmergency = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const renderAlertCard = (alert: SafetyAlert) => {
    const severityConfig = SEVERITY_CONFIG[alert.severity];
    const typeConfig = TYPE_CONFIG[alert.type];
    const TypeIcon = typeConfig.icon;

    return (
      <TouchableOpacity
        key={alert.id}
        style={[
          styles.alertCard,
          !alert.isRead && styles.unreadCard,
          alert.severity === 'critical' && styles.criticalCard,
        ]}
        onPress={() => {
          markAsRead(alert.id);
          setSelectedAlert(alert);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.alertHeader}>
          <View style={[styles.typeIconContainer, { backgroundColor: typeConfig.color + '15' }]}>
            <TypeIcon size={20} color={typeConfig.color} />
          </View>
          <View style={styles.alertHeaderText}>
            <View style={styles.alertTitleRow}>
              <Text style={styles.alertTitle} numberOfLines={2}>
                {alert.title}
              </Text>
              {!alert.isRead && <View style={styles.unreadDot} />}
            </View>
            <View style={styles.alertMeta}>
              <MapPin size={12} color={colors.textSecondary} />
              <Text style={styles.alertLocation}>
                {alert.location.city ? `${alert.location.city}, ` : ''}
                {alert.location.country}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.alertDescription} numberOfLines={2}>
          {alert.description}
        </Text>

        <View style={styles.alertFooter}>
          <View style={[styles.severityBadge, { backgroundColor: severityConfig.bg }]}>
            <AlertCircle size={12} color={severityConfig.color} />
            <Text style={[styles.severityText, { color: severityConfig.color }]}>
              {severityConfig.label}
            </Text>
          </View>
          <View style={styles.alertTime}>
            <Clock size={12} color={colors.textTertiary} />
            <Text style={styles.alertTimeText}>{formatDate(alert.updatedAt)}</Text>
          </View>
          <ChevronRight size={16} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderAlertDetail = () => {
    if (!selectedAlert) return null;

    const severityConfig = SEVERITY_CONFIG[selectedAlert.severity];
    const typeConfig = TYPE_CONFIG[selectedAlert.type];
    const TypeIcon = typeConfig.icon;

    return (
      <Modal
        visible={!!selectedAlert}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedAlert(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedAlert(null)} style={styles.modalClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Alert Details</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.detailSeverityBanner, { backgroundColor: severityConfig.bg }]}>
              <AlertCircle size={20} color={severityConfig.color} />
              <Text style={[styles.detailSeverityText, { color: severityConfig.color }]}>
                {severityConfig.label} Severity
              </Text>
            </View>

            <View style={styles.detailTypeRow}>
              <View style={[styles.detailTypeIcon, { backgroundColor: typeConfig.color + '15' }]}>
                <TypeIcon size={24} color={typeConfig.color} />
              </View>
              <Text style={styles.detailType}>{typeConfig.label}</Text>
            </View>

            <Text style={styles.detailTitle}>{selectedAlert.title}</Text>

            <View style={styles.detailLocation}>
              <MapPin size={16} color={colors.primary} />
              <Text style={styles.detailLocationText}>
                {selectedAlert.location.city ? `${selectedAlert.location.city}, ` : ''}
                {selectedAlert.location.region ? `${selectedAlert.location.region}, ` : ''}
                {selectedAlert.location.country}
              </Text>
            </View>

            <Text style={styles.detailDescription}>{selectedAlert.description}</Text>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Affected Areas</Text>
              <View style={styles.affectedAreas}>
                {selectedAlert.affectedAreas.map((area, index) => (
                  <View key={index} style={styles.affectedAreaTag}>
                    <MapPin size={12} color={colors.primary} />
                    <Text style={styles.affectedAreaText}>{area}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Recommendations</Text>
              {selectedAlert.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <CheckCircle size={16} color={colors.success} />
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>

            <View style={styles.detailMeta}>
              <View style={styles.detailMetaRow}>
                <Text style={styles.detailMetaLabel}>Source:</Text>
                <Text style={styles.detailMetaValue}>{selectedAlert.source}</Text>
              </View>
              <View style={styles.detailMetaRow}>
                <Text style={styles.detailMetaLabel}>Issued:</Text>
                <Text style={styles.detailMetaValue}>
                  {new Date(selectedAlert.issuedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.detailMetaRow}>
                <Text style={styles.detailMetaLabel}>Last Updated:</Text>
                <Text style={styles.detailMetaValue}>
                  {new Date(selectedAlert.updatedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {selectedAlert.expiresAt && (
                <View style={styles.detailMetaRow}>
                  <Text style={styles.detailMetaLabel}>Expires:</Text>
                  <Text style={styles.detailMetaValue}>
                    {new Date(selectedAlert.expiresAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={() => {
                setSelectedAlert(null);
                setShowEmergencyModal(true);
              }}
            >
              <Phone size={20} color={colors.textLight} />
              <Text style={styles.emergencyButtonText}>Emergency Contacts</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderEmergencyModal = () => (
    <Modal
      visible={showEmergencyModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowEmergencyModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowEmergencyModal(false)} style={styles.modalClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Emergency Services</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.emergencyWarning}>
            <AlertTriangle size={24} color={colors.error} />
            <Text style={styles.emergencyWarningText}>
              For life-threatening emergencies, call local emergency services immediately
            </Text>
          </View>

          {EMERGENCY_SERVICES.map((service) => (
            <View key={service.id} style={styles.emergencyCountry}>
              <View style={styles.emergencyCountryHeader}>
                <Globe size={20} color={colors.primary} />
                <Text style={styles.emergencyCountryName}>{service.country}</Text>
              </View>

              <View style={styles.emergencyNumbers}>
                <TouchableOpacity
                  style={styles.emergencyNumberItem}
                  onPress={() => callEmergency(service.police)}
                >
                  <View style={[styles.emergencyNumberIcon, { backgroundColor: '#E3F2FD' }]}>
                    <Shield size={18} color="#1976D2" />
                  </View>
                  <View style={styles.emergencyNumberInfo}>
                    <Text style={styles.emergencyNumberLabel}>Police</Text>
                    <Text style={styles.emergencyNumber}>{service.police}</Text>
                  </View>
                  <Phone size={18} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.emergencyNumberItem}
                  onPress={() => callEmergency(service.ambulance)}
                >
                  <View style={[styles.emergencyNumberIcon, { backgroundColor: '#FFEBEE' }]}>
                    <Heart size={18} color={colors.error} />
                  </View>
                  <View style={styles.emergencyNumberInfo}>
                    <Text style={styles.emergencyNumberLabel}>Ambulance</Text>
                    <Text style={styles.emergencyNumber}>{service.ambulance}</Text>
                  </View>
                  <Phone size={18} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.emergencyNumberItem}
                  onPress={() => callEmergency(service.fire)}
                >
                  <View style={[styles.emergencyNumberIcon, { backgroundColor: '#FFF3E0' }]}>
                    <Siren size={18} color={colors.warning} />
                  </View>
                  <View style={styles.emergencyNumberInfo}>
                    <Text style={styles.emergencyNumberLabel}>Fire</Text>
                    <Text style={styles.emergencyNumber}>{service.fire}</Text>
                  </View>
                  <Phone size={18} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.emergencyNumberItem}
                  onPress={() => callEmergency(service.tourist)}
                >
                  <View style={[styles.emergencyNumberIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Globe size={18} color={colors.success} />
                  </View>
                  <View style={styles.emergencyNumberInfo}>
                    <Text style={styles.emergencyNumberLabel}>Tourist Helpline</Text>
                    <Text style={styles.emergencyNumber}>{service.tourist}</Text>
                  </View>
                  <Phone size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.modalClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filter Alerts</Text>
          <TouchableOpacity
            onPress={() => {
              setTypeFilter('all');
              setSeverityFilter('all');
            }}
          >
            <Text style={styles.clearFilters}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.filterSectionTitle}>Alert Type</Text>
          <View style={styles.filterOptions}>
            {(
              [
                'all',
                'advisory',
                'emergency',
                'protest',
                'natural_disaster',
                'health',
                'crime',
              ] as FilterType[]
            ).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.filterOption, typeFilter === type && styles.filterOptionActive]}
                onPress={() => setTypeFilter(type)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    typeFilter === type && styles.filterOptionTextActive,
                  ]}
                >
                  {type === 'all'
                    ? 'All Types'
                    : TYPE_CONFIG[type as keyof typeof TYPE_CONFIG]?.label || type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Severity Level</Text>
          <View style={styles.filterOptions}>
            {(['all', 'low', 'moderate', 'high', 'critical'] as SeverityFilter[]).map(
              (severity) => (
                <TouchableOpacity
                  key={severity}
                  style={[
                    styles.filterOption,
                    severityFilter === severity && styles.filterOptionActive,
                    severity !== 'all' && {
                      borderColor: SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG].color,
                    },
                  ]}
                  onPress={() => setSeverityFilter(severity)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      severityFilter === severity && styles.filterOptionTextActive,
                    ]}
                  >
                    {severity === 'all'
                      ? 'All Levels'
                      : SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG].label}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </ScrollView>

        <View style={styles.filterFooter}>
          <TouchableOpacity
            style={styles.applyFilterButton}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.applyFilterText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderSubscriptions = () => (
    <View style={styles.subscriptionsContainer}>
      <View style={styles.subscriptionsHeader}>
        <Text style={styles.subscriptionsTitle}>Monitored Locations</Text>
        <Text style={styles.subscriptionsSubtitle}>Get alerts for these destinations</Text>
      </View>

      {subscriptions.length === 0 ? (
        <View style={styles.emptySubscriptions}>
          <Bell size={48} color={colors.textTertiary} />
          <Text style={styles.emptySubscriptionsText}>No locations monitored</Text>
          <Text style={styles.emptySubscriptionsSubtext}>
            Add destinations to receive safety alerts
          </Text>
        </View>
      ) : (
        subscriptions.map((sub) => (
          <View key={sub.id} style={styles.subscriptionCard}>
            <View style={styles.subscriptionInfo}>
              <View style={styles.subscriptionIcon}>
                <MapPin size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.subscriptionLocation}>
                  {sub.city ? `${sub.city}, ` : ''}
                  {sub.country}
                </Text>
                <Text style={styles.subscriptionStatus}>
                  {sub.notificationsEnabled ? 'Notifications on' : 'Notifications off'}
                </Text>
              </View>
            </View>
            <View style={styles.subscriptionActions}>
              <TouchableOpacity
                style={styles.subscriptionAction}
                onPress={() => toggleSubscriptionNotification(sub.id)}
              >
                {sub.notificationsEnabled ? (
                  <Bell size={20} color={colors.primary} />
                ) : (
                  <BellOff size={20} color={colors.textTertiary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.subscriptionAction}
                onPress={() => removeSubscription(sub.id)}
              >
                <Trash2 size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.addSubscriptionButton}>
        <Plus size={20} color={colors.primary} />
        <Text style={styles.addSubscriptionText}>Add Location</Text>
      </TouchableOpacity>
    </View>
  );

  const unreadCount = alerts.filter((a) => !a.isRead && a.isActive).length;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Shield size={24} color={colors.primary} />
            <Text style={styles.title}>Safety Alerts</Text>
            {unreadCount > 0 && (
              <Animated.View style={[styles.unreadBadge, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </Animated.View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setShowEmergencyModal(true)}
            style={styles.emergencyIcon}
          >
            <Phone size={22} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'alerts' && styles.tabActive]}
            onPress={() => setActiveTab('alerts')}
          >
            <AlertTriangle
              size={18}
              color={activeTab === 'alerts' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'alerts' && styles.tabTextActive]}>
              Alerts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'subscriptions' && styles.tabActive]}
            onPress={() => setActiveTab('subscriptions')}
          >
            <Bell
              size={18}
              color={activeTab === 'subscriptions' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'subscriptions' && styles.tabTextActive]}>
              Subscriptions
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {activeTab === 'alerts' ? (
        <>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color={colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by location or keyword..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.filterButton,
                (typeFilter !== 'all' || severityFilter !== 'all') && styles.filterButtonActive,
              ]}
              onPress={() => setShowFilterModal(true)}
            >
              <Filter
                size={20}
                color={
                  typeFilter !== 'all' || severityFilter !== 'all' ? colors.textLight : colors.text
                }
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          >
            {criticalAlerts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <AlertTriangle size={18} color={colors.error} />
                  <Text style={styles.sectionTitle}>Urgent Alerts</Text>
                  <View style={styles.urgentCount}>
                    <Text style={styles.urgentCountText}>{criticalAlerts.length}</Text>
                  </View>
                </View>
                {criticalAlerts.map(renderAlertCard)}
              </View>
            )}

            {otherAlerts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Info size={18} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Other Alerts</Text>
                </View>
                {otherAlerts.map(renderAlertCard)}
              </View>
            )}

            {filteredAlerts.length === 0 && (
              <View style={styles.emptyState}>
                <Shield size={64} color={colors.textTertiary} />
                <Text style={styles.emptyStateTitle}>No Active Alerts</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery || typeFilter !== 'all' || severityFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'All destinations appear safe'}
                </Text>
              </View>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>
        </>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {renderSubscriptions()}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {renderAlertDetail()}
      {renderEmergencyModal()}
      {renderFilterModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeTop: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  unreadBadge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unreadBadgeText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  emergencyIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
  },
  tabActive: {
    backgroundColor: colors.primary + '15',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: colors.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
  },
  urgentCount: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  urgentCountText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  criticalCard: {
    borderColor: colors.error + '40',
    backgroundColor: '#FFFBFA',
  },
  alertHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertHeaderText: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  alertTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  alertLocation: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  alertDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  alertTime: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertTimeText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  clearFilters: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSeverityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailSeverityText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  detailTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  detailTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailType: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 28,
  },
  detailLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  detailLocationText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  detailDescription: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  affectedAreas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  affectedAreaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  affectedAreaText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  detailMeta: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailMetaRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailMetaLabel: {
    width: 100,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  detailMetaValue: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 24,
  },
  emergencyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textLight,
  },
  emergencyWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  emergencyWarningText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  emergencyCountry: {
    marginBottom: 24,
  },
  emergencyCountryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  emergencyCountryName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  emergencyNumbers: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  emergencyNumberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  emergencyNumberIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emergencyNumberInfo: {
    flex: 1,
  },
  emergencyNumberLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  emergencyNumber: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500' as const,
  },
  filterOptionTextActive: {
    color: colors.textLight,
  },
  filterFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  applyFilterButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyFilterText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textLight,
  },
  subscriptionsContainer: {
    padding: 16,
  },
  subscriptionsHeader: {
    marginBottom: 20,
  },
  subscriptionsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  subscriptionsSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptySubscriptions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySubscriptionsText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
  },
  emptySubscriptionsSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  subscriptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionLocation: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  subscriptionStatus: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  subscriptionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  subscriptionAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
  },
  addSubscriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addSubscriptionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  bottomPadding: {
    height: 40,
  },
});
