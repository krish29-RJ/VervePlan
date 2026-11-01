"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  PlusCircle,
  Calendar,
  MapPin,
  Users,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowRight,
  Wand2,
} from "lucide-react";
import { useUtsav } from "@/context/UtsavContext";
import {
  calculateBudgetSummary,
  calculateTaskMetrics,
  daysUntilDate,
  formatMinorCurrency,
} from "@/lib/utils/currency";

export default function DashboardPage() {
  const { user, bundles, enterDemoMode } = useUtsav();

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-extrabold text-utsav-text">
          Sign in or Launch Demo Mode to view your Command Center
        </h1>
        <p className="text-sm text-utsav-muted">
          Your dashboard is protected. You can sign in with Supabase or enter our explicit local Demo Mode.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => enterDemoMode()}
            className="utsav-btn-primary"
          >
            Enter Demo Mode
          </button>
          <Link href="/login" className="utsav-btn-secondary">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const totalPlannedMinor = bundles.reduce(
    (sum, b) => sum + b.event.totalBudgetMinor,
    0
  );
  const totalGuestsAcrossEvents = bundles.reduce(
    (sum, b) => sum + b.event.guestTarget,
    0
  );
  const allUpcomingTasks = bundles
    .flatMap((b) =>
      b.tasks
        .filter((t) => t.status !== "Completed")
        .map((t) => ({
          ...t,
          eventTitle: b.event.title,
          eventId: b.event.id,
        }))
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);

  return (
    <div className="utsav-container py-6 sm:py-8 space-y-8">
      {/* Personalized Welcome Command Header */}
      <div className="rounded-3xl bg-utsav-gradient p-6 sm:p-8 text-white shadow-glow flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="utsav-badge bg-white/15 text-white">
            <Sparkles className="w-3.5 h-3.5 text-utsav-gold" />
            VervePlan Celebration Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
            Namaste, {user.displayName}
          </h1>
          <p className="text-xs sm:text-sm text-white/90 max-w-2xl font-medium leading-relaxed">
            Manage your active celebrations, monitor minor-unit budgets, track vendor confirmations, or trigger synchronized AI replanning.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/events/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-extrabold text-utsav-deep shadow-lg hover:bg-utsav-bg transition-all hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4 text-utsav-primary" />
            Create New Event
          </Link>
        </div>
      </div>

      {/* Portfolio KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <div className="utsav-card p-4 sm:p-5">
          <span className="text-xs font-bold text-utsav-muted">Active Celebrations</span>
          <p className="utsav-num text-2xl sm:text-3xl font-extrabold text-utsav-text mt-1">
            {bundles.length}
          </p>
          <span className="text-[11px] text-emerald-600 font-bold">
            Synchronized & persisted
          </span>
        </div>

        <div className="utsav-card p-4 sm:p-5">
          <span className="text-xs font-bold text-utsav-muted">
            Combined Budgets
          </span>
          <p className="utsav-num text-2xl sm:text-3xl font-extrabold text-utsav-primary mt-1">
            {formatMinorCurrency(totalPlannedMinor, "INR")}
          </p>
          <span className="text-[11px] text-utsav-muted font-semibold">
            Precision minor-unit math
          </span>
        </div>

        <div className="utsav-card p-4 sm:p-5">
          <span className="text-xs font-bold text-utsav-muted">
            Total Planned Guests
          </span>
          <p className="utsav-num text-2xl sm:text-3xl font-extrabold text-utsav-text mt-1">
            {totalGuestsAcrossEvents.toLocaleString("en-IN")}
          </p>
          <span className="text-[11px] text-utsav-muted font-semibold">
            Across {bundles.length} celebrations
          </span>
        </div>

        <div className="utsav-card p-4 sm:p-5">
          <span className="text-xs font-bold text-utsav-muted">Open Priority Tasks</span>
          <p className="utsav-num text-2xl sm:text-3xl font-extrabold text-utsav-coral mt-1">
            {allUpcomingTasks.length}
          </p>
          <span className="text-[11px] text-utsav-muted font-semibold">
            Relative to event dates
          </span>
        </div>
      </div>

      {/* Event Overview Cards */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-utsav-text">
              Your Celebrations
            </h2>
            <p className="text-xs sm:text-sm text-utsav-muted font-medium">
              Select any celebration to open its Budget, Timeline, Vendors, Guests, and AI Copilot workspace.
            </p>
          </div>
          <Link
            href="/events/new"
            className="text-xs font-extrabold text-utsav-primary hover:underline flex items-center gap-1"
          >
            <PlusCircle className="w-4 h-4" />
            New Celebration
          </Link>
        </div>

        {bundles.length === 0 ? (
          <div className="utsav-card p-12 text-center border-dashed border-2 border-utsav-primary/30 space-y-4">
            <Sparkles className="w-10 h-10 text-utsav-primary mx-auto" />
            <h3 className="text-lg font-extrabold text-utsav-text">
              No celebrations created yet
            </h3>
            <p className="text-sm text-utsav-muted max-w-md mx-auto">
              Tell VervePlan about your dream birthday, wedding, or college festival and get a complete plan in seconds.
            </p>
            <Link href="/events/new" className="utsav-btn-primary">
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle) => {
              const { event, tasks, budgetCategories, expenses } = bundle;
              const taskMetrics = calculateTaskMetrics(tasks);
              const budgetMetrics = calculateBudgetSummary(
                event.totalBudgetMinor,
                budgetCategories,
                expenses
              );
              const daysLeft = daysUntilDate(event.eventDate);

              return (
                <div
                  key={event.id}
                  className="utsav-card utsav-card-interactive flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="utsav-badge bg-utsav-primary/12 text-utsav-primary">
                        {event.eventType}
                      </span>
                      <span className="utsav-badge bg-utsav-gold/30 text-utsav-deep">
                        <Clock className="w-3 h-3" />
                        {daysLeft > 0 ? `${daysLeft}d left` : "Today"}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-utsav-text group-hover:text-utsav-primary transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-xs text-utsav-muted line-clamp-2 mt-1 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    <div className="space-y-2 text-xs text-utsav-muted pt-1">
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-utsav-primary shrink-0" />
                        <span>{event.eventDate}</span>
                      </div>
                      <div className="flex items-center gap-2 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-utsav-coral shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1.5 utsav-num">
                        <span className="inline-flex items-center gap-1.5 font-bold text-utsav-text">
                          <Users className="w-3.5 h-3.5 text-utsav-primary" />
                          {event.guestTarget} Guests
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-extrabold text-utsav-primary">
                          <Wallet className="w-3.5 h-3.5" />
                          {formatMinorCurrency(event.totalBudgetMinor, event.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Planning Progress Bar */}
                    <div className="space-y-1.5 pt-3 border-t border-utsav-primary/10">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-utsav-muted">
                          Checklist ({taskMetrics.completedTasks}/{taskMetrics.totalTasks})
                        </span>
                        <span className="utsav-num font-extrabold text-utsav-text">
                          {taskMetrics.completionPercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-utsav-primary/12 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-utsav-gradient transition-all duration-300"
                          style={{ width: `${taskMetrics.completionPercent}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-utsav-muted utsav-num">
                        Available funds:{" "}
                        <strong className="text-utsav-text font-extrabold">
                          {formatMinorCurrency(
                            budgetMetrics.remainingFromTotalMinor,
                            event.currency
                          )}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-utsav-primary/5 border-t border-utsav-primary/10 flex items-center justify-between">
                    <Link
                      href={`/events/${event.id}/copilot`}
                      className="text-xs font-extrabold text-utsav-deep hover:text-utsav-primary flex items-center gap-1.5"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-utsav-primary" />
                      AI Replan
                    </Link>
                    <Link
                      href={`/events/${event.id}`}
                      className="utsav-btn-primary !py-2 !px-4 !text-xs"
                    >
                      Open Event
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Tasks & AI Suggestions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 utsav-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-extrabold text-utsav-text">
              Upcoming Priority Tasks Across Events
            </h2>
            <span className="text-xs font-semibold text-utsav-muted">
              Sorted by due date
            </span>
          </div>

          {allUpcomingTasks.length === 0 ? (
            <p className="text-xs text-utsav-muted py-4">
              All scheduled tasks are complete!
            </p>
          ) : (
            <div className="divide-y divide-utsav-primary/10">
              {allUpcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-utsav-text">{task.title}</p>
                    <p className="text-utsav-muted font-medium">
                      {task.eventTitle} · {task.category} · Due: {task.dueDate}
                    </p>
                  </div>
                  <Link
                    href={`/events/${task.eventId}/timeline`}
                    className="self-start sm:self-center shrink-0 rounded-xl border border-utsav-primary/25 px-3.5 py-1.5 font-extrabold text-utsav-primary hover:bg-utsav-primary hover:text-white transition-colors"
                  >
                    View Task
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-3xl bg-utsav-gradient p-6 sm:p-7 text-white shadow-glow flex flex-col justify-between space-y-5">
          <div className="space-y-3.5">
            <span className="utsav-badge bg-white/15 text-white">
              <Sparkles className="w-3.5 h-3.5 text-utsav-gold" />
              Proactive Copilot Suggestions
            </span>
            <h3 className="text-xl font-extrabold">
              Test the Flagship Hackathon Scenario
            </h3>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
              Open the <strong>Elegant Garden Birthday (Bengaluru · 50 guests · ₹75,000)</strong> workspace and ask the Copilot:
            </p>
            <div className="rounded-2xl bg-white/12 p-4 text-xs sm:text-sm italic border border-white/20 font-medium">
              &ldquo;Make this suitable for 80 guests while keeping the total budget below ₹90,000.&rdquo;
            </div>
            <ul className="space-y-2 text-xs text-white/95 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-utsav-gold shrink-0" />
                Inspect side-by-side category deltas & trade-offs
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-utsav-gold shrink-0" />
                Approve changes transactionally and watch the dashboard update
              </li>
            </ul>
          </div>

          <Link
            href="/events/demo-garden-birthday/copilot"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 px-4 text-xs sm:text-sm font-extrabold text-utsav-deep hover:bg-utsav-bg transition-colors shadow-lg"
          >
            Launch Replanning Demo Now →
          </Link>
        </div>
      </div>
    </div>
  );
}
