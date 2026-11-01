import { z } from "zod";
import {
  GenerateIdeasRequestSchema,
  GenerateIdeasResponseSchema,
  GenerateTimelineRequestSchema,
  GenerateTimelineResponseSchema,
} from "@/lib/ai/schemas";
import { generateStructuredAI, sanitizeUserPromptInput } from "@/lib/ai/client";
import { computeRelativeDueDate, formatMinorCurrency } from "@/lib/utils/currency";
import { generateReplanProposal, ReplanProposal } from "@/lib/ai/replan";

type GenerateIdeasRequest = z.infer<typeof GenerateIdeasRequestSchema>;
export type GenerateIdeasResponse = z.infer<typeof GenerateIdeasResponseSchema>;

type GenerateTimelineRequest = z.infer<typeof GenerateTimelineRequestSchema>;
export type GenerateTimelineResponse = z.infer<typeof GenerateTimelineResponseSchema>;

export async function generateCreativeIdeas(
  rawInput: GenerateIdeasRequest
): Promise<GenerateIdeasResponse> {
  const input = GenerateIdeasRequestSchema.parse(rawInput);
  const safePrompt = sanitizeUserPromptInput(input.prompt, 400);

  const systemPrompt = `You are VervePlan's Creative Director & Theme Designer.
Generate a cohesive, actionable celebration theme concept with hex color swatches, decor, lighting, seating, photography, food presentation, and practical tips in strict JSON.`;

  const userPrompt = JSON.stringify({
    prompt: safePrompt,
    eventType: input.eventType,
    location: input.location,
    budgetMinor: input.budgetMinor,
    currency: input.currency,
  });

  const aiResult = await generateStructuredAI({
    systemPrompt,
    userPrompt,
    schema: GenerateIdeasResponseSchema,
    temperature: 0.6,
  });

  if (aiResult) {
    return { ...aiResult.data, isFallback: false };
  }

  const lower = safePrompt.toLowerCase();
  const isSunsetGarden =
    lower.includes("sunset") || lower.includes("garden") || lower.includes("engagement");
  const isRoyal =
    lower.includes("royal") || lower.includes("heritage") || lower.includes("traditional");

  const themeName = isSunsetGarden
    ? "Sunset Botanical Soirée"
    : isRoyal
    ? "Gilded Courtyard Heritage"
    : `Bespoke ${input.eventType} Reverie`;

  return {
    isFallback: true,
    themeName,
    tagline: `A warm, modern celebration aesthetic crafted for ${input.location}`,
    description: `Inspired by "${safePrompt}", this concept blends layered ambient lighting, tactile linen textures, reusable seasonal greenery, and interactive guest moments without inflating floral costs.`,
    colors: [
      { name: "Utsav Iris", hex: "#7456E8", role: "Primary Drapes & Accent Florals" },
      { name: "Terracotta Sunset", hex: "#FF8075", role: "Centerpieces & Welcome Signage" },
      { name: "Champagne Marigold", hex: "#F4C56A", role: "Candlelight & Brass Vessels" },
      { name: "Deep Aubergine", hex: "#241D39", role: "Typography & Contrast Details" },
    ],
    decorationIdeas: [
      "Asymmetrical botanical crescent arch framed with pampas grass, eucalyptus, and coral roses",
      "Hand-woven table runners paired with clustered brass taper candleholders and glass hurricanes",
      "Translucent acrylic welcome sign with brushed gold lettering and up-lit floral base",
      "Cozy lounge vignette with low cane seating, bolster cushions, and vintage rugs",
    ],
    lightingSuggestions: [
      "Overhead canopy of 2700K warm Edison festoon bulbs on dimmers",
      "Soft amber uplighting on perimeter trees and architectural pillars",
      "Pin-spots highlighting the cake/toast focal table and live food stations",
    ],
    seatingAndVenueSetup:
      "Semi-circular conversational clusters around the focal stage, leaving a wide 8-foot breeze corridor between the bar/grazing counters and seated tables.",
    photographyConcepts: [
      "Golden-hour couple/host portraits framed by the asymmetrical botanical arch",
      "Candid overhead shot of the long communal grazing table lit by taper candles",
      "Sparkler or warm bubble send-off tunnel at the conclusion of the evening",
    ],
    foodPresentation:
      "Tiered mango-wood risers, artisanal ceramic platters, live small-plate pass-arounds, and botanical garnish infusions on signature mocktails.",
    suggestedActivities: [
      "Audio guestbook vintage telephone or instant Polaroid memory wall",
      "Interactive build-your-own artisanal chaat / bruschetta bar",
      "Curated 15-minute golden hour acoustic toast and trivia",
    ],
    estimatedBudgetImpact: input.budgetMinor
      ? `Designed to fit within ~15% (${formatMinorCurrency(
          Math.round(input.budgetMinor * 0.15),
          input.currency
        )}) of your total budget by prioritizing lighting and reusable foliage.`
      : "High visual impact per rupee by combining warm lighting with focal botanicals.",
    implementationTips: [
      "Rent potted palms and brass vessels locally rather than purchasing single-use props",
      "Schedule lighting focus 45 minutes before sunset to balance natural and warm artificial glow",
      "Use dual-sided signage at the entrance so guests immediately spot the welcome cooler bar",
    ],
  };
}

export async function generateTimelineProposal(
  rawInput: GenerateTimelineRequest
): Promise<GenerateTimelineResponse> {
  const input = GenerateTimelineRequestSchema.parse(rawInput);
  const safeInstruction = sanitizeUserPromptInput(input.instruction, 400);

  const systemPrompt = `You are VervePlan's Timeline & Milestone Scheduler.
Given an event date (${input.eventDate}), current tasks, and the user's timeline request, return a structured JSON timeline proposal.
Ensure no proposed due date is scheduled in the past relative to today.`;

  const userPrompt = JSON.stringify({
    instruction: safeInstruction,
    eventDate: input.eventDate,
    eventType: input.eventType,
    currentTasks: input.currentTasks,
  });

  const aiResult = await generateStructuredAI({
    systemPrompt,
    userPrompt,
    schema: GenerateTimelineResponseSchema,
    temperature: 0.3,
  });

  if (aiResult) {
    return { ...aiResult.data, isFallback: false };
  }

  const lower = safeInstruction.toLowerCase();
  const moveEarlierDays = lower.includes("week earlier")
    ? 7
    : lower.includes("two weeks")
    ? 14
    : 5;

  const targetCategory = lower.includes("decor")
    ? "Decorations"
    : lower.includes("cater")
    ? "Catering"
    : lower.includes("photo")
    ? "Photography"
    : null;

  const proposedTasks: GenerateTimelineResponse["proposedTasks"] = input.currentTasks
    .filter((t) => t.status !== "Completed")
    .filter((t) =>
      targetCategory ? t.category.toLowerCase().includes(targetCategory.toLowerCase()) : true
    )
    .slice(0, 4)
    .map((t) => {
      const currentDue = new Date(t.dueDate);
      currentDue.setDate(currentDue.getDate() - moveEarlierDays);
      const todayIso = new Date().toISOString().slice(0, 10);
      const proposedDueDate =
        currentDue.toISOString().slice(0, 10) < todayIso
          ? computeRelativeDueDate(input.eventDate, 3)
          : currentDue.toISOString().slice(0, 10);

      return {
        action: "update" as const,
        id: t.id,
        title: t.title,
        description: `Rescheduled based on "${safeInstruction}" to build extra buffer before ${input.eventDate}.`,
        previousDueDate: t.dueDate,
        proposedDueDate,
        priority: "High" as const,
        category: t.category,
        phase: "Vendor & Design" as const,
        reason: `Moved earlier by ${moveEarlierDays} days (clamped safely to future dates) so vendor dependencies stay on track.`,
      };
    });

  if (proposedTasks.length === 0) {
    proposedTasks.push({
      action: "add",
      id: undefined,
      title: `Accelerated readiness review (${input.eventType})`,
      description: `Added milestone check per request: "${safeInstruction}"`,
      previousDueDate: undefined,
      proposedDueDate: computeRelativeDueDate(input.eventDate, 7),
      priority: "High",
      category: targetCategory || "Logistics",
      phase: "Final Countdown",
      reason: "Created new milestone to keep event preparation on schedule.",
    });
  }

  return {
    isFallback: true,
    summary: `Prepared ${proposedTasks.length} timeline adjustment(s) for "${safeInstruction}". Review the proposed dates below before applying.`,
    proposedTasks,
  };
}

/**
 * Determines whether a Copilot chat message is a Read-Only query, Creative Ideation request,
 * or a Synchronized Plan Modification request, and returns the structured response.
 */
export async function processCopilotMessage(params: {
  eventId: string;
  message: string;
  baseVersion: number;
  context: {
    title: string;
    eventType: string;
    eventDate: string;
    location: string;
    guestTarget: number;
    totalBudgetMinor: number;
    confirmedSpendMinor: number;
    remainingBudgetMinor: number;
    currency: "INR" | "USD" | "EUR" | "GBP";
    theme: string;
    priorities: string[];
    categories: { name: string; allocatedAmountMinor: number }[];
    tasks: { title: string; dueDate: string; priority: string; status: string }[];
    vendors: { name: string; category: string; bookingStatus: string; quotedAmountMinor: number }[];
    confirmedGuests: number;
    pendingGuests: number;
  };
}): Promise<{
  intentType: "read_only" | "creative" | "modification";
  reply: string;
  proposal?: ReplanProposal;
  isFallback: boolean;
}> {
  const text = params.message.trim();
  const lower = text.toLowerCase();
  const { context } = params;

  // Detect modification requests (changing guest count, changing budget cap, rebalancing plan)
  const isModification =
    /(?:make this suitable|increase|decrease|reduce|adjust|change|update|replan|now have|instead of|keep.*budget|under ₹|below ₹|within ₹)/i.test(
      text
    ) &&
    /(?:guest|people|pax|budget|expense|catering|plan|everything|lakh|₹|\d+)/i.test(text);

  if (isModification) {
    const proposal = await generateReplanProposal({
      eventId: params.eventId,
      instruction: text,
      baseVersion: params.baseVersion,
      context: {
        title: context.title,
        eventType: context.eventType,
        eventDate: context.eventDate,
        location: context.location,
        guestTarget: context.guestTarget,
        totalBudgetMinor: context.totalBudgetMinor,
        currency: context.currency,
        theme: context.theme,
        priorities: context.priorities,
        categories: context.categories,
        tasksCount: context.tasks.length,
        vendorsCount: context.vendors.length,
      },
    });

    const reply = [
      `### Synchronized Replanning Proposal Ready`,
      proposal.summary,
      !proposal.feasible && proposal.infeasibilityReason
        ? `\n> ⚠️ **Feasibility Note:** ${proposal.infeasibilityReason}\n> **Recommended Alternative:** ${proposal.alternativeSuggestion}`
        : "",
      `\n**Key Impacts Across Your Plan:**`,
      `- **Guests & Seating:** ${proposal.previousGuestTarget} → **${proposal.proposedGuestTarget} guests** (${proposal.spaceAndSeatingImplications})`,
      `- **Total Budget Limit:** ${formatMinorCurrency(
        proposal.previousTotalBudgetMinor,
        context.currency
      )} → **${formatMinorCurrency(proposal.proposedTotalBudgetMinor, context.currency)}**`,
      `- **Catering Adjustments:** ${proposal.cateringImplications}`,
      `\nReview the before-and-after breakdown card below and click **Apply Changes** to commit this update to your event plan, or **Keep Current Plan** to discard.`,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      intentType: "modification",
      reply,
      proposal,
      isFallback: proposal.isFallback,
    };
  }

  // Read-only factual questions about money/budget left
  if (
    lower.includes("how much money") ||
    lower.includes("budget left") ||
    lower.includes("remaining budget") ||
    lower.includes("spent so far")
  ) {
    const topCategories = context.categories
      .slice(0, 4)
      .map(
        (c) =>
          `- **${c.name}:** ${formatMinorCurrency(c.allocatedAmountMinor, context.currency)}`
      )
      .join("\n");

    return {
      intentType: "read_only",
      isFallback: true,
      reply: `Here is your verified budget snapshot for **${context.title}**:\n\n- **Total Planned Budget:** ${formatMinorCurrency(
        context.totalBudgetMinor,
        context.currency
      )}\n- **Confirmed Expenses So Far:** ${formatMinorCurrency(
        context.confirmedSpendMinor,
        context.currency
      )}\n- **Remaining Available Funds:** **${formatMinorCurrency(
        context.remainingBudgetMinor,
        context.currency
      )}**\n\n**Top Category Allocations:**\n${topCategories}\n\n*(No stored data was modified by this query.)*`,
    };
  }

  // Next important task
  if (lower.includes("next") && lower.includes("task")) {
    const pendingHigh = context.tasks.filter(
      (t) => t.status !== "Completed" && t.priority === "High"
    );
    const pendingAny = context.tasks.filter((t) => t.status !== "Completed");
    const list = (pendingHigh.length > 0 ? pendingHigh : pendingAny)
      .slice(0, 3)
      .map((t) => `- **${t.title}** (Due: \`${t.dueDate}\` · Priority: ${t.priority})`)
      .join("\n");

    return {
      intentType: "read_only",
      isFallback: true,
      reply: pendingAny.length
        ? `You have **${pendingAny.length} open tasks** (${pendingHigh.length} High Priority). Here are your next critical priorities:\n\n${list}`
        : `All scheduled tasks for **${context.title}** are currently marked Completed!`,
    };
  }

  // Rain / weather contingency
  if (lower.includes("rain") || lower.includes("weather")) {
    return {
      intentType: "creative",
      isFallback: true,
      reply: `### Rain & Weather Contingency Plan for ${context.title}\n\n1. **Covered Veranda / Clear-Span Canopy Backup:** Confirm with your venue in **${context.location}** that an adjoining indoor hall or waterproof clear marquee can be activated 6 hours prior if rain probability exceeds 40%.\n2. **Elevated Cabling & Acoustic Protection:** Keep the acoustic PA system and decorative uplights on covered risers.\n3. **Warm Monsoon Hospitality Touch:** Offer hot masala chai / filter coffee and covered umbrella valet escorts from the arrival gate.`,
    };
  }

  // Creative decoration / itinerary suggestions
  return {
    intentType: "creative",
    isFallback: true,
    reply: `Here are tailored recommendations for **${context.title}** (${context.guestTarget} guests · ${formatMinorCurrency(
      context.totalBudgetMinor,
      context.currency
    )} budget · **${context.theme}** theme):\n\n1. **Focal Visual Anchor:** Concentrate 65% of your decor budget on the welcome arch, warm 2700K festoon lighting canopy, and dining table lanterns.\n2. **Smooth Guest Flow:** With **${context.guestTarget} guests**, place your welcome cooler bar 15 feet inside the entrance so guests naturally mingle before moving to the seating clusters.\n3. **Want to modify your plan?** Tell me a specific target like: *"Make this suitable for 80 guests while keeping the total budget below ₹90,000"* and I will generate a synchronized before-and-after change proposal for your approval.`,
  };
}
