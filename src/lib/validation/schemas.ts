import { z } from "zod";

export const EventTypeSchema = z.enum([
  "Wedding",
  "Birthday",
  "Anniversary",
  "Engagement",
  "Corporate Event",
  "College Festival",
  "Community Celebration",
  "Cultural / Religious Festival",
  "Baby Shower",
  "Custom Event",
]);

export const CurrencyCodeSchema = z.enum(["INR", "USD", "EUR", "GBP"]);

export const IndoorOutdoorSchema = z.enum(["Indoor", "Outdoor", "Hybrid"]);

export const EventPreferencesSchema = z.object({
  atmosphere: z.string().min(2).max(300).default("Warm, welcoming, and celebratory"),
  venuePreference: z.string().min(2).max(200).default("Flexible venue"),
  indoorOutdoor: IndoorOutdoorSchema.default("Hybrid"),
  duration: z.string().min(1).max(100).default("5 hours"),
  colorPalette: z.array(z.string()).default(["#7456E8", "#FF8075", "#F4C56A", "#241D39"]),
  foodPreferences: z.string().max(400).default("Multi-cuisine curated buffet"),
  dietaryRequirements: z.string().max(300).default("Vegetarian options"),
  entertainmentPreferences: z.string().max(300).default("Live music and curated playlist"),
  accessibilityRequirements: z.string().max(300).default("Step-free entry and elder seating"),
  traditions: z.string().max(400).default(""),
  priorities: z.array(z.string()).default(["Catering", "Guest Experience", "Decorations"]),
  avoid: z.array(z.string()).default([]),
});

export const CreateEventInputSchema = z.object({
  title: z.string().min(3, "Event title must be at least 3 characters").max(120),
  eventType: EventTypeSchema,
  description: z.string().max(1000).default(""),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Valid YYYY-MM-DD date required"),
  location: z.string().min(2, "City or venue location is required").max(160),
  guestTarget: z.number().int().min(1, "At least 1 guest required").max(50000),
  totalBudgetMinor: z
    .number()
    .int()
    .min(10000, "Minimum budget required")
    .max(100000000000, "Total budget exceeds maximum allowed scale"),
  currency: CurrencyCodeSchema.default("INR"),
  theme: z.string().min(2).max(120).default("Sunset Garden"),
  preferences: EventPreferencesSchema,
});

export const BudgetCategoryInputSchema = z.object({
  name: z.string().min(2).max(80),
  allocatedAmountMinor: z.number().int().min(0),
  estimatedAmountMinor: z.number().int().min(0).optional(),
  notes: z.string().max(300).optional(),
  isCustom: z.boolean().optional(),
});

export const ExpenseInputSchema = z.object({
  categoryId: z.string().min(1),
  vendorId: z.string().nullable().optional(),
  title: z.string().min(2).max(120),
  amountMinor: z.number().int().min(1, "Expense amount must be greater than 0"),
  costType: z.enum(["ai_estimate", "quote", "confirmed"]).default("confirmed"),
  paymentStatus: z.enum(["Pending", "Deposit Paid", "Paid", "Cancelled"]).default("Pending"),
});

export const VendorInputSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(80),
  contactName: z.string().max(100).default(""),
  phone: z.string().max(40).default(""),
  email: z.string().max(120).default(""),
  website: z.string().max(200).default(""),
  quotedAmountMinor: z.number().int().min(0).default(0),
  bookingStatus: z
    .enum([
      "Not Contacted",
      "Contacted",
      "Quote Received",
      "Shortlisted",
      "Booked",
      "Cancelled",
    ])
    .default("Not Contacted"),
  paymentStatus: z
    .enum(["Unpaid", "Deposit Paid", "Partially Paid", "Paid in Full", "Refunded"])
    .default("Unpaid"),
  priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
  deadline: z.string().default(""),
  notes: z.string().max(500).default(""),
  isSample: z.boolean().default(false),
});

export const TaskInputSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(500).default(""),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Valid YYYY-MM-DD date required"),
  priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
  status: z.enum(["Todo", "In Progress", "Completed"]).default("Todo"),
  category: z.string().min(2).max(80).default("General"),
  phase: z
    .enum(["Early Planning", "Vendor & Design", "Final Countdown", "Event Day"])
    .default("Vendor & Design"),
});

export const GuestInputSchema = z.object({
  name: z.string().min(2).max(120),
  contact: z.string().max(120).default(""),
  guestGroup: z.enum(["Family", "Friends", "Colleagues", "VIP", "Custom"]).default("Friends"),
  rsvpStatus: z
    .enum(["Invited", "Confirmed", "Declined", "Maybe", "Not Responded"])
    .default("Invited"),
  dietaryPreferences: z.string().max(160).default("None"),
  plusOnes: z.number().int().min(0).max(20).default(0),
  accessibilityNotes: z.string().max(200).default(""),
});
