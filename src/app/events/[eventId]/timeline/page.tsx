"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  CalendarClock,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  Calendar,
} from "lucide-react";
import { useUtsav } from "@/context/UtsavContext";
import { EventWorkspaceShell } from "@/components/layout/EventWorkspaceShell";
import {
  calculateTaskMetrics,
  computeRelativeDueDate,
  getTodayIso,
} from "@/lib/utils/currency";
import { TaskPriority, TaskRecord, TaskStatus } from "@/types/event";
import { GenerateTimelineResponse } from "@/lib/ai/ideas-and-timeline";

export default function TimelinePage() {
  const params = useParams<{ eventId: string }>();
  const rawId = params?.eventId;
  const eventId = (Array.isArray(rawId) ? rawId[0] : rawId) || "demo-garden-birthday";
  const {
    bundles,
    getEventBundle,
    addTask,
    updateTask,
    deleteTask,
    applyTimelineProposals,
  } = useUtsav();

  // New Task form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("High");
  const [category, setCategory] = useState("Logistics");
  const [phase, setPhase] = useState<TaskRecord["phase"]>("Vendor & Design");

  // Filter state
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | TaskStatus | "HIGH_THIS_MONTH"
  >("ALL");

  // AI Timeline Assistant state
  const [aiInstruction, setAiInstruction] = useState(
    "Move my decoration planning one week earlier."
  );
  const [loadingAi, setLoadingAi] = useState(false);
  const [timelineProposal, setTimelineProposal] =
    useState<GenerateTimelineResponse | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const bundle = getEventBundle(eventId) || bundles[0];
  if (!bundle) {
    return (
      <div className="p-10 text-center text-sm text-utsav-muted font-semibold">
        Event not found.
      </div>
    );
  }

  const { event, tasks, plan } = bundle;
  const metrics = calculateTaskMetrics(tasks);

  const filteredTasks = tasks
    .filter((t) => {
      if (statusFilter === "ALL") return true;
      if (statusFilter === "HIGH_THIS_MONTH") {
        return t.status !== "Completed" && t.priority === "High";
      }
      return t.status === statusFilter;
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const effectiveDue =
      dueDate || computeRelativeDueDate(event.eventDate, 10);

    addTask(event.id, {
      title: title.trim(),
      description: description.trim(),
      dueDate: effectiveDue,
      priority,
      status: "Todo",
      category: category.trim() || "General",
      phase,
    });

    setTitle("");
    setDescription("");
  }

  async function handleRunTimelineAi(customInstruction?: string) {
    const promptToUse = (customInstruction ?? aiInstruction).trim();
    if (!promptToUse || loadingAi) return;

    if (
      promptToUse.toLowerCase().includes("important tasks remaining") ||
      promptToUse.toLowerCase().includes("show all important")
    ) {
      setStatusFilter("HIGH_THIS_MONTH");
      setFeedback("Filtered view to show remaining High-Priority tasks.");
      return;
    }

    setLoadingAi(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/ai/generate-timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          instruction: promptToUse,
          eventDate: event.eventDate,
          eventType: event.eventType,
          currentTasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate,
            priority: t.priority,
            status: t.status,
            category: t.category,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.proposal) {
        setTimelineProposal(data.proposal);
      }
    } finally {
      setLoadingAi(false);
    }
  }

  function handleApproveTimelineProposal() {
    if (!timelineProposal) return;
    applyTimelineProposals(event.id, timelineProposal.proposedTasks);
    setFeedback(
      `Applied ${timelineProposal.proposedTasks.length} timeline update(s) to your checklist!`
    );
    setTimelineProposal(null);
  }

  const todayIso = getTodayIso();

  return (
    <EventWorkspaceShell bundle={bundle}>
      <div className="space-y-8">
        {/* Progress KPI Header */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="utsav-card p-4 sm:p-5">
            <span className="text-xs font-bold text-utsav-muted">
              Overall Progress
            </span>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-primary mt-1">
              {metrics.completionPercent}%
            </p>
            <div className="w-full h-2 rounded-full bg-utsav-primary/12 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-utsav-gradient transition-all duration-300"
                style={{ width: `${metrics.completionPercent}%` }}
              />
            </div>
          </div>

          <div className="utsav-card p-4 sm:p-5">
            <span className="text-xs font-bold text-utsav-muted">
              Completed Milestones
            </span>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
              {metrics.completedTasks} / {metrics.totalTasks}
            </p>
            <span className="text-[11px] text-utsav-muted font-medium">
              {metrics.inProgressTasks} in progress
            </span>
          </div>

          <div className="utsav-card p-4 sm:p-5">
            <span className="text-xs font-bold text-utsav-muted">
              High Priority Open
            </span>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-coral mt-1">
              {metrics.highPriorityRemaining.length}
            </p>
            <span className="text-[11px] text-utsav-muted font-medium">
              Relative to {event.eventDate}
            </span>
          </div>

          <div className="utsav-card p-4 sm:p-5">
            <span className="text-xs font-bold text-utsav-muted">
              Overdue Tasks
            </span>
            <p
              className={`utsav-num text-xl sm:text-2xl font-extrabold mt-1 ${
                metrics.overdueTasks.length > 0
                  ? "text-utsav-coral"
                  : "text-emerald-600"
              }`}
            >
              {metrics.overdueTasks.length}
            </p>
            <span className="text-[11px] text-utsav-muted font-medium">
              {metrics.overdueTasks.length === 0
                ? "All deadlines on track"
                : "Requires attention"}
            </span>
          </div>
        </div>

        {/* AI TIMELINE ASSISTANT */}
        <section className="utsav-card p-5 sm:p-7 border-2 border-utsav-primary/20 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="utsav-badge bg-utsav-primary/12 text-utsav-primary">
                <Sparkles className="w-3.5 h-3.5 text-utsav-coral" />
                AI Timeline Assistant
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-utsav-text mt-1.5">
                Reorganize Deadlines & Preview Schedule Changes
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                "Move my decoration planning one week earlier.",
                "Show all important tasks remaining this month.",
                "My event is happening sooner than expected. Reorganize my timeline.",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setAiInstruction(q);
                    handleRunTimelineAi(q);
                  }}
                  className="text-left text-[11px] bg-utsav-primary/6 border border-utsav-primary/20 hover:bg-utsav-primary hover:text-white rounded-xl px-3 py-1.5 font-bold text-utsav-text transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunTimelineAi();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              aria-label="AI timeline adjustment prompt"
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              placeholder='e.g., "Move my decoration planning one week earlier."'
              className="flex-1 border px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={loadingAi}
              className="utsav-btn-primary !px-6 !py-3"
            >
              {loadingAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarClock className="w-4 h-4" />
                  Generate Timeline Proposal
                </>
              )}
            </button>
          </form>

          {feedback && (
            <div className="rounded-2xl bg-emerald-500/12 border border-emerald-500/25 p-3.5 text-xs font-extrabold text-emerald-800 flex items-center justify-between">
              <span>{feedback}</span>
              <button
                type="button"
                onClick={() => {
                  setFeedback(null);
                  setStatusFilter("ALL");
                }}
                className="underline text-xs"
              >
                Reset View
              </button>
            </div>
          )}

          {timelineProposal && (
            <div className="rounded-2xl bg-utsav-primary/5 p-5 border border-utsav-primary/25 space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-utsav-text">
                  Proposed Timeline Adjustments (Preview Before Confirmation)
                </h3>
                <p className="text-xs text-utsav-muted mt-0.5">
                  {timelineProposal.summary}
                </p>
              </div>

              <div className="space-y-2.5">
                {timelineProposal.proposedTasks.map((pt, idx) => (
                  <div
                    key={idx}
                    className="utsav-card p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="inline-block rounded-lg bg-utsav-primary/12 text-utsav-primary px-2 py-0.5 text-[10px] font-extrabold uppercase mr-2">
                        {pt.action}
                      </span>
                      <strong className="text-utsav-text font-extrabold">
                        {pt.title}
                      </strong>
                      <p className="text-[11px] text-utsav-muted mt-0.5">
                        {pt.reason}
                      </p>
                    </div>
                    <div className="text-right utsav-num">
                      {pt.previousDueDate && (
                        <span className="line-through text-utsav-muted mr-2">
                          {pt.previousDueDate}
                        </span>
                      )}
                      <span className="font-extrabold text-utsav-primary">
                        → {pt.proposedDueDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTimelineProposal(null)}
                  className="utsav-btn-secondary !py-2 !px-4 !text-xs"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleApproveTimelineProposal}
                  className="utsav-btn-primary !py-2 !px-5 !text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-utsav-gold" />
                  Confirm & Apply Schedule
                </button>
              </div>
            </div>
          )}
        </section>

        {/* CHECKLIST & ADD TASK + EVENT-DAY ITINERARY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 utsav-card p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-utsav-text">
                Preparation Milestones & Checklist
              </h2>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {(
                  [
                    { key: "ALL", label: "All" },
                    { key: "Todo", label: "To Do" },
                    { key: "In Progress", label: "In Progress" },
                    { key: "Completed", label: "Completed" },
                    { key: "HIGH_THIS_MONTH", label: "High Priority" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                      statusFilter === tab.key
                        ? "bg-utsav-primary text-white shadow-2xs"
                        : "bg-utsav-primary/6 text-utsav-muted hover:text-utsav-text"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <p className="text-xs text-utsav-muted py-6 text-center">
                No tasks match the current filter.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const isDone = task.status === "Completed";
                  const isOverdue = !isDone && task.dueDate < todayIso;
                  return (
                    <div
                      key={task.id}
                      className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                        isOverdue
                          ? "bg-utsav-coral/10 border-utsav-coral/35"
                          : isDone
                          ? "bg-utsav-primary/3 border-utsav-primary/10 opacity-75"
                          : "bg-utsav-primary/5 border-utsav-primary/15"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() =>
                            updateTask(event.id, task.id, {
                              status: isDone ? "Todo" : "Completed",
                            })
                          }
                          className="mt-1 h-4 w-4 rounded border-utsav-primary/35 text-utsav-primary"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`font-extrabold text-sm ${
                                isDone
                                  ? "line-through text-utsav-muted"
                                  : "text-utsav-text"
                              }`}
                            >
                              {task.title}
                            </span>
                            <span className="utsav-badge bg-utsav-surface border border-utsav-primary/15 !text-[10px] !py-0.5 !px-2 text-utsav-primary">
                              {task.category}
                            </span>
                            {isOverdue && (
                              <span className="utsav-badge bg-utsav-coral/20 text-utsav-deep !text-[10px] !py-0.5 !px-2">
                                <AlertTriangle className="w-3 h-3" />
                                Overdue
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-utsav-muted leading-relaxed">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-utsav-muted font-medium">
                            <span className="inline-flex items-center gap-1 utsav-num">
                              <Calendar className="w-3 h-3 text-utsav-primary" />
                              Due: <strong className="text-utsav-text">{task.dueDate}</strong>
                            </span>
                            <span>Phase: {task.phase}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <select
                          aria-label="Task status"
                          value={task.status}
                          onChange={(e) =>
                            updateTask(event.id, task.id, {
                              status: e.target.value as TaskStatus,
                            })
                          }
                          className="rounded-xl border px-2.5 py-1.5 text-xs font-bold"
                        >
                          <option value="Todo">Todo</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => deleteTask(event.id, task.id)}
                          className="p-1.5 text-utsav-muted hover:text-utsav-coral transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ADD TASK FORM & EVENT-DAY ITINERARY */}
          <div className="lg:col-span-4 space-y-6">
            <div className="utsav-card p-5 sm:p-6 space-y-4">
              <h2 className="text-base font-extrabold text-utsav-text">
                Add Checklist Milestone
              </h2>
              <form onSubmit={handleAddTask} className="space-y-3 text-xs">
                <div>
                  <label htmlFor="task-title-input" className="block font-extrabold text-utsav-text mb-1">
                    Task Title
                  </label>
                  <input
                    id="task-title-input"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Confirm generator power backup"
                    className="w-full border px-3 py-2"
                  />
                </div>

                <div>
                  <label htmlFor="task-desc-input" className="block font-extrabold text-utsav-text mb-1">
                    Notes / Description
                  </label>
                  <input
                    id="task-desc-input"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Verify 25kVA backup for garden lighting"
                    className="w-full border px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="task-duedate-input" className="block font-extrabold text-utsav-text mb-1">
                      Due Date
                    </label>
                    <input
                      id="task-duedate-input"
                      type="date"
                      value={dueDate || computeRelativeDueDate(event.eventDate, 10)}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full border px-2.5 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="task-priority-select" className="block font-extrabold text-utsav-text mb-1">
                      Priority
                    </label>
                    <select
                      id="task-priority-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="w-full border px-2.5 py-2"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="task-category-input" className="block font-extrabold text-utsav-text mb-1">
                      Category
                    </label>
                    <input
                      id="task-category-input"
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border px-2.5 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="task-phase-select" className="block font-extrabold text-utsav-text mb-1">
                      Phase
                    </label>
                    <select
                      id="task-phase-select"
                      value={phase}
                      onChange={(e) =>
                        setPhase(e.target.value as TaskRecord["phase"])
                      }
                      className="w-full border px-2.5 py-2"
                    >
                      <option value="Early Planning">Early Planning</option>
                      <option value="Vendor & Design">Vendor & Design</option>
                      <option value="Final Countdown">Final Countdown</option>
                      <option value="Event Day">Event Day</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="utsav-btn-primary w-full !py-2.5 !text-xs">
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </form>
            </div>

            {/* Event-Day Itinerary Card */}
            <div className="utsav-card p-5 sm:p-6 space-y-3">
              <h3 className="text-sm font-extrabold text-utsav-text flex items-center gap-2">
                <Clock className="w-4 h-4 text-utsav-primary" />
                Event-Day Run-of-Show ({event.eventDate})
              </h3>
              <div className="space-y-2.5 text-xs">
                {plan.itinerary.map((slot) => (
                  <div
                    key={slot.id}
                    className="rounded-2xl bg-utsav-primary/5 p-3.5 border border-utsav-primary/12"
                  >
                    <div className="flex justify-between font-extrabold text-utsav-text">
                      <span>
                        {slot.time} — {slot.title}
                      </span>
                      <span className="utsav-num text-utsav-primary">
                        {slot.durationMinutes}m
                      </span>
                    </div>
                    <p className="text-[11px] text-utsav-muted mt-0.5 leading-relaxed">
                      {slot.notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </EventWorkspaceShell>
  );
}
