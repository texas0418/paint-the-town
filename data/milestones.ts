// Anniversary Milestones Data for Paint the Town
import { Milestone, MilestoneLevel, SuggestionCategory, PriceRange } from '../types/anniversary';

export interface SuggestionTemplate {
  category: SuggestionCategory;
  title: string;
  description: string;
  priceRange: PriceRange;
  imageUrl?: string;
  tags: string[];
}

export const ANNIVERSARY_MILESTONES: Milestone[] = [
  {
    years: 1,
    name: 'Paper Anniversary',
    traditionalGift: 'Paper',
    modernGift: 'Clocks',
    level: 'standard',
    description: 'Your first year together — a beautiful beginning worth celebrating.',
  },
  {
    years: 2,
    name: 'Cotton Anniversary',
    traditionalGift: 'Cotton',
    modernGift: 'China',
    level: 'standard',
    description: 'Two years of growing together, flexible and comfortable like cotton.',
  },
  {
    years: 3,
    name: 'Leather Anniversary',
    traditionalGift: 'Leather',
    modernGift: 'Crystal/Glass',
    level: 'standard',
    description: 'Three years strong — your bond is becoming durable and resilient.',
  },
  {
    years: 4,
    name: 'Fruit & Flowers Anniversary',
    traditionalGift: 'Fruit & Flowers',
    modernGift: 'Appliances',
    level: 'standard',
    description: 'Four years of blossoming love and the fruits of your partnership.',
  },
  {
    years: 5,
    name: 'Wood Anniversary',
    traditionalGift: 'Wood',
    modernGift: 'Silverware',
    level: 'standard',
    description: 'Five years — your relationship has deep roots and solid strength.',
  },
  {
    years: 10,
    name: 'Tin/Aluminum Anniversary',
    traditionalGift: 'Tin/Aluminum',
    modernGift: 'Diamond Jewelry',
    level: 'silver',
    description: 'A decade of love — flexible, resilient, and shining bright.',
  },
  {
    years: 15,
    name: 'Crystal Anniversary',
    traditionalGift: 'Crystal',
    modernGift: 'Watches',
    level: 'silver',
    description: 'Fifteen years of clarity and brilliance in your relationship.',
  },
  {
    years: 20,
    name: 'China Anniversary',
    traditionalGift: 'China',
    modernGift: 'Platinum',
    level: 'gold',
    description: 'Twenty years — elegant, refined, and truly precious.',
  },
  {
    years: 25,
    name: 'Silver Anniversary',
    traditionalGift: 'Silver',
    modernGift: 'Sterling Silver',
    level: 'gold',
    description: 'A quarter century of love — a radiant silver milestone.',
  },
  {
    years: 30,
    name: 'Pearl Anniversary',
    traditionalGift: 'Pearl',
    modernGift: 'Diamond',
    level: 'platinum',
    description: 'Thirty years — like a pearl, your love was formed with patience and beauty.',
  },
  {
    years: 40,
    name: 'Ruby Anniversary',
    traditionalGift: 'Ruby',
    modernGift: 'Ruby',
    level: 'platinum',
    description: 'Forty years of passionate, enduring love — rare and precious as a ruby.',
  },
  {
    years: 50,
    name: 'Golden Anniversary',
    traditionalGift: 'Gold',
    modernGift: 'Gold',
    level: 'diamond',
    description: 'Half a century of love — a truly golden achievement.',
  },
  {
    years: 60,
    name: 'Diamond Anniversary',
    traditionalGift: 'Diamond',
    modernGift: 'Diamond',
    level: 'diamond',
    description: 'Sixty years — the ultimate symbol of unbreakable, eternal love.',
  },
];

// Suggestion templates organized by milestone level
const SUGGESTION_TEMPLATES: Record<MilestoneLevel, SuggestionTemplate[]> = {
  standard: [
    {
      category: 'restaurant',
      title: 'Romantic Dinner for Two',
      description: 'Celebrate at a top-rated fine dining restaurant with a special tasting menu.',
      priceRange: '$$$',
      tags: ['dining', 'romantic', 'fine dining'],
    },
    {
      category: 'experience',
      title: 'Couples Cooking Class',
      description: 'Learn to make a gourmet meal together with a professional chef.',
      priceRange: '$$',
      tags: ['cooking', 'interactive', 'fun'],
    },
    {
      category: 'activity',
      title: 'Sunset Boat Cruise',
      description: 'Enjoy a private sunset cruise with champagne and appetizers.',
      priceRange: '$$$',
      tags: ['outdoor', 'scenic', 'romantic'],
    },
    {
      category: 'spa',
      title: 'Couples Spa Day',
      description: 'Relax and unwind with a full couples spa package including massage and facial.',
      priceRange: '$$$',
      tags: ['relaxation', 'wellness', 'pampering'],
    },
    {
      category: 'gift',
      title: 'Personalized Keepsake',
      description: 'A custom-made keepsake that commemorates your journey together.',
      priceRange: '$$',
      tags: ['sentimental', 'custom', 'keepsake'],
    },
  ],
  silver: [
    {
      category: 'getaway',
      title: 'Weekend Getaway',
      description: 'Escape for a romantic weekend at a boutique hotel or charming B&B.',
      priceRange: '$$$$',
      tags: ['travel', 'weekend', 'boutique hotel'],
    },
    {
      category: 'restaurant',
      title: 'Michelin-Star Dining Experience',
      description: 'An unforgettable multi-course dinner at a celebrated restaurant.',
      priceRange: '$$$$',
      tags: ['dining', 'luxury', 'michelin'],
    },
    {
      category: 'experience',
      title: 'Hot Air Balloon Ride',
      description: 'Soar above the countryside together in a private hot air balloon flight.',
      priceRange: '$$$',
      tags: ['adventure', 'scenic', 'unique'],
    },
    {
      category: 'entertainment',
      title: 'VIP Concert or Show',
      description: 'Premium seats to a show you both love, with backstage access.',
      priceRange: '$$$',
      tags: ['entertainment', 'music', 'VIP'],
    },
    {
      category: 'spa',
      title: 'Luxury Spa Retreat',
      description: 'A full-day luxury spa experience with premium treatments.',
      priceRange: '$$$$',
      tags: ['luxury', 'wellness', 'retreat'],
    },
  ],
  gold: [
    {
      category: 'getaway',
      title: 'Romantic City Break',
      description: 'Three nights in a world-class city — Paris, Rome, or Barcelona.',
      priceRange: '$$$$$',
      tags: ['travel', 'international', 'city break'],
    },
    {
      category: 'experience',
      title: 'Private Wine Tasting Tour',
      description: 'A curated wine region tour with private tastings and vineyard lunches.',
      priceRange: '$$$$',
      tags: ['wine', 'tour', 'gourmet'],
    },
    {
      category: 'gift',
      title: 'Custom Jewelry Piece',
      description: 'A bespoke piece of jewelry designed to mark this special milestone.',
      priceRange: '$$$$',
      tags: ['jewelry', 'custom', 'luxury'],
    },
    {
      category: 'restaurant',
      title: 'Private Chef Experience',
      description: 'A personal chef prepares a multi-course meal in your home or a private venue.',
      priceRange: '$$$$',
      tags: ['dining', 'private', 'exclusive'],
    },
    {
      category: 'activity',
      title: 'Helicopter Tour',
      description: 'See your city or a scenic destination from above on a private helicopter flight.',
      priceRange: '$$$$',
      tags: ['adventure', 'luxury', 'scenic'],
    },
  ],
  platinum: [
    {
      category: 'getaway',
      title: 'Luxury Resort Vacation',
      description: 'A week at a five-star resort with spa, dining, and excursions included.',
      priceRange: '$$$$$',
      tags: ['travel', 'luxury', 'resort', 'all-inclusive'],
    },
    {
      category: 'experience',
      title: 'Bucket List Adventure',
      description: 'That dream trip you\'ve always talked about — safari, Northern Lights, or island hopping.',
      priceRange: '$$$$$',
      tags: ['adventure', 'bucket list', 'once-in-a-lifetime'],
    },
    {
      category: 'gift',
      title: 'Heirloom Jewelry',
      description: 'A stunning piece meant to be passed down through generations.',
      priceRange: '$$$$$',
      tags: ['jewelry', 'heirloom', 'legacy'],
    },
    {
      category: 'entertainment',
      title: 'Private Event or Celebration',
      description: 'Host an intimate celebration with your closest friends and family.',
      priceRange: '$$$$',
      tags: ['celebration', 'party', 'milestone'],
    },
    {
      category: 'spa',
      title: 'Destination Spa Retreat',
      description: 'A multi-day wellness retreat at a world-renowned destination spa.',
      priceRange: '$$$$$',
      tags: ['wellness', 'destination', 'luxury'],
    },
  ],
  diamond: [
    {
      category: 'getaway',
      title: 'Around-the-World Trip',
      description: 'Visit the places that shaped your journey together in an epic world tour.',
      priceRange: '$$$$$',
      tags: ['travel', 'world tour', 'epic'],
    },
    {
      category: 'experience',
      title: 'Vow Renewal Ceremony',
      description: 'Renew your vows in a meaningful ceremony at a dream destination.',
      priceRange: '$$$$$',
      tags: ['ceremony', 'vow renewal', 'destination'],
    },
    {
      category: 'gift',
      title: 'Diamond or Legacy Gift',
      description: 'A diamond piece or meaningful legacy gift worthy of this extraordinary milestone.',
      priceRange: '$$$$$',
      tags: ['diamond', 'legacy', 'extraordinary'],
    },
    {
      category: 'entertainment',
      title: 'Grand Celebration Gala',
      description: 'A grand celebration with everyone who matters, at a stunning venue.',
      priceRange: '$$$$$',
      tags: ['gala', 'celebration', 'grand'],
    },
    {
      category: 'restaurant',
      title: 'World-Class Dining Journey',
      description: 'A multi-day culinary journey through the world\'s finest restaurants.',
      priceRange: '$$$$$',
      tags: ['dining', 'culinary', 'world-class'],
    },
  ],
};

/**
 * Get the milestone for a specific number of years.
 * Returns the exact milestone if one exists, or undefined.
 */
export const getMilestoneForYears = (years: number): Milestone | undefined => {
  return ANNIVERSARY_MILESTONES.find(m => m.years === years);
};

/**
 * Get suggestion templates for a given milestone.
 */
export const getSuggestionsForMilestone = (milestone: Milestone): SuggestionTemplate[] => {
  return SUGGESTION_TEMPLATES[milestone.level] || SUGGESTION_TEMPLATES.standard;
};

/**
 * Get the next upcoming milestone after the given number of years.
 */
export const getNextMilestone = (currentYears: number): Milestone | undefined => {
  return ANNIVERSARY_MILESTONES.find(m => m.years > currentYears);
};
