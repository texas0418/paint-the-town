// ============================================================================
// Shared View Screen - Partner's View of Date Night Itinerary
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
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
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
  Lock,
  Eye,
  MessageSquare,
  Send,
  Sparkles,
  Navigation,
  ChevronRight,
  HelpCircle,
  PartyPopper,
  X,
  Check,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { usePartnerView } from '@/hooks/useSharedItinerary';
import { SharedViewActivity, TeaseLevel } from '@/types/sharing';

const { width } = Dimensions.get('window');

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function SharedViewScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();

  const [enteredCode, setEnteredCode] = useState(code || '');
  const [password, setPassword] = useState('');
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<SharedViewActivity | null>(null);

  const {
    sharedView,
    isLoading,
    error,
    requiresPassword,
    submitPassword,
    submitSuggestion,
    addToCalendar,
    refresh,
  } = usePartnerView({ shareCode: enteredCode || undefined });

  const handleCodeSubmit = () => {
    if (enteredCode.length === 6) {
      refresh();
    } else {
      Alert.alert('Invalid Code', 'Please enter a 6-character share code.');
    }
  };

  const handlePasswordSubmit = () => {
    if (password) {
      submitPassword(password);
    }
  };

  const handleSendSuggestion = () => {
    if (!suggestionText.trim()) return;

    submitSuggestion({
      activityId: selectedActivity?.id,
      type: 'note',
      message: suggestionText,
    });

    setSuggestionText('');
    setShowSuggestionModal(false);
    setSelectedActivity(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // ============================================================================
  // Render Code Entry
  // ============================================================================

  const renderCodeEntry = () => (
    <View style={styles.codeEntryContainer}>
      <View style={styles.codeEntryCard}>
        <View style={styles.codeEntryIcon}>
          <Heart size={32} color={colors.primary} />
        </View>
        <Text style={styles.codeEntryTitle}>View Your Date Night</Text>
        <Text style={styles.codeEntrySubtitle}>
          Enter the 6-character code your partner shared with you
        </Text>

        <View style={styles.codeInputContainer}>
          <TextInput
            style={styles.codeInput}
            value={enteredCode}
            onChangeText={(text) => setEnteredCode(text.toUpperCase())}
            placeholder="ABC123"
            placeholderTextColor={colors.textTertiary}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        <Pressable
          style={[styles.codeSubmitBtn, enteredCode.length !== 6 && styles.codeSubmitBtnDisabled]}
          onPress={handleCodeSubmit}
          disabled={enteredCode.length !== 6}
        >
          <Text style={styles.codeSubmitBtnText}>View Itinerary</Text>
        </Pressable>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </View>
  );

  // ============================================================================
  // Render Password Entry
  // ============================================================================

  const renderPasswordEntry = () => (
    <View style={styles.codeEntryContainer}>
      <View style={styles.codeEntryCard}>
        <View style={[styles.codeEntryIcon, { backgroundColor: colors.warning + '20' }]}>
          <Lock size={32} color={colors.warning} />
        </View>
        <Text style={styles.codeEntryTitle}>Password Required</Text>
        <Text style={styles.codeEntrySubtitle}>
          This itinerary is password protected. Ask your partner for the password.
        </Text>

        <View style={styles.codeInputContainer}>
          <TextInput
            style={styles.codeInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
            autoCorrect={false}
          />
        </View>

        <Pressable
          style={[styles.codeSubmitBtn, !password && styles.codeSubmitBtnDisabled]}
          onPress={handlePasswordSubmit}
          disabled={!password}
        >
          <Text style={styles.codeSubmitBtnText}>Unlock</Text>
        </Pressable>
      </View>
    </View>
  );

  // ============================================================================
  // Render Activity Card
  // ============================================================================

  // eslint-disable-next-line complexity -- tracked in #1
  const renderActivityCard = (activity: SharedViewActivity, index: number) => {
    const isSurprise = activity.isSurprise;

    return (
      <View key={activity.id} style={styles.activityCard}>
        {/* Timeline connector */}
        <View style={styles.timelineContainer}>
          <View style={[styles.timelineDot, isSurprise && styles.timelineDotSurprise]}>
            {isSurprise ? (
              <Gift size={14} color="#fff" />
            ) : (
              <Text style={styles.timelineNumber}>{index + 1}</Text>
            )}
          </View>
          {index < (sharedView?.activities.length || 0) - 1 && <View style={styles.timelineLine} />}
        </View>

        {/* Activity content */}
        <View style={[styles.activityContent, isSurprise && styles.activityContentSurprise]}>
          {/* Time */}
          <View style={styles.activityTime}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.activityTimeText}>
              {formatTime(activity.startTime)}
              {activity.duration && ` • ${activity.duration} min`}
            </Text>
          </View>

          {/* Name */}
          <Text style={[styles.activityName, isSurprise && styles.activityNameSurprise]}>
            {activity.name || 'Activity'}
          </Text>

          {/* Surprise hint */}
          {isSurprise && activity.surpriseHint && (
            <View style={styles.surpriseHint}>
              <Sparkles size={14} color={colors.primary} />
              <Text style={styles.surpriseHintText}>{activity.surpriseHint}</Text>
            </View>
          )}

          {/* Location (if visible) */}
          {!isSurprise && activity.location?.name && sharedView?.canSeeLocation && (
            <Pressable style={styles.activityLocation}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={styles.activityLocationText} numberOfLines={1}>
                {activity.location.name}
              </Text>
              <Navigation size={14} color={colors.primary} />
            </Pressable>
          )}

          {/* Neighborhood hint for surprises */}
          {isSurprise &&
            activity.teaseLevel === 'neighborhood' &&
            activity.location?.neighborhood && (
              <View style={styles.activityLocation}>
                <MapPin size={14} color={colors.textTertiary} />
                <Text style={styles.activityLocationText}>
                  Somewhere in {activity.location.neighborhood}
                </Text>
              </View>
            )}

          {/* Description (if not surprise) */}
          {!isSurprise && activity.description && (
            <Text style={styles.activityDescription} numberOfLines={2}>
              {activity.description}
            </Text>
          )}

          {/* Travel time to next */}
          {activity.travelTime && activity.travelTime > 0 && (
            <View style={styles.travelInfo}>
              <Text style={styles.travelInfoText}>{activity.travelTime} min to next stop</Text>
            </View>
          )}

          {/* Suggestion button */}
          {sharedView?.shareSettings.accessLevel !== 'view_only' && (
            <Pressable
              style={styles.suggestBtn}
              onPress={() => {
                setSelectedActivity(activity);
                setShowSuggestionModal(true);
              }}
            >
              <MessageSquare size={14} color={colors.primary} />
              <Text style={styles.suggestBtnText}>Send a note</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  // ============================================================================
  // Render Main Content
  // ============================================================================

  const renderContent = () => {
    if (!sharedView) return null;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient colors={[colors.primary, colors.primary + 'CC']} style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
              <Heart size={28} color="#fff" fill="#fff" />
            </View>
            <Text style={styles.heroTitle}>{sharedView.name}</Text>
            <Text style={styles.heroDate}>{formatDate(sharedView.date)}</Text>

            {sharedView.greeting && <Text style={styles.heroGreeting}>{sharedView.greeting}</Text>}

            {/* Stats */}
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{sharedView.activityCount}</Text>
                <Text style={styles.heroStatLabel}>
                  {sharedView.activityCount === 1 ? 'Activity' : 'Activities'}
                </Text>
              </View>
              {sharedView.surpriseCount > 0 && (
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{sharedView.surpriseCount}</Text>
                  <Text style={styles.heroStatLabel}>
                    {sharedView.surpriseCount === 1 ? 'Surprise' : 'Surprises'}
                  </Text>
                </View>
              )}
              {sharedView.totalDuration && sharedView.totalDuration > 0 && (
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>
                    {Math.round(sharedView.totalDuration / 60)}h
                  </Text>
                  <Text style={styles.heroStatLabel}>Duration</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Surprise Banner */}
        {sharedView.surpriseCount > 0 && (
          <View style={styles.surpriseBanner}>
            <Gift size={20} color={colors.primary} />
            <Text style={styles.surpriseBannerText}>
              {sharedView.surpriseCount} surprise{sharedView.surpriseCount > 1 ? 's' : ''} await
              {sharedView.surpriseCount === 1 ? 's' : ''} you! Some details are hidden until the big
              reveal.
            </Text>
          </View>
        )}

        {/* Activities */}
        <View style={styles.activitiesSection}>
          <Text style={styles.sectionTitle}>Your Itinerary</Text>
          {sharedView.activities.map((activity, index) => renderActivityCard(activity, index))}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          {sharedView.canAddToCalendar && (
            <Pressable style={styles.actionBtn} onPress={addToCalendar}>
              <Calendar size={20} color={colors.primary} />
              <Text style={styles.actionBtnText}>Add to Calendar</Text>
              <ChevronRight size={18} color={colors.textTertiary} />
            </Pressable>
          )}

          {sharedView.shareSettings.accessLevel !== 'view_only' && (
            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                setSelectedActivity(null);
                setShowSuggestionModal(true);
              }}
            >
              <MessageSquare size={20} color={colors.primary} />
              <Text style={styles.actionBtnText}>Send Feedback</Text>
              <ChevronRight size={18} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Planned with 💕 by {sharedView.creatorName}</Text>
          <Text style={styles.footerSubtext}>
            Last updated {new Date(sharedView.lastUpdated).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
    );
  };

  // ============================================================================
  // Render Suggestion Modal
  // ============================================================================

  const renderSuggestionModal = () => (
    <Modal
      visible={showSuggestionModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowSuggestionModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Pressable onPress={() => setShowSuggestionModal(false)}>
            <X size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.modalTitle}>
            {selectedActivity ? 'Note for Activity' : 'Send Feedback'}
          </Text>
          <Pressable onPress={handleSendSuggestion}>
            <Send size={24} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.modalContent}>
          {selectedActivity && (
            <View style={styles.selectedActivityCard}>
              <Text style={styles.selectedActivityName}>
                {selectedActivity.isSurprise ? '🎁 Surprise Activity' : selectedActivity.name}
              </Text>
              <Text style={styles.selectedActivityTime}>
                {formatTime(selectedActivity.startTime)}
              </Text>
            </View>
          )}

          <TextInput
            style={styles.suggestionInput}
            placeholder={
              selectedActivity
                ? 'Any thoughts or questions about this activity?'
                : 'Share your thoughts or ask a question...'
            }
            placeholderTextColor={colors.textTertiary}
            value={suggestionText}
            onChangeText={setSuggestionText}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <Text style={styles.suggestionHint}>
            Your partner will see this message and can respond.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Shared Itinerary</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your date night...</Text>
          </View>
        ) : requiresPassword ? (
          renderPasswordEntry()
        ) : sharedView ? (
          renderContent()
        ) : (
          renderCodeEntry()
        )}

        {/* Modals */}
        {renderSuggestionModal()}
      </SafeAreaView>
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

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Code Entry
  codeEntryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  codeEntryCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  codeEntryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  codeEntryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  codeEntrySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  codeInputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  codeInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  codeSubmitBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  codeSubmitBtnDisabled: {
    opacity: 0.5,
  },
  codeSubmitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.error + '15',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },

  // Content
  content: {
    flex: 1,
  },

  // Hero
  heroSection: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  heroDate: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  heroGreeting: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 32,
  },
  heroStat: {
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  heroStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Surprise Banner
  surpriseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primary + '10',
    marginHorizontal: 16,
    marginTop: -20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  surpriseBannerText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },

  // Activities
  activitiesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  activityCard: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotSurprise: {
    backgroundColor: colors.warning,
  },
  timelineNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: -4,
    marginBottom: -4,
  },
  activityContent: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  activityContentSurprise: {
    borderWidth: 1,
    borderColor: colors.warning + '40',
    borderStyle: 'dashed',
  },
  activityTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  activityTimeText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  activityName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  activityNameSurprise: {
    color: colors.warning,
  },
  surpriseHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  surpriseHintText: {
    fontSize: 13,
    color: colors.primary,
    fontStyle: 'italic',
  },
  activityLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  activityLocationText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  activityDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  travelInfo: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  travelInfoText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  suggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  suggestBtnText: {
    fontSize: 13,
    color: colors.primary,
  },

  // Actions
  actionsSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  actionBtnText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  footerSubtext: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
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
  selectedActivityCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  selectedActivityName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  selectedActivityTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  suggestionInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 150,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionHint: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 12,
    textAlign: 'center',
  },
});
