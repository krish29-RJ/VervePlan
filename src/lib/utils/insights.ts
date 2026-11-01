import { FullEventBundle } from "@/types/event";
import {
  calculateBudgetSummary,
  calculateGuestMetrics,
  calculateTaskMetrics,
  calculateVendorMetrics,
  daysUntilDate,
  formatMinorCurrency,
} from "@/lib/utils/currency";

export interface SmartInsightCard {
  id: string;
  severity: "warning" | "info" | "success" | "action";
  title: string;
  description: string;
  category: "Budget" | "Timeline" | "Vendors" | "Guests";
  actionLabel?: string;
  actionHref?: string;
}

/**
 * Generates deterministic, data-grounded smart insights from current event state.
 */
export function generateDeterministicInsights(bundle: FullEventBundle): SmartInsightCard[] {
  const { event, budgetCategories, expenses, tasks, vendors, guests } = bundle;
  const insights: SmartInsightCard[] = [];

  const budgetMetrics = calculateBudgetSummary(
    event.totalBudgetMinor,
    budgetCategories,
    expenses
  );
  const taskMetrics = calculateTaskMetrics(tasks);
  const vendorMetrics = calculateVendorMetrics(vendors);
  const guestMetrics = calculateGuestMetrics(guests);
  const daysLeft = daysUntilDate(event.eventDate);

  // 1. Over-budget categories warning
  if (budgetMetrics.overBudgetCategories.length > 0) {
    const first = budgetMetrics.overBudgetCategories[0];
    insights.push({
      id: "insight-over-category",
      severity: "warning",
      category: "Budget",
      title: `${first.name} exceeds planned allocation`,
      description: `Confirmed expenses in ${first.name} exceed your allocation by ${formatMinorCurrency(
        first.excessMinor,
        event.currency
      )}. Consider rebalancing from Contingency or optimizing vendor quotes.`,
      actionLabel: "Optimize Budget",
      actionHref: `/events/${event.id}/budget`,
    });
  }

  // 2. Catering per-guest check
  const cateringCat = budgetCategories.find((c) =>
    c.name.toLowerCase().includes("cater") || c.name.toLowerCase().includes("food")
  );
  if (cateringCat && event.guestTarget > 0) {
    const perGuestMinor = Math.round(cateringCat.allocatedAmountMinor / event.guestTarget);
    const minRecommendedMinor = event.currency === "INR" ? 45000 : 1800; // ₹450 or $18 per guest
    if (perGuestMinor < minRecommendedMinor) {
      insights.push({
        id: "insight-catering-per-head",
        severity: "warning",
        category: "Budget",
        title: "Catering allocation is tight for your guest count",
        description: `Your catering budget works out to ${formatMinorCurrency(
          perGuestMinor,
          event.currency
        )} per guest across ${event.guestTarget} guests. Ask AI Copilot to rebalance your budget for ${event.guestTarget} guests.`,
        actionLabel: "Ask Copilot to Rebalance",
        actionHref: `/events/${event.id}/copilot`,
      });
    }
  }

  // 3. Approaching event + high-priority tasks remaining
  if (taskMetrics.highPriorityRemaining.length > 0) {
    insights.push({
      id: "insight-high-priority-tasks",
      severity: daysLeft <= 21 ? "warning" : "action",
      category: "Timeline",
      title: `${taskMetrics.highPriorityRemaining.length} high-priority ${
        taskMetrics.highPriorityRemaining.length === 1 ? "task remains" : "tasks remain"
      }`,
      description:
        daysLeft > 0
          ? `Your celebration is in ${daysLeft} days. Next up: "${taskMetrics.highPriorityRemaining[0].title}".`
          : `Prioritize completing "${taskMetrics.highPriorityRemaining[0].title}" to keep preparations on schedule.`,
      actionLabel: "Review Timeline",
      actionHref: `/events/${event.id}/timeline`,
    });
  }

  // 4. Missing key vendor confirmations (e.g., Photographer or Caterer)
  const hasBookedPhoto = vendors.some(
    (v) =>
      (v.category.toLowerCase().includes("photo") ||
        v.category.toLowerCase().includes("video")) &&
      v.bookingStatus === "Booked"
  );
  if (!hasBookedPhoto) {
    insights.push({
      id: "insight-unbooked-photo",
      severity: "info",
      category: "Vendors",
      title: "You have not confirmed a photographer yet",
      description:
        "Photography & videography specialists book out early for peak dates. Shortlist and lock in a quote soon.",
      actionLabel: "Manage Vendors",
      actionHref: `/events/${event.id}/vendors`,
    });
  }

  // 5. Guest RSVP & capacity tracking
  if (guestMetrics.confirmedHeadcount > event.guestTarget) {
    insights.push({
      id: "insight-guest-overflow",
      severity: "warning",
      category: "Guests",
      title: `Confirmed guests (${guestMetrics.confirmedHeadcount}) exceed target (${event.guestTarget})`,
      description:
        "Use the AI Replanning Engine to synchronize your catering, seating, and budget for the higher headcount.",
      actionLabel: "Replan for Headcount",
      actionHref: `/events/${event.id}/copilot`,
    });
  } else if (guestMetrics.pendingHeadcount > 0) {
    insights.push({
      id: "insight-pending-rsvps",
      severity: "info",
      category: "Guests",
      title: `${guestMetrics.pendingHeadcount} guest RSVPs still pending`,
      description: `${guestMetrics.confirmedHeadcount} guests confirmed so far. Follow up with pending invitees before finalizing catering counts.`,
      actionLabel: "View Guest List",
      actionHref: `/events/${event.id}/guests`,
    });
  }

  // 6. Healthy budget buffer confirmation
  if (
    !budgetMetrics.isOverAllocated &&
    !budgetMetrics.isOverSpent &&
    vendorMetrics.bookedCount > 0
  ) {
    insights.push({
      id: "insight-budget-healthy",
      severity: "success",
      category: "Budget",
      title: "Budget allocations are balanced within limit",
      description: `${formatMinorCurrency(
        budgetMetrics.remainingFromTotalMinor,
        event.currency
      )} remains available after confirmed expenses.`,
      actionLabel: "View Breakdown",
      actionHref: `/events/${event.id}/budget`,
    });
  }

  return insights.slice(0, 4);
}
