// ============================================================================
// QRCodeShareSheet Component for Paint the Town
// Full-featured modal for generating and sharing QR codes
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  X,
  Share2,
  Copy,
  Download,
  MessageCircle,
  Mail,
  Link,
  QrCode,
  Check,
  RefreshCw,
  Smartphone,
  ChevronRight,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useQRCode } from '@/hooks/useQRCode';
import {
  ShareableContent,
  ShareableContentType,
  CONTENT_TYPE_CONFIG,
  QRDisplayOptions,
} from '@/types/qrcode';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_SIZE = Math.min(SCREEN_WIDTH - 80, 280);

// ============================================================================
// Props
// ============================================================================

interface QRCodeShareSheetProps {
  visible: boolean;
  onClose: () => void;
  
  // Content to share - provide ONE of these:
  content?: ShareableContent;
  
  // Or use quick create props:
  trip?: {
    id: string;
    name: string;
    destination?: string;
    dates?: { start: string; end: string };
  };
  
  dateNight?: {
    id: string;
    name: string;
    partnerName?: string;
    isSurprise?: boolean;
  };
  
  location?: {
    name: string;
    coordinates: { lat: number; lng: number };
    address?: string;
  };
  
  url?: {
    url: string;
    title?: string;
  };
  
  // Callbacks
  onShare?: (action: string, success: boolean) => void;
  
  // Display options
  displayOptions?: Partial<QRDisplayOptions>;
}

// ============================================================================
// Share Action Button
// ============================================================================

interface ShareActionProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
}

const ShareAction: React.FC<ShareActionProps> = ({
  icon,
  label,
  sublabel,
  onPress,
  disabled,
  loading,
  success,
}) => (
  <Pressable
    style={[styles.shareAction, disabled && styles.shareActionDisabled]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    <View style={[styles.shareActionIcon, success && styles.shareActionIconSuccess]}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : success ? (
        <Check size={20} color="#22C55E" />
      ) : (
        icon
      )}
    </View>
    <View style={styles.shareActionText}>
      <Text style={styles.shareActionLabel}>{label}</Text>
      {sublabel && <Text style={styles.shareActionSublabel}>{sublabel}</Text>}
    </View>
    <ChevronRight size={18} color={colors.textTertiary} />
  </Pressable>
);

// ============================================================================
// Main Component
// ============================================================================

export const QRCodeShareSheet: React.FC<QRCodeShareSheetProps> = ({
  visible,
  onClose,
  content,
  trip,
  dateNight,
  location,
  url,
  onShare,
  displayOptions,
// eslint-disable-next-line complexity -- tracked in #1
}) => {
  const {
    qrCode,
    isGenerating,
    isSharing,
    generate,
    generateForTrip,
    generateForDateNight,
    generateForLocation,
    generateForUrl,
    copyLink,
    shareNatively,
    saveToGallery,
    shareImage,
    sendSMS,
    sendEmail,
    getContentInfo,
    clear,
  } = useQRCode();

  const [copiedLink, setCopiedLink] = useState(false);
  const [savedImage, setSavedImage] = useState(false);

  // Generate QR code when modal opens
  useEffect(() => {
    if (visible) {
      generateQRCode();
    } else {
      // Reset states when closed
      setCopiedLink(false);
      setSavedImage(false);
    }
  }, [visible]);

  const generateQRCode = async () => {
    if (content) {
      await generate(content);
    } else if (trip) {
      await generateForTrip(trip.id, trip.name, trip.destination, trip.dates);
    } else if (dateNight) {
      await generateForDateNight(dateNight.id, dateNight.name, dateNight.partnerName, dateNight.isSurprise);
    } else if (location) {
      await generateForLocation(location.name, location.coordinates, location.address);
    } else if (url) {
      await generateForUrl(url.url, url.title);
    }
  };

  const handleClose = () => {
    clear();
    onClose();
  };

  // Share action handlers
  const handleCopyLink = async () => {
    const result = await copyLink();
    if (result.success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
    onShare?.('copy_link', result.success);
  };

  const handleShareNative = async () => {
    const result = await shareNatively();
    onShare?.('share_native', result.success);
  };

  const handleSaveToGallery = async () => {
    const result = await saveToGallery();
    if (result.success) {
      setSavedImage(true);
      setTimeout(() => setSavedImage(false), 2000);
    }
    onShare?.('save_image', result.success);
  };

  const handleShareImage = async () => {
    const result = await shareImage();
    onShare?.('share_image', result.success);
  };

  const handleSendSMS = async () => {
    const result = await sendSMS();
    onShare?.('send_sms', result.success);
  };

  const handleSendEmail = async () => {
    const result = await sendEmail();
    onShare?.('send_email', result.success);
  };

  // Get content info for display
  const contentInfo = getContentInfo();
  const contentType = content?.type || 
    (trip ? 'trip' : dateNight ? 'date_night' : location ? 'location' : 'custom');
  const config = CONTENT_TYPE_CONFIG[contentType];

  // Get title for display
  const title = content?.title || trip?.name || dateNight?.name || location?.name || url?.title || 'Share';
  const subtitle = content?.subtitle || trip?.destination || dateNight?.partnerName || location?.address;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={[styles.headerIcon, { backgroundColor: `${config.color}15` }]}>
                <Text style={styles.headerIconText}>{config.icon}</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
                {subtitle && (
                  <Text style={styles.headerSubtitle} numberOfLines={1}>{subtitle}</Text>
                )}
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <X size={22} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* QR Code Display */}
            <View style={styles.qrContainer}>
              {isGenerating ? (
                <View style={styles.qrPlaceholder}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.qrLoadingText}>Generating QR Code...</Text>
                </View>
              ) : qrCode?.qrDataUrl ? (
                <View style={styles.qrWrapper}>
                  <View style={styles.qrCard}>
                    <Image
                      source={{ uri: qrCode.qrDataUrl }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.qrHint}>Scan with any camera app</Text>
                </View>
              ) : (
                <View style={styles.qrPlaceholder}>
                  <QrCode size={48} color={colors.textTertiary} />
                  <Text style={styles.qrErrorText}>Failed to generate QR code</Text>
                  <Pressable style={styles.retryButton} onPress={generateQRCode}>
                    <RefreshCw size={16} color={colors.primary} />
                    <Text style={styles.retryText}>Try Again</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Pressable
                style={[styles.quickAction, copiedLink && styles.quickActionSuccess]}
                onPress={handleCopyLink}
                disabled={!qrCode || isSharing}
              >
                {copiedLink ? (
                  <Check size={20} color="#22C55E" />
                ) : (
                  <Copy size={20} color={colors.primary} />
                )}
                <Text style={[styles.quickActionText, copiedLink && styles.quickActionTextSuccess]}>
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.quickAction, savedImage && styles.quickActionSuccess]}
                onPress={handleSaveToGallery}
                disabled={!qrCode || isSharing}
              >
                {savedImage ? (
                  <Check size={20} color="#22C55E" />
                ) : (
                  <Download size={20} color={colors.primary} />
                )}
                <Text style={[styles.quickActionText, savedImage && styles.quickActionTextSuccess]}>
                  {savedImage ? 'Saved!' : 'Save Image'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.quickAction}
                onPress={handleShareNative}
                disabled={!qrCode || isSharing}
              >
                <Share2 size={20} color={colors.primary} />
                <Text style={styles.quickActionText}>Share</Text>
              </Pressable>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Share via</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Share Options */}
            <View style={styles.shareOptions}>
              <ShareAction
                icon={<Smartphone size={20} color={colors.primary} />}
                label="Share QR Image"
                sublabel="Send the QR code as an image"
                onPress={handleShareImage}
                disabled={!qrCode}
              />
              
              <ShareAction
                icon={<MessageCircle size={20} color={colors.primary} />}
                label="Messages"
                sublabel="Send via iMessage or SMS"
                onPress={handleSendSMS}
                disabled={!qrCode}
              />
              
              <ShareAction
                icon={<Mail size={20} color={colors.primary} />}
                label="Email"
                sublabel="Send via email"
                onPress={handleSendEmail}
                disabled={!qrCode}
              />
              
              <ShareAction
                icon={<Link size={20} color={colors.primary} />}
                label="Copy Link"
                sublabel={qrCode?.encodedValue ? 
                  qrCode.encodedValue.substring(0, 40) + (qrCode.encodedValue.length > 40 ? '...' : '') 
                  : 'Copy shareable link'
                }
                onPress={handleCopyLink}
                disabled={!qrCode}
                success={copiedLink}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Share this QR code with anyone. They can scan it with their phone&apos;s camera to open the link.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerIconText: {
    fontSize: 22,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    marginLeft: 12,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },

  // QR Code
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrWrapper: {
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  qrImage: {
    width: QR_SIZE,
    height: QR_SIZE,
  },
  qrHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
  },
  qrPlaceholder: {
    width: QR_SIZE + 40,
    height: QR_SIZE + 40,
    backgroundColor: colors.background,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrLoadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  qrErrorText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primaryLight + '20',
    borderRadius: 8,
    gap: 6,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24,
  },
  quickAction: {
    alignItems: 'center',
    padding: 12,
    minWidth: 80,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  quickActionSuccess: {
    backgroundColor: '#DCFCE7',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    marginTop: 6,
  },
  quickActionTextSuccess: {
    color: '#22C55E',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: 12,
  },

  // Share Options
  shareOptions: {
    gap: 8,
  },
  shareAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  shareActionDisabled: {
    opacity: 0.5,
  },
  shareActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shareActionIconSuccess: {
    backgroundColor: '#DCFCE7',
  },
  shareActionText: {
    flex: 1,
  },
  shareActionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  shareActionSublabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Footer
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default QRCodeShareSheet;
