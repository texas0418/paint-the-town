// app/destination/[id].tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Star,
  Calendar,
  DollarSign,
  Sun,
  Users,
  Clock,
  ChevronRight,
  Sparkles,
  Bookmark,
  Info,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import {
  getDestinationById,
  getActivitiesByDestination,
} from '@/services';
import { Destination, Activity } from '@/types';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = height * 0.45;

export default function DestinationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [destination, setDestination] = useState<Destination | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    
    try {
      const [destData, activitiesData] = await Promise.all([
        getDestinationById(id),
        getActivitiesByDestination(id).catch(() => []), // Activities might not exist yet
      ]);
      
      setDestination(destData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error fetching destination:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleShare = async () => {
    if (!destination) return;
    
    try {
      await Share.share({
        message: `Check out ${destination.name}, ${destination.country} on Paint the Town! ${destination.description}`,
        title: destination.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // TODO: Save to user's bucket list in Supabase
  };

  const handlePlanTrip = () => {
    router.push({
      pathname: '/plan-trip',
      params: { destinationId: id, destinationName: destination?.name },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!destination) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Destination not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: destination.image }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.7)']}
            locations={[0, 0.3, 1]}
            style={styles.heroGradient}
          />
          
          {/* Header Actions */}
          <SafeAreaView style={styles.headerActions} edges={['top']}>
            <Pressable style={styles.iconButton} onPress={() => router.back()}>
              <ArrowLeft size={22} color={colors.textLight} />
            </Pressable>
            <View style={styles.headerRight}>
              <Pressable style={styles.iconButton} onPress={handleSave}>
                <Heart
                  size={22}
                  color={colors.textLight}
                  fill={isSaved ? colors.secondary : 'transparent'}
                />
              </Pressable>
              <Pressable style={styles.iconButton} onPress={handleShare}>
                <Share2 size={22} color={colors.textLight} />
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <View style={styles.ratingBadge}>
              <Star size={14} color={colors.warning} fill={colors.warning} />
              <Text style={styles.ratingText}>{destination.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({destination.reviewCount} reviews)</Text>
            </View>
            <Text style={styles.destinationName}>{destination.name}</Text>
            <View style={styles.locationRow}>
              <MapPin size={16} color={colors.textLight} />
              <Text style={styles.locationText}>{destination.country}</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
                <DollarSign size={18} color={colors.success} />
              </View>
              <Text style={styles.statValue}>${destination.avgPrice}</Text>
              <Text style={styles.statLabel}>per day</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
                <Sun size={18} color={colors.warning} />
              </View>
              <Text style={styles.statValue}>{destination.bestSeason || 'Year-round'}</Text>
              <Text style={styles.statLabel}>best time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Users size={18} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{destination.reviewCount}+</Text>
              <Text style={styles.statLabel}>travelers</Text>
            </View>
          </View>

          {/* Tags */}
          {destination.tags && destination.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {destination.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{destination.description}</Text>
          </View>

          {/* AI Trip Planning Card */}
          <Pressable style={styles.aiCard} onPress={handlePlanTrip}>
            <LinearGradient
              colors={[colors.secondary, colors.secondaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiCardGradient}
            >
              <View style={styles.aiIconContainer}>
                <Sparkles size={24} color={colors.textLight} />
              </View>
              <View style={styles.aiTextContainer}>
                <Text style={styles.aiTitle}>Plan Your Trip</Text>
                <Text style={styles.aiSubtitle}>
                  Let AI create your perfect {destination.name} itinerary
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textLight} />
            </LinearGradient>
          </Pressable>

          {/* Things to Do */}
          {activities.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Things to Do</Text>
                <Pressable onPress={() => router.push(`/activities?destination=${id}`)}>
                  <Text style={styles.seeAll}>See all</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.activitiesScroll}
              >
                {activities.slice(0, 5).map((activity) => (
                  <Pressable
                    key={activity.id}
                    style={styles.activityCard}
                    onPress={() => router.push(`/activity/${activity.id}`)}
                  >
                    <Image
                      source={{ uri: activity.image }}
                      style={styles.activityImage}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={styles.activityGradient}
                    />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityName} numberOfLines={2}>
                        {activity.name}
                      </Text>
                      <View style={styles.activityMeta}>
                        <View style={styles.activityRating}>
                          <Star size={12} color={colors.warning} fill={colors.warning} />
                          <Text style={styles.activityRatingText}>
                            {activity.rating?.toFixed(1) || 'New'}
                          </Text>
                        </View>
                        <Text style={styles.activityPrice}>
                          ${activity.price}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Travel Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Travel Tips</Text>
            <View style={styles.tipsCard}>
              <View style={styles.tipItem}>
                <View style={[styles.tipIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <Calendar size={18} color={colors.primary} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>Best Time to Visit</Text>
                  <Text style={styles.tipText}>
                    {destination.bestSeason || 'Great to visit year-round'}
                  </Text>
                </View>
              </View>
              <View style={styles.tipDivider} />
              <View style={styles.tipItem}>
                <View style={[styles.tipIcon, { backgroundColor: `${colors.success}15` }]}>
                  <DollarSign size={18} color={colors.success} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>Budget</Text>
                  <Text style={styles.tipText}>
                    Average daily spend: ${destination.avgPrice} {destination.currency}
                  </Text>
                </View>
              </View>
              <View style={styles.tipDivider} />
              <View style={styles.tipItem}>
                <View style={[styles.tipIcon, { backgroundColor: `${colors.warning}15` }]}>
                  <Info size={18} color={colors.warning} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>Good to Know</Text>
                  <Text style={styles.tipText}>
                    {destination.tags?.includes('family-friendly')
                      ? 'Family-friendly destination with activities for all ages'
                      : 'Popular destination for travelers seeking unique experiences'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Spacer */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>From</Text>
          <Text style={styles.priceValue}>
            ${destination.avgPrice}
            <Text style={styles.priceUnit}>/day</Text>
          </Text>
        </View>
        <Pressable style={styles.ctaButton} onPress={handlePlanTrip}>
          <Text style={styles.ctaButtonText}>Plan Trip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: HEADER_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textLight,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.textLight,
    opacity: 0.8,
  },
  destinationName: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 16,
    color: colors.textLight,
    opacity: 0.9,
  },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.border,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  aiCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  aiCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  aiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textLight,
  },
  aiSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    opacity: 0.85,
    marginTop: 2,
  },
  activitiesScroll: {
    paddingRight: 20,
  },
  activityCard: {
    width: 160,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  activityImage: {
    width: '100%',
    height: '100%',
  },
  activityGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  activityContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 6,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  activityPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textLight,
  },
  tipsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tipDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
  },
});
