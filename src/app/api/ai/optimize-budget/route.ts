import { NextRequest, NextResponse } from "next/server";
import { OptimizeBudgetRequestSchema } from "@/lib/ai/schemas";
import { optimizeEventBudget } from "@/lib/ai/optimize-budget";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = OptimizeBudgetRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid budget optimization request",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const optimization = await optimizeEventBudget(parsed.data);
    return NextResponse.json({ optimization }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/ai/optimize-budget] Error:", err);
    return NextResponse.json(
      { error: "Unable to optimize budget right now." },
      { status: 500 }
    );
  }
}
