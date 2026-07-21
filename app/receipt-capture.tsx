// Paint the Town Receipt Scanner - Receipt Capture Screen

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useReceiptScanner } from '../hooks/useReceiptScanner';

interface ReceiptCaptureScreenProps {
  navigation?: any;
  tripId?: string;
  onCaptureComplete?: (receiptId: string) => void;
}

const ReceiptCaptureScreen: React.FC<ReceiptCaptureScreenProps> = ({
  navigation,
  tripId,
  onCaptureComplete,
}) => {
  const {
    captureFromCamera,
    pickFromGallery,
    isProcessing,
    processingProgress,
    processingError,
    currentReceipt,
    isCameraReady,
    retryProcessing,
    clearCurrent,
    pendingReceipts,
  } = useReceiptScanner({ tripId });

  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);

  const handleCapture = useCallback(async () => {
    const receipt = await captureFromCamera();
    if (receipt) {
      setCapturedImageUri(receipt.image.uri);
      onCaptureComplete?.(receipt.id);
      navigation?.navigate('ReceiptReview', { receiptId: receipt.id });
    }
  }, [captureFromCamera, navigation, onCaptureComplete]);

  const handlePickGallery = useCallback(async () => {
    const receipt = await pickFromGallery();
    if (receipt) {
      setCapturedImageUri(receipt.image.uri);
      onCaptureComplete?.(receipt.id);
      navigation?.navigate('ReceiptReview', { receiptId: receipt.id });
    }
  }, [pickFromGallery, navigation, onCaptureComplete]);

  const handleRetry = useCallback(async () => {
    const receipt = await retryProcessing();
    if (receipt) {
      navigation?.navigate('ReceiptReview', { receiptId: receipt.id });
    }
  }, [retryProcessing, navigation]);

  const handleDismissError = useCallback(() => {
    clearCurrent();
    setCapturedImageUri(null);
  }, [clearCurrent]);

  const getProgressMessage = (): string => {
    if (!processingProgress) return 'Processing...';
    return processingProgress.message;
  };

  const getProgressPercent = (): number => {
    return processingProgress?.progress || 0;
  };

  // Processing overlay
  if (isProcessing) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.processingContainer}>
          {capturedImageUri && (
            <Image
              source={{ uri: capturedImageUri }}
              style={styles.processingImage}
              blurRadius={3}
            />
          )}
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.processingTitle}>Scanning Receipt</Text>
              <Text style={styles.processingMessage}>{getProgressMessage()}</Text>

              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${getProgressPercent()}%` }]} />
              </View>
              <Text style={styles.progressPercent}>{getProgressPercent()}%</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Error state
  if (processingError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          {capturedImageUri && (
            <Image source={{ uri: capturedImageUri }} style={styles.errorImage} />
          )}
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Processing Failed</Text>
            <Text style={styles.errorMessage}>{processingError.message}</Text>

            <View style={styles.errorActions}>
              {processingError.retryable && (
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.dismissButton} onPress={handleDismissError}>
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Receipt</Text>
        {pendingReceipts.length > 0 && (
          <TouchableOpacity
            style={styles.pendingBadge}
            onPress={() => navigation?.navigate('ReceiptList')}
          >
            <Text style={styles.pendingCount}>{pendingReceipts.length}</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <View style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsIcon}>📸</Text>
          <Text style={styles.instructionsTitle}>Capture your receipt</Text>
          <Text style={styles.instructionsText}>
            Take a clear photo of your receipt and we'll automatically extract the merchant, date,
            amount, and more.
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips for best results:</Text>
          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>Place receipt on a flat, dark surface</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>📐</Text>
            <Text style={styles.tipText}>Make sure all text is visible and in focus</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>🔆</Text>
            <Text style={styles.tipText}>Ensure good lighting without shadows</Text>
          </View>
        </View>

        {/* Capture Options */}
        <View style={styles.captureOptions}>
          <TouchableOpacity
            style={[styles.captureButton, !isCameraReady && styles.captureButtonDisabled]}
            onPress={handleCapture}
            disabled={!isCameraReady}
          >
            <View style={styles.captureButtonInner}>
              <Text style={styles.captureButtonIcon}>📷</Text>
            </View>
            <Text style={styles.captureButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.galleryButton} onPress={handlePickGallery}>
            <Text style={styles.galleryButtonIcon}>🖼️</Text>
            <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Recent receipts link */}
        {pendingReceipts.length > 0 && (
          <TouchableOpacity
            style={styles.recentLink}
            onPress={() => navigation?.navigate('ReceiptList')}
          >
            <Text style={styles.recentLinkText}>
              📋 {pendingReceipts.length} receipt{pendingReceipts.length > 1 ? 's' : ''} pending
              review
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  pendingBadge: {
    backgroundColor: '#FF9500',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  instructionsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  tipsContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8860B',
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  captureOptions: {
    alignItems: 'center',
  },
  captureButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  captureButtonIcon: {
    fontSize: 32,
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  galleryButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  galleryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  recentLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  recentLinkText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  // Processing state
  processingContainer: {
    flex: 1,
  },
  processingImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  processingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  processingCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  processingMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  // Error state
  errorContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  errorImage: {
    width: '100%',
    height: 300,
    opacity: 0.5,
  },
  errorCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 32,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dismissButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

export default ReceiptCaptureScreen;
