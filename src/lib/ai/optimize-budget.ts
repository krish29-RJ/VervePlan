import { z } from "zod";
import {
  OptimizeBudgetRequestSchema,
  OptimizeBudgetResponseSchema,
} from "@/lib/ai/schemas";
import { generateStructuredAI, sanitizeUserPromptInput } from "@/lib/ai/client";
import { formatMinorCurrency } from "@/lib/utils/currency";

type OptimizeBudgetRequest = z.infer<typeof OptimizeBudgetRequestSchema>;
export type OptimizeBudgetResponse = z.infer<typeof OptimizeBudgetResponseSchema>;

/**
 * Optimizes an event budget based on user instructions (e.g., "Reduce expenses by 15% without compromising photography").
 * Performs strict mathematical verification in application code so totals and deltas are always exact.
 */
export async function optimizeEventBudget(
  rawInput: OptimizeBudgetRequest
): Promise<OptimizeBudgetResponse> {
  const input = OptimizeBudgetRequestSchema.parse(rawInput);
  const safeInstruction = sanitizeUserPromptInput(input.instruction, 400);

  const systemPrompt = `You are VervePlan's Financial & Budget Optimization Architect.
Given the current event budget categories and the user's optimization instruction, return a structured JSON optimization proposal.
Rules:
1. Respect protected categories mentioned by the user (e.g., if they say "without compromising photography", keep Photography unchanged).
2. Ensure no proposed category allocation drops below already spent confirmed amounts.
3. Explain practical trade-offs clearly without inventing fake vendor prices.`;

  const userPrompt = JSON.stringify({
    instruction: safeInstruction,
    eventType: input.eventType,
    guestCount: input.guestCount,
    currency: input.currency,
    currentTotalBudgetMinor: input.currentTotalBudgetMinor,
    categories: input.categories,
    priorities: input.priorities,
  });

  const aiResult = await generateStructuredAI({
    systemPrompt,
    userPrompt,
    schema: OptimizeBudgetResponseSchema,
    temperature: 0.3,
  });

  if (aiResult) {
    // Re-compute arithmetic deterministically in application code
    const categoryChanges = input.categories.map((cat) => {
      const match = aiResult.data.categoryChanges.find(
        (c) => c.categoryName.toLowerCase() === cat.name.toLowerCase()
      );
      const proposedMinor = Math.max(
        cat.spentMinor,
        match ? Math.round(match.proposedMinor) : cat.allocatedAmountMinor
      );
      return {
        categoryName: cat.name,
        previousMinor: cat.allocatedAmountMinor,
        proposedMinor,
        deltaMinor: proposedMinor - cat.allocatedAmountMinor,
        rationale: match?.rationale || "Maintained at current allocation",
      };
    });

    const currentTotalMinor = input.categories.reduce(
      (s, c) => s + c.allocatedAmountMinor,
      0
    );
    const proposedTotalMinor = categoryChanges.reduce(
      (s, c) => s + c.proposedMinor,
      0
    );

    return {
      ...aiResult.data,
      currentTotalMinor,
      proposedTotalMinor,
      expectedSavingsMinor: currentTotalMinor - proposedTotalMinor,
      categoryChanges,
      isFallback: false,
    };
  }

  return buildDeterministicBudgetOptimization(input);
}

export function buildDeterministicBudgetOptimization(
  input: OptimizeBudgetRequest
): OptimizeBudgetResponse {
  const lower = input.instruction.toLowerCase();

  // Detect percentage reduction (e.g. "15%") or explicit currency amount (e.g. "20,000" or "20000")
  const percentMatch = lower.match(/(\d+(?:\.\d+)?)\s*%/);
  const amountMatch = lower.replace(/,/g, "").match(/(?:₹|rs\.?|inr|\$|save|by)\s*(\d{3,8})/i);

  const currentTotalMinor = input.categories.reduce(
    (s, c) => s + c.allocatedAmountMinor,
    0
  );

  // Identify protected categories ("without compromising X", "keep X", "increase X")
  const keepUnchanged = lower.includes("unchanged") || lower.includes("same total");
  const boostCategory = input.categories.find(
    (c) =>
      lower.includes(`increase ${c.name.toLowerCase()}`) ||
      lower.includes(`more for ${c.name.toLowerCase()}`)
  );

  const protectedNames = input.categories
    .filter((c) => {
      const n = c.name.toLowerCase();
      return (
        lower.includes(`without compromising ${n}`) ||
        lower.includes(`keep ${n}`) ||
        lower.includes(`protect ${n}`) ||
        input.priorities.some((p) => p.toLowerCase().includes(n))
      );
    })
    .map((c) => c.name.toLowerCase());

  let targetReductionRatio = 0.12; // default 12% optimization
  if (percentMatch) {
    targetReductionRatio = Math.min(0.4, Math.max(0.05, parseFloat(percentMatch[1]) / 100));
  } else if (amountMatch) {
    const requestedSaveMinor = parseInt(amountMatch[1], 10) * 100;
    targetReductionRatio =
      currentTotalMinor > 0
        ? Math.min(0.4, Math.max(0.05, requestedSaveMinor / currentTotalMinor))
        : 0.12;
  }

  const categoryChanges = input.categories.map((cat) => {
    const nameLower = cat.name.toLowerCase();
    const isProtected = protectedNames.includes(nameLower);

    if (boostCategory && cat.id === boostCategory.id) {
      const boostMinor = Math.round(cat.allocatedAmountMinor * 0.15);
      const proposedMinor = cat.allocatedAmountMinor + boostMinor;
      return {
        categoryName: cat.name,
        previousMinor: cat.allocatedAmountMinor,
        proposedMinor,
        deltaMinor: boostMinor,
        rationale: `Increased ${cat.name} allocation by 15% as requested to elevate guest experience.`,
      };
    }

    if (isProtected && !lower.includes(`make ${nameLower} more affordable`)) {
      return {
        categoryName: cat.name,
        previousMinor: cat.allocatedAmountMinor,
        proposedMinor: cat.allocatedAmountMinor,
        deltaMinor: 0,
        rationale: `Protected priority category — allocation preserved at ${formatMinorCurrency(
          cat.allocatedAmountMinor,
          input.currency
        )}.`,
      };
    }

    // Apply targeted reduction while respecting already spent confirmed amount
    const multiplier = nameLower.includes("decor")
      ? targetReductionRatio * 1.35
      : nameLower.includes("ent") || nameLower.includes("inv")
      ? targetReductionRatio * 1.25
      : targetReductionRatio;

    const rawProposed = Math.round(cat.allocatedAmountMinor * (1 - Math.min(0.45, multiplier)));
    const proposedMinor = Math.max(cat.spentMinor, rawProposed);
    const deltaMinor = proposedMinor - cat.allocatedAmountMinor;

    return {
      categoryName: cat.name,
      previousMinor: cat.allocatedAmountMinor,
      proposedMinor,
      deltaMinor,
      rationale:
        deltaMinor < 0
          ? `Streamlined ${cat.name} by ${formatMinorCurrency(
              Math.abs(deltaMinor),
              input.currency
            )} through high-impact focal choices and off-peak vendor packages.`
          : `Maintained to cover confirmed commitments.`,
    };
  });

  // If user requested keeping total budget unchanged while boosting a category, rebalance from flexible categories
  if (keepUnchanged && boostCategory) {
    const currentProposedSum = categoryChanges.reduce((s, c) => s + c.proposedMinor, 0);
    const diff = currentTotalMinor - currentProposedSum;
    if (diff !== 0) {
      const flexIdx = categoryChanges.findIndex(
        (c) =>
          c.categoryName.toLowerCase().includes("contingency") ||
          c.categoryName.toLowerCase().includes("decor")
      );
      if (flexIdx >= 0) {
        categoryChanges[flexIdx].proposedMinor = Math.max(
          0,
          categoryChanges[flexIdx].proposedMinor + diff
        );
        categoryChanges[flexIdx].deltaMinor =
          categoryChanges[flexIdx].proposedMinor - categoryChanges[flexIdx].previousMinor;
      }
    }
  }

  const proposedTotalMinor = categoryChanges.reduce((s, c) => s + c.proposedMinor, 0);
  const expectedSavingsMinor = currentTotalMinor - proposedTotalMinor;

  return {
    isFallback: true,
    summary:
      expectedSavingsMinor > 0
        ? `Optimized budget plan saving ${formatMinorCurrency(
            expectedSavingsMinor,
            input.currency
          )} (${Math.round((expectedSavingsMinor / Math.max(1, currentTotalMinor)) * 100)}%) while safeguarding your priority categories.`
        : `Rebalanced category allocations within your ${formatMinorCurrency(
            proposedTotalMinor,
            input.currency
          )} total budget.`,
    currentTotalMinor,
    proposedTotalMinor,
    expectedSavingsMinor,
    categoryChanges,
    tradeOffs: [
      "Concentrates floral and decor spend on the primary photo backdrop and dining tables rather than full-perimeter draping.",
      "Uses digital RSVP suites and curated playlists/compact acoustic sets to preserve core hospitality quality.",
    ],
    potentialRisks: [
      "Reduced buffer in flexible categories means late add-on requests should be approved carefully.",
    ],
    suggestedActions: [
      "Lock in shortlisted vendor quotes early to avoid last-minute surge pricing.",
      "Review the proposed category changes below and click 'Approve & Apply Budget' to update your plan.",
    ],
  };
}
