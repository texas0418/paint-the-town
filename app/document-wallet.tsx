/* eslint-disable max-lines -- tracked in #1 */
import { useState, useCallback, useMemo } from 'react';
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
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Plus,
  Search,
  FileText,
  Plane,
  Shield,
  Syringe,
  CreditCard,
  Globe,
  Car,
  MoreHorizontal,
  Star,
  Calendar,
  AlertTriangle,
  X,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Copy,
  Check,
  Filter,
  SortAsc,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { TravelDocument } from '@/types';
import React from 'react';

const { width } = Dimensions.get('window');

type DocumentType = TravelDocument['type'];

interface DocumentCategory {
  id: DocumentType;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const documentCategories: DocumentCategory[] = [
  {
    id: 'passport',
    name: 'Passport',
    icon: <Globe size={20} color="#1B4965" />,
    color: '#1B4965',
    bgColor: '#E8F4F8',
  },
  {
    id: 'visa',
    name: 'Visa',
    icon: <FileText size={20} color="#6B21A8" />,
    color: '#6B21A8',
    bgColor: '#F3E8FF',
  },
  {
    id: 'insurance',
    name: 'Insurance',
    icon: <Shield size={20} color="#059669" />,
    color: '#059669',
    bgColor: '#D1FAE5',
  },
  {
    id: 'boarding_pass',
    name: 'Boarding Pass',
    icon: <Plane size={20} color="#EA580C" />,
    color: '#EA580C',
    bgColor: '#FFEDD5',
  },
  {
    id: 'vaccination',
    name: 'Vaccination',
    icon: <Syringe size={20} color="#DC2626" />,
    color: '#DC2626',
    bgColor: '#FEE2E2',
  },
  {
    id: 'drivers_license',
    name: "Driver's License",
    icon: <Car size={20} color="#0284C7" />,
    color: '#0284C7',
    bgColor: '#E0F2FE',
  },
  {
    id: 'id_card',
    name: 'ID Card',
    icon: <CreditCard size={20} color="#7C3AED" />,
    color: '#7C3AED',
    bgColor: '#EDE9FE',
  },
  {
    id: 'other',
    name: 'Other',
    icon: <MoreHorizontal size={20} color="#64748B" />,
    color: '#64748B',
    bgColor: '#F1F5F9',
  },
];

const mockDocuments: TravelDocument[] = [
  {
    id: '1',
    type: 'passport',
    name: 'US Passport',
    documentNumber: 'XX1234567',
    issuingCountry: 'United States',
    issueDate: '2020-03-15',
    expiryDate: '2030-03-14',
    isFavorite: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    type: 'visa',
    name: 'Japan Tourist Visa',
    documentNumber: 'JP-2024-001234',
    issuingCountry: 'Japan',
    issueDate: '2024-06-01',
    expiryDate: '2024-12-01',
    isFavorite: false,
    isExpiringSoon: true,
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
    notes: 'Single entry tourist visa',
  },
  {
    id: '3',
    type: 'insurance',
    name: 'World Nomads Travel Insurance',
    documentNumber: 'WN-2024-789456',
    issueDate: '2024-01-01',
    expiryDate: '2025-01-01',
    isFavorite: true,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
    notes: 'Comprehensive coverage including medical evacuation',
  },
  {
    id: '4',
    type: 'boarding_pass',
    name: 'Tokyo Flight - AA 123',
    documentNumber: 'CONF-ABC123',
    issueDate: '2024-12-20',
    isFavorite: false,
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    notes: 'Seat 24A, Window',
    tripId: 'trip-1',
  },
  {
    id: '5',
    type: 'vaccination',
    name: 'COVID-19 Vaccination',
    documentNumber: 'VAX-2023-001',
    issueDate: '2023-05-15',
    isFavorite: false,
    createdAt: '2023-05-15T10:00:00Z',
    updatedAt: '2023-05-15T10:00:00Z',
    notes: 'Pfizer-BioNTech - 2 doses + booster',
  },
  {
    id: '6',
    type: 'drivers_license',
    name: 'California Drivers License',
    documentNumber: 'D1234567',
    issuingCountry: 'United States',
    issueDate: '2022-06-01',
    expiryDate: '2027-06-01',
    isFavorite: false,
    createdAt: '2022-06-01T10:00:00Z',
    updatedAt: '2022-06-01T10:00:00Z',
  },
];

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function DocumentWalletScreen() {
  const router = useRouter();
  const [documents, setDocuments] = useState<TravelDocument[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentType | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<TravelDocument | null>(null);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'expiry'>('date');

  const [newDocument, setNewDocument] = useState<Partial<TravelDocument>>({
    type: 'passport',
    name: '',
    documentNumber: '',
    issuingCountry: '',
    issueDate: '',
    expiryDate: '',
    notes: '',
    isFavorite: false,
  });

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.documentNumber?.toLowerCase().includes(query) ||
          doc.issuingCountry?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((doc) => doc.type === selectedCategory);
    }

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'expiry') {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const favorites = filtered.filter((doc) => doc.isFavorite);
    const nonFavorites = filtered.filter((doc) => !doc.isFavorite);

    return [...favorites, ...nonFavorites];
  }, [documents, searchQuery, selectedCategory, sortBy]);

  const expiringDocuments = useMemo(() => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return documents.filter((doc) => {
      if (!doc.expiryDate) return false;
      const expiryDate = new Date(doc.expiryDate);
      return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
    });
  }, [documents]);

  const getDocumentCategory = (type: DocumentType) => {
    return documentCategories.find((cat) => cat.id === type) || documentCategories[7];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const maskDocumentNumber = (number: string) => {
    if (number.length <= 4) return number;
    return '•'.repeat(number.length - 4) + number.slice(-4);
  };

  const toggleSensitiveInfo = (docId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSensitiveInfo((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  const copyToClipboard = (text: string, field: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleFavorite = (docId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, isFavorite: !doc.isFavorite } : doc))
    );
  };

  const deleteDocument = (docId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
            setShowDetailModal(false);
            setSelectedDocument(null);
          },
        },
      ]
    );
  };

  const handleAddDocument = () => {
    if (!newDocument.name || !newDocument.type) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const document: TravelDocument = {
      id: Date.now().toString(),
      type: newDocument.type as DocumentType,
      name: newDocument.name,
      documentNumber: newDocument.documentNumber,
      issuingCountry: newDocument.issuingCountry,
      issueDate: newDocument.issueDate,
      expiryDate: newDocument.expiryDate,
      notes: newDocument.notes,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDocuments((prev) => [document, ...prev]);
    setShowAddModal(false);
    setNewDocument({
      type: 'passport',
      name: '',
      documentNumber: '',
      issuingCountry: '',
      issueDate: '',
      expiryDate: '',
      notes: '',
      isFavorite: false,
    });
  };

  const openDocumentDetail = (doc: TravelDocument) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDocument(doc);
    setShowDetailModal(true);
  };

  const renderDocumentCard = (doc: TravelDocument) => {
    const category = getDocumentCategory(doc.type);
    const daysUntilExpiry = doc.expiryDate ? getDaysUntilExpiry(doc.expiryDate) : null;
    const isExpiring = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

    return (
      <Pressable key={doc.id} style={styles.documentCard} onPress={() => openDocumentDetail(doc)}>
        <View style={[styles.documentIconContainer, { backgroundColor: category.bgColor }]}>
          {category.icon}
        </View>
        <View style={styles.documentInfo}>
          <View style={styles.documentHeader}>
            <Text style={styles.documentName} numberOfLines={1}>
              {doc.name}
            </Text>
            {doc.isFavorite && <Star size={14} color={colors.warning} fill={colors.warning} />}
          </View>
          <Text style={styles.documentType}>{category.name}</Text>
          {doc.documentNumber && (
            <View style={styles.documentNumberRow}>
              <Text style={styles.documentNumber}>
                {showSensitiveInfo[doc.id]
                  ? doc.documentNumber
                  : maskDocumentNumber(doc.documentNumber)}
              </Text>
              <Pressable onPress={() => toggleSensitiveInfo(doc.id)} hitSlop={8}>
                {showSensitiveInfo[doc.id] ? (
                  <EyeOff size={14} color={colors.textTertiary} />
                ) : (
                  <Eye size={14} color={colors.textTertiary} />
                )}
              </Pressable>
            </View>
          )}
        </View>
        <View style={styles.documentRight}>
          {isExpired ? (
            <View style={styles.expiredBadge}>
              <AlertTriangle size={12} color="#FFF" />
              <Text style={styles.expiredText}>Expired</Text>
            </View>
          ) : isExpiring ? (
            <View style={styles.expiringBadge}>
              <Clock size={12} color={colors.warning} />
              <Text style={styles.expiringText}>{daysUntilExpiry}d</Text>
            </View>
          ) : doc.expiryDate ? (
            <Text style={styles.expiryDateText}>Exp: {formatDate(doc.expiryDate)}</Text>
          ) : null}
          <ChevronRight size={18} color={colors.textTertiary} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.headerGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.textLight} />
            </Pressable>
            <Text style={styles.headerTitle}>Document Wallet</Text>
            <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Plus size={24} color={colors.textLight} />
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search documents..."
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
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {expiringDocuments.length > 0 && (
              <View style={styles.alertCard}>
                <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.alertGradient}>
                  <AlertTriangle size={24} color="#D97706" />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>Expiring Soon</Text>
                    <Text style={styles.alertText}>
                      {expiringDocuments.length} document{expiringDocuments.length > 1 ? 's' : ''}{' '}
                      expiring within 30 days
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#D97706" />
                </LinearGradient>
              </View>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              <Pressable
                style={[
                  styles.categoryChip,
                  selectedCategory === 'all' && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory('all')}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === 'all' && styles.categoryChipTextActive,
                  ]}
                >
                  All ({documents.length})
                </Text>
              </Pressable>
              {documentCategories.map((cat) => {
                const count = documents.filter((d) => d.type === cat.id).length;
                if (count === 0) return null;
                return (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === cat.id && styles.categoryChipActive,
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === cat.id && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.name} ({count})
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.sortRow}>
              <Text style={styles.resultsText}>
                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
              </Text>
              <Pressable
                style={styles.sortButton}
                onPress={() => {
                  const sortOptions: Array<'date' | 'name' | 'expiry'> = ['date', 'name', 'expiry'];
                  const currentIndex = sortOptions.indexOf(sortBy);
                  setSortBy(sortOptions[(currentIndex + 1) % sortOptions.length]);
                }}
              >
                <SortAsc size={16} color={colors.primary} />
                <Text style={styles.sortButtonText}>
                  {sortBy === 'date' ? 'Recent' : sortBy === 'name' ? 'Name' : 'Expiry'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.documentsList}>
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map(renderDocumentCard)
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <FileText size={48} color={colors.textTertiary} />
                  </View>
                  <Text style={styles.emptyTitle}>No Documents Found</Text>
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? 'Try adjusting your search or filters'
                      : 'Add your first travel document to get started'}
                  </Text>
                  {!searchQuery && (
                    <Pressable style={styles.emptyButton} onPress={() => setShowAddModal(true)}>
                      <Plus size={18} color={colors.textLight} />
                      <Text style={styles.emptyButtonText}>Add Document</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Document</Text>
            <Pressable onPress={() => setShowAddModal(false)}>
              <X size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Document Type *</Text>
            <View style={styles.typeGrid}>
              {documentCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.typeOption,
                    newDocument.type === cat.id && styles.typeOptionActive,
                  ]}
                  onPress={() => setNewDocument((prev) => ({ ...prev, type: cat.id }))}
                >
                  <View style={[styles.typeIconContainer, { backgroundColor: cat.bgColor }]}>
                    {cat.icon}
                  </View>
                  <Text
                    style={[
                      styles.typeOptionText,
                      newDocument.type === cat.id && styles.typeOptionTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>Document Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., US Passport"
              placeholderTextColor={colors.textTertiary}
              value={newDocument.name}
              onChangeText={(text) => setNewDocument((prev) => ({ ...prev, name: text }))}
            />

            <Text style={styles.inputLabel}>Document Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., XX1234567"
              placeholderTextColor={colors.textTertiary}
              value={newDocument.documentNumber}
              onChangeText={(text) => setNewDocument((prev) => ({ ...prev, documentNumber: text }))}
            />

            <Text style={styles.inputLabel}>Issuing Country</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., United States"
              placeholderTextColor={colors.textTertiary}
              value={newDocument.issuingCountry}
              onChangeText={(text) => setNewDocument((prev) => ({ ...prev, issuingCountry: text }))}
            />

            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.inputLabel}>Issue Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                  value={newDocument.issueDate}
                  onChangeText={(text) => setNewDocument((prev) => ({ ...prev, issueDate: text }))}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                  value={newDocument.expiryDate}
                  onChangeText={(text) => setNewDocument((prev) => ({ ...prev, expiryDate: text }))}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Add any additional notes..."
              placeholderTextColor={colors.textTertiary}
              value={newDocument.notes}
              onChangeText={(text) => setNewDocument((prev) => ({ ...prev, notes: text }))}
              multiline
              numberOfLines={4}
            />

            <Pressable style={styles.saveButton} onPress={handleAddDocument}>
              <Text style={styles.saveButtonText}>Save Document</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        {selectedDocument && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Document Details</Text>
              <Pressable onPress={() => setShowDetailModal(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailHeader}>
                <View
                  style={[
                    styles.detailIconContainer,
                    { backgroundColor: getDocumentCategory(selectedDocument.type).bgColor },
                  ]}
                >
                  {getDocumentCategory(selectedDocument.type).icon}
                </View>
                <View style={styles.detailHeaderInfo}>
                  <Text style={styles.detailName}>{selectedDocument.name}</Text>
                  <Text style={styles.detailType}>
                    {getDocumentCategory(selectedDocument.type).name}
                  </Text>
                </View>
                <Pressable
                  style={styles.favoriteButton}
                  onPress={() => toggleFavorite(selectedDocument.id)}
                >
                  <Star
                    size={24}
                    color={selectedDocument.isFavorite ? colors.warning : colors.textTertiary}
                    fill={selectedDocument.isFavorite ? colors.warning : 'transparent'}
                  />
                </Pressable>
              </View>

              {selectedDocument.documentNumber && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Document Number</Text>
                  <View style={styles.detailValueRow}>
                    <Text style={styles.detailValue}>
                      {showSensitiveInfo[selectedDocument.id]
                        ? selectedDocument.documentNumber
                        : maskDocumentNumber(selectedDocument.documentNumber)}
                    </Text>
                    <Pressable onPress={() => toggleSensitiveInfo(selectedDocument.id)}>
                      {showSensitiveInfo[selectedDocument.id] ? (
                        <EyeOff size={18} color={colors.textTertiary} />
                      ) : (
                        <Eye size={18} color={colors.textTertiary} />
                      )}
                    </Pressable>
                    <Pressable
                      onPress={() => copyToClipboard(selectedDocument.documentNumber!, 'number')}
                    >
                      {copiedField === 'number' ? (
                        <Check size={18} color={colors.success} />
                      ) : (
                        <Copy size={18} color={colors.textTertiary} />
                      )}
                    </Pressable>
                  </View>
                </View>
              )}

              {selectedDocument.issuingCountry && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Issuing Country</Text>
                  <Text style={styles.detailValue}>{selectedDocument.issuingCountry}</Text>
                </View>
              )}

              {selectedDocument.issueDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Issue Date</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedDocument.issueDate)}</Text>
                </View>
              )}

              {selectedDocument.expiryDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expiry Date</Text>
                  <View style={styles.expiryDetailRow}>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedDocument.expiryDate)}
                    </Text>
                    {getDaysUntilExpiry(selectedDocument.expiryDate) <= 30 && (
                      <View
                        style={[
                          styles.expiryBadge,
                          getDaysUntilExpiry(selectedDocument.expiryDate) <= 0
                            ? styles.expiredBadgeDetail
                            : styles.expiringBadgeDetail,
                        ]}
                      >
                        <Text
                          style={[
                            styles.expiryBadgeText,
                            getDaysUntilExpiry(selectedDocument.expiryDate) <= 0
                              ? styles.expiredBadgeTextDetail
                              : styles.expiringBadgeTextDetail,
                          ]}
                        >
                          {getDaysUntilExpiry(selectedDocument.expiryDate) <= 0
                            ? 'Expired'
                            : `${getDaysUntilExpiry(selectedDocument.expiryDate)} days left`}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {selectedDocument.notes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailNotes}>{selectedDocument.notes}</Text>
                </View>
              )}

              <View style={styles.detailActions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => deleteDocument(selectedDocument.id)}
                >
                  <Trash2 size={20} color={colors.error} />
                  <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textLight,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -10,
  },
  content: {
    padding: 20,
  },
  alertCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  alertGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  alertText: {
    fontSize: 13,
    color: '#B45309',
    marginTop: 2,
  },
  categoriesScroll: {
    paddingBottom: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.textLight,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.accent,
    borderRadius: 16,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  documentsList: {
    gap: 12,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  documentType: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  documentNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  documentNumber: {
    fontSize: 12,
    color: colors.textTertiary,
    fontFamily: 'monospace',
  },
  documentRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expiredText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  expiringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expiringText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },
  expiryDateText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeOption: {
    width: (width - 60) / 4,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  typeOptionText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  typeOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 20,
  },
  detailIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderInfo: {
    flex: 1,
  },
  detailName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  detailType: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  favoriteButton: {
    padding: 8,
  },
  detailRow: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 17,
    color: colors.text,
    fontWeight: '500',
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailNotes: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  expiryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expiryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expiringBadgeDetail: {
    backgroundColor: '#FEF3C7',
  },
  expiredBadgeDetail: {
    backgroundColor: '#FEE2E2',
  },
  expiryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expiringBadgeTextDetail: {
    color: '#B45309',
  },
  expiredBadgeTextDetail: {
    color: colors.error,
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
