import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Share,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import {
  X,
  Link2,
  Copy,
  Share2,
  UserPlus,
  Check,
  RefreshCw,
  Heart,
  QrCode,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { generateShareCode, validateShareCode } from '@/utils/availabilityUtils';

interface PartnerSyncSheetProps {
  visible: boolean;
  onClose: () => void;
  onCodeGenerated: (code: string) => void;
  onCodeEntered: (code: string) => void;
  partnerName?: string;
  isLinked: boolean;
  lastSynced?: string;
}

type Mode = 'main' | 'generate' | 'enter';

export default function PartnerSyncSheet({
  visible,
  onClose,
  onCodeGenerated,
  onCodeEntered,
  partnerName,
  isLinked,
  lastSynced,
}: PartnerSyncSheetProps) {
  const [mode, setMode] = useState<Mode>('main');
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = () => {
    const code = generateShareCode();
    setShareCode(code);
    setMode('generate');
    onCodeGenerated(code);
  };

  const handleCopyCode = async () => {
    if (shareCode) {
      await Clipboard.setString(shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareCode = async () => {
    if (shareCode) {
      try {
        await Share.share({
          message: `Join my Paint the Town date planning! Enter this code: ${shareCode}`,
          title: 'Paint the Town Invitation',
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  const handleEnterCode = async () => {
    const cleanCode = enteredCode.toUpperCase().replace(/\s/g, '');
    
    if (!validateShareCode(cleanCode)) {
      setError('Please enter a valid 6-character code');
      return;
    }

    setLoading(true);
    setError(null);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onCodeEntered(cleanCode);
      Alert.alert(
        'Connected!',
        'You are now synced with your partner. Your calendars will be compared to find mutual free times.',
        [{ text: 'Great!', onPress: () => { setMode('main'); onClose(); } }]
      );
    }, 1500);
  };

  const handleResync = async () => {
    setLoading(true);
    // Simulate resync
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Synced!', 'Availability has been updated.');
    }, 1000);
  };

  const handleUnlink = () => {
    Alert.alert(
      'Unlink Partner',
      'Are you sure you want to unlink? You will need to reconnect to share availability again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unlink', 
          style: 'destructive',
          onPress: () => {
            // Handle unlink
            onClose();
          }
        },
      ]
    );
  };

  const renderMainContent = () => {
    if (isLinked && partnerName) {
      // Linked state
      return (
        <View style={styles.linkedContainer}>
          <View style={styles.partnerInfo}>
            <View style={styles.partnerAvatar}>
              <Heart size={24} color={colors.secondary} />
            </View>
            <View style={styles.partnerDetails}>
              <Text style={styles.partnerName}>{partnerName}</Text>
              <Text style={styles.linkedStatus}>
                <Check size={12} color={colors.success} /> Connected
              </Text>
            </View>
          </View>

          {lastSynced && (
            <Text style={styles.lastSynced}>
              Last synced: {new Date(lastSynced).toLocaleString()}
            </Text>
          )}

          <View style={styles.linkedActions}>
            <TouchableOpacity
              style={styles.resyncButton}
              onPress={handleResync}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <RefreshCw size={18} color={colors.primary} />
              )}
              <Text style={styles.resyncButtonText}>Sync Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.unlinkButton}
              onPress={handleUnlink}
            >
              <Text style={styles.unlinkButtonText}>Unlink Partner</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Not linked - show options
    return (
      <View style={styles.optionsContainer}>
        <View style={styles.illustration}>
          <View style={styles.illustrationCircle}>
            <Heart size={40} color={colors.secondary} />
          </View>
        </View>

        <Text style={styles.descriptionText}>
          Connect with your partner to automatically find times when you&apos;re both free
        </Text>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleGenerateCode}
          activeOpacity={0.7}
        >
          <View style={[styles.optionIcon, { backgroundColor: `${colors.primary}15` }]}>
            <Link2 size={22} color={colors.primary} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Share Your Code</Text>
            <Text style={styles.optionDescription}>
              Generate a code for your partner to enter
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => setMode('enter')}
          activeOpacity={0.7}
        >
          <View style={[styles.optionIcon, { backgroundColor: `${colors.secondary}15` }]}>
            <UserPlus size={22} color={colors.secondary} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Enter Partner&apos;s Code</Text>
            <Text style={styles.optionDescription}>
              Have a code? Enter it to connect
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderGenerateContent = () => (
    <View style={styles.codeContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setMode('main')}
      >
        <X size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.codeIllustration}>
        <QrCode size={48} color={colors.primary} />
      </View>

      <Text style={styles.codeTitle}>Share This Code</Text>
      <Text style={styles.codeDescription}>
        Give this code to your partner. It expires in 24 hours.
      </Text>

      <View style={styles.codeDisplay}>
        <Text style={styles.codeText}>{shareCode}</Text>
      </View>

      <View style={styles.codeActions}>
        <TouchableOpacity
          style={[styles.codeActionButton, copied && styles.codeActionButtonSuccess]}
          onPress={handleCopyCode}
        >
          {copied ? (
            <Check size={18} color={colors.success} />
          ) : (
            <Copy size={18} color={colors.primary} />
          )}
          <Text style={[
            styles.codeActionText,
            copied && { color: colors.success }
          ]}>
            {copied ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.codeActionButton}
          onPress={handleShareCode}
        >
          <Share2 size={18} color={colors.primary} />
          <Text style={styles.codeActionText}>Share</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.waitingText}>
        Waiting for your partner to enter the code...
      </Text>
    </View>
  );

  const renderEnterContent = () => (
    <View style={styles.enterContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => { setMode('main'); setError(null); setEnteredCode(''); }}
      >
        <X size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.enterIllustration}>
        <UserPlus size={48} color={colors.secondary} />
      </View>

      <Text style={styles.enterTitle}>Enter Partner&apos;s Code</Text>
      <Text style={styles.enterDescription}>
        Enter the 6-character code your partner shared with you
      </Text>

      <TextInput
        style={[styles.codeInput, error && styles.codeInputError]}
        value={enteredCode}
        onChangeText={(text) => {
          setEnteredCode(text.toUpperCase());
          setError(null);
        }}
        placeholder="ABC123"
        placeholderTextColor={colors.textTertiary}
        autoCapitalize="characters"
        maxLength={6}
        autoFocus
      />

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.connectButton,
          (enteredCode.length < 6 || loading) && styles.connectButtonDisabled,
        ]}
        onPress={handleEnterCode}
        disabled={enteredCode.length < 6 || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.connectButtonText}>Connect</Text>
        )}
      </TouchableOpacity>
    </View>
  );

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
          <Text style={styles.title}>Partner Sync</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {mode === 'main' && renderMainContent()}
          {mode === 'generate' && renderGenerateContent()}
          {mode === 'enter' && renderEnterContent()}
        </View>
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
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // Linked state styles
  linkedContainer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    width: '100%',
    marginBottom: 12,
  },
  partnerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.secondary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerDetails: {
    marginLeft: 16,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  linkedStatus: {
    fontSize: 13,
    color: colors.success,
    marginTop: 2,
  },
  lastSynced: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  linkedActions: {
    width: '100%',
    gap: 12,
  },
  resyncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${colors.primary}10`,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  resyncButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  unlinkButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  unlinkButtonText: {
    fontSize: 14,
    color: colors.error,
  },
  // Options styles
  optionsContainer: {
    paddingTop: 24,
  },
  illustration: {
    alignItems: 'center',
    marginBottom: 24,
  },
  illustrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.secondary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: 14,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  optionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Generate code styles
  codeContainer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 8,
  },
  codeIllustration: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  codeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  codeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  codeDisplay: {
    backgroundColor: colors.surface,
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 8,
    fontFamily: 'monospace',
  },
  codeActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  codeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: `${colors.primary}10`,
  },
  codeActionButtonSuccess: {
    backgroundColor: `${colors.success}10`,
  },
  codeActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  waitingText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  // Enter code styles
  enterContainer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  enterIllustration: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.secondary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  enterTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  enterDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  codeInput: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 8,
    textAlign: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    width: '100%',
    maxWidth: 260,
    marginBottom: 12,
  },
  codeInputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    marginBottom: 12,
  },
  connectButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 12,
  },
  connectButtonDisabled: {
    backgroundColor: colors.border,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
