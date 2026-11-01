"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Send,
  Wand2,
  Loader2,
  CheckCircle2,
  Info,
} from "lucide-react";
import { FullEventBundle } from "@/types/event";
import { useUtsav } from "@/context/UtsavContext";
import {
  calculateBudgetSummary,
  calculateGuestMetrics,
  formatMinorCurrency,
} from "@/lib/utils/currency";
import { ReplanProposalCard } from "@/components/ai/ReplanProposalCard";

const QUICK_PROMPTS = [
  "Make this suitable for 80 guests while keeping the total budget below ₹90,000.",
  "I now have 120 guests instead of 80. Keep my ₹2 lakh budget.",
  "How much money do I have left?",
  "What is my next important task?",
  "Help me plan for rain.",
  "Reduce expenses while keeping catering quality a priority.",
];

export function CopilotPanel({
  bundle,
  compact = false,
}: {
  bundle: FullEventBundle;
  compact?: boolean;
}) {
  const {
    appendChatMessage,
    saveChangeProposal,
    applyChangeProposalTransactionally,
    rejectChangeProposal,
  } = useUtsav();

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const budgetSummary = calculateBudgetSummary(
    bundle.event.totalBudgetMinor,
    bundle.budgetCategories,
    bundle.expenses
  );
  const guestMetrics = calculateGuestMetrics(bundle.guests);

  async function handleSendPrompt(promptText?: string) {
    const messageToSend = (promptText ?? input).trim();
    if (!messageToSend || isSending) return;

    setInput("");
    setFeedbackBanner(null);

    appendChatMessage(bundle.event.id, {
      conversationId: `conv-${bundle.event.id}`,
      role: "user",
      content: messageToSend,
    });

    setIsSending(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: bundle.event.id,
          message: messageToSend,
          baseVersion: bundle.event.version,
          context: {
            title: bundle.event.title,
            eventType: bundle.event.eventType,
            eventDate: bundle.event.eventDate,
            location: bundle.event.location,
            guestTarget: bundle.event.guestTarget,
            totalBudgetMinor: bundle.event.totalBudgetMinor,
            confirmedSpendMinor: budgetSummary.confirmedSpendMinor,
            remainingBudgetMinor: budgetSummary.remainingFromTotalMinor,
            currency: bundle.event.currency,
            theme: bundle.event.theme,
            priorities: bundle.event.preferences.priorities,
            categories: bundle.budgetCategories.map((c) => ({
              name: c.name,
              allocatedAmountMinor: c.allocatedAmountMinor,
            })),
            tasks: bundle.tasks.map((t) => ({
              title: t.title,
              dueDate: t.dueDate,
              priority: t.priority,
              status: t.status,
            })),
            vendors: bundle.vendors.map((v) => ({
              name: v.name,
              category: v.category,
              bookingStatus: v.bookingStatus,
              quotedAmountMinor: v.quotedAmountMinor,
            })),
            confirmedGuests: guestMetrics.confirmedHeadcount,
            pendingGuests: guestMetrics.pendingHeadcount,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reach Copilot");
      }

      let savedProposalId: string | undefined;
      if (data.intentType === "modification" && data.proposal) {
        const saved = saveChangeProposal(
          bundle.event.id,
          messageToSend,
          data.proposal,
          bundle.event.version
        );
        savedProposalId = saved.id;
      }

      appendChatMessage(bundle.event.id, {
        conversationId: `conv-${bundle.event.id}`,
        role: "assistant",
        content: data.reply,
        intentType: data.intentType,
        proposalId: savedProposalId,
        isFallback: data.isFallback,
      });
    } catch (err) {
      appendChatMessage(bundle.event.id, {
        conversationId: `conv-${bundle.event.id}`,
        role: "assistant",
        content:
          err instanceof Error
            ? `Sorry, I encountered an issue processing that request: ${err.message}`
            : "Sorry, I couldn't process that request right now.",
      });
    } finally {
      setIsSending(false);
    }
  }

  async function handleApproveProposal(proposalId: string) {
    const proposalRecord = bundle.proposals.find((p) => p.id === proposalId);
    if (!proposalRecord) return;

    setApplyingId(proposalId);
    setFeedbackBanner(null);

    try {
      const res = await fetch("/api/ai/apply-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: bundle.event.id,
          proposalId,
          currentVersion: bundle.event.version,
          baseVersion: proposalRecord.baseVersion,
          proposal: proposalRecord.changes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedbackBanner({
          type: "error",
          text: data.error || "Proposal validation failed.",
        });
        return;
      }

      const applied = applyChangeProposalTransactionally(bundle.event.id, proposalId);
      if (!applied.ok) {
        setFeedbackBanner({
          type: "error",
          text: applied.error || "Could not apply proposal.",
        });
        return;
      }

      setFeedbackBanner({
        type: "success",
        text: `Applied synchronized changes! Guest target is now ${
          proposalRecord.changes.proposedGuestTarget
        } guests and total budget is ${formatMinorCurrency(
          proposalRecord.changes.proposedTotalBudgetMinor,
          bundle.event.currency
        )}.`,
      });
    } catch (err) {
      setFeedbackBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to apply proposal.",
      });
    } finally {
      setApplyingId(null);
    }
  }

  function handleRejectProposal(proposalId: string) {
    rejectChangeProposal(bundle.event.id, proposalId);
    setFeedbackBanner({
      type: "success",
      text: "Proposal dismissed. Your current event plan remains untouched.",
    });
  }

  return (
    <div className="utsav-card flex flex-col h-full overflow-hidden">
      {/* Copilot Header */}
      <div className="bg-utsav-gradient px-5 py-4 text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-utsav-gold" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight leading-tight">
              VervePlan Event Copilot
            </h2>
            <p className="text-xs text-white/85 font-medium">
              Synchronized Replanning Engine · State v{bundle.event.version}
            </p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <span className="utsav-num inline-block rounded-full bg-white/15 px-3.5 py-1 text-xs font-extrabold">
            {bundle.event.guestTarget} Guests ·{" "}
            {formatMinorCurrency(bundle.event.totalBudgetMinor, bundle.event.currency)}
          </span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`px-4 py-3 text-xs font-bold flex items-center justify-between ${
            feedbackBanner.type === "success"
              ? "bg-emerald-500/12 text-emerald-800 border-b border-emerald-500/20"
              : "bg-utsav-coral/15 text-utsav-deep border-b border-utsav-coral/30"
          }`}
        >
          <span className="flex items-center gap-2">
            {feedbackBanner.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-utsav-coral shrink-0" />
            )}
            {feedbackBanner.text}
          </span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-xs underline ml-2 font-extrabold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Hackathon Demo Prompts */}
      <div className="px-4 py-3.5 bg-utsav-primary/5 border-b border-utsav-primary/10">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-utsav-primary mb-2 flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-utsav-coral" />
          One-Click Interactive Replanning & Queries:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.slice(0, compact ? 3 : 6).map((qp) => (
            <button
              key={qp}
              type="button"
              onClick={() => handleSendPrompt(qp)}
              disabled={isSending}
              className="text-left text-xs font-semibold bg-utsav-surface hover:bg-utsav-primary hover:text-white text-utsav-text border border-utsav-primary/20 rounded-xl px-3 py-1.5 transition-all duration-150 shadow-2xs"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-h-[580px]">
        {bundle.messages.map((msg) => {
          const linkedProposal = msg.proposalId
            ? bundle.proposals.find((p) => p.id === msg.proposalId)
            : undefined;

          return (
            <div key={msg.id} className="space-y-3.5">
              <div
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.role === "user"
                      ? "bg-utsav-gradient text-white rounded-br-xs font-medium"
                      : "bg-utsav-bg text-utsav-text border border-utsav-primary/15 rounded-bl-xs"
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>
                  {msg.role === "assistant" && (
                    <div className="mt-2.5 pt-2 border-t border-utsav-primary/10 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-utsav-muted">
                      <span>
                        {msg.intentType === "modification"
                          ? "Synchronized Proposal (Requires Confirmation)"
                          : msg.intentType === "creative"
                          ? "Creative Ideation (Read-Only)"
                          : "Verified Event State Lookup"}
                      </span>
                      {msg.isFallback && (
                        <span className="text-utsav-primary">Deterministic Engine</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {linkedProposal && (
                <ReplanProposalCard
                  proposalRecord={linkedProposal}
                  currency={bundle.event.currency}
                  onApprove={handleApproveProposal}
                  onReject={handleRejectProposal}
                  isApplying={applyingId === linkedProposal.id}
                />
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-2.5 text-xs font-bold text-utsav-primary bg-utsav-primary/8 px-4 py-3 rounded-2xl w-fit border border-utsav-primary/15">
            <Loader2 className="w-4 h-4 animate-spin text-utsav-primary" />
            Synchronizing budget, guest capacity, vendors, and checklist dependencies...
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendPrompt();
        }}
        className="p-3 sm:p-4 bg-utsav-surface border-t border-utsav-primary/12 flex items-center gap-2.5"
      >
        <label htmlFor="copilot-chat-input" className="sr-only">
          Ask VervePlan Copilot
        </label>
        <input
          id="copilot-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Try: "Make this suitable for 80 guests while keeping the total budget below ₹90,000"'
          className="flex-1 rounded-2xl border border-utsav-primary/25 bg-utsav-bg px-4 py-3 text-xs sm:text-sm font-medium text-utsav-text placeholder:text-utsav-muted"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="utsav-btn-primary !py-3 !px-5 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
