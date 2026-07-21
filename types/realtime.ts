// ============================================================================
// WebSocket Types for Paint the Town Real-time Updates
// ============================================================================

// ============================================================================
// Connection Types
// ============================================================================

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export interface ConnectionInfo {
  status: ConnectionStatus;
  connectedAt?: Date;
  reconnectAttempts: number;
  latency?: number;
  lastPingAt?: Date;
  lastPongAt?: Date;
}

export interface WebSocketConfig {
  // Server URL
  url: string;

  // Authentication
  authToken?: string;
  userId?: string;
  deviceId?: string;

  // Reconnection
  autoReconnect: boolean;
  reconnectInterval: number; // ms
  maxReconnectAttempts: number;
  reconnectBackoff: 'linear' | 'exponential';

  // Heartbeat
  enableHeartbeat: boolean;
  heartbeatInterval: number; // ms
  heartbeatTimeout: number; // ms

  // Debugging
  debug: boolean;
  logMessages: boolean;
}

export const DEFAULT_WS_CONFIG: WebSocketConfig = {
  url: 'wss://api.paintthetown.app/ws',
  autoReconnect: true,
  reconnectInterval: 1000,
  maxReconnectAttempts: 10,
  reconnectBackoff: 'exponential',
  enableHeartbeat: true,
  heartbeatInterval: 30000,
  heartbeatTimeout: 5000,
  debug: __DEV__,
  logMessages: __DEV__,
};

// ============================================================================
// Message Types
// ============================================================================

export type MessageType =
  // Connection
  | 'connect'
  | 'disconnect'
  | 'ping'
  | 'pong'
  | 'auth'
  | 'auth_success'
  | 'auth_error'

  // Subscriptions
  | 'subscribe'
  | 'unsubscribe'
  | 'subscribed'
  | 'unsubscribed'

  // Itinerary updates
  | 'itinerary_updated'
  | 'itinerary_activity_added'
  | 'itinerary_activity_updated'
  | 'itinerary_activity_removed'
  | 'itinerary_activity_reordered'

  // Partner updates
  | 'partner_joined'
  | 'partner_left'
  | 'partner_typing'
  | 'partner_viewing'
  | 'partner_location'
  | 'partner_arrived'
  | 'partner_running_late'

  // Sharing updates
  | 'share_created'
  | 'share_viewed'
  | 'share_accepted'
  | 'share_declined'
  | 'share_revoked'
  | 'suggestion_received'
  | 'suggestion_responded'

  // Trip updates
  | 'trip_updated'
  | 'trip_collaborator_joined'
  | 'trip_collaborator_left'

  // Booking updates
  | 'booking_confirmed'
  | 'booking_updated'
  | 'booking_cancelled'
  | 'booking_reminder'

  // Location updates
  | 'location_update'
  | 'geofence_enter'
  | 'geofence_exit'

  // Notifications
  | 'notification'
  | 'notification_read'

  // Presence
  | 'presence_update'
  | 'user_online'
  | 'user_offline'

  // Errors
  | 'error';

export interface BaseMessage {
  type: MessageType;
  id: string;
  timestamp: string;
  userId?: string;
}

// ============================================================================
// Outgoing Messages (Client -> Server)
// ============================================================================

export interface AuthMessage extends BaseMessage {
  type: 'auth';
  payload: {
    token: string;
    deviceId: string;
    platform: 'ios' | 'android' | 'web';
    appVersion: string;
  };
}

export interface SubscribeMessage extends BaseMessage {
  type: 'subscribe';
  payload: {
    channel: ChannelType;
    resourceId: string;
  };
}

export interface UnsubscribeMessage extends BaseMessage {
  type: 'unsubscribe';
  payload: {
    channel: ChannelType;
    resourceId: string;
  };
}

export interface LocationUpdateMessage extends BaseMessage {
  type: 'location_update';
  payload: {
    coordinates: {
      lat: number;
      lng: number;
    };
    accuracy?: number;
    heading?: number;
    speed?: number;
    altitude?: number;
  };
}

export interface PartnerTypingMessage extends BaseMessage {
  type: 'partner_typing';
  payload: {
    itineraryId: string;
    isTyping: boolean;
  };
}

export interface PartnerViewingMessage extends BaseMessage {
  type: 'partner_viewing';
  payload: {
    resourceType: 'itinerary' | 'activity' | 'trip';
    resourceId: string;
  };
}

// ============================================================================
// Incoming Messages (Server -> Client)
// ============================================================================

export interface AuthSuccessMessage extends BaseMessage {
  type: 'auth_success';
  payload: {
    sessionId: string;
    serverTime: string;
  };
}

export interface AuthErrorMessage extends BaseMessage {
  type: 'auth_error';
  payload: {
    code: string;
    message: string;
  };
}

export interface ItineraryUpdatedMessage extends BaseMessage {
  type: 'itinerary_updated';
  payload: {
    itineraryId: string;
    updatedBy: string;
    updatedByName: string;
    changes: {
      field: string;
      oldValue?: any;
      newValue: any;
    }[];
  };
}

export interface ActivityUpdateMessage extends BaseMessage {
  type: 'itinerary_activity_added' | 'itinerary_activity_updated' | 'itinerary_activity_removed';
  payload: {
    itineraryId: string;
    activityId: string;
    activity?: any;
    updatedBy: string;
    updatedByName: string;
  };
}

export interface PartnerJoinedMessage extends BaseMessage {
  type: 'partner_joined';
  payload: {
    resourceType: 'itinerary' | 'trip';
    resourceId: string;
    partnerId: string;
    partnerName: string;
    partnerAvatar?: string;
  };
}

export interface PartnerLeftMessage extends BaseMessage {
  type: 'partner_left';
  payload: {
    resourceType: 'itinerary' | 'trip';
    resourceId: string;
    partnerId: string;
    partnerName: string;
  };
}

export interface PartnerLocationMessage extends BaseMessage {
  type: 'partner_location';
  payload: {
    partnerId: string;
    partnerName: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    accuracy?: number;
    heading?: number;
    updatedAt: string;
  };
}

export interface ShareViewedMessage extends BaseMessage {
  type: 'share_viewed';
  payload: {
    shareId: string;
    itineraryId: string;
    viewedBy: string;
    viewedByName: string;
    viewedAt: string;
  };
}

export interface SuggestionReceivedMessage extends BaseMessage {
  type: 'suggestion_received';
  payload: {
    suggestionId: string;
    itineraryId: string;
    activityId?: string;
    suggestedBy: string;
    suggestedByName: string;
    type: 'time_change' | 'activity_swap' | 'add_activity' | 'note';
    message: string;
    suggestedValue?: any;
  };
}

export interface BookingUpdateMessage extends BaseMessage {
  type: 'booking_confirmed' | 'booking_updated' | 'booking_cancelled';
  payload: {
    bookingId: string;
    confirmationNumber?: string;
    status: string;
    changes?: Record<string, any>;
  };
}

export interface NotificationMessage extends BaseMessage {
  type: 'notification';
  payload: {
    notificationId: string;
    title: string;
    body: string;
    category: string;
    data?: Record<string, any>;
    actionUrl?: string;
  };
}

export interface PresenceUpdateMessage extends BaseMessage {
  type: 'presence_update';
  payload: {
    userId: string;
    userName: string;
    status: 'online' | 'away' | 'offline';
    lastSeenAt?: string;
    currentActivity?: string;
  };
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  payload: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================================================
// Channel Types
// ============================================================================

export type ChannelType =
  | 'user' // Personal updates
  | 'itinerary' // Specific itinerary updates
  | 'trip' // Trip collaboration
  | 'partner' // Partner-specific updates
  | 'booking' // Booking status updates
  | 'location' // Location sharing
  | 'notifications'; // Push notification bridge

export interface Channel {
  type: ChannelType;
  resourceId: string;
  subscribedAt: Date;
  lastMessageAt?: Date;
}

// ============================================================================
// Event Handlers
// ============================================================================

export type MessageHandler<T = any> = (message: T) => void;

export interface EventHandlers {
  // Connection events
  onConnect?: () => void;
  onDisconnect?: (reason?: string) => void;
  onReconnecting?: (attempt: number) => void;
  onError?: (error: Error) => void;

  // Authentication
  onAuthSuccess?: (sessionId: string) => void;
  onAuthError?: (error: { code: string; message: string }) => void;

  // Generic message handler
  onMessage?: (message: BaseMessage) => void;
}

// ============================================================================
// Subscription Types
// ============================================================================

export interface Subscription {
  id: string;
  channel: ChannelType;
  resourceId: string;
  handler: MessageHandler;
  filter?: (message: BaseMessage) => boolean;
}

// ============================================================================
// Queue Types (for offline support)
// ============================================================================

export interface QueuedMessage {
  id: string;
  message: BaseMessage;
  queuedAt: Date;
  attempts: number;
  maxAttempts: number;
}

// ============================================================================
// Presence Types
// ============================================================================

export interface UserPresence {
  userId: string;
  userName: string;
  userAvatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeenAt: Date;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  currentActivity?: string;
}

export interface PresenceState {
  users: Map<string, UserPresence>;
  lastUpdated: Date;
}

// ============================================================================
// Sync Types
// ============================================================================

export interface SyncState {
  lastSyncAt: Date;
  pendingChanges: number;
  isSyncing: boolean;
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  id: string;
  resourceType: string;
  resourceId: string;
  localValue: any;
  remoteValue: any;
  localTimestamp: Date;
  remoteTimestamp: Date;
  resolvedAt?: Date;
  resolution?: 'local' | 'remote' | 'merged';
}

// ============================================================================
// Typing Indicator Types
// ============================================================================

export interface TypingIndicator {
  userId: string;
  userName: string;
  resourceId: string;
  startedAt: Date;
  expiresAt: Date;
}

// ============================================================================
// Component Props
// ============================================================================

export interface RealtimeProviderProps {
  children: React.ReactNode;
  config?: Partial<WebSocketConfig>;
  authToken?: string;
  userId?: string;
  onConnectionChange?: (status: ConnectionStatus) => void;
}

export interface UseRealtimeOptions {
  autoConnect?: boolean;
  channels?: { type: ChannelType; resourceId: string }[];
}
