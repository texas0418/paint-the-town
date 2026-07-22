// contexts/PurchasesContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import { useAuth } from '@/contexts/AuthContext';
import {
  OFFERING_ID,
  configurePurchases,
  identifyPurchaser,
  purchasesReady,
  resetPurchaser,
  tierFromCustomerInfo,
} from '@/lib/purchases';
import type { SubscriptionTier } from '@/services/datePlanService';

export interface PurchaseResult {
  ok: boolean;
  cancelled?: boolean;
  error?: string;
}

interface PurchasesContextValue {
  /** SDK configured and usable (false on Android or when the key is missing). */
  ready: boolean;
  /** The `default` offering, or null while loading / unavailable. */
  offering: PurchasesOffering | null;
  /** Tier derived from the live RevenueCat entitlement (instant, client-side). */
  tier: SubscriptionTier;
  isLoading: boolean;
  purchase: (pkg: PurchasesPackage) => Promise<PurchaseResult>;
  restore: () => Promise<{ ok: boolean; tier: SubscriptionTier; error?: string }>;
  refresh: () => Promise<void>;
}

const PurchasesContext = createContext<PurchasesContextValue>({
  ready: false,
  offering: null,
  tier: 'trial',
  isLoading: true,
  purchase: async () => ({ ok: false, error: 'Purchases unavailable' }),
  restore: async () => ({ ok: false, tier: 'trial', error: 'Purchases unavailable' }),
  refresh: async () => {},
});

export const usePurchases = () => useContext(PurchasesContext);

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configure the SDK once at startup.
  useEffect(() => {
    configurePurchases();
    setReady(purchasesReady());
  }, []);

  const loadAll = useCallback(async () => {
    if (!purchasesReady()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [offerings, info] = await Promise.all([
        Purchases.getOfferings(),
        Purchases.getCustomerInfo(),
      ]);
      setOffering(offerings.all[OFFERING_ID] ?? offerings.current ?? null);
      setCustomerInfo(info);
    } catch (e) {
      if (__DEV__) console.warn('[purchases] load failed', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Identify the purchaser with the Supabase user id when auth changes, then
  // (re)load offerings + entitlements for that identity.
  useEffect(() => {
    if (!ready) return;
    let active = true;
    (async () => {
      if (user?.id) await identifyPurchaser(user.id);
      else await resetPurchaser();
      if (active) await loadAll();
    })();
    return () => {
      active = false;
    };
  }, [ready, user?.id, loadAll]);

  // Keep entitlement state fresh across renewals / external changes.
  useEffect(() => {
    if (!ready) return;
    const listener = (info: CustomerInfo) => setCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [ready]);

  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<PurchaseResult> => {
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(info);
      return { ok: true };
    } catch (e) {
      const err = e as { userCancelled?: boolean; message?: string };
      if (err?.userCancelled) return { ok: false, cancelled: true };
      return { ok: false, error: err?.message ?? 'Purchase failed' };
    }
  }, []);

  const restore = useCallback(async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return { ok: true, tier: tierFromCustomerInfo(info) };
    } catch (e) {
      const err = e as { message?: string };
      return {
        ok: false,
        tier: 'trial' as SubscriptionTier,
        error: err?.message ?? 'Restore failed',
      };
    }
  }, []);

  return (
    <PurchasesContext.Provider
      value={{
        ready,
        offering,
        tier: tierFromCustomerInfo(customerInfo),
        isLoading,
        purchase,
        restore,
        refresh: loadAll,
      }}
    >
      {children}
    </PurchasesContext.Provider>
  );
}
