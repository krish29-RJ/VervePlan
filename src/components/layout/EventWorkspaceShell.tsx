"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  CalendarClock,
  Store,
  Users,
  Sparkles,
  Download,
  Printer,
  Calendar,
  MapPin,
  X,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Clock,
} from "lucide-react";
import { FullEventBundle } from "@/types/event";
import {
  calculateBudgetSummary,
  calculateTaskMetrics,
  daysUntilDate,
  formatMinorCurrency,
} from "@/lib/utils/currency";
import { CopilotPanel } from "@/components/ai/CopilotPanel";
import { useUtsav } from "@/context/UtsavContext";

export function EventWorkspaceShell({
  bundle,
  children,
}: {
  bundle: FullEventBundle;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { bundles } = useUtsav();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copilotDrawerOpen, setCopilotDrawerOpen] = useState(false);

  const { event, budgetCategories, expenses, tasks } = bundle;
  const daysLeft = daysUntilDate(event.eventDate);
  const budgetMetrics = calculateBudgetSummary(
    event.totalBudgetMinor,
    budgetCategories,
    expenses
  );
  const taskMetrics = calculateTaskMetrics(tasks);

  const navItems = [
    {
      label: "Overview",
      shortLabel: "Overview",
      href: `/events/${event.id}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Smart Budget",
      shortLabel: "Budget",
      href: `/events/${event.id}/budget`,
      icon: Wallet,
      meta: formatMinorCurrency(event.totalBudgetMinor, event.currency),
    },
    {
      label: "Timeline & Tasks",
      shortLabel: "Timeline",
      href: `/events/${event.id}/timeline`,
      icon: CalendarClock,
      meta: `${taskMetrics.completionPercent}%`,
    },
    {
      label: "Vendors & Quotes",
      shortLabel: "Vendors",
      href: `/events/${event.id}/vendors`,
      icon: Store,
      meta: `${bundle.vendors.length}`,
    },
    {
      label: "Guest List & RSVP",
      shortLabel: "Guests",
      href: `/events/${event.id}/guests`,
      icon: Users,
      meta: `${event.guestTarget}`,
    },
    {
      label: "AI Event Copilot",
      shortLabel: "Copilot",
      href: `/events/${event.id}/copilot`,
      icon: Sparkles,
      badge: "Replan",
    },
    {
      label: "Settings",
      shortLabel: "Settings",
      href: `/events/${event.id}/settings`,
      icon: Clock,
    },
  ];

  function handleExportJson() {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      platform: "VervePlan — Dream it. Plan it. Celebrate it.",
      event: bundle.event,
      plan: bundle.plan,
      budgetCategories: bundle.budgetCategories,
      expenses: bundle.expenses,
      vendors: bundle.vendors,
      tasks: bundle.tasks,
      guests: bundle.guests,
      appliedProposals: bundle.proposals.filter((p) => p.status === "applied"),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bundle.event.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-utsavai-plan.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrintSummary() {
    window.print();
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-4.25rem)] w-full pb-20 md:pb-6 lg:pb-0">
      {/* DESKTOP COLLAPSIBLE SIDEBAR (lg+) */}
      <aside
        aria-label="Event Workspace Sidebar"
        className={`hidden lg:flex flex-col shrink-0 border-r border-utsav-primary/15 bg-utsav-surface/90 backdrop-blur-md transition-all duration-200 no-print ${
          sidebarCollapsed ? "w-20" : "w-72 xl:w-80"
        }`}
      >
        <div className="p-4 border-b border-utsav-primary/10 flex items-center justify-between gap-2">
          {!sidebarCollapsed ? (
            <div className="flex-1 min-w-0">
              <label
                htmlFor="sidebar-event-switcher"
                className="text-[10px] font-extrabold uppercase tracking-widest text-utsav-muted block mb-1"
              >
                Active Celebration
              </label>
              <div className="relative">
                <select
                  id="sidebar-event-switcher"
                  value={event.id}
                  onChange={(e) => router.push(`/events/${e.target.value}`)}
                  className="w-full appearance-none rounded-xl border border-utsav-primary/20 bg-utsav-bg px-3 py-2 pr-8 text-xs font-extrabold text-utsav-text truncate cursor-pointer"
                >
                  {bundles.map((b) => (
                    <option key={b.event.id} value={b.event.id}>
                      {b.event.title} ({b.event.guestTarget} pax)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-utsav-primary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          ) : (
            <span className="mx-auto w-9 h-9 rounded-xl bg-utsav-primary/12 text-utsav-primary flex items-center justify-center font-extrabold text-xs">
              {event.title.slice(0, 2).toUpperCase()}
            </span>
          )}

          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-xl text-utsav-muted hover:text-utsav-primary hover:bg-utsav-primary/10 transition-colors"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Event Modules" className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={`group flex items-center justify-between rounded-2xl px-3.5 py-3 text-xs font-bold transition-all duration-150 ${
                  isActive
                    ? "bg-utsav-gradient text-white shadow-soft"
                    : "text-utsav-muted hover:text-utsav-text hover:bg-utsav-primary/10"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? "text-utsav-gold"
                        : "text-utsav-primary group-hover:scale-110 transition-transform"
                    }`}
                  />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>

                {!sidebarCollapsed && item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-utsav-coral/15 text-utsav-coral"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {!sidebarCollapsed && !item.badge && item.meta && (
                  <span
                    className={`utsav-num text-[11px] font-bold ${
                      isActive ? "text-white/90" : "text-utsav-muted"
                    }`}
                  >
                    {item.meta}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Bottom Summary & Quick Copilot Action */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-utsav-primary/10 space-y-3">
            <div className="rounded-2xl bg-utsav-bg p-3.5 border border-utsav-primary/15 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-utsav-muted">Available Funds</span>
                <span className="utsav-num font-extrabold text-emerald-600">
                  {formatMinorCurrency(
                    budgetMetrics.remainingFromTotalMinor,
                    event.currency
                  )}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-utsav-primary/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-utsav-gradient transition-all duration-300"
                  style={{ width: `${Math.min(100, taskMetrics.completionPercent)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-utsav-muted">
                <span>Checklist Ready</span>
                <span className="utsav-num font-bold text-utsav-text">
                  {taskMetrics.completedTasks}/{taskMetrics.totalTasks} tasks
                </span>
              </div>
            </div>

            {!pathname?.endsWith("/copilot") && (
              <button
                type="button"
                onClick={() => setCopilotDrawerOpen(true)}
                className="utsav-btn-primary w-full !py-2.5 !text-xs"
              >
                <MessageSquarePlus className="w-4 h-4 text-utsav-gold" />
                Open AI Copilot Drawer
              </button>
            )}
          </div>
        )}
      </aside>

      {/* MAIN WORKSPACE COLUMN (Full-width fluid on Desktop, Tablet & Android) */}
      <div className="flex-1 min-w-0 flex flex-col w-full">
        {/* Sleek Workspace Header */}
        <div className="bg-utsav-surface/85 backdrop-blur-md border-b border-utsav-primary/12 px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-5 w-full">
          <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="utsav-badge bg-utsav-primary/12 text-utsav-primary">
                  {event.eventType}
                </span>
                <span className="utsav-badge bg-utsav-gold/25 text-utsav-deep">
                  Theme: {event.theme}
                </span>
                <span className="utsav-badge bg-emerald-500/12 text-emerald-700">
                  <Clock className="w-3 h-3" />
                  {daysLeft > 0
                    ? `${daysLeft} days to go`
                    : daysLeft === 0
                    ? "Celebration Today!"
                    : "Completed"}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-utsav-text tracking-tight">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs sm:text-sm text-utsav-muted">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-utsav-primary shrink-0" />
                  {event.eventDate}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-utsav-coral shrink-0" />
                  {event.location}
                </span>
                <span className="utsav-num inline-flex items-center gap-1.5 font-bold text-utsav-text">
                  <Users className="w-4 h-4 text-utsav-primary shrink-0" />
                  {event.guestTarget} Guests
                </span>
                <span className="utsav-num inline-flex items-center gap-1.5 font-extrabold text-utsav-primary">
                  <Wallet className="w-4 h-4 shrink-0" />
                  {formatMinorCurrency(event.totalBudgetMinor, event.currency)}
                </span>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2 no-print shrink-0">
              <button
                type="button"
                onClick={handleExportJson}
                className="utsav-btn-secondary !px-3.5 !py-2 !text-xs"
              >
                <Download className="w-3.5 h-3.5 text-utsav-primary" />
                Export JSON
              </button>
              <button
                type="button"
                onClick={handlePrintSummary}
                className="utsav-btn-secondary !px-3.5 !py-2 !text-xs"
              >
                <Printer className="w-3.5 h-3.5 text-utsav-deep" />
                Print / PDF
              </button>
              {!pathname?.endsWith("/copilot") && (
                <button
                  type="button"
                  onClick={() => setCopilotDrawerOpen(true)}
                  className="lg:hidden utsav-btn-primary !px-3.5 !py-2 !text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-utsav-gold" />
                  AI Copilot
                </button>
              )}
            </div>
          </div>

          {/* TABLET HORIZONTAL MODULE BAR (Visible on md tablets, hidden on mobile <md and desktop lg+) */}
          <nav
            aria-label="Tablet Event Modules"
            className="hidden md:flex lg:hidden items-center gap-1.5 overflow-x-auto pt-4 mt-4 border-t border-utsav-primary/10 no-print"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-utsav-gradient text-white shadow-soft"
                      : "bg-utsav-primary/6 text-utsav-muted hover:text-utsav-text"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.shortLabel}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Workspace Page Body (Full-width fluid) */}
        <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
          {children}
        </div>
      </div>

      {/* ANDROID / MOBILE BOTTOM NAVIGATION BAR (< md) */}
      <nav
        aria-label="Mobile Event Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 utsav-glass border-t border-utsav-primary/15 px-1 py-1.5 grid grid-cols-7 gap-0.5 no-print"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-1 min-h-[46px] rounded-xl text-[10px] font-bold transition-colors ${
                isActive
                  ? "bg-utsav-primary text-white shadow-sm"
                  : "text-utsav-muted hover:text-utsav-text"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5 shrink-0" />
              <span className="truncate max-w-full">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>

      {/* Slide-Over AI Copilot Drawer */}
      {copilotDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end no-print"
          role="dialog"
          aria-modal="true"
          aria-label="AI Event Copilot Panel"
        >
          <div className="w-full max-w-2xl bg-utsav-bg h-full p-3 sm:p-5 flex flex-col shadow-2xl border-l border-utsav-primary/20">
            <div className="flex items-center justify-between pb-3">
              <span className="text-sm font-extrabold text-utsav-text flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-utsav-primary" />
                Live Event Copilot & Synchronized Replanner
              </span>
              <button
                type="button"
                onClick={() => setCopilotDrawerOpen(false)}
                className="p-2 rounded-xl bg-utsav-surface border border-utsav-primary/15 text-utsav-muted hover:text-utsav-text"
                aria-label="Close Copilot Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <CopilotPanel bundle={bundle} compact />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
