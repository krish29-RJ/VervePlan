import { z } from "zod";
import { ReplanProposalSchema, ReplanRequestSchema } from "@/lib/ai/schemas";
import { generateStructuredAI, sanitizeUserPromptInput } from "@/lib/ai/client";
import {
  computeRelativeDueDate,
  formatMinorCurrency,
  toMinorUnits,
} from "@/lib/utils/currency";

type ReplanRequest = z.infer<typeof ReplanRequestSchema>;
export type ReplanProposal = z.infer<typeof ReplanProposalSchema>;

/**
 * Flagship Synchronized Replanning Engine (`POST /api/ai/propose-changes`).
 * Analyzes user modifications (e.g., "Make this suitable for 80 guests while keeping the total budget below ₹90,000"),
 * computes synchronized changes across guest count, budget categories, tasks, and vendor guidance,
 * and validates mathematical feasibility in application code.
 */
export async function generateReplanProposal(
  rawInput: ReplanRequest
): Promise<ReplanProposal> {
  const input = ReplanRequestSchema.parse(rawInput);
  const safeInstruction = sanitizeUserPromptInput(input.instruction, 600);

  const systemPrompt = `You are VervePlan's Flagship Synchronized Replanning Engine.
When a user updates a requirement (guest count, total budget, venue style, or priorities), analyze which parts of the event plan are affected and propose synchronized changes across budget categories, checklist tasks, and vendor requirements.
Rules:
1. Check mathematical feasibility first. If the requested guest count cannot realistically be fed and hosted within the requested budget limit, set feasible=false, explain why in infeasibilityReason, and provide a realistic alternativeSuggestion and best-effort budgetChanges.
2. Ensure proposedAllocatedSumMinor equals the sum of all proposedMinor values in budgetChanges, and does not exceed proposedTotalBudgetMinor.
3. All monetary figures must be integer minor units (e.g. ₹90,000 = 9000000 paise).`;

  const userPrompt = JSON.stringify({
    instruction: safeInstruction,
    context: input.context,
  });

  const aiResult = await generateStructuredAI({
    systemPrompt,
    userPrompt,
    schema: ReplanProposalSchema,
    temperature: 0.3,
  });

  if (aiResult) {
    // Enforce deterministic arithmetic on the AI output
    const sanitizedBudgetChanges = aiResult.data.budgetChanges.map((bc) => {
      const prev = Math.max(0, Math.round(bc.previousMinor));
      const prop = Math.max(0, Math.round(bc.proposedMinor));
      return {
        ...bc,
        previousMinor: prev,
        proposedMinor: prop,
        deltaMinor: prop - prev,
      };
    });
    const proposedAllocatedSumMinor = sanitizedBudgetChanges.reduce(
      (sum, item) => sum + item.proposedMinor,
      0
    );

    return {
      ...aiResult.data,
      budgetChanges: sanitizedBudgetChanges,
      proposedAllocatedSumMinor,
      isFallback: false,
    };
  }

  return buildDeterministicReplanProposal(input);
}

/**
 * Deterministic Synchronized Replanning Engine.
 * Parses natural-language instructions for new guest counts, budget caps, and priority shifts,
 * checks feasibility (e.g. minimum viable per-guest cost), and computes exact synchronized diffs.
 */
export function buildDeterministicReplanProposal(
  input: ReplanRequest
): ReplanProposal {
  const { context, instruction } = input;
  const lower = instruction.toLowerCase();

  // 1. Parse target guest count from user instruction (e.g. "80 guests", "to 120", "for 80 people")
  let proposedGuestTarget = context.guestTarget;
  const guestPatterns = [
    /(\d+)\s*(?:guests|people|attendees|pax|invitees)/i,
    /(?:guest count|guests|headcount)\s*(?:to|of|at|is|now)?\s*(\d+)/i,
    /(?:suitable for|increase to|reduce to|now have)\s*(\d+)/i,
  ];
  for (const pattern of guestPatterns) {
    const match = instruction.match(pattern);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (parsed > 0 && parsed <= 50000) {
        proposedGuestTarget = parsed;
        break;
      }
    }
  }

  // 2. Parse target budget limit from user instruction (e.g. "₹90,000", "2 lakh", "90000", "keep my budget")
  let proposedTotalBudgetMinor = context.totalBudgetMinor;
  const lakhMatch = instruction.match(/(\d+(?:\.\d+)?)\s*lakh/i);
  const explicitCurrencyMatch = instruction
    .replace(/,/g, "")
    .match(/(?:₹|rs\.?|inr|\$|under|below|within|budget\s*(?:of|to|at)?)\s*(\d{4,9})/i);

  if (lakhMatch && lakhMatch[1]) {
    proposedTotalBudgetMinor = toMinorUnits(parseFloat(lakhMatch[1]) * 100000);
  } else if (explicitCurrencyMatch && explicitCurrencyMatch[1]) {
    proposedTotalBudgetMinor = toMinorUnits(parseInt(explicitCurrencyMatch[1], 10));
  }

  // 3. Check mathematical & practical feasibility
  const minViablePerGuestMinor =
    context.currency === "INR" ? 55000 : 2000; // ₹550/guest minimum for venue+food+logistics in INR
  const minRequiredTotalMinor = proposedGuestTarget * minViablePerGuestMinor;
  const feasible = proposedTotalBudgetMinor >= minRequiredTotalMinor;

  const guestRatio = proposedGuestTarget / Math.max(1, context.guestTarget);
  const guestDelta = proposedGuestTarget - context.guestTarget;

  // 4. Synchronize category allocations so they fit within proposedTotalBudgetMinor
  // Catering scales with guest count (with a 6% volume efficiency discount for larger groups)
  // Venue scales moderately if guest count jumps significantly
  // Decorations, Entertainment, and Contingency rebalance to keep total within proposedTotalBudgetMinor
  const rawAdjusted = context.categories.map((cat) => {
    const n = cat.name.toLowerCase();
    let targetMinor = cat.allocatedAmountMinor;
    let reason = `Adjusted proportionally for the updated plan.`;

    if (n.includes("cater") || n.includes("food")) {
      const efficiencyFactor = guestRatio > 1.2 ? 0.92 : 1.0;
      targetMinor = Math.round(cat.allocatedAmountMinor * guestRatio * efficiencyFactor);
      reason =
        guestDelta > 0
          ? `Scaled catering from ${context.guestTarget} to ${proposedGuestTarget} guests using tiered volume per-plate pricing (saving ~8% per plate via concentrated live counters).`
          : guestDelta < 0
          ? `Right-sized catering plates for ${proposedGuestTarget} guests.`
          : `Optimized menu mix to protect dining quality within budget.`;
    } else if (n.includes("venue")) {
      if (guestRatio > 1.35) {
        targetMinor = Math.round(cat.allocatedAmountMinor * 1.12);
        reason = `Added seating/lawn layout expansion & extra banquet tables for ${proposedGuestTarget} guests.`;
      } else {
        targetMinor = cat.allocatedAmountMinor;
        reason = `Retained primary venue footprint while reconfiguring seating clusters for ${proposedGuestTarget} guests.`;
      }
    } else if (n.includes("decor")) {
      if (proposedTotalBudgetMinor < context.totalBudgetMinor * guestRatio) {
        targetMinor = Math.round(cat.allocatedAmountMinor * 0.91);
        reason = `Streamlined perimeter florals in favor of high-impact warm string lighting and reusable botanical runners to free up catering funds.`;
      } else {
        targetMinor = Math.round(cat.allocatedAmountMinor * 1.05);
        reason = `Added table centerpieces for additional guest tables.`;
      }
    } else if (n.includes("inv") || n.includes("favor")) {
      targetMinor = Math.round(cat.allocatedAmountMinor * Math.max(1, guestRatio * 0.9));
      reason = `Adjusted return favors and stationary quantity for ${proposedGuestTarget} guests.`;
    } else if (n.includes("photo") || n.includes("ent")) {
      // Keep fixed-cost service categories steady or slightly streamlined if budget is tight
      const tightBudget = proposedTotalBudgetMinor < context.totalBudgetMinor * guestRatio;
      targetMinor = tightBudget
        ? Math.round(cat.allocatedAmountMinor * 0.95)
        : cat.allocatedAmountMinor;
      reason = tightBudget
        ? `Preserved core ${cat.name.toLowerCase()} coverage while trimming overtime add-ons.`
        : `Kept ${cat.name} package unchanged (fixed service cost independent of guest count).`;
    } else if (n.includes("contingency")) {
      targetMinor = Math.round(proposedTotalBudgetMinor * 0.065);
      reason = `Maintained a ~6.5% safety buffer for ${proposedGuestTarget}-guest operations.`;
    }

    return {
      categoryName: cat.name,
      previousMinor: cat.allocatedAmountMinor,
      proposedMinor: Math.max(0, targetMinor),
      reason,
    };
  });

  // Normalize so sum of proposedMinor equals exact proposedTotalBudgetMinor
  const rawSum = rawAdjusted.reduce((s, c) => s + c.proposedMinor, 0);
  const scale = rawSum > 0 ? proposedTotalBudgetMinor / rawSum : 1;

  const budgetChanges = rawAdjusted.map((c) => {
    const scaled = Math.round(c.proposedMinor * scale);
    return {
      categoryName: c.categoryName,
      previousMinor: c.previousMinor,
      proposedMinor: scaled,
      deltaMinor: scaled - c.previousMinor,
      reason: c.reason,
    };
  });

  const currentScaledSum = budgetChanges.reduce((s, c) => s + c.proposedMinor, 0);
  const roundingDiff = proposedTotalBudgetMinor - currentScaledSum;
  if (roundingDiff !== 0 && budgetChanges.length > 0) {
    const contIdx = budgetChanges.findIndex((c) =>
      c.categoryName.toLowerCase().includes("contingency")
    );
    const targetIdx = contIdx >= 0 ? contIdx : budgetChanges.length - 1;
    budgetChanges[targetIdx].proposedMinor = Math.max(
      0,
      budgetChanges[targetIdx].proposedMinor + roundingDiff
    );
    budgetChanges[targetIdx].deltaMinor =
      budgetChanges[targetIdx].proposedMinor - budgetChanges[targetIdx].previousMinor;
  }

  const proposedAllocatedSumMinor = budgetChanges.reduce((s, c) => s + c.proposedMinor, 0);

  const extraTables = Math.max(1, Math.ceil(Math.abs(guestDelta) / 8));
  const cateringCat = budgetChanges.find((c) =>
    c.categoryName.toLowerCase().includes("cater")
  );

  const taskChanges = [
    {
      action: "add" as const,
      title: `Confirm revised ${proposedGuestTarget}-guest catering plate count & dual buffet flow`,
      dueDate: computeRelativeDueDate(context.eventDate, 10),
      priority: "High" as const,
      category: "Catering",
      reason: `Synchronized with headcount change (${context.guestTarget} → ${proposedGuestTarget} guests).`,
    },
    {
      action: "add" as const,
      title: `Update seating floorplan (${Math.ceil(proposedGuestTarget / 8)} banquet tables + cocktail cluster)`,
      dueDate: computeRelativeDueDate(context.eventDate, 7),
      priority: "High" as const,
      category: "Venue",
      reason:
        guestDelta > 0
          ? `Accommodate ${guestDelta} additional guests (${extraTables} extra tables) without crowding walkways.`
          : `Reconfigure floorplan for ${proposedGuestTarget} guests.`,
    },
    {
      action: "add" as const,
      title: `Order ${proposedGuestTarget} return favors & update RSVP tracker target`,
      dueDate: computeRelativeDueDate(context.eventDate, 5),
      priority: "Medium" as const,
      category: "Guests",
      reason: `Align guest hospitality quantities with ${proposedGuestTarget} guests.`,
    },
  ];

  const vendorImplications = [
    {
      category: "Caterers",
      previousGuidance: `${context.guestTarget} plates standard buffet service`,
      newGuidance: `${proposedGuestTarget} plates with 2 parallel service lines + tiered volume pricing`,
      estimatedImpactMinor: cateringCat ? cateringCat.deltaMinor : 0,
    },
    {
      category: "Venues",
      previousGuidance: `Seating for ${context.guestTarget} guests`,
      newGuidance: `Hybrid banquet + high-top cocktail tables for ${proposedGuestTarget} guests (${extraTables} additional table clusters)`,
      estimatedImpactMinor:
        budgetChanges.find((c) => c.categoryName.toLowerCase().includes("venue"))?.deltaMinor || 0,
    },
    {
      category: "Decorators",
      previousGuidance: `Full perimeter floral + table centerpieces`,
      newGuidance: `Focal arch + warm string lighting canopy + ${Math.ceil(
        proposedGuestTarget / 8
      )} table lanterns`,
      estimatedImpactMinor:
        budgetChanges.find((c) => c.categoryName.toLowerCase().includes("decor"))?.deltaMinor || 0,
    },
  ];

  return {
    isFallback: true,
    feasible,
    infeasibilityReason: feasible
      ? undefined
      : `Hosting ${proposedGuestTarget} guests within ${formatMinorCurrency(
          proposedTotalBudgetMinor,
          context.currency
        )} works out to ${formatMinorCurrency(
          Math.round(proposedTotalBudgetMinor / Math.max(1, proposedGuestTarget)),
          context.currency
        )} per guest across all categories, which is below the practical minimum of ${formatMinorCurrency(
          minViablePerGuestMinor,
          context.currency
        )} per guest.`,
    alternativeSuggestion: feasible
      ? undefined
      : `Consider either capping the guest list at ${Math.floor(
          proposedTotalBudgetMinor / minViablePerGuestMinor
        )} guests or increasing the total budget to at least ${formatMinorCurrency(
          minRequiredTotalMinor,
          context.currency
        )} (or switching to a high-tea / cocktail grazing format).`,
    summary: `Synchronized replanning proposal for **${proposedGuestTarget} guests** (was ${
      context.guestTarget
    }) within a **${formatMinorCurrency(
      proposedTotalBudgetMinor,
      context.currency
    )}** budget (was ${formatMinorCurrency(
      context.totalBudgetMinor,
      context.currency
    )}). Rebalanced ${budgetChanges.length} budget categories and added ${
      taskChanges.length
    } coordination tasks.`,
    previousGuestTarget: context.guestTarget,
    proposedGuestTarget,
    previousTotalBudgetMinor: context.totalBudgetMinor,
    proposedTotalBudgetMinor,
    proposedAllocatedSumMinor,
    budgetChanges,
    taskChanges,
    vendorImplications,
    spaceAndSeatingImplications:
      guestDelta > 0
        ? `Transitions from all-seated rounds (${context.guestTarget} pax) to a hybrid layout: ${Math.ceil(
            proposedGuestTarget * 0.65
          )} seated banquet spots for elders/family + ${Math.floor(
            proposedGuestTarget * 0.35
          )} high-top garden cocktail spots to preserve breezy movement.`
        : `Consolidates seating into ${Math.ceil(
            proposedGuestTarget / 8
          )} intimate round tables closer to the stage.`,
    cateringImplications: `Catering allocation moves from ${formatMinorCurrency(
      cateringCat?.previousMinor || 0,
      context.currency
    )} to ${formatMinorCurrency(
      cateringCat?.proposedMinor || 0,
      context.currency
    )} (${formatMinorCurrency(
      Math.round((cateringCat?.proposedMinor || 0) / Math.max(1, proposedGuestTarget)),
      context.currency
    )}/guest). Uses a two-sided buffet island plus live flatbread/chaat counter to prevent queues for ${proposedGuestTarget} guests.`,
    tradeOffs: [
      `Catering receives the largest share of the budget (${Math.round(
        ((cateringCat?.proposedMinor || 0) / Math.max(1, proposedTotalBudgetMinor)) * 100
      )}%) to feed ${proposedGuestTarget} guests without compromising food quality.`,
      `Decor focuses on high-impact warm lighting and the main focal arch rather than expensive imported cut flowers on every perimeter wall.`,
      `Uses a hybrid banquet + cocktail seating layout so you don't need to rent a larger, costlier venue hall.`,
    ],
    risks: [
      `With ${proposedGuestTarget} guests, single-line buffet service will bottleneck—confirm a two-sided buffet layout with your caterer.`,
      `Verify with the venue coordinator that washroom and parking support ${proposedGuestTarget} attendees.`,
    ],
  };
}
