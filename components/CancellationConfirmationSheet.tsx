import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  AlertTriangle,
  Clock,
  DollarSign,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  HelpCircle,
  Mail,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { Booking } from '@/types';
import {
  CancellationPolicy,
  RefundEstimate,
  CancellationResult,
} from '@/hooks/useCancellationManagement';

// ============================================================================
// Types
// ============================================================================

interface CancellationConfirmationSheetProps {
  visible: boolean;
  onClose: () => void;
  booking: Booking;
  cancellationPolicy: CancellationPolicy;
  refundEstimate: RefundEstimate;
  timeUntilDeadline: string | null;
  onConfirmCancel: () => Promise<CancellationResult>;
  onContactSupport: () => void;
  isProcessing?: boolean;
  result?: CancellationResult | null;
}

// ============================================================================
// Component
// ============================================================================

// eslint-disable-next-line complexity -- tracked in #1
export default function CancellationConfirmationSheet({
  visible,
  onClose,
  booking,
  cancellationPolicy,
  refundEstimate,
  timeUntilDeadline,
  onConfirmCancel,
  onContactSupport,
  isProcessing = false,
  result,
}: CancellationConfirmationSheetProps) {
  // Get policy color
  const getPolicyColor = useCallback(() => {
    switch (cancellationPolicy.type) {
      case 'free':
        return colors.success;
      case 'partial':
        return colors.warning;
      case 'non_refundable':
        return colors.error;
    }
  }, [cancellationPolicy.type]);

  // Get policy icon
  const getPolicyIcon = useCallback(() => {
    switch (cancellationPolicy.type) {
      case 'free':
        return <CheckCircle size={24} color={colors.success} />;
      case 'partial':
        return <AlertTriangle size={24} color={colors.warning} />;
      case 'non_refundable':
        return <XCircle size={24} color={colors.error} />;
    }
  }, [cancellationPolicy.type]);

  // Render success state
  if (result?.success) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Booking Cancelled</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <CheckCircle size={64} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>Cancellation Confirmed</Text>
            <Text style={styles.successMessage}>{result.message}</Text>

            {result.cancellationId && (
              <View style={styles.cancellationIdBox}>
                <Text style={styles.cancellationIdLabel}>Cancellation Reference</Text>
                <Text style={styles.cancellationIdValue}>{result.cancellationId}</Text>
              </View>
            )}

            {result.refund && result.refund.refundAmount > 0 && (
              <View style={styles.refundSummaryCard}>
                <View style={styles.refundSummaryHeader}>
                  <DollarSign size={20} color={colors.success} />
                  <Text style={styles.refundSummaryTitle}>Refund Summary</Text>
                </View>
                <View style={styles.refundSummaryRow}>
                  <Text style={styles.refundSummaryLabel}>Refund Amount</Text>
                  <Text style={styles.refundSummaryValue}>
                    {result.refund.currency} {result.refund.refundAmount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.refundSummaryRow}>
                  <Text style={styles.refundSummaryLabel}>Refund Method</Text>
                  <Text style={styles.refundSummaryValue}>Original payment method</Text>
                </View>
                <View style={styles.refundSummaryRow}>
                  <Text style={styles.refundSummaryLabel}>Estimated Time</Text>
                  <Text style={styles.refundSummaryValue}>
                    {result.refund.estimatedDays}-{result.refund.estimatedDays + 2} business days
                  </Text>
                </View>
              </View>
            )}

            {result.confirmationEmail && (
              <View style={styles.emailNotice}>
                <Mail size={16} color={colors.textSecondary} />
                <Text style={styles.emailNoticeText}>
                  Confirmation sent to {result.confirmationEmail}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cancel Booking</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Booking Summary */}
          <View style={styles.bookingSummary}>
            <Text style={styles.bookingName}>{booking.name}</Text>
            <View style={styles.bookingMeta}>
              <Calendar size={14} color={colors.textSecondary} />
              <Text style={styles.bookingDate}>
                {new Date(booking.startDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Cancellation Policy Card */}
          <View style={[styles.policyCard, { borderColor: getPolicyColor() }]}>
            <View style={styles.policyHeader}>
              {getPolicyIcon()}
              <View style={styles.policyHeaderText}>
                <Text style={[styles.policyType, { color: getPolicyColor() }]}>
                  {cancellationPolicy.type === 'free'
                    ? 'Free Cancellation'
                    : cancellationPolicy.type === 'partial'
                    ? 'Partial Refund'
                    : 'Non-Refundable'}
                </Text>
                <Text style={styles.policyDescription}>
                  {cancellationPolicy.description}
                </Text>
              </View>
            </View>

            {timeUntilDeadline && cancellationPolicy.type === 'free' && (
              <View style={styles.deadlineBox}>
                <Clock size={16} color={colors.warning} />
                <Text style={styles.deadlineText}>{timeUntilDeadline}</Text>
              </View>
            )}
          </View>

          {/* Refund Breakdown */}
          <View style={styles.refundCard}>
            <Text style={styles.refundTitle}>Refund Breakdown</Text>
            
            {refundEstimate.breakdown.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.refundRow,
                  index === refundEstimate.breakdown.length - 1 && styles.refundRowTotal,
                ]}
              >
                <Text
                  style={[
                    styles.refundLabel,
                    index === refundEstimate.breakdown.length - 1 && styles.refundLabelTotal,
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.refundAmount,
                    item.type === 'debit' && styles.refundAmountDebit,
                    index === refundEstimate.breakdown.length - 1 && styles.refundAmountTotal,
                  ]}
                >
                  {item.type === 'debit' && item.amount < 0 ? '' : '+'}
                  {refundEstimate.currency} {Math.abs(item.amount).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* Refund Method */}
          <View style={styles.refundMethodCard}>
            <CreditCard size={20} color={colors.primary} />
            <View style={styles.refundMethodInfo}>
              <Text style={styles.refundMethodTitle}>Refund to Original Payment</Text>
              <Text style={styles.refundMethodDescription}>
                {refundEstimate.refundAmount > 0
                  ? `Estimated ${refundEstimate.estimatedDays}-${refundEstimate.estimatedDays + 2} business days`
                  : 'No refund applicable'}
              </Text>
            </View>
          </View>

          {/* Warning for non-refundable */}
          {cancellationPolicy.type === 'non_refundable' && (
            <View style={styles.warningCard}>
              <AlertTriangle size={20} color={colors.error} />
              <Text style={styles.warningText}>
                This booking is non-refundable. You will not receive any refund if you
                proceed with cancellation.
              </Text>
            </View>
          )}

          {/* Help Section */}
          <TouchableOpacity style={styles.helpCard} onPress={onContactSupport}>
            <HelpCircle size={20} color={colors.primary} />
            <View style={styles.helpInfo}>
              <Text style={styles.helpTitle}>Need Help?</Text>
              <Text style={styles.helpDescription}>
                Contact our support team for assistance
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.keepButton}
            onPress={onClose}
            disabled={isProcessing}
          >
            <Text style={styles.keepButtonText}>Keep Booking</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cancelButton,
              isProcessing && styles.cancelButtonProcessing,
            ]}
            onPress={onConfirmCancel}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.cancelButtonText}>
                {cancellationPolicy.type === 'non_refundable'
                  ? 'Cancel Anyway'
                  : 'Confirm Cancellation'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  bookingSummary: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bookingName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  policyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  policyHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  policyHeaderText: {
    flex: 1,
  },
  policyType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  policyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  deadlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deadlineText: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: '500',
  },
  refundCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  refundTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  refundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  refundRowTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
    paddingTop: 16,
  },
  refundLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  refundLabelTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  refundAmount: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
  refundAmountDebit: {
    color: colors.error,
  },
  refundAmountTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  refundMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  refundMethodInfo: {
    flex: 1,
  },
  refundMethodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  refundMethodDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.error + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  helpInfo: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  helpDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  keepButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  keepButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonProcessing: {
    opacity: 0.8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  cancellationIdBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  cancellationIdLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cancellationIdValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'monospace',
  },
  refundSummaryCard: {
    backgroundColor: colors.success + '10',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  refundSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  refundSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
  },
  refundSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  refundSummaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  refundSummaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  emailNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  emailNoticeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
