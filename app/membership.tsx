import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Crown, Check } from 'lucide-react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { PlanQuota, SubscriptionTier, getPlanQuota } from '@/services/datePlanService';
import { usePurchases } from '@/contexts/PurchasesContext';
import { PACKAGES, findPackage } from '@/lib/purchases';

const PRIVACY_URL = 'https://texas0418.github.io/paint-the-town/privacy.html';
// Apple's standard EULA (Terms of Use), matching the App Store Connect license agreement.
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

interface TierOption {
  packageId: string;
  label: string;
  fallbackPrice: string;
  fallbackPeriod: string;
  note?: string;
}

interface TierConfig {
  key: Exclude<SubscriptionTier, 'trial'>;
  name: string;
  features: string[];
  options: TierOption[];
}

const TIERS: TierConfig[] = [
  {
    key: 'basic',
    name: 'Basic',
    features: [
      '3 date plans per month',
      'Taste profile & taste memory',
      'Remix, swap & sharing',
      'Anniversary reminders & partner mode',
    ],
    options: [
      {
        packageId: PACKAGES.basicMonthly,
        label: 'Monthly',
        fallbackPrice: '$9.99',
        fallbackPeriod: '/mo',
      },
      {
        packageId: PACKAGES.basicAnnual,
        label: 'Annual',
        fallbackPrice: '$59.99',
        fallbackPeriod: '/yr',
        note: 'Save 50%',
      },
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    features: [
      '15 date plans per month (up to 5 a day)',
      'Multi-day vacation planning',
      'Everything in Basic',
    ],
    options: [
      {
        packageId: PACKAGES.premiumMonthly,
        label: 'Monthly',
        fallbackPrice: '$19.99',
        fallbackPeriod: '/mo',
      },
      {
        packageId: PACKAGES.premiumAnnual,
        label: 'Annual',
        fallbackPrice: '$119.99',
        fallbackPeriod: '/yr',
        note: 'Save 50%',
      },
    ],
  },
];

const tierLabels: Record<SubscriptionTier, string> = {
  trial: 'Free trial',
  basic: 'Basic',
  premium: 'Premium',
};

export default function MembershipScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { ready, offering, tier: entitlementTier, purchase, restore } = usePurchases();
  const [quota, setQuota] = useState<PlanQuota | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const refreshQuota = useCallback(() => {
    getPlanQuota()
      .then(setQuota)
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshQuota();
  }, [refreshQuota]);

  // The live entitlement wins; fall back to the server tier (set during beta or
  // by the RevenueCat webhook once it lands).
  const currentTier: SubscriptionTier =
    entitlementTier !== 'trial' ? entitlementTier : (quota?.tier ?? 'trial');

  const busy = purchasingId !== null || restoring;

  const onPurchase = useCallback(
    async (pkg: PurchasesPackage) => {
      setPurchasingId(pkg.identifier);
      const res = await purchase(pkg);
      setPurchasingId(null);
      if (res.ok) {
        refreshQuota();
        Alert.alert("You're all set", 'Your subscription is now active. Enjoy planning!');
      } else if (!res.cancelled) {
        Alert.alert('Purchase failed', res.error ?? 'Something went wrong. Please try again.');
      }
    },
    [purchase, refreshQuota]
  );

  const onRestore = useCallback(async () => {
    setRestoring(true);
    const res = await restore();
    setRestoring(false);
    if (!res.ok) {
      Alert.alert('Restore failed', res.error ?? 'Please try again.');
      return;
    }
    refreshQuota();
    Alert.alert(
      res.tier === 'trial' ? 'No purchases found' : 'Purchases restored',
      res.tier === 'trial'
        ? "We couldn't find an active subscription for this Apple ID."
        : `Your ${tierLabels[res.tier]} plan is active again.`
    );
  }, [restore, refreshQuota]);

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
            <Text style={styles.currentTier}>
              {quota ? `${tierLabels[currentTier]} plan` : 'Loading…'}
            </Text>
            {quota && (
              <Text style={styles.currentUsage}>
                {currentTier === 'trial'
                  ? quota.monthlyUsed >= 1
                    ? 'Your free trial date is used — pick a plan below'
                    : 'Your first date plan is on us'
                  : `${Math.max(0, quota.monthlyLimit - quota.monthlyUsed)} of ${quota.monthlyLimit} plans left this month`}
              </Text>
            )}
          </View>
        </View>

        {TIERS.map((tier) => {
          const isCurrent = tier.key === currentTier;
          return (
            <View key={tier.key} style={[styles.tierCard, isCurrent && styles.tierCardCurrent]}>
              <View style={styles.tierHead}>
                <Text style={styles.tierName}>{tier.name}</Text>
                {isCurrent && <Text style={styles.currentBadge}>CURRENT</Text>}
              </View>

              {tier.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Check size={15} color={colors.primaryLight} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}

              <View style={styles.optionRow}>
                {tier.options.map((opt) => {
                  const pkg = findPackage(offering?.availablePackages, opt.packageId);
                  const price = pkg?.product.priceString ?? opt.fallbackPrice;
                  const unavailable = !pkg;
                  const isThisPurchasing = purchasingId === pkg?.identifier;
                  return (
                    <Pressable
                      key={opt.packageId}
                      style={[
                        styles.optionBtn,
                        (unavailable || isCurrent) && styles.optionBtnDisabled,
                      ]}
                      disabled={unavailable || isCurrent || busy}
                      onPress={() => pkg && onPurchase(pkg)}
                    >
                      {isThisPurchasing ? (
                        <ActivityIndicator color={colors.textLight} />
                      ) : (
                        <>
                          <Text style={styles.optionLabel}>{opt.label}</Text>
                          <Text style={styles.optionPrice}>
                            {price}
                            <Text style={styles.optionPeriod}>{opt.fallbackPeriod}</Text>
                          </Text>
                          {opt.note && !unavailable && (
                            <Text style={styles.optionNote}>{opt.note}</Text>
                          )}
                          {unavailable && <Text style={styles.optionNote}>Coming soon</Text>}
                        </>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        <Pressable style={styles.restoreBtn} disabled={busy || !ready} onPress={onRestore}>
          {restoring ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </Pressable>

        <Text style={styles.note}>
          Your first date plan is free. Paid plans are auto-renewing subscriptions billed to your
          Apple ID. They renew automatically unless canceled at least 24 hours before the end of the
          current period — manage or cancel anytime in your App Store account settings.
        </Text>

        <View style={styles.legalRow}>
          <Text style={styles.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>
            Terms of Use
          </Text>
          <Text style={styles.legalDot}>·</Text>
          <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_URL)}>
            Privacy Policy
          </Text>
        </View>
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
    tierHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    tierName: { fontSize: 16, fontWeight: '800', color: colors.text },
    currentBadge: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: colors.secondary,
    },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    featureText: { fontSize: 13.5, color: colors.textSecondary },
    optionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    optionBtn: {
      flex: 1,
      minHeight: 76,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionBtnDisabled: { backgroundColor: colors.border },
    optionLabel: { fontSize: 12, fontWeight: '700', color: colors.textLight, letterSpacing: 0.4 },
    optionPrice: { fontSize: 18, fontWeight: '800', color: colors.textLight, marginTop: 2 },
    optionPeriod: { fontSize: 12, fontWeight: '600', color: colors.textLight },
    optionNote: { fontSize: 11, fontWeight: '700', color: colors.secondaryLight, marginTop: 3 },
    restoreBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      marginTop: 6,
      minHeight: 44,
    },
    restoreText: { fontSize: 14, fontWeight: '700', color: colors.primary },
    note: {
      fontSize: 12,
      color: colors.textTertiary,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: 6,
    },
    legalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
    },
    legalLink: { fontSize: 12, fontWeight: '600', color: colors.primary },
    legalDot: { fontSize: 12, color: colors.textTertiary },
  });
