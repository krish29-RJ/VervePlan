import { NextRequest, NextResponse } from "next/server";
import { GenerateTimelineRequestSchema } from "@/lib/ai/schemas";
import { generateTimelineProposal } from "@/lib/ai/ideas-and-timeline";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GenerateTimelineRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid timeline generation request",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const proposal = await generateTimelineProposal(parsed.data);
    return NextResponse.json({ proposal }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/ai/generate-timeline] Error:", err);
    return NextResponse.json(
      { error: "Unable to generate timeline proposal." },
      { status: 500 }
    );
  }
}
