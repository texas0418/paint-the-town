// ============================================================================
// QRCodeDisplay Component
// Inline QR code viewer for embedding in cards, sheets, and detail screens
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  QrCode,
  Share2,
  Copy,
  Download,
  RefreshCw,
  Check,
  ExternalLink,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useQRCode } from '@/hooks/useQRCode';
import {
  ShareableContent,
  CONTENT_TYPE_CONFIG,
} from '@/types/qrcode';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// Props
// ============================================================================

interface QRCodeDisplayProps {
  // Content
  content?: ShareableContent;
  value?: string; // Direct URL/string to encode
  title?: string;
  
  // Sizing
  size?: 'small' | 'medium' | 'large' | number;
  
  // Style variants
  variant?: 'card' | 'minimal' | 'ticket' | 'branded';
  
  // Colors
  accentColor?: string;
  backgroundColor?: string;
  
  // Actions
  showActions?: boolean;
  onShare?: () => void;
  onCopy?: () => void;
  onSave?: () => void;
  
  // Loading state from parent
  loading?: boolean;
}

// ============================================================================
// Size Mapping
// ============================================================================

const SIZE_MAP = {
  small: 120,
  medium: 180,
  large: 250,
};

// ============================================================================
// Component
// ============================================================================

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  content,
  value,
  title,
  size = 'medium',
  variant = 'card',
  accentColor,
  backgroundColor = '#FFFFFF',
  showActions = true,
  onShare,
  onCopy,
  onSave,
  loading: externalLoading,
// eslint-disable-next-line complexity -- tracked in #1
}) => {
  const {
    qrCode,
    isGenerating,
    generate,
    generateForUrl,
    copyLink,
    shareNatively,
    saveToGallery,
  } = useQRCode();

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Calculate QR size
  const qrSize = typeof size === 'number' ? size : SIZE_MAP[size];

  // Generate QR code on mount or when content changes
  useEffect(() => {
    if (content) {
      generate(content);
    } else if (value) {
      generateForUrl(value, title);
    }
  }, [content, value]);

  // Handle actions
  const handleCopy = async () => {
    if (onCopy) {
      onCopy();
    } else {
      const result = await copyLink();
      if (result.success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleShare = async () => {
    if (onShare) {
      onShare();
    } else {
      await shareNatively();
    }
  };

  const handleSave = async () => {
    if (onSave) {
      onSave();
    } else {
      const result = await saveToGallery();
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    }
  };

  // Get content config for styling
  const config = content ? CONTENT_TYPE_CONFIG[content.type] : null;
  const displayColor = accentColor || config?.color || colors.primary;

  const isLoading = externalLoading || isGenerating;

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Minimal Variant
  // ─────────────────────────────────────────────────────────────────────────
  
  if (variant === 'minimal') {
    return (
      <View style={styles.minimalContainer}>
        {isLoading ? (
          <View style={[styles.minimalPlaceholder, { width: qrSize, height: qrSize }]}>
            <ActivityIndicator color={displayColor} />
          </View>
        ) : qrCode?.qrDataUrl ? (
          <Image
            source={{ uri: qrCode.qrDataUrl }}
            style={{ width: qrSize, height: qrSize }}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.minimalPlaceholder, { width: qrSize, height: qrSize }]}>
            <QrCode size={qrSize * 0.4} color={colors.textTertiary} />
          </View>
        )}
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Ticket Variant
  // ─────────────────────────────────────────────────────────────────────────
  
  if (variant === 'ticket') {
    return (
      <View style={[styles.ticketContainer, { backgroundColor }]}>
        {/* Ticket Header */}
        {(title || content?.title) && (
          <View style={styles.ticketHeader}>
            {config && <Text style={styles.ticketIcon}>{config.icon}</Text>}
            <Text style={styles.ticketTitle} numberOfLines={1}>
              {title || content?.title}
            </Text>
          </View>
        )}
        
        {/* QR Code */}
        <View style={styles.ticketQRWrapper}>
          {isLoading ? (
            <View style={[styles.ticketQRPlaceholder, { width: qrSize, height: qrSize }]}>
              <ActivityIndicator color={displayColor} />
            </View>
          ) : qrCode?.qrDataUrl ? (
            <Image
              source={{ uri: qrCode.qrDataUrl }}
              style={{ width: qrSize, height: qrSize }}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.ticketQRPlaceholder, { width: qrSize, height: qrSize }]}>
              <QrCode size={qrSize * 0.3} color={colors.textTertiary} />
            </View>
          )}
        </View>
        
        {/* Ticket Footer */}
        <View style={styles.ticketFooter}>
          <Text style={styles.ticketHint}>Scan to open</Text>
          {showActions && (
            <View style={styles.ticketActions}>
              <Pressable onPress={handleCopy} style={styles.ticketAction}>
                {copied ? (
                  <Check size={16} color="#22C55E" />
                ) : (
                  <Copy size={16} color={displayColor} />
                )}
              </Pressable>
              <Pressable onPress={handleShare} style={styles.ticketAction}>
                <Share2 size={16} color={displayColor} />
              </Pressable>
            </View>
          )}
        </View>
        
        {/* Ticket Perforations */}
        <View style={styles.ticketPerfTop}>
          {Array.from({ length: 12 }).map((_, i) => (
            <View key={`top-${i}`} style={styles.ticketDot} />
          ))}
        </View>
        <View style={styles.ticketPerfBottom}>
          {Array.from({ length: 12 }).map((_, i) => (
            <View key={`bottom-${i}`} style={styles.ticketDot} />
          ))}
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Branded Variant
  // ─────────────────────────────────────────────────────────────────────────
  
  if (variant === 'branded') {
    return (
      <View style={styles.brandedContainer}>
        <LinearGradient
          colors={[`${displayColor}15`, `${displayColor}05`]}
          style={styles.brandedGradient}
        >
          {/* Header */}
          {(title || content?.title) && (
            <View style={styles.brandedHeader}>
              {config && (
                <View style={[styles.brandedIcon, { backgroundColor: `${displayColor}20` }]}>
                  <Text style={styles.brandedIconText}>{config.icon}</Text>
                </View>
              )}
              <View style={styles.brandedTextContainer}>
                <Text style={styles.brandedTitle} numberOfLines={1}>
                  {title || content?.title}
                </Text>
                {content?.subtitle && (
                  <Text style={styles.brandedSubtitle} numberOfLines={1}>
                    {content.subtitle}
                  </Text>
                )}
              </View>
            </View>
          )}
          
          {/* QR Code */}
          <View style={styles.brandedQRWrapper}>
            <View style={styles.brandedQRCard}>
              {isLoading ? (
                <View style={[styles.brandedQRPlaceholder, { width: qrSize, height: qrSize }]}>
                  <ActivityIndicator color={displayColor} size="large" />
                </View>
              ) : qrCode?.qrDataUrl ? (
                <Image
                  source={{ uri: qrCode.qrDataUrl }}
                  style={{ width: qrSize, height: qrSize }}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.brandedQRPlaceholder, { width: qrSize, height: qrSize }]}>
                  <QrCode size={qrSize * 0.3} color={colors.textTertiary} />
                  <Pressable style={styles.brandedRetry} onPress={() => content && generate(content)}>
                    <RefreshCw size={14} color={displayColor} />
                    <Text style={[styles.brandedRetryText, { color: displayColor }]}>Retry</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
          
          {/* Actions */}
          {showActions && qrCode && (
            <View style={styles.brandedActions}>
              <Pressable
                style={[styles.brandedAction, copied && styles.brandedActionSuccess]}
                onPress={handleCopy}
              >
                {copied ? (
                  <Check size={18} color="#22C55E" />
                ) : (
                  <Copy size={18} color={displayColor} />
                )}
                <Text style={[styles.brandedActionText, { color: copied ? '#22C55E' : displayColor }]}>
                  {copied ? 'Copied!' : 'Copy'}
                </Text>
              </Pressable>
              
              <Pressable
                style={[styles.brandedAction, saved && styles.brandedActionSuccess]}
                onPress={handleSave}
              >
                {saved ? (
                  <Check size={18} color="#22C55E" />
                ) : (
                  <Download size={18} color={displayColor} />
                )}
                <Text style={[styles.brandedActionText, { color: saved ? '#22C55E' : displayColor }]}>
                  {saved ? 'Saved!' : 'Save'}
                </Text>
              </Pressable>
              
              <Pressable style={styles.brandedAction} onPress={handleShare}>
                <Share2 size={18} color={displayColor} />
                <Text style={[styles.brandedActionText, { color: displayColor }]}>Share</Text>
              </Pressable>
            </View>
          )}
          
          {/* Footer */}
          <Text style={styles.brandedFooter}>Scan with any camera app</Text>
        </LinearGradient>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Card Variant (Default)
  // ─────────────────────────────────────────────────────────────────────────
  
  return (
    <View style={[styles.cardContainer, { backgroundColor }]}>
      {/* Title */}
      {(title || content?.title) && (
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title || content?.title}
        </Text>
      )}
      
      {/* QR Code */}
      <View style={styles.cardQRWrapper}>
        {isLoading ? (
          <View style={[styles.cardQRPlaceholder, { width: qrSize, height: qrSize }]}>
            <ActivityIndicator color={displayColor} />
          </View>
        ) : qrCode?.qrDataUrl ? (
          <View style={styles.cardQRShadow}>
            <Image
              source={{ uri: qrCode.qrDataUrl }}
              style={{ width: qrSize, height: qrSize }}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={[styles.cardQRPlaceholder, { width: qrSize, height: qrSize }]}>
            <QrCode size={qrSize * 0.3} color={colors.textTertiary} />
          </View>
        )}
      </View>
      
      {/* Actions */}
      {showActions && qrCode && (
        <View style={styles.cardActions}>
          <Pressable style={styles.cardAction} onPress={handleCopy}>
            {copied ? (
              <Check size={16} color="#22C55E" />
            ) : (
              <Copy size={16} color={colors.textSecondary} />
            )}
          </Pressable>
          <Pressable style={styles.cardAction} onPress={handleSave}>
            {saved ? (
              <Check size={16} color="#22C55E" />
            ) : (
              <Download size={16} color={colors.textSecondary} />
            )}
          </Pressable>
          <Pressable style={styles.cardAction} onPress={handleShare}>
            <Share2 size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Minimal
  minimalContainer: {
    alignItems: 'center',
  },
  minimalPlaceholder: {
    backgroundColor: colors.background,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Card
  cardContainer: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  cardQRWrapper: {
    alignItems: 'center',
  },
  cardQRShadow: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardQRPlaceholder: {
    backgroundColor: colors.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
  cardAction: {
    padding: 8,
  },

  // Ticket
  ticketContainer: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  ticketIcon: {
    fontSize: 20,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  ticketQRWrapper: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
  },
  ticketQRPlaceholder: {
    backgroundColor: colors.background,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  ticketHint: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  ticketActions: {
    flexDirection: 'row',
    gap: 12,
  },
  ticketAction: {
    padding: 8,
  },
  ticketPerfTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  ticketPerfBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  ticketDot: {
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.background,
  },

  // Branded
  brandedContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  brandedGradient: {
    padding: 20,
    alignItems: 'center',
  },
  brandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  brandedIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brandedIconText: {
    fontSize: 22,
  },
  brandedTextContainer: {
    flex: 1,
  },
  brandedTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  brandedSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  brandedQRWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandedQRCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  brandedQRPlaceholder: {
    backgroundColor: colors.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandedRetry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  brandedRetryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  brandedActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  brandedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
  },
  brandedActionSuccess: {
    backgroundColor: '#DCFCE7',
  },
  brandedActionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  brandedFooter: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default QRCodeDisplay;
