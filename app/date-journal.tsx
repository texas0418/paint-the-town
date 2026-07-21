import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Heart, BookHeart, Pencil } from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { JournalTimelineItem, listJournal } from '@/services/dateJournalService';

function formatEntryDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DateJournalScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [entries, setEntries] = useState<JournalTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      listJournal()
        .then(setEntries)
        .catch((e) => console.error('Failed to load journal:', e))
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.gradient.primary} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color={colors.textLight} />
            </Pressable>
            <Text style={styles.headerTitle}>Date journal</Text>
            <View style={styles.backBtn} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.center}>
          <BookHeart size={40} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No memories yet</Text>
          <Text style={styles.emptyText}>
            When a date is done, rate it on the plan screen{'\n'}and it becomes part of your story.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {entries.map((entry) => (
            <Pressable
              key={entry.id}
              style={styles.card}
              onPress={() => router.push(`/saved-plan?id=${entry.planId}` as never)}
            >
              {entry.photoUrls.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photoStrip}
                >
                  {entry.photoUrls.map((uri) => (
                    <Image key={uri} source={{ uri }} style={styles.photo} contentFit="cover" />
                  ))}
                </ScrollView>
              )}
              <View style={styles.cardBody}>
                {!!entry.entryDate && (
                  <Text style={styles.entryDate}>{formatEntryDate(entry.entryDate)}</Text>
                )}
                <Text style={styles.entryTitle}>{entry.planTitle}</Text>
                {!!entry.planCity && <Text style={styles.entryCity}>{entry.planCity}</Text>}
                <View style={styles.heartsRow}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Heart
                      key={value}
                      size={16}
                      color={value <= entry.rating ? colors.secondary : colors.borderLight}
                      fill={value <= entry.rating ? colors.secondary : 'transparent'}
                    />
                  ))}
                  <Pressable
                    style={styles.editBtn}
                    onPress={() => router.push(`/rate-date?planId=${entry.planId}` as never)}
                    hitSlop={8}
                  >
                    <Pencil size={14} color={colors.primaryLight} />
                    <Text style={styles.editText}>Edit</Text>
                  </Pressable>
                </View>
                {!!entry.note && <Text style={styles.entryNote}>{entry.note}</Text>}
              </View>
            </Pressable>
          ))}
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
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      marginTop: 14,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 6,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
      gap: 16,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    photoStrip: {
      gap: 2,
    },
    photo: {
      width: 132,
      height: 132,
    },
    cardBody: {
      padding: 16,
    },
    entryDate: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primaryLight,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 4,
    },
    entryTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    entryCity: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    heartsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginTop: 10,
    },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 'auto',
    },
    editText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primaryLight,
    },
    entryNote: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
      marginTop: 10,
    },
  });
