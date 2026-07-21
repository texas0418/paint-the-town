/* eslint-disable max-lines -- tracked in #1 */
// generate-date-plan — Supabase Edge Function
//
// Takes the user's taste profile + date parameters, uses Claude with web search
// to find real venues, and writes structured date plans to a plan_jobs row.
// Responds immediately with { jobId }; generation continues in the background
// (EdgeRuntime.waitUntil) because real web research exceeds the 150s gateway cap.
// The client polls the plan_jobs row.
//
// Secrets required: ANTHROPIC_API_KEY  (supabase secrets set ANTHROPIC_API_KEY=...)

import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { bucketForMode, checkQuota, tierFor, windowStarts } from './quota.ts';

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

/**
 * Wraps an Anthropic client so every messages.create() logs its token/search
 * usage to the api_usage table (insert-only telemetry; aggregate with SQL to
 * get real per-generation cost). Logging failures never break generation.
 */
function trackedAnthropic(
  apiKey: string,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  jobId: string | null
): Anthropic {
  const client = new Anthropic({ apiKey });
  const rawCreate = client.messages.create.bind(client.messages);
  // deno-lint-ignore no-explicit-any
  (client.messages as any).create = async (params: any) => {
    const response = await rawCreate(params);
    try {
      // deno-lint-ignore no-explicit-any
      const usage = (response as any)?.usage;
      if (usage) {
        const { error } = await supabase.from('api_usage').insert({
          job_id: jobId,
          model: String(params.model),
          input_tokens: usage.input_tokens ?? 0,
          output_tokens: usage.output_tokens ?? 0,
          cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
          cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
          web_search_requests: usage.server_tool_use?.web_search_requests ?? 0,
        });
        if (error) console.error('usage log failed:', error.message);
      }
    } catch (e) {
      console.error('usage log failed:', e);
    }
    return response;
  };
  return client;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STOP_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'order',
    'time',
    'durationMinutes',
    'category',
    'name',
    'venueName',
    'address',
    'description',
    'estimatedCost',
    'url',
    'reservationUrl',
    'whyItMatches',
  ],
  properties: {
    order: { type: 'integer', description: '1-based position of this stop in the plan' },
    time: { type: 'string', description: 'Start time, 24h format e.g. "18:30"' },
    durationMinutes: { type: 'integer' },
    category: {
      type: 'string',
      enum: ['food', 'drinks', 'activity', 'entertainment', 'outdoors', 'culture', 'other'],
    },
    name: { type: 'string', description: 'Short label, e.g. "Dinner at Osteria Mozza"' },
    venueName: { type: 'string', description: 'The real venue name' },
    address: { type: 'string', description: 'Street address of the venue' },
    description: { type: 'string', description: '1-2 sentences on what to do there' },
    estimatedCost: { type: 'number', description: 'Estimated USD cost for the whole party' },
    url: { type: 'string', description: 'Venue website or listing URL; empty string if unknown' },
    reservationUrl: {
      type: 'string',
      description:
        "Direct booking link you saw during research (OpenTable/Resy/Tock page or the venue's own reservation page). Empty string if the venue doesn't take reservations or you didn't see one — never invent this URL.",
    },
    whyItMatches: {
      type: 'string',
      description: "One sentence tying this stop to the user's stated tastes",
    },
  },
} as const;

const SUBMIT_PLANS_TOOL = {
  name: 'submit_plans',
  description:
    'Submit the finished date plan(s). Call this exactly once, after researching venues, with every plan fully filled in.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['plans'],
    properties: {
      plans: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'city', 'vibe', 'startTime', 'estimatedCost', 'stops'],
          properties: {
            title: { type: 'string', description: 'Catchy short title, e.g. "Art, Pasta & Rock"' },
            city: { type: 'string' },
            vibe: { type: 'string', description: 'One-line summary of the plan\'s vibe' },
            startTime: { type: 'string', description: '24h start time of the first stop' },
            estimatedCost: { type: 'number', description: 'Total estimated USD cost' },
            stops: { type: 'array', items: STOP_SCHEMA },
          },
        },
      },
    },
  },
} as const;

/** Shared taste-memory + weather guidance, injected into every planning prompt. */
function historyAndWeatherNotes(body: Record<string, unknown>): string {
  const avoid = (body.avoidVenues as string[] | undefined) ?? [];
  const loved = (body.lovedVenues as string[] | undefined) ?? [];
  const disliked = (body.dislikedVenues as string[] | undefined) ?? [];
  const lines: string[] = [];
  if (avoid.length) {
    lines.push(
      `- Venues they've recently been to (do NOT suggest these again): ${avoid.slice(0, 40).join('; ')}`
    );
  }
  if (loved.length) {
    lines.push(
      `- Venues they LOVED before (pick NEW places with a similar vibe): ${loved.slice(0, 20).join('; ')}`
    );
  }
  if (disliked.length) {
    lines.push(
      `- Venues they DISLIKED before (avoid these and places like them): ${disliked.slice(0, 20).join('; ')}`
    );
  }
  lines.push(
    '- Weather: if the date is within ~10 days, quickly check the forecast for that city and date; if rain or extreme heat/cold is likely, prefer indoor venues and mention it in stop descriptions.'
  );
  return lines.join('\n');
}

// eslint-disable-next-line complexity -- tracked in #1
function buildPrompt(
  body: Record<string, unknown>,
  angle?: string
): { system: string; user: string } {
  const profile = (body.profile ?? {}) as Record<string, unknown>;

  const system = `You are Paint the Town's date planner: an expert local concierge who plans great dates for people who are bad at planning them.

Rules:
- Every venue must be a REAL, currently-operating business or attraction in the requested city. Use web search to find and verify venues (current hours, that they are open, rough prices). Never invent a venue.
- Respect the budget: the plan's total estimated cost must not exceed the stated budget.
- Match the user's taste profile closely. Avoid everything in their dislikes. Each stop's "whyItMatches" must reference a specific stated preference.
- Build a coherent schedule: stops in a sensible geographic and time order, realistic travel gaps, food at meal times.
- The plan should have 2-3 stops. Vary the categories (e.g. activity -> dinner -> drinks/live music).
- Work FAST: you have a hard time budget. Use at most 3-4 targeted searches (e.g. one per venue category), pick solid well-reviewed venues, and do not over-verify. When you are done researching, call submit_plans exactly once with ONE plan. Do not describe the plan in text; the tool call is the only output that matters.`;

  const user = `Plan ONE date plan in ${body.city}.${angle ? `\n\nThis plan's angle: ${angle}` : ''}

Date parameters:
- Date: ${body.date || 'flexible / this weekend'}
- Preferred start time: ${body.startTime || 'evening'}
- Duration: about ${body.durationHours || 5} hours
- Total budget: $${body.budget} USD (hard cap per plan)
- Extra notes from the user: ${body.notes || 'none'}
${(body.vibes as string[] | undefined)?.length ? `- Desired vibe: ${(body.vibes as string[]).join(', ')} — match the tone of every stop to this.` : ''}
${(body.mustInclude as string[] | undefined)?.length ? `- The plan MUST include: ${(body.mustInclude as string[]).join(', ')} — these are hard requirements, one stop each at minimum.` : ''}

Taste profile:
- Planning for: ${profile.planFor || 'a couple'}
- Food they love: ${(profile.foodLoves as string[] | undefined)?.join(', ') || 'anything'}
- Food to avoid: ${(profile.foodDislikes as string[] | undefined)?.join(', ') || 'none'}
- Activities they love: ${(profile.activityLoves as string[] | undefined)?.join(', ') || 'anything'}
- Activities to avoid: ${(profile.activityDislikes as string[] | undefined)?.join(', ') || 'none'}
- Music: ${(profile.musicGenres as string[] | undefined)?.join(', ') || 'no strong preference'}
- Drinks: ${(profile.drinks as string[] | undefined)?.join(', ') || 'no strong preference'}
- Venue style: ${profile.venueStyle || 'both'} (indoor/outdoor preference)

Additional context:
${historyAndWeatherNotes(body)}`;

  return { system, user };
}

const PLAN_ANGLES = [
  'Culture-first: anchor the date around a museum, gallery, show, or similar cultural activity from their loves.',
  'Food-first: anchor the date around a standout restaurant matching their favorite cuisines.',
  'Music & nightlife-first: anchor the date around live music or a great bar matching their music and drink tastes.',
];

interface ShortlistVenue {
  category: 'culture' | 'restaurant' | 'nightlife';
  name: string;
  address: string;
  url: string;
  note: string;
  estimatedCost: number;
}

const SUBMIT_VENUES_TOOL = {
  name: 'submit_venues',
  description:
    'Submit the venue shortlist. Call exactly once with the requested number of DISTINCT venues per category.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['venues'],
    properties: {
      venues: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['category', 'name', 'address', 'url', 'note', 'estimatedCost'],
          properties: {
            category: { type: 'string', enum: ['culture', 'restaurant', 'nightlife'] },
            name: { type: 'string' },
            address: { type: 'string' },
            url: { type: 'string', description: 'Venue website; empty string if unknown' },
            note: { type: 'string', description: 'One line: what it is and why it fits' },
            estimatedCost: { type: 'number', description: 'USD for the whole party' },
          },
        },
      },
    },
  },
} as const;

/**
 * Phase 1 of plan_for_me: one fast research pass that returns 9 distinct
 * venues (3 culture / 3 restaurant / 3 nightlife) matching the profile.
 * Each plan-builder is then assigned one venue per category, so plans
 * never share a venue.
 */
// eslint-disable-next-line complexity -- tracked in #1
async function shortlistVenues(
  client: Anthropic,
  body: Record<string, unknown>,
  perCategory = 3
): Promise<Record<'culture' | 'restaurant' | 'nightlife', ShortlistVenue[]> | null> {
  const profile = (body.profile ?? {}) as Record<string, unknown>;
  const user = `Research venues in ${body.city} for a date on ${body.date || 'this weekend'} (budget $${body.budget} total per plan).

Taste profile:
- Food they love: ${(profile.foodLoves as string[] | undefined)?.join(', ') || 'anything'} (avoid: ${(profile.foodDislikes as string[] | undefined)?.join(', ') || 'nothing'})
- Activities they love: ${(profile.activityLoves as string[] | undefined)?.join(', ') || 'anything'} (avoid: ${(profile.activityDislikes as string[] | undefined)?.join(', ') || 'nothing'})
- Music: ${(profile.musicGenres as string[] | undefined)?.join(', ') || 'any'}
- Drinks: ${(profile.drinks as string[] | undefined)?.join(', ') || 'any'}
- Venue style: ${profile.venueStyle || 'both'}

Additional context:
${historyAndWeatherNotes(body)}

Find ${perCategory * 3} DISTINCT real, currently-operating venues: exactly ${perCategory} 'culture' (museums, galleries, shows, activities), ${perCategory} 'restaurant', and ${perCategory} 'nightlife' (bars, live music). All must fit the profile; no venue may appear twice. Work fast — a few targeted searches. Then call submit_venues once.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8000,
    system:
      "You are Paint the Town's venue scout. Only real venues. Do not write prose; the submit_venues tool call is the only output that matters.",
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low' },
    tools: [
      {
        type: 'web_search_20260209',
        name: 'web_search',
        max_uses: Math.min(3 + perCategory, 8),
        user_location: { type: 'approximate', city: String(body.city) },
      },
      SUBMIT_VENUES_TOOL,
      // deno-lint-ignore no-explicit-any
    ] as any,
    messages: [{ role: 'user', content: user }],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'submit_venues'
  );
  if (!toolUse) return null;

  const venues = (toolUse.input as { venues: ShortlistVenue[] }).venues ?? [];
  const buckets: Record<'culture' | 'restaurant' | 'nightlife', ShortlistVenue[]> = {
    culture: [],
    restaurant: [],
    nightlife: [],
  };
  const seen = new Set<string>();
  for (const v of venues) {
    const key = v.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    buckets[v.category]?.push(v);
  }
  // Missing slots are tolerated: an unassigned day/plan still gets the global
  // avoid-list, so it researches fresh venues without colliding with others.
  const total = buckets.culture.length + buckets.restaurant.length + buckets.nightlife.length;
  if (total < 3) {
    return null; // shortlist effectively failed — caller falls back to angle-only mode
  }
  return buckets;
}

interface VenueAssignment {
  assigned: ShortlistVenue[];
  avoid: string[];
}

async function generateSinglePlan(
  client: Anthropic,
  body: Record<string, unknown>,
  angle?: string,
  venues?: VenueAssignment
): Promise<unknown> {
  const { system, user: baseUser } = buildPrompt(body, angle);
  const user = venues
    ? `${baseUser}

Pre-researched venues assigned to THIS plan (already matched to the profile):
${venues.assigned.map((v) => `- [${v.category}] ${v.name} — ${v.address} — ${v.note} (~$${Math.round(v.estimatedCost)})${v.url ? ` — ${v.url}` : ''}`).join('\n')}

Build the plan around these venues (pick 2-3 of them that make the best schedule). Verify quickly — at most 1-2 searches. If one is closed or unsuitable you may substitute, but NEVER use any of these venues (they belong to the other plans): ${venues.avoid.join('; ')}.`
    : baseUser;

  const tools = [
    {
      type: 'web_search_20260209',
      name: 'web_search',
      max_uses: 4,
      user_location: { type: 'approximate', city: String(body.city) },
    },
    SUBMIT_PLANS_TOOL,
  ];

  let messages: Anthropic.MessageParam[] = [{ role: 'user', content: user }];

  // Agentic loop: web_search runs server-side at Anthropic; we only need to
  // resume on pause_turn and capture the submit_plans tool call.
  for (let i = 0; i < 6; i++) {
    // Sonnet 5: plan assembly from a pre-researched shortlist doesn't need
    // Opus, and it cuts the per-generation cost by more than half.
    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 16000,
      system,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      // deno-lint-ignore no-explicit-any
      tools: tools as any,
      messages,
    });

    if (response.stop_reason === 'pause_turn') {
      messages = [...messages, { role: 'assistant', content: response.content }];
      continue;
    }

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'submit_plans'
    );
    if (toolUse) {
      const plans = (toolUse.input as { plans: unknown[] }).plans;
      return plans?.[0] ?? null;
    }

    if (response.stop_reason === 'refusal') {
      throw new Error('The request was declined. Try rephrasing your notes.');
    }

    // Model ended its turn without calling the tool — nudge it once.
    messages = [
      ...messages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: 'Now call submit_plans with the finished plan.' },
    ];
  }

  throw new Error('Plan generation did not complete. Please try again.');
}

// The isolate is hard-killed at the 400s wall clock; cap each phase so the job
// row is always written before that (shortlist + plans must fit under ~340s).
const SHORTLIST_TIMEOUT_MS = 150_000;
const PLAN_TIMEOUT_MS = 180_000;

type ProgressReporter = (stage: string, done?: number, total?: number) => void;

// deno-lint-ignore no-explicit-any
function makeReporter(supabase: any, jobId: string): ProgressReporter {
  return (stage, done, total) => {
    supabase
      .from('plan_jobs')
      .update({ progress: { stage, done: done ?? null, total: total ?? null } })
      .eq('id', jobId)
      .then(() => {})
      .catch((err: unknown) => console.error('progress write failed:', err));
  };
}

/** Expo push notification (no-op without a token; tokens require an EAS project). */
async function sendPush(token: string | null | undefined, title: string, message: string) {
  if (!token || !token.startsWith('ExponentPushToken')) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: token, title, body: message, sound: 'default' }),
    });
  } catch (err) {
    console.error('push send failed:', err);
  }
}

const SUBMIT_STOP_TOOL = {
  name: 'submit_stop',
  description: 'Submit the single replacement stop. Call exactly once.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['stop'],
    properties: { stop: STOP_SCHEMA },
  },
} as const;

/** replace_stop mode: swap one stop of an existing plan for a fresh venue. */
// eslint-disable-next-line complexity -- tracked in #1
async function generateReplacementStop(
  client: Anthropic,
  body: Record<string, unknown>
): Promise<unknown> {
  const stop = (body.stop ?? {}) as Record<string, unknown>;
  const planVenues = ((body.planVenues as string[] | undefined) ?? []).join('; ');
  const profile = (body.profile ?? {}) as Record<string, unknown>;

  const user = `The user has a date plan in ${body.city} on ${body.date || 'an upcoming date'} and wants to REPLACE one stop with something different.

Stop to replace: ${stop.name} at ${stop.venueName} (${stop.category}), ${stop.time} for ${stop.durationMinutes} min, ~$${stop.estimatedCost}.
Other stops in the plan (keep these; the replacement must not clash or duplicate them): ${planVenues || 'none'}.
${body.notes ? `User's note about what they want instead: ${body.notes}` : 'Pick a clearly different venue with a similar time slot, duration, and cost.'}

Taste profile:
- Food they love: ${(profile.foodLoves as string[] | undefined)?.join(', ') || 'anything'} (avoid: ${(profile.foodDislikes as string[] | undefined)?.join(', ') || 'nothing'})
- Activities they love: ${(profile.activityLoves as string[] | undefined)?.join(', ') || 'anything'}
- Music: ${(profile.musicGenres as string[] | undefined)?.join(', ') || 'any'} · Drinks: ${(profile.drinks as string[] | undefined)?.join(', ') || 'any'}

Additional context:
${historyAndWeatherNotes(body)}

The replacement must be a REAL, currently-operating venue. Verify with 1-2 quick searches. Keep the same "order" value (${stop.order}) and roughly the same time. Then call submit_stop once.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 6000,
    system:
      "You are Paint the Town's date planner swapping one stop. Real venues only. The submit_stop tool call is the only output that matters.",
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low' },
    tools: [
      {
        type: 'web_search_20260209',
        name: 'web_search',
        max_uses: 3,
        user_location: { type: 'approximate', city: String(body.city) },
      },
      SUBMIT_STOP_TOOL,
      // deno-lint-ignore no-explicit-any
    ] as any,
    messages: [{ role: 'user', content: user }],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'submit_stop'
  );
  if (!toolUse) throw new Error('Could not find a replacement. Please try again.');
  return (toolUse.input as { stop: unknown }).stop;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  // If the timer wins the race, the losing promise may still reject later —
  // swallow that so it can't become an unhandled rejection and kill the isolate.
  promise.catch(() => {});
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Plan generation timed out.')), ms)
    ),
  ]);
}

const SUBMIT_DESTINATIONS_TOOL = {
  name: 'submit_destinations',
  description: 'Submit exactly 3 destination suggestions. Call exactly once.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['destinations'],
    properties: {
      destinations: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['city', 'country', 'pitch', 'whyItMatches', 'estimatedTripCost', 'travelNote'],
          properties: {
            city: { type: 'string', description: 'City, region/state — e.g. "Nashville, TN"' },
            country: { type: 'string' },
            pitch: { type: 'string', description: 'One irresistible sentence about this trip' },
            whyItMatches: {
              type: 'string',
              description: "One sentence tying it to the user's stated tastes",
            },
            estimatedTripCost: {
              type: 'number',
              description: 'Rough all-in USD: transport + lodging + activities',
            },
            travelNote: {
              type: 'string',
              description: 'Getting there from home, e.g. "3h drive" or "2.5h direct flight"',
            },
          },
        },
      },
    },
  },
} as const;

/** suggest_destinations mode: pick 3 destinations for someone who doesn't know where to go. */
// eslint-disable-next-line complexity -- tracked in #1
async function suggestDestinations(
  client: Anthropic,
  body: Record<string, unknown>
): Promise<unknown> {
  const profile = (body.profile ?? {}) as Record<string, unknown>;
  const days = Math.min(Math.max(Math.round(Number(body.days)) || 3, 1), 10);

  const user = `The user wants a ${days}-day vacation but doesn't know where to go. Pick for them.

Home base: ${body.city || 'not specified'}
Dates: starting ${body.date || 'flexible / soon'}
Total budget: $${body.budget} USD (transport + lodging + activities for the whole party)
Extra notes: ${body.notes || 'none'}

Taste profile:
- Food they love: ${(profile.foodLoves as string[] | undefined)?.join(', ') || 'anything'}
- Activities they love: ${(profile.activityLoves as string[] | undefined)?.join(', ') || 'anything'} (avoid: ${(profile.activityDislikes as string[] | undefined)?.join(', ') || 'nothing'})
- Music: ${(profile.musicGenres as string[] | undefined)?.join(', ') || 'any'}
- Drinks: ${(profile.drinks as string[] | undefined)?.join(', ') || 'any'}
- Venue style: ${profile.venueStyle || 'both'}

Suggest exactly 3 REAL destinations with genuinely different characters. Unless the budget or notes dictate otherwise, vary the travel effort: one easy/nearby option (drivable or short hop), one classic option, one more adventurous wildcard — all realistically doable from the home base within the budget and dates. Consider the season for those dates. Use 2-3 quick searches to sanity-check (seasonality, rough costs). Then call submit_destinations once. No prose.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8000,
    system:
      "You are Paint the Town's travel matchmaker. Real destinations only, budget-honest estimates. The submit_destinations tool call is the only output that matters.",
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low' },
    tools: [
      {
        type: 'web_search_20260209',
        name: 'web_search',
        max_uses: 3,
      },
      SUBMIT_DESTINATIONS_TOOL,
      // deno-lint-ignore no-explicit-any
    ] as any,
    messages: [{ role: 'user', content: user }],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'submit_destinations'
  );
  if (!toolUse) throw new Error('Destination suggestion did not complete. Please try again.');
  return (toolUse.input as { destinations: unknown }).destinations;
}

function addDays(isoDate: string | undefined, days: number): string | undefined {
  if (!isoDate) return undefined;
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

interface GeneratedPlanShape {
  title: string;
  city: string;
  vibe: string;
  startTime: string;
  estimatedCost: number;
  stops: Array<Record<string, unknown>>;
}

function dayHints(dayNumber: number, days: number, city: string): string {
  return [
    `Day ${dayNumber} of a ${days}-day vacation in ${city} for a visitor.`,
    dayNumber === 1 ? 'This is arrival day — start no earlier than early afternoon.' : '',
    dayNumber === days ? 'This is departure day — wrap up by early evening.' : '',
    'Make this day distinct from the other days of the trip (different neighborhoods/venue types).',
  ]
    .filter(Boolean)
    .join(' ');
}

function mergeDayPlans(
  dayPlans: (GeneratedPlanShape | null)[],
  days: number,
  city: string
): GeneratedPlanShape {
  const stops: Array<Record<string, unknown>> = [];
  let order = 1;
  dayPlans.forEach((dayPlan, i) => {
    dayPlan?.stops?.forEach((s) => {
      stops.push({ ...s, order: order++, day: i + 1 });
    });
  });
  return {
    title: `${days} days in ${city}`,
    city,
    vibe: dayPlans
      .filter(Boolean)
      .map((p) => p!.title)
      .join(' · '),
    startTime: dayPlans.find(Boolean)?.startTime ?? '14:00',
    estimatedCost: stops.reduce((sum, s) => sum + (Number(s.estimatedCost) || 0), 0),
    stops,
  };
}

/**
 * Vacation mode: one day-plan per day, generated in parallel. The venue
 * shortlist assigns each day its own venues so days never repeat them.
 * Short trips (<=3 days) run in this isolate; longer trips fan out one
 * child invocation per day (a single isolate can't survive 7-10 concurrent
 * generations), and the last child to finish assembles the trip.
 */
async function generateVacation(
  client: Anthropic,
  body: Record<string, unknown>,
  report?: ProgressReporter
): Promise<unknown> {
  const days = Math.min(Math.max(Math.round(Number(body.days)) || 2, 1), 10);
  const totalBudget = Number(body.budget);
  const perDayBudget = Math.max(50, Math.round(totalBudget / days));
  const city = String(body.city);

  report?.('scouting');
  let buckets: Awaited<ReturnType<typeof shortlistVenues>> = null;
  try {
    buckets = await withTimeout(
      shortlistVenues(client, { ...body, budget: perDayBudget }, days),
      SHORTLIST_TIMEOUT_MS
    );
  } catch (err) {
    console.error('vacation shortlist failed, continuing without:', err);
  }
  report?.('building', 0, days);
  let doneCount = 0;

  const dayJobs = Array.from({ length: days }, (_, i) => {
    const dayNumber = i + 1;
    const hints = dayHints(dayNumber, days, city);

    let assignment: VenueAssignment | undefined;
    if (buckets) {
      const assigned = [buckets.culture[i], buckets.restaurant[i], buckets.nightlife[i]].filter(
        Boolean
      );
      const avoid = Object.values(buckets)
        .flat()
        .filter((v) => !assigned.includes(v))
        .map((v) => v.name);
      assignment = { assigned, avoid };
    }

    const dayBody = {
      ...body,
      budget: perDayBudget,
      date: addDays(body.date as string | undefined, i) ?? body.date,
      startTime: dayNumber === 1 ? (body.startTime ?? '14:00') : '10:00',
      durationHours: dayNumber === 1 || dayNumber === days ? 6 : 10,
    };
    return withTimeout(generateSinglePlan(client, dayBody, hints, assignment), PLAN_TIMEOUT_MS).then(
      (v) => {
        doneCount += 1;
        report?.('building', doneCount, days);
        return v;
      }
    );
  });

  const results = await Promise.allSettled(dayJobs);
  const dayPlans = results.map((r) =>
    r.status === 'fulfilled' ? (r.value as GeneratedPlanShape | null) : null
  );
  if (!dayPlans.some(Boolean)) {
    throw new Error('Vacation planning did not complete. Please try again.');
  }

  return [mergeDayPlans(dayPlans, days, city)];
}

/**
 * Long-trip fan-out: shortlist venues here, then fire one child invocation per
 * day. Children run independently and the last one to finish merges the trip.
 */
async function dispatchVacationDays(
  client: Anthropic,
  body: Record<string, unknown>,
  jobId: string,
  authHeader: string,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<void> {
  const days = Math.min(Math.max(Math.round(Number(body.days)) || 2, 1), 10);
  const perDayBudget = Math.max(50, Math.round(Number(body.budget) / days));

  // Progress markers in the error field (status stays pending; the client only
  // reads error when status === 'error').
  const mark = (note: string) =>
    supabase.from('plan_jobs').update({ error: note }).eq('id', jobId);
  const report = makeReporter(supabase, jobId);
  await mark('dispatch:start');
  report('scouting');

  let buckets: Awaited<ReturnType<typeof shortlistVenues>> = null;
  try {
    buckets = await withTimeout(
      shortlistVenues(client, { ...body, budget: perDayBudget }, days),
      SHORTLIST_TIMEOUT_MS
    );
    await mark(`dispatch:shortlist-ok:${buckets ? 'buckets' : 'null'}`);
  } catch (err) {
    console.error('vacation shortlist failed, continuing without:', err);
    await mark(`dispatch:shortlist-failed:${err instanceof Error ? err.message : 'unknown'}`);
  }

  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-date-plan`;
  const fires = Array.from({ length: days }, (_, i) => {
    const dayNumber = i + 1;
    let assignment: VenueAssignment | undefined;
    if (buckets) {
      const assigned = [buckets.culture[i], buckets.restaurant[i], buckets.nightlife[i]].filter(
        Boolean
      );
      const avoid = Object.values(buckets)
        .flat()
        .filter((v) => !assigned.includes(v))
        .map((v) => v.name);
      assignment = { assigned, avoid };
    }
    return fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'vacation_day',
        jobId,
        day: dayNumber,
        totalDays: days,
        assignment: assignment ?? null,
        pushToken: body.pushToken ?? null,
        avoidVenues: body.avoidVenues ?? [],
        lovedVenues: body.lovedVenues ?? [],
        dislikedVenues: body.dislikedVenues ?? [],
        city: body.city,
        budget: perDayBudget,
        date: addDays(body.date as string | undefined, i) ?? body.date,
        startTime: dayNumber === 1 ? (body.startTime ?? '14:00') : '10:00',
        durationHours: dayNumber === 1 || dayNumber === days ? 6 : 10,
        notes: body.notes,
        vibes: body.vibes ?? [],
        mustInclude: body.mustInclude ?? [],
        profile: body.profile,
      }),
    }).catch((err) => console.error(`failed to dispatch day ${dayNumber}:`, err));
  });
  // Children reply 202 immediately and work in their own isolates; awaiting
  // here just ensures the requests are accepted before this isolate ends.
  const settled = await Promise.allSettled(fires);
  const statuses = settled
    .map((s) => (s.status === 'fulfilled' ? (s.value as Response | undefined)?.status : 'ERR'))
    .join(',');
  await mark(`dispatch:fired:${statuses}`);
  report('building', 0, days);
}

/**
 * plan_for_me fan-out: shortlist here, then one child invocation per plan
 * angle. Same architecture as long vacations — one isolate per generation.
 */
async function dispatchPlanAngles(
  client: Anthropic,
  body: Record<string, unknown>,
  jobId: string,
  authHeader: string,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<void> {
  const report = makeReporter(supabase, jobId);
  report('scouting');

  let buckets: Awaited<ReturnType<typeof shortlistVenues>> = null;
  try {
    buckets = await withTimeout(shortlistVenues(client, body, 3), SHORTLIST_TIMEOUT_MS);
  } catch (err) {
    console.error('plan shortlist failed, continuing without:', err);
  }

  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-date-plan`;
  const fires = PLAN_ANGLES.map((angle, i) => {
    let assignment: VenueAssignment | undefined;
    if (buckets) {
      const assigned = [buckets.culture[i], buckets.restaurant[i], buckets.nightlife[i]].filter(
        Boolean
      );
      const avoid = Object.values(buckets)
        .flat()
        .filter((v) => !assigned.includes(v))
        .map((v) => v.name);
      assignment = { assigned, avoid };
    }
    return fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'plan_unit',
        jobId,
        slot: i + 1,
        total: PLAN_ANGLES.length,
        angle,
        assignment: assignment ?? null,
        pushToken: body.pushToken ?? null,
        avoidVenues: body.avoidVenues ?? [],
        lovedVenues: body.lovedVenues ?? [],
        dislikedVenues: body.dislikedVenues ?? [],
        city: body.city,
        budget: body.budget,
        date: body.date,
        startTime: body.startTime,
        durationHours: body.durationHours,
        notes: body.notes,
        vibes: body.vibes ?? [],
        mustInclude: body.mustInclude ?? [],
        profile: body.profile,
      }),
    }).catch((err) => console.error(`failed to dispatch plan ${i + 1}:`, err));
  });
  await Promise.allSettled(fires);
  report('building', 0, PLAN_ANGLES.length);
}

/** Child invocation: generate one plan (one angle of plan_for_me). */
async function runPlanUnit(
  apiKey: string,
  body: Record<string, unknown>,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<void> {
  const jobId = String(body.jobId);
  const slot = Number(body.slot);
  const total = Number(body.total);
  const client = trackedAnthropic(apiKey, supabase, jobId);

  let plan: GeneratedPlanShape | null = null;
  try {
    plan = (await withTimeout(
      generateSinglePlan(
        client,
        body,
        String(body.angle ?? ''),
        (body.assignment as VenueAssignment | null) ?? undefined
      ),
      PLAN_TIMEOUT_MS
    )) as GeneratedPlanShape | null;
  } catch (err) {
    console.error(`plan unit ${slot} failed:`, err);
  }

  const { data: newCount, error: rpcError } = await supabase.rpc('append_partial', {
    job_id: jobId,
    item: { slot, plan },
  });
  if (rpcError) {
    console.error('append_partial failed:', rpcError);
    return;
  }
  makeReporter(supabase, jobId)('building', Number(newCount), total);

  if (Number(newCount) >= total) {
    const { data: jobRow } = await supabase
      .from('plan_jobs')
      .select('partial')
      .eq('id', jobId)
      .single();
    const partials = (jobRow?.partial ?? []) as Array<{
      slot: number;
      plan: GeneratedPlanShape | null;
    }>;
    const plans = partials
      .slice()
      .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0))
      .map((p) => p.plan)
      .filter(Boolean);
    if (plans.length === 0) {
      await supabase
        .from('plan_jobs')
        .update({ status: 'error', error: 'Plan generation did not complete. Please try again.' })
        .eq('id', jobId);
      return;
    }
    await supabase
      .from('plan_jobs')
      .update({ status: 'done', plans, progress: { stage: 'done' } })
      .eq('id', jobId);
    await sendPush(
      (body.pushToken as string | null) ?? null,
      'Your plans are ready! 🎉',
      `Paint the Town finished planning in ${body.city}. Take a look.`
    );
  }
}

/** Child invocation: generate one vacation day and append it to the job. */
async function runVacationDay(
  apiKey: string,
  body: Record<string, unknown>,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<void> {
  const jobId = String(body.jobId);
  const day = Number(body.day);
  const totalDays = Number(body.totalDays);
  const city = String(body.city);
  const client = trackedAnthropic(apiKey, supabase, jobId);

  let plan: GeneratedPlanShape | null = null;
  try {
    plan = (await withTimeout(
      generateSinglePlan(
        client,
        body,
        dayHints(day, totalDays, city),
        (body.assignment as VenueAssignment | null) ?? undefined
      ),
      PLAN_TIMEOUT_MS
    )) as GeneratedPlanShape | null;
  } catch (err) {
    console.error(`vacation day ${day} failed:`, err);
  }

  const { data: newCount, error: rpcError } = await supabase.rpc('append_partial', {
    job_id: jobId,
    item: { day, plan },
  });
  if (rpcError) {
    console.error('append_partial failed:', rpcError);
    return;
  }
  makeReporter(supabase, jobId)('building', Number(newCount), totalDays);

  if (Number(newCount) >= totalDays) {
    // Last child standing assembles the trip.
    const { data: jobRow } = await supabase
      .from('plan_jobs')
      .select('partial')
      .eq('id', jobId)
      .single();
    const partials = ((jobRow?.partial ?? []) as Array<{ day: number; plan: GeneratedPlanShape | null }>);
    const byDay: (GeneratedPlanShape | null)[] = Array.from({ length: totalDays }, () => null);
    for (const p of partials) {
      if (p.day >= 1 && p.day <= totalDays) byDay[p.day - 1] = p.plan;
    }
    if (!byDay.some(Boolean)) {
      await supabase
        .from('plan_jobs')
        .update({ status: 'error', error: 'Vacation planning did not complete. Please try again.' })
        .eq('id', jobId);
      return;
    }
    const merged = mergeDayPlans(byDay, totalDays, city);
    await supabase
      .from('plan_jobs')
      .update({ status: 'done', plans: [merged], progress: { stage: 'done' } })
      .eq('id', jobId);
    await sendPush(
      (body.pushToken as string | null) ?? null,
      'Your trip is ready! ✈️',
      `Paint the Town finished planning your ${totalDays} days in ${city}.`
    );
  }
}

// eslint-disable-next-line complexity -- tracked in #1
async function generatePlans(
  apiKey: string,
  body: Record<string, unknown>,
  report?: ProgressReporter,
  // deno-lint-ignore no-explicit-any
  supabase?: any,
  jobId?: string | null
): Promise<unknown> {
  const client = supabase
    ? trackedAnthropic(apiKey, supabase, jobId ?? null)
    : new Anthropic({ apiKey });

  if (body.mode === 'suggest_destinations') {
    // Runs alone in its isolate, so it can use most of the 400s wall clock.
    report?.('scouting');
    return withTimeout(suggestDestinations(client, body), 320_000);
  }

  if (body.mode === 'replace_stop') {
    // Runs alone in its isolate — give it real headroom under the 400s cap.
    report?.('building', 0, 1);
    return withTimeout(generateReplacementStop(client, body), 300_000);
  }

  if (body.mode === 'vacation') {
    return generateVacation(client, body, report);
  }

  if (body.mode !== 'plan_for_me') {
    report?.('building', 0, 1);
    const plan = await withTimeout(generateSinglePlan(client, body), PLAN_TIMEOUT_MS);
    if (!plan) throw new Error('Plan generation did not complete. Please try again.');
    return [plan];
  }

  // Phase 1: one fast research pass for 9 distinct venues, so the three plans
  // never overlap. Falls back to angle-only generation if it fails.
  report?.('scouting');
  let buckets: Awaited<ReturnType<typeof shortlistVenues>> = null;
  try {
    buckets = await withTimeout(shortlistVenues(client, body), SHORTLIST_TIMEOUT_MS);
  } catch (err) {
    console.error('venue shortlist failed, falling back to angle-only:', err);
  }
  report?.('building', 0, 3);
  let doneCount = 0;

  const assignments: (VenueAssignment | undefined)[] = [0, 1, 2].map((i) => {
    if (!buckets) return undefined;
    const assigned = [buckets.culture[i], buckets.restaurant[i], buckets.nightlife[i]];
    const avoid = Object.values(buckets)
      .flat()
      .filter((v) => !assigned.includes(v))
      .map((v) => v.name);
    return { assigned, avoid };
  });

  // Phase 2: three distinct plans in parallel — wall time is the slowest
  // single plan, which keeps us inside the edge function's 400s budget.
  const results = await Promise.allSettled(
    PLAN_ANGLES.map((angle, i) =>
      withTimeout(generateSinglePlan(client, body, angle, assignments[i]), PLAN_TIMEOUT_MS).then(
        (v) => {
          doneCount += 1;
          report?.('building', doneCount, 3);
          return v;
        }
      )
    )
  );
  const plans = results
    .filter(
      (r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled' && r.value != null
    )
    .map((r) => r.value);

  if (plans.length === 0) {
    const firstError = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    throw new Error(
      firstError?.reason instanceof Error
        ? firstError.reason.message
        : 'Plan generation did not complete. Please try again.'
    );
  }
  return plans;
}

// eslint-disable-next-line complexity -- tracked in #1
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured on the server.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    if (!body.city || !body.budget) {
      return new Response(JSON.stringify({ error: 'city and budget are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // User-scoped client (RLS applies) using the caller's JWT.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not signed in' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Child invocations (one generation unit each): no caps, no job creation
    // (RLS still scopes the job row to this user).
    if (body.mode === 'vacation_day' || body.mode === 'plan_unit') {
      EdgeRuntime.waitUntil(
        body.mode === 'vacation_day'
          ? runVacationDay(apiKey, body, supabase)
          : runPlanUnit(apiKey, body, supabase)
      );
      return new Response(JSON.stringify({ accepted: true }), {
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- Usage limits (failed jobs don't count) ----
    // Pure verdict logic lives in quota.ts; this block only fetches the
    // tier and the two job counts, then enforces whatever it says.
    const { modeFilter, isSuggestion } = bucketForMode(body.mode);

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('subscription_tier, push_token')
      .eq('id', user.id)
      .maybeSingle();
    const pushToken = (profileRow?.push_token as string | null) ?? null;
    const tier = tierFor(profileRow);

    const { monthStart, dayStart } = windowStarts(new Date());

    const countJobs = async (since: string) => {
      const { count } = await supabase
        .from('plan_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('status', 'error')
        .gte('created_at', since)
        .in('request->>mode', modeFilter);
      return count ?? 0;
    };

    const verdict = checkQuota({
      mode: body.mode,
      tier,
      monthlyUsed: await countJobs(monthStart),
      dailyUsed: await countJobs(dayStart),
      // Trial users are gated on lifetime usage, not calendar windows.
      lifetimeUsed:
        tier === 'trial' && !isSuggestion ? await countJobs('1970-01-01T00:00:00.000Z') : 0,
    });
    if (!verdict.allowed) {
      return new Response(
        JSON.stringify({
          error: verdict.error,
          limitReached: true,
          ...(verdict.premiumRequired ? { premiumRequired: true } : {}),
          ...(verdict.subscriptionRequired ? { subscriptionRequired: true } : {}),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // ---- end usage limits ----

    const { data: job, error: insertError } = await supabase
      .from('plan_jobs')
      .insert({
        user_id: user.id,
        request: body,
        status: 'pending',
        progress: { stage: 'starting', done: null, total: null },
      })
      .select('id')
      .single();
    if (insertError || !job) {
      throw new Error(`Failed to create job: ${insertError?.message}`);
    }
    const report = makeReporter(supabase, job.id);

    // Generate in the background; the client polls the plan_jobs row.
    // Anything with parallel generations fans out one child invocation per
    // unit — a single isolate can't survive multiple concurrent generations.
    if (body.mode === 'vacation' || body.mode === 'plan_for_me') {
      const authHeader = req.headers.get('Authorization') ?? '';
      const dispatch =
        body.mode === 'vacation'
          ? dispatchVacationDays(
              trackedAnthropic(apiKey, supabase, job.id),
              { ...body, pushToken },
              job.id,
              authHeader,
              supabase
            )
          : dispatchPlanAngles(
              trackedAnthropic(apiKey, supabase, job.id),
              { ...body, pushToken },
              job.id,
              authHeader,
              supabase
            );
      EdgeRuntime.waitUntil(
        dispatch.catch(async (err) => {
          console.error('dispatch error:', err);
          await supabase
            .from('plan_jobs')
            .update({
              status: 'error',
              error: err instanceof Error ? err.message : 'Unknown error',
            })
            .eq('id', job.id);
        })
      );
    } else {
      EdgeRuntime.waitUntil(
        generatePlans(apiKey, body, report, supabase, job.id)
          .then(async (plans) => {
            await supabase
              .from('plan_jobs')
              .update({ status: 'done', plans, progress: { stage: 'done' } })
              .eq('id', job.id);
            if (!isSuggestion) {
              await sendPush(
                pushToken,
                'Your plans are ready! 🎉',
                `Paint the Town finished planning in ${body.city}. Take a look.`
              );
            }
          })
          .catch(async (err) => {
            console.error('generate-date-plan job error:', err);
            await supabase
              .from('plan_jobs')
              .update({
                status: 'error',
                error: err instanceof Error ? err.message : 'Unknown error',
              })
              .eq('id', job.id);
          })
      );
    }

    return new Response(JSON.stringify({ jobId: job.id }), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('generate-date-plan error:', err);
    return new Response(JSON.stringify({ error: 'Internal error generating plans.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
