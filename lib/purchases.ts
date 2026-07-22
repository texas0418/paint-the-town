/**
 * RevenueCat (react-native-purchases) integration for Paint the Town.
 *
 * The RevenueCat dashboard is configured with:
 *   - one App Store app (bundle app.paintthetown.com)
 *   - entitlements `premium` and `basic`
 *   - a `default` offering with four packages (see PACKAGES below)
 *
 * The authoritative subscription tier lives in Supabase `profiles.subscription_tier`
 * and is written server-side by the `revenuecat-webhook` edge function — never by
 * the client (which would be spoofable). This module only drives the purchase UI and
 * mirrors the RevenueCat entitlement for instant feedback.
 */
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import type { SubscriptionTier } from '@/services/datePlanService';

/** Public SDK key — safe to ship in the binary (unlike the secret/`.p8`). */
const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';

/** RevenueCat entitlement identifiers (configured in the dashboard). */
export const ENTITLEMENTS = {
  premium: 'premium',
  basic: 'basic',
} as const;

/** The offering the paywall reads, and its four package identifiers. */
export const OFFERING_ID = 'default';
export const PACKAGES = {
  basicMonthly: 'basic_monthly',
  basicAnnual: 'basic_annual',
  premiumMonthly: 'premium_monthly',
  premiumAnnual: 'premium_annual',
} as const;

let configured = false;

/** Configure the SDK once. No-op on non-iOS or when the key is missing. */
export function configurePurchases(): void {
  if (configured || Platform.OS !== 'ios') return;
  if (!IOS_API_KEY) {
    if (__DEV__) {
      console.warn(
        '[purchases] EXPO_PUBLIC_REVENUECAT_IOS_KEY is not set — in-app purchases are disabled.'
      );
    }
    return;
  }
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: IOS_API_KEY });
  configured = true;
}

/** Whether the SDK is configured and usable on this platform/build. */
export function purchasesReady(): boolean {
  return configured;
}

/** Map RevenueCat entitlements to our server tier vocabulary. */
export function tierFromCustomerInfo(info: CustomerInfo | null): SubscriptionTier {
  const active = info?.entitlements.active ?? {};
  if (active[ENTITLEMENTS.premium]) return 'premium';
  if (active[ENTITLEMENTS.basic]) return 'basic';
  return 'trial';
}

/** Associate the RevenueCat customer with our Supabase user id. */
export async function identifyPurchaser(userId: string): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    if (__DEV__) console.warn('[purchases] logIn failed', e);
  }
}

/** Detach the RevenueCat customer on sign-out (back to an anonymous id). */
export async function resetPurchaser(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch {
    // logOut throws if already anonymous — safe to ignore.
  }
}

/** Find a package in a list by its RevenueCat identifier. */
export function findPackage(
  packages: PurchasesPackage[] | undefined,
  identifier: string
): PurchasesPackage | undefined {
  return packages?.find((p) => p.identifier === identifier);
}
