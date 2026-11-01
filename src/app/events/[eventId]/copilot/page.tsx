"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Sparkles, CheckCircle2, History } from "lucide-react";
import { useUtsav } from "@/context/UtsavContext";
import { EventWorkspaceShell } from "@/components/layout/EventWorkspaceShell";
import { CopilotPanel } from "@/components/ai/CopilotPanel";
import { formatMinorCurrency } from "@/lib/utils/currency";

export default function EventCopilotPage() {
  const params = useParams<{ eventId: string }>();
  const rawId = params?.eventId;
  const eventId = (Array.isArray(rawId) ? rawId[0] : rawId) || "demo-garden-birthday";
  const { bundles, getEventBundle } = useUtsav();

  const bundle = getEventBundle(eventId) || bundles[0];
  if (!bundle) {
    return (
      <div className="p-10 text-center text-sm text-utsav-muted font-semibold">
        Event not found.
      </div>
    );
  }

  const { event, proposals } = bundle;

  return (
    <EventWorkspaceShell bundle={bundle}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Interactive Copilot & Synchronized Replanning Engine */}
        <div className="lg:col-span-8">
          <CopilotPanel bundle={bundle} />
        </div>

        {/* Right 4 Cols: Architecture Guarantees & Proposal Audit Log */}
        <div className="lg:col-span-4 space-y-6">
          <div className="utsav-card p-5 sm:p-6 space-y-3.5 text-xs">
            <span className="utsav-badge bg-utsav-primary/12 text-utsav-primary">
              <Sparkles className="w-3.5 h-3.5 text-utsav-coral" />
              How Copilot Protects Your Plan
            </span>
            <h3 className="text-sm font-extrabold text-utsav-text">
              Read-Only vs. Transactional Write Safety
            </h3>
            <ul className="space-y-2.5 text-utsav-muted leading-relaxed">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-utsav-text font-extrabold">Read-Only Queries:</strong>{" "}
                  Answered directly using verified minor-unit budget and checklist metrics.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-utsav-text font-extrabold">Creative Ideation:</strong>{" "}
                  Generates decor, rain backup, and menu ideas without touching saved data.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-utsav-text font-extrabold">Synchronized Replanning:</strong>{" "}
                  Produces a validated before-and-after diff card. Changes are never applied silently—only when you click{" "}
                  <strong className="text-utsav-primary">Apply Changes</strong>.
                </span>
              </li>
            </ul>
          </div>

          {/* Change Proposal Audit History */}
          <div className="utsav-card p-5 sm:p-6 space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-utsav-text flex items-center gap-1.5">
                <History className="w-4 h-4 text-utsav-primary" />
                Replanning Audit History ({proposals.length})
              </h3>
              <span className="utsav-num text-[11px] font-bold text-utsav-muted">
                State v{event.version}
              </span>
            </div>

            {proposals.length === 0 ? (
              <p className="text-utsav-muted py-4 leading-relaxed">
                No replanning proposals recorded yet. Try asking the Copilot to adjust your guest count or budget!
              </p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {proposals.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-utsav-primary/5 p-3.5 border border-utsav-primary/12 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`utsav-badge !text-[10px] !py-0.5 !px-2.5 uppercase ${
                          p.status === "applied"
                            ? "bg-emerald-500/15 text-emerald-700"
                            : p.status === "pending"
                            ? "bg-utsav-gold/30 text-utsav-deep"
                            : "bg-utsav-primary/10 text-utsav-muted"
                        }`}
                      >
                        {p.status}
                      </span>
                      <span className="utsav-num text-[10px] font-bold text-utsav-muted">
                        Base v{p.baseVersion}
                      </span>
                    </div>
                    <p className="font-bold text-utsav-text line-clamp-2">
                      &ldquo;{p.requestedChange}&rdquo;
                    </p>
                    <p className="utsav-num text-[11px] text-utsav-muted">
                      Guests: {p.changes.previousGuestTarget} →{" "}
                      <strong className="text-utsav-text">{p.changes.proposedGuestTarget}</strong> · Budget:{" "}
                      <strong className="text-utsav-primary">
                        {formatMinorCurrency(
                          p.changes.proposedTotalBudgetMinor,
                          event.currency
                        )}
                      </strong>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </EventWorkspaceShell>
  );
}
