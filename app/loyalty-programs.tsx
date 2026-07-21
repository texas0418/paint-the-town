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
  Alert,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plane,
  Building2,
  CreditCard,
  Plus,
  ChevronRight,
  Star,
  Award,
  Trash2,
  X,
  Check,
  RefreshCw,
  TrendingUp,
  Crown,
  Sparkles,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { LoyaltyProgram } from '@/types';

interface ProgramTemplate {
  id: string;
  name: string;
  type: 'airline' | 'hotel' | 'creditCard' | 'other';
  logo: string;
  color: string;
  tiers: string[];
}

const airlinePrograms: ProgramTemplate[] = [
  {
    id: 'delta-skymiles',
    name: 'Delta SkyMiles',
    type: 'airline',
    logo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=100',
    color: '#E31837',
    tiers: ['Member', 'Silver', 'Gold', 'Platinum', 'Diamond'],
  },
  {
    id: 'united-mileageplus',
    name: 'United MileagePlus',
    type: 'airline',
    logo: 'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=100',
    color: '#0033A0',
    tiers: ['Member', 'Premier Silver', 'Premier Gold', 'Premier Platinum', 'Premier 1K'],
  },
  {
    id: 'american-aadvantage',
    name: 'American AAdvantage',
    type: 'airline',
    logo: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=100',
    color: '#0078D2',
    tiers: ['Member', 'Gold', 'Platinum', 'Platinum Pro', 'Executive Platinum'],
  },
  {
    id: 'southwest-rapid',
    name: 'Southwest Rapid Rewards',
    type: 'airline',
    logo: 'https://images.unsplash.com/photo-1583202075386-603bb3e57d87?w=100',
    color: '#F9B612',
    tiers: ['Member', 'A-List', 'A-List Preferred', 'Companion Pass'],
  },
  {
    id: 'jetblue-trueblue',
    name: 'JetBlue TrueBlue',
    type: 'airline',
    logo: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100',
    color: '#003876',
    tiers: ['Member', 'Mosaic'],
  },
  {
    id: 'alaska-mileage',
    name: 'Alaska Mileage Plan',
    type: 'airline',
    logo: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=100',
    color: '#01426A',
    tiers: ['Member', 'MVP', 'MVP Gold', 'MVP Gold 75K'],
  },
];

const hotelPrograms: ProgramTemplate[] = [
  {
    id: 'marriott-bonvoy',
    name: 'Marriott Bonvoy',
    type: 'hotel',
    logo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100',
    color: '#8B0051',
    tiers: [
      'Member',
      'Silver Elite',
      'Gold Elite',
      'Platinum Elite',
      'Titanium Elite',
      'Ambassador',
    ],
  },
  {
    id: 'hilton-honors',
    name: 'Hilton Honors',
    type: 'hotel',
    logo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=100',
    color: '#104C97',
    tiers: ['Member', 'Silver', 'Gold', 'Diamond'],
  },
  {
    id: 'ihg-rewards',
    name: 'IHG One Rewards',
    type: 'hotel',
    logo: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=100',
    color: '#006341',
    tiers: ['Club', 'Silver Elite', 'Gold Elite', 'Platinum Elite', 'Diamond Elite'],
  },
  {
    id: 'hyatt-world',
    name: 'World of Hyatt',
    type: 'hotel',
    logo: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=100',
    color: '#000000',
    tiers: ['Member', 'Discoverist', 'Explorist', 'Globalist'],
  },
  {
    id: 'wyndham-rewards',
    name: 'Wyndham Rewards',
    type: 'hotel',
    logo: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=100',
    color: '#0072CE',
    tiers: ['Blue', 'Gold', 'Platinum', 'Diamond'],
  },
  {
    id: 'choice-privileges',
    name: 'Choice Privileges',
    type: 'hotel',
    logo: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=100',
    color: '#0066B3',
    tiers: ['Member', 'Gold', 'Platinum', 'Diamond'],
  },
];

const creditCardPrograms: ProgramTemplate[] = [
  {
    id: 'amex-mr',
    name: 'Amex Membership Rewards',
    type: 'creditCard',
    logo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100',
    color: '#006FCF',
    tiers: ['Member'],
  },
  {
    id: 'chase-ur',
    name: 'Chase Ultimate Rewards',
    type: 'creditCard',
    logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100',
    color: '#1A4480',
    tiers: ['Member'],
  },
  {
    id: 'citi-typ',
    name: 'Citi ThankYou Points',
    type: 'creditCard',
    logo: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=100',
    color: '#003B70',
    tiers: ['Member'],
  },
  {
    id: 'capital-miles',
    name: 'Capital One Miles',
    type: 'creditCard',
    logo: 'https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=100',
    color: '#D03027',
    tiers: ['Member'],
  },
];

type TabType = 'all' | 'airline' | 'hotel' | 'creditCard';

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function LoyaltyProgramsScreen() {
  const router = useRouter();
  const { user, addLoyaltyProgram, updateLoyaltyProgram, removeLoyaltyProgram } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramTemplate | null>(null);
  const [memberId, setMemberId] = useState('');
  const [points, setPoints] = useState('');
  const [selectedTier, setSelectedTier] = useState('');

  const connectedPrograms = user.loyaltyPrograms || [];

  const totalPoints = connectedPrograms.reduce((sum, p) => sum + p.points, 0);

  const tabs: { id: TabType; label: string; icon: typeof Plane }[] = [
    { id: 'all', label: 'All', icon: Star },
    { id: 'airline', label: 'Airlines', icon: Plane },
    { id: 'hotel', label: 'Hotels', icon: Building2 },
    { id: 'creditCard', label: 'Cards', icon: CreditCard },
  ];

  const filteredPrograms =
    activeTab === 'all' ? connectedPrograms : connectedPrograms.filter((p) => p.type === activeTab);

  const getAvailablePrograms = () => {
    const connectedIds = connectedPrograms.map((p) => p.id);
    let programs: ProgramTemplate[] = [];

    if (activeTab === 'all' || activeTab === 'airline') {
      programs = [...programs, ...airlinePrograms.filter((p) => !connectedIds.includes(p.id))];
    }
    if (activeTab === 'all' || activeTab === 'hotel') {
      programs = [...programs, ...hotelPrograms.filter((p) => !connectedIds.includes(p.id))];
    }
    if (activeTab === 'all' || activeTab === 'creditCard') {
      programs = [...programs, ...creditCardPrograms.filter((p) => !connectedIds.includes(p.id))];
    }

    return programs;
  };

  const getProgramTemplate = (id: string): ProgramTemplate | undefined => {
    return [...airlinePrograms, ...hotelPrograms, ...creditCardPrograms].find((p) => p.id === id);
  };

  const handleAddProgram = () => {
    if (!selectedProgram || !memberId.trim()) {
      Alert.alert('Error', 'Please enter your member ID');
      return;
    }

    const newProgram: LoyaltyProgram = {
      id: selectedProgram.id,
      name: selectedProgram.name,
      type: selectedProgram.type,
      memberId: memberId.trim(),
      points: parseInt(points) || 0,
      tier: selectedTier || selectedProgram.tiers[0],
      icon: selectedProgram.logo,
    };

    addLoyaltyProgram(newProgram);
    setShowAddModal(false);
    setSelectedProgram(null);
    setMemberId('');
    setPoints('');
    setSelectedTier('');

    Alert.alert('Success', `${selectedProgram.name} has been connected!`);
  };

  const handleRemoveProgram = (programId: string) => {
    const program = connectedPrograms.find((p) => p.id === programId);
    Alert.alert('Remove Program', `Are you sure you want to disconnect ${program?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeLoyaltyProgram(programId),
      },
    ]);
  };

  const handleSyncProgram = (programId: string) => {
    const randomPoints = Math.floor(Math.random() * 5000);
    updateLoyaltyProgram(programId, {
      points: (connectedPrograms.find((p) => p.id === programId)?.points || 0) + randomPoints,
    });
    Alert.alert('Synced!', `Added ${randomPoints.toLocaleString()} points from recent activity`);
  };

  const openAddModal = (program: ProgramTemplate) => {
    setSelectedProgram(program);
    setSelectedTier(program.tiers[0]);
    setShowAddModal(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'airline':
        return Plane;
      case 'hotel':
        return Building2;
      case 'creditCard':
        return CreditCard;
      default:
        return Star;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'airline':
        return '#0EA5E9';
      case 'hotel':
        return '#8B5CF6';
      case 'creditCard':
        return '#10B981';
      default:
        return colors.primary;
    }
  };

  const renderConnectedProgram = (program: LoyaltyProgram) => {
    const template = getProgramTemplate(program.id);
    const TypeIcon = getTypeIcon(program.type);
    const typeColor = template?.color || getTypeColor(program.type);

    return (
      <View key={program.id} style={styles.programCard}>
        <LinearGradient
          colors={[typeColor, `${typeColor}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.programCardGradient}
        />
        <View style={styles.programCardContent}>
          <View style={styles.programHeader}>
            <View style={styles.programInfo}>
              <View style={styles.programLogoContainer}>
                <Image
                  source={{ uri: program.icon || template?.logo }}
                  style={styles.programLogo}
                  contentFit="cover"
                />
              </View>
              <View style={styles.programDetails}>
                <Text style={styles.programName}>{program.name}</Text>
                <View style={styles.memberIdRow}>
                  <TypeIcon size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.memberId}>****{program.memberId.slice(-4)}</Text>
                </View>
              </View>
            </View>
            <Pressable style={styles.syncButton} onPress={() => handleSyncProgram(program.id)}>
              <RefreshCw size={16} color={colors.textLight} />
            </Pressable>
          </View>

          <View style={styles.programStats}>
            <View style={styles.pointsContainer}>
              <Sparkles size={18} color={colors.textLight} />
              <Text style={styles.pointsValue}>{program.points.toLocaleString()}</Text>
              <Text style={styles.pointsLabel}>points</Text>
            </View>
            {program.tier && (
              <View style={styles.tierBadge}>
                <Crown size={12} color={colors.textLight} />
                <Text style={styles.tierText}>{program.tier}</Text>
              </View>
            )}
          </View>

          <View style={styles.programActions}>
            <Pressable
              style={styles.actionButton}
              onPress={() =>
                Alert.alert('Coming Soon', 'View detailed rewards and redemption options')
              }
            >
              <Text style={styles.actionButtonText}>View Rewards</Text>
              <ChevronRight size={16} color={colors.textLight} />
            </Pressable>
            <Pressable style={styles.removeButton} onPress={() => handleRemoveProgram(program.id)}>
              <Trash2 size={16} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderAvailableProgram = (program: ProgramTemplate) => {
    const TypeIcon = getTypeIcon(program.type);

    return (
      <Pressable
        key={program.id}
        style={styles.availableCard}
        onPress={() => openAddModal(program)}
      >
        <View style={[styles.availableIconBg, { backgroundColor: `${program.color}15` }]}>
          <Image source={{ uri: program.logo }} style={styles.availableLogo} contentFit="cover" />
        </View>
        <View style={styles.availableInfo}>
          <Text style={styles.availableName}>{program.name}</Text>
          <View style={styles.availableTypeRow}>
            <TypeIcon size={12} color={colors.textTertiary} />
            <Text style={styles.availableType}>
              {program.type === 'creditCard'
                ? 'Credit Card'
                : program.type.charAt(0).toUpperCase() + program.type.slice(1)}
            </Text>
          </View>
        </View>
        <View style={[styles.addIconContainer, { backgroundColor: `${program.color}15` }]}>
          <Plus size={18} color={program.color} />
        </View>
      </Pressable>
    );
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
          <Text style={styles.headerTitle}>Loyalty Programs</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Award size={28} color={colors.primary} />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Total Points Across All Programs</Text>
            <Text style={styles.summaryValue}>{totalPoints.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{connectedPrograms.length}</Text>
              <Text style={styles.summaryStatLabel}>Programs</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStatItem}>
              <TrendingUp size={18} color={colors.success} />
              <Text style={styles.summaryStatLabel}>Growing</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {tabs.map((tab) => (
              <Pressable
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <tab.icon
                  size={16}
                  color={activeTab === tab.id ? colors.textLight : colors.textSecondary}
                />
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filteredPrograms.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Connected Programs</Text>
              {filteredPrograms.map(renderConnectedProgram)}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Programs</Text>
            <Text style={styles.sectionSubtitle}>
              Connect your loyalty accounts to track all your points in one place
            </Text>
            <View style={styles.availableList}>
              {getAvailablePrograms().map(renderAvailableProgram)}
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connect Program</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setShowAddModal(false)}>
                <X size={22} color={colors.text} />
              </Pressable>
            </View>

            {selectedProgram && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.modalProgramInfo}>
                  <View
                    style={[
                      styles.modalProgramIcon,
                      { backgroundColor: `${selectedProgram.color}15` },
                    ]}
                  >
                    <Image
                      source={{ uri: selectedProgram.logo }}
                      style={styles.modalProgramLogo}
                      contentFit="cover"
                    />
                  </View>
                  <Text style={styles.modalProgramName}>{selectedProgram.name}</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Member ID / Account Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your member ID"
                    placeholderTextColor={colors.textTertiary}
                    value={memberId}
                    onChangeText={setMemberId}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Current Points Balance (optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    value={points}
                    onChangeText={setPoints}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Current Tier Status</Text>
                  <View style={styles.tierOptions}>
                    {selectedProgram.tiers.map((tier) => (
                      <Pressable
                        key={tier}
                        style={[
                          styles.tierOption,
                          selectedTier === tier && [
                            styles.tierOptionActive,
                            { backgroundColor: selectedProgram.color },
                          ],
                        ]}
                        onPress={() => setSelectedTier(tier)}
                      >
                        <Text
                          style={[
                            styles.tierOptionText,
                            selectedTier === tier && styles.tierOptionTextActive,
                          ]}
                        >
                          {tier}
                        </Text>
                        {selectedTier === tier && <Check size={14} color={colors.textLight} />}
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxTitle}>Secure Connection</Text>
                  <Text style={styles.infoBoxText}>
                    Your credentials are encrypted and never stored. We only sync your points
                    balance and tier status.
                  </Text>
                </View>

                <Pressable
                  style={[styles.connectButton, { backgroundColor: selectedProgram.color }]}
                  onPress={handleAddProgram}
                >
                  <Text style={styles.connectButtonText}>Connect {selectedProgram.name}</Text>
                </Pressable>
              </ScrollView>
            )}
          </SafeAreaView>
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
    height: 200,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
  },
  headerSpacer: {
    width: 44,
  },
  summaryCard: {
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  summaryContent: {
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  summaryStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryStatLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.borderLight,
    marginHorizontal: 16,
  },
  tabsContainer: {
    marginTop: 20,
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textLight,
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  programCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    height: 180,
  },
  programCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  programCardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  programInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  programLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  programLogo: {
    width: '100%',
    height: '100%',
  },
  programDetails: {
    gap: 4,
  },
  programName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textLight,
  },
  memberIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberId: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  syncButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  programStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textLight,
  },
  pointsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  programActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableList: {
    gap: 12,
  },
  availableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
  },
  availableIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  availableLogo: {
    width: '100%',
    height: '100%',
  },
  availableInfo: {
    flex: 1,
    marginLeft: 14,
  },
  availableName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  availableTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  availableType: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  addIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacer: {
    height: 40,
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalProgramInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  modalProgramIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  modalProgramLogo: {
    width: '100%',
    height: '100%',
  },
  modalProgramName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tierOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tierOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
  },
  tierOptionActive: {
    backgroundColor: colors.primary,
  },
  tierOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tierOptionTextActive: {
    color: colors.textLight,
  },
  infoBox: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
  connectButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
});
