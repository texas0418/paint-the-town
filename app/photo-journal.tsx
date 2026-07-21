/* eslint-disable max-lines -- tracked in #1 */
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Plus,
  Camera,
  ImageIcon,
  MapPin,
  Calendar,
  Heart,
  Tag,
  X,
  Filter,
  Grid3X3,
  List,
  Map,
  CloudSun,
  Edit3,
  Trash2,
  ChevronDown,
  Search,
  Sparkles,
  BookOpen,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { PhotoJournalEntry } from '@/types';
import { useApp } from '@/contexts/AppContext';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 52) / 3;

const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'excited', emoji: '🤩', label: 'Excited' },
  { id: 'relaxed', emoji: '😌', label: 'Relaxed' },
  { id: 'adventurous', emoji: '🧗', label: 'Adventurous' },
  { id: 'romantic', emoji: '💕', label: 'Romantic' },
  { id: 'peaceful', emoji: '🧘', label: 'Peaceful' },
] as const;

const SAMPLE_ENTRIES: PhotoJournalEntry[] = [
  {
    id: '1',
    tripId: 'trip-1',
    tripName: 'Bali Adventure',
    imageUri: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    caption: 'Sunrise at Tegallalang Rice Terraces',
    note: 'Woke up at 4am to catch this magical sunrise. The mist rolling over the terraces was absolutely breathtaking. Met a local farmer who shared stories about traditional Balinese farming.',
    location: {
      name: 'Tegallalang, Bali',
      coordinates: { lat: -8.4325, lng: 115.2792 },
    },
    date: '2024-01-15',
    tags: ['sunrise', 'nature', 'rice terraces'],
    isFavorite: true,
    weather: 'Sunny, 24°C',
    mood: 'peaceful',
  },
  {
    id: '2',
    tripId: 'trip-1',
    tripName: 'Bali Adventure',
    imageUri: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800',
    caption: 'Temple ceremony at Tanah Lot',
    note: 'Witnessed an incredible traditional ceremony. The spiritual energy was palpable.',
    location: {
      name: 'Tanah Lot Temple, Bali',
      coordinates: { lat: -8.6213, lng: 115.0868 },
    },
    date: '2024-01-16',
    tags: ['temple', 'culture', 'ceremony'],
    isFavorite: false,
    mood: 'relaxed',
  },
  {
    id: '3',
    tripId: 'trip-2',
    tripName: 'Tokyo Nights',
    imageUri: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    caption: 'Shibuya Crossing at night',
    note: 'The organized chaos of Shibuya is something everyone should experience at least once.',
    location: {
      name: 'Shibuya, Tokyo',
      coordinates: { lat: 35.6595, lng: 139.7004 },
    },
    date: '2024-02-20',
    tags: ['city', 'nightlife', 'iconic'],
    isFavorite: true,
    mood: 'excited',
  },
  {
    id: '4',
    tripId: 'trip-2',
    tripName: 'Tokyo Nights',
    imageUri: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800',
    caption: 'Cherry blossoms in Ueno Park',
    note: 'Hanami season is pure magic. Locals picnicking under the sakura trees.',
    location: {
      name: 'Ueno Park, Tokyo',
      coordinates: { lat: 35.7148, lng: 139.7714 },
    },
    date: '2024-02-22',
    tags: ['cherry blossoms', 'spring', 'park'],
    isFavorite: true,
    mood: 'happy',
  },
  {
    id: '5',
    tripId: 'trip-3',
    tripName: 'Greek Islands',
    imageUri: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
    caption: 'Sunset in Santorini',
    note: 'No filter needed. This view from Oia is exactly as magical as everyone says.',
    location: {
      name: 'Oia, Santorini',
      coordinates: { lat: 36.4618, lng: 25.3753 },
    },
    date: '2024-03-10',
    tags: ['sunset', 'island', 'romantic'],
    isFavorite: true,
    weather: 'Clear, 22°C',
    mood: 'romantic',
  },
];

type ViewMode = 'timeline' | 'grid' | 'map';

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function PhotoJournalScreen() {
  const router = useRouter();
  const { trips } = useApp();
  const [entries, setEntries] = useState<PhotoJournalEntry[]>(SAMPLE_ENTRIES);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PhotoJournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [showTripFilter, setShowTripFilter] = useState(false);

  const [newEntry, setNewEntry] = useState<Partial<PhotoJournalEntry>>({
    caption: '',
    note: '',
    tags: [],
    isFavorite: false,
  });
  const [newTag, setNewTag] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const uniqueTrips = useMemo((): { id: string; name: string }[] => {
    const tripMap: Record<string, string> = {};
    entries.forEach((entry) => {
      if (entry.tripId && entry.tripName) {
        tripMap[entry.tripId] = entry.tripName;
      }
    });
    return Object.entries(tripMap).map(([id, name]) => ({ id, name }));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    let filtered = entries;

    if (selectedTrip) {
      filtered = filtered.filter((e) => e.tripId === selectedTrip);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.caption.toLowerCase().includes(query) ||
          e.note.toLowerCase().includes(query) ||
          e.location?.name.toLowerCase().includes(query) ||
          e.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, selectedTrip, searchQuery]);

  const stats = useMemo(
    () => ({
      totalPhotos: entries.length,
      totalLocations: new Set(entries.filter((e) => e.location).map((e) => e.location?.name)).size,
      tripsDocumented: uniqueTrips.length,
      favorites: entries.filter((e) => e.isFavorite).length,
    }),
    [entries, uniqueTrips]
  );

  const pickImage = async (useCamera: boolean) => {
    try {
      let result;

      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Camera access is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Photo library access is required.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setNewEntry((prev) => ({ ...prev, imageUri: result.assets[0].uri }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  const getCurrentLocation = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'Location services are not available on web.');
      return;
    }

    try {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed to geo-tag photos.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const locationName = address
        ? `${address.city || address.region}, ${address.country}`
        : 'Unknown location';

      setNewEntry((prev) => ({
        ...prev,
        location: {
          name: locationName,
          coordinates: {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          },
        },
      }));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Error getting location:', error);
      Alert.alert('Error', 'Could not get current location.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !newEntry.tags?.includes(newTag.trim())) {
      setNewEntry((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setNewEntry((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  };

  const saveEntry = () => {
    if (!newEntry.imageUri) {
      Alert.alert('Photo required', 'Please add a photo to your journal entry.');
      return;
    }

    const entry: PhotoJournalEntry = {
      id: Date.now().toString(),
      imageUri: newEntry.imageUri,
      caption: newEntry.caption || 'Untitled',
      note: newEntry.note || '',
      location: newEntry.location,
      date: new Date().toISOString().split('T')[0],
      tags: newEntry.tags || [],
      isFavorite: newEntry.isFavorite || false,
      mood: newEntry.mood,
      tripId: newEntry.tripId,
      tripName: newEntry.tripName,
    };

    setEntries((prev) => [entry, ...prev]);
    setShowAddModal(false);
    setNewEntry({ caption: '', note: '', tags: [], isFavorite: false });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleFavorite = (entryId: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, isFavorite: !e.isFavorite } : e))
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const deleteEntry = (entryId: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setEntries((prev) => prev.filter((e) => e.id !== entryId));
          setShowDetailModal(false);
          setSelectedEntry(null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getMoodEmoji = (mood?: string) => {
    return MOODS.find((m) => m.id === mood)?.emoji || '';
  };

  const openEntryDetail = (entry: PhotoJournalEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  const renderTimelineView = () => (
    <View style={styles.timelineContainer}>
      {filteredEntries.map((entry, index) => (
        <Pressable
          key={entry.id}
          style={styles.timelineCard}
          onPress={() => openEntryDetail(entry)}
        >
          <View style={styles.timelineLine}>
            <View style={styles.timelineDot} />
            {index < filteredEntries.length - 1 && <View style={styles.timelineConnector} />}
          </View>
          <View style={styles.timelineContent}>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineDate}>{formatDate(entry.date)}</Text>
              {entry.tripName && (
                <View style={styles.tripBadge}>
                  <Text style={styles.tripBadgeText}>{entry.tripName}</Text>
                </View>
              )}
            </View>
            <View style={styles.timelineImageContainer}>
              <Image
                source={{ uri: entry.imageUri }}
                style={styles.timelineImage}
                contentFit="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.timelineGradient}
              />
              <View style={styles.timelineImageOverlay}>
                <Text style={styles.timelineCaption} numberOfLines={2}>
                  {entry.caption}
                </Text>
                {entry.location && (
                  <View style={styles.timelineLocation}>
                    <MapPin size={12} color={colors.textLight} />
                    <Text style={styles.timelineLocationText}>{entry.location.name}</Text>
                  </View>
                )}
              </View>
              <Pressable
                style={styles.favoriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleFavorite(entry.id);
                }}
              >
                <Heart
                  size={20}
                  color={entry.isFavorite ? colors.secondary : colors.textLight}
                  fill={entry.isFavorite ? colors.secondary : 'transparent'}
                />
              </Pressable>
              {entry.mood && (
                <View style={styles.moodBadge}>
                  <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
                </View>
              )}
            </View>
            {entry.note && (
              <Text style={styles.timelineNote} numberOfLines={2}>
                {entry.note}
              </Text>
            )}
            {entry.tags.length > 0 && (
              <View style={styles.tagRow}>
                {entry.tags.slice(0, 3).map((tag) => (
                  <View key={tag} style={styles.smallTag}>
                    <Text style={styles.smallTagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );

  const renderGridView = () => (
    <View style={styles.gridContainer}>
      {filteredEntries.map((entry) => (
        <Pressable key={entry.id} style={styles.gridItem} onPress={() => openEntryDetail(entry)}>
          <Image source={{ uri: entry.imageUri }} style={styles.gridImage} contentFit="cover" />
          {entry.isFavorite && (
            <View style={styles.gridFavorite}>
              <Heart size={14} color={colors.secondary} fill={colors.secondary} />
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );

  const renderMapView = () => (
    <View style={styles.mapPlaceholder}>
      <Map size={48} color={colors.textTertiary} />
      <Text style={styles.mapPlaceholderTitle}>Map View</Text>
      <Text style={styles.mapPlaceholderText}>
        {filteredEntries.filter((e) => e.location?.coordinates).length} geo-tagged photos
      </Text>
      <View style={styles.mapLocations}>
        {filteredEntries
          .filter((e) => e.location)
          .slice(0, 5)
          .map((entry) => (
            <View key={entry.id} style={styles.mapLocationItem}>
              <MapPin size={14} color={colors.primary} />
              <Text style={styles.mapLocationText}>{entry.location?.name}</Text>
            </View>
          ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.headerGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.textLight} />
          </Pressable>
          <Text style={styles.headerTitle}>Photo Journal</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.blogExportButton} onPress={() => router.push('/blog-export')}>
              <BookOpen size={20} color={colors.textLight} />
            </Pressable>
            <Pressable style={styles.addHeaderButton} onPress={() => setShowAddModal(true)}>
              <Plus size={24} color={colors.textLight} />
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalPhotos}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalLocations}</Text>
              <Text style={styles.statLabel}>Locations</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.tripsDocumented}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.favorites}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.searchContainer}>
              <Search size={18} color={colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search photos, locations, tags..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.controls}>
              <Pressable
                style={styles.filterButton}
                onPress={() => setShowTripFilter(!showTripFilter)}
              >
                <Filter size={16} color={selectedTrip ? colors.primary : colors.textSecondary} />
                <Text
                  style={[styles.filterButtonText, selectedTrip && styles.filterButtonTextActive]}
                >
                  {selectedTrip
                    ? uniqueTrips.find((t) => t.id === selectedTrip)?.name
                    : 'All Trips'}
                </Text>
                <ChevronDown size={16} color={colors.textSecondary} />
              </Pressable>

              <View style={styles.viewModeButtons}>
                <Pressable
                  style={[
                    styles.viewModeButton,
                    viewMode === 'timeline' && styles.viewModeButtonActive,
                  ]}
                  onPress={() => setViewMode('timeline')}
                >
                  <List
                    size={18}
                    color={viewMode === 'timeline' ? colors.primary : colors.textTertiary}
                  />
                </Pressable>
                <Pressable
                  style={[
                    styles.viewModeButton,
                    viewMode === 'grid' && styles.viewModeButtonActive,
                  ]}
                  onPress={() => setViewMode('grid')}
                >
                  <Grid3X3
                    size={18}
                    color={viewMode === 'grid' ? colors.primary : colors.textTertiary}
                  />
                </Pressable>
                <Pressable
                  style={[styles.viewModeButton, viewMode === 'map' && styles.viewModeButtonActive]}
                  onPress={() => setViewMode('map')}
                >
                  <Map
                    size={18}
                    color={viewMode === 'map' ? colors.primary : colors.textTertiary}
                  />
                </Pressable>
              </View>
            </View>

            {showTripFilter && (
              <View style={styles.tripFilterDropdown}>
                <Pressable
                  style={[styles.tripFilterItem, !selectedTrip && styles.tripFilterItemActive]}
                  onPress={() => {
                    setSelectedTrip(null);
                    setShowTripFilter(false);
                  }}
                >
                  <Text
                    style={[styles.tripFilterText, !selectedTrip && styles.tripFilterTextActive]}
                  >
                    All Trips
                  </Text>
                </Pressable>
                {uniqueTrips.map((trip) => (
                  <Pressable
                    key={trip.id}
                    style={[
                      styles.tripFilterItem,
                      selectedTrip === trip.id && styles.tripFilterItemActive,
                    ]}
                    onPress={() => {
                      setSelectedTrip(trip.id);
                      setShowTripFilter(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.tripFilterText,
                        selectedTrip === trip.id && styles.tripFilterTextActive,
                      ]}
                    >
                      {trip.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {filteredEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Camera size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No photos yet</Text>
                <Text style={styles.emptyText}>
                  Start documenting your travels with photos and notes
                </Text>
                <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
                  <Plus size={20} color={colors.textLight} />
                  <Text style={styles.addButtonText}>Add First Photo</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {viewMode === 'timeline' && renderTimelineView()}
                {viewMode === 'grid' && renderGridView()}
                {viewMode === 'map' && renderMapView()}
              </>
            )}
          </View>
        </ScrollView>

        <Pressable style={styles.fab} onPress={() => setShowAddModal(true)}>
          <LinearGradient
            colors={[colors.secondary, colors.secondaryLight]}
            style={styles.fabGradient}
          >
            <Camera size={24} color={colors.textLight} />
          </LinearGradient>
        </Pressable>
      </SafeAreaView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowAddModal(false)}>
              <X size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.modalTitle}>New Entry</Text>
            <Pressable onPress={saveEntry}>
              <Text style={styles.saveButton}>Save</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {newEntry.imageUri ? (
              <View style={styles.previewContainer}>
                <Image
                  source={{ uri: newEntry.imageUri }}
                  style={styles.previewImage}
                  contentFit="cover"
                />
                <Pressable
                  style={styles.changePhotoButton}
                  onPress={() => setNewEntry((prev) => ({ ...prev, imageUri: undefined }))}
                >
                  <Edit3 size={16} color={colors.textLight} />
                  <Text style={styles.changePhotoText}>Change</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.photoOptions}>
                <Pressable style={styles.photoOption} onPress={() => pickImage(true)}>
                  <View style={styles.photoOptionIcon}>
                    <Camera size={28} color={colors.primary} />
                  </View>
                  <Text style={styles.photoOptionTitle}>Take Photo</Text>
                  <Text style={styles.photoOptionSubtitle}>Use camera</Text>
                </Pressable>
                <Pressable style={styles.photoOption} onPress={() => pickImage(false)}>
                  <View style={styles.photoOptionIcon}>
                    <ImageIcon size={28} color={colors.secondary} />
                  </View>
                  <Text style={styles.photoOptionTitle}>Choose Photo</Text>
                  <Text style={styles.photoOptionSubtitle}>From library</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Caption</Text>
              <TextInput
                style={styles.captionInput}
                placeholder="Give your photo a title..."
                placeholderTextColor={colors.textTertiary}
                value={newEntry.caption}
                onChangeText={(text) => setNewEntry((prev) => ({ ...prev, caption: text }))}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Write about this moment..."
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
                value={newEntry.note}
                onChangeText={(text) => setNewEntry((prev) => ({ ...prev, note: text }))}
              />
            </View>

            <View style={styles.formSection}>
              <View style={styles.formLabelRow}>
                <Text style={styles.formLabel}>Location</Text>
                <Pressable
                  style={styles.locationButton}
                  onPress={getCurrentLocation}
                  disabled={isLoadingLocation}
                >
                  <MapPin size={16} color={colors.primary} />
                  <Text style={styles.locationButtonText}>
                    {isLoadingLocation ? 'Getting...' : 'Current'}
                  </Text>
                </Pressable>
              </View>
              <TextInput
                style={styles.locationInput}
                placeholder="Where was this photo taken?"
                placeholderTextColor={colors.textTertiary}
                value={newEntry.location?.name || ''}
                onChangeText={(text) =>
                  setNewEntry((prev) => ({
                    ...prev,
                    location: { name: text, coordinates: prev.location?.coordinates },
                  }))
                }
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Mood</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.moodOptions}>
                  {MOODS.map((mood) => (
                    <Pressable
                      key={mood.id}
                      style={[
                        styles.moodOption,
                        newEntry.mood === mood.id && styles.moodOptionActive,
                      ]}
                      onPress={() =>
                        setNewEntry((prev) => ({
                          ...prev,
                          mood:
                            prev.mood === mood.id
                              ? undefined
                              : (mood.id as PhotoJournalEntry['mood']),
                        }))
                      }
                    >
                      <Text style={styles.moodOptionEmoji}>{mood.emoji}</Text>
                      <Text
                        style={[
                          styles.moodOptionLabel,
                          newEntry.mood === mood.id && styles.moodOptionLabelActive,
                        ]}
                      >
                        {mood.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Tags</Text>
              <View style={styles.tagInputRow}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="Add a tag..."
                  placeholderTextColor={colors.textTertiary}
                  value={newTag}
                  onChangeText={setNewTag}
                  onSubmitEditing={addTag}
                />
                <Pressable style={styles.addTagButton} onPress={addTag}>
                  <Plus size={18} color={colors.textLight} />
                </Pressable>
              </View>
              {(newEntry.tags?.length ?? 0) > 0 && (
                <View style={styles.tagsContainer}>
                  {newEntry.tags?.map((tag) => (
                    <View key={tag} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>#{tag}</Text>
                      <Pressable onPress={() => removeTag(tag)}>
                        <X size={14} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Link to Trip (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tripOptions}>
                  <Pressable
                    style={[styles.tripOption, !newEntry.tripId && styles.tripOptionActive]}
                    onPress={() =>
                      setNewEntry((prev) => ({ ...prev, tripId: undefined, tripName: undefined }))
                    }
                  >
                    <Text
                      style={[
                        styles.tripOptionText,
                        !newEntry.tripId && styles.tripOptionTextActive,
                      ]}
                    >
                      No Trip
                    </Text>
                  </Pressable>
                  {trips.map((trip) => (
                    <Pressable
                      key={trip.id}
                      style={[
                        styles.tripOption,
                        newEntry.tripId === trip.id && styles.tripOptionActive,
                      ]}
                      onPress={() =>
                        setNewEntry((prev) => ({
                          ...prev,
                          tripId: trip.id,
                          tripName: trip.destination.name,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.tripOptionText,
                          newEntry.tripId === trip.id && styles.tripOptionTextActive,
                        ]}
                      >
                        {trip.destination.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            <Pressable
              style={styles.favoriteToggle}
              onPress={() => setNewEntry((prev) => ({ ...prev, isFavorite: !prev.isFavorite }))}
            >
              <Heart
                size={20}
                color={newEntry.isFavorite ? colors.secondary : colors.textTertiary}
                fill={newEntry.isFavorite ? colors.secondary : 'transparent'}
              />
              <Text style={styles.favoriteToggleText}>Add to favorites</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showDetailModal} animationType="slide" presentationStyle="pageSheet">
        {selectedEntry && (
          <SafeAreaView style={styles.detailModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailImageContainer}>
                <Image
                  source={{ uri: selectedEntry.imageUri }}
                  style={styles.detailImage}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']}
                  style={styles.detailImageGradient}
                />
                <View style={styles.detailImageHeader}>
                  <Pressable
                    style={styles.detailCloseButton}
                    onPress={() => {
                      setShowDetailModal(false);
                      setSelectedEntry(null);
                    }}
                  >
                    <X size={24} color={colors.textLight} />
                  </Pressable>
                  <View style={styles.detailActions}>
                    <Pressable
                      style={styles.detailActionButton}
                      onPress={() => toggleFavorite(selectedEntry.id)}
                    >
                      <Heart
                        size={22}
                        color={selectedEntry.isFavorite ? colors.secondary : colors.textLight}
                        fill={selectedEntry.isFavorite ? colors.secondary : 'transparent'}
                      />
                    </Pressable>
                    <Pressable
                      style={styles.detailActionButton}
                      onPress={() => deleteEntry(selectedEntry.id)}
                    >
                      <Trash2 size={22} color={colors.textLight} />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.detailImageFooter}>
                  {selectedEntry.mood && (
                    <View style={styles.detailMoodBadge}>
                      <Text style={styles.detailMoodEmoji}>{getMoodEmoji(selectedEntry.mood)}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.detailContent}>
                <Text style={styles.detailCaption}>{selectedEntry.caption}</Text>

                <View style={styles.detailMeta}>
                  <View style={styles.detailMetaItem}>
                    <Calendar size={16} color={colors.textSecondary} />
                    <Text style={styles.detailMetaText}>{formatDate(selectedEntry.date)}</Text>
                  </View>
                  {selectedEntry.location && (
                    <View style={styles.detailMetaItem}>
                      <MapPin size={16} color={colors.textSecondary} />
                      <Text style={styles.detailMetaText}>{selectedEntry.location.name}</Text>
                    </View>
                  )}
                  {selectedEntry.weather && (
                    <View style={styles.detailMetaItem}>
                      <CloudSun size={16} color={colors.textSecondary} />
                      <Text style={styles.detailMetaText}>{selectedEntry.weather}</Text>
                    </View>
                  )}
                </View>

                {selectedEntry.tripName && (
                  <View style={styles.detailTripBadge}>
                    <Sparkles size={14} color={colors.primary} />
                    <Text style={styles.detailTripText}>{selectedEntry.tripName}</Text>
                  </View>
                )}

                {selectedEntry.note && (
                  <View style={styles.detailNoteContainer}>
                    <Text style={styles.detailNoteLabel}>Journal Entry</Text>
                    <Text style={styles.detailNote}>{selectedEntry.note}</Text>
                  </View>
                )}

                {selectedEntry.tags.length > 0 && (
                  <View style={styles.detailTags}>
                    {selectedEntry.tags.map((tag) => (
                      <View key={tag} style={styles.detailTag}>
                        <Tag size={12} color={colors.primary} />
                        <Text style={styles.detailTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
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
    height: 180,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textLight,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blogExportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textLight,
  },
  statLabel: {
    fontSize: 12,
    color: colors.accent,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    minHeight: 500,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: colors.text,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  viewModeButtons: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 8,
  },
  viewModeButtonActive: {
    backgroundColor: colors.accent,
  },
  tripFilterDropdown: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tripFilterItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tripFilterItemActive: {
    backgroundColor: colors.accent,
  },
  tripFilterText: {
    fontSize: 15,
    color: colors.text,
  },
  tripFilterTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 24,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  timelineContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  timelineCard: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLine: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  timelineDate: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tripBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tripBadgeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  timelineImageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    position: 'relative',
  },
  timelineImage: {
    width: '100%',
    height: '100%',
  },
  timelineGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  timelineImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  timelineCaption: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  timelineLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timelineLocationText: {
    fontSize: 12,
    color: colors.textLight,
    opacity: 0.9,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 16,
  },
  timelineNote: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  smallTag: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  smallTagText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 4,
    paddingBottom: 100,
  },
  gridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridFavorite: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholder: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  mapPlaceholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  mapPlaceholderText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
  },
  mapLocations: {
    marginTop: 24,
    width: '100%',
  },
  mapLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mapLocationText: {
    fontSize: 14,
    color: colors.text,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  photoOptions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  photoOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  photoOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  photoOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  photoOptionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  previewContainer: {
    position: 'relative',
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 220,
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  changePhotoText: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  formLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  captionInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  moodOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  moodOption: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    minWidth: 80,
  },
  moodOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  moodOptionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodOptionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  moodOptionLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tagInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addTagButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagChipText: {
    fontSize: 14,
    color: colors.primary,
  },
  tripOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  tripOption: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tripOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tripOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  tripOptionTextActive: {
    color: colors.textLight,
    fontWeight: '600',
  },
  favoriteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    marginTop: 10,
  },
  favoriteToggleText: {
    fontSize: 15,
    color: colors.text,
  },
  detailModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  detailImageContainer: {
    position: 'relative',
    height: 400,
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailImageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  detailImageHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: 8,
  },
  detailCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 10,
  },
  detailActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailImageFooter: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  detailMoodBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailMoodEmoji: {
    fontSize: 22,
  },
  detailContent: {
    padding: 20,
  },
  detailCaption: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  detailMeta: {
    gap: 10,
    marginBottom: 16,
  },
  detailMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailMetaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailTripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 20,
  },
  detailTripText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  detailNoteContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  detailNoteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  detailNote: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
  },
  detailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  detailTagText: {
    fontSize: 14,
    color: colors.text,
  },
});
