// Anniversary Service for Paint the Town
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Anniversary,
  CreateAnniversaryInput,
  UpdateAnniversaryInput,
  UpcomingAnniversary,
  AnniversaryStats,
  AnniversaryReminder,
  MilestoneSuggestion,
  AnniversaryFilters,
  AnniversarySortOption,
  Milestone,
} from '../types/anniversary';
import {
  getMilestoneForYears,
  getSuggestionsForMilestone,
  getNextMilestone,
  ANNIVERSARY_MILESTONES,
} from '../data/milestones';

const STORAGE_KEYS = {
  ANNIVERSARIES: '@w4nder/anniversaries',
  REMINDERS: '@w4nder/anniversary_reminders',
  BOOKMARKED_SUGGESTIONS: '@w4nder/bookmarked_suggestions',
};

// Generate unique ID
const generateId = (): string => {
  return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Date helpers
const parseDate = (dateStr: string): Date => new Date(dateStr);
const formatDate = (date: Date): string => date.toISOString().split('T')[0];
const today = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Calculate years between two dates
const calculateYears = (startDate: Date, endDate: Date): number => {
  const years = endDate.getFullYear() - startDate.getFullYear();
  const monthDiff = endDate.getMonth() - startDate.getMonth();
  const dayDiff = endDate.getDate() - startDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    return years - 1;
  }
  return years;
};

// Calculate days until next occurrence of anniversary
const getDaysUntilAnniversary = (
  anniversaryDate: string
): { daysUntil: number; nextDate: Date; yearsCompleting: number } => {
  const originalDate = parseDate(anniversaryDate);
  const now = today();
  const currentYear = now.getFullYear();

  // Get this year's anniversary date
  let nextAnniversary = new Date(currentYear, originalDate.getMonth(), originalDate.getDate());

  // If it's already passed this year, get next year's
  if (nextAnniversary < now) {
    nextAnniversary = new Date(currentYear + 1, originalDate.getMonth(), originalDate.getDate());
  }

  const daysUntil = Math.ceil((nextAnniversary.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const yearsCompleting = nextAnniversary.getFullYear() - originalDate.getFullYear();

  return { daysUntil, nextDate: nextAnniversary, yearsCompleting };
};

class AnniversaryService {
  // CRUD Operations
  async getAllAnniversaries(): Promise<Anniversary[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ANNIVERSARIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting anniversaries:', error);
      return [];
    }
  }

  async getAnniversaryById(id: string): Promise<Anniversary | null> {
    const anniversaries = await this.getAllAnniversaries();
    return anniversaries.find((a) => a.id === id) || null;
  }

  async createAnniversary(input: CreateAnniversaryInput): Promise<Anniversary> {
    const now = new Date().toISOString();
    const anniversary: Anniversary = {
      id: generateId(),
      name: input.name,
      type: input.type,
      date: input.date,
      partnerName: input.partnerName,
      notes: input.notes,
      reminderDays: input.reminderDays || [7, 3, 1],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const anniversaries = await this.getAllAnniversaries();
    anniversaries.push(anniversary);
    await AsyncStorage.setItem(STORAGE_KEYS.ANNIVERSARIES, JSON.stringify(anniversaries));

    return anniversary;
  }

  async updateAnniversary(id: string, input: UpdateAnniversaryInput): Promise<Anniversary | null> {
    const anniversaries = await this.getAllAnniversaries();
    const index = anniversaries.findIndex((a) => a.id === id);

    if (index === -1) return null;

    anniversaries[index] = {
      ...anniversaries[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.ANNIVERSARIES, JSON.stringify(anniversaries));
    return anniversaries[index];
  }

  async deleteAnniversary(id: string): Promise<boolean> {
    const anniversaries = await this.getAllAnniversaries();
    const filtered = anniversaries.filter((a) => a.id !== id);

    if (filtered.length === anniversaries.length) return false;

    await AsyncStorage.setItem(STORAGE_KEYS.ANNIVERSARIES, JSON.stringify(filtered));

    // Also clean up related reminders
    await this.deleteRemindersForAnniversary(id);

    return true;
  }

  // Filtering and Sorting
  async getFilteredAnniversaries(
    filters?: AnniversaryFilters,
    sortOption: AnniversarySortOption = 'upcoming'
  ): Promise<Anniversary[]> {
    let anniversaries = await this.getAllAnniversaries();

    // Apply filters
    if (filters) {
      if (filters.types && filters.types.length > 0) {
        anniversaries = anniversaries.filter((a) => filters.types!.includes(a.type));
      }
      if (filters.isActive !== undefined) {
        anniversaries = anniversaries.filter((a) => a.isActive === filters.isActive);
      }
      if (filters.hasUpcomingMilestone) {
        anniversaries = anniversaries.filter((a) => {
          const { yearsCompleting } = getDaysUntilAnniversary(a.date);
          const milestone = getMilestoneForYears(yearsCompleting);
          return milestone && ANNIVERSARY_MILESTONES.some((m) => m.years === yearsCompleting);
        });
      }
    }

    // Apply sorting
    switch (sortOption) {
      case 'date_asc':
        anniversaries.sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
        break;
      case 'date_desc':
        anniversaries.sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
        break;
      case 'name_asc':
        anniversaries.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        anniversaries.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'upcoming':
      default:
        anniversaries.sort((a, b) => {
          const daysA = getDaysUntilAnniversary(a.date).daysUntil;
          const daysB = getDaysUntilAnniversary(b.date).daysUntil;
          return daysA - daysB;
        });
    }

    return anniversaries;
  }

  // Milestone & Suggestion Methods
  async getUpcomingAnniversaries(daysAhead: number = 90): Promise<UpcomingAnniversary[]> {
    const anniversaries = await this.getAllAnniversaries();
    const bookmarked = await this.getBookmarkedSuggestions();
    const upcoming: UpcomingAnniversary[] = [];

    for (const anniversary of anniversaries) {
      if (!anniversary.isActive) continue;

      const { daysUntil, nextDate, yearsCompleting } = getDaysUntilAnniversary(anniversary.date);

      if (daysUntil <= daysAhead) {
        const milestone = getMilestoneForYears(yearsCompleting);
        const suggestions = milestone
          ? this.generateSuggestions(anniversary.id, milestone, bookmarked)
          : [];

        upcoming.push({
          anniversary,
          daysUntil,
          upcomingDate: formatDate(nextDate),
          yearsCompleting,
          milestone,
          suggestions,
        });
      }
    }

    // Sort by days until
    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

    return upcoming;
  }

  generateSuggestions(
    anniversaryId: string,
    milestone: Milestone,
    bookmarkedIds: string[] = []
  ): MilestoneSuggestion[] {
    const templates = getSuggestionsForMilestone(milestone);

    return templates.map((template, index) => {
      const id = `sug_${anniversaryId}_${milestone.years}_${index}`;
      return {
        id,
        anniversaryId,
        milestone,
        category: template.category,
        title: template.title,
        description: template.description,
        priceRange: template.priceRange,
        imageUrl: template.imageUrl,
        tags: [...template.tags, milestone.name.toLowerCase()],
        isBookmarked: bookmarkedIds.includes(id),
      };
    });
  }

  async getSuggestionsForAnniversary(anniversaryId: string): Promise<MilestoneSuggestion[]> {
    const anniversary = await this.getAnniversaryById(anniversaryId);
    if (!anniversary) return [];

    const { yearsCompleting } = getDaysUntilAnniversary(anniversary.date);
    const milestone = getMilestoneForYears(yearsCompleting);

    if (!milestone) return [];

    const bookmarked = await this.getBookmarkedSuggestions();
    return this.generateSuggestions(anniversaryId, milestone, bookmarked);
  }

  // Stats
  async getStats(): Promise<AnniversaryStats> {
    const anniversaries = await this.getAllAnniversaries();
    const now = today();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let upcomingThisMonth = 0;
    let nextMilestoneData: AnniversaryStats['nextMilestone'] = undefined;
    let minDaysToMilestone = Infinity;

    for (const anniversary of anniversaries) {
      if (!anniversary.isActive) continue;

      const { daysUntil, yearsCompleting } = getDaysUntilAnniversary(anniversary.date);

      // Count this month's anniversaries
      if (daysUntil <= Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) {
        upcomingThisMonth++;
      }

      // Find next milestone
      const milestone = getMilestoneForYears(yearsCompleting);
      if (milestone && ANNIVERSARY_MILESTONES.some((m) => m.years === yearsCompleting)) {
        if (daysUntil < minDaysToMilestone) {
          minDaysToMilestone = daysUntil;
          nextMilestoneData = {
            anniversary,
            milestone,
            daysUntil,
          };
        }
      }
    }

    return {
      totalAnniversaries: anniversaries.filter((a) => a.isActive).length,
      upcomingThisMonth,
      nextMilestone: nextMilestoneData,
    };
  }

  // Reminder Methods
  async getReminders(): Promise<AnniversaryReminder[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  async getUnreadReminders(): Promise<AnniversaryReminder[]> {
    const reminders = await this.getReminders();
    const now = today();

    return reminders.filter((r) => {
      const scheduledDate = parseDate(r.scheduledDate);
      return !r.isRead && scheduledDate <= now;
    });
  }

  async markReminderAsRead(reminderId: string): Promise<void> {
    const reminders = await this.getReminders();
    const index = reminders.findIndex((r) => r.id === reminderId);

    if (index !== -1) {
      reminders[index].isRead = true;
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    }
  }

  async generateReminders(): Promise<void> {
    const anniversaries = await this.getAllAnniversaries();
    const existingReminders = await this.getReminders();
    const now = today();
    const newReminders: AnniversaryReminder[] = [...existingReminders];

    for (const anniversary of anniversaries) {
      if (!anniversary.isActive) continue;

      const { daysUntil, nextDate } = getDaysUntilAnniversary(anniversary.date);

      for (const daysBefore of anniversary.reminderDays) {
        if (daysUntil === daysBefore) {
          const reminderId = `rem_${anniversary.id}_${formatDate(nextDate)}_${daysBefore}`;

          // Check if reminder already exists
          if (!newReminders.some((r) => r.id === reminderId)) {
            newReminders.push({
              id: reminderId,
              anniversaryId: anniversary.id,
              scheduledDate: formatDate(now),
              daysBeforeAnniversary: daysBefore,
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(newReminders));
  }

  private async deleteRemindersForAnniversary(anniversaryId: string): Promise<void> {
    const reminders = await this.getReminders();
    const filtered = reminders.filter((r) => r.anniversaryId !== anniversaryId);
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(filtered));
  }

  // Bookmarking
  async getBookmarkedSuggestions(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKED_SUGGESTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting bookmarked suggestions:', error);
      return [];
    }
  }

  async toggleBookmark(suggestionId: string): Promise<boolean> {
    const bookmarked = await this.getBookmarkedSuggestions();
    const index = bookmarked.indexOf(suggestionId);

    if (index === -1) {
      bookmarked.push(suggestionId);
    } else {
      bookmarked.splice(index, 1);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKED_SUGGESTIONS, JSON.stringify(bookmarked));
    return index === -1; // Returns true if now bookmarked
  }

  // Utility Methods
  calculateCurrentYears(anniversaryDate: string): number {
    return calculateYears(parseDate(anniversaryDate), today());
  }

  getNextMilestoneForAnniversary(anniversaryDate: string): Milestone | undefined {
    const currentYears = this.calculateCurrentYears(anniversaryDate);
    return getNextMilestone(currentYears);
  }

  getMilestoneProgress(anniversaryDate: string): {
    current: number;
    next: Milestone | undefined;
    progress: number;
  } {
    const currentYears = this.calculateCurrentYears(anniversaryDate);
    const nextMilestone = getNextMilestone(currentYears);

    if (!nextMilestone) {
      return { current: currentYears, next: undefined, progress: 100 };
    }

    // Find previous milestone
    const prevMilestone = [...ANNIVERSARY_MILESTONES]
      .filter((m) => m.years <= currentYears)
      .sort((a, b) => b.years - a.years)[0];

    const startYears = prevMilestone?.years || 0;
    const progress = ((currentYears - startYears) / (nextMilestone.years - startYears)) * 100;

    return {
      current: currentYears,
      next: nextMilestone,
      progress: Math.min(100, Math.max(0, progress)),
    };
  }
}

export const anniversaryService = new AnniversaryService();
export default anniversaryService;
