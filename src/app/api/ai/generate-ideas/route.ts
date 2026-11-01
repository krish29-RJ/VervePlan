import { NextRequest, NextResponse } from "next/server";
import { GenerateIdeasRequestSchema } from "@/lib/ai/schemas";
import { generateCreativeIdeas } from "@/lib/ai/ideas-and-timeline";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GenerateIdeasRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid theme/idea generation request",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const ideas = await generateCreativeIdeas(parsed.data);
    return NextResponse.json({ ideas }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/ai/generate-ideas] Error:", err);
    return NextResponse.json(
      { error: "Unable to generate theme ideas." },
      { status: 500 }
    );
  }
}
