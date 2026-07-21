/* eslint-disable max-lines -- tracked in #1 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  Camera,
  X,
  MapPin,
  Clock,
  Star,
  Ticket,
  Navigation,
  Volume2,
  VolumeX,
  Info,
  Compass,
  ScanLine,
  ChevronRight,
  Accessibility,
  History,
  Sparkles,
  Target,
  Layers,
  ChevronDown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { ARLandmark } from '@/types';
import { landmarks } from '@/mocks/landmarks';

const { width, height } = Dimensions.get('window');

type LandmarkType = ARLandmark['type'];

const LANDMARK_TYPE_ICONS: Record<LandmarkType, string> = {
  monument: '🏛️',
  museum: '🏛️',
  church: '⛪',
  palace: '🏰',
  bridge: '🌉',
  square: '🏛️',
  park: '🌳',
  tower: '🗼',
  statue: '🗽',
  theater: '🎭',
  fountain: '⛲',
  gate: '🚪',
};

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function ARCityGuideScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<ARLandmark | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [nearbyLandmarks, setNearbyLandmarks] = useState<ARLandmark[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [currentCity, setCurrentCity] = useState('Paris');
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedLandmark, setDetectedLandmark] = useState<ARLandmark | null>(null);

  const scanAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  const cities = ['Paris', 'Rome', 'London', 'Barcelona', 'Berlin', 'Athens', 'New York', 'Sydney'];

  useEffect(() => {
    const cityLandmarks = landmarks.filter((l) => l.city === currentCity);
    const landmarksWithDistance = cityLandmarks.map((l, index) => ({
      ...l,
      distance: 0.1 + index * 0.3,
      bearing: (index * 45) % 360,
    }));
    setNearbyLandmarks(landmarksWithDistance);
    console.log('Loaded landmarks for city:', currentCity, landmarksWithDistance.length);
  }, [currentCity]);

  useEffect(() => {
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnimation]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnimation]);

  const startScan = useCallback(() => {
    setIsScanning(true);
    setScanProgress(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(progressInterval);
        setIsScanning(false);
        if (nearbyLandmarks.length > 0) {
          const randomIndex = Math.floor(Math.random() * nearbyLandmarks.length);
          const detected = nearbyLandmarks[randomIndex];
          setDetectedLandmark(detected);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    }, 100);
  }, [nearbyLandmarks, scanAnimation]);

  const handleLandmarkPress = useCallback((landmark: ARLandmark) => {
    setSelectedLandmark(landmark);
    setDetailModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(!audioEnabled);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [audioEnabled]);

  const formatDistance = (distance?: number) => {
    if (!distance) return 'Unknown';
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)}km`;
  };

  // eslint-disable-next-line complexity -- tracked in #1
  const getDirectionText = (bearing?: number) => {
    if (bearing === undefined) return '';
    if (bearing >= 337.5 || bearing < 22.5) return 'N';
    if (bearing >= 22.5 && bearing < 67.5) return 'NE';
    if (bearing >= 67.5 && bearing < 112.5) return 'E';
    if (bearing >= 112.5 && bearing < 157.5) return 'SE';
    if (bearing >= 157.5 && bearing < 202.5) return 'S';
    if (bearing >= 202.5 && bearing < 247.5) return 'SW';
    if (bearing >= 247.5 && bearing < 292.5) return 'W';
    return 'NW';
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.permissionContent}>
          <View style={styles.permissionIconContainer}>
            <Camera size={64} color={colors.primary} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            AR City Guide needs camera access to identify landmarks around you and provide instant
            information.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <CameraView style={styles.camera} facing="back">
        <SafeAreaView style={styles.overlay} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.citySelector} onPress={() => setCityModalVisible(true)}>
              <MapPin size={16} color="#fff" />
              <Text style={styles.cityText}>{currentCity}</Text>
              <ChevronDown size={16} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton} onPress={toggleAudio}>
                {audioEnabled ? (
                  <Volume2 size={24} color="#fff" />
                ) : (
                  <VolumeX size={24} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowOverlay(!showOverlay)}
              >
                <Layers size={24} color={showOverlay ? colors.secondary : '#fff'} />
              </TouchableOpacity>
            </View>
          </View>

          {showOverlay && (
            <Animated.View style={[styles.landmarkOverlays, { opacity: fadeAnimation }]}>
              {nearbyLandmarks.slice(0, 5).map((landmark, index) => {
                const xPos = 20 + (index % 3) * 120;
                const yPos = 100 + Math.floor(index / 3) * 150 + (index % 2) * 50;
                return (
                  <TouchableOpacity
                    key={landmark.id}
                    style={[styles.landmarkMarker, { left: xPos, top: yPos }]}
                    onPress={() => handleLandmarkPress(landmark)}
                  >
                    <Animated.View
                      style={[styles.markerPulse, { transform: [{ scale: pulseAnimation }] }]}
                    />
                    <View style={styles.markerContent}>
                      <Text style={styles.markerEmoji}>{LANDMARK_TYPE_ICONS[landmark.type]}</Text>
                    </View>
                    <View style={styles.markerLabel}>
                      <Text style={styles.markerName} numberOfLines={1}>
                        {landmark.name}
                      </Text>
                      <Text style={styles.markerDistance}>
                        {formatDistance(landmark.distance)} • {getDirectionText(landmark.bearing)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          )}

          {isScanning && (
            <View style={styles.scanOverlay}>
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: scanAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, height - 200],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <View style={styles.scanCorners}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <View style={styles.scanProgressContainer}>
                <View style={[styles.scanProgressBar, { width: `${scanProgress}%` }]} />
              </View>
              <Text style={styles.scanText}>Scanning for landmarks...</Text>
            </View>
          )}

          {detectedLandmark && !isScanning && (
            <View style={styles.detectedOverlay}>
              <TouchableOpacity
                style={styles.detectedCard}
                onPress={() => handleLandmarkPress(detectedLandmark)}
              >
                <View style={styles.detectedBadge}>
                  <Sparkles size={14} color="#fff" />
                  <Text style={styles.detectedBadgeText}>Landmark Detected</Text>
                </View>
                <Image source={{ uri: detectedLandmark.image }} style={styles.detectedImage} />
                <View style={styles.detectedInfo}>
                  <Text style={styles.detectedName}>{detectedLandmark.name}</Text>
                  <Text style={styles.detectedDescription} numberOfLines={2}>
                    {detectedLandmark.shortDescription}
                  </Text>
                  <View style={styles.detectedMeta}>
                    <View style={styles.metaItem}>
                      <Star size={14} color={colors.warning} fill={colors.warning} />
                      <Text style={styles.metaText}>{detectedLandmark.rating}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MapPin size={14} color={colors.textSecondary} />
                      <Text style={styles.metaText}>
                        {formatDistance(detectedLandmark.distance)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.learnMoreButton}>
                    <Text style={styles.learnMoreText}>Learn More</Text>
                    <ChevronRight size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.dismissDetected}
                  onPress={() => setDetectedLandmark(null)}
                >
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>

        <SafeAreaView style={styles.bottomContainer} edges={['bottom']}>
          <View style={styles.nearbySection}>
            <Text style={styles.nearbyTitle}>Nearby Landmarks</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.nearbyScroll}
            >
              {nearbyLandmarks.map((landmark) => (
                <TouchableOpacity
                  key={landmark.id}
                  style={styles.nearbyCard}
                  onPress={() => handleLandmarkPress(landmark)}
                >
                  <Image source={{ uri: landmark.image }} style={styles.nearbyImage} />
                  <View style={styles.nearbyInfo}>
                    <Text style={styles.nearbyName} numberOfLines={1}>
                      {landmark.name}
                    </Text>
                    <View style={styles.nearbyMeta}>
                      <Navigation size={10} color={colors.textSecondary} />
                      <Text style={styles.nearbyDistance}>{formatDistance(landmark.distance)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton}>
              <Compass size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scanButton, isScanning && styles.scanButtonActive]}
              onPress={startScan}
              disabled={isScanning}
            >
              <View style={styles.scanButtonInner}>
                {isScanning ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <ScanLine size={28} color="#fff" />
                    <Text style={styles.scanButtonText}>Scan</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <Target size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>

      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        {selectedLandmark && (
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Image source={{ uri: selectedLandmark.image }} style={styles.modalImage} />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setDetailModalVisible(false)}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>

              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={styles.landmarkTypeBadge}>
                    <Text style={styles.landmarkTypeEmoji}>
                      {LANDMARK_TYPE_ICONS[selectedLandmark.type]}
                    </Text>
                    <Text style={styles.landmarkTypeText}>
                      {selectedLandmark.type.charAt(0).toUpperCase() +
                        selectedLandmark.type.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.modalTitle}>{selectedLandmark.name}</Text>
                  <View style={styles.modalLocation}>
                    <MapPin size={14} color={colors.textSecondary} />
                    <Text style={styles.modalLocationText}>
                      {selectedLandmark.city}, {selectedLandmark.country}
                    </Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Star size={18} color={colors.warning} fill={colors.warning} />
                    <Text style={styles.statValue}>{selectedLandmark.rating}</Text>
                    <Text style={styles.statLabel}>
                      ({selectedLandmark.reviewCount.toLocaleString()})
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Clock size={18} color={colors.primary} />
                    <Text style={styles.statValue}>{selectedLandmark.visitDuration}</Text>
                  </View>
                  {selectedLandmark.entryFee && (
                    <>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Ticket size={18} color={colors.success} />
                        <Text style={styles.statValue}>
                          {selectedLandmark.entryFee.currency} {selectedLandmark.entryFee.amount}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {audioEnabled && selectedLandmark.audioGuideAvailable && (
                  <TouchableOpacity style={styles.audioGuideButton}>
                    <Volume2 size={20} color="#fff" />
                    <Text style={styles.audioGuideText}>Play Audio Guide</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>About</Text>
                  <Text style={styles.descriptionText}>{selectedLandmark.description}</Text>
                </View>

                {selectedLandmark.yearBuilt && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <History size={16} color={colors.textSecondary} />
                      <Text style={styles.infoLabel}>Built</Text>
                      <Text style={styles.infoValue}>{selectedLandmark.yearBuilt}</Text>
                    </View>
                    {selectedLandmark.architect && (
                      <View style={styles.infoItem}>
                        <Info size={16} color={colors.textSecondary} />
                        <Text style={styles.infoLabel}>Architect</Text>
                        <Text style={styles.infoValue}>{selectedLandmark.architect}</Text>
                      </View>
                    )}
                  </View>
                )}

                {selectedLandmark.openingHours && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Opening Hours</Text>
                    <View style={styles.hoursContainer}>
                      <Clock size={16} color={colors.primary} />
                      <Text style={styles.hoursText}>{selectedLandmark.openingHours}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Interesting Facts</Text>
                  {selectedLandmark.facts.map((fact, index) => (
                    <View key={index} style={styles.factItem}>
                      <Sparkles size={14} color={colors.secondary} />
                      <Text style={styles.factText}>{fact}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Accessibility</Text>
                  <View style={styles.accessibilityGrid}>
                    <View
                      style={[
                        styles.accessibilityItem,
                        selectedLandmark.accessibility.wheelchairAccessible &&
                          styles.accessibilityItemActive,
                      ]}
                    >
                      <Accessibility
                        size={18}
                        color={
                          selectedLandmark.accessibility.wheelchairAccessible
                            ? colors.success
                            : colors.textTertiary
                        }
                      />
                      <Text
                        style={[
                          styles.accessibilityText,
                          selectedLandmark.accessibility.wheelchairAccessible &&
                            styles.accessibilityTextActive,
                        ]}
                      >
                        Wheelchair
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.accessibilityItem,
                        selectedLandmark.accessibility.audioDescription &&
                          styles.accessibilityItemActive,
                      ]}
                    >
                      <Volume2
                        size={18}
                        color={
                          selectedLandmark.accessibility.audioDescription
                            ? colors.success
                            : colors.textTertiary
                        }
                      />
                      <Text
                        style={[
                          styles.accessibilityText,
                          selectedLandmark.accessibility.audioDescription &&
                            styles.accessibilityTextActive,
                        ]}
                      >
                        Audio Guide
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.accessibilityItem,
                        selectedLandmark.accessibility.signLanguageTours &&
                          styles.accessibilityItemActive,
                      ]}
                    >
                      <Info
                        size={18}
                        color={
                          selectedLandmark.accessibility.signLanguageTours
                            ? colors.success
                            : colors.textTertiary
                        }
                      />
                      <Text
                        style={[
                          styles.accessibilityText,
                          selectedLandmark.accessibility.signLanguageTours &&
                            styles.accessibilityTextActive,
                        ]}
                      >
                        Sign Language
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.tagSection}>
                  {selectedLandmark.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.directionsButton}>
                  <Navigation size={20} color="#fff" />
                  <Text style={styles.directionsText}>Get Directions</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      <Modal
        visible={cityModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <SafeAreaView style={styles.cityModalContainer}>
          <View style={styles.cityModalHeader}>
            <Text style={styles.cityModalTitle}>Select City</Text>
            <TouchableOpacity onPress={() => setCityModalVisible(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.cityList}>
            {cities.map((city) => (
              <TouchableOpacity
                key={city}
                style={[styles.cityItem, city === currentCity && styles.cityItemActive]}
                onPress={() => {
                  setCurrentCity(city);
                  setCityModalVisible(false);
                  setDetectedLandmark(null);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <MapPin
                  size={20}
                  color={city === currentCity ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[styles.cityItemText, city === currentCity && styles.cityItemTextActive]}
                >
                  {city}
                </Text>
                {city === currentCity && (
                  <View style={styles.cityCheckmark}>
                    <Text style={styles.cityCheckmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  cityText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  landmarkOverlays: {
    flex: 1,
    position: 'relative',
  },
  landmarkMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(244, 132, 95, 0.3)',
    top: -10,
    left: -10,
  },
  markerContent: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  markerEmoji: {
    fontSize: 22,
  },
  markerLabel: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
    maxWidth: 120,
  },
  markerName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  markerDistance: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    position: 'absolute',
    left: 40,
    right: 40,
    height: 2,
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  scanCorners: {
    width: width - 80,
    height: height - 300,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.secondary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanProgressContainer: {
    position: 'absolute',
    bottom: 100,
    left: 40,
    right: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scanProgressBar: {
    height: '100%',
    backgroundColor: colors.secondary,
  },
  scanText: {
    position: 'absolute',
    bottom: 70,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detectedOverlay: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
  },
  detectedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  detectedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    zIndex: 10,
  },
  detectedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detectedImage: {
    width: '100%',
    height: 140,
  },
  detectedInfo: {
    padding: 16,
  },
  detectedName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  detectedDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  detectedMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  learnMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  dismissDetected: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  nearbySection: {
    marginBottom: 16,
  },
  nearbyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  nearbyScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  nearbyCard: {
    width: 100,
    marginRight: 12,
  },
  nearbyImage: {
    width: 100,
    height: 70,
    borderRadius: 12,
  },
  nearbyInfo: {
    marginTop: 6,
  },
  nearbyName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  nearbyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  nearbyDistance: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingBottom: 16,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  scanButtonActive: {
    backgroundColor: colors.secondary,
  },
  scanButtonInner: {
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalImage: {
    width: '100%',
    height: 280,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    marginBottom: 20,
  },
  landmarkTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  landmarkTypeEmoji: {
    fontSize: 16,
  },
  landmarkTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalLocationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  audioGuideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  audioGuideText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  infoItem: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    padding: 16,
    borderRadius: 12,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceSecondary,
    padding: 16,
    borderRadius: 12,
  },
  hoursText: {
    fontSize: 14,
    color: colors.text,
  },
  factItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  factText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  accessibilityGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  accessibilityItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    gap: 8,
  },
  accessibilityItemActive: {
    backgroundColor: colors.successLight + '20',
    borderWidth: 1,
    borderColor: colors.success,
  },
  accessibilityText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  accessibilityTextActive: {
    color: colors.success,
    fontWeight: '600',
  },
  tagSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 32,
  },
  directionsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cityModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cityModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cityModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  cityList: {
    flex: 1,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 12,
  },
  cityItemActive: {
    backgroundColor: colors.accent,
  },
  cityItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  cityItemTextActive: {
    fontWeight: '600',
    color: colors.primary,
  },
  cityCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityCheckmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
