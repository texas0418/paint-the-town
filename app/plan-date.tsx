import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { PlanQuota, getPlanQuota } from '@/services/datePlanService';
import { usePlanForm } from '@/hooks/usePlanForm';
import { stopKey, usePlanGeneration } from '@/hooks/usePlanGeneration';
import { PlanDateForm } from '@/components/plan-date/PlanDateForm';
import { PlanDateLoading } from '@/components/plan-date/PlanDateLoading';
import { DestinationPicker } from '@/components/plan-date/DestinationPicker';
import { PlanResults } from '@/components/plan-date/PlanResults';
import { Phase } from '@/constants/planFormOptions';

function headerTitle(phase: Phase, isVacation: boolean): string {
  if (phase === 'results') return isVacation ? 'Your trip' : 'Your date plans';
  if (phase === 'destinations') return 'Pick a destination';
  return isVacation ? 'Plan a trip' : 'Plan a date';
}

export default function PlanDateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; vibe?: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [quota, setQuota] = useState<PlanQuota | null>(null);

  const form = usePlanForm(params);
  const gen = usePlanGeneration(form, params, (id) =>
    router.replace({ pathname: '/saved-plan', params: { id } })
  );

  // Refresh the quota line whenever the form is (re)shown — each generation
  // consumes one, so the count changes after every round trip.
  useEffect(() => {
    if (gen.phase !== 'form') return;
    getPlanQuota()
      .then(setQuota)
      .catch(() => setQuota(null));
  }, [gen.phase]);

  const body = () => {
    if (gen.phase === 'loading') {
      return (
        <PlanDateLoading
          suggesting={gen.suggesting}
          isVacation={form.isVacation}
          city={form.city}
          progress={gen.progress}
          loadingMessageIndex={gen.loadingMessageIndex}
        />
      );
    }
    if (gen.phase === 'destinations') {
      return (
        <DestinationPicker
          destinations={gen.destinations}
          tripBudget={form.tripBudget}
          onPick={gen.pickDestination}
          onBack={() => gen.setPhase('form')}
        />
      );
    }
    if (gen.phase === 'results') {
      return (
        <PlanResults
          plans={gen.plans}
          expandedPlan={gen.expandedPlan}
          expandedStops={gen.expandedStops}
          remixMode={gen.remixMode}
          selectedStops={gen.selectedStops}
          customStops={gen.customStops}
          savingIndex={gen.savingIndex}
          stopKey={stopKey}
          onToggleRemix={gen.toggleRemix}
          onToggleExpandedPlan={gen.setExpandedPlan}
          onToggleStop={gen.toggleStop}
          onSavePlan={gen.handleSavePlan}
          onSaveCustom={gen.handleSaveCustom}
          onRegenerate={() => gen.setPhase('form')}
        />
      );
    }
    return (
      <PlanDateForm
        form={form}
        quota={quota}
        error={gen.error}
        onGenerate={() => gen.handleGenerate()}
        onSuggestDestinations={gen.handleSuggestDestinations}
      />
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.gradient.primary} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color={colors.textLight} />
            </Pressable>
            <Text style={styles.headerTitle}>{headerTitle(gen.phase, form.isVacation)}</Text>
            <View style={styles.backBtn} />
          </View>
        </SafeAreaView>
      </LinearGradient>
      {body()}
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
    },
  });
