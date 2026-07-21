import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, HeartHandshake, Share2, Link2, Unlink } from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import {
  PartnerState,
  createInvite,
  getPartnerState,
  redeemCode,
  unlink,
} from '@/services/partnerService';

export default function PartnerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [state, setState] = useState<PartnerState | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = () => getPartnerState().then(setState).catch(() => setState({ status: 'none' }));
  useEffect(() => {
    refresh();
  }, []);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await refresh();
    } catch (e) {
      Alert.alert('Something went wrong', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = () => {
    Alert.alert('Unlink partner', 'Plans will go back to matching only your taste.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unlink', style: 'destructive', onPress: () => run(unlink) },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.gradient.primary} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color={colors.textLight} />
            </Pressable>
            <Text style={styles.headerTitle}>Partner</Text>
            <View style={styles.backBtn} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <HeartHandshake size={22} color={colors.primaryLight} />
          </View>
          <Text style={styles.cardTitle}>Plan for both of you</Text>
          <Text style={styles.cardDesc}>
            Link with your partner and every plan matches both taste profiles — their loves count,
            and anything either of you would rather skip stays out.
          </Text>
        </View>

        {!state ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : state.status === 'linked' ? (
          <>
            <View style={styles.linkedRow}>
              <Link2 size={18} color={colors.success} />
              <Text style={styles.linkedText}>Linked with {state.partnerName}</Text>
            </View>
            <Pressable style={styles.unlinkBtn} onPress={handleUnlink} disabled={busy}>
              <Unlink size={16} color={colors.error} />
              <Text style={styles.unlinkText}>Unlink</Text>
            </Pressable>
          </>
        ) : state.status === 'pending' ? (
          <>
            <Text style={styles.fieldLabel}>Your invite code</Text>
            <Text style={styles.code}>{state.code}</Text>
            <Pressable
              style={styles.primaryBtn}
              disabled={busy}
              onPress={() =>
                Share.share({
                  message: `Link with me on W4nder so our date plans match both of us — my code is ${state.code}. Don't have W4nder yet? https://texas0418.github.io/W4nderApp/`,
                }).catch(() => {})
              }
            >
              <Share2 size={17} color={colors.textLight} />
              <Text style={styles.primaryBtnText}>Share code</Text>
            </Pressable>
            <Text style={styles.hint}>
              Your partner enters this code on their own W4nder account. The code works once.
            </Text>
          </>
        ) : (
          <>
            <Pressable style={styles.primaryBtn} disabled={busy} onPress={() => run(createInvite)}>
              <Share2 size={17} color={colors.textLight} />
              <Text style={styles.primaryBtnText}>Create invite code</Text>
            </Pressable>

            <Text style={[styles.fieldLabel, { marginTop: 28 }]}>Have a code?</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="e.g. K7PMQ2"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              value={codeInput}
              onChangeText={setCodeInput}
            />
            <Pressable
              style={[styles.secondaryBtn, (busy || codeInput.trim().length < 6) && { opacity: 0.5 }]}
              disabled={busy || codeInput.trim().length < 6}
              onPress={() => run(() => redeemCode(codeInput))}
            >
              <Link2 size={16} color={colors.primaryLight} />
              <Text style={styles.secondaryBtnText}>Link accounts</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerGradient: { paddingBottom: 16 },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textLight },
    content: { padding: 20, paddingBottom: 40 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      marginBottom: 26,
    },
    cardIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 6 },
    cardDesc: { fontSize: 13.5, color: colors.textSecondary, lineHeight: 20 },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 10,
    },
    code: {
      fontSize: 40,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 6,
      textAlign: 'center',
      marginVertical: 14,
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      backgroundColor: colors.secondary,
      borderRadius: 14,
      paddingVertical: 15,
    },
    primaryBtnText: { color: colors.textLight, fontSize: 15, fontWeight: '700' },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 13,
    },
    secondaryBtnText: { color: colors.primaryLight, fontSize: 14, fontWeight: '700' },
    codeInput: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 3,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    linkedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 10,
    },
    linkedText: { fontSize: 15, fontWeight: '700', color: colors.text },
    unlinkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      marginTop: 18,
      paddingVertical: 12,
    },
    unlinkText: { color: colors.error, fontSize: 14, fontWeight: '600' },
    hint: { fontSize: 13, color: colors.textTertiary, lineHeight: 19, marginTop: 16, textAlign: 'center' },
  });
