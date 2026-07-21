/* eslint-disable max-lines -- tracked in #1 */
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Briefcase,
  Plus,
  Check,
  Trash2,
  CloudSun,
  Calendar,
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Shirt,
  Droplets,
  Laptop,
  FileText,
  Heart,
  Tent,
  Dumbbell,
  Baby,
  Sun,
  Umbrella,
  Snowflake,
  Wind,
  X,
  Edit2,
  Share2,
  Copy,
  RotateCcw,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');

interface PackingItem {
  id: string;
  name: string;
  quantity: number;
  isPacked: boolean;
  isCustom?: boolean;
}

interface PackingCategory {
  id: string;
  name: string;
  icon: string;
  items: PackingItem[];
  isExpanded: boolean;
}

interface PackingList {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  weather: WeatherType;
  activities: string[];
  categories: PackingCategory[];
  createdAt: string;
  progress: number;
}

type WeatherType = 'sunny' | 'rainy' | 'cold' | 'mixed';

interface ActivityOption {
  id: string;
  name: string;
  icon: string;
}

const WEATHER_OPTIONS: { id: WeatherType; name: string; icon: string; temp: string }[] = [
  { id: 'sunny', name: 'Sunny & Hot', icon: 'sun', temp: '25°C+' },
  { id: 'rainy', name: 'Rainy', icon: 'umbrella', temp: '15-25°C' },
  { id: 'cold', name: 'Cold', icon: 'snowflake', temp: 'Below 10°C' },
  { id: 'mixed', name: 'Mixed', icon: 'wind', temp: 'Variable' },
];

const ACTIVITY_OPTIONS: ActivityOption[] = [
  { id: 'beach', name: 'Beach', icon: '🏖️' },
  { id: 'hiking', name: 'Hiking', icon: '🥾' },
  { id: 'business', name: 'Business', icon: '💼' },
  { id: 'nightlife', name: 'Nightlife', icon: '🌙' },
  { id: 'adventure', name: 'Adventure', icon: '🎢' },
  { id: 'cultural', name: 'Cultural', icon: '🏛️' },
  { id: 'photography', name: 'Photography', icon: '📸' },
  { id: 'fitness', name: 'Fitness', icon: '💪' },
  { id: 'water_sports', name: 'Water Sports', icon: '🏄' },
  { id: 'winter_sports', name: 'Winter Sports', icon: '⛷️' },
  { id: 'camping', name: 'Camping', icon: '🏕️' },
  { id: 'romantic', name: 'Romantic', icon: '❤️' },
];

const BASE_ESSENTIALS: PackingItem[] = [
  { id: 'e1', name: 'Passport/ID', quantity: 1, isPacked: false },
  { id: 'e2', name: 'Wallet', quantity: 1, isPacked: false },
  { id: 'e3', name: 'Phone & Charger', quantity: 1, isPacked: false },
  { id: 'e4', name: 'Travel Insurance Docs', quantity: 1, isPacked: false },
  { id: 'e5', name: 'Credit/Debit Cards', quantity: 2, isPacked: false },
  { id: 'e6', name: 'Cash (Local Currency)', quantity: 1, isPacked: false },
  { id: 'e7', name: 'Copies of Documents', quantity: 1, isPacked: false },
];

const BASE_TOILETRIES: PackingItem[] = [
  { id: 't1', name: 'Toothbrush & Toothpaste', quantity: 1, isPacked: false },
  { id: 't2', name: 'Deodorant', quantity: 1, isPacked: false },
  { id: 't3', name: 'Shampoo & Conditioner', quantity: 1, isPacked: false },
  { id: 't4', name: 'Medications', quantity: 1, isPacked: false },
  { id: 't5', name: 'First Aid Kit', quantity: 1, isPacked: false },
  { id: 't6', name: 'Razor', quantity: 1, isPacked: false },
];

const BASE_ELECTRONICS: PackingItem[] = [
  { id: 'el1', name: 'Power Bank', quantity: 1, isPacked: false },
  { id: 'el2', name: 'Universal Adapter', quantity: 1, isPacked: false },
  { id: 'el3', name: 'Headphones/Earbuds', quantity: 1, isPacked: false },
];

// eslint-disable-next-line complexity -- tracked in #1
function generatePackingList(
  destination: string,
  startDate: string,
  endDate: string,
  weather: WeatherType,
  activities: string[],
  tripDays: number
): PackingCategory[] {
  const categories: PackingCategory[] = [];

  categories.push({
    id: 'essentials',
    name: 'Essentials',
    icon: 'file',
    items: [...BASE_ESSENTIALS],
    isExpanded: true,
  });

  const clothingItems: PackingItem[] = [
    { id: 'c1', name: 'Underwear', quantity: Math.min(tripDays + 2, 10), isPacked: false },
    { id: 'c2', name: 'Socks', quantity: Math.min(tripDays + 2, 10), isPacked: false },
    { id: 'c3', name: 'Sleepwear', quantity: 2, isPacked: false },
  ];

  if (weather === 'sunny') {
    clothingItems.push(
      { id: 'c4', name: 'T-Shirts', quantity: Math.min(tripDays, 7), isPacked: false },
      { id: 'c5', name: 'Shorts', quantity: Math.ceil(tripDays / 2), isPacked: false },
      { id: 'c6', name: 'Light Dress/Linen Pants', quantity: 2, isPacked: false },
      { id: 'c7', name: 'Sunglasses', quantity: 1, isPacked: false },
      { id: 'c8', name: 'Sun Hat', quantity: 1, isPacked: false },
      { id: 'c9', name: 'Sandals', quantity: 1, isPacked: false }
    );
  } else if (weather === 'cold') {
    clothingItems.push(
      { id: 'c10', name: 'Warm Sweaters', quantity: Math.ceil(tripDays / 2), isPacked: false },
      { id: 'c11', name: 'Long Pants/Jeans', quantity: Math.ceil(tripDays / 2), isPacked: false },
      { id: 'c12', name: 'Winter Jacket', quantity: 1, isPacked: false },
      { id: 'c13', name: 'Thermal Underwear', quantity: 2, isPacked: false },
      { id: 'c14', name: 'Warm Hat', quantity: 1, isPacked: false },
      { id: 'c15', name: 'Gloves', quantity: 1, isPacked: false },
      { id: 'c16', name: 'Scarf', quantity: 1, isPacked: false },
      { id: 'c17', name: 'Warm Boots', quantity: 1, isPacked: false }
    );
  } else if (weather === 'rainy') {
    clothingItems.push(
      { id: 'c18', name: 'T-Shirts/Tops', quantity: Math.min(tripDays, 7), isPacked: false },
      { id: 'c19', name: 'Long Pants', quantity: Math.ceil(tripDays / 2), isPacked: false },
      { id: 'c20', name: 'Rain Jacket/Coat', quantity: 1, isPacked: false },
      { id: 'c21', name: 'Umbrella', quantity: 1, isPacked: false },
      { id: 'c22', name: 'Waterproof Shoes', quantity: 1, isPacked: false },
      { id: 'c23', name: 'Light Cardigan', quantity: 2, isPacked: false }
    );
  } else {
    clothingItems.push(
      { id: 'c24', name: 'T-Shirts/Tops', quantity: Math.min(tripDays, 7), isPacked: false },
      { id: 'c25', name: 'Long Pants', quantity: Math.ceil(tripDays / 3), isPacked: false },
      { id: 'c26', name: 'Shorts', quantity: Math.ceil(tripDays / 3), isPacked: false },
      { id: 'c27', name: 'Light Jacket', quantity: 1, isPacked: false },
      { id: 'c28', name: 'Umbrella (Compact)', quantity: 1, isPacked: false },
      { id: 'c29', name: 'Layers/Cardigan', quantity: 2, isPacked: false }
    );
  }

  categories.push({
    id: 'clothing',
    name: 'Clothing',
    icon: 'shirt',
    items: clothingItems,
    isExpanded: true,
  });

  const toiletryItems = [...BASE_TOILETRIES];
  if (weather === 'sunny') {
    toiletryItems.push(
      { id: 't7', name: 'Sunscreen (SPF 50+)', quantity: 1, isPacked: false },
      { id: 't8', name: 'After-Sun Lotion', quantity: 1, isPacked: false },
      { id: 't9', name: 'Lip Balm with SPF', quantity: 1, isPacked: false },
      { id: 't10', name: 'Insect Repellent', quantity: 1, isPacked: false }
    );
  }
  if (weather === 'cold') {
    toiletryItems.push(
      { id: 't11', name: 'Moisturizer', quantity: 1, isPacked: false },
      { id: 't12', name: 'Lip Balm', quantity: 1, isPacked: false },
      { id: 't13', name: 'Hand Cream', quantity: 1, isPacked: false }
    );
  }

  categories.push({
    id: 'toiletries',
    name: 'Toiletries',
    icon: 'droplets',
    items: toiletryItems,
    isExpanded: false,
  });

  const electronicsItems = [...BASE_ELECTRONICS];
  if (activities.includes('photography')) {
    electronicsItems.push(
      { id: 'el4', name: 'Camera', quantity: 1, isPacked: false },
      { id: 'el5', name: 'Camera Batteries/Charger', quantity: 1, isPacked: false },
      { id: 'el6', name: 'Memory Cards', quantity: 2, isPacked: false },
      { id: 'el7', name: 'Tripod', quantity: 1, isPacked: false }
    );
  }
  if (activities.includes('business')) {
    electronicsItems.push(
      { id: 'el8', name: 'Laptop', quantity: 1, isPacked: false },
      { id: 'el9', name: 'Laptop Charger', quantity: 1, isPacked: false },
      { id: 'el10', name: 'USB Drive', quantity: 1, isPacked: false }
    );
  }

  categories.push({
    id: 'electronics',
    name: 'Electronics',
    icon: 'laptop',
    items: electronicsItems,
    isExpanded: false,
  });

  if (activities.includes('beach') || activities.includes('water_sports')) {
    categories.push({
      id: 'beach',
      name: 'Beach & Water',
      icon: 'sun',
      items: [
        { id: 'b1', name: 'Swimwear', quantity: 2, isPacked: false },
        { id: 'b2', name: 'Beach Towel', quantity: 1, isPacked: false },
        { id: 'b3', name: 'Waterproof Phone Case', quantity: 1, isPacked: false },
        { id: 'b4', name: 'Reef-Safe Sunscreen', quantity: 1, isPacked: false },
        { id: 'b5', name: 'Snorkel Gear', quantity: 1, isPacked: false },
        { id: 'b6', name: 'Water Shoes', quantity: 1, isPacked: false },
      ],
      isExpanded: false,
    });
  }

  if (activities.includes('hiking') || activities.includes('adventure')) {
    categories.push({
      id: 'outdoor',
      name: 'Outdoor & Hiking',
      icon: 'tent',
      items: [
        { id: 'o1', name: 'Hiking Boots', quantity: 1, isPacked: false },
        { id: 'o2', name: 'Daypack/Backpack', quantity: 1, isPacked: false },
        { id: 'o3', name: 'Water Bottle', quantity: 1, isPacked: false },
        { id: 'o4', name: 'Trail Snacks', quantity: 1, isPacked: false },
        { id: 'o5', name: 'Trekking Poles', quantity: 1, isPacked: false },
        { id: 'o6', name: 'Quick-Dry Towel', quantity: 1, isPacked: false },
        { id: 'o7', name: 'Headlamp/Flashlight', quantity: 1, isPacked: false },
      ],
      isExpanded: false,
    });
  }

  if (activities.includes('business')) {
    categories.push({
      id: 'business',
      name: 'Business',
      icon: 'briefcase',
      items: [
        { id: 'bus1', name: 'Business Cards', quantity: 1, isPacked: false },
        { id: 'bus2', name: 'Formal Shirts', quantity: Math.ceil(tripDays / 2), isPacked: false },
        { id: 'bus3', name: 'Dress Pants/Skirt', quantity: 2, isPacked: false },
        { id: 'bus4', name: 'Blazer/Jacket', quantity: 1, isPacked: false },
        { id: 'bus5', name: 'Dress Shoes', quantity: 1, isPacked: false },
        { id: 'bus6', name: 'Tie/Accessories', quantity: 2, isPacked: false },
        { id: 'bus7', name: 'Notebook/Planner', quantity: 1, isPacked: false },
      ],
      isExpanded: false,
    });
  }

  if (activities.includes('fitness')) {
    categories.push({
      id: 'fitness',
      name: 'Fitness',
      icon: 'dumbbell',
      items: [
        { id: 'f1', name: 'Workout Clothes', quantity: Math.min(tripDays, 5), isPacked: false },
        { id: 'f2', name: 'Running Shoes', quantity: 1, isPacked: false },
        { id: 'f3', name: 'Resistance Bands', quantity: 1, isPacked: false },
        { id: 'f4', name: 'Jump Rope', quantity: 1, isPacked: false },
        { id: 'f5', name: 'Yoga Mat (Travel)', quantity: 1, isPacked: false },
      ],
      isExpanded: false,
    });
  }

  if (activities.includes('winter_sports')) {
    categories.push({
      id: 'winter',
      name: 'Winter Sports',
      icon: 'snowflake',
      items: [
        { id: 'w1', name: 'Ski/Snow Pants', quantity: 1, isPacked: false },
        { id: 'w2', name: 'Ski Jacket', quantity: 1, isPacked: false },
        { id: 'w3', name: 'Thermal Base Layers', quantity: 3, isPacked: false },
        { id: 'w4', name: 'Ski Socks', quantity: 3, isPacked: false },
        { id: 'w5', name: 'Goggles', quantity: 1, isPacked: false },
        { id: 'w6', name: 'Neck Gaiter', quantity: 1, isPacked: false },
        { id: 'w7', name: 'Hand/Toe Warmers', quantity: 5, isPacked: false },
      ],
      isExpanded: false,
    });
  }

  if (activities.includes('nightlife') || activities.includes('romantic')) {
    categories.push({
      id: 'evening',
      name: 'Evening & Nightlife',
      icon: 'heart',
      items: [
        { id: 'n1', name: 'Evening Outfit', quantity: 2, isPacked: false },
        { id: 'n2', name: 'Dress Shoes/Heels', quantity: 1, isPacked: false },
        { id: 'n3', name: 'Accessories/Jewelry', quantity: 1, isPacked: false },
        { id: 'n4', name: 'Cologne/Perfume', quantity: 1, isPacked: false },
        { id: 'n5', name: 'Small Clutch/Bag', quantity: 1, isPacked: false },
      ],
      isExpanded: false,
    });
  }

  if (activities.includes('camping')) {
    categories.push({
      id: 'camping',
      name: 'Camping',
      icon: 'tent',
      items: [
        { id: 'camp1', name: 'Tent', quantity: 1, isPacked: false },
        { id: 'camp2', name: 'Sleeping Bag', quantity: 1, isPacked: false },
        { id: 'camp3', name: 'Sleeping Pad', quantity: 1, isPacked: false },
        { id: 'camp4', name: 'Camping Stove', quantity: 1, isPacked: false },
        { id: 'camp5', name: 'Cookware Set', quantity: 1, isPacked: false },
        { id: 'camp6', name: 'Camping Lantern', quantity: 1, isPacked: false },
        { id: 'camp7', name: 'Multi-tool', quantity: 1, isPacked: false },
        { id: 'camp8', name: 'Fire Starter', quantity: 1, isPacked: false },
      ],
      isExpanded: false,
    });
  }

  return categories;
}

function getCategoryIcon(iconName: string, color: string) {
  const iconProps = { size: 20, color };
  switch (iconName) {
    case 'file':
      return <FileText {...iconProps} />;
    case 'shirt':
      return <Shirt {...iconProps} />;
    case 'droplets':
      return <Droplets {...iconProps} />;
    case 'laptop':
      return <Laptop {...iconProps} />;
    case 'sun':
      return <Sun {...iconProps} />;
    case 'tent':
      return <Tent {...iconProps} />;
    case 'briefcase':
      return <Briefcase {...iconProps} />;
    case 'dumbbell':
      return <Dumbbell {...iconProps} />;
    case 'snowflake':
      return <Snowflake {...iconProps} />;
    case 'heart':
      return <Heart {...iconProps} />;
    default:
      return <Briefcase {...iconProps} />;
  }
}

function getWeatherIcon(weather: WeatherType, size: number = 20) {
  const iconProps = { size, color: colors.textLight };
  switch (weather) {
    case 'sunny':
      return <Sun {...iconProps} />;
    case 'rainy':
      return <Umbrella {...iconProps} />;
    case 'cold':
      return <Snowflake {...iconProps} />;
    case 'mixed':
      return <Wind {...iconProps} />;
    default:
      return <CloudSun {...iconProps} />;
  }
}

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function PackingListScreen() {
  const router = useRouter();
  const [showGenerator, setShowGenerator] = useState(true);
  const [packingList, setPackingList] = useState<PackingList | null>(null);

  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedWeather, setSelectedWeather] = useState<WeatherType | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemCategoryId, setAddItemCategoryId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const calculateTripDays = useCallback((start: string, end: string): number => {
    if (!start || !end) return 7;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 1);
  }, []);

  const generateList = useCallback(() => {
    if (!destination.trim()) {
      Alert.alert('Missing Information', 'Please enter a destination');
      return;
    }
    if (!selectedWeather) {
      Alert.alert('Missing Information', 'Please select expected weather');
      return;
    }

    triggerHaptic();

    const tripDays = calculateTripDays(startDate, endDate);
    const categories = generatePackingList(
      destination,
      startDate,
      endDate,
      selectedWeather,
      selectedActivities,
      tripDays
    );

    const newList: PackingList = {
      id: Date.now().toString(),
      name: `${destination} Trip`,
      destination,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate:
        endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      weather: selectedWeather,
      activities: selectedActivities,
      categories,
      createdAt: new Date().toISOString(),
      progress: 0,
    };

    setPackingList(newList);
    setShowGenerator(false);
    console.log('Generated packing list:', newList.name);
  }, [
    destination,
    startDate,
    endDate,
    selectedWeather,
    selectedActivities,
    triggerHaptic,
    calculateTripDays,
  ]);

  const toggleActivity = useCallback(
    (activityId: string) => {
      triggerHaptic();
      setSelectedActivities((prev) =>
        prev.includes(activityId) ? prev.filter((id) => id !== activityId) : [...prev, activityId]
      );
    },
    [triggerHaptic]
  );

  const toggleCategory = useCallback(
    (categoryId: string) => {
      if (!packingList) return;
      triggerHaptic();

      setPackingList((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.map((cat) =>
            cat.id === categoryId ? { ...cat, isExpanded: !cat.isExpanded } : cat
          ),
        };
      });
    },
    [packingList, triggerHaptic]
  );

  const toggleItem = useCallback(
    (categoryId: string, itemId: string) => {
      if (!packingList) return;
      triggerHaptic();

      setPackingList((prev) => {
        if (!prev) return prev;
        const newCategories = prev.categories.map((cat) => {
          if (cat.id === categoryId) {
            return {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId ? { ...item, isPacked: !item.isPacked } : item
              ),
            };
          }
          return cat;
        });

        const totalItems = newCategories.reduce((sum, cat) => sum + cat.items.length, 0);
        const packedItems = newCategories.reduce(
          (sum, cat) => sum + cat.items.filter((item) => item.isPacked).length,
          0
        );
        const progress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

        return { ...prev, categories: newCategories, progress };
      });
    },
    [packingList, triggerHaptic]
  );

  const deleteItem = useCallback(
    (categoryId: string, itemId: string) => {
      if (!packingList) return;
      triggerHaptic();

      Alert.alert('Delete Item', 'Are you sure you want to remove this item?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPackingList((prev) => {
              if (!prev) return prev;
              const newCategories = prev.categories.map((cat) => {
                if (cat.id === categoryId) {
                  return {
                    ...cat,
                    items: cat.items.filter((item) => item.id !== itemId),
                  };
                }
                return cat;
              });

              const totalItems = newCategories.reduce((sum, cat) => sum + cat.items.length, 0);
              const packedItems = newCategories.reduce(
                (sum, cat) => sum + cat.items.filter((item) => item.isPacked).length,
                0
              );
              const progress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

              return { ...prev, categories: newCategories, progress };
            });
          },
        },
      ]);
    },
    [packingList, triggerHaptic]
  );

  const openAddItemModal = useCallback(
    (categoryId: string) => {
      triggerHaptic();
      setAddItemCategoryId(categoryId);
      setNewItemName('');
      setNewItemQuantity('1');
      setShowAddItemModal(true);
    },
    [triggerHaptic]
  );

  const addCustomItem = useCallback(() => {
    if (!packingList || !addItemCategoryId || !newItemName.trim()) return;
    triggerHaptic();

    const quantity = parseInt(newItemQuantity, 10) || 1;
    const newItem: PackingItem = {
      id: `custom-${Date.now()}`,
      name: newItemName.trim(),
      quantity,
      isPacked: false,
      isCustom: true,
    };

    setPackingList((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: prev.categories.map((cat) =>
          cat.id === addItemCategoryId ? { ...cat, items: [...cat.items, newItem] } : cat
        ),
      };
    });

    setShowAddItemModal(false);
    console.log('Added custom item:', newItem.name);
  }, [packingList, addItemCategoryId, newItemName, newItemQuantity, triggerHaptic]);

  const resetList = useCallback(() => {
    triggerHaptic();
    Alert.alert('Reset Progress', 'This will uncheck all items. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setPackingList((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              progress: 0,
              categories: prev.categories.map((cat) => ({
                ...cat,
                items: cat.items.map((item) => ({ ...item, isPacked: false })),
              })),
            };
          });
        },
      },
    ]);
  }, [triggerHaptic]);

  const startNewList = useCallback(() => {
    triggerHaptic();
    setPackingList(null);
    setDestination('');
    setStartDate('');
    setEndDate('');
    setSelectedWeather(null);
    setSelectedActivities([]);
    setShowGenerator(true);
  }, [triggerHaptic]);

  const progress = packingList?.progress ?? 0;
  const totalItems = packingList?.categories.reduce((sum, cat) => sum + cat.items.length, 0) ?? 0;
  const packedItems =
    packingList?.categories.reduce(
      (sum, cat) => sum + cat.items.filter((item) => item.isPacked).length,
      0
    ) ?? 0;

  if (showGenerator) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          style={styles.headerGradient}
        />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.textLight} />
            </Pressable>
            <Text style={styles.headerTitle}>Smart Packing List</Text>
            <View style={styles.headerRight} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.generatorContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroSection}>
              <View style={styles.heroIcon}>
                <Sparkles size={32} color={colors.secondary} />
              </View>
              <Text style={styles.heroTitle}>Never Forget Anything</Text>
              <Text style={styles.heroSubtitle}>
                Our AI generates the perfect packing list based on your trip details
              </Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Destination</Text>
                <View style={styles.inputContainer}>
                  <MapPin size={20} color={colors.textTertiary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Where are you going?"
                    placeholderTextColor={colors.textTertiary}
                    value={destination}
                    onChangeText={setDestination}
                  />
                </View>
              </View>

              <View style={styles.dateRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <View style={styles.inputContainer}>
                    <Calendar size={18} color={colors.textTertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textTertiary}
                      value={startDate}
                      onChangeText={setStartDate}
                    />
                  </View>
                </View>
                <View style={styles.dateSpacer} />
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>End Date</Text>
                  <View style={styles.inputContainer}>
                    <Calendar size={18} color={colors.textTertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textTertiary}
                      value={endDate}
                      onChangeText={setEndDate}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Expected Weather</Text>
                <View style={styles.weatherGrid}>
                  {WEATHER_OPTIONS.map((option) => (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.weatherOption,
                        selectedWeather === option.id && styles.weatherOptionSelected,
                      ]}
                      onPress={() => {
                        triggerHaptic();
                        setSelectedWeather(option.id);
                      }}
                    >
                      {option.id === 'sunny' && (
                        <Sun
                          size={24}
                          color={selectedWeather === option.id ? colors.textLight : colors.warning}
                        />
                      )}
                      {option.id === 'rainy' && (
                        <Umbrella
                          size={24}
                          color={
                            selectedWeather === option.id ? colors.textLight : colors.primaryLight
                          }
                        />
                      )}
                      {option.id === 'cold' && (
                        <Snowflake
                          size={24}
                          color={
                            selectedWeather === option.id ? colors.textLight : colors.accentDark
                          }
                        />
                      )}
                      {option.id === 'mixed' && (
                        <Wind
                          size={24}
                          color={
                            selectedWeather === option.id ? colors.textLight : colors.textSecondary
                          }
                        />
                      )}
                      <Text
                        style={[
                          styles.weatherName,
                          selectedWeather === option.id && styles.weatherNameSelected,
                        ]}
                      >
                        {option.name}
                      </Text>
                      <Text
                        style={[
                          styles.weatherTemp,
                          selectedWeather === option.id && styles.weatherTempSelected,
                        ]}
                      >
                        {option.temp}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Planned Activities</Text>
                <Text style={styles.inputHint}>Select all that apply</Text>
                <View style={styles.activitiesGrid}>
                  {ACTIVITY_OPTIONS.map((activity) => (
                    <Pressable
                      key={activity.id}
                      style={[
                        styles.activityChip,
                        selectedActivities.includes(activity.id) && styles.activityChipSelected,
                      ]}
                      onPress={() => toggleActivity(activity.id)}
                    >
                      <Text style={styles.activityEmoji}>{activity.icon}</Text>
                      <Text
                        style={[
                          styles.activityName,
                          selectedActivities.includes(activity.id) && styles.activityNameSelected,
                        ]}
                      >
                        {activity.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <Pressable style={styles.generateButton} onPress={generateList}>
              <LinearGradient
                colors={[colors.secondary, colors.secondaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.generateButtonGradient}
              >
                <Sparkles size={22} color={colors.textLight} />
                <Text style={styles.generateButtonText}>Generate Packing List</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.headerGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.textLight} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{packingList?.name}</Text>
            <View style={styles.headerMeta}>
              {getWeatherIcon(packingList?.weather || 'mixed', 14)}
              <Text style={styles.headerMetaText}>{packingList?.destination}</Text>
            </View>
          </View>
          <Pressable style={styles.headerAction} onPress={startNewList}>
            <Plus size={22} color={colors.textLight} />
          </Pressable>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {packedItems} of {totalItems} items packed
            </Text>
            <Text style={styles.progressPercent}>{progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%` },
                progress === 100 && styles.progressComplete,
              ]}
            />
          </View>
          {progress === 100 && (
            <View style={styles.completeMessage}>
              <Check size={16} color={colors.success} />
              <Text style={styles.completeText}>All packed! Have a great trip!</Text>
            </View>
          )}
        </View>

        <View style={styles.actionBar}>
          <Pressable style={styles.actionButton} onPress={resetList}>
            <RotateCcw size={18} color={colors.textSecondary} />
            <Text style={styles.actionButtonText}>Reset</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={startNewList}>
            <Edit2 size={18} color={colors.textSecondary} />
            <Text style={styles.actionButtonText}>New List</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.listScrollView}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {packingList?.categories.map((category) => (
            <View key={category.id} style={styles.categoryCard}>
              <Pressable style={styles.categoryHeader} onPress={() => toggleCategory(category.id)}>
                <View style={styles.categoryLeft}>
                  <View style={styles.categoryIcon}>
                    {getCategoryIcon(category.icon, colors.primary)}
                  </View>
                  <View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryCount}>
                      {category.items.filter((i) => i.isPacked).length}/{category.items.length}{' '}
                      packed
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryRight}>
                  <Pressable
                    style={styles.addItemButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      openAddItemModal(category.id);
                    }}
                  >
                    <Plus size={18} color={colors.primary} />
                  </Pressable>
                  {category.isExpanded ? (
                    <ChevronDown size={20} color={colors.textTertiary} />
                  ) : (
                    <ChevronRight size={20} color={colors.textTertiary} />
                  )}
                </View>
              </Pressable>

              {category.isExpanded && (
                <View style={styles.categoryItems}>
                  {category.items.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.itemRow}
                      onPress={() => toggleItem(category.id, item.id)}
                    >
                      <Pressable
                        style={[styles.checkbox, item.isPacked && styles.checkboxChecked]}
                        onPress={() => toggleItem(category.id, item.id)}
                      >
                        {item.isPacked && <Check size={14} color={colors.textLight} />}
                      </Pressable>
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, item.isPacked && styles.itemNamePacked]}>
                          {item.name}
                        </Text>
                        {item.quantity > 1 && (
                          <Text style={styles.itemQuantity}>×{item.quantity}</Text>
                        )}
                        {item.isCustom && (
                          <View style={styles.customBadge}>
                            <Text style={styles.customBadgeText}>Custom</Text>
                          </View>
                        )}
                      </View>
                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => deleteItem(category.id, item.id)}
                      >
                        <Trash2 size={16} color={colors.textTertiary} />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ))}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showAddItemModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddItemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Item</Text>
              <Pressable onPress={() => setShowAddItemModal(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Item Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., Camera Tripod"
                  placeholderTextColor={colors.textTertiary}
                  value={newItemName}
                  onChangeText={setNewItemName}
                  autoFocus
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Quantity</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="1"
                  placeholderTextColor={colors.textTertiary}
                  value={newItemQuantity}
                  onChangeText={setNewItemQuantity}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <Pressable
              style={[styles.modalButton, !newItemName.trim() && styles.modalButtonDisabled]}
              onPress={addCustomItem}
              disabled={!newItemName.trim()}
            >
              <Text style={styles.modalButtonText}>Add Item</Text>
            </Pressable>
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
    height: 180,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textLight,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerMetaText: {
    fontSize: 13,
    color: colors.textLight,
    opacity: 0.9,
  },
  headerRight: {
    width: 40,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  generatorContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.textLight,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
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
  inputHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: -4,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: colors.text,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateSpacer: {
    width: 12,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  weatherOption: {
    width: (width - 72) / 2 - 5,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weatherOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weatherName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  weatherNameSelected: {
    color: colors.textLight,
  },
  weatherTemp: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  weatherTempSelected: {
    color: colors.textLight,
    opacity: 0.9,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activityChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.primary,
  },
  activityEmoji: {
    fontSize: 16,
  },
  activityName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  activityNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  generateButton: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textLight,
  },
  progressSection: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressComplete: {
    backgroundColor: colors.success,
  },
  completeMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  completeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  listScrollView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  categoryCount: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addItemButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryItems: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  itemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 8,
  },
  itemName: {
    fontSize: 15,
    color: colors.text,
  },
  itemNamePacked: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  itemQuantity: {
    fontSize: 13,
    color: colors.textTertiary,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  customBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textLight,
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
  },
});
