import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Crown, Check } from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { PlanQuota, getPlanQuota } from '@/services/datePlanService';

const tiers = [
  {
    name: 'Basic',
    price: '$9.99',
    period: '/ month · or $59.99/year',
    features: [
      '3 date plans per month',
      'Taste profile & taste memory',
      'Remix, swap & sharing',
      'Anniversary reminders & partner mode',
    ],
  },
  {
    name: 'Premium',
    price: '$19.99',
    period: '/ month · or $119.99/year',
    features: [
      '15 date plans per month (up to 5 a day)',
      'Multi-day vacation planning',
      'Everything in Basic',
    ],
  },
];

const tierLabels: Record<string, string> = {
  trial: 'Free trial',
  basic: 'Basic',
  premium: 'Premium',
};

export default function MembershipScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [quota, setQuota] = useState<PlanQuota | null>(null);

  useEffect(() => {
    getPlanQuota().then(setQuota).catch(() => {});
  }, []);

  const tierName = quota ? tierLabels[quota.tier] : '';

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.gradient.primary} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color={colors.textLight} />
            </Pressable>
            <Text style={styles.headerTitle}>Membership</Text>
            <View style={styles.backBtn} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.currentCard}>
          <Crown size={22} color={colors.secondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.currentTier}>{quota ? `${tierName} plan` : 'Loading…'}</Text>
            {quota && (
              <Text style={styles.currentUsage}>
                {quota.tier === 'trial'
                  ? quota.monthlyUsed >= 1
                    ? 'Your free trial date is used — pick a plan below'
                    : 'Your first date plan is on us'
                  : `${Math.max(0, quota.monthlyLimit - quota.monthlyUsed)} of ${quota.monthlyLimit} plans left this month`}
              </Text>
            )}
          </View>
        </View>

        {tiers.map((tier) => {
          const isCurrent = tier.name === tierName && !!quota;
          return (
            <View key={tier.name} style={[styles.tierCard, isCurrent && styles.tierCardCurrent]}>
              <View style={styles.tierHead}>
                <Text style={styles.tierName}>{tier.name}</Text>
                {isCurrent && <Text style={styles.currentBadge}>CURRENT</Text>}
              </View>
              <Text style={styles.tierPrice}>
                {tier.price}
                <Text style={styles.tierPeriod}> {tier.period}</Text>
              </Text>
              {tier.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Check size={15} color={colors.primaryLight} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          );
        })}

        <Text style={styles.note}>
          Your first date plan is free — no subscription needed. Subscriptions arrive with the
          App Store launch; during the beta, access is managed for you.
        </Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerGradient: { paddingBottom: 16 },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textLight },
    content: { padding: 20, paddingBottom: 40 },
    currentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      marginBottom: 22,
    },
    currentTier: { fontSize: 16, fontWeight: '800', color: colors.text },
    currentUsage: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    tierCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      marginBottom: 14,
    },
    tierCardCurrent: { borderColor: colors.secondary },
    tierHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    tierName: { fontSize: 16, fontWeight: '800', color: colors.text },
    currentBadge: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: colors.secondary,
    },
    tierPrice: { fontSize: 24, fontWeight: '800', color: colors.text, marginVertical: 8 },
    tierPeriod: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    featureText: { fontSize: 13.5, color: colors.textSecondary },
    note: {
      fontSize: 13,
      color: colors.textTertiary,
      lineHeight: 19,
      textAlign: 'center',
      marginTop: 10,
    },
  });
