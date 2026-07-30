import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, Compass } from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { DestinationSuggestion } from '@/types/planner';

/** Suffix the country only when it adds information (i.e. not domestic). */
function countrySuffix(country?: string): string {
  if (!country || country === 'USA' || country === 'United States') return '';
  return `, ${country}`;
}

export interface DestinationPickerProps {
  destinations: DestinationSuggestion[];
  tripBudget: number;
  onPick: (city: string) => void;
  onBack: () => void;
}

/** "I don't know where to go": three trips matched to taste and budget. */
export function DestinationPicker({
  destinations,
  tripBudget,
  onPick,
  onBack,
}: DestinationPickerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <ScrollView
      style={styles.formScroll}
      contentContainerStyle={styles.formContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.destinationsIntro}>
        Three trips that fit your taste and ${tripBudget} budget. Tap one to plan it.
      </Text>
      {destinations.map((dest, i) => (
        <Pressable key={i} style={styles.destCard} onPress={() => onPick(dest.city)}>
          <View style={styles.destIcon}>
            <Compass size={20} color={colors.primaryLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.destCity}>
              {dest.city}
              {countrySuffix(dest.country)}
            </Text>
            <Text style={styles.destPitch}>{dest.pitch}</Text>
            <Text style={styles.destWhy}>{dest.whyItMatches}</Text>
            <View style={styles.destMeta}>
              <Text style={styles.destMetaText}>{dest.travelNote}</Text>
              <Text style={styles.destMetaText}>~${Math.round(dest.estimatedTripCost)} trip</Text>
            </View>
          </View>
          <ChevronDown
            size={18}
            color={colors.textTertiary}
            style={{ transform: [{ rotate: '-90deg' }] }}
          />
        </Pressable>
      ))}
      <Pressable style={styles.regenerateButton} onPress={onBack}>
        <Text style={styles.regenerateText}>Back — I&apos;ll pick myself</Text>
      </Pressable>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    formScroll: {
      flex: 1,
    },
    formContent: {
      padding: 20,
      paddingBottom: 40,
    },
    destinationsIntro: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 21,
    },
    destCard: {
      flexDirection: 'row',
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
      alignItems: 'center',
    },
    destIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    destCity: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    destPitch: {
      fontSize: 14,
      color: colors.text,
      marginTop: 4,
      lineHeight: 19,
    },
    destWhy: {
      fontSize: 13,
      color: colors.accentDark,
      fontStyle: 'italic',
      marginTop: 4,
    },
    destMeta: {
      flexDirection: 'row',
      gap: 14,
      marginTop: 8,
    },
    destMetaText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    regenerateButton: {
      alignItems: 'center',
      paddingVertical: 14,
    },
    regenerateText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '600',
    },
  });
