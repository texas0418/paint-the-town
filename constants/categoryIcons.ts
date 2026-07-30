import { ComponentType } from 'react';
import {
  LucideProps,
  MapPin,
  Martini,
  Music,
  Palette,
  Ticket,
  TreePine,
  UtensilsCrossed,
} from 'lucide-react-native';
import { PlanStopCategory } from '@/types/planner';

/** Icon for each plan-stop category, shared by the planner and saved-plan screens. */
export const categoryIcons: Record<PlanStopCategory, ComponentType<LucideProps>> = {
  food: UtensilsCrossed,
  drinks: Martini,
  activity: Ticket,
  entertainment: Music,
  outdoors: TreePine,
  culture: Palette,
  other: MapPin,
};
