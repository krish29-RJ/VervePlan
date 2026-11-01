"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Wallet,
  CalendarClock,
  Store,
  Users,
  CheckCircle2,
  Wand2,
  ShieldCheck,
  HeartHandshake,
  PartyPopper,
  Building2,
  GraduationCap,
  Flame,
  SlidersHorizontal,
} from "lucide-react";
import { useUtsav } from "@/context/UtsavContext";
import { formatMinorCurrency } from "@/lib/utils/currency";

const EVENT_CATEGORIES = [
  {
    name: "Weddings & Engagements",
    icon: HeartHandshake,
    desc: "Multi-day ceremonies, mandap florals, hospitality logistics, and vendor contracts.",
    sampleBudget: "₹5L – ₹50L+",
    badge: "Core Pillar",
  },
  {
    name: "Birthdays & Milestones",
    icon: PartyPopper,
    desc: "Intimate garden parties, milestone celebrations, live counters, and acoustic sets.",
    sampleBudget: "₹25K – ₹3L",
    badge: "Core Pillar",
  },
  {
    name: "Community Celebrations",
    icon: Users,
    desc: "Neighborhood socials, cultural festivals, society galas, and charity gatherings.",
    sampleBudget: "₹30K – ₹5L",
    badge: "Core Pillar",
  },
  {
    name: "College Cultural Festivals",
    icon: GraduationCap,
    desc: "Stage rigging, battle of bands, sponsor deliverables, and crowd barricading.",
    sampleBudget: "₹1.5L – ₹15L",
    badge: "Multi-Stage",
  },
  {
    name: "Corporate Gatherings",
    icon: Building2,
    desc: "Offsites, product launches, keynote AV production, and executive catering.",
    sampleBudget: "₹1L – ₹20L",
    badge: "Executive",
  },
  {
    name: "Cultural & Festive Celebrations",
    icon: Flame,
    desc: "Diwali soirées, Navratri garba nights, community pujas, and regional feasts.",
    sampleBudget: "₹40K – ₹10L",
    badge: "Tradition-Ready",
  },
];

const ILLUSTRATIVE_TESTIMONIALS = [
  {
    quote:
      "When our guest list jumped from 50 to 80 two weeks before the birthday, VervePlan rebalanced our catering and seating layout while keeping us under ₹90,000.",
    persona: "Illustrative Host Persona — Bengaluru Garden Birthday",
    tag: "Illustrative Scenario",
  },
  {
    quote:
      "Having our Jaipur courtyard mandap budget, vendor quotes, and relative task deadlines in one workspace kept both families aligned without spreadsheet chaos.",
    persona: "Illustrative Couple Persona — Jaipur Heritage Wedding",
    tag: "Illustrative Scenario",
  },
  {
    quote:
      "The stage AV vs. hospitality budget trade-off analyzer helped our student council lock our festival line-array sound rig without overspending.",
    persona: "Illustrative Cultural Secretary — Pune College Festival",
    tag: "Illustrative Scenario",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { enterDemoMode } = useUtsav();
  const [previewMode, setPreviewMode] = useState<"before" | "after">("after");

  return (
    <div className="min-h-screen text-utsav-text">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24">
        {/* Ambient Decorative Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-36 left-1/2 -translate-x-1/2 w-[920px] h-[440px] bg-gradient-to-tr from-utsav-primary/20 via-utsav-coral/15 to-utsav-gold/20 blur-3xl rounded-full"
        />

        <div className="relative utsav-container">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-utsav-primary/20 bg-utsav-surface/90 backdrop-blur-md px-4 py-1.5 text-xs font-extrabold text-utsav-primary shadow-soft">
              <Sparkles className="w-3.5 h-3.5 text-utsav-coral" />
              <span>Celebration & Event Planner — GenAI Assistant</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-utsav-text leading-[1.1]">
              Organize Weddings, Birthdays & Community Events{" "}
              <span className="bg-gradient-to-r from-utsav-primary via-utsav-deep to-utsav-coral bg-clip-text text-transparent">
                with GenAI.
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-utsav-muted max-w-3xl mx-auto leading-relaxed font-medium">
              A GenAI-powered planning assistant that helps you organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 max-w-md sm:max-w-none mx-auto">
              <Link
                href="/events/new"
                className="utsav-btn-primary !px-8 !py-4 !text-base"
              >
                <Sparkles className="w-5 h-5 text-utsav-gold" />
                Plan My Event
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  enterDemoMode();
                  router.push("/events/demo-garden-birthday");
                }}
                className="utsav-btn-secondary !px-8 !py-4 !text-base"
              >
                Explore Demo
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-utsav-muted pt-1">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-utsav-primary" />
                Synchronized AI Replanning
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-utsav-primary" />
                Precision Minor-Unit Budgets
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-utsav-primary" />
                Instant Offline Demo Mode
              </span>
            </div>
          </div>

          {/* 5. INTERACTIVE PRODUCT PREVIEW */}
          <div className="mt-12 sm:mt-16 rounded-3xl border border-utsav-primary/20 bg-utsav-surface/95 backdrop-blur-xl shadow-glow overflow-hidden">
            {/* Window Top Bar */}
            <div className="bg-utsav-gradient text-white px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-utsav-coral" />
                  <span className="w-3 h-3 rounded-full bg-utsav-gold" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-extrabold tracking-wide text-white/95 truncate">
                  INTERACTIVE REPLANNING PREVIEW — Bengaluru Garden Birthday
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPreviewMode("before")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    previewMode === "before"
                      ? "bg-white text-utsav-deep shadow-xs"
                      : "text-white/85 hover:text-white"
                  }`}
                >
                  Original (50 Pax · ₹75,000)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("after")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    previewMode === "after"
                      ? "bg-utsav-gold text-utsav-text shadow-xs"
                      : "text-white/85 hover:text-white"
                  }`}
                >
                  AI Replanned (80 Pax · ₹88,500)
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gradient-to-b from-utsav-surface to-utsav-bg/60">
              {/* Left 7 Cols: KPIs & Budget Allocation Bars */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-utsav-primary">
                      Theme: Sunset Garden · Outdoor Courtyard
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-utsav-text mt-0.5">
                      Elegant Garden Birthday — Bengaluru
                    </h2>
                  </div>
                  <Link
                    href="/events/demo-garden-birthday"
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-utsav-primary hover:underline"
                  >
                    Open Live Workspace
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="utsav-card p-4 bg-utsav-bg/80">
                    <span className="text-xs text-utsav-muted font-bold">Guest Capacity</span>
                    <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-text mt-1">
                      {previewMode === "before" ? "50 Guests" : "80 Guests"}
                    </p>
                    <span className="text-[11px] text-emerald-600 font-bold">
                      {previewMode === "before"
                        ? "5 Banquet Rounds"
                        : "Hybrid Banquet + Cocktail"}
                    </span>
                  </div>
                  <div className="utsav-card p-4 bg-utsav-bg/80">
                    <span className="text-xs text-utsav-muted font-bold">Planned Budget</span>
                    <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-primary mt-1">
                      {previewMode === "before"
                        ? formatMinorCurrency(7500000, "INR")
                        : formatMinorCurrency(8850000, "INR")}
                    </p>
                    <span className="text-[11px] text-utsav-muted font-semibold">
                      {previewMode === "before" ? "Cap: ₹75,000" : "Under ₹90,000 limit"}
                    </span>
                  </div>
                  <div className="utsav-card p-4 bg-utsav-bg/80">
                    <span className="text-xs text-utsav-muted font-bold">Catering Share</span>
                    <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-text mt-1">
                      {previewMode === "before"
                        ? formatMinorCurrency(2500000, "INR")
                        : formatMinorCurrency(3680000, "INR")}
                    </p>
                    <span className="text-[11px] text-utsav-coral font-bold">
                      {previewMode === "before" ? "₹500 / plate" : "₹460 / plate (volume tier)"}
                    </span>
                  </div>
                </div>

                {/* Synchronized Category Bars */}
                <div className="utsav-card p-5 space-y-3.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-utsav-text">
                    <span>Synchronized Budget Breakdown (Illustrative Estimates)</span>
                    <span className="utsav-num text-utsav-primary">
                      {previewMode === "before" ? "100% of ₹75,000" : "100% of ₹88,500"}
                    </span>
                  </div>
                  {[
                    {
                      name: "Catering & Live Counters",
                      amount: previewMode === "before" ? 2500000 : 3680000,
                      pct: previewMode === "before" ? 33 : 42,
                      color: "bg-utsav-primary",
                    },
                    {
                      name: "Venue & Courtyard Lawn",
                      amount: previewMode === "before" ? 1800000 : 2000000,
                      pct: previewMode === "before" ? 24 : 23,
                      color: "bg-utsav-deep",
                    },
                    {
                      name: "Sunset Garden Decor & Festoon Lights",
                      amount: previewMode === "before" ? 1100000 : 1000000,
                      pct: previewMode === "before" ? 15 : 11,
                      color: "bg-utsav-coral",
                    },
                    {
                      name: "Candid Photography & Acoustic Music",
                      amount: previewMode === "before" ? 1300000 : 1300000,
                      pct: previewMode === "before" ? 17 : 15,
                      color: "bg-utsav-gold",
                    },
                    {
                      name: "Invitations, Favors & Contingency",
                      amount: previewMode === "before" ? 800000 : 870000,
                      pct: previewMode === "before" ? 11 : 9,
                      color: "bg-emerald-500",
                    },
                  ].map((row) => (
                    <div key={row.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-utsav-text">{row.name}</span>
                        <span className="utsav-num font-extrabold text-utsav-text">
                          {formatMinorCurrency(row.amount, "INR")} ({row.pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-utsav-primary/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${row.color}`}
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right 5 Cols: Flagship AI Replanning Copilot Card */}
              <div className="lg:col-span-5 rounded-3xl border-2 border-utsav-primary/20 bg-utsav-bg/90 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="utsav-badge bg-utsav-gradient text-white shadow-soft">
                      <Wand2 className="w-3.5 h-3.5 text-utsav-gold" />
                      Flagship AI Replanning Engine
                    </span>
                    <span className="text-[11px] font-bold text-utsav-muted">
                      Transactional Diff
                    </span>
                  </div>

                  <div className="utsav-card p-4 text-xs">
                    <p className="font-extrabold text-utsav-primary mb-1">Host Prompt:</p>
                    <p className="italic text-utsav-text font-medium leading-relaxed">
                      &ldquo;Make this suitable for 80 guests while keeping the total budget below ₹90,000.&rdquo;
                    </p>
                  </div>

                  <div className="utsav-card p-4 space-y-2.5 text-xs">
                    <p className="font-extrabold text-utsav-text">
                      Synchronized Copilot Proposal:
                    </p>
                    <ul className="space-y-2 text-utsav-muted leading-relaxed">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-utsav-text">Catering:</strong> ₹25,000 →{" "}
                          <strong className="text-utsav-primary">₹36,800</strong> (80 plates at volume tier + dual-sided buffet island)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-utsav-text">Seating Layout:</strong> Hybrid 52 seated + 28 high-top cocktail spots so you don&apos;t outgrow the garden lawn
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-utsav-text">Checklist Updated:</strong> Added 3 high-priority tasks for 80-guest plate lock & table clusters
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <Link
                  href="/events/demo-garden-birthday/copilot"
                  className="utsav-btn-primary w-full !py-3.5 !text-xs"
                >
                  <Sparkles className="w-4 h-4 text-utsav-gold" />
                  Test This Live in the AI Copilot
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW UTSAVAI WORKS */}
      <section className="py-16 sm:py-20 bg-utsav-surface/75 border-y border-utsav-primary/10">
        <div className="utsav-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="utsav-badge bg-utsav-primary/10 text-utsav-primary">
              How VervePlan Works
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-utsav-text mt-3">
              From celebration vision to synchronized execution
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Select Celebration & Budget",
                desc: "Choose weddings, birthdays, or community events. Set date, city, guest target, and budget with 1-click sample auto-fill.",
              },
              {
                step: "02",
                title: "Personalize with Quick Ideas & Chips",
                desc: "Pick curated themes, cohesive color palettes, priority tags, and guest preferences without filling lengthy forms.",
              },
              {
                step: "03",
                title: "Instant Budgets, Timelines & Checklists",
                desc: "GenAI instantly generates minor-unit verified budget allocations, schedules, vendor checklists, and personalized ideas.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="utsav-card utsav-card-interactive p-6 sm:p-7 space-y-3"
              >
                <span className="inline-block rounded-xl bg-utsav-gradient px-3.5 py-1 text-xs font-extrabold text-white shadow-soft">
                  Step {item.step}
                </span>
                <h3 className="text-lg font-extrabold text-utsav-text">{item.title}</h3>
                <p className="text-sm text-utsav-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURES OVERVIEW */}
      <section className="py-16 sm:py-20">
        <div className="utsav-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="utsav-badge bg-utsav-primary/10 text-utsav-primary">
              Complete Planning Suite
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-utsav-text mt-3">
              Designed like a modern SaaS command center
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: SlidersHorizontal,
                title: "Synchronized Replanning Engine",
                desc: "Proposes coordinated updates across catering, seating, decor, vendors, and tasks with before-and-after confirmation cards.",
              },
              {
                icon: Wallet,
                title: "Minor-Unit Smart Budget & Optimizer",
                desc: "Tracks AI estimates, vendor quotes, and confirmed expenses in integer minor units with Recharts visual analytics.",
              },
              {
                icon: CalendarClock,
                title: "Intelligent Timeline & Itinerary",
                desc: "Schedules preparation milestones relative to your event date, flags overdue tasks, and organizes your event-day hour-by-hour flow.",
              },
              {
                icon: Store,
                title: "Vendor CRM & Negotiation Assistant",
                desc: "Compare quotes, track booking/payment statuses, and generate custom vendor inquiry messages and contract checklists.",
              },
              {
                icon: Users,
                title: "Guest & Dietary Analytics",
                desc: "Group invitees by family, friends, or VIPs; track RSVPs and plus-ones; and monitor vegetarian, Jain, vegan, or nut-free counts.",
              },
              {
                icon: ShieldCheck,
                title: "Private, Reliable & Export-Ready",
                desc: "Protected by Supabase Row Level Security when connected, with offline Demo Mode and 1-click JSON & printer-friendly exports.",
              },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="utsav-card utsav-card-interactive p-6 space-y-3"
                >
                  <div className="w-11 h-11 rounded-2xl bg-utsav-primary/12 text-utsav-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-utsav-text">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-utsav-muted leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. SUPPORTED EVENT CATEGORIES */}
      <section className="py-16 sm:py-20 bg-utsav-surface/75 border-t border-utsav-primary/10">
        <div className="utsav-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="utsav-badge bg-utsav-primary/10 text-utsav-primary">
                Tailored For Every Milestone
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-utsav-text mt-3">
                Supported Celebration Categories
              </h2>
            </div>
            <Link
              href="/events/new"
              className="inline-flex items-center gap-1.5 text-sm font-extrabold text-utsav-primary hover:underline"
            >
              Launch Guided Event Wizard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EVENT_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.name}
                  className="utsav-card utsav-card-interactive p-6 flex flex-col justify-between space-y-4 bg-gradient-to-br from-utsav-surface to-utsav-primary/5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-utsav-gradient text-white shadow-soft flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="utsav-badge bg-utsav-gold/25 text-utsav-deep">
                        {cat.badge}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-utsav-text">{cat.name}</h3>
                    <p className="text-xs sm:text-sm text-utsav-muted leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-utsav-primary/10 text-xs">
                    <span className="utsav-num font-bold text-utsav-deep">
                      Scale: {cat.sampleBudget}
                    </span>
                    <Link
                      href="/events/new"
                      className="font-extrabold text-utsav-primary hover:underline"
                    >
                      Plan Now →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. ILLUSTRATIVE TESTIMONIALS */}
      <section className="py-16 sm:py-20 border-t border-utsav-primary/10">
        <div className="utsav-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="utsav-badge bg-utsav-gold/30 text-utsav-deep">
              Illustrative Use-Case Scenarios
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-utsav-text mt-3">
              How hosts use VervePlan to stay on budget
            </h2>
            <p className="text-xs text-utsav-muted mt-1.5">
              Note: The quotes below are illustrative user-journey scenarios demonstrating VervePlan capabilities, not fabricated customer reviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ILLUSTRATIVE_TESTIMONIALS.map((item, i) => (
              <div
                key={i}
                className="utsav-card p-6 flex flex-col justify-between space-y-4"
              >
                <p className="text-sm text-utsav-text italic leading-relaxed font-medium">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div className="pt-3 border-t border-utsav-primary/10 flex items-center justify-between gap-2 text-xs">
                  <span className="font-extrabold text-utsav-primary">
                    {item.persona}
                  </span>
                  <span className="utsav-badge bg-utsav-primary/8 text-utsav-muted !text-[10px]">
                    {item.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FINAL CALL TO ACTION */}
      <section className="py-16 bg-utsav-surface/80">
        <div className="utsav-container">
          <div className="rounded-3xl bg-utsav-gradient p-8 sm:p-12 text-center text-white shadow-glow space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Ready to transform your celebration idea into an organized plan?
            </h2>
            <p className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto font-medium">
              Start with our guided 5-step event wizard or jump straight into the pre-loaded Bengaluru, Jaipur, and Pune demo celebrations.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 pt-2 max-w-md sm:max-w-none mx-auto">
              <Link
                href="/events/new"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-extrabold text-utsav-deep shadow-lg hover:bg-utsav-bg transition-colors"
              >
                <Sparkles className="w-4 h-4 text-utsav-primary" />
                Plan My Event
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-extrabold text-white hover:bg-white/20 transition-colors"
              >
                Open Command Center
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-[#1A152B] text-white/80 py-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-utsav-gold" />
            <span className="font-extrabold text-white">VervePlan</span>
            <span>— Dream it. Plan it. Celebrate it.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 font-semibold">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Command Center
            </Link>
            <Link href="/events/new" className="hover:text-white transition-colors">
              Create Event
            </Link>
            <Link
              href="/events/demo-garden-birthday"
              className="hover:text-white transition-colors"
            >
              Bengaluru Birthday Demo
            </Link>
            <Link
              href="/events/demo-royal-wedding"
              className="hover:text-white transition-colors"
            >
              Jaipur Wedding Demo
            </Link>
            <Link
              href="/events/demo-college-fest"
              className="hover:text-white transition-colors"
            >
              Pune College Fest Demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
