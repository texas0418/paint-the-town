import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  SlidersHorizontal,
  CalendarHeart,
  BellRing,
  LogOut,
  ChevronRight,
  Crown,
  Camera,
} from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/services';
import { supabase } from '@/lib/supabase';
import { listPlans } from '@/services/datePlanService';
import {
  ReminderSettings,
  describeReminder,
  getReminderSettings,
} from '@/services/dateNightReminderService';
import { DatePlan } from '@/types/planner';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const [plans, setPlans] = useState<DatePlan[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [reminder, setReminder] = useState<ReminderSettings | null>(null);

  useFocusEffect(
    useCallback(() => {
      listPlans()
        .then(setPlans)
        .catch((e) => console.error('Failed to load plans:', e));
      getReminderSettings()
        .then(setReminder)
        .catch(() => {});
      supabase.auth.getUser().then(({ data: { user: authUser } }) => {
        if (!authUser) return;
        supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', authUser.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.avatar_url) setAvatarUrl(data.avatar_url);
          });
      });
    }, [])
  );

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setUploadingAvatar(true);

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;

      const response = await fetch(result.assets[0].uri);
      const fileBody = await response.arrayBuffer();
      const path = `${authUser.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, fileBody, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const publicUrl = `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', authUser.id);
      setAvatarUrl(publicUrl);
    } catch (e) {
      Alert.alert('Photo upload failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const displayName = user?.fullName || 'Traveler';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const completed = plans.filter((p) => p.status === 'completed').length;

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={colors.gradient.primary} style={styles.headerGradient}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <Pressable style={styles.avatar} onPress={handlePickAvatar}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
                ) : (
                  <Text style={styles.avatarText} maxFontSizeMultiplier={1.1}>
                    {initials}
                  </Text>
                )}
                <View style={styles.avatarBadge}>
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color={colors.textLight} />
                  ) : (
                    <Camera size={13} color={colors.textLight} />
                  )}
                </View>
              </Pressable>
              <Text style={styles.name}>{displayName}</Text>
              {!!user?.email && <Text style={styles.email}>{user.email}</Text>}
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{plans.length}</Text>
              <Text style={styles.statLabel}>Plans</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{completed}</Text>
              <Text style={styles.statLabel}>Dates completed</Text>
            </View>
          </View>

          <Pressable style={styles.row} onPress={() => router.push('/taste-profile')}>
            <View style={styles.rowIcon}>
              <SlidersHorizontal size={20} color={colors.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>My taste profile</Text>
              <Text style={styles.rowDesc}>Food, activities, music, drinks & budget</Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} />
          </Pressable>

          <Pressable style={styles.row} onPress={() => router.push('/(tabs)/my-plans')}>
            <View style={styles.rowIcon}>
              <CalendarHeart size={20} color={colors.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>My plans</Text>
              <Text style={styles.rowDesc}>Saved dates and trips</Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} />
          </Pressable>

          <Pressable
            style={styles.row}
            // Route types regenerate on the next dev-server start; the route exists.
            onPress={() => router.push('/date-night-reminder' as never)}
          >
            <View style={styles.rowIcon}>
              <BellRing size={20} color={colors.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Date night reminder</Text>
              <Text style={styles.rowDesc}>
                {reminder?.enabled
                  ? `On · ${describeReminder(reminder)}`
                  : 'Get a weekly nudge to plan something'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} />
          </Pressable>

          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Crown size={20} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Membership</Text>
              <Text style={styles.rowDesc}>Free plan · 3 AI plans per month</Text>
            </View>
          </View>

          <Pressable style={styles.signOutRow} onPress={handleSignOut}>
            <LogOut size={18} color={colors.error} />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>

          <Text style={styles.version}>W4nder 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    headerGradient: {
      paddingBottom: 28,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    headerContent: {
      alignItems: 'center',
      paddingTop: 20,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(255,249,245,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    avatarImage: {
      width: 72,
      height: 72,
      borderRadius: 36,
    },
    avatarBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    avatarText: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.textLight,
    },
    name: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textLight,
    },
    email: {
      fontSize: 13,
      color: colors.accent,
      marginTop: 4,
    },
    body: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      paddingVertical: 16,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primaryLight,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    rowDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    signOutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      marginTop: 8,
    },
    signOutText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.error,
    },
    version: {
      textAlign: 'center',
      fontSize: 12,
      color: colors.textTertiary,
    },
  });
