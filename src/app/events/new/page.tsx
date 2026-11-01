"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HeartHandshake,
  Cake,
  Users,
  PartyPopper,
  Gem,
  Building2,
  GraduationCap,
  Flame,
  Baby,
  Wand2,
  Loader2,
  Wallet,
  CalendarClock,
  Store,
  AlertCircle,
  Lightbulb,
  Palette,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  CurrencyCode,
  EventType,
  IndoorOutdoorPreference,
} from "@/types/event";
import { useUtsav } from "@/context/UtsavContext";
import { formatMinorCurrency, getFutureDateIso, toMinorUnits } from "@/lib/utils/currency";
import { GeneratedPlanResponse } from "@/lib/ai/generate-plan";

const EVENT_TYPE_CARDS: {
  type: EventType;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  defaultTheme: string;
  defaultBudgetMajor: number;
  defaultGuests: number;
  sampleTitle: string;
  sampleVenue: string;
  sampleDuration: string;
  sampleDescription: string;
  sampleAtmosphere: string;
  sampleFood: string;
  themePresets: string[];
}[] = [
  {
    type: "Wedding",
    icon: HeartHandshake,
    tagline: "Multi-day ceremonies, floral mandaps & royal hospitality",
    defaultTheme: "Royal Heritage",
    defaultBudgetMajor: 1200000,
    defaultGuests: 250,
    sampleTitle: "Dream Wedding Celebration",
    sampleVenue: "Heritage Courtyard & Banquet Lawns",
    sampleDuration: "2 Days (Haldi, Sangeet & Wedding)",
    sampleDescription:
      "A heritage courtyard wedding blending traditional marigold florals, live folk ensembles, and royal multi-cuisine hospitality.",
    sampleAtmosphere: "Regal, welcoming, timeless cultural celebration",
    sampleFood: "Royal Rajasthani thali & multi-cuisine live counters",
    themePresets: [
      "Royal Heritage",
      "Sunset Botanical Soirée",
      "Pastel Floral Haven",
      "Minimalist Modern Elegance",
      "Traditional Marigold & Brass",
    ],
  },
  {
    type: "Birthday",
    icon: Cake,
    tagline: "Milestone garden parties, acoustic evenings & curated grazing",
    defaultTheme: "Sunset Garden",
    defaultBudgetMajor: 75000,
    defaultGuests: 50,
    sampleTitle: "Elegant Garden Birthday",
    sampleVenue: "Outdoor Garden Terrace",
    sampleDuration: "5 hours (5:00 PM – 10:00 PM)",
    sampleDescription:
      "An intimate outdoor birthday celebration with warm string lights, acoustic music, and curated regional grazing.",
    sampleAtmosphere: "Warm, botanical, acoustic sunset evening",
    sampleFood: "Contemporary vegetarian & fusion live counters with artisanal cake",
    themePresets: [
      "Sunset Garden",
      "Neon Glow Party",
      "Acoustic Sunset Soirée",
      "Boho Chic Lawn",
      "Retro Disco Fiesta",
    ],
  },
  {
    type: "Community Celebration",
    icon: Users,
    tagline: "Neighborhood gatherings, society socials & cultural galas",
    defaultTheme: "Warm Courtyard Fiesta",
    defaultBudgetMajor: 100000,
    defaultGuests: 150,
    sampleTitle: "Neighborhood Autumn Social & Cultural Night",
    sampleVenue: "Society Clubhouse & Central Lawn",
    sampleDuration: "5 hours (5:00 PM – 10:00 PM)",
    sampleDescription:
      "An inclusive community celebration with talent showcases, children's game stalls, and regional food counters.",
    sampleAtmosphere: "Welcoming, lively, family-friendly community spirit",
    sampleFood: "Regional street-food counters & family buffet",
    themePresets: [
      "Warm Courtyard Fiesta",
      "Cultural Mela & Carnival",
      "Open-Air Autumn Gala",
      "Festive Brass & Marigold",
      "Community Harvest Social",
    ],
  },
  {
    type: "Anniversary",
    icon: PartyPopper,
    tagline: "Silver & golden jubilees, family tributes & sit-down dinners",
    defaultTheme: "Gilded Starlight",
    defaultBudgetMajor: 150000,
    defaultGuests: 80,
    sampleTitle: "25th Silver Jubilee Family Dinner",
    sampleVenue: "Boutique Banquet Hall & Terrace",
    sampleDuration: "4 hours (7:00 PM – 11:00 PM)",
    sampleDescription:
      "A warm family tribute evening with a retrospective photo walkway, nostalgic melodies, and a sit-down dinner.",
    sampleAtmosphere: "Nostalgic, refined, warm family gathering",
    sampleFood: "Classic Indian banquet spread with sugar-free & Jain options",
    themePresets: [
      "Gilded Starlight",
      "Silver Nostalgia",
      "Candlelit Terrace Soirée",
      "Timeless Elegance",
    ],
  },
  {
    type: "Engagement",
    icon: Gem,
    tagline: "Ring ceremonies, twilight garden toasts & couple portraits",
    defaultTheme: "Sunset Botanical Soirée",
    defaultBudgetMajor: 250000,
    defaultGuests: 100,
    sampleTitle: "Twilight Garden Engagement Soirée",
    sampleVenue: "Boutique Glasshouse & Lawn",
    sampleDuration: "5 hours (6:00 PM – 11:00 PM)",
    sampleDescription:
      "An elegant evening ring ceremony under warm festoon lighting with acoustic melodies and grazing tables.",
    sampleAtmosphere: "Romantic, intimate, golden-hour soirée",
    sampleFood: "Artisanal small plates, chaat bar & dessert lounge",
    themePresets: [
      "Sunset Botanical Soirée",
      "Pastel Glasshouse",
      "Romantic Fairy-Light Garden",
      "Modern Minimalist",
    ],
  },
  {
    type: "College Festival",
    icon: GraduationCap,
    tagline: "Battle of bands, stage truss rigging, food stalls & sponsors",
    defaultTheme: "Neon Carnival",
    defaultBudgetMajor: 300000,
    defaultGuests: 500,
    sampleTitle: "College Cultural Festival — Aarohan",
    sampleVenue: "Open-Air Campus Amphitheatre",
    sampleDuration: "10 hours (11:00 AM – 9:00 PM)",
    sampleDescription:
      "High-energy inter-collegiate cultural and music festival with battle of bands, street art, and food stalls.",
    sampleAtmosphere: "Electric, youthful, creative festival vibe",
    sampleFood: "Campus food stalls, grab-and-go wraps, cold brew & mocktail bars",
    themePresets: [
      "Neon Carnival",
      "Retro Cyberpunk",
      "Acoustic Amp Festival",
      "Street Pulse",
    ],
  },
  {
    type: "Corporate Event",
    icon: Building2,
    tagline: "Product launches, leadership offsites, keynotes & mixers",
    defaultTheme: "Executive Horizon",
    defaultBudgetMajor: 400000,
    defaultGuests: 120,
    sampleTitle: "Annual Product Keynote & Leadership Mixer",
    sampleVenue: "Contemporary Hotel Ballroom",
    sampleDuration: "6 hours (3:00 PM – 9:00 PM)",
    sampleDescription:
      "A polished leadership summit with LED stage production, breakout networking lounges, and gourmet high-tea.",
    sampleAtmosphere: "Modern, Crisp, Inspiring & Collaborative",
    sampleFood: "Gourmet coffee bar, finger-food networking platters & buffet dinner",
    themePresets: [
      "Executive Horizon",
      "Modern Tech Showcase",
      "Sleek Minimalist Lounge",
      "Cocktail Networking Soirée",
    ],
  },
  {
    type: "Cultural / Religious Festival",
    icon: Flame,
    tagline: "Diwali melas, Navratri nights, community pujas & feasts",
    defaultTheme: "Festive Marigold & Brass",
    defaultBudgetMajor: 200000,
    defaultGuests: 200,
    sampleTitle: "Grand Diwali Courtyard Milan",
    sampleVenue: "Community Cultural Grounds",
    sampleDuration: "6 hours (5:00 PM – 11:00 PM)",
    sampleDescription:
      "A traditional festive gathering adorned with brass diyas, marigold torans, classical music, and regional mithai counters.",
    sampleAtmosphere: "Joyous, auspicious, vibrant & traditional",
    sampleFood: "Traditional festive sattvik feast & live mithai counter",
    themePresets: [
      "Festive Marigold & Brass",
      "Diwali Diya Garden",
      "Royal Courtyard Milan",
      "Vibrant Folk Mela",
    ],
  },
  {
    type: "Baby Shower",
    icon: Baby,
    tagline: "Godh bharai, pastel afternoon high-tea & family games",
    defaultTheme: "Pastel Cloud & Botanicals",
    defaultBudgetMajor: 65000,
    defaultGuests: 45,
    sampleTitle: "Sunlit Pastel Baby Shower & High-Tea",
    sampleVenue: "Boutique Indoor Café & Veranda",
    sampleDuration: "4 hours (11:00 AM – 3:00 PM)",
    sampleDescription:
      "A gentle afternoon celebration with pastel florals, interactive family games, and a curated brunch spread.",
    sampleAtmosphere: "Soft, joyful, sunlit & comfortable",
    sampleFood: "Artisanal high-tea grazing, chaat bites & custom dessert table",
    themePresets: [
      "Pastel Cloud & Botanicals",
      "Sunlit High-Tea",
      "Storybook Garden",
      "Warm Bohemian Nursery",
    ],
  },
  {
    type: "Custom Event",
    icon: Wand2,
    tagline: "Housewarmings, graduations, reunions & bespoke concepts",
    defaultTheme: "Modern Celebration",
    defaultBudgetMajor: 100000,
    defaultGuests: 60,
    sampleTitle: "Milestone Reunion & Terrace Soirée",
    sampleVenue: "Rooftop Lounge & Terrace",
    sampleDuration: "5 hours (6:00 PM – 11:00 PM)",
    sampleDescription:
      "A bespoke celebration tailored to close friends and family with curated music, warm lighting, and interactive dining.",
    sampleAtmosphere: "Warm, personalized, modern & celebratory",
    sampleFood: "Multi-cuisine curated buffet & live appetizer station",
    themePresets: [
      "Modern Celebration",
      "Bespoke Starlight Terrace",
      "Rustic Chic Backyard",
      "Contemporary Fusion",
    ],
  },
];

const COLOR_PRESETS = [
  {
    name: "Verve Signature",
    colors: ["#7456E8", "#FF8075", "#F4C56A", "#241D39"],
  },
  {
    name: "Sunset Terracotta",
    colors: ["#FF8075", "#F4C56A", "#4934A6", "#FAF8FF"],
  },
  {
    name: "Royal Jaipur",
    colors: ["#4934A6", "#F4C56A", "#7456E8", "#241D39"],
  },
  {
    name: "Emerald Courtyard",
    colors: ["#059669", "#F4C56A", "#7456E8", "#241D39"],
  },
];

const PRIORITY_OPTIONS = [
  "Catering & Food",
  "Decor & Ambiance",
  "Photography & Video",
  "Music & DJ",
  "Guest Experience",
  "Budget Optimization",
  "Stage & Lighting",
];

const PREFERENCE_OPTIONS = [
  "Vegetarian & Jain Options",
  "Multi-Cuisine Live Counters",
  "Cocktail & Mocktail Bar",
  "Artisanal Dessert Station",
  "Step-Free & Elder Seating",
  "Kids-Friendly Zone",
];

export default function CreateEventWizardPage() {
  const router = useRouter();
  const { createEventFromGeneratedPlan } = useUtsav();

  // Streamlined 3-step flow:
  // Step 1: Celebration & Budget (Event type, Title, Date, Location, Guests, Budget)
  // Step 2: Personalized Ideas & Vibe (Theme chips, color, priority tags, preferences)
  // Step 3: GenAI Plan Review & Launch (Budgets, Timelines, Vendor Checklist, Ideas)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [eventType, setEventType] = useState<EventType>("Wedding");

  // Step 1 Core Fields
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [guestTarget, setGuestTarget] = useState("");
  const [budgetMajor, setBudgetMajor] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [indoorOutdoor, setIndoorOutdoor] = useState<IndoorOutdoorPreference>("Outdoor");
  const [duration, setDuration] = useState("");
  const [venuePreference, setVenuePreference] = useState("");
  const [description, setDescription] = useState("");
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // Step 2 Personalization Fields (Preloaded with smart defaults)
  const [theme, setTheme] = useState("");
  const [customThemeMode, setCustomThemeMode] = useState(false);
  const [colorPalette, setColorPalette] = useState<string[]>([
    "#7456E8",
    "#FF8075",
    "#F4C56A",
    "#241D39",
  ]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([
    "Catering & Food",
    "Decor & Ambiance",
    "Guest Experience",
  ]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([
    "Vegetarian & Jain Options",
    "Multi-Cuisine Live Counters",
  ]);
  const [customIdeas, setCustomIdeas] = useState("");
  const [avoidText, setAvoidText] = useState("");

  // Step 3 Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [planningStageIndex, setPlanningStageIndex] = useState(0);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeCategoryCard =
    EVENT_TYPE_CARDS.find((c) => c.type === eventType) || EVENT_TYPE_CARDS[0];

  const PLANNING_STAGES = [
    "Allocating integer minor-unit budgets across venue, catering, decor & vendors...",
    "Organizing dynamic event timeline & countdown preparation milestones...",
    "Structuring vendor checklists with priority tiers & vetting questions...",
    "Curating personalized ideas, cohesive themes & guest experience...",
    "Finalizing your synchronized event workspace...",
  ];

  function handleSelectTypeCard(type: EventType) {
    setEventType(type);
    const card = EVENT_TYPE_CARDS.find((c) => c.type === type) || EVENT_TYPE_CARDS[0];
    setTheme(card.defaultTheme);
    setStep1Errors({});
  }

  function handleAutoFillSample() {
    setTitle(activeCategoryCard.sampleTitle);
    setEventDate(getFutureDateIso(30));
    setLocation("Bengaluru, Karnataka");
    setGuestTarget(String(activeCategoryCard.defaultGuests));
    setBudgetMajor(String(activeCategoryCard.defaultBudgetMajor));
    setCurrency("INR");
    setIndoorOutdoor("Outdoor");
    setDuration(activeCategoryCard.sampleDuration);
    setVenuePreference(activeCategoryCard.sampleVenue);
    setDescription(activeCategoryCard.sampleDescription);
    setTheme(activeCategoryCard.defaultTheme);
    setStep1Errors({});
  }

  function togglePriority(priority: string) {
    setSelectedPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  }

  function togglePreference(pref: string) {
    setSelectedPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  }

  function validateStep1(): boolean {
    const errors: Record<string, string> = {};

    if (!title.trim() && !activeCategoryCard.sampleTitle) {
      errors.title = "Please enter an Event Title.";
    }

    const resolvedDate = eventDate.trim() || getFutureDateIso(30);
    if (!resolvedDate) {
      errors.eventDate = "Please select an Event Date.";
    }

    const resolvedLocation = location.trim() || "Bengaluru, Karnataka";
    if (!resolvedLocation) {
      errors.location = "Please enter a City or Location.";
    }

    const parsedGuests = Number(guestTarget) || activeCategoryCard.defaultGuests;
    if (parsedGuests < 1) {
      errors.guestTarget = "Please enter number of guests.";
    }

    const parsedBudget = Number(budgetMajor) || activeCategoryCard.defaultBudgetMajor;
    if (parsedBudget < 100) {
      errors.budgetMajor = `Please enter a valid budget in ${currency}.`;
    }

    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleContinueToStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validateStep1()) {
      return;
    }
    if (!theme) {
      setTheme(activeCategoryCard.defaultTheme);
    }
    setStep(2);
  }

  function buildValidatedPayload() {
    const resolvedTheme = theme.trim() || activeCategoryCard.defaultTheme;
    const resolvedGuests = Math.max(
      1,
      Number(guestTarget) || activeCategoryCard.defaultGuests
    );
    const resolvedBudgetMajor = Math.max(
      100,
      Number(budgetMajor) || activeCategoryCard.defaultBudgetMajor
    );

    const atmosphereText = `${resolvedTheme} celebration prioritizing ${
      selectedPriorities.join(", ") || "guest hospitality"
    }`;
    const foodText =
      selectedPreferences.length > 0
        ? selectedPreferences.join(", ")
        : activeCategoryCard.sampleFood;

    return {
      title: title.trim() || activeCategoryCard.sampleTitle,
      eventType,
      description: description.trim() || activeCategoryCard.sampleDescription,
      eventDate: eventDate.trim() || getFutureDateIso(30),
      location: location.trim() || "Bengaluru, Karnataka",
      guestTarget: resolvedGuests,
      totalBudgetMinor: toMinorUnits(resolvedBudgetMajor),
      currency,
      theme: resolvedTheme,
      preferences: {
        atmosphere: atmosphereText,
        venuePreference: venuePreference.trim() || activeCategoryCard.sampleVenue,
        indoorOutdoor,
        duration: duration.trim() || activeCategoryCard.sampleDuration,
        colorPalette,
        foodPreferences: foodText,
        dietaryRequirements:
          selectedPreferences
            .filter((p) => p.includes("Vegetarian") || p.includes("Jain"))
            .join(", ") || "Vegetarian, Jain & allergy-safe options",
        entertainmentPreferences: selectedPriorities.includes("Music & DJ")
          ? "Live DJ and curated playlist"
          : "Curated ambient soundscape",
        accessibilityRequirements: selectedPreferences.includes("Step-Free & Elder Seating")
          ? "Step-free ramp access and reserved seating"
          : "Standard accessibility",
        traditions: customIdeas.trim(),
        priorities:
          selectedPriorities.length > 0
            ? selectedPriorities
            : ["Catering & Food", "Decor & Ambiance", "Guest Experience"],
        avoid: avoidText.trim()
          ? avoidText
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : ["Single-use plastic decor"],
      },
    };
  }

  async function handleGeneratePlan(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    setIsGenerating(true);
    setPlanningStageIndex(0);

    try {
      const payload = buildValidatedPayload();

      setPlanningStageIndex(1);
      const res = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setPlanningStageIndex(2);
      const data = await res.json();
      if (!res.ok || !data.plan) {
        throw new Error(data.error || "Failed to generate event plan.");
      }

      setPlanningStageIndex(4);
      setGeneratedPlan(data.plan);
      setIsGenerating(false);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate plan.");
      setIsGenerating(false);
      setStep(2);
    }
  }

  function handleSaveAndOpenWorkspace() {
    if (!generatedPlan) return;
    const payload = buildValidatedPayload();
    const created = createEventFromGeneratedPlan(payload, generatedPlan);
    router.push(`/events/${created.event.id}`);
  }

  return (
    <div className="utsav-container py-6 sm:py-8 space-y-6">
      {/* Header Banner: Concise, Problem Statement Aligned */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-utsav-primary/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-utsav-primary/10 text-utsav-primary text-xs font-extrabold mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-utsav-gold" />
            Celebration & Event Planner
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-utsav-text">
            Plan with GenAI
          </h1>
          <p className="text-xs sm:text-sm text-utsav-muted font-medium mt-0.5">
            Organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAutoFillSample}
          className="utsav-btn-secondary !px-4 !py-2 text-xs self-start sm:self-auto shrink-0"
          title="Instantly prefill sample celebration data for fast testing"
        >
          <Sparkles className="w-3.5 h-3.5 text-utsav-gold" />
          Auto-Fill Sample Data
        </button>
      </div>

      {/* Streamlined Stepper */}
      <div className="utsav-card p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          {[
            { num: 1, label: "1. Celebration & Budget" },
            { num: 2, label: "2. Personalized Ideas & Vibe" },
            { num: 3, label: "3. GenAI Plan & Checklist" },
          ].map((s) => {
            const active = step === s.num;
            const completed = step > s.num;
            return (
              <div
                key={s.num}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                  active
                    ? "bg-utsav-gradient text-white shadow-soft"
                    : completed
                    ? "bg-emerald-500/12 text-emerald-700"
                    : "text-utsav-muted bg-utsav-primary/5"
                }`}
              >
                {completed ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : null}
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-utsav-coral/15 border border-utsav-coral/35 p-4 text-xs font-extrabold text-utsav-text flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-utsav-coral shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: CELEBRATION & BUDGET (Concise & Fast) */}
      {step === 1 && (
        <form onSubmit={handleContinueToStep2} noValidate className="utsav-card p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-utsav-text">
              1. What kind of celebration are you organizing?
            </h2>
            <p className="text-xs text-utsav-muted font-medium mt-1">
              Select one of the 3 primary celebration types or choose another occasion.
            </p>
          </div>

          {/* 3 Core Highlighted Event Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {[
              {
                type: "Wedding" as EventType,
                title: "Weddings",
                icon: HeartHandshake,
                tagline: "Multi-day ceremonies, mandap florals & royal hospitality",
                sample: "₹12L · 250 Guests",
              },
              {
                type: "Birthday" as EventType,
                title: "Birthdays",
                icon: Cake,
                tagline: "Milestone parties, acoustic evenings & curated grazing",
                sample: "₹75K · 50 Guests",
              },
              {
                type: "Community Celebration" as EventType,
                title: "Community Events",
                icon: Users,
                tagline: "Society socials, cultural festivals & neighborhood galas",
                sample: "₹1L · 150 Guests",
              },
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = eventType === cat.type;
              return (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => handleSelectTypeCard(cat.type)}
                  className={`text-left rounded-2xl p-4 sm:p-5 border-2 transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? "border-utsav-primary bg-utsav-primary/10 shadow-soft"
                      : "border-utsav-primary/12 hover:border-utsav-primary/35 bg-utsav-surface"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-utsav-gradient text-white shadow-soft"
                            : "bg-utsav-primary/10 text-utsav-primary"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-utsav-primary" />
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-utsav-text">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-utsav-muted leading-relaxed">
                      {cat.tagline}
                    </p>
                  </div>
                  <div className="text-[11px] font-bold text-utsav-primary/80 pt-2 border-t border-utsav-primary/10">
                    Typical: {cat.sample}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Compact Selector for Other Celebration Occasions */}
          <div className="pt-2">
            <label htmlFor="evt-other-type" className="block text-xs font-bold text-utsav-muted mb-1.5">
              Or pick another celebration type:
            </label>
            <select
              id="evt-other-type"
              value={eventType}
              onChange={(e) => handleSelectTypeCard(e.target.value as EventType)}
              className="w-full sm:w-80 border px-3 py-2 text-xs rounded-xl font-bold bg-utsav-surface text-utsav-text"
            >
              <option value="Wedding">Wedding</option>
              <option value="Birthday">Birthday</option>
              <option value="Community Celebration">Community Celebration</option>
              <option value="Anniversary">Anniversary</option>
              <option value="Engagement">Engagement</option>
              <option value="College Festival">College Festival</option>
              <option value="Corporate Event">Corporate Event</option>
              <option value="Cultural / Religious Festival">Cultural / Religious Festival</option>
              <option value="Baby Shower">Baby Shower</option>
              <option value="Custom Event">Custom Event</option>
            </select>
          </div>

          {/* Core Event Scale & Details (Clean 2-Column Grid) */}
          <div className="pt-4 border-t border-utsav-primary/10 space-y-4">
            <h3 className="text-sm font-extrabold text-utsav-text">
              Core Details & Scale
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Event Title */}
              <div>
                <label
                  htmlFor="evt-title"
                  className="block text-xs font-extrabold text-utsav-text mb-1"
                >
                  Event Title
                </label>
                <input
                  id="evt-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`e.g., ${activeCategoryCard.sampleTitle}`}
                  className="w-full border px-3.5 py-2 text-sm rounded-xl placeholder:text-utsav-muted/50"
                />
              </div>

              {/* Event Date */}
              <div>
                <label
                  htmlFor="evt-date"
                  className="block text-xs font-extrabold text-utsav-text mb-1"
                >
                  Date
                </label>
                <input
                  id="evt-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full border px-3.5 py-2 text-sm rounded-xl"
                />
              </div>

              {/* Location */}
              <div>
                <label
                  htmlFor="evt-location"
                  className="block text-xs font-extrabold text-utsav-text mb-1"
                >
                  City & Area
                </label>
                <input
                  id="evt-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Bengaluru, Karnataka"
                  className="w-full border px-3.5 py-2 text-sm rounded-xl placeholder:text-utsav-muted/50"
                />
              </div>

              {/* Expected Guests */}
              <div>
                <label
                  htmlFor="evt-guests"
                  className="block text-xs font-extrabold text-utsav-text mb-1"
                >
                  Expected Guests
                </label>
                <input
                  id="evt-guests"
                  type="number"
                  min={1}
                  value={guestTarget}
                  onChange={(e) => setGuestTarget(e.target.value)}
                  placeholder={`e.g., ${activeCategoryCard.defaultGuests}`}
                  className="w-full border px-3.5 py-2 text-sm rounded-xl utsav-num font-bold placeholder:font-normal"
                />
              </div>

              {/* Budget & Currency */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label
                    htmlFor="evt-budget"
                    className="block text-xs font-extrabold text-utsav-text mb-1"
                  >
                    Total Budget
                  </label>
                  <input
                    id="evt-budget"
                    type="number"
                    min={100}
                    step={500}
                    value={budgetMajor}
                    onChange={(e) => setBudgetMajor(e.target.value)}
                    placeholder={`e.g., ${activeCategoryCard.defaultBudgetMajor}`}
                    className="w-full border px-3.5 py-2 text-sm rounded-xl utsav-num font-bold placeholder:font-normal"
                  />
                </div>
                <div>
                  <label
                    htmlFor="evt-currency"
                    className="block text-xs font-extrabold text-utsav-text mb-1"
                  >
                    Currency
                  </label>
                  <select
                    id="evt-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="w-full border px-2.5 py-2 text-sm rounded-xl font-bold"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Setting */}
              <div>
                <label className="block text-xs font-extrabold text-utsav-text mb-1">
                  Setting
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Outdoor", "Indoor", "Hybrid"] as IndoorOutdoorPreference[]).map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      aria-pressed={indoorOutdoor === pref}
                      onClick={() => setIndoorOutdoor(pref)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        indoorOutdoor === pref
                          ? "bg-utsav-primary text-white border-utsav-primary shadow-xs"
                          : "border-utsav-primary/20 text-utsav-muted hover:text-utsav-text"
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-utsav-primary/10">
            <button type="submit" className="utsav-btn-primary !px-6 !py-3 text-sm">
              Continue to Personalized Ideas
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: PERSONALIZED IDEAS & VIBE (Precise, Chip-Driven, Zero Typing Required!) */}
      {step === 2 && !isGenerating && (
        <form onSubmit={handleGeneratePlan} noValidate className="utsav-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-utsav-text">
                2. Personalize Your Ideas, Vibe & Priorities
              </h2>
              <p className="text-xs text-utsav-muted font-medium mt-1">
                Tap quick chips below to customize. GenAI adapts your budgets, timeline, and vendor checklists around these choices!
              </p>
            </div>
            <span className="utsav-badge bg-utsav-primary/10 text-utsav-primary text-[11px]">
              Optional &amp; Instant
            </span>
          </div>

          {/* Theme & Vibe Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-utsav-text flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-utsav-primary" />
                Select Theme / Concept
              </label>
              <button
                type="button"
                onClick={() => setCustomThemeMode(!customThemeMode)}
                className="text-[11px] font-bold text-utsav-primary hover:underline"
              >
                {customThemeMode ? "Pick from presets" : "+ Custom theme"}
              </button>
            </div>

            {!customThemeMode ? (
              <div className="flex flex-wrap gap-2">
                {activeCategoryCard.themePresets.map((preset) => {
                  const active = (theme || activeCategoryCard.defaultTheme) === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTheme(preset)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                        active
                          ? "bg-utsav-gradient text-white border-transparent shadow-soft"
                          : "bg-utsav-surface text-utsav-text border-utsav-primary/15 hover:border-utsav-primary/40"
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Enter custom theme (e.g., Royal Marigold Courtyard)"
                className="w-full border px-3.5 py-2 text-sm rounded-xl"
              />
            )}
          </div>

          {/* Cohesive Color Palette (Compact) */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-utsav-text block">
              Cohesive Color Palette
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {COLOR_PRESETS.map((preset) => {
                const selected = preset.colors.join(",") === colorPalette.join(",");
                return (
                  <button
                    key={preset.name}
                    type="button"
                    aria-label={`Select ${preset.name} color palette`}
                    aria-pressed={selected}
                    onClick={() => setColorPalette(preset.colors)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selected
                        ? "border-utsav-primary bg-utsav-primary/8 shadow-soft"
                        : "border-utsav-primary/12 hover:border-utsav-primary/30 bg-utsav-surface"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {preset.colors.map((hex) => (
                        <span
                          key={hex}
                          className="w-4 h-4 rounded-full border border-black/10"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-extrabold text-utsav-text block truncate">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Priorities (Interactive 1-Tap Toggle Tags) */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-utsav-text block">
              Key Priorities (Tap to select)
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((priority) => {
                const isSelected = selectedPriorities.includes(priority);
                return (
                  <button
                    key={priority}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => togglePriority(priority)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-utsav-primary/15 text-utsav-primary border-utsav-primary/40 font-extrabold"
                        : "bg-utsav-surface text-utsav-muted border-utsav-primary/15 hover:text-utsav-text"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-utsav-primary" />}
                    <span>{priority}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Food & Guest Comfort Preferences (Interactive 1-Tap Toggle Tags) */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-utsav-text block">
              Food &amp; Guest Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {PREFERENCE_OPTIONS.map((pref) => {
                const isSelected = selectedPreferences.includes(pref);
                return (
                  <button
                    key={pref}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => togglePreference(pref)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/40 font-extrabold"
                        : "bg-utsav-surface text-utsav-muted border-utsav-primary/15 hover:text-utsav-text"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                    <span>{pref}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Single, Simple Personalized Ideas / Notes Box */}
          <div className="space-y-1.5">
            <label
              htmlFor="evt-ideas"
              className="text-xs font-extrabold text-utsav-text flex items-center gap-1.5"
            >
              <Lightbulb className="w-4 h-4 text-utsav-gold" />
              Special Traditions, Wishes, or Ideas for AI (Optional)
            </label>
            <textarea
              id="evt-ideas"
              rows={2}
              value={customIdeas}
              onChange={(e) => setCustomIdeas(e.target.value)}
              placeholder="e.g., Live acoustic guitarist for entrance, golden hour photo toast, avoid loud bass after 10 PM..."
              className="w-full border px-3.5 py-2 text-xs rounded-xl placeholder:text-utsav-muted/50"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-utsav-primary/10">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="utsav-btn-secondary !px-5 !py-2.5 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="submit"
              className="utsav-btn-primary !px-7 !py-3 text-sm font-extrabold"
            >
              <Sparkles className="w-4 h-4 text-utsav-gold" />
              Generate Personalized Event Plan
            </button>
          </div>
        </form>
      )}

      {/* GENERATING STATE */}
      {isGenerating && (
        <div className="utsav-card p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-utsav-gradient mx-auto flex items-center justify-center text-white shadow-glow">
            <Loader2 className="w-8 h-8 animate-spin text-utsav-gold" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-extrabold text-utsav-text">
              Generating Your Event Plan
            </h2>
            <p className="text-xs text-utsav-muted font-medium">
              {PLANNING_STAGES[planningStageIndex] || PLANNING_STAGES[0]}
            </p>
          </div>
          <div className="max-w-md mx-auto space-y-2 text-left">
            {PLANNING_STAGES.map((stageLabel, idx) => (
              <div
                key={stageLabel}
                className={`flex items-center gap-2.5 text-xs font-bold px-4 py-2 rounded-xl ${
                  idx <= planningStageIndex
                    ? "bg-utsav-primary/12 text-utsav-primary"
                    : "text-utsav-muted/50"
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    idx <= planningStageIndex ? "text-utsav-primary" : "opacity-30"
                  }`}
                />
                <span>{stageLabel}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: PLAN REVIEW — Explicitly divided into the 4 Problem Statement Pillars */}
      {step === 3 && generatedPlan && !isGenerating && (
        <div className="utsav-card p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-utsav-primary/10 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="utsav-badge bg-emerald-500/12 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Plan Ready
                </span>
                <span className="utsav-badge bg-utsav-primary/10 text-utsav-primary">
                  {eventType}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-utsav-text mt-2">
                {generatedPlan.overview.title}
              </h2>
              <p className="text-xs text-utsav-muted font-medium mt-0.5">
                {generatedPlan.overview.concept}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveAndOpenWorkspace}
              className="utsav-btn-primary !px-6 !py-3 text-sm font-extrabold"
            >
              Save &amp; Open Workspace
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* The 4 Problem Statement Deliverables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Smart Budgets */}
            <div className="rounded-2xl bg-utsav-primary/5 p-5 border border-utsav-primary/15 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-utsav-primary">
                  <Wallet className="w-4 h-4" />
                  1. Smart Budgets
                </div>
                <span className="utsav-badge bg-utsav-primary/10 text-utsav-primary text-[10px]">
                  {formatMinorCurrency(
                    toMinorUnits(Number(budgetMajor) || activeCategoryCard.defaultBudgetMajor),
                    currency
                  )}
                </span>
              </div>
              <ul className="space-y-1.5 text-xs utsav-num">
                {generatedPlan.budgetAllocations.map((b) => (
                  <li key={b.name} className="flex justify-between items-center py-0.5">
                    <span className="text-utsav-muted font-medium">{b.name}</span>
                    <span className="font-extrabold text-utsav-text">
                      {formatMinorCurrency(b.allocatedAmountMinor, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. Dynamic Timelines */}
            <div className="rounded-2xl bg-utsav-primary/5 p-5 border border-utsav-primary/15 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-utsav-primary">
                  <CalendarClock className="w-4 h-4" />
                  2. Dynamic Timelines
                </div>
                <span className="utsav-badge bg-utsav-primary/10 text-utsav-primary text-[10px]">
                  {generatedPlan.itinerary.length} Schedule Slots
                </span>
              </div>
              <ul className="space-y-1.5 text-xs">
                {generatedPlan.itinerary.slice(0, 5).map((slot) => (
                  <li key={slot.id} className="flex items-center gap-2 py-0.5">
                    <span className="utsav-num font-extrabold text-utsav-primary min-w-[70px]">
                      {slot.time}
                    </span>
                    <span className="text-utsav-text font-medium truncate">
                      {slot.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Vendor Checklists */}
            <div className="rounded-2xl bg-utsav-primary/5 p-5 border border-utsav-primary/15 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-utsav-primary">
                  <Store className="w-4 h-4" />
                  3. Vendor Checklists
                </div>
                <span className="utsav-badge bg-utsav-primary/10 text-utsav-primary text-[10px]">
                  {generatedPlan.vendorRequirements.length} Categories
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {generatedPlan.vendorRequirements.slice(0, 3).map((v) => (
                  <div
                    key={v.category}
                    className="flex items-center justify-between p-2 rounded-xl bg-utsav-surface border border-utsav-primary/10"
                  >
                    <span className="font-bold text-utsav-text">{v.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-extrabold bg-utsav-coral/15 text-utsav-coral">
                        {v.priority} Priority
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Personalized Ideas */}
            <div className="rounded-2xl bg-utsav-primary/5 p-5 border border-utsav-primary/15 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-utsav-primary">
                  <Lightbulb className="w-4 h-4 text-utsav-gold" />
                  4. Personalized Ideas &amp; Theme
                </div>
                <div className="flex gap-1.5">
                  {generatedPlan.theme.primaryTheme.colors.map((c) => (
                    <span
                      key={c.hex}
                      className="w-4 h-4 rounded-full border border-black/10"
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-utsav-muted leading-relaxed">
                <strong>{generatedPlan.theme.primaryTheme.name}:</strong>{" "}
                {generatedPlan.theme.primaryTheme.tagline ||
                  generatedPlan.theme.primaryTheme.description}
              </p>
              {generatedPlan.theme.primaryTheme.decorSuggestions?.length > 0 && (
                <div className="text-[11px] text-utsav-text bg-utsav-surface p-2 rounded-xl border border-utsav-primary/10">
                  <span className="font-extrabold text-utsav-primary">Decor Concept: </span>
                  {generatedPlan.theme.primaryTheme.decorSuggestions[0]}
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-utsav-primary/10">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="utsav-btn-secondary !px-5 !py-2.5 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Adjust Preferences
            </button>
            <button
              type="button"
              onClick={handleSaveAndOpenWorkspace}
              className="utsav-btn-primary !px-7 !py-3 text-sm font-extrabold"
            >
              Launch Full Event Dashboard →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
