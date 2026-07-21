import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Linking,
  Alert,
  Share,
} from 'react-native';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Sun,
  MapPin,
  Clock,
  Copy,
  ExternalLink,
  Check,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import colors from '@/constants/colors';
import { Confirmation, Ticket } from '@/types/confirmation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TicketViewerProps {
  visible: boolean;
  onClose: () => void;
  confirmation: Confirmation;
  initialTicketIndex?: number;
}

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function TicketViewer({
  visible,
  onClose,
  confirmation,
  initialTicketIndex = 0,
}: TicketViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialTicketIndex);
  const [isBrightnessMaxed, setIsBrightnessMaxed] = useState(false);
  const [copied, setCopied] = useState(false);

  const tickets = confirmation.tickets || [];
  const currentTicket = tickets[currentIndex];

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialTicketIndex);
      setIsBrightnessMaxed(false);
    }
  }, [visible, initialTicketIndex]);

  // Brightness toggle is now just a visual indicator
  // (actual brightness control removed to avoid native module requirement)
  const toggleBrightness = () => {
    setIsBrightnessMaxed(!isBrightnessMaxed);
    // Note: For actual brightness control, install expo-brightness and rebuild native app
  };

  const handleCopyCode = async () => {
    if (currentTicket?.code) {
      await Clipboard.setStringAsync(currentTicket.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!currentTicket) return;

    try {
      const shareContent: { message: string; title?: string; url?: string } = {
        message: `${confirmation.title}\n\nDate: ${formatDate(confirmation.date)}${confirmation.time ? ` at ${confirmation.time}` : ''}\n${confirmation.location?.name || confirmation.location?.address || ''}\n\n${currentTicket.code ? `Code: ${currentTicket.code}` : ''}${confirmation.confirmationNumber ? `\nConfirmation: ${confirmation.confirmationNumber}` : ''}`,
        title: confirmation.title,
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleOpenMaps = () => {
    if (confirmation.location?.coordinates) {
      const { lat, lng } = confirmation.location.coordinates;
      const url = Platform.select({
        ios: `maps:0,0?q=${lat},${lng}`,
        android: `geo:${lat},${lng}?q=${lat},${lng}`,
        default: `https://maps.google.com/?q=${lat},${lng}`,
      });
      Linking.openURL(url as string);
    } else if (confirmation.location?.address) {
      const encoded = encodeURIComponent(confirmation.location.address);
      Linking.openURL(`https://maps.google.com/?q=${encoded}`);
    }
  };

  const handleAddToWallet = () => {
    if (currentTicket?.walletPassUri) {
      Linking.openURL(currentTicket.walletPassUri);
    } else {
      Alert.alert('Wallet Pass', 'Wallet pass not available for this ticket.');
    }
  };

  const goToNext = () => {
    if (currentIndex < tickets.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  const renderTicketContent = () => {
    if (!currentTicket) {
      return (
        <View style={styles.noTicket}>
          <Text style={styles.noTicketText}>No ticket available</Text>
        </View>
      );
    }

    switch (currentTicket.type) {
      case 'qr':
        return (
          <View style={styles.qrContainer}>
            {currentTicket.code ? (
              <QRCode
                value={currentTicket.code}
                size={200}
                backgroundColor="white"
                color="black"
              />
            ) : (
              <Text style={styles.errorText}>QR code data missing</Text>
            )}
          </View>
        );

      case 'barcode':
        return (
          <View style={styles.barcodeContainer}>
            {currentTicket.imageUri ? (
              <Image
                source={{ uri: currentTicket.imageUri }}
                style={styles.barcodeImage}
                resizeMode="contain"
              />
            ) : currentTicket.code ? (
              <View style={styles.barcodeCode}>
                <Text style={styles.barcodeCodeText}>{currentTicket.code}</Text>
              </View>
            ) : (
              <Text style={styles.errorText}>Barcode data missing</Text>
            )}
          </View>
        );

      case 'pdf':
        return (
          <View style={styles.pdfContainer}>
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => currentTicket.pdfUri && Linking.openURL(currentTicket.pdfUri)}
            >
              <Download size={20} color={colors.primary} />
              <Text style={styles.pdfButtonText}>Open PDF Ticket</Text>
            </TouchableOpacity>
          </View>
        );

      case 'passbook':
        return (
          <View style={styles.passbookContainer}>
            <TouchableOpacity
              style={styles.passbookButton}
              onPress={handleAddToWallet}
            >
              <Text style={styles.passbookButtonText}>Add to Apple Wallet</Text>
            </TouchableOpacity>
          </View>
        );

      case 'image':
        return (
          <View style={styles.imageContainer}>
            {currentTicket.imageUri && (
              <Image
                source={{ uri: currentTicket.imageUri }}
                style={styles.ticketImage}
                resizeMode="contain"
              />
            )}
          </View>
        );

      case 'text':
      default:
        return (
          <View style={styles.textContainer}>
            <Text style={styles.textCode}>{currentTicket.code || 'No code'}</Text>
          </View>
        );
    }
  };

  if (!visible) return null;

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
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {confirmation.title}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isBrightnessMaxed && styles.actionButtonActive,
              ]}
              onPress={toggleBrightness}
            >
              <Sun
                size={20}
                color={isBrightnessMaxed ? colors.warning : colors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Share2 size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Event Info */}
          <View style={styles.eventInfo}>
            <View style={styles.infoRow}>
              <Clock size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                {formatDate(confirmation.date)}
                {confirmation.time && ` at ${formatTime(confirmation.time)}`}
              </Text>
            </View>

            <TouchableOpacity style={styles.infoRow} onPress={handleOpenMaps}>
              <MapPin size={16} color={colors.textSecondary} />
              <Text style={styles.infoText} numberOfLines={1}>
                {confirmation.location?.name || confirmation.location?.address || 'Location TBD'}
              </Text>
              <ExternalLink size={14} color={colors.primary} />
            </TouchableOpacity>

            {confirmation.location?.meetingPoint && (
              <View style={styles.meetingPoint}>
                <Text style={styles.meetingPointLabel}>Meeting Point</Text>
                <Text style={styles.meetingPointText}>
                  {confirmation.location.meetingPoint}
                </Text>
              </View>
            )}
          </View>

          {/* Ticket Display */}
          <View style={styles.ticketCard}>
            {currentTicket?.label && (
              <Text style={styles.ticketLabel}>{currentTicket.label}</Text>
            )}

            {renderTicketContent()}

            {/* Ticket holder info */}
            {currentTicket?.holderName && (
              <View style={styles.holderInfo}>
                <Text style={styles.holderLabel}>Ticket Holder</Text>
                <Text style={styles.holderName}>{currentTicket.holderName}</Text>
              </View>
            )}

            {/* Seat info */}
            {(currentTicket?.seat || currentTicket?.section || currentTicket?.row) && (
              <View style={styles.seatInfo}>
                {currentTicket.section && (
                  <View style={styles.seatItem}>
                    <Text style={styles.seatLabel}>Section</Text>
                    <Text style={styles.seatValue}>{currentTicket.section}</Text>
                  </View>
                )}
                {currentTicket.row && (
                  <View style={styles.seatItem}>
                    <Text style={styles.seatLabel}>Row</Text>
                    <Text style={styles.seatValue}>{currentTicket.row}</Text>
                  </View>
                )}
                {currentTicket.seat && (
                  <View style={styles.seatItem}>
                    <Text style={styles.seatLabel}>Seat</Text>
                    <Text style={styles.seatValue}>{currentTicket.seat}</Text>
                  </View>
                )}
                {currentTicket?.gate && (
                  <View style={styles.seatItem}>
                    <Text style={styles.seatLabel}>Gate</Text>
                    <Text style={styles.seatValue}>{currentTicket.gate}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Copy code button */}
            {currentTicket?.code && (
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyCode}
              >
                {copied ? (
                  <>
                    <Check size={16} color={colors.success} />
                    <Text style={[styles.copyButtonText, { color: colors.success }]}>
                      Copied!
                    </Text>
                  </>
                ) : (
                  <>
                    <Copy size={16} color={colors.primary} />
                    <Text style={styles.copyButtonText}>Copy Code</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Confirmation Number */}
          {confirmation.confirmationNumber && (
            <View style={styles.confirmationCard}>
              <Text style={styles.confirmationLabel}>Confirmation Number</Text>
              <Text style={styles.confirmationNumber}>
                {confirmation.confirmationNumber}
              </Text>
            </View>
          )}

          {/* Instructions */}
          {confirmation.specialInstructions && (
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsLabel}>Important Instructions</Text>
              <Text style={styles.instructionsText}>
                {confirmation.specialInstructions}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Navigation for multiple tickets */}
        {tickets.length > 1 && (
          <View style={styles.navigation}>
            <TouchableOpacity
              style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
              onPress={goToPrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={24} color={currentIndex === 0 ? colors.border : colors.text} />
            </TouchableOpacity>

            <View style={styles.navDots}>
              {tickets.map((_, index) => (
                <View
                  key={index}
                  style={[styles.navDot, index === currentIndex && styles.navDotActive]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.navButton,
                currentIndex === tickets.length - 1 && styles.navButtonDisabled,
              ]}
              onPress={goToNext}
              disabled={currentIndex === tickets.length - 1}
            >
              <ChevronRight
                size={24}
                color={currentIndex === tickets.length - 1 ? colors.border : colors.text}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

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
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    paddingBottom: 12,
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
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  actionButtonActive: {
    backgroundColor: `${colors.warning}20`,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  eventInfo: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  meetingPoint: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  meetingPointLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  meetingPointText: {
    fontSize: 14,
    color: colors.text,
  },
  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  ticketLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  // QR
  qrContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  // Barcode
  barcodeContainer: {
    alignItems: 'center',
    padding: 16,
    width: '100%',
  },
  barcodeImage: {
    width: '100%',
    height: 100,
  },
  barcodeCode: {
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  barcodeCodeText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: colors.text,
    textAlign: 'center',
  },
  // PDF
  pdfContainer: {
    padding: 20,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${colors.primary}15`,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  pdfButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  // Passbook
  passbookContainer: {
    padding: 20,
  },
  passbookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#000',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  passbookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Image
  imageContainer: {
    width: '100%',
    alignItems: 'center',
  },
  ticketImage: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.4,
  },
  // Text
  textContainer: {
    padding: 20,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    width: '100%',
  },
  textCode: {
    fontSize: 18,
    fontFamily: 'monospace',
    color: colors.text,
    textAlign: 'center',
  },
  // No ticket
  noTicket: {
    padding: 40,
    alignItems: 'center',
  },
  noTicketText: {
    fontSize: 16,
    color: colors.textTertiary,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
  // Holder info
  holderInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  holderLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  holderName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  // Seat info
  seatInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
  },
  seatItem: {
    alignItems: 'center',
  },
  seatLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  seatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  // Copy button
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  // Confirmation card
  confirmationCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  confirmationLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  confirmationNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  // Instructions card
  instructionsCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    padding: 16,
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  // Navigation
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navButton: {
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navDots: {
    flexDirection: 'row',
    gap: 8,
  },
  navDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  navDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  backgroundSecondary: {
    backgroundColor: colors.backgroundSecondary || colors.surface,
  },
});
