// Confirmation Storage Service for Paint the Town
// Persists confirmations, tickets, and QR codes using AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Share, Platform } from 'react-native';
import {
  Confirmation,
  ConfirmationType,
  ConfirmationStatus,
  ConfirmationFilter,
  ConfirmationSort,
  Ticket,
  generateConfirmationId,
  generateTicketId,
  sortConfirmations,
  isConfirmationPast,
} from '@/types/confirmation';

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  CONFIRMATIONS: '@w4nder/confirmations',
  TICKETS: '@w4nder/tickets',
  SETTINGS: '@w4nder/confirmation_settings',
};

const TICKET_DIRECTORY = `${FileSystem.documentDirectory}tickets/`;

// ============================================================================
// Confirmation Storage Service
// ============================================================================

class ConfirmationStorageService {
  private confirmations: Map<string, Confirmation> = new Map();
  private tickets: Map<string, Ticket> = new Map();
  private listeners: Map<string, (confirmations: Confirmation[]) => void> = new Map();
  private isInitialized = false;

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Ensure ticket directory exists
      const dirInfo = await FileSystem.getInfoAsync(TICKET_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(TICKET_DIRECTORY, { intermediates: true });
      }

      // Load confirmations from storage
      const confirmationsJson = await AsyncStorage.getItem(STORAGE_KEYS.CONFIRMATIONS);
      if (confirmationsJson) {
        const confirmations: Confirmation[] = JSON.parse(confirmationsJson);
        for (const conf of confirmations) {
          this.confirmations.set(conf.id, conf);
        }
      }

      // Load tickets from storage
      const ticketsJson = await AsyncStorage.getItem(STORAGE_KEYS.TICKETS);
      if (ticketsJson) {
        const tickets: Ticket[] = JSON.parse(ticketsJson);
        for (const ticket of tickets) {
          this.tickets.set(ticket.id, ticket);
        }
      }

      // Update statuses for past confirmations
      await this.updateConfirmationStatuses();

      this.isInitialized = true;
      console.log(`Confirmation storage initialized with ${this.confirmations.size} confirmations`);
    } catch (error) {
      console.error('Failed to initialize confirmation storage:', error);
      throw error;
    }
  }

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  async addConfirmation(
    data: Omit<Confirmation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Confirmation> {
    await this.initialize();

    const confirmation: Confirmation = {
      ...data,
      id: generateConfirmationId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.confirmations.set(confirmation.id, confirmation);
    await this.saveConfirmations();
    this.notifyListeners();

    return confirmation;
  }

  async getConfirmation(id: string): Promise<Confirmation | null> {
    await this.initialize();
    return this.confirmations.get(id) || null;
  }

  async getAllConfirmations(
    filter?: ConfirmationFilter,
    sort?: ConfirmationSort
  ): Promise<Confirmation[]> {
    await this.initialize();

    let confirmations = Array.from(this.confirmations.values());

    // Apply filters
    if (filter) {
      if (filter.type) {
        confirmations = confirmations.filter((c) => c.type === filter.type);
      }
      if (filter.status) {
        confirmations = confirmations.filter((c) => c.status === filter.status);
      }
      if (filter.tripId) {
        confirmations = confirmations.filter((c) => c.tripId === filter.tripId);
      }
      if (filter.dateRange) {
        const { start, end } = filter.dateRange;
        confirmations = confirmations.filter((c) => {
          const date = new Date(c.date);
          return date >= new Date(start) && date <= new Date(end);
        });
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        confirmations = confirmations.filter(
          (c) =>
            c.title.toLowerCase().includes(searchLower) ||
            c.provider?.toLowerCase().includes(searchLower) ||
            c.confirmationNumber?.toLowerCase().includes(searchLower)
        );
      }
    }

    // Apply sorting
    return sortConfirmations(confirmations, sort);
  }

  async getUpcomingConfirmations(limit?: number): Promise<Confirmation[]> {
    const all = await this.getAllConfirmations(undefined, { field: 'date', direction: 'asc' });

    const upcoming = all.filter((c) => !isConfirmationPast(c) && c.status !== 'cancelled');
    return limit ? upcoming.slice(0, limit) : upcoming;
  }

  async updateConfirmation(
    id: string,
    updates: Partial<Confirmation>
  ): Promise<Confirmation | null> {
    await this.initialize();

    const existing = this.confirmations.get(id);
    if (!existing) return null;

    const updated: Confirmation = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    this.confirmations.set(id, updated);
    await this.saveConfirmations();
    this.notifyListeners();

    return updated;
  }

  async deleteConfirmation(id: string): Promise<boolean> {
    await this.initialize();

    const confirmation = this.confirmations.get(id);
    if (!confirmation) return false;

    // Delete associated tickets and their files
    if (confirmation.tickets) {
      for (const ticket of confirmation.tickets) {
        await this.deleteTicketFiles(ticket);
        this.tickets.delete(ticket.id);
      }
    }

    this.confirmations.delete(id);
    await this.saveConfirmations();
    await this.saveTickets();
    this.notifyListeners();

    return true;
  }

  // ============================================================================
  // Ticket Operations
  // ============================================================================

  async addTicket(confirmationId: string, ticketData: Omit<Ticket, 'id'>): Promise<Ticket | null> {
    await this.initialize();

    const confirmation = this.confirmations.get(confirmationId);
    if (!confirmation) return null;

    const ticket: Ticket = {
      ...ticketData,
      id: generateTicketId(),
    };

    // Update confirmation with new ticket
    const tickets = confirmation.tickets || [];
    tickets.push(ticket);

    await this.updateConfirmation(confirmationId, { tickets });

    // Store ticket separately for quick access
    this.tickets.set(ticket.id, ticket);
    await this.saveTickets();

    return ticket;
  }

  async updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket | null> {
    await this.initialize();

    const ticket = this.tickets.get(ticketId);
    if (!ticket) return null;

    const updated: Ticket = { ...ticket, ...updates, id: ticket.id };
    this.tickets.set(ticketId, updated);

    // Update ticket in confirmation
    for (const [confId, conf] of this.confirmations) {
      if (conf.tickets) {
        const ticketIndex = conf.tickets.findIndex((t) => t.id === ticketId);
        if (ticketIndex >= 0) {
          conf.tickets[ticketIndex] = updated;
          await this.saveConfirmations();
          break;
        }
      }
    }

    await this.saveTickets();
    return updated;
  }

  async deleteTicket(ticketId: string): Promise<boolean> {
    await this.initialize();

    const ticket = this.tickets.get(ticketId);
    if (!ticket) return false;

    await this.deleteTicketFiles(ticket);

    // Remove from confirmation
    for (const [confId, conf] of this.confirmations) {
      if (conf.tickets) {
        const ticketIndex = conf.tickets.findIndex((t) => t.id === ticketId);
        if (ticketIndex >= 0) {
          conf.tickets.splice(ticketIndex, 1);
          await this.saveConfirmations();
          break;
        }
      }
    }

    this.tickets.delete(ticketId);
    await this.saveTickets();

    return true;
  }

  private async deleteTicketFiles(ticket: Ticket): Promise<void> {
    try {
      if (ticket.imageUri) {
        const info = await FileSystem.getInfoAsync(ticket.imageUri);
        if (info.exists) {
          await FileSystem.deleteAsync(ticket.imageUri);
        }
      }
      if (ticket.pdfUri) {
        const info = await FileSystem.getInfoAsync(ticket.pdfUri);
        if (info.exists) {
          await FileSystem.deleteAsync(ticket.pdfUri);
        }
      }
    } catch (error) {
      console.error('Failed to delete ticket files:', error);
    }
  }

  // ============================================================================
  // QR Code Storage
  // ============================================================================

  async saveQRCode(ticketId: string, base64Data: string): Promise<string | null> {
    try {
      const ticket = this.tickets.get(ticketId);
      if (!ticket) return null;

      const fileName = `qr_${ticketId}_${Date.now()}.png`;
      const destUri = TICKET_DIRECTORY + fileName;

      await FileSystem.writeAsStringAsync(destUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await this.updateTicket(ticketId, { imageUri: destUri });

      return destUri;
    } catch (error) {
      console.error('Failed to save QR code:', error);
      return null;
    }
  }

  // ============================================================================
  // Import/Export
  // ============================================================================

  async exportConfirmation(id: string): Promise<string | null> {
    const confirmation = await this.getConfirmation(id);
    if (!confirmation) return null;

    return JSON.stringify(confirmation, null, 2);
  }

  async exportAllConfirmations(): Promise<string> {
    const confirmations = await this.getAllConfirmations();
    return JSON.stringify(confirmations, null, 2);
  }

  async importConfirmation(json: string): Promise<Confirmation | null> {
    try {
      const data = JSON.parse(json);

      // Validate required fields
      if (!data.title || !data.date || !data.type) {
        throw new Error('Invalid confirmation data');
      }

      // Remove id to generate new one
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;

      return this.addConfirmation(data);
    } catch (error) {
      console.error('Failed to import confirmation:', error);
      return null;
    }
  }

  async shareConfirmation(id: string): Promise<boolean> {
    const confirmation = await this.getConfirmation(id);
    if (!confirmation) return false;

    try {
      const shareText = this.formatConfirmationForShare(confirmation);

      // Use React Native's built-in Share API
      await Share.share({
        message: shareText,
        title: confirmation.title,
      });

      return true;
    } catch (error) {
      console.error('Failed to share confirmation:', error);
      return false;
    }
  }

  private formatConfirmationForShare(confirmation: Confirmation): string {
    const lines = [
      `📋 ${confirmation.title}`,
      '',
      `📅 Date: ${new Date(confirmation.date).toLocaleDateString()}`,
    ];

    if (confirmation.time) {
      lines.push(`🕐 Time: ${confirmation.time}`);
    }

    if (confirmation.location) {
      lines.push(`📍 Location: ${confirmation.location.name || confirmation.location.address}`);
    }

    if (confirmation.confirmationNumber) {
      lines.push(`✅ Confirmation: ${confirmation.confirmationNumber}`);
    }

    if (confirmation.provider) {
      lines.push(`🏢 Provider: ${confirmation.provider}`);
    }

    return lines.join('\n');
  }

  // ============================================================================
  // Status Updates
  // ============================================================================

  private async updateConfirmationStatuses(): Promise<void> {
    let hasUpdates = false;

    for (const [id, confirmation] of this.confirmations) {
      if (confirmation.status === 'confirmed' && isConfirmationPast(confirmation)) {
        confirmation.status = 'completed';
        confirmation.updatedAt = new Date().toISOString();
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      await this.saveConfirmations();
    }
  }

  // ============================================================================
  // Persistence
  // ============================================================================

  private async saveConfirmations(): Promise<void> {
    const confirmations = Array.from(this.confirmations.values());
    await AsyncStorage.setItem(STORAGE_KEYS.CONFIRMATIONS, JSON.stringify(confirmations));
  }

  private async saveTickets(): Promise<void> {
    const tickets = Array.from(this.tickets.values());
    await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  }

  // ============================================================================
  // Subscriptions
  // ============================================================================

  subscribe(key: string, callback: (confirmations: Confirmation[]) => void): () => void {
    this.listeners.set(key, callback);
    return () => this.listeners.delete(key);
  }

  private notifyListeners(): void {
    const confirmations = Array.from(this.confirmations.values());
    for (const callback of this.listeners.values()) {
      callback(confirmations);
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  async clearAll(): Promise<void> {
    // Delete all ticket files
    try {
      const dirInfo = await FileSystem.getInfoAsync(TICKET_DIRECTORY);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(TICKET_DIRECTORY, { idempotent: true });
        await FileSystem.makeDirectoryAsync(TICKET_DIRECTORY, { intermediates: true });
      }
    } catch (error) {
      console.error('Failed to clear ticket directory:', error);
    }

    this.confirmations.clear();
    this.tickets.clear();

    await AsyncStorage.removeItem(STORAGE_KEYS.CONFIRMATIONS);
    await AsyncStorage.removeItem(STORAGE_KEYS.TICKETS);

    this.notifyListeners();
  }
}

// Export singleton instance
export const confirmationStorage = new ConfirmationStorageService();
