import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, X } from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';

export interface SavedPlanHeaderProps {
  title: string;
  /** Partner's plans are read-only: no delete, no rename, no edit affordance. */
  isPartnersPlan: boolean;
  editing: boolean;
  onBack: () => void;
  onRename: () => void;
  onCancelEditing: () => void;
  onDelete: () => void;
}

/** Gradient header: back, tappable title (rename), and the right-side control
 *  that switches between delete, cancel-editing, and nothing (partner's plan). */
export function SavedPlanHeader({
  title,
  isPartnersPlan,
  editing,
  onBack,
  onRename,
  onCancelEditing,
  onDelete,
}: SavedPlanHeaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const rightControl = () => {
    if (isPartnersPlan) return <View style={styles.backBtn} />;
    if (editing) {
      return (
        <Pressable onPress={onCancelEditing} style={styles.backBtn}>
          <X size={20} color={colors.textLight} />
        </Pressable>
      );
    }
    return (
      <Pressable onPress={onDelete} style={styles.backBtn}>
        <Trash2 size={20} color={colors.textLight} />
      </Pressable>
    );
  };

  return (
    <LinearGradient colors={colors.gradient.primary} style={styles.headerGradient}>
      <SafeAreaView edges={['top']}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.textLight} />
          </Pressable>
          <Pressable style={{ flex: 1 }} onPress={onRename}>
            <Text style={styles.headerTitle}>{title}</Text>
          </Pressable>
          {rightControl()}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
  });
