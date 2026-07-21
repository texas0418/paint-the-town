import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import {
  Calendar,
  Check,
  ChevronRight,
  RefreshCw,
  X,
  Shield,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import {
  CalendarAccount,
  CalendarInfo,
  CALENDAR_SOURCE_COLORS,
} from '@/types/availability';
import { getCalendarAccounts } from '@/utils/availabilityUtils';

interface CalendarConnectSheetProps {
  visible: boolean;
  onClose: () => void;
  onCalendarsSelected: (calendars: CalendarInfo[]) => void;
  selectedCalendarIds: string[];
}

export default function CalendarConnectSheet({
  visible,
  onClose,
  onCalendarsSelected,
  selectedCalendarIds,
}: CalendarConnectSheetProps) {
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(selectedCalendarIds)
  );
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCalendars();
    }
  }, [visible]);

  const loadCalendars = async () => {
    setLoading(true);
    try {
      const calendarAccounts = await getCalendarAccounts();
      setAccounts(calendarAccounts);
    } catch (error) {
      console.error('Failed to load calendars:', error);
    }
    setLoading(false);
  };

  const toggleCalendar = (calendarId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(calendarId)) {
      newSelected.delete(calendarId);
    } else {
      newSelected.add(calendarId);
    }
    setSelectedIds(newSelected);
  };

  const handleSave = () => {
    const selectedCalendars: CalendarInfo[] = [];
    accounts.forEach((account) => {
      account.calendars.forEach((cal) => {
        if (selectedIds.has(cal.id)) {
          selectedCalendars.push(cal);
        }
      });
    });
    onCalendarsSelected(selectedCalendars);
    onClose();
  };

  const handleRefresh = async () => {
    setSyncing(true);
    await loadCalendars();
    setSyncing(false);
  };

  const getSourceIcon = (source: string) => {
    // TODO: swap generic icons for actual brand icons
    return <Calendar size={20} color={CALENDAR_SOURCE_COLORS[source as keyof typeof CALENDAR_SOURCE_COLORS] || colors.textSecondary} />;
  };

  const totalSelected = selectedIds.size;

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
          <Text style={styles.title}>Connect Calendars</Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.refreshButton}
            disabled={syncing}
          >
            <RefreshCw
              size={20}
              color={colors.primary}
              style={syncing ? styles.spinning : undefined}
            />
          </TouchableOpacity>
        </View>

        {/* Privacy note */}
        <View style={styles.privacyNote}>
          <Shield size={16} color={colors.primary} />
          <Text style={styles.privacyText}>
            We only read your calendar to find free times. Event details stay private.
          </Text>
        </View>

        {/* Calendar list */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading calendars...</Text>
            </View>
          ) : accounts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Calendar size={48} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No calendars found</Text>
              <Text style={styles.emptyText}>
                Make sure you have calendars set up on your device
              </Text>
            </View>
          ) : (
            accounts.map((account) => (
              <View key={account.id} style={styles.accountSection}>
                <View style={styles.accountHeader}>
                  {getSourceIcon(account.source)}
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountEmail}>{account.email}</Text>
                  </View>
                  <View style={[
                    styles.sourceBadge,
                    { backgroundColor: `${CALENDAR_SOURCE_COLORS[account.source]}20` }
                  ]}>
                    <Text style={[
                      styles.sourceText,
                      { color: CALENDAR_SOURCE_COLORS[account.source] }
                    ]}>
                      {account.source}
                    </Text>
                  </View>
                </View>

                <View style={styles.calendarList}>
                  {account.calendars.map((calendar) => (
                    <TouchableOpacity
                      key={calendar.id}
                      style={styles.calendarItem}
                      onPress={() => toggleCalendar(calendar.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.calendarDot,
                          { backgroundColor: calendar.color }
                        ]}
                      />
                      <Text style={styles.calendarName} numberOfLines={1}>
                        {calendar.name}
                      </Text>
                      <View style={[
                        styles.checkbox,
                        selectedIds.has(calendar.id) && styles.checkboxSelected,
                      ]}>
                        {selectedIds.has(calendar.id) && (
                          <Check size={14} color="#fff" />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.selectedCount}>
            {totalSelected} {totalSelected === 1 ? 'calendar' : 'calendars'} selected
          </Text>
          <TouchableOpacity
            style={[
              styles.saveButton,
              totalSelected === 0 && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={totalSelected === 0}
          >
            <Text style={styles.saveButtonText}>Save Selection</Text>
          </TouchableOpacity>
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
  refreshButton: {
    padding: 4,
  },
  spinning: {
    opacity: 0.5,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${colors.primary}10`,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  accountSection: {
    marginBottom: 20,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  accountEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  calendarList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  calendarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  calendarDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  calendarName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: colors.text,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  selectedCount: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
