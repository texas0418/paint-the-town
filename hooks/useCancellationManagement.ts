import { useState, useCallback, useMemo } from 'react';
import { Alert, Linking } from 'react-native';
import { Booking } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface CancellationPolicy {
  type: 'free' | 'partial' | 'non_refundable';
  description: string;
  deadline?: Date;
  refundPercentage?: number;
  penaltyAmount?: number;
  gracePeriod?: number; // hours after booking
}

export interface RefundEstimate {
  originalAmount: number;
  refundAmount: number;
  penaltyAmount: number;
  processingFee: number;
  currency: string;
  refundMethod: 'original_payment' | 'credit' | 'mixed';
  estimatedDays: number;
  breakdown: RefundBreakdownItem[];
}

interface RefundBreakdownItem {
  label: string;
  amount: number;
  type: 'credit' | 'debit';
}

export interface ModificationOptions {
  canChangeDate: boolean;
  canChangeTime: boolean;
  canChangePartySize: boolean;
  canChangeGuests: boolean;
  canUpgrade: boolean;
  modificationFee?: number;
  allowedDateRange?: { start: Date; end: Date };
  maxPartySize?: number;
}

export interface ModificationRequest {
  bookingId: string;
  newDate?: string;
  newTime?: string;
  newPartySize?: number;
  newGuests?: string[];
  upgradeOption?: string;
  notes?: string;
}

export interface CancellationResult {
  success: boolean;
  cancellationId?: string;
  refund?: RefundEstimate;
  message: string;
  confirmationEmail?: string;
}

export interface ModificationResult {
  success: boolean;
  updatedBooking?: Partial<Booking>;
  fee?: number;
  message: string;
}

// ============================================================================
// Cancellation Policy Helpers
// ============================================================================

function getCancellationPolicy(booking: Booking): CancellationPolicy {
  const now = new Date();
  const bookingDate = new Date(booking.startDate);
  const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Calculate deadline based on booking type
  let deadlineHours = 24; // default
  switch (booking.type) {
    case 'flight':
      deadlineHours = 24;
      break;
    case 'hotel':
      deadlineHours = 48;
      break;
    case 'restaurant':
      deadlineHours = 2;
      break;
    case 'activity':
      deadlineHours = 24;
      break;
    case 'transport':
      deadlineHours = 1;
      break;
    default:
      deadlineHours = 24;
  }

  const deadline = new Date(bookingDate.getTime() - deadlineHours * 60 * 60 * 1000);
  const isBeforeDeadline = now < deadline;
  const isWithinGracePeriod = booking.createdAt 
    ? (now.getTime() - new Date(booking.createdAt).getTime()) < 24 * 60 * 60 * 1000
    : false;

  // Determine policy type
  if (isWithinGracePeriod) {
    return {
      type: 'free',
      description: `Free cancellation within 24 hours of booking`,
      deadline,
      refundPercentage: 100,
      gracePeriod: 24,
    };
  }

  if (isBeforeDeadline) {
    return {
      type: 'free',
      description: `Free cancellation until ${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      deadline,
      refundPercentage: 100,
    };
  }

  if (hoursUntilBooking > 0) {
    return {
      type: 'partial',
      description: `Cancellation fee applies. ${Math.round(50)}% refund available.`,
      deadline,
      refundPercentage: 50,
      penaltyAmount: booking.price * 0.5,
    };
  }

  return {
    type: 'non_refundable',
    description: 'This booking is non-refundable.',
    deadline,
    refundPercentage: 0,
  };
}

function calculateRefundEstimate(booking: Booking, policy: CancellationPolicy): RefundEstimate {
  const refundPercentage = policy.refundPercentage || 0;
  const refundAmount = booking.price * (refundPercentage / 100);
  const penaltyAmount = booking.price - refundAmount;
  const processingFee = refundAmount > 0 ? Math.min(refundAmount * 0.02, 10) : 0;

  const breakdown: RefundBreakdownItem[] = [
    { label: 'Original booking amount', amount: booking.price, type: 'credit' },
  ];

  if (penaltyAmount > 0) {
    breakdown.push({ label: 'Cancellation penalty', amount: -penaltyAmount, type: 'debit' });
  }

  if (processingFee > 0) {
    breakdown.push({ label: 'Processing fee', amount: -processingFee, type: 'debit' });
  }

  breakdown.push({ label: 'Total refund', amount: refundAmount - processingFee, type: 'credit' });

  return {
    originalAmount: booking.price,
    refundAmount: refundAmount - processingFee,
    penaltyAmount,
    processingFee,
    currency: booking.currency || 'USD',
    refundMethod: 'original_payment',
    estimatedDays: policy.type === 'free' ? 3 : 7,
    breakdown,
  };
}

function getModificationOptions(booking: Booking): ModificationOptions {
  const now = new Date();
  const bookingDate = new Date(booking.startDate);
  const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Base options depend on time until booking
  const canModify = hoursUntilBooking > 2 && booking.status === 'confirmed';

  const baseOptions: ModificationOptions = {
    canChangeDate: canModify && hoursUntilBooking > 24,
    canChangeTime: canModify,
    canChangePartySize: canModify,
    canChangeGuests: canModify,
    canUpgrade: canModify && booking.type !== 'restaurant',
    modificationFee: hoursUntilBooking < 24 ? 15 : 0,
    allowedDateRange: {
      start: new Date(),
      end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    maxPartySize: 20,
  };

  // Customize based on booking type
  switch (booking.type) {
    case 'flight':
      return {
        ...baseOptions,
        canChangePartySize: false,
        canChangeGuests: hoursUntilBooking > 48,
        modificationFee: 75,
      };
    case 'hotel':
      return {
        ...baseOptions,
        canChangePartySize: true,
        modificationFee: hoursUntilBooking < 48 ? 25 : 0,
      };
    case 'restaurant':
      return {
        ...baseOptions,
        canUpgrade: false,
        modificationFee: 0,
        maxPartySize: 12,
      };
    default:
      return baseOptions;
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

interface UseCancellationManagementOptions {
  booking: Booking;
  onCancelComplete?: (result: CancellationResult) => void;
  onModifyComplete?: (result: ModificationResult) => void;
}

export function useCancellationManagement({
  booking,
  onCancelComplete,
  onModifyComplete,
}: UseCancellationManagementOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const cancellationPolicy = useMemo(() => getCancellationPolicy(booking), [booking]);
  const refundEstimate = useMemo(() => calculateRefundEstimate(booking, cancellationPolicy), [booking, cancellationPolicy]);
  const modificationOptions = useMemo(() => getModificationOptions(booking), [booking]);

  // Check if cancellation is allowed
  const canCancel = useMemo(() => {
    return booking.status === 'confirmed' || booking.status === 'pending';
  }, [booking.status]);

  // Check if modification is allowed
  const canModify = useMemo(() => {
    return booking.status === 'confirmed' && (
      modificationOptions.canChangeDate ||
      modificationOptions.canChangeTime ||
      modificationOptions.canChangePartySize
    );
  }, [booking.status, modificationOptions]);

  // Time until deadline
  const timeUntilDeadline = useMemo(() => {
    if (!cancellationPolicy.deadline) return null;
    
    const now = new Date();
    const diff = cancellationPolicy.deadline.getTime() - now.getTime();
    
    if (diff <= 0) return 'Deadline passed';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    }
    
    return `${hours}h ${minutes}m remaining`;
  }, [cancellationPolicy.deadline]);

  // Cancel booking
  const cancelBooking = useCallback(async (reason?: string): Promise<CancellationResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result: CancellationResult = {
        success: true,
        cancellationId: `CAN-${Date.now()}`,
        refund: refundEstimate,
        message: cancellationPolicy.type === 'free' 
          ? 'Your booking has been cancelled. Full refund will be processed within 3-5 business days.'
          : cancellationPolicy.type === 'partial'
          ? `Your booking has been cancelled. A refund of ${refundEstimate.currency} ${refundEstimate.refundAmount.toFixed(2)} will be processed within 5-7 business days.`
          : 'Your booking has been cancelled. No refund is available for this booking.',
        confirmationEmail: 'user@example.com',
      };

      onCancelComplete?.(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to cancel booking';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsProcessing(false);
    }
  }, [refundEstimate, cancellationPolicy, onCancelComplete]);

  // Modify booking
  const modifyBooking = useCallback(async (
    request: Omit<ModificationRequest, 'bookingId'>
  ): Promise<ModificationResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Validate modifications
      if (request.newDate && !modificationOptions.canChangeDate) {
        throw new Error('Date changes are not allowed for this booking');
      }
      if (request.newTime && !modificationOptions.canChangeTime) {
        throw new Error('Time changes are not allowed for this booking');
      }
      if (request.newPartySize && !modificationOptions.canChangePartySize) {
        throw new Error('Party size changes are not allowed for this booking');
      }
      if (request.newPartySize && modificationOptions.maxPartySize && 
          request.newPartySize > modificationOptions.maxPartySize) {
        throw new Error(`Maximum party size is ${modificationOptions.maxPartySize}`);
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result: ModificationResult = {
        success: true,
        updatedBooking: {
          startDate: request.newDate || booking.startDate,
          time: request.newTime || booking.time,
        },
        fee: modificationOptions.modificationFee,
        message: modificationOptions.modificationFee 
          ? `Booking modified successfully. A fee of ${booking.currency || 'USD'} ${modificationOptions.modificationFee.toFixed(2)} has been charged.`
          : 'Booking modified successfully.',
      };

      onModifyComplete?.(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to modify booking';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsProcessing(false);
    }
  }, [booking, modificationOptions, onModifyComplete]);

  // Confirm cancellation with alert
  const confirmCancellation = useCallback((onConfirm: () => void) => {
    const policyMessage = cancellationPolicy.type === 'free'
      ? 'You will receive a full refund.'
      : cancellationPolicy.type === 'partial'
      ? `A cancellation fee applies. You will receive ${refundEstimate.currency} ${refundEstimate.refundAmount.toFixed(2)}.`
      : 'This booking is non-refundable. No refund will be issued.';

    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel this booking?\n\n${policyMessage}`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: cancellationPolicy.type === 'non_refundable' ? 'Cancel Anyway' : 'Cancel Booking',
          style: 'destructive',
          onPress: onConfirm,
        },
      ]
    );
  }, [cancellationPolicy, refundEstimate]);

  // Contact support
  const contactSupport = useCallback(async () => {
    const supportEmail = `support@paintthetown.app?subject=Booking ${booking.confirmationCode || booking.id}&body=I need assistance with my booking.\n\nBooking: ${booking.name}\nConfirmation: ${booking.confirmationCode || 'N/A'}\nDate: ${booking.startDate}`;
    
    const emailUrl = `mailto:${supportEmail}`;
    const canOpen = await Linking.canOpenURL(emailUrl);
    
    if (canOpen) {
      await Linking.openURL(emailUrl);
    } else {
      Alert.alert('Support', 'Contact us at support@paintthetown.app');
    }
  }, [booking]);

  return {
    // State
    isProcessing,
    error,
    clearError: () => setError(null),

    // Computed
    cancellationPolicy,
    refundEstimate,
    modificationOptions,
    canCancel,
    canModify,
    timeUntilDeadline,

    // Actions
    cancelBooking,
    modifyBooking,
    confirmCancellation,
    contactSupport,
  };
}

export default useCancellationManagement;
