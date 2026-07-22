// services/index.ts
// Barrel for auth services. Usage: import { signInWithEmail } from '@/services';
// (The old travel-era service re-exports were removed in the W4nder→Paint the
// Town cleanup; date-planning services are imported from their own modules.)

export {
  signUpWithEmail,
  signInWithEmail,
  signInWithApple,
  isAppleSignInAvailable,
  getCurrentUser,
  getSession,
  signOut,
  resetPassword,
  updatePassword,
  updateProfile,
  getProfile,
  onAuthStateChange,
} from './authService';
export type { AuthUser, AuthResult } from './authService';
