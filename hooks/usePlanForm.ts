import { useEffect, useState } from 'react';
import { TasteProfile, emptyTasteProfile } from '@/types/planner';
import { getTasteProfile } from '@/services/tasteProfileService';
import { getPartnerTasteProfile, mergeTasteProfiles } from '@/services/partnerService';
import { PlanMode, vibeChips } from '@/constants/planFormOptions';

function toggleIn(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

/**
 * Everything the plan-a-date form holds: mode, destination, timing, budget, and
 * the optional steering chips. Also loads the taste profile (merged with the
 * linked partner's, when there is one) and seeds city/budget from it.
 */
export function usePlanForm(params: { mode?: string; vibe?: string }) {
  const [profile, setProfile] = useState<TasteProfile>(emptyTasteProfile);
  const [partnerLinked, setPartnerLinked] = useState(false);
  const [planMode, setPlanMode] = useState<PlanMode>(
    params.mode === 'single' ? 'single' : params.mode === 'vacation' ? 'vacation' : 'plan_for_me'
  );
  const [city, setCity] = useState('');
  const [dateChip, setDateChip] = useState('saturday');
  const [startTime, setStartTime] = useState('18:00');
  const [duration, setDuration] = useState(5);
  const [tripDays, setTripDays] = useState(3);
  const [budget, setBudget] = useState(150);
  const [tripBudget, setTripBudget] = useState(1000);
  const [notes, setNotes] = useState('');
  // Deep links (e.g. anniversary nudges) can preselect a vibe chip.
  const [vibes, setVibes] = useState<string[]>(
    params.vibe && vibeChips.includes(params.vibe) ? [params.vibe] : []
  );
  const [mustInclude, setMustInclude] = useState<string[]>([]);

  useEffect(() => {
    // Load both before merging — resolving the partner first must not be
    // clobbered by the own-profile load landing second.
    Promise.all([getTasteProfile(), getPartnerTasteProfile().catch(() => null)])
      .then(([mine, partner]) => {
        setProfile(partner ? mergeTasteProfiles(mine, partner) : mine);
        setPartnerLinked(!!partner);
        if (mine.homeCity) setCity(mine.homeCity);
        if (mine.dateBudget) setBudget(mine.dateBudget);
      })
      .catch((e) => console.error('Failed to load taste profile:', e));
  }, []);

  return {
    profile,
    partnerLinked,
    planMode,
    setPlanMode,
    isVacation: planMode === 'vacation',
    city,
    setCity,
    dateChip,
    setDateChip,
    startTime,
    setStartTime,
    duration,
    setDuration,
    tripDays,
    setTripDays,
    budget,
    setBudget,
    tripBudget,
    setTripBudget,
    notes,
    setNotes,
    vibes,
    toggleVibe: (v: string) => setVibes((prev) => toggleIn(prev, v)),
    mustInclude,
    toggleMustInclude: (v: string) => setMustInclude((prev) => toggleIn(prev, v)),
  };
}

export type PlanFormState = ReturnType<typeof usePlanForm>;
