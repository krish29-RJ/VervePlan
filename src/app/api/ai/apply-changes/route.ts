import { NextRequest, NextResponse } from "next/server";
import { ApplyChangesRequestSchema } from "@/lib/ai/schemas";

/**
 * Validates and authorizes the application of a previously proposed AI change.
 * Enforces:
 * 1. Schema validation of the proposal payload
 * 2. Optimistic concurrency check (`baseVersion === currentVersion`) to reject stale proposals
 * 3. Mathematical check that category allocations are non-negative and sum within proposedTotalBudgetMinor
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ApplyChangesRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid change proposal payload",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { proposal, currentVersion } = parsed.data;
    const baseVersion = typeof body.baseVersion === "number" ? body.baseVersion : currentVersion;

    if (baseVersion !== currentVersion) {
      return NextResponse.json(
        {
          error:
            "Stale modification proposal: the event was modified after this proposal was generated. Please generate a fresh proposal.",
          code: "STALE_PROPOSAL",
        },
        { status: 409 }
      );
    }

    const sumProposedCategories = proposal.budgetChanges.reduce(
      (sum, c) => sum + Math.max(0, Math.round(c.proposedMinor)),
      0
    );

    if (sumProposedCategories > proposal.proposedTotalBudgetMinor) {
      return NextResponse.json(
        {
          error: `Proposed category allocations (${sumProposedCategories}) exceed the proposed total budget limit (${proposal.proposedTotalBudgetMinor}).`,
          code: "BUDGET_CONSTRAINT_VIOLATION",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        applied: true,
        newVersion: currentVersion + 1,
        appliedAt: new Date().toISOString(),
        verifiedSumMinor: sumProposedCategories,
        proposal,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/ai/apply-changes] Error:", err);
    return NextResponse.json(
      { error: "Failed to validate and apply changes." },
      { status: 500 }
    );
  }
}
