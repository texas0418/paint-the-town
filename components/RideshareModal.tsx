import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Car,
  MapPin,
  Navigation,
  ExternalLink,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import {
  RideshareProvider,
  openRideshareApp,
  formatLocationForRideshare,
  RIDESHARE_PROVIDERS,
} from '@/utils/rideshare';

export interface RideshareLocation {
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number };
}

interface RideshareModalProps {
  visible: boolean;
  onClose: () => void;
  pickupLocation?: RideshareLocation;
  dropoffLocation: RideshareLocation;
  activityName?: string;
}

export default function RideshareModal({
  visible,
  onClose,
  pickupLocation,
  dropoffLocation,
  activityName,
}: RideshareModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<RideshareProvider | null>(null);

  const handleBookRide = async (provider: RideshareProvider) => {
    setIsLoading(true);
    setSelectedProvider(provider);

    try {
      const pickup = pickupLocation
        ? formatLocationForRideshare(
            pickupLocation.name,
            pickupLocation.address,
            pickupLocation.coordinates
          )
        : undefined;

      const dropoff = formatLocationForRideshare(
        dropoffLocation.name,
        dropoffLocation.address,
        dropoffLocation.coordinates
      );

      await openRideshareApp({
        provider,
        pickup,
        dropoff,
      });

      onClose();
    } catch (error) {
      console.error('Error booking ride:', error);
    } finally {
      setIsLoading(false);
      setSelectedProvider(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.content}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Car size={24} color={colors.primary} />
            </View>
            <Text style={styles.title}>Book a Ride</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {activityName && (
            <Text style={styles.subtitle}>
              Get to {activityName}
            </Text>
          )}

          {/* Route Preview */}
          <View style={styles.routePreview}>
            <View style={styles.routePoint}>
              <View style={styles.routeDot}>
                <Navigation size={14} color={colors.success} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Pickup</Text>
                <Text style={styles.routeText} numberOfLines={1}>
                  {pickupLocation?.name || 'Current Location'}
                </Text>
                {pickupLocation?.address && (
                  <Text style={styles.routeAddress} numberOfLines={1}>
                    {pickupLocation.address}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routePoint}>
              <View style={[styles.routeDot, styles.routeDotDestination]}>
                <MapPin size={14} color={colors.secondary} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Dropoff</Text>
                <Text style={styles.routeText} numberOfLines={1}>
                  {dropoffLocation.name}
                </Text>
                {dropoffLocation.address && (
                  <Text style={styles.routeAddress} numberOfLines={1}>
                    {dropoffLocation.address}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Provider Selection */}
          <Text style={styles.sectionTitle}>Choose your ride</Text>
          
          <View style={styles.providers}>
            {(Object.keys(RIDESHARE_PROVIDERS) as RideshareProvider[]).map((provider) => {
              const info = RIDESHARE_PROVIDERS[provider];
              const isSelected = selectedProvider === provider;
              const isUber = provider === 'uber';

              return (
                <Pressable
                  key={provider}
                  style={[
                    styles.providerCard,
                    isUber ? styles.providerCardUber : styles.providerCardLyft,
                  ]}
                  onPress={() => handleBookRide(provider)}
                  disabled={isLoading}
                >
                  {isLoading && isSelected ? (
                    <ActivityIndicator color={colors.textLight} />
                  ) : (
                    <>
                      <View style={styles.providerLeft}>
                        <Text style={styles.providerIcon}>{info.icon}</Text>
                        <View>
                          <Text style={styles.providerName}>{info.name}</Text>
                          <Text style={styles.providerTagline}>
                            {isUber ? 'Request a ride' : 'Get a Lyft'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.providerRight}>
                        <ExternalLink size={18} color={colors.textLight} />
                      </View>
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.disclaimer}>
            You&apos;ll be redirected to the app to complete your booking
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 20,
    marginLeft: 56,
  },
  routePreview: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.success}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  routeDotDestination: {
    backgroundColor: `${colors.secondary}15`,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  routeAddress: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.border,
    marginLeft: 15,
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  providers: {
    gap: 12,
    marginBottom: 16,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    minHeight: 72,
  },
  providerCardUber: {
    backgroundColor: '#000000',
  },
  providerCardLyft: {
    backgroundColor: '#FF00BF',
  },
  providerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  providerIcon: {
    fontSize: 28,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textLight,
  },
  providerTagline: {
    fontSize: 13,
    color: colors.textLight,
    opacity: 0.8,
  },
  providerRight: {
    opacity: 0.8,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
