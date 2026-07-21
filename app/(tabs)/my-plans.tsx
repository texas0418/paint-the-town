import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  CalendarHeart,
  MapPin,
  DollarSign,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { DatePlan } from '@/types/planner';
import { listPlans } from '@/services/datePlanService';

const getStatusColors = (colors: ThemeColors): Record<DatePlan['status'], string> => ({
  saved: colors.accentDark,
  scheduled: colors.warning,
  completed: colors.success,
  cancelled: colors.textTertiary,
});

// Shared between the My Plans tab (no back button) and the stack route
// pushed from the profile screen (with back button) — see app/plans.tsx.
export function PlansContent({ showBack }: { showBack?: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const statusColors = useMemo(() => getStatusColors(colors), [colors]);
  const router = useRouter();
  const [plans, setPlans] = useState<DatePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setPlans(await listPlans());
    } catch (e) {
      console.error('Failed to load plans:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const renderPlan = ({ item }: { item: DatePlan }) => (
    <Pressable
      style={styles.planCard}
      onPress={() => router.push({ pathname: '/saved-plan', params: { id: item.id } })}
    >
      <View style={[styles.statusDot, { backgroundColor: statusColors[item.status] }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.planTitle}>{item.title}</Text>
        {!!item.vibe && <Text style={styles.planVibe}>{item.vibe}</Text>}
        <View style={styles.planMeta}>
          <View style={styles.metaItem}>
            <MapPin size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.city}</Text>
          </View>
          {!!item.planDate && <Text style={styles.metaText}>{item.planDate}</Text>}
          <View style={styles.metaItem}>
            <DollarSign size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>~${Math.round(item.estimatedCost ?? 0)}</Text>
          </View>
          <Text style={styles.metaText}>{item.stops.length} stops</Text>
        </View>
      </View>
      <ChevronRight size={18} color={colors.textTertiary} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.gradient.primary} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            {showBack && (
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                <ArrowLeft size={24} color={colors.textLight} />
              </Pressable>
            )}
            <Text style={styles.headerTitle}>My Plans</Text>
            <Text style={styles.headerSubtitle}>Your saved dates and outings</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(p) => p.id}
          renderItem={renderPlan}
          contentContainerStyle={plans.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <CalendarHeart size={48} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No plans yet</Text>
              <Text style={styles.emptyText}>
                Tell us what you love and we'll plan your next great date.
              </Text>
              <Pressable style={styles.emptyButton} onPress={() => router.push('/plan-date')}>
                <Sparkles size={18} color={colors.textLight} />
                <Text style={styles.emptyButtonText}>Plan it for me</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

export default function MyPlansScreen() {
  return <PlansContent />;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
    marginBottom: 2,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textLight,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textOnPrimary,
    marginTop: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  planVibe: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  planMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  emptyButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
});
