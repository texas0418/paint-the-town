// ============================================================================
// RSVP Status Card - Shows RSVP status on creator's itinerary view
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Mail,
  Check,
  X,
  HelpCircle,
  Clock,
  Send,
  Bell,
  ChevronRight,
  Calendar,
  Utensils,
  AlertCircle,
  MessageSquare,
  Heart,
  Copy,
  Share2,
  RefreshCw,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useRSVPCreator } from '@/hooks/useRSVP';
import {
  RSVP,
  RSVPInvite,
  getRSVPStatusColor,
  getRSVPStatusLabel,
  getRSVPStatusEmoji,
  EXCITEMENT_LABELS,
  DIETARY_OPTIONS,
} from '@/types/rsvp';

interface RSVPStatusCardProps {
  itineraryId: string;
  itinerary: any;
  creatorName: string;
  sharedItineraryId?: string;
  compact?: boolean;
}

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function RSVPStatusCard({
  itineraryId,
  itinerary,
  creatorName,
  sharedItineraryId,
  compact = false,
}: RSVPStatusCardProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [personalMessage, setPersonalMessage] = useState('');
  const [responseDeadlineDays, setResponseDeadlineDays] = useState(7);

  const {
    rsvp,
    isLoading,
    hasResponse,
    isAccepted,
    isDeclined,
    isTentative,
    isPending,
    isExpired,
    createRSVPInvite,
    sendRSVPInvite,
    copyInviteLink,
    sendReminder,
    cancelRSVP,
  } = useRSVPCreator({
    itineraryId,
    itinerary,
    creatorName,
    sharedItineraryId,
  });

  const handleCreateAndSend = async () => {
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + responseDeadlineDays);

    const invite = await createRSVPInvite({
      personalMessage: personalMessage || undefined,
      responseDeadline: deadlineDate.toISOString(),
      allowAlternativeDates: true,
      allowDietaryInfo: true,
      allowAccessibilityInfo: true,
    });

    setShowInviteModal(false);
    sendRSVPInvite(invite);
  };

  const statusColor = rsvp ? getRSVPStatusColor(rsvp.status) : colors.textTertiary;

  // ============================================================================
  // Compact Card (for dashboard)
  // ============================================================================

  if (compact) {
    if (!rsvp) {
      return (
        <Pressable 
          style={styles.compactCard}
          onPress={() => setShowInviteModal(true)}
        >
          <View style={styles.compactIcon}>
            <Mail size={18} color={colors.primary} />
          </View>
          <Text style={styles.compactText}>Request RSVP</Text>
          <ChevronRight size={16} color={colors.textTertiary} />
        </Pressable>
      );
    }

    return (
      <Pressable 
        style={styles.compactCard}
        onPress={() => setShowDetailsModal(true)}
      >
        <View style={[styles.compactIcon, { backgroundColor: statusColor + '20' }]}>
          {isAccepted && <Check size={18} color={statusColor} />}
          {isDeclined && <X size={18} color={statusColor} />}
          {isTentative && <HelpCircle size={18} color={statusColor} />}
          {isPending && <Clock size={18} color={statusColor} />}
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactLabel}>RSVP</Text>
          <Text style={[styles.compactStatus, { color: statusColor }]}>
            {getRSVPStatusLabel(rsvp.status)}
          </Text>
        </View>
        <ChevronRight size={16} color={colors.textTertiary} />
      </Pressable>
    );
  }

  // ============================================================================
  // Full Card
  // ============================================================================

  if (!rsvp) {
    return (
      <>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Mail size={20} color={colors.primary} />
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.cardTitle}>Request RSVP</Text>
              <Text style={styles.cardSubtitle}>
                Ask {itinerary?.partnerName || 'your partner'} to confirm
              </Text>
            </View>
          </View>

          <Pressable 
            style={styles.primaryBtn}
            onPress={() => setShowInviteModal(true)}
          >
            <Send size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Send RSVP Request</Text>
          </Pressable>
        </View>

        {/* Create Invite Modal */}
        <Modal
          visible={showInviteModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowInviteModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowInviteModal(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
              <Text style={styles.modalTitle}>Send RSVP Request</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Personal Message */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Personal Message (optional)</Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Add a sweet note to your invitation..."
                  placeholderTextColor={colors.textTertiary}
                  value={personalMessage}
                  onChangeText={setPersonalMessage}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Response Deadline */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Response deadline</Text>
                <View style={styles.deadlineOptions}>
                  {[
                    { days: 1, label: '1 day' },
                    { days: 3, label: '3 days' },
                    { days: 7, label: '1 week' },
                    { days: 14, label: '2 weeks' },
                  ].map((option) => (
                    <Pressable
                      key={option.days}
                      style={[
                        styles.deadlineOption,
                        responseDeadlineDays === option.days && styles.deadlineOptionSelected,
                      ]}
                      onPress={() => setResponseDeadlineDays(option.days)}
                    >
                      <Text style={[
                        styles.deadlineOptionText,
                        responseDeadlineDays === option.days && styles.deadlineOptionTextSelected,
                      ]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* What's Included */}
              <View style={styles.includedSection}>
                <Text style={styles.inputLabel}>What&apos;s included in the invite</Text>
                <View style={styles.includedList}>
                  <View style={styles.includedItem}>
                    <Check size={16} color={colors.success} />
                    <Text style={styles.includedText}>Date & time</Text>
                  </View>
                  <View style={styles.includedItem}>
                    <Check size={16} color={colors.success} />
                    <Text style={styles.includedText}>Number of activities planned</Text>
                  </View>
                  <View style={styles.includedItem}>
                    <Check size={16} color={colors.success} />
                    <Text style={styles.includedText}>Option to share dietary needs</Text>
                  </View>
                  <View style={styles.includedItem}>
                    <Check size={16} color={colors.success} />
                    <Text style={styles.includedText}>Suggest alternative dates</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.sendBtn} onPress={handleCreateAndSend}>
                <Send size={18} color="#fff" />
                <Text style={styles.sendBtnText}>Send Invitation</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Modal>
      </>
    );
  }

  // ============================================================================
  // With RSVP Status
  // ============================================================================

  return (
    <>
      <Pressable 
        style={styles.card}
        onPress={() => setShowDetailsModal(true)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            {isAccepted && <Check size={20} color={statusColor} />}
            {isDeclined && <X size={20} color={statusColor} />}
            {isTentative && <HelpCircle size={20} color={statusColor} />}
            {isPending && <Clock size={20} color={statusColor} />}
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.cardTitle}>
              {getRSVPStatusEmoji(rsvp.status)} {getRSVPStatusLabel(rsvp.status)}
            </Text>
            <Text style={styles.cardSubtitle}>
              {isPending && 'Waiting for response...'}
              {isAccepted && `${rsvp.partnerName} is coming!`}
              {isDeclined && `${rsvp.partnerName} can't make it`}
              {isTentative && `${rsvp.partnerName} might come`}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textTertiary} />
        </View>

        {/* Quick Info */}
        {isAccepted && rsvp.excitementLevel && (
          <View style={styles.excitementBadge}>
            <Text style={styles.excitementText}>
              {rsvp.reactionEmoji || '💕'} {EXCITEMENT_LABELS[rsvp.excitementLevel]}
            </Text>
          </View>
        )}

        {isPending && !rsvp.reminderSent && (
          <Pressable 
            style={styles.reminderBtn}
            onPress={(e) => {
              e.stopPropagation();
              sendReminder();
            }}
          >
            <Bell size={16} color={colors.primary} />
            <Text style={styles.reminderBtnText}>Send Reminder</Text>
          </Pressable>
        )}
      </Pressable>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowDetailsModal(false)}>
              <X size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.modalTitle}>RSVP Details</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Status Header */}
            <View style={[styles.statusHeader, { backgroundColor: statusColor + '15' }]}>
              <View style={[styles.statusIconLarge, { backgroundColor: statusColor + '20' }]}>
                {isAccepted && <Check size={28} color={statusColor} />}
                {isDeclined && <X size={28} color={statusColor} />}
                {isTentative && <HelpCircle size={28} color={statusColor} />}
                {isPending && <Clock size={28} color={statusColor} />}
              </View>
              <Text style={[styles.statusTitle, { color: statusColor }]}>
                {getRSVPStatusLabel(rsvp.status)}
              </Text>
              {rsvp.respondedAt && (
                <Text style={styles.respondedAt}>
                  Responded {new Date(rsvp.respondedAt).toLocaleDateString()}
                </Text>
              )}
            </View>

            {/* Partner Response Details */}
            {hasResponse && (
              <View style={styles.detailsSection}>
                {/* Excitement & Emoji */}
                {isAccepted && (rsvp.excitementLevel || rsvp.reactionEmoji) && (
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>Their reaction</Text>
                    <View style={styles.reactionRow}>
                      {rsvp.reactionEmoji && (
                        <Text style={styles.reactionEmoji}>{rsvp.reactionEmoji}</Text>
                      )}
                      {rsvp.excitementLevel && (
                        <Text style={styles.reactionText}>
                          {EXCITEMENT_LABELS[rsvp.excitementLevel]}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Personal Note */}
                {rsvp.personalNote && (
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>Their message</Text>
                    <View style={styles.noteCard}>
                      <MessageSquare size={16} color={colors.primary} />
                      <Text style={styles.noteText}>&quot;{rsvp.personalNote}&quot;</Text>
                    </View>
                  </View>
                )}

                {/* Dietary Restrictions */}
                {rsvp.dietaryRestrictions && rsvp.dietaryRestrictions.length > 0 && (
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>Dietary Restrictions</Text>
                    <View style={styles.dietaryList}>
                      {rsvp.dietaryRestrictions.map((id) => {
                        const option = DIETARY_OPTIONS.find(o => o.id === id);
                        return option ? (
                          <View key={id} style={styles.dietaryBadge}>
                            <Text style={styles.dietaryBadgeEmoji}>{option.emoji}</Text>
                            <Text style={styles.dietaryBadgeText}>{option.label}</Text>
                          </View>
                        ) : null;
                      })}
                    </View>
                  </View>
                )}

                {/* Accessibility Needs */}
                {rsvp.accessibilityNeeds && (
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>Accessibility Needs</Text>
                    <Text style={styles.detailValue}>{rsvp.accessibilityNeeds}</Text>
                  </View>
                )}

                {/* Alternative Dates (if declined) */}
                {isDeclined && rsvp.alternativeDates && rsvp.alternativeDates.length > 0 && (
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>Suggested Alternatives</Text>
                    {rsvp.alternativeDates.map((date, index) => (
                      <View key={index} style={styles.altDateRow}>
                        <Calendar size={16} color={colors.primary} />
                        <Text style={styles.altDateText}>{date}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsSection}>
              {isPending && (
                <Pressable style={styles.actionBtn} onPress={sendReminder}>
                  <Bell size={18} color={colors.primary} />
                  <Text style={styles.actionBtnText}>
                    {rsvp.reminderSent ? 'Send Another Reminder' : 'Send Reminder'}
                  </Text>
                </Pressable>
              )}

              <Pressable 
                style={[styles.actionBtn, styles.actionBtnDanger]}
                onPress={() => {
                  Alert.alert(
                    'Cancel RSVP Request?',
                    'This will remove the RSVP request.',
                    [
                      { text: 'Keep', style: 'cancel' },
                      { text: 'Cancel', style: 'destructive', onPress: cancelRSVP },
                    ]
                  );
                }}
              >
                <X size={18} color={colors.error} />
                <Text style={[styles.actionBtnText, { color: colors.error }]}>
                  Cancel RSVP Request
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Compact Card
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  compactIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactInfo: {
    flex: 1,
  },
  compactText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  compactLabel: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  compactStatus: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Full Card
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Excitement Badge
  excitementBadge: {
    backgroundColor: colors.primary + '15',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  excitementText: {
    fontSize: 14,
    color: colors.primary,
  },

  // Reminder Button
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary + '15',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  reminderBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  // Input Group
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  messageInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Deadline Options
  deadlineOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  deadlineOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  deadlineOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  deadlineOptionText: {
    fontSize: 13,
    color: colors.text,
  },
  deadlineOptionTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },

  // Included Section
  includedSection: {
    marginTop: 8,
  },
  includedList: {
    gap: 10,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  includedText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Send Button
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Status Header
  statusHeader: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  statusIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  respondedAt: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // Details Section
  detailsSection: {
    gap: 16,
  },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 15,
    color: colors.text,
  },

  // Reaction
  reactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reactionEmoji: {
    fontSize: 32,
  },
  reactionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },

  // Note
  noteCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.primary + '10',
    padding: 12,
    borderRadius: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // Dietary
  dietaryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  dietaryBadgeEmoji: {
    fontSize: 14,
  },
  dietaryBadgeText: {
    fontSize: 13,
    color: colors.text,
  },

  // Alt Dates
  altDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  altDateText: {
    fontSize: 15,
    color: colors.text,
  },

  // Actions
  actionsSection: {
    marginTop: 24,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary + '15',
    paddingVertical: 14,
    borderRadius: 10,
  },
  actionBtnDanger: {
    backgroundColor: colors.error + '15',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
  },
});
