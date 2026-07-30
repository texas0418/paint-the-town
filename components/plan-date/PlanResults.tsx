import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronDown, ChevronUp, Shuffle } from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { GeneratedPlan, PlanStop } from '@/types/planner';
import { PlanStopRow } from './PlanStopRow';

export interface PlanResultsProps {
  plans: GeneratedPlan[];
  expandedPlan: number | null;
  expandedStops: Set<string>;
  remixMode: boolean;
  selectedStops: Set<string>;
  customStops: PlanStop[];
  savingIndex: number | null;
  stopKey: (planIndex: number, stopOrder: number) => string;
  onToggleRemix: () => void;
  onToggleExpandedPlan: (index: number | null) => void;
  onToggleStop: (key: string) => void;
  onSavePlan: (plan: GeneratedPlan, index: number) => void;
  onSaveCustom: () => void;
  onRegenerate: () => void;
}

type Styles = ReturnType<typeof createStyles>;

/** Multi-day plans get a "Day N" header at each day boundary. */
function startsNewDay(stops: PlanStop[], index: number): boolean {
  const stop = stops[index];
  if (stop.day == null) return false;
  return index === 0 || stops[index - 1].day !== stop.day;
}

function PlanCard(
  props: PlanResultsProps & {
    plan: GeneratedPlan;
    index: number;
    styles: Styles;
    colors: ThemeColors;
  }
) {
  const { plan, index, plans, remixMode, expandedPlan, savingIndex, styles, colors } = props;
  const isExpanded = expandedPlan === index || plans.length === 1 || remixMode;
  const showChevron = plans.length > 1 && !remixMode;
  return (
    <View style={styles.planCard}>
      <Pressable
        style={styles.planHeader}
        onPress={() => props.onToggleExpandedPlan(isExpanded && !remixMode ? null : index)}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.planTitle}>{plan.title}</Text>
          <Text style={styles.planVibe}>{plan.vibe}</Text>
          <View style={styles.planMeta}>
            <Text style={styles.planMetaText}>
              {plan.stops.length} stops · starts {plan.startTime} · ~$
              {Math.round(plan.estimatedCost ?? 0)}
            </Text>
          </View>
        </View>
        {showChevron &&
          (isExpanded ? (
            <ChevronUp size={20} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={20} color={colors.textSecondary} />
          ))}
      </Pressable>

      {isExpanded && (
        <View style={styles.stopsContainer}>
          {plan.stops.map((stop, si) => {
            const key = props.stopKey(index, stop.order);
            return (
              <React.Fragment key={key}>
                {startsNewDay(plan.stops, si) && (
                  <Text style={styles.dayHeader}>Day {stop.day}</Text>
                )}
                <PlanStopRow
                  stop={stop}
                  remixMode={remixMode}
                  isPicked={props.selectedStops.has(key)}
                  isOpen={props.expandedStops.has(key)}
                  planDate={plan.planDate ?? null}
                  planCity={plan.city}
                  onPress={() => props.onToggleStop(key)}
                />
              </React.Fragment>
            );
          })}
          {!remixMode && (
            <Pressable
              style={[styles.saveButton, savingIndex === index && styles.saveButtonDisabled]}
              onPress={() => props.onSavePlan(plan, index)}
              disabled={savingIndex !== null}
            >
              {savingIndex === index ? (
                <ActivityIndicator color={colors.textLight} />
              ) : (
                <>
                  <Check size={18} color={colors.textLight} />
                  <Text style={styles.saveButtonText}>Save this plan</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

/** Generated plans, with mix-and-match remix mode across them. */
export function PlanResults(props: PlanResultsProps) {
  const { plans, remixMode, customStops, savingIndex } = props;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const customCost = Math.round(customStops.reduce((s, x) => s + (x.estimatedCost || 0), 0));

  return (
    <>
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={[styles.formContent, remixMode && { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {plans.length > 1 && (
          <Pressable
            style={[styles.remixToggle, remixMode && styles.remixToggleActive]}
            onPress={props.onToggleRemix}
          >
            <Shuffle size={20} color={remixMode ? colors.textLight : colors.primary} />
            <Text style={[styles.remixToggleText, remixMode && { color: colors.textLight }]}>
              {remixMode
                ? 'Picking stops — tap stops you like'
                : 'Mix & match stops from each plan'}
            </Text>
          </Pressable>
        )}

        {plans.map((plan, index) => (
          <PlanCard
            key={index}
            {...props}
            plan={plan}
            index={index}
            styles={styles}
            colors={colors}
          />
        ))}

        <Pressable style={styles.regenerateButtonSolid} onPress={props.onRegenerate}>
          <Shuffle size={18} color={colors.textLight} />
          <Text style={styles.regenerateTextSolid}>Change details & regenerate</Text>
        </Pressable>
      </ScrollView>

      {remixMode && (
        <View style={styles.remixBar}>
          <Text style={styles.remixBarText}>
            {customStops.length} stops · ~${customCost}
          </Text>
          <Pressable
            style={[styles.remixSaveButton, savingIndex === -1 && styles.saveButtonDisabled]}
            onPress={props.onSaveCustom}
            disabled={savingIndex !== null}
          >
            {savingIndex === -1 ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Text style={styles.saveButtonText}>Create my plan</Text>
            )}
          </Pressable>
        </View>
      )}
    </>
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
    remixToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: colors.accent,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.primaryLight,
      paddingVertical: 16,
      marginBottom: 16,
    },
    remixToggleActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    remixToggleText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
    },
    planCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 18,
    },
    planTitle: {
      fontSize: 19,
      fontWeight: '700',
      color: colors.text,
    },
    planVibe: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    planMeta: {
      marginTop: 8,
    },
    planMetaText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '600',
    },
    stopsContainer: {
      paddingHorizontal: 18,
      paddingBottom: 18,
    },
    dayHeader: {
      fontWeight: '700',
      fontSize: 16,
      color: colors.primaryLight,
      marginTop: 10,
      marginBottom: 6,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 8,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: colors.textLight,
      fontSize: 16,
      fontWeight: '700',
    },
    regenerateButtonSolid: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      backgroundColor: colors.secondary,
      borderRadius: 14,
      paddingVertical: 16,
      marginTop: 4,
    },
    regenerateTextSolid: {
      color: colors.textLight,
      fontSize: 15,
      fontWeight: '700',
    },
    remixBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.primaryDark,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 30,
    },
    remixBarText: {
      color: colors.textLight,
      fontSize: 15,
      fontWeight: '600',
    },
    remixSaveButton: {
      backgroundColor: colors.secondary,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
  });
