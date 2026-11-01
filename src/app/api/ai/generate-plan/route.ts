import { NextRequest, NextResponse } from "next/server";
import { CreateEventInputSchema } from "@/lib/ai/schemas";
import { generateEventPlan } from "@/lib/ai/generate-plan";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateEventInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid event configuration input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const plan = await generateEventPlan(parsed.data);
    return NextResponse.json({ plan }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/ai/generate-plan] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate event plan. Please try again." },
      { status: 500 }
    );
  }
}
