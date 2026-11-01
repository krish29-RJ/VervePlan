import { z } from "zod";
import { CreateEventInputSchema, CurrencyCodeSchema } from "@/lib/validation/schemas";

export const GeneratedPlanResponseSchema = z.object({
  overview: z.object({
    title: z.string(),
    description: z.string(),
    concept: z.string(),
    atmosphere: z.string(),
    highlights: z.array(z.string()),
  }),
  theme: z.object({
    primaryTheme: z.object({
      name: z.string(),
      description: z.string(),
      tagline: z.string(),
      colors: z.array(
        z.object({
          name: z.string(),
          hex: z.string(),
          role: z.string(),
        })
      ),
      decorSuggestions: z.array(z.string()),
      lightingSuggestions: z.array(z.string()),
      seatingSetup: z.string(),
      photoConcepts: z.array(z.string()),
      foodPresentation: z.string(),
      creativeTouches: z.array(z.string()),
      estimatedBudgetImpact: z.string(),
      implementationTips: z.array(z.string()),
    }),
    alternativeThemes: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        colors: z.array(z.object({ name: z.string(), hex: z.string() })),
        vibe: z.string(),
      })
    ),
  }),
  budgetAllocations: z.array(
    z.object({
      name: z.string(),
      allocatedAmountMinor: z.number().int().min(0),
      estimatedAmountMinor: z.number().int().min(0),
      notes: z.string(),
    })
  ),
  itinerary: z.array(
    z.object({
      id: z.string(),
      time: z.string(),
      title: z.string(),
      durationMinutes: z.number().int().min(5),
      category: z.string(),
      notes: z.string(),
    })
  ),
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      daysBeforeEvent: z.number().int().min(0),
      priority: z.enum(["High", "Medium", "Low"]),
      category: z.string(),
      phase: z.enum(["Early Planning", "Vendor & Design", "Final Countdown", "Event Day"]),
    })
  ),
  vendorRequirements: z.array(
    z.object({
      category: z.string(),
      priority: z.enum(["High", "Medium", "Low"]),
      estimatedMinMinor: z.number().int().min(0),
      estimatedMaxMinor: z.number().int().min(0),
      bookingDeadlineDaysBefore: z.number().int().min(0),
      questionsToAsk: z.array(z.string()),
      contractConsiderations: z.array(z.string()),
    })
  ),
  guestExperience: z.object({
    arrivalExperience: z.string(),
    seatingConsiderations: z.string(),
    foodAndBeverages: z.string(),
    entertainment: z.string(),
    accessibilityConsiderations: z.string(),
    specialActivities: z.array(z.string()),
  }),
  risks: z.array(
    z.object({
      id: z.string(),
      category: z.enum([
        "Weather",
        "Vendor Cancellation",
        "Schedule Overrun",
        "Budget Overrun",
        "Guest Count Fluctuation",
      ]),
      risk: z.string(),
      likelihood: z.enum(["Low", "Medium", "High"]),
      mitigation: z.string(),
    })
  ),
  assumptions: z.array(z.string()),
});

export const OptimizeBudgetRequestSchema = z.object({
  eventId: z.string(),
  instruction: z.string().min(3).max(500),
  eventTitle: z.string(),
  eventType: z.string(),
  guestCount: z.number().int().min(1),
  currency: CurrencyCodeSchema.default("INR"),
  currentTotalBudgetMinor: z.number().int().min(0),
  categories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      allocatedAmountMinor: z.number().int().min(0),
      spentMinor: z.number().int().min(0).default(0),
    })
  ),
  priorities: z.array(z.string()).default([]),
});

export const OptimizeBudgetResponseSchema = z.object({
  summary: z.string(),
  currentTotalMinor: z.number().int().min(0),
  proposedTotalMinor: z.number().int().min(0),
  expectedSavingsMinor: z.number().int(),
  categoryChanges: z.array(
    z.object({
      categoryName: z.string(),
      previousMinor: z.number().int().min(0),
      proposedMinor: z.number().int().min(0),
      deltaMinor: z.number().int(),
      rationale: z.string(),
    })
  ),
  tradeOffs: z.array(z.string()),
  potentialRisks: z.array(z.string()),
  suggestedActions: z.array(z.string()),
  isFallback: z.boolean().default(false),
});

export const ReplanRequestSchema = z.object({
  eventId: z.string(),
  instruction: z.string().min(3).max(800),
  baseVersion: z.number().int().default(1),
  context: z.object({
    title: z.string(),
    eventType: z.string(),
    eventDate: z.string(),
    location: z.string(),
    guestTarget: z.number().int().min(1),
    totalBudgetMinor: z.number().int().min(0),
    currency: CurrencyCodeSchema.default("INR"),
    theme: z.string(),
    priorities: z.array(z.string()).default([]),
    categories: z.array(
      z.object({
        name: z.string(),
        allocatedAmountMinor: z.number().int().min(0),
      })
    ),
    tasksCount: z.number().int().default(0),
    vendorsCount: z.number().int().default(0),
  }),
});

export const ReplanProposalSchema = z.object({
  summary: z.string(),
  feasible: z.boolean(),
  infeasibilityReason: z.string().optional(),
  alternativeSuggestion: z.string().optional(),
  previousGuestTarget: z.number().int().min(1),
  proposedGuestTarget: z.number().int().min(1),
  previousTotalBudgetMinor: z.number().int().min(0),
  proposedTotalBudgetMinor: z.number().int().min(0),
  proposedAllocatedSumMinor: z.number().int().min(0),
  budgetChanges: z.array(
    z.object({
      categoryName: z.string(),
      previousMinor: z.number().int().min(0),
      proposedMinor: z.number().int().min(0),
      deltaMinor: z.number().int(),
      reason: z.string(),
    })
  ),
  taskChanges: z.array(
    z.object({
      action: z.enum(["add", "update"]),
      taskId: z.string().optional(),
      title: z.string(),
      dueDate: z.string(),
      priority: z.enum(["High", "Medium", "Low"]),
      category: z.string(),
      reason: z.string(),
    })
  ),
  vendorImplications: z.array(
    z.object({
      category: z.string(),
      previousGuidance: z.string(),
      newGuidance: z.string(),
      estimatedImpactMinor: z.number().int(),
    })
  ),
  spaceAndSeatingImplications: z.string(),
  cateringImplications: z.string(),
  tradeOffs: z.array(z.string()),
  risks: z.array(z.string()),
  isFallback: z.boolean().default(false),
});

export const GenerateIdeasRequestSchema = z.object({
  eventId: z.string().optional(),
  prompt: z.string().min(3).max(500),
  eventType: z.string().default("Celebration"),
  location: z.string().default("India"),
  budgetMinor: z.number().int().optional(),
  currency: CurrencyCodeSchema.default("INR"),
});

export const GenerateIdeasResponseSchema = z.object({
  themeName: z.string(),
  tagline: z.string(),
  description: z.string(),
  colors: z.array(
    z.object({
      name: z.string(),
      hex: z.string(),
      role: z.string(),
    })
  ),
  decorationIdeas: z.array(z.string()),
  lightingSuggestions: z.array(z.string()),
  seatingAndVenueSetup: z.string(),
  photographyConcepts: z.array(z.string()),
  foodPresentation: z.string(),
  suggestedActivities: z.array(z.string()),
  estimatedBudgetImpact: z.string(),
  implementationTips: z.array(z.string()),
  isFallback: z.boolean().default(false),
});

export const GenerateTimelineRequestSchema = z.object({
  eventId: z.string().optional(),
  instruction: z.string().min(3).max(500),
  eventDate: z.string(),
  eventType: z.string(),
  currentTasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      dueDate: z.string(),
      priority: z.enum(["High", "Medium", "Low"]),
      status: z.enum(["Todo", "In Progress", "Completed"]),
      category: z.string(),
    })
  ),
});

export const GenerateTimelineResponseSchema = z.object({
  summary: z.string(),
  proposedTasks: z.array(
    z.object({
      action: z.enum(["update", "add"]),
      id: z.string().optional(),
      title: z.string(),
      description: z.string(),
      previousDueDate: z.string().optional(),
      proposedDueDate: z.string(),
      priority: z.enum(["High", "Medium", "Low"]),
      category: z.string(),
      phase: z.enum(["Early Planning", "Vendor & Design", "Final Countdown", "Event Day"]),
      reason: z.string(),
    })
  ),
  isFallback: z.boolean().default(false),
});

export const ApplyChangesRequestSchema = z.object({
  eventId: z.string(),
  proposalId: z.string(),
  currentVersion: z.number().int(),
  proposal: ReplanProposalSchema,
});

export { CreateEventInputSchema };
