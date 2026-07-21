// ============================================================================
// RSVP Response Screen - Partner responds to date night invitation
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  Calendar,
  MapPin,
  Clock,
  Gift,
  Check,
  X,
  HelpCircle,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Utensils,
  AlertCircle,
  PartyPopper,
  Send,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useRSVPResponse } from '@/hooks/useRSVP';
import {
  RSVPResponse,
  RSVPStatus,
  DIETARY_OPTIONS,
  REACTION_EMOJIS,
  EXCITEMENT_LABELS,
  getRSVPStatusColor,
  formatRSVPDeadline,
} from '@/types/rsvp';

const { width } = Dimensions.get('window');

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function RSVPResponseScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();

  const {
    invite,
    isLoading,
    error,
    hasResponded,
    submitResponse,
    acceptInvite,
    declineInvite,
    markTentative,
  } = useRSVPResponse({ shareCode: code });

  // Response form state
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseType, setResponseType] = useState<RSVPStatus>('accepted');
  const [excitementLevel, setExcitementLevel] = useState<number>(3);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('😍');
  const [personalNote, setPersonalNote] = useState('');
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [alternativeDate, setAlternativeDate] = useState('');

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleQuickResponse = (status: RSVPStatus) => {
    setResponseType(status);
    setShowResponseForm(true);
  };

  const handleSubmitResponse = () => {
    const response: RSVPResponse = {
      status: responseType,
      excitementLevel:
        responseType === 'accepted' ? (excitementLevel as 1 | 2 | 3 | 4 | 5) : undefined,
      reactionEmoji: responseType === 'accepted' ? selectedEmoji : undefined,
      personalNote: personalNote || undefined,
      dietaryRestrictions: selectedDietary.length > 0 ? selectedDietary : undefined,
      accessibilityNeeds: accessibilityNeeds || undefined,
      reason: responseType === 'declined' ? declineReason : undefined,
      alternativeDates: alternativeDate ? [alternativeDate] : undefined,
    };

    submitResponse(response);
    setShowResponseForm(false);
  };

  const toggleDietary = (id: string) => {
    setSelectedDietary((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  // ============================================================================
  // Render Loading
  // ============================================================================

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading invitation...</Text>
        </SafeAreaView>
      </View>
    );
  }

  // ============================================================================
  // Render Error
  // ============================================================================

  if (error || !invite) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>RSVP</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.centered}>
            <AlertCircle size={48} color={colors.error} />
            <Text style={styles.errorTitle}>Invitation Not Found</Text>
            <Text style={styles.errorText}>
              {error || 'This invitation may have expired or been cancelled.'}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ============================================================================
  // Render Already Responded
  // ============================================================================

  if (hasResponded) {
    const statusColor = getRSVPStatusColor(invite.rsvpStatus);

    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>RSVP</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.respondedContainer}>
            <View style={[styles.respondedIcon, { backgroundColor: statusColor + '20' }]}>
              {invite.rsvpStatus === 'accepted' ? (
                <Check size={32} color={statusColor} />
              ) : invite.rsvpStatus === 'declined' ? (
                <X size={32} color={statusColor} />
              ) : (
                <HelpCircle size={32} color={statusColor} />
              )}
            </View>

            <Text style={styles.respondedTitle}>
              {invite.rsvpStatus === 'accepted' && "You're going! 🎉"}
              {invite.rsvpStatus === 'declined' && "You've declined"}
              {invite.rsvpStatus === 'tentative' && 'Marked as Maybe'}
            </Text>

            <Text style={styles.respondedSubtitle}>
              {invite.creatorName} has been notified of your response.
            </Text>

            {invite.rsvpStatus === 'accepted' && (
              <Pressable
                style={styles.viewItineraryBtn}
                onPress={() => router.push(`/date-night/shared-view?code=${invite.shareCode}`)}
              >
                <Text style={styles.viewItineraryBtnText}>View Itinerary</Text>
                <ChevronRight size={18} color="#fff" />
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ============================================================================
  // Render Invitation
  // ============================================================================

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={[colors.primary, '#FF6B9D']} style={styles.hero}>
          <SafeAreaView>
            <View style={styles.heroHeader}>
              <Pressable style={styles.heroBackBtn} onPress={() => router.back()}>
                <ArrowLeft size={22} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.heroContent}>
              <View style={styles.heroIconContainer}>
                <Heart size={36} color="#fff" fill="#fff" />
              </View>

              <Text style={styles.heroLabel}>You&apos;re Invited!</Text>
              <Text style={styles.heroTitle}>{invite.itineraryName}</Text>

              {invite.personalMessage && (
                <View style={styles.messageCard}>
                  <MessageSquare size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.messageText}>&quot;{invite.personalMessage}&quot;</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={20} color={colors.primary} />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(invite.date)}</Text>
            </View>
          </View>

          {invite.time && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Clock size={20} color={colors.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{invite.time}</Text>
              </View>
            </View>
          )}

          {invite.neighborhood && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MapPin size={20} color={colors.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{invite.neighborhood}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Sparkles size={20} color={colors.primary} />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>What&apos;s Planned</Text>
              <Text style={styles.detailValue}>
                {invite.activityCount} activities
                {invite.surpriseCount > 0 &&
                  ` • ${invite.surpriseCount} surprise${invite.surpriseCount > 1 ? 's' : ''}`}
              </Text>
            </View>
          </View>

          {invite.estimatedDuration && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Clock size={20} color={colors.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>{invite.estimatedDuration}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Response Deadline */}
        {invite.responseDeadline && (
          <View style={styles.deadlineCard}>
            <AlertCircle size={18} color={colors.warning} />
            <Text style={styles.deadlineText}>
              Please respond by {formatRSVPDeadline(invite.responseDeadline)}
            </Text>
          </View>
        )}

        {/* Response Buttons */}
        <View style={styles.responseSection}>
          <Text style={styles.responseSectionTitle}>Will you be there?</Text>

          <View style={styles.responseButtons}>
            <Pressable
              style={[styles.responseBtn, styles.acceptBtn]}
              onPress={() => handleQuickResponse('accepted')}
            >
              <Check size={24} color="#fff" />
              <Text style={styles.responseBtnText}>Accept</Text>
            </Pressable>

            <Pressable
              style={[styles.responseBtn, styles.maybeBtn]}
              onPress={() => handleQuickResponse('tentative')}
            >
              <HelpCircle size={24} color={colors.warning} />
              <Text style={[styles.responseBtnText, { color: colors.warning }]}>Maybe</Text>
            </Pressable>

            <Pressable
              style={[styles.responseBtn, styles.declineBtn]}
              onPress={() => handleQuickResponse('declined')}
            >
              <X size={24} color={colors.error} />
              <Text style={[styles.responseBtnText, { color: colors.error }]}>Decline</Text>
            </Pressable>
          </View>
        </View>

        {/* Creator Info */}
        <View style={styles.creatorCard}>
          <View style={styles.creatorAvatar}>
            <Heart size={20} color={colors.primary} />
          </View>
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorLabel}>Planned by</Text>
            <Text style={styles.creatorName}>{invite.creatorName}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Response Form Modal */}
      <Modal
        visible={showResponseForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResponseForm(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowResponseForm(false)}>
              <X size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.modalTitle}>
              {responseType === 'accepted' && 'Confirm Attendance'}
              {responseType === 'tentative' && 'Mark as Maybe'}
              {responseType === 'declined' && 'Decline Invitation'}
            </Text>
            <Pressable onPress={handleSubmitResponse}>
              <Send size={24} color={colors.primary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Accept Form */}
            {responseType === 'accepted' && (
              <>
                {/* Excitement Level */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>How excited are you?</Text>
                  <View style={styles.excitementSlider}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <Pressable
                        key={level}
                        style={[
                          styles.excitementDot,
                          excitementLevel >= level && styles.excitementDotActive,
                        ]}
                        onPress={() => setExcitementLevel(level)}
                      >
                        <PartyPopper
                          size={level === 5 ? 20 : 16}
                          color={excitementLevel >= level ? '#fff' : colors.textTertiary}
                        />
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.excitementLabel}>{EXCITEMENT_LABELS[excitementLevel]}</Text>
                </View>

                {/* Reaction Emoji */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Pick a reaction</Text>
                  <View style={styles.emojiGrid}>
                    {REACTION_EMOJIS.map((emoji) => (
                      <Pressable
                        key={emoji}
                        style={[
                          styles.emojiOption,
                          selectedEmoji === emoji && styles.emojiOptionSelected,
                        ]}
                        onPress={() => setSelectedEmoji(emoji)}
                      >
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Dietary Restrictions */}
                {invite.allowDietaryInfo && (
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Any dietary restrictions?</Text>
                    <View style={styles.dietaryGrid}>
                      {DIETARY_OPTIONS.map((option) => (
                        <Pressable
                          key={option.id}
                          style={[
                            styles.dietaryOption,
                            selectedDietary.includes(option.id) && styles.dietaryOptionSelected,
                          ]}
                          onPress={() => toggleDietary(option.id)}
                        >
                          <Text style={styles.dietaryEmoji}>{option.emoji}</Text>
                          <Text
                            style={[
                              styles.dietaryLabel,
                              selectedDietary.includes(option.id) && styles.dietaryLabelSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Accessibility Needs */}
                {invite.allowAccessibilityInfo && (
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Accessibility needs (optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., wheelchair access, hearing loop..."
                      placeholderTextColor={colors.textTertiary}
                      value={accessibilityNeeds}
                      onChangeText={setAccessibilityNeeds}
                      multiline
                    />
                  </View>
                )}
              </>
            )}

            {/* Decline Form */}
            {responseType === 'declined' && (
              <>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Reason (optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Let them know why you can't make it..."
                    placeholderTextColor={colors.textTertiary}
                    value={declineReason}
                    onChangeText={setDeclineReason}
                    multiline
                  />
                </View>

                {invite.allowAlternativeDates && (
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Suggest another date (optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., Next Saturday instead?"
                      placeholderTextColor={colors.textTertiary}
                      value={alternativeDate}
                      onChangeText={setAlternativeDate}
                    />
                  </View>
                )}
              </>
            )}

            {/* Maybe Form */}
            {responseType === 'tentative' && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>What&apos;s uncertain?</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Waiting to confirm work schedule..."
                  placeholderTextColor={colors.textTertiary}
                  value={declineReason}
                  onChangeText={setDeclineReason}
                  multiline
                />
              </View>
            )}

            {/* Personal Note (all responses) */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Add a personal note (optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Send a message to your partner..."
                placeholderTextColor={colors.textTertiary}
                value={personalNote}
                onChangeText={setPersonalNote}
                multiline
              />
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.modalFooter}>
            <Pressable
              style={[
                styles.submitBtn,
                responseType === 'accepted' && styles.submitBtnAccept,
                responseType === 'tentative' && styles.submitBtnMaybe,
                responseType === 'declined' && styles.submitBtnDecline,
              ]}
              onPress={handleSubmitResponse}
            >
              <Text style={styles.submitBtnText}>
                {responseType === 'accepted' && "I'll be there! 💕"}
                {responseType === 'tentative' && 'Mark as Maybe'}
                {responseType === 'declined' && 'Send Response'}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
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
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },

  // Error
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },

  // Responded
  respondedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  respondedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  respondedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  respondedSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  viewItineraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  viewItineraryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Hero
  hero: {
    paddingBottom: 32,
  },
  heroHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heroBackBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  messageText: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    fontStyle: 'italic',
    lineHeight: 22,
  },

  // Details Card
  detailsCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },

  // Deadline
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.warning + '15',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
  },
  deadlineText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning,
  },

  // Response Section
  responseSection: {
    padding: 20,
  },
  responseSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  responseButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  responseBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 14,
    gap: 8,
  },
  acceptBtn: {
    backgroundColor: colors.success,
  },
  maybeBtn: {
    backgroundColor: colors.warning + '20',
    borderWidth: 1,
    borderColor: colors.warning,
  },
  declineBtn: {
    backgroundColor: colors.error + '15',
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  responseBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Creator Card
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
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
    padding: 20,
  },
  modalFooter: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  // Form
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  textInput: {
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

  // Excitement
  excitementSlider: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  excitementDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  excitementDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  excitementLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Emoji
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  emojiOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  emojiText: {
    fontSize: 24,
  },

  // Dietary
  dietaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dietaryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dietaryOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  dietaryEmoji: {
    fontSize: 16,
  },
  dietaryLabel: {
    fontSize: 13,
    color: colors.text,
  },
  dietaryLabelSelected: {
    color: colors.primary,
    fontWeight: '500',
  },

  // Submit
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnAccept: {
    backgroundColor: colors.success,
  },
  submitBtnMaybe: {
    backgroundColor: colors.warning,
  },
  submitBtnDecline: {
    backgroundColor: colors.error,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
