"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Users,
  Wallet,
  Sparkles,
  CheckSquare,
  Store,
} from "lucide-react";
import { ChangeProposalRecord, CurrencyCode } from "@/types/event";
import { formatMinorCurrency } from "@/lib/utils/currency";

interface ReplanProposalCardProps {
  proposalRecord: ChangeProposalRecord;
  currency: CurrencyCode;
  onApprove: (proposalId: string) => void;
  onReject: (proposalId: string) => void;
  isApplying?: boolean;
}

export function ReplanProposalCard({
  proposalRecord,
  currency,
  onApprove,
  onReject,
  isApplying = false,
}: ReplanProposalCardProps) {
  const { changes, status, id, appliedAt } = proposalRecord;

  return (
    <div className="utsav-card border-2 border-utsav-primary/25 bg-gradient-to-b from-utsav-surface to-utsav-bg/80 p-4 sm:p-6 space-y-5">
      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-utsav-primary/10 pb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="utsav-badge bg-utsav-primary/12 text-utsav-primary">
            <Sparkles className="w-3.5 h-3.5 text-utsav-coral" />
            Synchronized Change Proposal
          </span>
          {changes.isFallback && (
            <span className="utsav-badge bg-utsav-gold/25 text-utsav-deep">
              Deterministic Replanning Engine
            </span>
          )}
        </div>

        <div>
          {status === "pending" && (
            <span className="utsav-badge bg-utsav-gold/30 text-utsav-deep">
              Awaiting Approval
            </span>
          )}
          {status === "applied" && (
            <span className="utsav-badge bg-emerald-500/15 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Applied {appliedAt ? `(${new Date(appliedAt).toLocaleTimeString()})` : ""}
            </span>
          )}
          {status === "rejected" && (
            <span className="utsav-badge bg-utsav-primary/10 text-utsav-muted">
              Kept Original Plan
            </span>
          )}
          {status === "stale" && (
            <span className="utsav-badge bg-utsav-coral/20 text-utsav-deep">
              Stale Version — Superseded
            </span>
          )}
        </div>
      </div>

      {/* Feasibility Warning if any */}
      {!changes.feasible && (
        <div className="rounded-2xl bg-utsav-gold/20 border border-utsav-gold p-4 text-xs text-utsav-text space-y-1.5">
          <div className="flex items-center gap-2 font-extrabold text-utsav-deep">
            <AlertTriangle className="w-4 h-4 text-utsav-coral shrink-0" />
            Mathematical / Practical Constraint Notice
          </div>
          <p className="leading-relaxed">{changes.infeasibilityReason}</p>
          {changes.alternativeSuggestion && (
            <p className="font-bold text-utsav-primary pt-1">
              Recommended Alternative: {changes.alternativeSuggestion}
            </p>
          )}
        </div>
      )}

      {/* Top-Level Before & After Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="rounded-2xl bg-utsav-surface p-4 border border-utsav-primary/15 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-utsav-muted mb-1.5">
            <Users className="w-4 h-4 text-utsav-primary" />
            Guest Capacity Target
          </div>
          <div className="flex items-baseline gap-2.5 utsav-num">
            <span className="text-sm line-through text-utsav-muted font-medium">
              {changes.previousGuestTarget} guests
            </span>
            <ArrowRight className="w-4 h-4 text-utsav-primary shrink-0" />
            <span className="text-xl font-extrabold text-utsav-text">
              {changes.proposedGuestTarget} guests
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-utsav-surface p-4 border border-utsav-primary/15 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-utsav-muted mb-1.5">
            <Wallet className="w-4 h-4 text-utsav-primary" />
            Total Budget Ceiling
          </div>
          <div className="flex items-baseline gap-2.5 utsav-num">
            <span className="text-sm line-through text-utsav-muted font-medium">
              {formatMinorCurrency(changes.previousTotalBudgetMinor, currency)}
            </span>
            <ArrowRight className="w-4 h-4 text-utsav-primary shrink-0" />
            <span className="text-xl font-extrabold text-utsav-primary">
              {formatMinorCurrency(changes.proposedTotalBudgetMinor, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Category-by-Category Budget Diff: Responsive Cards on Mobile + Table on Desktop */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-utsav-muted">
          Synchronized Category Allocations (Before vs. Proposed)
        </h4>

        {/* Mobile Stacked Cards (< sm) */}
        <div className="sm:hidden space-y-2">
          {changes.budgetChanges.map((bc) => {
            const isIncrease = bc.deltaMinor > 0;
            const isDecrease = bc.deltaMinor < 0;
            return (
              <div
                key={bc.categoryName}
                className="rounded-2xl bg-utsav-surface p-3.5 border border-utsav-primary/12 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-utsav-text">{bc.categoryName}</span>
                  <span
                    className={`utsav-num font-bold px-2 py-0.5 rounded-full text-[11px] ${
                      isIncrease
                        ? "bg-utsav-gold/25 text-utsav-deep"
                        : isDecrease
                        ? "bg-emerald-500/15 text-emerald-700"
                        : "bg-utsav-primary/10 text-utsav-muted"
                    }`}
                  >
                    {bc.deltaMinor === 0
                      ? "No Change"
                      : `${isIncrease ? "+" : "-"}${formatMinorCurrency(
                          Math.abs(bc.deltaMinor),
                          currency
                        )}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 utsav-num text-xs">
                  <span className="line-through text-utsav-muted">
                    {formatMinorCurrency(bc.previousMinor, currency)}
                  </span>
                  <ArrowRight className="w-3 h-3 text-utsav-primary" />
                  <span className="font-extrabold text-utsav-primary">
                    {formatMinorCurrency(bc.proposedMinor, currency)}
                  </span>
                </div>
                <p className="text-[11px] text-utsav-muted leading-relaxed">{bc.reason}</p>
              </div>
            );
          })}
        </div>

        {/* Desktop & Tablet Table (sm+) */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-utsav-primary/15 bg-utsav-surface">
          <table className="w-full text-left text-xs">
            <thead className="bg-utsav-primary/6 text-utsav-muted border-b border-utsav-primary/12">
              <tr>
                <th className="py-3 px-3.5 font-extrabold">Category</th>
                <th className="py-3 px-3.5 font-extrabold text-right">Current</th>
                <th className="py-3 px-3.5 font-extrabold text-right">Proposed</th>
                <th className="py-3 px-3.5 font-extrabold text-right">Delta</th>
                <th className="py-3 px-3.5 font-extrabold">Adjustment Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-utsav-primary/10">
              {changes.budgetChanges.map((bc) => {
                const isIncrease = bc.deltaMinor > 0;
                const isDecrease = bc.deltaMinor < 0;
                return (
                  <tr key={bc.categoryName} className="hover:bg-utsav-primary/5 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-utsav-text">
                      {bc.categoryName}
                    </td>
                    <td className="py-3 px-3.5 text-right text-utsav-muted utsav-num">
                      {formatMinorCurrency(bc.previousMinor, currency)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-extrabold text-utsav-text utsav-num">
                      {formatMinorCurrency(bc.proposedMinor, currency)}
                    </td>
                    <td
                      className={`py-3 px-3.5 text-right font-bold utsav-num ${
                        isIncrease
                          ? "text-utsav-deep"
                          : isDecrease
                          ? "text-emerald-600"
                          : "text-utsav-muted"
                      }`}
                    >
                      {bc.deltaMinor === 0
                        ? "—"
                        : `${isIncrease ? "+" : "-"}${formatMinorCurrency(
                            Math.abs(bc.deltaMinor),
                            currency
                          )}`}
                    </td>
                    <td className="py-3 px-3.5 text-utsav-muted leading-relaxed">{bc.reason}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-utsav-primary/8 font-extrabold text-utsav-text border-t border-utsav-primary/15 utsav-num">
              <tr>
                <td className="py-3 px-3.5">Total Allocated</td>
                <td className="py-3 px-3.5 text-right">
                  {formatMinorCurrency(changes.previousTotalBudgetMinor, currency)}
                </td>
                <td className="py-3 px-3.5 text-right text-utsav-primary">
                  {formatMinorCurrency(changes.proposedAllocatedSumMinor, currency)}
                </td>
                <td className="py-3 px-3.5 text-right">
                  {changes.proposedAllocatedSumMinor - changes.previousTotalBudgetMinor >= 0
                    ? `+${formatMinorCurrency(
                        changes.proposedAllocatedSumMinor - changes.previousTotalBudgetMinor,
                        currency
                      )}`
                    : `-${formatMinorCurrency(
                        Math.abs(
                          changes.proposedAllocatedSumMinor - changes.previousTotalBudgetMinor
                        ),
                        currency
                      )}`}
                </td>
                <td className="py-3 px-3.5 text-[11px] font-bold text-emerald-600">
                  Verified within {formatMinorCurrency(changes.proposedTotalBudgetMinor, currency)} limit
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Synchronized Checklist Tasks & Vendor Implications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="rounded-2xl bg-utsav-surface p-4 border border-utsav-primary/15 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-utsav-text">
            <CheckSquare className="w-4 h-4 text-utsav-primary" />
            Checklist Adjustments ({changes.taskChanges.length})
          </div>
          <ul className="space-y-2 text-xs text-utsav-muted">
            {changes.taskChanges.map((tc, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="inline-block rounded-lg bg-utsav-primary/12 text-utsav-primary px-2 py-0.5 text-[10px] font-extrabold uppercase shrink-0 mt-0.5">
                  {tc.action}
                </span>
                <div>
                  <p className="font-bold text-utsav-text">{tc.title}</p>
                  <p className="text-[11px] text-utsav-muted mt-0.5">
                    Due {tc.dueDate} · {tc.reason}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-utsav-surface p-4 border border-utsav-primary/15 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-utsav-text">
            <Store className="w-4 h-4 text-utsav-coral" />
            Vendor & Space Implications
          </div>
          <p className="text-xs text-utsav-muted leading-relaxed">
            <strong className="text-utsav-text">Seating & Flow:</strong>{" "}
            {changes.spaceAndSeatingImplications}
          </p>
          <div className="space-y-1.5 pt-1">
            {changes.vendorImplications.map((vi, idx) => (
              <div
                key={idx}
                className="text-[11px] text-utsav-muted border-t border-utsav-primary/10 pt-1.5"
              >
                <span className="font-bold text-utsav-text">{vi.category}:</span>{" "}
                {vi.newGuidance}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trade-Offs & Risks */}
      <div className="rounded-2xl bg-utsav-primary/6 p-4 border border-utsav-primary/15 space-y-1.5">
        <p className="text-xs font-extrabold text-utsav-text">Key Trade-Offs Explained</p>
        <ul className="list-disc list-inside text-xs text-utsav-muted space-y-1 leading-relaxed">
          {changes.tradeOffs.map((t, idx) => (
            <li key={idx}>{t}</li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      {status === "pending" && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 border-t border-utsav-primary/10">
          <button
            type="button"
            disabled={isApplying}
            onClick={() => onReject(id)}
            className="utsav-btn-secondary !py-3 sm:!py-2.5 !text-xs"
          >
            <XCircle className="w-4 h-4 text-utsav-muted" />
            Keep Current Plan
          </button>
          <button
            type="button"
            disabled={isApplying}
            onClick={() => onApprove(id)}
            className="utsav-btn-primary !py-3 sm:!py-2.5 !text-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-utsav-gold" />
            {isApplying ? "Applying Transactionally..." : "Apply Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
