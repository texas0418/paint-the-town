/* eslint-disable max-lines -- tracked in #1 */
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Animated,
  Switch,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Plane,
  Building2,
  TrendingDown,
  TrendingUp,
  Plus,
  X,
  ChevronRight,
  Calendar,
  MapPin,
  DollarSign,
  Trash2,
  Settings,
  History,
  Target,
  Zap,
  CheckCircle,
  AlertTriangle,
  Search,
} from 'lucide-react-native';
import colors from '@/constants/colors';

interface PriceHistory {
  date: string;
  price: number;
}

interface PriceAlert {
  id: string;
  type: 'flight' | 'hotel';
  destination: string;
  origin?: string;
  image: string;
  currentPrice: number;
  originalPrice: number;
  lowestPrice: number;
  targetPrice: number;
  currency: string;
  priceHistory: PriceHistory[];
  dates: {
    start: string;
    end: string;
  };
  lastUpdated: string;
  isActive: boolean;
  hasDropped: boolean;
  dropPercentage: number;
  provider: string;
  details?: string;
}

interface PriceNotification {
  id: string;
  alertId: string;
  type: 'drop' | 'target_reached' | 'increase';
  destination: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  timestamp: string;
  isRead: boolean;
}

const mockAlerts: PriceAlert[] = [
  {
    id: '1',
    type: 'flight',
    destination: 'Paris, France',
    origin: 'New York, USA',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    currentPrice: 489,
    originalPrice: 650,
    lowestPrice: 420,
    targetPrice: 450,
    currency: 'USD',
    priceHistory: [
      { date: '2024-01-01', price: 650 },
      { date: '2024-01-05', price: 620 },
      { date: '2024-01-10', price: 580 },
      { date: '2024-01-15', price: 550 },
      { date: '2024-01-20', price: 489 },
    ],
    dates: { start: '2024-03-15', end: '2024-03-22' },
    lastUpdated: '2024-01-20T10:30:00Z',
    isActive: true,
    hasDropped: true,
    dropPercentage: 25,
    provider: 'Multiple Airlines',
    details: 'Round trip, Economy',
  },
  {
    id: '2',
    type: 'hotel',
    destination: 'Tokyo, Japan',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    currentPrice: 185,
    originalPrice: 220,
    lowestPrice: 170,
    targetPrice: 160,
    currency: 'USD',
    priceHistory: [
      { date: '2024-01-01', price: 220 },
      { date: '2024-01-08', price: 210 },
      { date: '2024-01-15', price: 195 },
      { date: '2024-01-20', price: 185 },
    ],
    dates: { start: '2024-04-10', end: '2024-04-17' },
    lastUpdated: '2024-01-20T08:15:00Z',
    isActive: true,
    hasDropped: true,
    dropPercentage: 16,
    provider: 'Shibuya Grand Hotel',
    details: 'Deluxe Room, Breakfast included',
  },
  {
    id: '3',
    type: 'flight',
    destination: 'Bali, Indonesia',
    origin: 'Los Angeles, USA',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    currentPrice: 890,
    originalPrice: 850,
    lowestPrice: 780,
    targetPrice: 800,
    currency: 'USD',
    priceHistory: [
      { date: '2024-01-01', price: 850 },
      { date: '2024-01-10', price: 820 },
      { date: '2024-01-15', price: 870 },
      { date: '2024-01-20', price: 890 },
    ],
    dates: { start: '2024-05-01', end: '2024-05-15' },
    lastUpdated: '2024-01-20T14:45:00Z',
    isActive: true,
    hasDropped: false,
    dropPercentage: -5,
    provider: 'Singapore Airlines',
    details: 'Round trip, Economy Plus',
  },
  {
    id: '4',
    type: 'hotel',
    destination: 'Barcelona, Spain',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
    currentPrice: 145,
    originalPrice: 200,
    lowestPrice: 140,
    targetPrice: 150,
    currency: 'USD',
    priceHistory: [
      { date: '2024-01-01', price: 200 },
      { date: '2024-01-07', price: 180 },
      { date: '2024-01-14', price: 160 },
      { date: '2024-01-20', price: 145 },
    ],
    dates: { start: '2024-06-20', end: '2024-06-27' },
    lastUpdated: '2024-01-20T09:00:00Z',
    isActive: true,
    hasDropped: true,
    dropPercentage: 28,
    provider: 'Hotel Arts Barcelona',
    details: 'Sea View Suite',
  },
];

const mockNotifications: PriceNotification[] = [
  {
    id: '1',
    alertId: '1',
    type: 'drop',
    destination: 'Paris, France',
    oldPrice: 550,
    newPrice: 489,
    currency: 'USD',
    timestamp: '2024-01-20T10:30:00Z',
    isRead: false,
  },
  {
    id: '2',
    alertId: '4',
    type: 'target_reached',
    destination: 'Barcelona, Spain',
    oldPrice: 160,
    newPrice: 145,
    currency: 'USD',
    timestamp: '2024-01-20T09:00:00Z',
    isRead: false,
  },
  {
    id: '3',
    alertId: '2',
    type: 'drop',
    destination: 'Tokyo, Japan',
    oldPrice: 195,
    newPrice: 185,
    currency: 'USD',
    timestamp: '2024-01-20T08:15:00Z',
    isRead: true,
  },
];

type FilterType = 'all' | 'flights' | 'hotels' | 'dropped';
type TabType = 'alerts' | 'notifications';

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function PriceAlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<PriceAlert[]>(mockAlerts);
  const [notifications, setNotifications] = useState<PriceNotification[]>(mockNotifications);
  const [activeTab, setActiveTab] = useState<TabType>('alerts');
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<PriceAlert | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newAlertType, setNewAlertType] = useState<'flight' | 'hotel'>('flight');
  const [newDestination, setNewDestination] = useState('');
  const [newOrigin, setNewOrigin] = useState('');
  const [newTargetPrice, setNewTargetPrice] = useState('');

  const [globalNotifications, setGlobalNotifications] = useState(true);
  const [priceDropThreshold, setPriceDropThreshold] = useState(10);

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: activeTab === 'alerts' ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [activeTab, slideAnim]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    console.log('Refreshing price alerts...');
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = alert.destination.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    switch (filter) {
      case 'flights':
        return alert.type === 'flight';
      case 'hotels':
        return alert.type === 'hotel';
      case 'dropped':
        return alert.hasDropped;
      default:
        return true;
    }
  });

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const handleToggleAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert))
    );
    console.log('Toggled alert:', alertId);
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    setSelectedAlert(null);
    console.log('Deleted alert:', alertId);
  };

  const handleAddAlert = () => {
    if (!newDestination || !newTargetPrice) return;

    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      type: newAlertType,
      destination: newDestination,
      origin: newAlertType === 'flight' ? newOrigin : undefined,
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
      currentPrice: parseInt(newTargetPrice) + 50,
      originalPrice: parseInt(newTargetPrice) + 100,
      lowestPrice: parseInt(newTargetPrice),
      targetPrice: parseInt(newTargetPrice),
      currency: 'USD',
      priceHistory: [
        { date: new Date().toISOString().split('T')[0], price: parseInt(newTargetPrice) + 50 },
      ],
      dates: { start: '2024-04-01', end: '2024-04-08' },
      lastUpdated: new Date().toISOString(),
      isActive: true,
      hasDropped: false,
      dropPercentage: 0,
      provider: 'Searching...',
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setShowAddModal(false);
    setNewDestination('');
    setNewOrigin('');
    setNewTargetPrice('');
    console.log('Added new alert:', newAlert);
  };

  const handleMarkNotificationRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const renderPriceChart = (priceHistory: PriceHistory[]) => {
    if (priceHistory.length < 2) return null;

    const maxPrice = Math.max(...priceHistory.map((p) => p.price));
    const minPrice = Math.min(...priceHistory.map((p) => p.price));
    const range = maxPrice - minPrice || 1;
    const chartHeight = 50;
    const chartWidth = 120;
    const pointWidth = chartWidth / (priceHistory.length - 1);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {priceHistory.map((point, index) => {
            if (index === 0) return null;
            const prevPoint = priceHistory[index - 1];
            const prevY = chartHeight - ((prevPoint.price - minPrice) / range) * chartHeight;
            const currY = chartHeight - ((point.price - minPrice) / range) * chartHeight;
            const isDecreasing = point.price < prevPoint.price;

            return (
              <View
                key={point.date}
                style={[
                  styles.chartLine,
                  {
                    left: (index - 1) * pointWidth,
                    width: pointWidth + 2,
                    top: Math.min(prevY, currY),
                    height: Math.abs(currY - prevY) + 3,
                    backgroundColor: isDecreasing ? colors.success : colors.error,
                    transform: [
                      { rotate: `${Math.atan2(currY - prevY, pointWidth) * (180 / Math.PI)}deg` },
                    ],
                  },
                ]}
              />
            );
          })}
          {priceHistory.map((point, index) => {
            const y = chartHeight - ((point.price - minPrice) / range) * chartHeight;
            return (
              <View
                key={point.date}
                style={[
                  styles.chartDot,
                  {
                    left: index * pointWidth - 3,
                    top: y - 3,
                    backgroundColor:
                      index === priceHistory.length - 1 ? colors.primary : colors.textTertiary,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  const renderAlertCard = (alert: PriceAlert) => {
    const isDropped = alert.currentPrice < alert.originalPrice;
    const targetReached = alert.currentPrice <= alert.targetPrice;

    return (
      <Pressable key={alert.id} style={styles.alertCard} onPress={() => setSelectedAlert(alert)}>
        <Image source={{ uri: alert.image }} style={styles.alertImage} contentFit="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.alertImageGradient}
        />

        {targetReached && (
          <View style={styles.targetBadge}>
            <Target size={12} color={colors.textLight} />
            <Text style={styles.targetBadgeText}>Target Reached!</Text>
          </View>
        )}

        <View style={styles.alertTypeIcon}>
          {alert.type === 'flight' ? (
            <Plane size={14} color={colors.textLight} />
          ) : (
            <Building2 size={14} color={colors.textLight} />
          )}
        </View>

        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertDestination} numberOfLines={1}>
              {alert.destination}
            </Text>
            <Pressable style={styles.alertToggle} onPress={() => handleToggleAlert(alert.id)}>
              {alert.isActive ? (
                <Bell size={18} color={colors.primary} />
              ) : (
                <BellOff size={18} color={colors.textTertiary} />
              )}
            </Pressable>
          </View>

          {alert.origin && <Text style={styles.alertOrigin}>From {alert.origin}</Text>}

          <View style={styles.alertPricing}>
            <View style={styles.priceMain}>
              <Text style={styles.currentPrice}>${alert.currentPrice}</Text>
              {isDropped && (
                <View style={styles.dropBadge}>
                  <TrendingDown size={12} color={colors.success} />
                  <Text style={styles.dropText}>{Math.abs(alert.dropPercentage)}%</Text>
                </View>
              )}
              {!isDropped && alert.dropPercentage < 0 && (
                <View style={[styles.dropBadge, styles.increaseBadge]}>
                  <TrendingUp size={12} color={colors.error} />
                  <Text style={[styles.dropText, styles.increaseText]}>
                    {Math.abs(alert.dropPercentage)}%
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.originalPrice}>was ${alert.originalPrice}</Text>
          </View>

          {renderPriceChart(alert.priceHistory)}

          <View style={styles.alertFooter}>
            <View style={styles.alertDates}>
              <Calendar size={12} color={colors.textTertiary} />
              <Text style={styles.alertDateText}>
                {formatDate(alert.dates.start)} - {formatDate(alert.dates.end)}
              </Text>
            </View>
            <Text style={styles.alertProvider} numberOfLines={1}>
              {alert.provider}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderNotificationItem = (notification: PriceNotification) => {
    const isPositive = notification.type !== 'increase';
    const Icon =
      notification.type === 'target_reached'
        ? CheckCircle
        : notification.type === 'drop'
          ? TrendingDown
          : TrendingUp;

    return (
      <Pressable
        key={notification.id}
        style={[styles.notificationItem, !notification.isRead && styles.notificationUnread]}
        onPress={() => handleMarkNotificationRead(notification.id)}
      >
        <View
          style={[
            styles.notificationIcon,
            { backgroundColor: isPositive ? `${colors.success}15` : `${colors.error}15` },
          ]}
        >
          <Icon size={20} color={isPositive ? colors.success : colors.error} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>
            {notification.type === 'target_reached' && 'Target Price Reached!'}
            {notification.type === 'drop' && 'Price Drop Alert'}
            {notification.type === 'increase' && 'Price Increase'}
          </Text>
          <Text style={styles.notificationDestination}>{notification.destination}</Text>
          <View style={styles.notificationPrices}>
            <Text style={styles.notificationOldPrice}>${notification.oldPrice}</Text>
            <ChevronRight size={14} color={colors.textTertiary} />
            <Text
              style={[
                styles.notificationNewPrice,
                { color: isPositive ? colors.success : colors.error },
              ]}
            >
              ${notification.newPrice}
            </Text>
          </View>
        </View>
        <Text style={styles.notificationTime}>{formatTimestamp(notification.timestamp)}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.headerGradient}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.textLight} />
            </Pressable>
            <Text style={styles.headerTitle}>Price Alerts</Text>
            <Pressable style={styles.settingsButton} onPress={() => setShowSettingsModal(true)}>
              <Settings size={22} color={colors.textLight} />
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{alerts.length}</Text>
              <Text style={styles.statLabel}>Tracking</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{alerts.filter((a) => a.hasDropped).length}</Text>
              <Text style={styles.statLabel}>Dropped</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                ${alerts.reduce((sum, a) => sum + (a.originalPrice - a.currentPrice), 0)}
              </Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.tabBar}>
            <Pressable
              style={[styles.tab, activeTab === 'alerts' && styles.tabActive]}
              onPress={() => setActiveTab('alerts')}
            >
              <TrendingDown
                size={18}
                color={activeTab === 'alerts' ? colors.primary : colors.textTertiary}
              />
              <Text style={[styles.tabText, activeTab === 'alerts' && styles.tabTextActive]}>
                Alerts
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'notifications' && styles.tabActive]}
              onPress={() => setActiveTab('notifications')}
            >
              <Bell
                size={18}
                color={activeTab === 'notifications' ? colors.primary : colors.textTertiary}
              />
              <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
                Notifications
              </Text>
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {activeTab === 'alerts' && (
            <>
              <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                  <Search size={18} color={colors.textTertiary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search destinations..."
                    placeholderTextColor={colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {(['all', 'flights', 'hotels', 'dropped'] as FilterType[]).map((f) => (
                  <Pressable
                    key={f}
                    style={[styles.filterChip, filter === f && styles.filterChipActive]}
                    onPress={() => setFilter(f)}
                  >
                    {f === 'flights' && (
                      <Plane size={14} color={filter === f ? colors.textLight : colors.text} />
                    )}
                    {f === 'hotels' && (
                      <Building2 size={14} color={filter === f ? colors.textLight : colors.text} />
                    )}
                    {f === 'dropped' && (
                      <TrendingDown
                        size={14}
                        color={filter === f ? colors.textLight : colors.success}
                      />
                    )}
                    <Text
                      style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          {activeTab === 'notifications' && notifications.filter((n) => !n.isRead).length > 0 && (
            <Pressable style={styles.markAllRead} onPress={handleMarkAllRead}>
              <Text style={styles.markAllReadText}>Mark all as read</Text>
            </Pressable>
          )}

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.scrollContent}
          >
            {activeTab === 'alerts' ? (
              filteredAlerts.length > 0 ? (
                filteredAlerts.map(renderAlertCard)
              ) : (
                <View style={styles.emptyState}>
                  <TrendingDown size={48} color={colors.textTertiary} />
                  <Text style={styles.emptyTitle}>No alerts yet</Text>
                  <Text style={styles.emptyText}>
                    Start tracking prices for your dream destinations
                  </Text>
                </View>
              )
            ) : notifications.length > 0 ? (
              notifications.map(renderNotificationItem)
            ) : (
              <View style={styles.emptyState}>
                <Bell size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No notifications</Text>
                <Text style={styles.emptyText}>You&apos;ll be notified when prices change</Text>
              </View>
            )}
          </ScrollView>
        </View>

        <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <LinearGradient
            colors={[colors.secondary, colors.secondaryDark]}
            style={styles.addButtonGradient}
          >
            <Plus size={24} color={colors.textLight} />
          </LinearGradient>
        </Pressable>
      </SafeAreaView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Price Alert</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.typeSelector}>
              <Pressable
                style={[styles.typeOption, newAlertType === 'flight' && styles.typeOptionActive]}
                onPress={() => setNewAlertType('flight')}
              >
                <Plane
                  size={20}
                  color={newAlertType === 'flight' ? colors.textLight : colors.text}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    newAlertType === 'flight' && styles.typeOptionTextActive,
                  ]}
                >
                  Flight
                </Text>
              </Pressable>
              <Pressable
                style={[styles.typeOption, newAlertType === 'hotel' && styles.typeOptionActive]}
                onPress={() => setNewAlertType('hotel')}
              >
                <Building2
                  size={20}
                  color={newAlertType === 'hotel' ? colors.textLight : colors.text}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    newAlertType === 'hotel' && styles.typeOptionTextActive,
                  ]}
                >
                  Hotel
                </Text>
              </Pressable>
            </View>

            {newAlertType === 'flight' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Origin City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., New York, USA"
                  placeholderTextColor={colors.textTertiary}
                  value={newOrigin}
                  onChangeText={setNewOrigin}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Destination</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Paris, France"
                placeholderTextColor={colors.textTertiary}
                value={newDestination}
                onChangeText={setNewDestination}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Price (USD)</Text>
              <View style={styles.priceInput}>
                <DollarSign size={18} color={colors.textTertiary} />
                <TextInput
                  style={styles.priceInputField}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={newTargetPrice}
                  onChangeText={setNewTargetPrice}
                />
              </View>
              <Text style={styles.inputHint}>
                We&apos;ll notify you when the price drops to or below this amount
              </Text>
            </View>

            <Pressable
              style={[
                styles.createButton,
                (!newDestination || !newTargetPrice) && styles.createButtonDisabled,
              ]}
              onPress={handleAddAlert}
              disabled={!newDestination || !newTargetPrice}
            >
              <Zap size={20} color={colors.textLight} />
              <Text style={styles.createButtonText}>Create Alert</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={selectedAlert !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedAlert(null)}
      >
        {selectedAlert && (
          <View style={styles.modalOverlay}>
            <View style={styles.detailModalContent}>
              <Image
                source={{ uri: selectedAlert.image }}
                style={styles.detailImage}
                contentFit="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.detailImageGradient}
              />

              <Pressable style={styles.detailClose} onPress={() => setSelectedAlert(null)}>
                <X size={24} color={colors.textLight} />
              </Pressable>

              <View style={styles.detailContent}>
                <View style={styles.detailHeader}>
                  <View>
                    <Text style={styles.detailDestination}>{selectedAlert.destination}</Text>
                    {selectedAlert.origin && (
                      <Text style={styles.detailOrigin}>From {selectedAlert.origin}</Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.detailTypeBadge,
                      {
                        backgroundColor:
                          selectedAlert.type === 'flight' ? colors.primary : colors.secondary,
                      },
                    ]}
                  >
                    {selectedAlert.type === 'flight' ? (
                      <Plane size={14} color={colors.textLight} />
                    ) : (
                      <Building2 size={14} color={colors.textLight} />
                    )}
                    <Text style={styles.detailTypeText}>
                      {selectedAlert.type.charAt(0).toUpperCase() + selectedAlert.type.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailPricing}>
                  <View style={styles.detailPriceItem}>
                    <Text style={styles.detailPriceLabel}>Current</Text>
                    <Text style={styles.detailPriceValue}>${selectedAlert.currentPrice}</Text>
                  </View>
                  <View style={styles.detailPriceItem}>
                    <Text style={styles.detailPriceLabel}>Original</Text>
                    <Text style={styles.detailPriceValueStrike}>
                      ${selectedAlert.originalPrice}
                    </Text>
                  </View>
                  <View style={styles.detailPriceItem}>
                    <Text style={styles.detailPriceLabel}>Lowest</Text>
                    <Text style={[styles.detailPriceValue, { color: colors.success }]}>
                      ${selectedAlert.lowestPrice}
                    </Text>
                  </View>
                  <View style={styles.detailPriceItem}>
                    <Text style={styles.detailPriceLabel}>Target</Text>
                    <Text style={[styles.detailPriceValue, { color: colors.primary }]}>
                      ${selectedAlert.targetPrice}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailInfo}>
                  <View style={styles.detailInfoRow}>
                    <Calendar size={16} color={colors.textSecondary} />
                    <Text style={styles.detailInfoText}>
                      {formatDate(selectedAlert.dates.start)} -{' '}
                      {formatDate(selectedAlert.dates.end)}
                    </Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <MapPin size={16} color={colors.textSecondary} />
                    <Text style={styles.detailInfoText}>{selectedAlert.provider}</Text>
                  </View>
                  {selectedAlert.details && (
                    <View style={styles.detailInfoRow}>
                      <History size={16} color={colors.textSecondary} />
                      <Text style={styles.detailInfoText}>{selectedAlert.details}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailActions}>
                  <Pressable
                    style={styles.detailActionButton}
                    onPress={() => handleToggleAlert(selectedAlert.id)}
                  >
                    {selectedAlert.isActive ? (
                      <>
                        <BellOff size={20} color={colors.warning} />
                        <Text style={styles.detailActionText}>Pause Alert</Text>
                      </>
                    ) : (
                      <>
                        <Bell size={20} color={colors.success} />
                        <Text style={styles.detailActionText}>Enable Alert</Text>
                      </>
                    )}
                  </Pressable>
                  <Pressable
                    style={[styles.detailActionButton, styles.detailActionDanger]}
                    onPress={() => handleDeleteAlert(selectedAlert.id)}
                  >
                    <Trash2 size={20} color={colors.error} />
                    <Text style={[styles.detailActionText, { color: colors.error }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}
      </Modal>

      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alert Settings</Text>
              <Pressable onPress={() => setShowSettingsModal(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Bell size={20} color={colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Push Notifications</Text>
                  <Text style={styles.settingDescription}>Receive alerts when prices change</Text>
                </View>
              </View>
              <Switch
                value={globalNotifications}
                onValueChange={setGlobalNotifications}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={globalNotifications ? colors.primary : colors.textTertiary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <TrendingDown size={20} color={colors.success} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Price Drop Threshold</Text>
                  <Text style={styles.settingDescription}>
                    Notify when price drops by at least {priceDropThreshold}%
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.thresholdSelector}>
              {[5, 10, 15, 20, 25].map((value) => (
                <Pressable
                  key={value}
                  style={[
                    styles.thresholdOption,
                    priceDropThreshold === value && styles.thresholdOptionActive,
                  ]}
                  onPress={() => setPriceDropThreshold(value)}
                >
                  <Text
                    style={[
                      styles.thresholdText,
                      priceDropThreshold === value && styles.thresholdTextActive,
                    ]}
                  >
                    {value}%
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingNote}>
              <AlertTriangle size={16} color={colors.warning} />
              <Text style={styles.settingNoteText}>
                Prices are checked multiple times daily. Actual prices may vary when booking.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textLight,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textLight,
  },
  statLabel: {
    fontSize: 12,
    color: colors.accent,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  notificationBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  notificationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textLight,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: colors.text,
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.textLight,
  },
  markAllRead: {
    alignSelf: 'flex-end',
    marginRight: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  markAllReadText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  alertImage: {
    width: '100%',
    height: 100,
  },
  alertImageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  targetBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  targetBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textLight,
  },
  alertTypeIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    padding: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  alertDestination: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  alertToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertOrigin: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  alertPricing: {
    marginBottom: 12,
  },
  priceMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPrice: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  dropBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  increaseBadge: {
    backgroundColor: `${colors.error}15`,
  },
  dropText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  increaseText: {
    color: colors.error,
  },
  originalPrice: {
    fontSize: 13,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  chartContainer: {
    marginBottom: 12,
  },
  chart: {
    height: 50,
    width: 120,
    position: 'relative',
  },
  chartLine: {
    position: 'absolute',
    height: 3,
    borderRadius: 1.5,
  },
  chartDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertDateText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  alertProvider: {
    fontSize: 12,
    color: colors.textSecondary,
    maxWidth: 120,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  notificationUnread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  notificationDestination: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notificationPrices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  notificationOldPrice: {
    fontSize: 13,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  notificationNewPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  notificationTime: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
  },
  typeOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  typeOptionTextActive: {
    color: colors.textLight,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  priceInputField: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: colors.text,
  },
  inputHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  createButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
  },
  detailModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  detailImage: {
    width: '100%',
    height: 200,
  },
  detailImageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  detailClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    padding: 24,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  detailDestination: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  detailOrigin: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  detailTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  detailTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
  },
  detailPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  detailPriceItem: {
    alignItems: 'center',
  },
  detailPriceLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  detailPriceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  detailPriceValueStrike: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  detailInfo: {
    marginBottom: 24,
    gap: 12,
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
  },
  detailActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
  },
  detailActionDanger: {
    backgroundColor: `${colors.error}10`,
  },
  detailActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  thresholdSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  thresholdOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  thresholdOptionActive: {
    backgroundColor: colors.primary,
  },
  thresholdText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  thresholdTextActive: {
    color: colors.textLight,
  },
  settingDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  settingNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: `${colors.warning}15`,
    padding: 14,
    borderRadius: 12,
  },
  settingNoteText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
