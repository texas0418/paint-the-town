// app/(tabs)/(home)/index.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Sparkles,
  CalendarDays,
  SlidersHorizontal,
  CalendarHeart,
  MapPin,
  ChevronRight,
  Heart,
  Plane,
} from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { fonts } from '@/constants/typography';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { DatePlan } from '@/types/planner';
import { listPlans } from '@/services/datePlanService';

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { user: appUser } = useApp();
  const { user: authUser } = useAuth();
  const [recentPlans, setRecentPlans] = useState<DatePlan[]>([]);

  const displayName = authUser?.fullName || appUser.name || 'Traveler';
  const firstName = displayName.split(' ')[0];

  useFocusEffect(
    useCallback(() => {
      listPlans()
        .then((plans) => setRecentPlans(plans.slice(0, 3)))
        .catch((e) => console.error('Failed to load recent plans:', e));
    }, [])
  );

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={colors.gradient.primary} style={styles.headerGradient}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <Text style={styles.greeting}>
                {greeting()}, {firstName}
              </Text>
              <Text style={styles.tagline}>Bad at planning dates? That's our job.</Text>

              <Pressable
                style={styles.heroCard}
                onPress={() =>
                  router.push({ pathname: '/plan-date', params: { mode: 'plan_for_me' } })
                }
              >
                <LinearGradient
                  colors={[colors.secondary, colors.secondaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroIcon}>
                    <Sparkles size={26} color={colors.textLight} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroTitle}>Plan it for me</Text>
                    <Text style={styles.heroSubtitle}>
                      3 complete dates, real venues, your budget
                    </Text>
                  </View>
                  <ChevronRight size={22} color={colors.textLight} />
                </LinearGradient>
              </Pressable>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.quickActions}>
            <Pressable
              style={styles.actionCard}
              onPress={() => router.push({ pathname: '/plan-date', params: { mode: 'single' } })}
            >
              <View style={styles.actionIcon}>
                <CalendarDays size={22} color={colors.primary} />
              </View>
              <Text style={styles.actionTitle}>Plan a date</Text>
              <Text style={styles.actionDesc}>Around your notes</Text>
            </Pressable>
            <Pressable
              style={styles.actionCard}
              onPress={() => router.push({ pathname: '/plan-date', params: { mode: 'vacation' } })}
            >
              <View style={styles.actionIcon}>
                <Plane size={22} color={colors.primary} />
              </View>
              <Text style={styles.actionTitle}>Vacation</Text>
              <Text style={styles.actionDesc}>A trip anywhere</Text>
            </Pressable>
            <Pressable style={styles.actionCard} onPress={() => router.push('/taste-profile')}>
              <View style={styles.actionIcon}>
                <SlidersHorizontal size={22} color={colors.primary} />
              </View>
              <Text style={styles.actionTitle}>My taste</Text>
              <Text style={styles.actionDesc}>Food & vibes</Text>
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent plans</Text>
            {recentPlans.length > 0 && (
              <Pressable onPress={() => router.push('/(tabs)/my-plans')}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            )}
          </View>

          {recentPlans.length === 0 ? (
            <View style={styles.emptyCard}>
              <Heart size={28} color={colors.textTertiary} />
              <Text style={styles.emptyText}>
                No plans yet. Tap "Plan it for me" and pick from 3 ready-made dates.
              </Text>
            </View>
          ) : (
            recentPlans.map((plan) => (
              <Pressable
                key={plan.id}
                style={styles.planCard}
                onPress={() => router.push({ pathname: '/saved-plan', params: { id: plan.id } })}
              >
                <View style={styles.planIcon}>
                  <CalendarHeart size={20} color={colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <View style={styles.planMeta}>
                    <MapPin size={12} color={colors.textSecondary} />
                    <Text style={styles.planMetaText}>
                      {plan.city}
                      {plan.planDate ? ` · ${plan.planDate}` : ''} · {plan.stops.length} stops
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.textTertiary} />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerGradient: {
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 26,
    fontFamily: fonts.display,
    color: colors.textLight,
  },
  tagline: {
    fontSize: 15,
    color: colors.accent,
    marginTop: 4,
    marginBottom: 20,
  },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontFamily: fonts.display,
    color: colors.textLight,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    opacity: 0.9,
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  actionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.display,
    color: colors.text,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  planMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  planMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
