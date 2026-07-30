import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { CalendarDays, Dices, MapPin, Plane, Sparkles } from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { PlanFormState } from '@/hooks/usePlanForm';
import { PlanQuota } from '@/services/datePlanService';
import {
  dateChips,
  dayCountChips,
  durationChips,
  mustIncludeChips,
  timeChips,
  vibeChips,
} from '@/constants/planFormOptions';
import { ChipRow, MultiChipRow } from './ChipRow';

const MODES = [
  { id: 'plan_for_me', title: 'Plan it for me', desc: '3 dates to pick from', Icon: Sparkles },
  { id: 'single', title: 'One date', desc: 'Built around your notes', Icon: CalendarDays },
  { id: 'vacation', title: 'Vacation', desc: 'A multi-day trip anywhere', Icon: Plane },
] as const;

export interface PlanDateFormProps {
  form: PlanFormState;
  quota: PlanQuota | null;
  error: string | null;
  onGenerate: () => void;
  onSuggestDestinations: () => void;
}

type Styles = ReturnType<typeof createStyles>;

/** The quota line above the form — what's left this month, or why nothing is. */
function QuotaLine({ quota, styles }: { quota: PlanQuota | null; styles: Styles }) {
  if (!quota) return null;
  const monthlyLeft = Math.max(0, quota.monthlyLimit - quota.monthlyUsed);
  const dailyLeft = Math.max(0, quota.dailyLimit - quota.dailyUsed);
  const exhausted = monthlyLeft === 0 || dailyLeft === 0;

  const trialText = 'Your free trial date is used — subscribe to keep planning';
  const basicSuffix = quota.tier === 'basic' ? ' on the Basic plan' : '';
  let text: string;
  if (monthlyLeft === 0) {
    text =
      quota.tier === 'trial'
        ? trialText
        : `Monthly limit reached (${quota.monthlyLimit} plans${basicSuffix}) — resets on the 1st`;
  } else if (dailyLeft === 0) {
    text = `Daily limit reached (${quota.dailyLimit} plans) — more tomorrow`;
  } else {
    text = `${monthlyLeft} of ${quota.monthlyLimit} plans left this month`;
  }
  return <Text style={[styles.quotaLine, exhausted && styles.quotaLineExhausted]}>{text}</Text>;
}

function ModePicker({
  form,
  styles,
  colors,
}: {
  form: PlanFormState;
  styles: Styles;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.modeRow}>
      {MODES.map(({ id, title, desc, Icon }) => {
        const isSelected = form.planMode === id;
        return (
          <Pressable
            key={id}
            style={[styles.modeCard, isSelected && styles.modeCardSelected]}
            onPress={() => form.setPlanMode(id)}
          >
            <Icon size={20} color={isSelected ? colors.textLight : colors.primary} />
            <Text style={[styles.modeTitle, isSelected && styles.modeTitleSelected]}>{title}</Text>
            <Text style={[styles.modeDesc, isSelected && styles.modeDescSelected]}>{desc}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function generateLabel(planMode: PlanFormState['planMode']): string {
  if (planMode === 'plan_for_me') return 'Plan it for me';
  if (planMode === 'vacation') return 'Plan my trip';
  return 'Build my date';
}

/** When + how long: the chip rows differ for a night out vs a multi-day trip. */
function TimingFields({ form, styles }: { form: PlanFormState; styles: Styles }) {
  const { isVacation } = form;
  return (
    <>
      <Text style={styles.fieldLabel}>{isVacation ? 'Starting' : 'When'}</Text>
      <ChipRow options={dateChips} value={form.dateChip} onSelect={form.setDateChip} />
      {!isVacation && (
        <ChipRow options={timeChips} value={form.startTime} onSelect={form.setStartTime} />
      )}

      <Text style={styles.fieldLabel}>How long</Text>
      {isVacation ? (
        <ChipRow options={dayCountChips} value={form.tripDays} onSelect={form.setTripDays} />
      ) : (
        <ChipRow options={durationChips} value={form.duration} onSelect={form.setDuration} />
      )}
    </>
  );
}

/** Budget slider — trip budgets run an order of magnitude higher than date ones. */
function BudgetField({
  form,
  styles,
  colors,
}: {
  form: PlanFormState;
  styles: Styles;
  colors: ThemeColors;
}) {
  const { isVacation } = form;
  const value = isVacation ? form.tripBudget : form.budget;
  const max = isVacation ? 5000 : 500;
  return (
    <>
      <Text style={styles.fieldLabel}>
        {isVacation ? 'Trip budget: ' : 'Budget: '}
        <Text style={styles.budgetText}>
          ${value}
          {value >= max ? '+' : ''}
        </Text>
      </Text>
      <Slider
        style={styles.slider}
        minimumValue={isVacation ? 200 : 25}
        maximumValue={max}
        step={isVacation ? 100 : 25}
        value={value}
        onValueChange={isVacation ? form.setTripBudget : form.setBudget}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
      />
    </>
  );
}

/** The plan-a-date form: mode, destination, timing, budget, vibe, notes. */
export function PlanDateForm({
  form,
  quota,
  error,
  onGenerate,
  onSuggestDestinations,
}: PlanDateFormProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isVacation } = form;

  return (
    <ScrollView
      style={styles.formScroll}
      contentContainerStyle={styles.formContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets
    >
      <QuotaLine quota={quota} styles={styles} />
      {form.partnerLinked && (
        <Text style={styles.quotaLine}>Partner linked — plans will match both your tastes</Text>
      )}
      <ModePicker form={form} styles={styles} colors={colors} />

      <Text style={styles.fieldLabel}>{isVacation ? 'Destination' : 'City'}</Text>
      <View style={styles.inputRow}>
        <MapPin size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder={isVacation ? 'e.g. San Diego, CA or Rome, Italy' : 'e.g. Los Angeles, CA'}
          placeholderTextColor={colors.textTertiary}
          value={form.city}
          onChangeText={form.setCity}
          autoCapitalize="words"
        />
      </View>
      {isVacation && (
        <Pressable style={styles.suggestButton} onPress={onSuggestDestinations}>
          <Dices size={16} color={colors.primaryLight} />
          <Text style={styles.suggestButtonText}>
            Don&apos;t know where? Let Paint the Town pick 3 for you
          </Text>
        </Pressable>
      )}

      <TimingFields form={form} styles={styles} />
      <BudgetField form={form} styles={styles} colors={colors} />

      <Text style={styles.fieldLabel}>The vibe (optional)</Text>
      <MultiChipRow options={vibeChips} selected={form.vibes} onToggle={form.toggleVibe} />

      <Text style={styles.fieldLabel}>Must include (optional)</Text>
      <MultiChipRow
        options={mustIncludeChips}
        selected={form.mustInclude}
        onToggle={form.toggleMustInclude}
      />

      <Text style={styles.fieldLabel}>Anything special? (optional)</Text>
      <TextInput
        style={styles.notesInput}
        placeholder='e.g. "It&apos;s our anniversary" or "somewhere quiet"'
        placeholderTextColor={colors.textTertiary}
        value={form.notes}
        onChangeText={form.setNotes}
        multiline
      />

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <Pressable style={styles.generateButton} onPress={onGenerate}>
        <Sparkles size={20} color={colors.textLight} />
        <Text style={styles.generateButtonText}>{generateLabel(form.planMode)}</Text>
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
    modeRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 24,
    },
    modeCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 10,
      gap: 5,
    },
    modeCardSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modeTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    modeTitleSelected: {
      color: colors.textLight,
    },
    modeDesc: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 15,
    },
    modeDescSelected: {
      color: colors.textOnPrimary,
    },
    fieldLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 10,
      marginTop: 8,
    },
    budgetText: {
      color: colors.primary,
      fontWeight: '700',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    input: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    slider: {
      width: '100%',
      height: 40,
      marginBottom: 8,
    },
    notesInput: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      fontSize: 15,
      color: colors.text,
      minHeight: 70,
      textAlignVertical: 'top',
      marginBottom: 20,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      marginBottom: 12,
      textAlign: 'center',
    },
    quotaLine: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 14,
    },
    quotaLineExhausted: {
      color: colors.warning,
      fontWeight: '600',
    },
    generateButton: {
      backgroundColor: colors.secondary,
      borderRadius: 16,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    generateButtonText: {
      color: colors.textLight,
      fontSize: 17,
      fontWeight: '700',
    },
    suggestButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 10,
      marginBottom: 6,
    },
    suggestButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryLight,
    },
  });
