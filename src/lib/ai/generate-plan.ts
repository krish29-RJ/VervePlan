import { z } from "zod";
import {
  CreateEventInputSchema,
  GeneratedPlanResponseSchema,
} from "@/lib/ai/schemas";
import { generateStructuredAI, sanitizeUserPromptInput } from "@/lib/ai/client";
import {
  formatMinorCurrency,
  normalizeAllocationsToTotal,
} from "@/lib/utils/currency";

type CreateEventInput = z.infer<typeof CreateEventInputSchema>;
export type GeneratedPlanResponse = z.infer<typeof GeneratedPlanResponseSchema> & {
  isFallback: boolean;
};

const CATEGORY_WEIGHTS_BY_TYPE: Record<string, { name: string; weightPercent: number }[]> = {
  Wedding: [
    { name: "Venue", weightPercent: 28 },
    { name: "Catering", weightPercent: 32 },
    { name: "Decorations", weightPercent: 16 },
    { name: "Photography", weightPercent: 10 },
    { name: "Entertainment", weightPercent: 5 },
    { name: "Invitations & Favors", weightPercent: 2 },
    { name: "Contingency", weightPercent: 7 },
  ],
  Birthday: [
    { name: "Venue", weightPercent: 24 },
    { name: "Catering", weightPercent: 34 },
    { name: "Decorations", weightPercent: 15 },
    { name: "Photography", weightPercent: 10 },
    { name: "Entertainment", weightPercent: 7 },
    { name: "Invitations & Favors", weightPercent: 3 },
    { name: "Contingency", weightPercent: 7 },
  ],
  "College Festival": [
    { name: "Entertainment & Stage AV", weightPercent: 36 },
    { name: "Venue & Logistics", weightPercent: 22 },
    { name: "Catering & Hospitality", weightPercent: 17 },
    { name: "Decorations & Branding", weightPercent: 15 },
    { name: "Contingency", weightPercent: 10 },
  ],
  "Corporate Event": [
    { name: "Venue & AV", weightPercent: 32 },
    { name: "Catering", weightPercent: 33 },
    { name: "Branding & Stage Decor", weightPercent: 13 },
    { name: "Photography & Media", weightPercent: 8 },
    { name: "Speaker & Guest Hospitality", weightPercent: 6 },
    { name: "Contingency", weightPercent: 8 },
  ],
  default: [
    { name: "Venue", weightPercent: 25 },
    { name: "Catering", weightPercent: 32 },
    { name: "Decorations", weightPercent: 15 },
    { name: "Photography", weightPercent: 10 },
    { name: "Entertainment", weightPercent: 8 },
    { name: "Invitations", weightPercent: 2 },
    { name: "Contingency", weightPercent: 8 },
  ],
};

/**
 * Generates a complete, validated event plan using OpenAI when configured, or a rich
 * deterministic template engine when offline/unconfigured. Always guarantees that
 * budget category allocations sum to `totalBudgetMinor` in integer minor units.
 */
export async function generateEventPlan(
  rawInput: CreateEventInput
): Promise<GeneratedPlanResponse> {
  const input = CreateEventInputSchema.parse(rawInput);

  const systemPrompt = `You are VervePlan, an elite event planning architect.
Generate a realistic, culturally respectful, budget-accurate event plan in strict JSON matching the required schema.
Rules:
1. Never assume religious or cultural rituals solely from a name or city; only incorporate traditions explicitly mentioned by the user.
2. Respect the exact totalBudgetMinor (${input.totalBudgetMinor} minor units in ${input.currency}). All budgetAllocations must sum to ${input.totalBudgetMinor}.
3. Never fabricate real vendor identities or claim estimated costs are guaranteed quotes.
4. Keep suggestions practical, warm, and tailored to ${input.guestTarget} guests in ${sanitizeUserPromptInput(input.location, 120)}.`;

  const userPrompt = JSON.stringify({
    title: sanitizeUserPromptInput(input.title, 120),
    eventType: input.eventType,
    eventDate: input.eventDate,
    location: sanitizeUserPromptInput(input.location, 120),
    guestTarget: input.guestTarget,
    totalBudgetMinor: input.totalBudgetMinor,
    currency: input.currency,
    theme: sanitizeUserPromptInput(input.theme, 100),
    preferences: input.preferences,
  });

  const aiResult = await generateStructuredAI({
    systemPrompt,
    userPrompt,
    schema: GeneratedPlanResponseSchema,
    temperature: 0.4,
  });

  if (aiResult) {
    // Enforce exact mathematical budget total in application code
    const weights = aiResult.data.budgetAllocations.map((b) => ({
      name: b.name,
      weightPercent: Math.max(1, b.allocatedAmountMinor),
    }));
    const normalized = normalizeAllocationsToTotal(weights, input.totalBudgetMinor);
    const fixedBudgetAllocations = aiResult.data.budgetAllocations.map((b, idx) => ({
      ...b,
      allocatedAmountMinor: normalized[idx]?.allocatedAmountMinor ?? b.allocatedAmountMinor,
      estimatedAmountMinor: normalized[idx]?.allocatedAmountMinor ?? b.estimatedAmountMinor,
    }));

    return {
      ...aiResult.data,
      budgetAllocations: fixedBudgetAllocations,
      isFallback: false,
    };
  }

  return buildDeterministicEventPlan(input);
}

export function buildDeterministicEventPlan(
  input: CreateEventInput
): GeneratedPlanResponse {
  const weights =
    CATEGORY_WEIGHTS_BY_TYPE[input.eventType] || CATEGORY_WEIGHTS_BY_TYPE.default;
  const normalized = normalizeAllocationsToTotal(weights, input.totalBudgetMinor);
  const formattedTotal = formatMinorCurrency(input.totalBudgetMinor, input.currency);

  const budgetAllocations = normalized.map((item) => ({
    name: item.name,
    allocatedAmountMinor: item.allocatedAmountMinor,
    estimatedAmountMinor: item.allocatedAmountMinor,
    notes: `Planned allocation for ${item.name} (${input.guestTarget} guests)`,
  }));

  const palette =
    input.preferences.colorPalette.length >= 3
      ? input.preferences.colorPalette
      : ["#7456E8", "#FF8075", "#F4C56A", "#241D39"];

  return {
    isFallback: true,
    overview: {
      title: input.title,
      description:
        input.description ||
        `A personalized ${input.eventType.toLowerCase()} celebration for ${input.guestTarget} guests in ${input.location}, curated around the "${input.theme}" aesthetic within a ${formattedTotal} budget.`,
      concept: `${input.theme} — combining ${input.preferences.atmosphere.toLowerCase()} ambiance with seamless hospitality for ${input.guestTarget} guests in ${input.location}.`,
      atmosphere: input.preferences.atmosphere,
      highlights: [
        `Signature ${input.theme} welcome arch and ambient lighting setup`,
        `Curated ${input.preferences.foodPreferences} tailored for ${input.guestTarget} guests`,
        `Dedicated ${input.preferences.entertainmentPreferences} flow`,
        input.preferences.traditions
          ? `Special moment: ${input.preferences.traditions}`
          : `Golden-hour group portrait and celebration toast`,
      ],
    },
    theme: {
      primaryTheme: {
        name: input.theme,
        tagline: `Elevated ${(input.preferences.atmosphere || "celebratory").toLowerCase()} experience for ${input.location}`,
        description: `Designed for ${(input.preferences.indoorOutdoor || "event").toLowerCase()} settings, pairing layered lighting, reusable botanicals, and cohesive table styling.`,
        colors: [
          { name: "Celebration Iris", hex: palette[0] || "#7456E8", role: "Primary Drapes & Accents" },
          { name: "Warm Coral", hex: palette[1] || "#FF8075", role: "Florals & Print Stationary" },
          { name: "Festive Gold", hex: palette[2] || "#F4C56A", role: "Lighting & Tableware" },
          { name: "Midnight Plum", hex: palette[3] || "#241D39", role: "Signage & Contrast" },
        ],
        decorSuggestions: [
          `Layered ${input.theme} entrance framing with warm lanterns and fresh seasonal foliage`,
          `Table runners in ${palette[0] || "#7456E8"} and ${palette[2] || "#F4C56A"} with elevated centerpiece cloches`,
          `Custom welcome easel board and directional signage for ${input.guestTarget} guests`,
        ],
        lightingSuggestions: [
          "Warm 2700K overhead string lights and dimmable perimeter uplights",
          "Pin-spot lighting on the focal celebration stage and cake/display table",
        ],
        seatingSetup: `Clustered banquet and lounge seating configured for ${input.guestTarget} guests with clear ${(input.preferences.accessibilityRequirements || "step-free access").toLowerCase()}.`,
        photoConcepts: [
          `Candid arrival portraits at the ${input.theme} welcome backdrop`,
          "Wide-angle celebration toast under warm ambient lighting",
        ],
        foodPresentation: `${input.preferences.foodPreferences || "Curated seasonal dining"} with clearly labelled ${input.preferences.dietaryRequirements || "dietary option"} stations.`,
        creativeTouches: [
          "QR digital memory board for guests to upload instant candid photos",
          "Eco-friendly artisan thank-you favors with personalized notes",
        ],
        estimatedBudgetImpact: `Aligned with your ${formatMinorCurrency(
          budgetAllocations.find((b) => b.name.includes("Decor"))?.allocatedAmountMinor ||
            Math.round(input.totalBudgetMinor * 0.15),
          input.currency
        )} decoration allocation.`,
        implementationTips: [
          "Prioritize high-visibility focal areas (entryway, main stage, dining tables) over sparse full-perimeter florals",
          "Confirm load-in window with the venue 4 hours prior to guest arrival",
        ],
      },
      alternativeThemes: [
        {
          name: "Botanical Twilight",
          description: "Lush greenery, terracotta vessels, and warm Edison bulb canopies.",
          vibe: "Warm & Organic",
          colors: [
            { name: "Forest Sage", hex: "#4934A6" },
            { name: "Amber Glow", hex: "#F4C56A" },
          ],
        },
        {
          name: "Modern Royal Soirée",
          description: "Clean architectural lines, brass candleholders, and rich velvet accents.",
          vibe: "Sophisticated & Timeless",
          colors: [
            { name: "Deep Violet", hex: "#7456E8" },
            { name: "Soft Ivory", hex: "#FAF8FF" },
          ],
        },
      ],
    },
    budgetAllocations,
    itinerary: [
      {
        id: "itin-1",
        time: "17:00",
        title: "Guest Arrival & Welcome Refreshments",
        durationMinutes: 45,
        category: "Hospitality",
        notes: "Welcome drinks, check-in, and ambient background music",
      },
      {
        id: "itin-2",
        time: "17:45",
        title: "Icebreaker Activity & Candid Portraits",
        durationMinutes: 45,
        category: "Activities",
        notes: "Golden hour photography with family and key groups",
      },
      {
        id: "itin-3",
        time: "18:30",
        title: "Main Celebration Moment & Toast",
        durationMinutes: 45,
        category: "Milestone",
        notes: input.preferences.traditions || "Key ceremony, speeches, and celebratory highlight",
      },
      {
        id: "itin-4",
        time: "19:15",
        title: "Curated Dining Experience & Live Counters",
        durationMinutes: 75,
        category: "Catering",
        notes: `${input.preferences.foodPreferences} (${input.preferences.dietaryRequirements})`,
      },
      {
        id: "itin-5",
        time: "20:30",
        title: "Entertainment Set & Dessert Lounge",
        durationMinutes: 60,
        category: "Entertainment",
        notes: input.preferences.entertainmentPreferences,
      },
    ],
    tasks: [
      {
        title: `Shortlist and lock ${input.preferences.venuePreference} in ${input.location}`,
        description: `Confirm capacity for ${input.guestTarget} guests, power backup, and ${input.preferences.indoorOutdoor.toLowerCase()} weather plan.`,
        daysBeforeEvent: 28,
        priority: "High",
        category: "Venue",
        phase: "Early Planning",
      },
      {
        title: "Finalize catering menu & per-plate dietary split",
        description: `Lock ${input.preferences.foodPreferences} and ${input.preferences.dietaryRequirements} counts.`,
        daysBeforeEvent: 20,
        priority: "High",
        category: "Catering",
        phase: "Vendor & Design",
      },
      {
        title: `Approve ${input.theme} decor layout & lighting plot`,
        description: "Review focal backdrop, table centerpieces, and warm lighting specifications.",
        daysBeforeEvent: 15,
        priority: "Medium",
        category: "Decorations",
        phase: "Vendor & Design",
      },
      {
        title: "Confirm photographer & entertainment schedule",
        description: `Share event timeline and key moments for ${input.preferences.entertainmentPreferences}.`,
        daysBeforeEvent: 12,
        priority: "Medium",
        category: "Photography",
        phase: "Vendor & Design",
      },
      {
        title: "Collect final guest RSVPs & confirm seating chart",
        description: `Verify headcount against ${input.guestTarget}-guest target and accessibility seating.`,
        daysBeforeEvent: 5,
        priority: "High",
        category: "Guests",
        phase: "Final Countdown",
      },
      {
        title: "Run venue walkthrough & AV/lighting check",
        description: "Verify setup completion 90 minutes before guest arrival.",
        daysBeforeEvent: 0,
        priority: "High",
        category: "Logistics",
        phase: "Event Day",
      },
    ],
    vendorRequirements: [
      {
        category: "Venues",
        priority: "High",
        estimatedMinMinor: Math.round(input.totalBudgetMinor * 0.2),
        estimatedMaxMinor: Math.round(input.totalBudgetMinor * 0.28),
        bookingDeadlineDaysBefore: 25,
        questionsToAsk: [
          `Can the space comfortably host ${input.guestTarget} guests with ${input.preferences.accessibilityRequirements}?`,
          "Is a covered rain backup space included in the rental?",
        ],
        contractConsiderations: ["Confirm cancellation policy and sound curfew timings"],
      },
      {
        category: "Caterers",
        priority: "High",
        estimatedMinMinor: Math.round(input.totalBudgetMinor * 0.28),
        estimatedMaxMinor: Math.round(input.totalBudgetMinor * 0.35),
        bookingDeadlineDaysBefore: 18,
        questionsToAsk: [
          "What is the tiered per-plate rate if headcount changes by 15–25%?",
          `How are ${input.preferences.dietaryRequirements} stations separated and labelled?`,
        ],
        contractConsiderations: ["Specify final guaranteed guest count deadline (72h prior)"],
      },
      {
        category: "Decorators",
        priority: "Medium",
        estimatedMinMinor: Math.round(input.totalBudgetMinor * 0.12),
        estimatedMaxMinor: Math.round(input.totalBudgetMinor * 0.17),
        bookingDeadlineDaysBefore: 14,
        questionsToAsk: [
          `Can we achieve the "${input.theme}" look using reusable foliage and warm lighting?`,
        ],
        contractConsiderations: ["Include installation and teardown labor in the fixed quote"],
      },
    ],
    guestExperience: {
      arrivalExperience: `Warm welcome desk with refreshing signature coolers and clear directional signage.`,
      seatingConsiderations: `Comfortable seating for ${input.guestTarget} guests with dedicated ${input.preferences.accessibilityRequirements}.`,
      foodAndBeverages: `${input.preferences.foodPreferences} with dedicated ${input.preferences.dietaryRequirements} counters.`,
      entertainment: input.preferences.entertainmentPreferences,
      accessibilityConsiderations: input.preferences.accessibilityRequirements,
      specialActivities: [
        "Interactive photo & memory corner",
        "Curated celebration toast",
      ],
    },
    risks: [
      {
        id: "risk-weather",
        category: "Weather",
        risk:
          input.preferences.indoorOutdoor === "Indoor"
            ? "Heavy city traffic delaying guest arrivals during rain"
            : "Unseasonal rain or wind impacting outdoor decor and seating",
        likelihood: input.preferences.indoorOutdoor === "Indoor" ? "Low" : "Medium",
        mitigation:
          input.preferences.indoorOutdoor === "Indoor"
            ? "Include a 20-minute welcome buffer before the main ceremony starts."
            : "Ensure the venue includes an adjacent covered veranda or waterproof marquee option.",
      },
      {
        id: "risk-guests",
        category: "Guest Count Fluctuation",
        risk: "Late RSVPs increasing catering demand by 10–20%",
        likelihood: "Medium",
        mitigation: "Maintain a 7–8% contingency reserve and lock tiered per-plate rates early.",
      },
    ],
    assumptions: [
      `Generated using VervePlan deterministic planning engine (Template Mode — no external API key required).`,
      `All monetary values are illustrative planning estimates in ${input.currency}, not live vendor quotes.`,
    ],
  };
}
