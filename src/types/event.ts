export type EventType =
  | "Wedding"
  | "Birthday"
  | "Anniversary"
  | "Engagement"
  | "Corporate Event"
  | "College Festival"
  | "Community Celebration"
  | "Cultural / Religious Festival"
  | "Baby Shower"
  | "Custom Event";

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

export type IndoorOutdoorPreference = "Indoor" | "Outdoor" | "Hybrid";

export interface EventPreferences {
  atmosphere: string;
  venuePreference: string;
  indoorOutdoor: IndoorOutdoorPreference;
  duration: string;
  colorPalette: string[];
  foodPreferences: string;
  dietaryRequirements: string;
  entertainmentPreferences: string;
  accessibilityRequirements: string;
  traditions: string;
  priorities: string[];
  avoid: string[];
}

export interface EventOverviewData {
  title: string;
  description: string;
  concept: string;
  atmosphere: string;
  highlights: string[];
}

export interface ThemeRecommendation {
  primaryTheme: {
    name: string;
    description: string;
    tagline: string;
    colors: { name: string; hex: string; role: string }[];
    decorSuggestions: string[];
    lightingSuggestions: string[];
    seatingSetup: string;
    photoConcepts: string[];
    foodPresentation: string;
    creativeTouches: string[];
    estimatedBudgetImpact: string;
    implementationTips: string[];
  };
  alternativeThemes: {
    name: string;
    description: string;
    colors: { name: string; hex: string }[];
    vibe: string;
  }[];
}

export interface ScheduleSlot {
  id: string;
  time: string;
  title: string;
  durationMinutes: number;
  category: string;
  notes: string;
}

export interface GuestExperiencePlan {
  arrivalExperience: string;
  seatingConsiderations: string;
  foodAndBeverages: string;
  entertainment: string;
  accessibilityConsiderations: string;
  specialActivities: string[];
}

export interface RiskItem {
  id: string;
  category:
    | "Weather"
    | "Vendor Cancellation"
    | "Schedule Overrun"
    | "Budget Overrun"
    | "Guest Count Fluctuation";
  risk: string;
  likelihood: "Low" | "Medium" | "High";
  mitigation: string;
}

export interface VendorRequirementRecommendation {
  category: string;
  priority: "High" | "Medium" | "Low";
  estimatedMinMinor: number;
  estimatedMaxMinor: number;
  bookingDeadlineDaysBefore: number;
  questionsToAsk: string[];
  contractConsiderations: string[];
}

export interface EventPlanRecord {
  id: string;
  eventId: string;
  version: number;
  overview: EventOverviewData;
  theme: ThemeRecommendation;
  itinerary: ScheduleSlot[];
  guestExperience: GuestExperiencePlan;
  vendorRequirements: VendorRequirementRecommendation[];
  risks: RiskItem[];
  assumptions: string[];
  isFallbackGenerated: boolean;
  createdAt: string;
}

export interface BudgetCategoryRecord {
  id: string;
  eventId: string;
  name: string;
  allocatedAmountMinor: number;
  estimatedAmountMinor: number;
  notes: string;
  isCustom: boolean;
}

export type ExpenseCostType = "ai_estimate" | "quote" | "confirmed";
export type ExpensePaymentStatus = "Pending" | "Deposit Paid" | "Paid" | "Cancelled";

export interface ExpenseRecord {
  id: string;
  eventId: string;
  categoryId: string;
  vendorId?: string | null;
  title: string;
  amountMinor: number;
  costType: ExpenseCostType;
  paymentStatus: ExpensePaymentStatus;
  createdAt: string;
}

export type VendorBookingStatus =
  | "Not Contacted"
  | "Contacted"
  | "Quote Received"
  | "Shortlisted"
  | "Booked"
  | "Cancelled";

export type VendorPaymentStatus =
  | "Unpaid"
  | "Deposit Paid"
  | "Partially Paid"
  | "Paid in Full"
  | "Refunded";

export interface VendorRecord {
  id: string;
  eventId: string;
  name: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  quotedAmountMinor: number;
  bookingStatus: VendorBookingStatus;
  paymentStatus: VendorPaymentStatus;
  priority: "High" | "Medium" | "Low";
  deadline: string;
  notes: string;
  isSample: boolean;
}

export type TaskPriority = "High" | "Medium" | "Low";
export type TaskStatus = "Todo" | "In Progress" | "Completed";

export interface TaskRecord {
  id: string;
  eventId: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  phase: "Early Planning" | "Vendor & Design" | "Final Countdown" | "Event Day";
}

export type GuestGroup = "Family" | "Friends" | "Colleagues" | "VIP" | "Custom";
export type RsvpStatus = "Invited" | "Confirmed" | "Declined" | "Maybe" | "Not Responded";

export interface GuestRecord {
  id: string;
  eventId: string;
  name: string;
  contact: string;
  guestGroup: GuestGroup;
  rsvpStatus: RsvpStatus;
  dietaryPreferences: string;
  plusOnes: number;
  accessibilityNotes: string;
}

export interface AIMessageRecord {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  intentType?: "read_only" | "creative" | "modification";
  proposalId?: string;
  isFallback?: boolean;
  createdAt: string;
}

export interface BudgetAllocationDiff {
  categoryName: string;
  previousMinor: number;
  proposedMinor: number;
  deltaMinor: number;
  reason: string;
}

export interface TaskAdjustmentDiff {
  action: "add" | "update";
  taskId?: string;
  title: string;
  dueDate: string;
  priority: TaskPriority;
  category: string;
  reason: string;
}

export interface VendorImplicationDiff {
  category: string;
  previousGuidance: string;
  newGuidance: string;
  estimatedImpactMinor: number;
}

export interface ReplanProposalPayload {
  summary: string;
  feasible: boolean;
  infeasibilityReason?: string;
  alternativeSuggestion?: string;
  previousGuestTarget: number;
  proposedGuestTarget: number;
  previousTotalBudgetMinor: number;
  proposedTotalBudgetMinor: number;
  proposedAllocatedSumMinor: number;
  budgetChanges: BudgetAllocationDiff[];
  taskChanges: TaskAdjustmentDiff[];
  vendorImplications: VendorImplicationDiff[];
  spaceAndSeatingImplications: string;
  cateringImplications: string;
  tradeOffs: string[];
  risks: string[];
  isFallback: boolean;
}

export interface ChangeProposalRecord {
  id: string;
  eventId: string;
  requestedChange: string;
  changes: ReplanProposalPayload;
  status: "pending" | "applied" | "rejected" | "stale";
  baseVersion: number;
  createdAt: string;
  appliedAt?: string;
}

export interface EventRecord {
  id: string;
  ownerId: string;
  title: string;
  eventType: EventType;
  description: string;
  eventDate: string;
  location: string;
  guestTarget: number;
  totalBudgetMinor: number;
  currency: CurrencyCode;
  theme: string;
  preferences: EventPreferences;
  status: "draft" | "planning" | "confirmed" | "completed" | "cancelled";
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface FullEventBundle {
  event: EventRecord;
  plan: EventPlanRecord;
  budgetCategories: BudgetCategoryRecord[];
  expenses: ExpenseRecord[];
  vendors: VendorRecord[];
  tasks: TaskRecord[];
  guests: GuestRecord[];
  messages: AIMessageRecord[];
  proposals: ChangeProposalRecord[];
}
