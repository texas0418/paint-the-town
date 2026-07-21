// ============================================================================
// QR Code Generation Utilities for Paint the Town
// ============================================================================

import { Share, Alert, Platform } from 'react-native';
// eslint-disable-next-line import/no-unresolved -- tracked in #3
import * as FileSystem from 'expo-file-system';
// eslint-disable-next-line import/no-unresolved -- tracked in #3
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import {
  ShareableContent,
  ShareableContentType,
  SharePayload,
  QRCodeOptions,
  GeneratedQRCode,
  ShareResult,
  ShareAction,
  VCardData,
  DEFAULT_QR_OPTIONS,
  CONTENT_TYPE_CONFIG,
  TripSharePayload,
  ItinerarySharePayload,
  DateNightSharePayload,
  ActivitySharePayload,
  ConfirmationSharePayload,
  LocationSharePayload,
  ContactSharePayload,
  InviteSharePayload,
  CustomSharePayload,
} from '../types/qrcode';

// ============================================================================
// URL/Value Generation
// ============================================================================

/**
 * Generate the encoded value for a QR code based on content type
 */
export function generateQRValue(content: ShareableContent): string {
  const { payload } = content;

  switch (payload.type) {
    case 'trip':
      return generateTripQRValue(payload);
    case 'itinerary':
      return generateItineraryQRValue(payload);
    case 'date_night':
      return generateDateNightQRValue(payload);
    case 'activity':
      return generateActivityQRValue(payload);
    case 'confirmation':
      return generateConfirmationQRValue(payload);
    case 'location':
      return generateLocationQRValue(payload);
    case 'contact':
      return generateContactQRValue(payload);
    case 'invite':
      return generateInviteQRValue(payload);
    case 'custom':
      return generateCustomQRValue(payload);
    default:
      return content.title;
  }
}

function generateTripQRValue(payload: TripSharePayload): string {
  // Prefer web URL for wider compatibility
  if (payload.shareUrl) {
    return payload.shareUrl;
  }
  // Fallback to deep link
  return `w4nder://trip/${payload.tripId}?code=${payload.shareCode}`;
}

function generateItineraryQRValue(payload: ItinerarySharePayload): string {
  if (payload.shareUrl) {
    return payload.shareUrl;
  }
  return `w4nder://itinerary/${payload.itineraryId}?code=${payload.shareCode}`;
}

function generateDateNightQRValue(payload: DateNightSharePayload): string {
  if (payload.shareUrl) {
    return payload.shareUrl;
  }
  return `w4nder://date/${payload.itineraryId}?code=${payload.shareCode}`;
}

function generateActivityQRValue(payload: ActivitySharePayload): string {
  // If there's a booking URL, use that
  if (payload.bookingUrl) {
    return payload.bookingUrl;
  }

  // If there are coordinates, generate a maps URL
  if (payload.coordinates) {
    const { lat, lng } = payload.coordinates;
    const label = encodeURIComponent(payload.name);
    return `https://maps.google.com/?q=${lat},${lng}&label=${label}`;
  }

  // Deep link to activity
  return `w4nder://activity/${payload.activityId}`;
}

function generateConfirmationQRValue(payload: ConfirmationSharePayload): string {
  // If there's a ticket code, that should be the QR value
  if (payload.ticketCode) {
    return payload.ticketCode;
  }

  // Otherwise, create a structured value
  const data = {
    type: 'confirmation',
    id: payload.confirmationId,
    number: payload.confirmationNumber,
    title: payload.title,
    date: payload.date,
    time: payload.time,
    location: payload.location,
  };

  return JSON.stringify(data);
}

function generateLocationQRValue(payload: LocationSharePayload): string {
  const { coordinates, name, address } = payload;

  // If there's a maps URL, use it
  if (payload.mapsUrl) {
    return payload.mapsUrl;
  }

  // Generate a geo URI with label
  const label = encodeURIComponent(name);
  return `geo:${coordinates.lat},${coordinates.lng}?q=${coordinates.lat},${coordinates.lng}(${label})`;
}

function generateContactQRValue(payload: ContactSharePayload): string {
  // Generate vCard format
  const vcard = generateVCard({
    version: '3.0',
    formattedName: payload.name,
    organization: payload.organization,
    title: payload.title,
    email: payload.email ? [payload.email] : undefined,
    phone: payload.phone ? [{ type: 'CELL', number: payload.phone }] : undefined,
    website: payload.website,
    note: payload.notes,
  });

  return vcard;
}

function generateInviteQRValue(payload: InviteSharePayload): string {
  if (payload.inviteUrl) {
    return payload.inviteUrl;
  }
  return `w4nder://invite/${payload.inviteCode}`;
}

function generateCustomQRValue(payload: CustomSharePayload): string {
  if (payload.format === 'json') {
    try {
      // Ensure it's valid JSON
      JSON.parse(payload.data);
      return payload.data;
    } catch {
      return JSON.stringify({ data: payload.data });
    }
  }

  return payload.data;
}

// ============================================================================
// vCard Generation
// ============================================================================

/**
 * Generate a vCard string from contact data
 */
// eslint-disable-next-line complexity -- tracked in #1
export function generateVCard(data: VCardData): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    `VERSION:${data.version}`,
    `FN:${escapeVCardValue(data.formattedName)}`,
  ];

  if (data.firstName || data.lastName) {
    lines.push(
      `N:${escapeVCardValue(data.lastName || '')};${escapeVCardValue(data.firstName || '')};;;`
    );
  }

  if (data.organization) {
    lines.push(`ORG:${escapeVCardValue(data.organization)}`);
  }

  if (data.title) {
    lines.push(`TITLE:${escapeVCardValue(data.title)}`);
  }

  if (data.email) {
    data.email.forEach((email) => {
      lines.push(`EMAIL:${email}`);
    });
  }

  if (data.phone) {
    data.phone.forEach((phone) => {
      lines.push(`TEL;TYPE=${phone.type}:${phone.number}`);
    });
  }

  if (data.address) {
    const addr = data.address;
    lines.push(
      `ADR:;;${escapeVCardValue(addr.street || '')};${escapeVCardValue(addr.city || '')};${escapeVCardValue(addr.region || '')};${escapeVCardValue(addr.postalCode || '')};${escapeVCardValue(addr.country || '')}`
    );
  }

  if (data.website) {
    lines.push(`URL:${data.website}`);
  }

  if (data.note) {
    lines.push(`NOTE:${escapeVCardValue(data.note)}`);
  }

  lines.push('END:VCARD');

  return lines.join('\r\n');
}

function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

// ============================================================================
// Share Code Generation
// ============================================================================

/**
 * Generate a unique share code
 */
export function generateShareCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a share URL with code
 */
export function generateShareUrl(
  type: ShareableContentType,
  id: string,
  shareCode: string
): string {
  // In production, use your actual domain
  const baseUrl = 'https://w4nder.app';

  switch (type) {
    case 'trip':
      return `${baseUrl}/trip/${shareCode}`;
    case 'itinerary':
      return `${baseUrl}/itinerary/${shareCode}`;
    case 'date_night':
      return `${baseUrl}/date/${shareCode}`;
    case 'invite':
      return `${baseUrl}/invite/${shareCode}`;
    default:
      return `${baseUrl}/share/${shareCode}`;
  }
}

// ============================================================================
// QR Code Image Generation
// ============================================================================

/**
 * Generate a QR code data URL
 * Note: In production, use a library like 'react-native-qrcode-svg' or 'qrcode'
 * This is a placeholder that would be replaced with actual QR generation
 */
export async function generateQRCodeDataUrl(
  value: string,
  options: QRCodeOptions = DEFAULT_QR_OPTIONS
): Promise<string> {
  // In production, this would use a QR code library
  // For now, we'll use a QR code generation API as a fallback
  const encodedValue = encodeURIComponent(value);
  const { size, foregroundColor, backgroundColor } = options;

  // Using QR Server API for generation (free, no API key needed)
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&color=${foregroundColor.replace('#', '')}&bgcolor=${backgroundColor.replace('#', '')}`;

  try {
    // Fetch the image and convert to base64
    const response = await fetch(apiUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('QR generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate a complete QR code object
 */
export async function generateQRCode(
  content: ShareableContent,
  options: Partial<QRCodeOptions> = {}
): Promise<GeneratedQRCode> {
  const mergedOptions = { ...DEFAULT_QR_OPTIONS, ...options };
  const encodedValue = generateQRValue(content);
  const qrDataUrl = await generateQRCodeDataUrl(encodedValue, mergedOptions);

  return {
    id: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    qrDataUrl,
    encodedValue,
    options: mergedOptions,
    generatedAt: new Date().toISOString(),
    expiresAt: content.expiresAt,
  };
}

// ============================================================================
// Share Actions
// ============================================================================

/**
 * Copy the share link to clipboard
 */
export async function copyShareLink(content: ShareableContent): Promise<ShareResult> {
  try {
    const value = generateQRValue(content);
    await Clipboard.setStringAsync(value);

    return {
      success: true,
      action: 'copy_link',
    };
  } catch (error) {
    return {
      success: false,
      action: 'copy_link',
      error: error instanceof Error ? error.message : 'Failed to copy',
    };
  }
}

/**
 * Share via native share sheet
 */
export async function shareNative(
  content: ShareableContent,
  qrDataUrl?: string
): Promise<ShareResult> {
  try {
    const value = generateQRValue(content);
    const config = CONTENT_TYPE_CONFIG[content.type];

    const shareContent: { message: string; title?: string; url?: string } = {
      message: `${config.icon} ${content.title}\n\n${value}`,
      title: content.title,
    };

    // If it's a URL, add it separately
    if (value.startsWith('http')) {
      shareContent.url = value;
    }

    await Share.share(shareContent);

    return {
      success: true,
      action: 'share_native',
    };
  } catch (error) {
    return {
      success: false,
      action: 'share_native',
      error: error instanceof Error ? error.message : 'Share cancelled',
    };
  }
}

/**
 * Save QR code image to device gallery
 */
export async function saveQRCodeToGallery(
  qrDataUrl: string,
  filename?: string
): Promise<ShareResult> {
  try {
    // Request permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to save images to your gallery.');
      return {
        success: false,
        action: 'save_image',
        error: 'Permission denied',
      };
    }

    // Convert base64 to file
    const base64Data = qrDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const fileName = filename || `w4nder_qr_${Date.now()}.png`;
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Save to gallery
    const asset = await MediaLibrary.createAssetAsync(fileUri);

    // Clean up temp file
    await FileSystem.deleteAsync(fileUri, { idempotent: true });

    Alert.alert('Saved!', 'QR code saved to your photos.');

    return {
      success: true,
      action: 'save_image',
      savedPath: asset.uri,
    };
  } catch (error) {
    console.error('Save error:', error);
    return {
      success: false,
      action: 'save_image',
      error: error instanceof Error ? error.message : 'Failed to save',
    };
  }
}

/**
 * Share QR code image
 */
export async function shareQRCodeImage(qrDataUrl: string, title: string): Promise<ShareResult> {
  try {
    // Convert base64 to file
    const base64Data = qrDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const fileName = `w4nder_qr_${Date.now()}.png`;
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();

    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/png',
        dialogTitle: `Share ${title} QR Code`,
      });
    } else {
      // Fallback to native share
      await Share.share({
        title: `${title} QR Code`,
        url: fileUri,
      });
    }

    // Clean up
    await FileSystem.deleteAsync(fileUri, { idempotent: true });

    return {
      success: true,
      action: 'share_image',
    };
  } catch (error) {
    return {
      success: false,
      action: 'share_image',
      error: error instanceof Error ? error.message : 'Share failed',
    };
  }
}

/**
 * Send via SMS
 */
export async function shareViaSMS(
  content: ShareableContent,
  phoneNumber?: string
): Promise<ShareResult> {
  try {
    const value = generateQRValue(content);
    const config = CONTENT_TYPE_CONFIG[content.type];
    const message = encodeURIComponent(`${config.icon} ${content.title}\n\n${value}`);

    const smsUrl = phoneNumber ? `sms:${phoneNumber}&body=${message}` : `sms:&body=${message}`;

    const { Linking } = require('react-native');
    await Linking.openURL(smsUrl);

    return {
      success: true,
      action: 'send_sms',
    };
  } catch (error) {
    return {
      success: false,
      action: 'send_sms',
      error: error instanceof Error ? error.message : 'Failed to open SMS',
    };
  }
}

/**
 * Send via email
 */
export async function shareViaEmail(
  content: ShareableContent,
  emailAddress?: string
): Promise<ShareResult> {
  try {
    const value = generateQRValue(content);
    const config = CONTENT_TYPE_CONFIG[content.type];

    const subject = encodeURIComponent(`${content.title} - Paint the Town`);
    const body = encodeURIComponent(
      `${config.icon} ${content.title}\n\n${content.description || ''}\n\n${value}\n\nShared via Paint the Town`
    );

    const emailUrl = emailAddress
      ? `mailto:${emailAddress}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`;

    const { Linking } = require('react-native');
    await Linking.openURL(emailUrl);

    return {
      success: true,
      action: 'send_email',
    };
  } catch (error) {
    return {
      success: false,
      action: 'send_email',
      error: error instanceof Error ? error.message : 'Failed to open email',
    };
  }
}

// ============================================================================
// Content Helpers
// ============================================================================

/**
 * Create shareable content for a trip
 */
export function createTripShareContent(
  tripId: string,
  tripName: string,
  destination?: string,
  dates?: { start: string; end: string }
): ShareableContent {
  const shareCode = generateShareCode();
  const shareUrl = generateShareUrl('trip', tripId, shareCode);

  return {
    type: 'trip',
    id: tripId,
    title: tripName,
    subtitle: destination,
    description: dates ? `${formatDate(dates.start)} - ${formatDate(dates.end)}` : undefined,
    payload: {
      type: 'trip',
      tripId,
      shareCode,
      shareUrl,
      destination,
      dates,
    },
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create shareable content for a date night
 */
export function createDateNightShareContent(
  itineraryId: string,
  name: string,
  partnerName?: string,
  isSurprise: boolean = false
): ShareableContent {
  const shareCode = generateShareCode();
  const shareUrl = generateShareUrl('date_night', itineraryId, shareCode);

  return {
    type: 'date_night',
    id: itineraryId,
    title: name,
    subtitle: partnerName ? `For ${partnerName}` : undefined,
    description: isSurprise ? 'A surprise awaits!' : undefined,
    payload: {
      type: 'date_night',
      itineraryId,
      shareCode,
      shareUrl,
      partnerName,
      isSurprise,
    },
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create shareable content for a location
 */
export function createLocationShareContent(
  name: string,
  coordinates: { lat: number; lng: number },
  address?: string
): ShareableContent {
  return {
    type: 'location',
    id: `loc_${Date.now()}`,
    title: name,
    subtitle: address,
    payload: {
      type: 'location',
      name,
      address,
      coordinates,
    },
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create shareable content for a contact
 */
export function createContactShareContent(
  name: string,
  details: Partial<ContactSharePayload>
): ShareableContent {
  return {
    type: 'contact',
    id: `contact_${Date.now()}`,
    title: name,
    subtitle: details.organization || details.title,
    payload: {
      type: 'contact',
      name,
      ...details,
    },
    createdAt: new Date().toISOString(),
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get display info for content type
 */
export function getContentTypeInfo(type: ShareableContentType) {
  return CONTENT_TYPE_CONFIG[type];
}

/**
 * Validate a share code format
 */
export function isValidShareCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Extract share code from URL
 */
export function extractShareCode(url: string): string | null {
  const patterns = [/w4nder\.app\/\w+\/([A-Z0-9]{6})/i, /code=([A-Z0-9]{6})/i, /\/([A-Z0-9]{6})$/i];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }

  return null;
}
