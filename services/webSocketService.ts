// ============================================================================
// WebSocket Service for Paint the Town Real-time Updates
// Core service with connection management, reconnection, and message handling
// ============================================================================

import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// eslint-disable-next-line import/no-unresolved -- tracked in #3
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import {
  ConnectionStatus,
  ConnectionInfo,
  WebSocketConfig,
  DEFAULT_WS_CONFIG,
  MessageType,
  BaseMessage,
  AuthMessage,
  SubscribeMessage,
  UnsubscribeMessage,
  ChannelType,
  Channel,
  Subscription,
  QueuedMessage,
  EventHandlers,
  MessageHandler,
} from '../types/realtime';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = '@w4nder/websocket';
const MESSAGE_QUEUE_KEY = `${STORAGE_KEY}/queue`;
const SESSION_KEY = `${STORAGE_KEY}/session`;

// ============================================================================
// WebSocket Service Class
// ============================================================================

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private connectionInfo: ConnectionInfo;
  private eventHandlers: EventHandlers = {};

  // Subscriptions
  private subscriptions: Map<string, Subscription> = new Map();
  private channels: Map<string, Channel> = new Map();

  // Message handling
  private messageQueue: QueuedMessage[] = [];
  private messageHandlers: Map<MessageType, Set<MessageHandler>> = new Map();

  // Timers
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private heartbeatTimeoutTimer: NodeJS.Timeout | null = null;

  // State
  private isAuthenticated = false;
  private sessionId: string | null = null;
  private appState: AppStateStatus = 'active';
  private isNetworkConnected = true;
  private manualDisconnect = false;

  // ─────────────────────────────────────────────────────────────────────────
  // Constructor
  // ─────────────────────────────────────────────────────────────────────────

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = { ...DEFAULT_WS_CONFIG, ...config };
    this.connectionInfo = {
      status: 'disconnected',
      reconnectAttempts: 0,
    };

    this.setupAppStateListener();
    this.setupNetworkListener();
    this.loadMessageQueue();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public Methods - Connection
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Connect to the WebSocket server
   */
  connect(authToken?: string, userId?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('Already connected');
      return;
    }

    if (authToken) this.config.authToken = authToken;
    if (userId) this.config.userId = userId;

    this.manualDisconnect = false;
    this.setStatus('connecting');

    try {
      // Build URL with query params
      const url = this.buildConnectionUrl();
      this.log(`Connecting to ${url}`);

      this.ws = new WebSocket(url);
      this.setupWebSocketHandlers();
    } catch (error) {
      this.log('Connection error:', error);
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(code: number = 1000, reason: string = 'Client disconnect'): void {
    this.manualDisconnect = true;
    this.clearTimers();

    if (this.ws) {
      this.ws.close(code, reason);
      this.ws = null;
    }

    this.setStatus('disconnected');
    this.isAuthenticated = false;
    this.sessionId = null;
    this.eventHandlers.onDisconnect?.(reason);
  }

  /**
   * Reconnect to the server
   */
  reconnect(): void {
    this.disconnect(1000, 'Reconnecting');
    this.manualDisconnect = false;
    setTimeout(() => this.connect(), 100);
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.connectionInfo.status;
  }

  /**
   * Get connection info
   */
  getConnectionInfo(): ConnectionInfo {
    return { ...this.connectionInfo };
  }

  /**
   * Check if connected and authenticated
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public Methods - Subscriptions
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Subscribe to a channel
   */
  subscribe(
    channel: ChannelType,
    resourceId: string,
    handler: MessageHandler,
    filter?: (message: BaseMessage) => boolean
  ): string {
    const subscriptionId = `${channel}:${resourceId}:${Date.now()}`;

    const subscription: Subscription = {
      id: subscriptionId,
      channel,
      resourceId,
      handler,
      filter,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscribe message if connected
    if (this.isConnected()) {
      this.sendSubscribe(channel, resourceId);
    }

    this.log(`Subscribed to ${channel}:${resourceId}`);

    return subscriptionId;
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    this.subscriptions.delete(subscriptionId);

    // Check if any other subscriptions exist for this channel
    const hasOtherSubscriptions = Array.from(this.subscriptions.values()).some(
      (s) => s.channel === subscription.channel && s.resourceId === subscription.resourceId
    );

    // If no other subscriptions, send unsubscribe message
    if (!hasOtherSubscriptions && this.isConnected()) {
      this.sendUnsubscribe(subscription.channel, subscription.resourceId);
    }

    this.log(`Unsubscribed from ${subscription.channel}:${subscription.resourceId}`);
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((_, id) => this.unsubscribe(id));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public Methods - Messages
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Send a message
   */
  send(message: Partial<BaseMessage>): void {
    const fullMessage: BaseMessage = {
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      userId: this.config.userId,
      ...message,
    } as BaseMessage;

    if (this.isConnected()) {
      this.sendRaw(fullMessage);
    } else {
      // Queue message for later
      this.queueMessage(fullMessage);
    }
  }

  /**
   * Add a message handler for a specific message type
   */
  on<T extends BaseMessage>(type: MessageType, handler: MessageHandler<T>): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    this.messageHandlers.get(type)!.add(handler as MessageHandler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(type)?.delete(handler as MessageHandler);
    };
  }

  /**
   * Remove a message handler
   */
  off(type: MessageType, handler: MessageHandler): void {
    this.messageHandlers.get(type)?.delete(handler);
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: Partial<EventHandlers>): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public Methods - Presence
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Send location update
   */
  sendLocationUpdate(coordinates: { lat: number; lng: number }, accuracy?: number): void {
    this.send({
      type: 'location_update',
      payload: {
        coordinates,
        accuracy,
      },
    } as any);
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(resourceId: string, isTyping: boolean): void {
    this.send({
      type: 'partner_typing',
      payload: {
        itineraryId: resourceId,
        isTyping,
      },
    } as any);
  }

  /**
   * Send viewing indicator
   */
  sendViewingIndicator(resourceType: string, resourceId: string): void {
    this.send({
      type: 'partner_viewing',
      payload: {
        resourceType,
        resourceId,
      },
    } as any);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - Connection
  // ─────────────────────────────────────────────────────────────────────────

  private buildConnectionUrl(): string {
    const params = new URLSearchParams();

    if (this.config.userId) {
      params.set('userId', this.config.userId);
    }
    if (this.config.deviceId) {
      params.set('deviceId', this.config.deviceId);
    }
    params.set('platform', Platform.OS);

    const queryString = params.toString();
    return queryString ? `${this.config.url}?${queryString}` : this.config.url;
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.log('Connection opened');
      this.connectionInfo.connectedAt = new Date();
      this.connectionInfo.reconnectAttempts = 0;
      this.setStatus('connected');

      // Authenticate
      this.authenticate();

      // Start heartbeat
      if (this.config.enableHeartbeat) {
        this.startHeartbeat();
      }

      this.eventHandlers.onConnect?.();
    };

    this.ws.onclose = (event) => {
      this.log(`Connection closed: ${event.code} - ${event.reason}`);
      this.clearTimers();
      this.isAuthenticated = false;

      if (!this.manualDisconnect) {
        this.setStatus('disconnected');
        this.eventHandlers.onDisconnect?.(event.reason);

        if (this.config.autoReconnect) {
          this.scheduleReconnect();
        }
      }
    };

    this.ws.onerror = (event) => {
      this.log('Connection error:', event);
      this.setStatus('error');
      this.eventHandlers.onError?.(new Error('WebSocket error'));
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  private setStatus(status: ConnectionStatus): void {
    this.connectionInfo.status = status;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - Authentication
  // ─────────────────────────────────────────────────────────────────────────

  private authenticate(): void {
    if (!this.config.authToken) {
      this.log('No auth token, skipping authentication');
      this.isAuthenticated = true;
      this.onAuthenticated();
      return;
    }

    const authMessage: AuthMessage = {
      type: 'auth',
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      payload: {
        token: this.config.authToken,
        deviceId: this.config.deviceId || this.generateDeviceId(),
        platform: Platform.OS as 'ios' | 'android',
        appVersion: '1.0.0', // TODO: Get from app config
      },
    };

    this.sendRaw(authMessage);
  }

  private onAuthenticated(): void {
    this.isAuthenticated = true;

    // Resubscribe to all channels
    this.resubscribeAll();

    // Flush message queue
    this.flushMessageQueue();

    this.eventHandlers.onAuthSuccess?.(this.sessionId || '');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - Message Handling
  // ─────────────────────────────────────────────────────────────────────────

  private handleMessage(data: string): void {
    try {
      const message: BaseMessage = JSON.parse(data);

      if (this.config.logMessages) {
        this.log('Received:', message.type, message);
      }

      // Handle system messages
      switch (message.type) {
        case 'pong':
          this.handlePong();
          break;
        case 'auth_success':
          this.sessionId = (message as any).payload?.sessionId;
          this.onAuthenticated();
          break;
        case 'auth_error':
          this.isAuthenticated = false;
          this.eventHandlers.onAuthError?.((message as any).payload);
          break;
        case 'subscribed':
          this.handleSubscribed(message as any);
          break;
        case 'error':
          this.log('Server error:', (message as any).payload);
          break;
      }

      // Call type-specific handlers
      const handlers = this.messageHandlers.get(message.type);
      handlers?.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          this.log('Handler error:', error);
        }
      });

      // Dispatch to subscriptions
      this.dispatchToSubscriptions(message);

      // Call generic message handler
      this.eventHandlers.onMessage?.(message);
    } catch (error) {
      this.log('Failed to parse message:', error);
    }
  }

  private dispatchToSubscriptions(message: BaseMessage): void {
    // Extract channel info from message
    const payload = (message as any).payload;
    if (!payload) return;

    // Determine resource info based on message type
    let channel: ChannelType | undefined;
    let resourceId: string | undefined;

    if (payload.itineraryId) {
      channel = 'itinerary';
      resourceId = payload.itineraryId;
    } else if (payload.tripId) {
      channel = 'trip';
      resourceId = payload.tripId;
    } else if (payload.bookingId) {
      channel = 'booking';
      resourceId = payload.bookingId;
    }

    if (!channel || !resourceId) return;

    // Dispatch to matching subscriptions
    this.subscriptions.forEach((subscription) => {
      if (subscription.channel === channel && subscription.resourceId === resourceId) {
        // Apply filter if exists
        if (subscription.filter && !subscription.filter(message)) {
          return;
        }

        try {
          subscription.handler(message);
        } catch (error) {
          this.log('Subscription handler error:', error);
        }
      }
    });
  }

  private sendRaw(message: BaseMessage): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.log('Cannot send, not connected');
      this.queueMessage(message);
      return;
    }

    const data = JSON.stringify(message);
    this.ws.send(data);

    if (this.config.logMessages) {
      this.log('Sent:', message.type);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - Subscriptions
  // ─────────────────────────────────────────────────────────────────────────

  private sendSubscribe(channel: ChannelType, resourceId: string): void {
    const message: SubscribeMessage = {
      type: 'subscribe',
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      payload: {
        channel,
        resourceId,
      },
    };

    this.sendRaw(message);
  }

  private sendUnsubscribe(channel: ChannelType, resourceId: string): void {
    const message: UnsubscribeMessage = {
      type: 'unsubscribe',
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      payload: {
        channel,
        resourceId,
      },
    };

    this.sendRaw(message);
  }

  private handleSubscribed(message: any): void {
    const { channel, resourceId } = message.payload || {};
    if (!channel || !resourceId) return;

    const channelKey = `${channel}:${resourceId}`;
    this.channels.set(channelKey, {
      type: channel,
      resourceId,
      subscribedAt: new Date(),
    });

    this.log(`Confirmed subscription to ${channelKey}`);
  }

  private resubscribeAll(): void {
    const channelSet = new Set<string>();

    this.subscriptions.forEach((subscription) => {
      const key = `${subscription.channel}:${subscription.resourceId}`;
      if (!channelSet.has(key)) {
        channelSet.add(key);
        this.sendSubscribe(subscription.channel, subscription.resourceId);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - Heartbeat
  // ─────────────────────────────────────────────────────────────────────────

  private startHeartbeat(): void {
    this.clearHeartbeatTimers();

    this.heartbeatTimer = setInterval(() => {
      this.sendPing();
    }, this.config.heartbeatInterval);
  }

  private sendPing(): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    this.connectionInfo.lastPingAt = new Date();

    this.sendRaw({
      type: 'ping',
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
    });

    // Set timeout for pong
    this.heartbeatTimeoutTimer = setTimeout(() => {
      this.log('Heartbeat timeout');
      this.ws?.close(4000, 'Heartbeat timeout');
    }, this.config.heartbeatTimeout);
  }

  private handlePong(): void {
    this.connectionInfo.lastPongAt = new Date();

    if (this.connectionInfo.lastPingAt) {
      this.connectionInfo.latency =
        this.connectionInfo.lastPongAt.getTime() - this.connectionInfo.lastPingAt.getTime();
    }

    // Clear timeout
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  private clearHeartbeatTimers(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - Reconnection
  // ─────────────────────────────────────────────────────────────────────────

  private scheduleReconnect(): void {
    if (this.manualDisconnect) return;
    if (this.connectionInfo.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('Max reconnect attempts reached');
      this.setStatus('error');
      return;
    }

    this.setStatus('reconnecting');
    this.connectionInfo.reconnectAttempts++;

    const delay = this.calculateReconnectDelay();
    this.log(`Reconnecting in ${delay}ms (attempt ${this.connectionInfo.reconnectAttempts})`);

    this.eventHandlers.onReconnecting?.(this.connectionInfo.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      if (!this.manualDisconnect && this.isNetworkConnected) {
        this.connect();
      }
    }, delay);
  }

  private calculateReconnectDelay(): number {
    const baseDelay = this.config.reconnectInterval;
    const attempts = this.connectionInfo.reconnectAttempts;

    if (this.config.reconnectBackoff === 'exponential') {
      return Math.min(baseDelay * Math.pow(2, attempts - 1), 30000);
    }

    return baseDelay * attempts;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - Message Queue
  // ─────────────────────────────────────────────────────────────────────────

  private queueMessage(message: BaseMessage): void {
    const queuedMessage: QueuedMessage = {
      id: message.id,
      message,
      queuedAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
    };

    this.messageQueue.push(queuedMessage);
    this.saveMessageQueue();
    this.log(`Queued message: ${message.type}`);
  }

  private async flushMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return;

    this.log(`Flushing ${this.messageQueue.length} queued messages`);

    const queue = [...this.messageQueue];
    this.messageQueue = [];

    for (const item of queue) {
      if (item.attempts >= item.maxAttempts) {
        this.log(`Dropping message after ${item.attempts} attempts:`, item.message.type);
        continue;
      }

      item.attempts++;
      this.sendRaw(item.message);
    }

    await this.saveMessageQueue();
  }

  private async loadMessageQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(MESSAGE_QUEUE_KEY);
      if (stored) {
        this.messageQueue = JSON.parse(stored);
      }
    } catch (error) {
      this.log('Failed to load message queue:', error);
    }
  }

  private async saveMessageQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(MESSAGE_QUEUE_KEY, JSON.stringify(this.messageQueue));
    } catch (error) {
      this.log('Failed to save message queue:', error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - App State & Network
  // ─────────────────────────────────────────────────────────────────────────

  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextState) => {
      const prevState = this.appState;
      this.appState = nextState;

      if (prevState.match(/inactive|background/) && nextState === 'active') {
        // App came to foreground
        this.log('App became active');
        if (!this.isConnected() && !this.manualDisconnect) {
          this.connect();
        }
      } else if (nextState.match(/inactive|background/)) {
        // App went to background - keep connection if needed
        this.log('App went to background');
      }
    });
  }

  private setupNetworkListener(): void {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasConnected = this.isNetworkConnected;
      this.isNetworkConnected = state.isConnected ?? false;

      if (!wasConnected && this.isNetworkConnected) {
        // Network restored
        this.log('Network restored');
        if (!this.isConnected() && !this.manualDisconnect) {
          this.connect();
        }
      } else if (wasConnected && !this.isNetworkConnected) {
        // Network lost
        this.log('Network lost');
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - Utilities
  // ─────────────────────────────────────────────────────────────────────────

  private clearTimers(): void {
    this.clearHeartbeatTimers();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeviceId(): string {
    // In production, use a persistent device ID
    return `device_${Platform.OS}_${Date.now()}`;
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WebSocket]', ...args);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────────────────

  destroy(): void {
    this.disconnect(1000, 'Service destroyed');
    this.subscriptions.clear();
    this.channels.clear();
    this.messageHandlers.clear();
    this.messageQueue = [];
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const webSocketService = new WebSocketService();

export default WebSocketService;
