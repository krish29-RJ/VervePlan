import {
  BudgetCategoryRecord,
  CurrencyCode,
  ExpenseRecord,
  GuestRecord,
  TaskRecord,
  VendorRecord,
} from "@/types/event";

/**
 * Returns a consistent YYYY-MM-DD date string for today.
 */
export function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns a YYYY-MM-DD date string N days ahead of today (or referenceDateIso).
 */
export function getFutureDateIso(daysAhead: number, referenceDateIso?: string): string {
  const base = referenceDateIso || getTodayIso();
  const [y, m, d] = base.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + daysAhead);
  return dt.toISOString().slice(0, 10);
}

/**
 * Converts a major currency unit (e.g., ₹75,000) to integer minor units (e.g., 7500000 paise/cents).
 * Uses Math.round to prevent floating-point drift.
 */
export function toMinorUnits(majorAmount: number): number {
  if (!Number.isFinite(majorAmount) || majorAmount < 0) return 0;
  return Math.round(majorAmount * 100);
}

/**
 * Converts integer minor units (paise/cents) to major currency units.
 */
export function fromMinorUnits(minorAmount: number): number {
  if (!Number.isFinite(minorAmount)) return 0;
  return Math.round(minorAmount) / 100;
}

/**
 * Formats integer minor currency units into localized currency string (e.g. ₹75,000 or $1,200).
 */
export function formatMinorCurrency(
  minorAmount: number,
  currency: CurrencyCode = "INR",
  includeDecimals = false
): string {
  const major = fromMinorUnits(minorAmount);
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(major);
}

export interface BudgetSummaryMetrics {
  totalBudgetMinor: number;
  totalAllocatedMinor: number;
  totalEstimatedMinor: number;
  confirmedSpendMinor: number;
  quotedSpendMinor: number;
  aiEstimatedExpenseMinor: number;
  remainingFromTotalMinor: number;
  unallocatedMinor: number;
  allocationPercent: number;
  confirmedPercent: number;
  isOverAllocated: boolean;
  isOverSpent: boolean;
  overBudgetCategories: {
    categoryId: string;
    name: string;
    allocatedMinor: number;
    spentMinor: number;
    excessMinor: number;
  }[];
}

/**
 * Deterministically computes complete budget metrics in integer minor units.
 */
export function calculateBudgetSummary(
  totalBudgetMinor: number,
  categories: BudgetCategoryRecord[],
  expenses: ExpenseRecord[]
): BudgetSummaryMetrics {
  const safeTotal = Math.max(0, Math.round(totalBudgetMinor));

  const totalAllocatedMinor = categories.reduce(
    (sum, c) => sum + Math.max(0, Math.round(c.allocatedAmountMinor)),
    0
  );
  const totalEstimatedMinor = categories.reduce(
    (sum, c) => sum + Math.max(0, Math.round(c.estimatedAmountMinor)),
    0
  );

  const activeExpenses = expenses.filter((e) => e.paymentStatus !== "Cancelled");

  const confirmedSpendMinor = activeExpenses
    .filter((e) => e.costType === "confirmed")
    .reduce((sum, e) => sum + Math.round(e.amountMinor), 0);

  const quotedSpendMinor = activeExpenses
    .filter((e) => e.costType === "quote")
    .reduce((sum, e) => sum + Math.round(e.amountMinor), 0);

  const aiEstimatedExpenseMinor = activeExpenses
    .filter((e) => e.costType === "ai_estimate")
    .reduce((sum, e) => sum + Math.round(e.amountMinor), 0);

  const remainingFromTotalMinor = safeTotal - confirmedSpendMinor;
  const unallocatedMinor = safeTotal - totalAllocatedMinor;

  const allocationPercent =
    safeTotal > 0 ? Math.round((totalAllocatedMinor / safeTotal) * 1000) / 10 : 0;
  const confirmedPercent =
    safeTotal > 0 ? Math.round((confirmedSpendMinor / safeTotal) * 1000) / 10 : 0;

  const overBudgetCategories = categories
    .map((cat) => {
      const catSpend = activeExpenses
        .filter((e) => e.categoryId === cat.id && e.costType === "confirmed")
        .reduce((s, e) => s + Math.round(e.amountMinor), 0);
      return {
        categoryId: cat.id,
        name: cat.name,
        allocatedMinor: cat.allocatedAmountMinor,
        spentMinor: catSpend,
        excessMinor: catSpend - cat.allocatedAmountMinor,
      };
    })
    .filter((item) => item.excessMinor > 0);

  return {
    totalBudgetMinor: safeTotal,
    totalAllocatedMinor,
    totalEstimatedMinor,
    confirmedSpendMinor,
    quotedSpendMinor,
    aiEstimatedExpenseMinor,
    remainingFromTotalMinor,
    unallocatedMinor,
    allocationPercent,
    confirmedPercent,
    isOverAllocated: totalAllocatedMinor > safeTotal,
    isOverSpent: confirmedSpendMinor > safeTotal,
    overBudgetCategories,
  };
}

/**
 * Normalizes category allocations so their integer minor units sum to the exact target totalMinor.
 * Adjusts the Contingency or largest category by the rounding remainder to guarantee exact equality.
 */
export function normalizeAllocationsToTotal(
  items: { name: string; weightPercent: number }[],
  totalBudgetMinor: number
): { name: string; allocatedAmountMinor: number }[] {
  const safeTotal = Math.max(0, Math.round(totalBudgetMinor));
  const totalWeight = items.reduce((s, i) => s + Math.max(0, i.weightPercent), 0) || 100;

  const result = items.map((item) => ({
    name: item.name,
    allocatedAmountMinor: Math.round((safeTotal * Math.max(0, item.weightPercent)) / totalWeight),
  }));

  const currentSum = result.reduce((s, r) => s + r.allocatedAmountMinor, 0);
  const diff = safeTotal - currentSum;

  if (diff !== 0 && result.length > 0) {
    const contingencyIdx = result.findIndex(
      (r) => r.name.toLowerCase().includes("contingency") || r.name.toLowerCase().includes("misc")
    );
    const targetIdx = contingencyIdx >= 0 ? contingencyIdx : result.length - 1;
    result[targetIdx].allocatedAmountMinor = Math.max(
      0,
      result[targetIdx].allocatedAmountMinor + diff
    );
  }

  return result;
}

export interface TaskProgressMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  completionPercent: number;
  overdueTasks: TaskRecord[];
  highPriorityRemaining: TaskRecord[];
}

export function calculateTaskMetrics(
  tasks: TaskRecord[],
  referenceDateIso?: string
): TaskProgressMetrics {
  const today = referenceDateIso ? referenceDateIso.slice(0, 10) : getTodayIso();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const todoTasks = tasks.filter((t) => t.status === "Todo").length;
  const completionPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const overdueTasks = tasks.filter(
    (t) => t.status !== "Completed" && t.dueDate < today
  );

  const highPriorityRemaining = tasks.filter(
    (t) => t.status !== "Completed" && t.priority === "High"
  );

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    completionPercent,
    overdueTasks,
    highPriorityRemaining,
  };
}

export interface GuestSummaryMetrics {
  totalListedEntries: number;
  totalHeadcount: number;
  confirmedHeadcount: number;
  pendingHeadcount: number;
  declinedHeadcount: number;
  maybeHeadcount: number;
  dietaryBreakdown: Record<string, number>;
  groupBreakdown: Record<string, number>;
}

export function calculateGuestMetrics(guests: GuestRecord[]): GuestSummaryMetrics {
  let totalHeadcount = 0;
  let confirmedHeadcount = 0;
  let pendingHeadcount = 0;
  let declinedHeadcount = 0;
  let maybeHeadcount = 0;
  const dietaryBreakdown: Record<string, number> = {};
  const groupBreakdown: Record<string, number> = {};

  for (const g of guests) {
    const partySize = 1 + Math.max(0, g.plusOnes || 0);
    totalHeadcount += partySize;

    if (g.rsvpStatus === "Confirmed") {
      confirmedHeadcount += partySize;
    } else if (g.rsvpStatus === "Declined") {
      declinedHeadcount += partySize;
    } else if (g.rsvpStatus === "Maybe") {
      maybeHeadcount += partySize;
    } else {
      pendingHeadcount += partySize;
    }

    const diet = (g.dietaryPreferences || "Standard").trim() || "Standard";
    if (g.rsvpStatus !== "Declined") {
      dietaryBreakdown[diet] = (dietaryBreakdown[diet] || 0) + partySize;
    }

    groupBreakdown[g.guestGroup] = (groupBreakdown[g.guestGroup] || 0) + partySize;
  }

  return {
    totalListedEntries: guests.length,
    totalHeadcount,
    confirmedHeadcount,
    pendingHeadcount,
    declinedHeadcount,
    maybeHeadcount,
    dietaryBreakdown,
    groupBreakdown,
  };
}

export function calculateVendorMetrics(vendors: VendorRecord[]) {
  const activeVendors = vendors.filter((v) => v.bookingStatus !== "Cancelled");
  const bookedVendors = activeVendors.filter((v) => v.bookingStatus === "Booked");
  const shortlistedVendors = activeVendors.filter(
    (v) => v.bookingStatus === "Shortlisted" || v.bookingStatus === "Quote Received"
  );
  const totalBookedValueMinor = bookedVendors.reduce(
    (sum, v) => sum + Math.round(v.quotedAmountMinor),
    0
  );
  const totalQuotedValueMinor = activeVendors.reduce(
    (sum, v) => sum + Math.round(v.quotedAmountMinor),
    0
  );

  return {
    totalVendors: activeVendors.length,
    bookedCount: bookedVendors.length,
    shortlistedCount: shortlistedVendors.length,
    totalBookedValueMinor,
    totalQuotedValueMinor,
  };
}

/**
 * Computes a task due date relative to an event date, clamped so it never silently lands in the past
 * unless the event itself is today or in the past.
 */
export function computeRelativeDueDate(
  eventDateIso: string,
  daysBeforeEvent: number,
  todayIso?: string
): string {
  const todayStr = (todayIso || getTodayIso()).slice(0, 10);
  const eventStr = eventDateIso.slice(0, 10);

  const [ty, tm, td] = todayStr.split("-").map(Number);
  const [ey, em, ed] = eventStr.split("-").map(Number);

  const today = new Date(Date.UTC(ty, (tm || 1) - 1, td || 1));
  const eventDate = new Date(Date.UTC(ey, (em || 1) - 1, ed || 1));
  const target = new Date(eventDate);
  target.setUTCDate(target.getUTCDate() - Math.max(0, daysBeforeEvent));

  if (target < today && eventDate >= today) {
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return (tomorrow <= eventDate ? tomorrow : eventDate).toISOString().slice(0, 10);
  }

  return target.toISOString().slice(0, 10);
}

export function daysUntilDate(eventDateIso: string, todayIso?: string): number {
  const todayStr = (todayIso || getTodayIso()).slice(0, 10);
  const eventStr = eventDateIso.slice(0, 10);

  const [ty, tm, td] = todayStr.split("-").map(Number);
  const [ey, em, ed] = eventStr.split("-").map(Number);

  const today = Date.UTC(ty, (tm || 1) - 1, td || 1);
  const target = Date.UTC(ey, (em || 1) - 1, ed || 1);
  const diffMs = target - today;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
