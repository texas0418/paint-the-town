import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Heart, ImagePlus, X, MapPin, CalendarDays } from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { DatePlan } from '@/types/planner';
import { getPlan } from '@/services/datePlanService';
import { getEntryForPlan, saveEntry, uploadJournalPhoto } from '@/services/dateJournalService';

const MAX_PHOTOS = 6;

const ratingLabels: Record<number, string> = {
  1: 'Not for us',
  2: 'Meh',
  3: 'Nice night',
  4: 'Really good',
  5: 'Unforgettable',
};

export default function RateDateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const [plan, setPlan] = useState<DatePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  // Mix of already-uploaded https URLs and local file URIs; locals upload on save.
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!planId) return;
    Promise.all([getPlan(planId), getEntryForPlan(planId)])
      .then(([p, entry]) => {
        setPlan(p);
        if (entry) {
          setRating(entry.rating);
          setNote(entry.note ?? '');
          setPhotos(entry.photoUrls);
        }
      })
      .catch((e) => console.error('Failed to load journal entry:', e))
      .finally(() => setLoading(false));
  }, [planId]);

  const handleAddPhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS - photos.length,
      });
      if (result.canceled) return;
      const uris = (result.assets ?? []).map((a) => a.uri).filter(Boolean);
      setPhotos((prev) => [...prev, ...uris].slice(0, MAX_PHOTOS));
    } catch (e) {
      Alert.alert('Could not open photos', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const handleSave = async () => {
    if (!planId || rating === 0) return;
    setSaving(true);
    try {
      const photoUrls: string[] = [];
      for (const uri of photos) {
        photoUrls.push(uri.startsWith('http') ? uri : await uploadJournalPhoto(planId, uri));
      }
      await saveEntry({
        planId,
        rating,
        note: note.trim() || null,
        photoUrls,
        entryDate: plan?.planDate ?? new Date().toISOString().slice(0, 10),
      });
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.gradient.primary} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color={colors.textLight} />
            </Pressable>
            <Text style={styles.headerTitle}>How was it?</Text>
            <View style={styles.backBtn} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          {plan && (
            <View style={styles.planCard}>
              <Text style={styles.planTitle}>{plan.title}</Text>
              <View style={styles.planMeta}>
                <View style={styles.planMetaItem}>
                  <MapPin size={13} color={colors.textSecondary} />
                  <Text style={styles.planMetaText}>{plan.city}</Text>
                </View>
                <View style={styles.planMetaItem}>
                  <CalendarDays size={13} color={colors.textSecondary} />
                  <Text style={styles.planMetaText}>{plan.planDate ?? 'Flexible'}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.heartsRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setRating(value)} style={styles.heartBtn}>
                <Heart
                  size={38}
                  color={value <= rating ? colors.secondary : colors.textTertiary}
                  fill={value <= rating ? colors.secondary : 'transparent'}
                />
              </Pressable>
            ))}
          </View>
          <Text style={styles.ratingLabel}>
            {rating ? ratingLabels[rating] : 'Tap a heart to rate the date'}
          </Text>

          <Text style={styles.sectionTitle}>A memory to keep</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="What made it special? What would you do differently?"
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.photoGrid}>
            {photos.map((uri) => (
              <View key={uri} style={styles.photoWrap}>
                <Image source={{ uri }} style={styles.photo} contentFit="cover" />
                <Pressable
                  style={styles.photoRemove}
                  onPress={() => setPhotos((prev) => prev.filter((p) => p !== uri))}
                >
                  <X size={12} color={colors.textLight} />
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <Pressable style={styles.photoAdd} onPress={handleAddPhotos}>
                <ImagePlus size={22} color={colors.primaryLight} />
                <Text style={styles.photoAddText}>Add</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            style={[styles.saveBtn, (rating === 0 || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={rating === 0 || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.textLight} />
            ) : (
              <Text style={styles.saveBtnText}>Save to journal</Text>
            )}
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerGradient: {
      paddingBottom: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textLight,
      flex: 1,
      textAlign: 'center',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    planCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 20,
    },
    planTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    planMeta: {
      flexDirection: 'row',
      gap: 14,
      marginTop: 6,
    },
    planMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    planMetaText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    heartsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      marginTop: 6,
    },
    heartBtn: {
      padding: 4,
    },
    ratingLabel: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 10,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 10,
    },
    noteInput: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      minHeight: 110,
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 24,
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 28,
    },
    photoWrap: {
      width: 92,
      height: 92,
    },
    photo: {
      width: 92,
      height: 92,
      borderRadius: 12,
    },
    photoRemove: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoAdd: {
      width: 92,
      height: 92,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    photoAddText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primaryLight,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnDisabled: {
      opacity: 0.5,
    },
    saveBtnText: {
      color: colors.textLight,
      fontSize: 16,
      fontWeight: '700',
    },
  });
