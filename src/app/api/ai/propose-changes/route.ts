import { NextRequest, NextResponse } from "next/server";
import { ReplanRequestSchema } from "@/lib/ai/schemas";
import { generateReplanProposal } from "@/lib/ai/replan";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ReplanRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid replanning proposal request",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const proposal = await generateReplanProposal(parsed.data);
    return NextResponse.json(
      {
        proposalId: `prop-${Date.now()}`,
        baseVersion: parsed.data.baseVersion,
        proposal,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/ai/propose-changes] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate replanning proposal." },
      { status: 500 }
    );
  }
}
