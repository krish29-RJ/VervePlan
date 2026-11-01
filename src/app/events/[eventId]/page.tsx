"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Wallet,
  Users,
  CheckCircle2,
  Store,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Palette,
  Clock,
  ShieldAlert,
  Loader2,
  Edit3,
} from "lucide-react";
import { useUtsav } from "@/context/UtsavContext";
import { EventWorkspaceShell } from "@/components/layout/EventWorkspaceShell";
import {
  calculateBudgetSummary,
  calculateGuestMetrics,
  calculateTaskMetrics,
  calculateVendorMetrics,
  formatMinorCurrency,
} from "@/lib/utils/currency";
import { generateDeterministicInsights } from "@/lib/utils/insights";
import { GenerateIdeasResponse } from "@/lib/ai/ideas-and-timeline";

export default function EventOverviewPage() {
  const params = useParams<{ eventId: string }>();
  const rawId = params?.eventId;
  const eventId = (Array.isArray(rawId) ? rawId[0] : rawId) || "demo-garden-birthday";
  const {
    bundles,
    getEventBundle,
    updateTask,
    applyThemeToEvent,
    updateEventDetails,
  } = useUtsav();

  const [ideaPrompt, setIdeaPrompt] = useState(
    "Suggest an elegant sunset garden theme with warm brass lanterns and acoustic charm"
  );
  const [generatedIdea, setGeneratedIdea] = useState<GenerateIdeasResponse | null>(
    null
  );
  const [loadingIdea, setLoadingIdea] = useState(false);
  const [themeAppliedMessage, setThemeAppliedMessage] = useState<string | null>(
    null
  );
  const [editingHeader, setEditingHeader] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const bundle = getEventBundle(eventId) || bundles[0];

  if (!bundle) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-extrabold text-utsav-text">Event Not Found</h1>
        <p className="text-sm text-utsav-muted">
          We couldn&apos;t locate this celebration in your workspace.
        </p>
        <Link href="/dashboard" className="utsav-btn-primary">
          Back to Command Center
        </Link>
      </div>
    );
  }

  const { event, plan, budgetCategories, expenses, tasks, vendors, guests } = bundle;
  const budgetMetrics = calculateBudgetSummary(
    event.totalBudgetMinor,
    budgetCategories,
    expenses
  );
  const taskMetrics = calculateTaskMetrics(tasks);
  const vendorMetrics = calculateVendorMetrics(vendors);
  const guestMetrics = calculateGuestMetrics(guests);
  const insights = generateDeterministicInsights(bundle);

  async function handleGenerateThemeIdea(e: React.FormEvent) {
    e.preventDefault();
    if (!ideaPrompt.trim() || loadingIdea) return;
    setLoadingIdea(true);
    setThemeAppliedMessage(null);
    try {
      const res = await fetch("/api/ai/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          prompt: ideaPrompt,
          eventType: event.eventType,
          location: event.location,
          budgetMinor: event.totalBudgetMinor,
          currency: event.currency,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ideas) {
        setGeneratedIdea(data.ideas);
      }
    } finally {
      setLoadingIdea(false);
    }
  }

  function handleConfirmApplyTheme() {
    if (!generatedIdea) return;
    applyThemeToEvent(
      event.id,
      generatedIdea.themeName,
      generatedIdea.colors.map((c) => c.hex),
      generatedIdea.description
    );
    setThemeAppliedMessage(
      `Applied "${generatedIdea.themeName}" theme and color swatches to ${event.title}!`
    );
  }

  return (
    <EventWorkspaceShell bundle={bundle}>
      <div className="space-y-8">
        {/* Quick Inline Edit Bar */}
        <div className="utsav-card px-5 py-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="text-xs sm:text-sm text-utsav-muted leading-relaxed">
            <strong className="text-utsav-text font-extrabold">Concept:</strong>{" "}
            {plan.overview.concept}
          </div>
          <button
            type="button"
            onClick={() => {
              setEditTitle(event.title);
              setEditLocation(event.location);
              setEditingHeader(!editingHeader);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-utsav-primary hover:underline shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {editingHeader ? "Cancel Edit" : "Edit Title / Location"}
          </button>
        </div>

        {editingHeader && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateEventDetails(event.id, {
                title: editTitle.trim() || event.title,
                location: editLocation.trim() || event.location,
              });
              setEditingHeader(false);
            }}
            className="utsav-card p-5 border-2 border-utsav-primary/30 flex flex-wrap items-end gap-4 no-print"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-extrabold text-utsav-text mb-1.5">
                Event Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full border px-3.5 py-2 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-extrabold text-utsav-text mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full border px-3.5 py-2 text-sm"
              />
            </div>
            <button type="submit" className="utsav-btn-primary !py-2.5">
              Save Changes
            </button>
          </form>
        )}

        {/* 5 KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <div className="utsav-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-bold text-utsav-muted">
              <span>Total Budget</span>
              <Wallet className="w-4 h-4 text-utsav-primary" />
            </div>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-text mt-1.5">
              {formatMinorCurrency(event.totalBudgetMinor, event.currency)}
            </p>
            <p className="utsav-num text-[11px] text-utsav-muted mt-1 font-medium">
              Allocated:{" "}
              {formatMinorCurrency(budgetMetrics.totalAllocatedMinor, event.currency)}
            </p>
          </div>

          <div className="utsav-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-bold text-utsav-muted">
              <span>Remaining Funds</span>
              <Wallet className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1.5">
              {formatMinorCurrency(budgetMetrics.remainingFromTotalMinor, event.currency)}
            </p>
            <p className="utsav-num text-[11px] text-utsav-muted mt-1 font-medium">
              Confirmed:{" "}
              {formatMinorCurrency(budgetMetrics.confirmedSpendMinor, event.currency)}
            </p>
          </div>

          <div className="utsav-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-bold text-utsav-muted">
              <span>Guest Count</span>
              <Users className="w-4 h-4 text-utsav-primary" />
            </div>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-text mt-1.5">
              {event.guestTarget} Target
            </p>
            <p className="utsav-num text-[11px] text-utsav-muted mt-1 font-medium">
              {guestMetrics.confirmedHeadcount} Confirmed · {guestMetrics.pendingHeadcount} Pending
            </p>
          </div>

          <div className="utsav-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-bold text-utsav-muted">
              <span>Completion</span>
              <CheckCircle2 className="w-4 h-4 text-utsav-primary" />
            </div>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-text mt-1.5">
              {taskMetrics.completionPercent}%
            </p>
            <p className="utsav-num text-[11px] text-utsav-muted mt-1 font-medium">
              {taskMetrics.completedTasks}/{taskMetrics.totalTasks} tasks done
            </p>
          </div>

          <div className="utsav-card p-4 sm:p-5 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-xs font-bold text-utsav-muted">
              <span>Vendor Bookings</span>
              <Store className="w-4 h-4 text-utsav-coral" />
            </div>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-text mt-1.5">
              {vendorMetrics.bookedCount} / {vendorMetrics.totalVendors}
            </p>
            <p className="utsav-num text-[11px] text-utsav-muted mt-1 font-medium">
              {vendorMetrics.shortlistedCount} shortlisted quotes
            </p>
          </div>
        </div>

        {/* SMART INSIGHTS SECTION */}
        <section className="space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold text-utsav-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-utsav-primary" />
              Smart Event Insights & Proactive Alerts
            </h2>
            <span className="text-xs font-semibold text-utsav-muted">
              Verified against live event state
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {insights.map((ins) => (
              <div
                key={ins.id}
                className={`utsav-card p-5 flex flex-col justify-between space-y-3 ${
                  ins.severity === "warning"
                    ? "border-utsav-gold bg-utsav-gold/10"
                    : ins.severity === "success"
                    ? "border-emerald-500/25 bg-emerald-500/6"
                    : "border-utsav-primary/20"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="utsav-badge bg-utsav-primary/12 text-utsav-primary !text-[10px]">
                      {ins.category}
                    </span>
                    {ins.severity === "warning" && (
                      <AlertTriangle className="w-4 h-4 text-utsav-coral" />
                    )}
                  </div>
                  <h3 className="text-sm font-extrabold text-utsav-text">
                    {ins.title}
                  </h3>
                  <p className="text-xs text-utsav-muted leading-relaxed">
                    {ins.description}
                  </p>
                </div>

                {ins.actionHref && (
                  <Link
                    href={ins.actionHref}
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-utsav-primary hover:underline pt-1 no-print"
                  >
                    {ins.actionLabel || "Take Action"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* MAIN SECTIONS GRID: BUDGET BREAKDOWN + UPCOMING TASKS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Budget Breakdown */}
          <div className="lg:col-span-6 utsav-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-utsav-text">
                  Budget Allocation Breakdown
                </h2>
                <p className="text-xs text-utsav-muted font-medium">
                  Illustrative planning allocations in {event.currency}
                </p>
              </div>
              <Link
                href={`/events/${event.id}/budget`}
                className="text-xs font-extrabold text-utsav-primary hover:underline no-print"
              >
                Open Smart Budget →
              </Link>
            </div>

            <div className="space-y-3.5">
              {budgetCategories.map((cat) => {
                const pct =
                  event.totalBudgetMinor > 0
                    ? Math.round(
                        (cat.allocatedAmountMinor / event.totalBudgetMinor) * 100
                      )
                    : 0;
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-utsav-text">{cat.name}</span>
                      <span className="utsav-num font-extrabold text-utsav-text">
                        {formatMinorCurrency(cat.allocatedAmountMinor, event.currency)} (
                        {pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-utsav-primary/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-utsav-gradient transition-all duration-300"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Tasks with Interactive Toggle */}
          <div className="lg:col-span-6 utsav-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-utsav-text">
                  Priority Checklist Tasks
                </h2>
                <p className="text-xs text-utsav-muted font-medium">
                  Tap any checkbox to mark completed immediately
                </p>
              </div>
              <Link
                href={`/events/${event.id}/timeline`}
                className="text-xs font-extrabold text-utsav-primary hover:underline no-print"
              >
                Open Full Timeline →
              </Link>
            </div>

            <div className="divide-y divide-utsav-primary/10">
              {tasks.slice(0, 6).map((t) => {
                const isDone = t.status === "Completed";
                return (
                  <div
                    key={t.id}
                    className="py-3 flex items-start justify-between gap-3 text-xs"
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() =>
                          updateTask(event.id, t.id, {
                            status: isDone ? "Todo" : "Completed",
                          })
                        }
                        className="mt-0.5 h-4 w-4 rounded border-utsav-primary/30 text-utsav-primary focus:ring-utsav-primary"
                      />
                      <div>
                        <p
                          className={`font-bold ${
                            isDone
                              ? "line-through text-utsav-muted"
                              : "text-utsav-text"
                          }`}
                        >
                          {t.title}
                        </p>
                        <p className="text-[11px] text-utsav-muted mt-0.5">
                          Due: {t.dueDate} · {t.category}
                        </p>
                      </div>
                    </label>
                    <span
                      className={`utsav-badge !text-[10px] !px-2.5 !py-0.5 shrink-0 ${
                        t.priority === "High"
                          ? "bg-utsav-coral/20 text-utsav-deep"
                          : t.priority === "Medium"
                          ? "bg-utsav-gold/30 text-utsav-deep"
                          : "bg-utsav-primary/10 text-utsav-muted"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* EVENT-DAY SCHEDULE & RISK CONTINGENCIES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 utsav-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-utsav-text flex items-center gap-2">
                <Clock className="w-4 h-4 text-utsav-primary" />
                Event-Day Run of Show Itinerary
              </h2>
              <span className="text-xs font-semibold text-utsav-muted">
                {event.preferences.duration}
              </span>
            </div>

            <div className="space-y-3">
              {plan.itinerary.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-start gap-3.5 rounded-2xl bg-utsav-primary/5 p-3.5 border border-utsav-primary/12"
                >
                  <div className="utsav-num rounded-xl bg-utsav-gradient text-white px-3 py-1 text-xs font-extrabold shrink-0 shadow-xs">
                    {slot.time}
                  </div>
                  <div className="flex-1 text-xs min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="font-extrabold text-utsav-text">{slot.title}</p>
                      <span className="utsav-num text-[11px] font-bold text-utsav-primary">
                        {slot.durationMinutes} mins · {slot.category}
                      </span>
                    </div>
                    <p className="text-utsav-muted mt-0.5 leading-relaxed">
                      {slot.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 utsav-card p-6 space-y-4">
            <h2 className="text-base font-extrabold text-utsav-text flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-utsav-coral" />
              Risk & Contingency Planning
            </h2>
            <div className="space-y-3">
              {plan.risks.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl bg-utsav-primary/5 p-4 border border-utsav-primary/12 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-utsav-primary">
                      {r.category}
                    </span>
                    <span className="utsav-badge bg-utsav-gold/30 text-utsav-deep !text-[10px]">
                      {r.likelihood} Risk
                    </span>
                  </div>
                  <p className="font-bold text-utsav-text">{r.risk}</p>
                  <p className="text-utsav-muted leading-relaxed">
                    <strong className="text-utsav-text">Mitigation:</strong>{" "}
                    {r.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 13: AI THEME AND CREATIVE IDEA GENERATOR */}
        <section className="utsav-card p-6 sm:p-8 border-2 border-utsav-primary/20 space-y-6 no-print">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="utsav-badge bg-utsav-primary/12 text-utsav-primary">
                <Palette className="w-3.5 h-3.5 text-utsav-coral" />
                AI Theme & Creative Studio
              </span>
              <h2 className="text-xl font-extrabold text-utsav-text mt-2">
                Explore Themes, Color Swatches & Decor Concepts
              </h2>
              <p className="text-xs sm:text-sm text-utsav-muted mt-0.5">
                Active Theme: <strong>{plan.theme.primaryTheme.name}</strong> —{" "}
                {plan.theme.primaryTheme.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {plan.theme.primaryTheme.colors.map((c) => (
                <div
                  key={c.hex}
                  className="flex items-center gap-2 rounded-xl border border-utsav-primary/15 bg-utsav-bg px-3 py-1.5 text-xs"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="font-bold text-utsav-text">{c.name}</span>
                  <span className="font-mono text-[10px] text-utsav-muted">
                    {c.hex}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleGenerateThemeIdea}
            className="flex flex-col sm:flex-row gap-3"
          >
            <label htmlFor="theme-idea-input" className="sr-only">
              Describe your dream theme idea
            </label>
            <input
              id="theme-idea-input"
              type="text"
              value={ideaPrompt}
              onChange={(e) => setIdeaPrompt(e.target.value)}
              placeholder='e.g., "Suggest an elegant sunset garden theme for an engagement party"'
              className="flex-1 border px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={loadingIdea}
              className="utsav-btn-primary !px-6 !py-3"
            >
              {loadingIdea ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Designing Theme...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-utsav-gold" />
                  Generate Theme Concept
                </>
              )}
            </button>
          </form>

          {themeAppliedMessage && (
            <div className="rounded-2xl bg-emerald-500/12 border border-emerald-500/25 p-3.5 text-xs font-extrabold text-emerald-800">
              {themeAppliedMessage}
            </div>
          )}

          {generatedIdea && (
            <div className="rounded-2xl bg-utsav-primary/5 p-5 sm:p-6 border border-utsav-primary/20 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-utsav-text">
                    {generatedIdea.themeName}
                  </h3>
                  <p className="text-xs text-utsav-muted font-medium">
                    {generatedIdea.tagline}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmApplyTheme}
                  className="utsav-btn-primary !py-2.5 !px-4 !text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-utsav-gold" />
                  Apply Theme to Event
                </button>
              </div>

              <p className="text-xs sm:text-sm text-utsav-text leading-relaxed">
                {generatedIdea.description}
              </p>

              {/* Color Swatches */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {generatedIdea.colors.map((swatch) => (
                  <div
                    key={swatch.hex}
                    className="utsav-card p-3.5 flex items-center gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-xl border border-black/10 shrink-0 shadow-xs"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <div className="text-xs min-w-0">
                      <p className="font-extrabold text-utsav-text truncate">
                        {swatch.name}
                      </p>
                      <p className="text-[11px] font-mono text-utsav-primary font-bold">
                        {swatch.hex}
                      </p>
                      <p className="text-[10px] text-utsav-muted truncate">
                        {swatch.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="utsav-card p-4 space-y-1.5">
                  <p className="font-extrabold text-utsav-text">Decor & Lighting</p>
                  <ul className="list-disc list-inside text-utsav-muted space-y-1 leading-relaxed">
                    {generatedIdea.decorationIdeas.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
                <div className="utsav-card p-4 space-y-1.5">
                  <p className="font-extrabold text-utsav-text">
                    Activities & Photography
                  </p>
                  <ul className="list-disc list-inside text-utsav-muted space-y-1 leading-relaxed">
                    {generatedIdea.suggestedActivities.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
                <div className="utsav-card p-4 space-y-1.5">
                  <p className="font-extrabold text-utsav-text">
                    Budget Impact & Implementation
                  </p>
                  <p className="text-utsav-primary font-bold">
                    {generatedIdea.estimatedBudgetImpact}
                  </p>
                  <ul className="list-disc list-inside text-utsav-muted space-y-1 pt-1 leading-relaxed">
                    {generatedIdea.implementationTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </EventWorkspaceShell>
  );
}
