// lib/review.ts
// One polite App Store review ask, at the earned-value moment — right after
// the user rates a date plan positively (4+ hearts) in the journal.
// Asks at most once ever (AsyncStorage flag; Apple further rate-limits on
// their side). Fail-open: if the native module is missing or throws, nothing
// happens.

import AsyncStorage from '@react-native-async-storage/async-storage';

const ASKED_KEY = 'w4nder_review_asked';

function getStoreReview(): any | null {
  // Do NOT rely on try/catch around require() for fail-open here: when a
  // module's factory throws (native half missing from the binary), Metro's
  // guardedLoadModule reports it as a FATAL error itself — the exception
  // never reaches this catch, and a release build aborts. Check the native
  // registry BEFORE requiring so the factory can't throw.
  const native = (globalThis as any).expo?.modules?.ExpoStoreReview;
  if (!native) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate lazy require gated on the native registry check above
    const mod = require('expo-store-review');
    return mod?.default ?? mod ?? null;
  } catch {
    return null;
  }
}

/** Request a review if never asked before. Safe to call often; fire-and-forget. */
export async function maybeAskForReview(): Promise<void> {
  try {
    if (await AsyncStorage.getItem(ASKED_KEY)) return;
    const SR = getStoreReview();
    if (!SR) return;
    await AsyncStorage.setItem(ASKED_KEY, String(Date.now()));
    // isAvailableAsync + requestReview both resolve quietly; the OS decides
    // whether anything is actually shown.
    const ok = await SR.isAvailableAsync?.();
    if (ok) await SR.requestReview?.();
  } catch {
    /* fail open */
  }
}
