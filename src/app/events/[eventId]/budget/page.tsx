"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Wallet,
  Sparkles,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
  ArrowRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { useUtsav } from "@/context/UtsavContext";
import { EventWorkspaceShell } from "@/components/layout/EventWorkspaceShell";
import {
  calculateBudgetSummary,
  formatMinorCurrency,
  fromMinorUnits,
  toMinorUnits,
} from "@/lib/utils/currency";
import { ExpenseCostType, ExpensePaymentStatus } from "@/types/event";
import { OptimizeBudgetResponse } from "@/lib/ai/optimize-budget";

const CHART_COLORS = [
  "#7456E8",
  "#FF8075",
  "#F4C56A",
  "#4934A6",
  "#10B981",
  "#6366F1",
  "#EC4899",
  "#8B5CF6",
];

export default function SmartBudgetPage() {
  const params = useParams<{ eventId: string }>();
  const rawId = params?.eventId;
  const eventId = (Array.isArray(rawId) ? rawId[0] : rawId) || "demo-garden-birthday";
  const {
    bundles,
    getEventBundle,
    updateBudgetCategory,
    addBudgetCategory,
    applyOptimizedBudget,
    addExpense,
    deleteExpense,
    updateExpenseStatus,
  } = useUtsav();

  // Add Expense state
  const [expTitle, setExpTitle] = useState("");
  const [expAmountMajor, setExpAmountMajor] = useState("");
  const [expCategoryId, setExpCategoryId] = useState("");
  const [expCostType, setExpCostType] = useState<ExpenseCostType>("confirmed");
  const [expPaymentStatus, setExpPaymentStatus] =
    useState<ExpensePaymentStatus>("Deposit Paid");

  // Add Custom Category state
  const [newCatName, setNewCatName] = useState("");
  const [newCatAmountMajor, setNewCatAmountMajor] = useState("");

  // AI Optimizer state
  const [optInstruction, setOptInstruction] = useState(
    "Reduce my expenses by 15% without compromising photography."
  );
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationProposal, setOptimizationProposal] =
    useState<OptimizeBudgetResponse | null>(null);
  const [optFeedback, setOptFeedback] = useState<string | null>(null);
  const [chartsMounted, setChartsMounted] = useState(false);

  React.useEffect(() => {
    setChartsMounted(true);
  }, []);

  const bundle = getEventBundle(eventId) || bundles[0];
  if (!bundle) {
    return (
      <div className="p-10 text-center text-sm text-utsav-muted font-semibold">
        Event not found.
      </div>
    );
  }

  const { event, budgetCategories, expenses } = bundle;
  const metrics = calculateBudgetSummary(
    event.totalBudgetMinor,
    budgetCategories,
    expenses
  );

  // Chart data in major units
  const donutData = budgetCategories.map((c) => ({
    name: c.name,
    value: fromMinorUnits(c.allocatedAmountMinor),
  }));

  const barData = budgetCategories.map((cat) => {
    const confirmedMajor = fromMinorUnits(
      expenses
        .filter(
          (e) =>
            e.categoryId === cat.id &&
            e.costType === "confirmed" &&
            e.paymentStatus !== "Cancelled"
        )
        .reduce((s, e) => s + e.amountMinor, 0)
    );
    const quotedMajor = fromMinorUnits(
      expenses
        .filter(
          (e) =>
            e.categoryId === cat.id &&
            e.costType === "quote" &&
            e.paymentStatus !== "Cancelled"
        )
        .reduce((s, e) => s + e.amountMinor, 0)
    );
    return {
      name: cat.name.length > 12 ? `${cat.name.slice(0, 12)}…` : cat.name,
      Planned: fromMinorUnits(cat.allocatedAmountMinor),
      Confirmed: confirmedMajor,
      Quoted: quotedMajor,
    };
  });

  function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    const amountMinor = toMinorUnits(Number(expAmountMajor));
    if (!expTitle.trim() || amountMinor <= 0) return;

    const targetCatId = expCategoryId || budgetCategories[0]?.id || "";
    addExpense(event.id, {
      categoryId: targetCatId,
      vendorId: null,
      title: expTitle.trim(),
      amountMinor,
      costType: expCostType,
      paymentStatus: expPaymentStatus,
    });
    setExpTitle("");
    setExpAmountMajor("");
  }

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addBudgetCategory(
      event.id,
      newCatName.trim(),
      toMinorUnits(Number(newCatAmountMajor) || 0)
    );
    setNewCatName("");
    setNewCatAmountMajor("");
  }

  async function handleRunOptimizer(customPrompt?: string) {
    const promptToUse = (customPrompt ?? optInstruction).trim();
    if (!promptToUse || optimizing) return;
    setOptimizing(true);
    setOptFeedback(null);

    try {
      const res = await fetch("/api/ai/optimize-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          instruction: promptToUse,
          eventTitle: event.title,
          eventType: event.eventType,
          guestCount: event.guestTarget,
          currency: event.currency,
          currentTotalBudgetMinor: event.totalBudgetMinor,
          categories: budgetCategories.map((c) => {
            const spentMinor = expenses
              .filter(
                (e) =>
                  e.categoryId === c.id &&
                  e.costType === "confirmed" &&
                  e.paymentStatus !== "Cancelled"
              )
              .reduce((s, e) => s + e.amountMinor, 0);
            return {
              id: c.id,
              name: c.name,
              allocatedAmountMinor: c.allocatedAmountMinor,
              spentMinor,
            };
          }),
          priorities: event.preferences.priorities,
        }),
      });

      const data = await res.json();
      if (res.ok && data.optimization) {
        setOptimizationProposal(data.optimization);
      }
    } finally {
      setOptimizing(false);
    }
  }

  function handleApproveOptimization() {
    if (!optimizationProposal) return;
    applyOptimizedBudget(
      event.id,
      optimizationProposal.categoryChanges.map((c) => ({
        categoryName: c.categoryName,
        proposedMinor: c.proposedMinor,
      }))
    );
    setOptFeedback(
      `Applied optimized allocations! Saved ${formatMinorCurrency(
        Math.max(0, optimizationProposal.expectedSavingsMinor),
        event.currency
      )}.`
    );
    setOptimizationProposal(null);
  }

  return (
    <EventWorkspaceShell bundle={bundle}>
      <div className="space-y-8">
        {/* Precision Financial Notice */}
        <div className="utsav-card p-4 flex flex-wrap items-center justify-between gap-2 text-xs text-utsav-muted">
          <span className="flex items-center gap-2 leading-relaxed">
            <Info className="w-4 h-4 text-utsav-primary shrink-0" />
            All monetary values are stored in integer minor currency units (paise/cents) and distinguish clearly between{" "}
            <strong className="text-utsav-primary font-extrabold">AI Estimates</strong>,{" "}
            <strong className="text-utsav-deep font-extrabold">User Quotes</strong>, and{" "}
            <strong className="text-emerald-600 font-extrabold">Confirmed Expenses</strong>.
          </span>
        </div>

        {/* Budget Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="utsav-card p-4 sm:p-5">
            <span className="text-xs font-bold text-utsav-muted">Total Budget Limit</span>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-text mt-1">
              {formatMinorCurrency(metrics.totalBudgetMinor, event.currency)}
            </p>
            <span className="utsav-num text-[11px] text-utsav-muted font-medium">
              Allocated:{" "}
              {formatMinorCurrency(metrics.totalAllocatedMinor, event.currency)} (
              {metrics.allocationPercent}%)
            </span>
          </div>

          <div className="utsav-card p-4 sm:p-5">
            <span className="text-xs font-bold text-utsav-muted">
              Confirmed Expenses
            </span>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-primary mt-1">
              {formatMinorCurrency(metrics.confirmedSpendMinor, event.currency)}
            </p>
            <span className="utsav-num text-[11px] text-utsav-muted font-medium">
              {metrics.confirmedPercent}% of total spent
            </span>
          </div>

          <div className="utsav-card p-4 sm:p-5">
            <span className="text-xs font-bold text-utsav-muted">
              Pending Vendor Quotes
            </span>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-deep mt-1">
              {formatMinorCurrency(metrics.quotedSpendMinor, event.currency)}
            </p>
            <span className="text-[11px] text-utsav-muted font-medium">
              User-entered quotations
            </span>
          </div>

          <div className="utsav-card p-4 sm:p-5">
            <span className="text-xs font-bold text-utsav-muted">
              Remaining Unspent Funds
            </span>
            <p
              className={`utsav-num text-xl sm:text-2xl font-extrabold mt-1 ${
                metrics.remainingFromTotalMinor < 0
                  ? "text-utsav-coral"
                  : "text-emerald-600"
              }`}
            >
              {formatMinorCurrency(metrics.remainingFromTotalMinor, event.currency)}
            </p>
            <span className="utsav-num text-[11px] text-utsav-muted font-medium">
              Buffer: {formatMinorCurrency(metrics.unallocatedMinor, event.currency)}
            </span>
          </div>
        </div>

        {/* Over-Budget Warning Banner */}
        {(metrics.isOverAllocated ||
          metrics.isOverSpent ||
          metrics.overBudgetCategories.length > 0) && (
          <div className="rounded-2xl bg-utsav-gold/20 border border-utsav-gold p-4 text-xs text-utsav-text flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-utsav-coral shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-extrabold text-utsav-deep">Budget Attention Needed</p>
              {metrics.isOverAllocated && (
                <p>
                  Category allocations exceed your total budget limit by{" "}
                  <strong>
                    {formatMinorCurrency(
                      metrics.totalAllocatedMinor - metrics.totalBudgetMinor,
                      event.currency
                    )}
                  </strong>
                  .
                </p>
              )}
              {metrics.overBudgetCategories.map((ob) => (
                <p key={ob.categoryId}>
                  Confirmed expenses in <strong>{ob.name}</strong> exceed its allocation by{" "}
                  <strong>{formatMinorCurrency(ob.excessMinor, event.currency)}</strong>.
                </p>
              ))}
            </div>
          </div>
        )}

        {/* RECHARTS ANALYTICS: DONUT + BAR CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 utsav-card p-5 sm:p-6">
            <h2 className="text-base font-extrabold text-utsav-text mb-1">
              Category Allocation Share
            </h2>
            <p className="text-xs text-utsav-muted font-medium mb-4">
              Interactive donut breakdown of planned spend
            </p>
            <div className="h-64 w-full">
              {chartsMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {donutData.map((_, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full rounded-2xl bg-utsav-primary/5 flex items-center justify-center text-xs text-utsav-muted font-bold">
                  Loading allocation chart...
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 utsav-card p-5 sm:p-6">
            <h2 className="text-base font-extrabold text-utsav-text mb-1">
              Planned Allocation vs. Confirmed & Quoted Spend
            </h2>
            <p className="text-xs text-utsav-muted font-medium mb-4">
              Side-by-side category comparison ({event.currency})
            </p>
            <div className="h-64 w-full">
              {chartsMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(116,86,232,0.12)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Planned" fill="#7456E8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Confirmed" fill="#10B981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Quoted" fill="#F4C56A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full rounded-2xl bg-utsav-primary/5 flex items-center justify-center text-xs text-utsav-muted font-bold">
                  Loading spending comparison chart...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 7: AI BUDGET OPTIMIZER */}
        <section className="utsav-card p-5 sm:p-7 border-2 border-utsav-primary/20 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="utsav-badge bg-utsav-primary/12 text-utsav-primary">
                <Sparkles className="w-3.5 h-3.5 text-utsav-coral" />
                AI Budget Optimizer
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-utsav-text mt-1.5">
                Intelligent Cost Savings & Rebalancing
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                "Reduce my expenses by 15% without compromising photography.",
                "Increase catering allocation but keep the overall budget unchanged.",
                "Find ways to save ₹10,000.",
                "Make decorations more affordable.",
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setOptInstruction(sample);
                    handleRunOptimizer(sample);
                  }}
                  className="text-left text-[11px] bg-utsav-primary/6 border border-utsav-primary/20 hover:bg-utsav-primary hover:text-white rounded-xl px-3 py-1.5 font-bold text-utsav-text transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunOptimizer();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              value={optInstruction}
              onChange={(e) => setOptInstruction(e.target.value)}
              placeholder='e.g., "Reduce my wedding expenses by 15% without compromising photography."'
              className="flex-1 border px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={optimizing}
              className="utsav-btn-primary !px-6 !py-3"
            >
              {optimizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  Generate Optimization Proposal
                </>
              )}
            </button>
          </form>

          {optFeedback && (
            <div className="rounded-2xl bg-emerald-500/12 border border-emerald-500/25 p-3.5 text-xs font-extrabold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {optFeedback}
            </div>
          )}

          {optimizationProposal && (
            <div className="rounded-2xl bg-utsav-primary/5 p-4 sm:p-6 border border-utsav-primary/25 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-utsav-text">
                    Before & After Optimization Preview
                  </h3>
                  <p className="text-xs text-utsav-muted mt-0.5">
                    {optimizationProposal.summary}
                  </p>
                </div>
                <span className="utsav-badge bg-emerald-500/15 text-emerald-700 utsav-num">
                  Net Change:{" "}
                  {optimizationProposal.expectedSavingsMinor >= 0
                    ? `Saves ${formatMinorCurrency(
                        optimizationProposal.expectedSavingsMinor,
                        event.currency
                      )}`
                    : `+${formatMinorCurrency(
                        Math.abs(optimizationProposal.expectedSavingsMinor),
                        event.currency
                      )}`}
                </span>
              </div>

              {/* Mobile Stacked Cards (< sm) */}
              <div className="sm:hidden space-y-2">
                {optimizationProposal.categoryChanges.map((ch) => (
                  <div
                    key={ch.categoryName}
                    className="utsav-card p-3.5 space-y-1 text-xs"
                  >
                    <div className="flex justify-between font-extrabold text-utsav-text">
                      <span>{ch.categoryName}</span>
                      <span className="utsav-num text-utsav-primary">
                        {formatMinorCurrency(ch.proposedMinor, event.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-utsav-muted utsav-num">
                      <span className="line-through">
                        {formatMinorCurrency(ch.previousMinor, event.currency)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-utsav-primary" />
                      <span>
                        {ch.deltaMinor === 0
                          ? "Unchanged"
                          : ch.deltaMinor > 0
                          ? `+${formatMinorCurrency(ch.deltaMinor, event.currency)}`
                          : `-${formatMinorCurrency(
                              Math.abs(ch.deltaMinor),
                              event.currency
                            )}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-utsav-muted">{ch.rationale}</p>
                  </div>
                ))}
              </div>

              {/* Desktop Table (sm+) */}
              <div className="hidden sm:block overflow-x-auto rounded-2xl border border-utsav-primary/15 bg-utsav-surface">
                <table className="w-full text-left text-xs">
                  <thead className="bg-utsav-primary/8 text-utsav-muted border-b border-utsav-primary/15">
                    <tr>
                      <th className="py-2.5 px-3.5 font-extrabold">Category</th>
                      <th className="py-2.5 px-3.5 font-extrabold text-right">Current</th>
                      <th className="py-2.5 px-3.5 font-extrabold text-right">Proposed</th>
                      <th className="py-2.5 px-3.5 font-extrabold text-right">Delta</th>
                      <th className="py-2.5 px-3.5 font-extrabold">Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-utsav-primary/10">
                    {optimizationProposal.categoryChanges.map((ch) => (
                      <tr key={ch.categoryName}>
                        <td className="py-2.5 px-3.5 font-bold text-utsav-text">
                          {ch.categoryName}
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-utsav-muted utsav-num">
                          {formatMinorCurrency(ch.previousMinor, event.currency)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-extrabold text-utsav-primary utsav-num">
                          {formatMinorCurrency(ch.proposedMinor, event.currency)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-bold utsav-num">
                          {ch.deltaMinor === 0
                            ? "—"
                            : ch.deltaMinor > 0
                            ? `+${formatMinorCurrency(ch.deltaMinor, event.currency)}`
                            : `-${formatMinorCurrency(
                                Math.abs(ch.deltaMinor),
                                event.currency
                              )}`}
                        </td>
                        <td className="py-2.5 px-3.5 text-utsav-muted">{ch.rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOptimizationProposal(null)}
                  className="utsav-btn-secondary !py-2 !px-4 !text-xs"
                >
                  Discard Proposal
                </button>
                <button
                  type="button"
                  onClick={handleApproveOptimization}
                  className="utsav-btn-primary !py-2 !px-5 !text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-utsav-gold" />
                  Approve & Apply Budget Changes
                </button>
              </div>
            </div>
          )}
        </section>

        {/* EDITABLE BUDGET CATEGORIES & EXPENSE LEDGER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 utsav-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-utsav-text">
                Editable Category Allocations
              </h2>
              <span className="text-xs font-semibold text-utsav-muted">
                Edit amounts inline ({event.currency})
              </span>
            </div>

            <div className="space-y-3">
              {budgetCategories.map((cat) => {
                const catConfirmedMinor = expenses
                  .filter(
                    (e) =>
                      e.categoryId === cat.id &&
                      e.costType === "confirmed" &&
                      e.paymentStatus !== "Cancelled"
                  )
                  .reduce((s, e) => s + e.amountMinor, 0);

                const pctUsed =
                  cat.allocatedAmountMinor > 0
                    ? Math.round((catConfirmedMinor / cat.allocatedAmountMinor) * 100)
                    : 0;

                return (
                  <div
                    key={cat.id}
                    className="rounded-2xl bg-utsav-primary/5 p-4 border border-utsav-primary/12 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-sm font-extrabold text-utsav-text">
                          {cat.name}
                        </span>
                        <p className="text-[11px] text-utsav-muted">{cat.notes}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`cat-input-${cat.id}`}
                          className="text-xs font-bold text-utsav-muted"
                        >
                          Allocation ({event.currency}):
                        </label>
                        <input
                          id={`cat-input-${cat.id}`}
                          type="number"
                          min={0}
                          step={500}
                          value={fromMinorUnits(cat.allocatedAmountMinor)}
                          onChange={(e) =>
                            updateBudgetCategory(
                              event.id,
                              cat.id,
                              toMinorUnits(Number(e.target.value))
                            )
                          }
                          className="w-28 border px-2.5 py-1.5 text-xs font-extrabold text-right utsav-num"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-utsav-muted utsav-num">
                      <span>
                        Confirmed Spent:{" "}
                        <strong className="text-utsav-text font-extrabold">
                          {formatMinorCurrency(catConfirmedMinor, event.currency)}
                        </strong>
                      </span>
                      <span className="font-bold">{pctUsed}% used</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-utsav-primary/12 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pctUsed > 100 ? "bg-utsav-coral" : "bg-utsav-gradient"
                        }`}
                        style={{ width: `${Math.min(100, pctUsed)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Custom Category Form */}
            <form
              onSubmit={handleAddCategory}
              className="pt-3 border-t border-utsav-primary/10 flex flex-wrap items-end gap-3"
            >
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-extrabold text-utsav-text mb-1">
                  New Custom Category
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g., Sangeet Choreography"
                  className="w-full border px-3 py-2 text-xs"
                />
              </div>
              <div className="w-36">
                <label className="block text-xs font-extrabold text-utsav-text mb-1">
                  Budget ({event.currency})
                </label>
                <input
                  type="number"
                  min={0}
                  value={newCatAmountMajor}
                  onChange={(e) => setNewCatAmountMajor(e.target.value)}
                  placeholder="15000"
                  className="w-full border px-3 py-2 text-xs utsav-num"
                />
              </div>
              <button type="submit" className="utsav-btn-primary !py-2 !px-4 !text-xs">
                <Plus className="w-3.5 h-3.5" />
                Add Category
              </button>
            </form>
          </div>

          {/* EXPENSE LEDGER */}
          <div className="lg:col-span-5 utsav-card p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-extrabold text-utsav-text">
              Record Expense or Vendor Quote
            </h2>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-extrabold text-utsav-text mb-1">
                  Expense / Quote Title
                </label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g., Acoustic Guitarist Booking Advance"
                  className="w-full border px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-extrabold text-utsav-text mb-1">
                    Amount ({event.currency})
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={expAmountMajor}
                    onChange={(e) => setExpAmountMajor(e.target.value)}
                    placeholder="5000"
                    className="w-full border px-3 py-2 utsav-num"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-utsav-text mb-1">
                    Category
                  </label>
                  <select
                    value={expCategoryId || budgetCategories[0]?.id || ""}
                    onChange={(e) => setExpCategoryId(e.target.value)}
                    className="w-full border px-2.5 py-2"
                  >
                    {budgetCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-extrabold text-utsav-text mb-1">
                    Cost Classification
                  </label>
                  <select
                    value={expCostType}
                    onChange={(e) =>
                      setExpCostType(e.target.value as ExpenseCostType)
                    }
                    className="w-full border px-2.5 py-2"
                  >
                    <option value="confirmed">Confirmed Expense</option>
                    <option value="quote">User-Entered Quote</option>
                    <option value="ai_estimate">AI Estimate</option>
                  </select>
                </div>
                <div>
                  <label className="block font-extrabold text-utsav-text mb-1">
                    Payment Status
                  </label>
                  <select
                    value={expPaymentStatus}
                    onChange={(e) =>
                      setExpPaymentStatus(e.target.value as ExpensePaymentStatus)
                    }
                    className="w-full border px-2.5 py-2"
                  >
                    <option value="Deposit Paid">Deposit Paid</option>
                    <option value="Paid">Paid in Full</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="utsav-btn-primary w-full !py-2.5 !text-xs">
                <Plus className="w-4 h-4" />
                Add to Ledger
              </button>
            </form>

            {/* Expense Items List */}
            <div className="pt-3 border-t border-utsav-primary/10 space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-utsav-muted">
                Recorded Ledger ({expenses.length})
              </h3>
              {expenses.length === 0 ? (
                <p className="text-xs text-utsav-muted py-4 text-center">
                  No expenses recorded yet. Add a quote or confirmed payment above.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {expenses.map((exp) => {
                    const cat = budgetCategories.find(
                      (c) => c.id === exp.categoryId
                    );
                    return (
                      <div
                        key={exp.id}
                        className="rounded-2xl bg-utsav-primary/5 p-3.5 border border-utsav-primary/12 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-1 min-w-0">
                          <p className="font-extrabold text-utsav-text truncate">
                            {exp.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="text-utsav-muted font-bold">
                              {cat?.name || "General"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-extrabold ${
                                exp.costType === "confirmed"
                                  ? "bg-emerald-500/15 text-emerald-700"
                                  : exp.costType === "quote"
                                  ? "bg-utsav-gold/30 text-utsav-deep"
                                  : "bg-utsav-primary/15 text-utsav-primary"
                              }`}
                            >
                              {exp.costType === "confirmed"
                                ? "Confirmed"
                                : exp.costType === "quote"
                                ? "Vendor Quote"
                                : "AI Estimate"}
                            </span>
                            <select
                              aria-label="Update payment status"
                              value={exp.paymentStatus}
                              onChange={(e) =>
                                updateExpenseStatus(
                                  event.id,
                                  exp.id,
                                  e.target.value as ExpensePaymentStatus
                                )
                              }
                              className="rounded-lg border px-2 py-0.5 text-[10px] font-bold"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Deposit Paid">Deposit Paid</option>
                              <option value="Paid">Paid</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="utsav-num font-extrabold text-utsav-text">
                            {formatMinorCurrency(exp.amountMinor, event.currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteExpense(event.id, exp.id)}
                            className="p-1.5 text-utsav-muted hover:text-utsav-coral transition-colors"
                            title="Delete expense"
                            aria-label="Delete expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </EventWorkspaceShell>
  );
}
