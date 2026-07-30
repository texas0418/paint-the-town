import { useState } from 'react';
import { Alert } from 'react-native';
import { DatePlan, PlanStop } from '@/types/planner';
import { updatePlanStops } from '@/services/datePlanService';
import { minutesOf, resolveOverlaps, shiftTime } from '@/utils/planTime';

/**
 * Edit mode for a saved plan: reorder stops and adjust times/durations on a
 * draft copy, saved back as one batch. All time edits maintain the non-overlap
 * invariant via resolveOverlaps.
 */
export function usePlanEditor(plan: DatePlan | null, setPlan: (plan: DatePlan) => void) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PlanStop[]>([]);
  const [timePickerFor, setTimePickerFor] = useState<number | null>(null);
  const [savingEdits, setSavingEdits] = useState(false);

  const startEditing = () => {
    if (!plan) return;
    // Clean any overlaps the plan already carries so editing starts from a
    // valid, strictly-sequential timeline.
    setDraft(resolveOverlaps(plan.stops.map((s) => ({ ...s }))));
    setEditing(true);
  };

  /** Tapping a stop's time outside edit mode jumps straight to its picker. */
  const openEditorAt = (order: number) => {
    startEditing();
    setTimePickerFor(order);
  };

  const cancelEditing = () => {
    setEditing(false);
    setTimePickerFor(null);
  };

  const saveEditing = async () => {
    if (!plan) return;
    setSavingEdits(true);
    try {
      const renumbered = draft.map((s, i) => ({ ...s, order: i + 1 }));
      await updatePlanStops(plan.id, renumbered);
      setPlan({
        ...plan,
        stops: renumbered,
        estimatedCost: renumbered.reduce((sum, s) => sum + (s.estimatedCost || 0), 0),
      });
      setEditing(false);
      setTimePickerFor(null);
    } catch (e) {
      Alert.alert('Could not save changes', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSavingEdits(false);
    }
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.length) return;
    const next = draft.slice();
    [next[index], next[target]] = [next[target], next[index]];
    // Reordering keeps each stop's own time; reflow so the new order reads
    // top-to-bottom in time with no overlaps.
    setDraft(resolveOverlaps(next));
  };

  const setStopTime = (index: number, picked: Date) => {
    const newTime = `${String(picked.getHours()).padStart(2, '0')}:${String(picked.getMinutes()).padStart(2, '0')}`;
    // Moving a stop drags everything after it by the same delta (gaps preserved),
    // then resolveOverlaps clamps if the new time collides with the stop above.
    const delta = minutesOf(newTime) - minutesOf(draft[index].time);
    const next = draft.map((s, i) =>
      i < index
        ? s
        : i === index
          ? { ...s, time: newTime }
          : { ...s, time: shiftTime(s.time, delta) }
    );
    setDraft(resolveOverlaps(next));
  };

  const nudgeDuration = (index: number, delta: number) => {
    const current = draft[index].durationMinutes || 60;
    const newDuration = Math.max(15, current + delta);
    const applied = newDuration - current; // 0 when clamped at the 15-min floor
    // Stretching a stop pushes everything after it later by the same amount.
    const next = draft.map((s, i) =>
      i < index
        ? s
        : i === index
          ? { ...s, durationMinutes: newDuration }
          : { ...s, time: shiftTime(s.time, applied) }
    );
    setDraft(resolveOverlaps(next));
  };

  const toggleTimePicker = (order: number) =>
    setTimePickerFor(timePickerFor === order ? null : order);

  return {
    editing,
    draft,
    timePickerFor,
    savingEdits,
    startEditing,
    openEditorAt,
    cancelEditing,
    saveEditing,
    moveStop,
    setStopTime,
    nudgeDuration,
    toggleTimePicker,
  };
}
