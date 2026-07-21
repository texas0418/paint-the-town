import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Download,
  Trash2,
  MapPin,
  Calendar,
  WifiOff,
  CheckCircle,
  HardDrive,
  RefreshCw,
  Map,
  FileText,
  Image as ImageIcon,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '@/contexts/AppContext';
import { Trip } from '@/types';
import colors from '@/constants/colors';

interface OfflineTrip {
  tripId: string;
  downloadedAt: string;
  size: number;
  includesMap: boolean;
  includesImages: boolean;
  lastUpdated: string;
}

interface DownloadProgress {
  tripId: string;
  progress: number;
  status: 'downloading' | 'completed' | 'failed';
}

const OFFLINE_STORAGE_KEY = 'w4nder_offline_trips';

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function OfflineModeScreen() {
  const router = useRouter();
  const { trips } = useApp();
  const [offlineTrips, setOfflineTrips] = useState<OfflineTrip[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [totalStorage, setTotalStorage] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'available' | 'downloaded'>('available');
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadOfflineTrips();
  }, []);

  const loadOfflineTrips = async () => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_STORAGE_KEY);
      if (stored) {
        const parsed: OfflineTrip[] = JSON.parse(stored);
        setOfflineTrips(parsed);
        const total = parsed.reduce((sum, t) => sum + t.size, 0);
        setTotalStorage(total);
      }
    } catch (error) {
      console.log('Error loading offline trips:', error);
    }
  };

  const saveOfflineTrips = async (trips: OfflineTrip[]) => {
    try {
      await AsyncStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(trips));
      setOfflineTrips(trips);
      const total = trips.reduce((sum, t) => sum + t.size, 0);
      setTotalStorage(total);
    } catch (error) {
      console.log('Error saving offline trips:', error);
    }
  };

  const simulateDownload = useCallback(
    (trip: Trip) => {
      const isAlreadyDownloaded = offlineTrips.some((t) => t.tripId === trip.id);
      if (isAlreadyDownloaded) {
        Alert.alert('Already Downloaded', 'This trip is already available offline.');
        return;
      }

      setDownloadProgress({ tripId: trip.id, progress: 0, status: 'downloading' });
      progressAnim.setValue(0);

      const estimatedSize = Math.floor(Math.random() * 30 + 20);
      let progress = 0;

      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          const newOfflineTrip: OfflineTrip = {
            tripId: trip.id,
            downloadedAt: new Date().toISOString(),
            size: estimatedSize,
            includesMap: true,
            includesImages: true,
            lastUpdated: new Date().toISOString(),
          };

          const updated = [...offlineTrips, newOfflineTrip];
          saveOfflineTrips(updated);

          setDownloadProgress({ tripId: trip.id, progress: 100, status: 'completed' });

          setTimeout(() => {
            setDownloadProgress(null);
          }, 1500);
        } else {
          setDownloadProgress((prev) => (prev ? { ...prev, progress } : null));
        }

        Animated.timing(progressAnim, {
          toValue: progress / 100,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }, 300);
    },
    [offlineTrips, progressAnim]
  );

  const deleteOfflineTrip = useCallback(
    (tripId: string) => {
      Alert.alert(
        'Delete Offline Data',
        'Are you sure you want to remove this trip from offline storage?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              const updated = offlineTrips.filter((t) => t.tripId !== tripId);
              saveOfflineTrips(updated);
            },
          },
        ]
      );
    },
    [offlineTrips]
  );

  const updateOfflineTrip = useCallback(
    (tripId: string) => {
      const trip = trips.find((t) => t.id === tripId);
      if (trip) {
        setDownloadProgress({ tripId, progress: 0, status: 'downloading' });
        progressAnim.setValue(0);

        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 20 + 10;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);

            const updated = offlineTrips.map((t) =>
              t.tripId === tripId ? { ...t, lastUpdated: new Date().toISOString() } : t
            );
            saveOfflineTrips(updated);

            setDownloadProgress({ tripId, progress: 100, status: 'completed' });
            setTimeout(() => setDownloadProgress(null), 1500);
          } else {
            setDownloadProgress((prev) => (prev ? { ...prev, progress } : null));
          }

          Animated.timing(progressAnim, {
            toValue: progress / 100,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }, 200);
      }
    },
    [trips, offlineTrips, progressAnim]
  );

  const formatSize = (mb: number) => {
    if (mb < 1) return `${Math.round(mb * 1024)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const availableTrips = trips.filter(
    (t) =>
      !offlineTrips.some((o) => o.tripId === t.id) &&
      (t.status === 'upcoming' || t.status === 'planning')
  );

  const downloadedTripDetails = offlineTrips
    .map((offline) => {
      const trip = trips.find((t) => t.id === offline.tripId);
      return { offline, trip };
    })
    .filter((item) => item.trip);

  // eslint-disable-next-line complexity -- tracked in #1
  const renderTripCard = (trip: Trip, isDownloaded: boolean, offlineData?: OfflineTrip) => {
    const isDownloading =
      downloadProgress?.tripId === trip.id && downloadProgress.status === 'downloading';
    const justCompleted =
      downloadProgress?.tripId === trip.id && downloadProgress.status === 'completed';

    return (
      <View key={trip.id} style={styles.tripCard}>
        <Image source={{ uri: trip.coverImage }} style={styles.tripImage} />
        <View style={styles.tripContent}>
          <View style={styles.tripHeader}>
            <Text style={styles.tripName} numberOfLines={1}>
              {trip.destination.name}
            </Text>
            {isDownloaded && (
              <View style={styles.downloadedBadge}>
                <CheckCircle size={12} color={colors.success} />
                <Text style={styles.downloadedText}>Offline</Text>
              </View>
            )}
          </View>

          <View style={styles.tripMeta}>
            <MapPin size={12} color={colors.textSecondary} />
            <Text style={styles.tripMetaText}>{trip.destination.country}</Text>
            <Calendar size={12} color={colors.textSecondary} style={{ marginLeft: 12 }} />
            <Text style={styles.tripMetaText}>
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </Text>
          </View>

          {isDownloaded && offlineData && (
            <View style={styles.offlineInfo}>
              <View style={styles.offlineInfoRow}>
                <HardDrive size={12} color={colors.textSecondary} />
                <Text style={styles.offlineInfoText}>{formatSize(offlineData.size)}</Text>
                <Clock size={12} color={colors.textSecondary} style={{ marginLeft: 12 }} />
                <Text style={styles.offlineInfoText}>
                  Updated {formatDate(offlineData.lastUpdated)}
                </Text>
              </View>
              <View style={styles.offlineFeatures}>
                {offlineData.includesMap && (
                  <View style={styles.featurePill}>
                    <Map size={10} color={colors.primary} />
                    <Text style={styles.featurePillText}>Maps</Text>
                  </View>
                )}
                {offlineData.includesImages && (
                  <View style={styles.featurePill}>
                    <ImageIcon size={10} color={colors.primary} />
                    <Text style={styles.featurePillText}>Images</Text>
                  </View>
                )}
                <View style={styles.featurePill}>
                  <FileText size={10} color={colors.primary} />
                  <Text style={styles.featurePillText}>Itinerary</Text>
                </View>
              </View>
            </View>
          )}

          {(isDownloading || justCompleted) && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: justCompleted ? colors.success : colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {justCompleted ? 'Downloaded!' : `${Math.round(downloadProgress?.progress || 0)}%`}
              </Text>
            </View>
          )}

          <View style={styles.tripActions}>
            {isDownloaded ? (
              <>
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={() => updateOfflineTrip(trip.id)}
                  disabled={isDownloading}
                >
                  <RefreshCw size={16} color={colors.primary} />
                  <Text style={styles.updateButtonText}>Update</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteOfflineTrip(trip.id)}
                  disabled={isDownloading}
                >
                  <Trash2 size={16} color={colors.error} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.downloadButton, isDownloading && styles.downloadingButton]}
                onPress={() => simulateDownload(trip)}
                disabled={isDownloading}
              >
                <Download size={16} color="#fff" />
                <Text style={styles.downloadButtonText}>
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <WifiOff size={20} color={colors.primary} />
            <Text style={styles.headerTitle}>Offline Mode</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <HardDrive size={20} color={colors.primary} />
            <Text style={styles.storageTitle}>Offline Storage</Text>
          </View>
          <View style={styles.storageBar}>
            <View
              style={[
                styles.storageUsed,
                { width: `${Math.min((totalStorage / 500) * 100, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.storageText}>{formatSize(totalStorage)} used of 500 MB</Text>
          <Text style={styles.storageSubtext}>
            {offlineTrips.length} trip{offlineTrips.length !== 1 ? 's' : ''} saved for offline use
          </Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'available' && styles.activeTab]}
            onPress={() => setSelectedTab('available')}
          >
            <Text style={[styles.tabText, selectedTab === 'available' && styles.activeTabText]}>
              Available ({availableTrips.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'downloaded' && styles.activeTab]}
            onPress={() => setSelectedTab('downloaded')}
          >
            <Text style={[styles.tabText, selectedTab === 'downloaded' && styles.activeTabText]}>
              Downloaded ({offlineTrips.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {selectedTab === 'available' ? (
            availableTrips.length > 0 ? (
              availableTrips.map((trip) => renderTripCard(trip, false))
            ) : (
              <View style={styles.emptyState}>
                <Download size={48} color={colors.textSecondary} />
                <Text style={styles.emptyTitle}>No Trips Available</Text>
                <Text style={styles.emptyText}>
                  Plan a new trip to download it for offline access
                </Text>
              </View>
            )
          ) : downloadedTripDetails.length > 0 ? (
            downloadedTripDetails.map(({ offline, trip }) =>
              trip ? renderTripCard(trip, true, offline) : null
            )
          ) : (
            <View style={styles.emptyState}>
              <WifiOff size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Offline Trips</Text>
              <Text style={styles.emptyText}>Download trips to access them without internet</Text>
            </View>
          )}

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>What&apos;s included in offline mode?</Text>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <FileText size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoItemTitle}>Complete Itinerary</Text>
                <Text style={styles.infoItemText}>
                  All activities, times, locations, and booking details
                </Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Map size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoItemTitle}>Offline Maps</Text>
                <Text style={styles.infoItemText}>
                  Navigate to locations without internet connection
                </Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <ImageIcon size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoItemTitle}>Images & Media</Text>
                <Text style={styles.infoItemText}>All activity photos and destination images</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  storageCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  storageBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  storageUsed: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  storageText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  storageSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tripCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tripImage: {
    width: '100%',
    height: 140,
  },
  tripContent: {
    padding: 16,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tripName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  downloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  downloadedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  tripMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  offlineInfo: {
    marginBottom: 12,
  },
  offlineInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  offlineInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  offlineFeatures: {
    flexDirection: 'row',
    gap: 8,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featurePillText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.primary,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  tripActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  downloadingButton: {
    opacity: 0.7,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: 12,
    borderRadius: 10,
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  deleteButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  infoSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  infoItemText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
