import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processCopilotMessage } from "@/lib/ai/ideas-and-timeline";

const ChatRequestSchema = z.object({
  eventId: z.string(),
  message: z.string().min(1).max(800),
  baseVersion: z.number().int().default(1),
  context: z.object({
    title: z.string(),
    eventType: z.string(),
    eventDate: z.string(),
    location: z.string(),
    guestTarget: z.number().int().min(1),
    totalBudgetMinor: z.number().int().min(0),
    confirmedSpendMinor: z.number().int().min(0),
    remainingBudgetMinor: z.number().int(),
    currency: z.enum(["INR", "USD", "EUR", "GBP"]).default("INR"),
    theme: z.string(),
    priorities: z.array(z.string()).default([]),
    categories: z.array(
      z.object({
        name: z.string(),
        allocatedAmountMinor: z.number().int().min(0),
      })
    ),
    tasks: z.array(
      z.object({
        title: z.string(),
        dueDate: z.string(),
        priority: z.string(),
        status: z.string(),
      })
    ),
    vendors: z.array(
      z.object({
        name: z.string(),
        category: z.string(),
        bookingStatus: z.string(),
        quotedAmountMinor: z.number().int().min(0),
      })
    ),
    confirmedGuests: z.number().int().default(0),
    pendingGuests: z.number().int().default(0),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid chat request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await processCopilotMessage(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[POST /api/ai/chat] Error:", err);
    return NextResponse.json(
      { error: "Failed to process AI Copilot message." },
      { status: 500 }
    );
  }
}
