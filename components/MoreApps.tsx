// components/MoreApps.tsx
// The "More from Simon Shih" rows at the foot of Profile. Three sibling apps,
// each opening its App Store page. Styled as the same card rows already on that
// screen so it reads as part of it rather than an advert.
//
// No network: the list is static data from lib/moreApps.

import React, { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, ExternalLink } from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { FleetApp, relatedApps, storeUrl } from '@/lib/moreApps';

export default function MoreApps() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const apps = relatedApps();

  if (apps.length === 0) return null;

  const open = (app: FleetApp) => {
    // openURL rejects when nothing can handle the scheme; nothing useful to say.
    Linking.openURL(storeUrl(app)).catch(() => {});
  };

  return (
    <>
      <Text style={styles.heading}>More from Simon Shih</Text>
      {apps.map((app) => (
        <Pressable
          key={app.key}
          style={styles.row}
          onPress={() => open(app)}
          accessibilityRole="link"
          accessibilityLabel={`${app.name}, ${app.line}. Opens the App Store.`}
        >
          <View style={styles.rowIcon}>
            <ExternalLink size={18} color={colors.background} />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>{app.name}</Text>
            <Text style={styles.rowDesc}>{app.line}</Text>
          </View>
          <ChevronRight size={18} color={colors.textTertiary} />
        </Pressable>
      ))}
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    heading: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 18,
      marginBottom: 8,
      marginLeft: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 10,
    },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    rowDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  });
