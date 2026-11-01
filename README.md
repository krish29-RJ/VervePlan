# VervePlan — Celebration & Event Planner

> **Google Prompt Wars — Challenge 5 Submission**  
> **Problem Statement:** *Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas.*

---

## 🤖 Generative AI Architecture

VervePlan features a **Universal Multi-Provider GenAI Engine** (`src/lib/ai/client.ts`):

1. **Google Gemini API (Primary / Recommended for Google Prompt Wars)**
   - Models: `gemini-1.5-flash` (default for sub-second, structured planning) & `gemini-1.5-pro`.
   - Native JSON structured generation with temperature control (`0.4`).
   - Configured via `GEMINI_API_KEY` in `.env.local`.

2. **OpenAI API (Alternative Provider)**
   - Model: `gpt-4o-mini` with JSON mode.
   - Configured via `OPENAI_API_KEY` in `.env.local`.

3. **Deterministic Offline Template Engine (Zero-Key Demo & Judging Mode)**
   - Automatically activates if no API keys are provided.
   - Generates fully populated, validated celebration plans with exact mathematical budgets, day-of itineraries, and vendor checklists so evaluators and users can test everything immediately without needing API credentials.

| Evaluation Parameter | Implementation Evidence & Code Locations | Verification Command |
| :--- | :--- | :--- |
| **1. Problem Statement Alignment** | Native support for **Weddings**, **Birthdays**, and **Community Events** with the 4 required deliverables: **Smart Budgets**, **Dynamic Timelines**, **Vendor Checklists**, and **Personalized Ideas**. Located in `src/app/events/new/page.tsx`, `src/lib/ai/generate-plan.ts`, and `src/app/events/[eventId]/`. | `npm test` *(Tests 7, 8, 9)* |
| **2. Code Quality** | Modular Next.js 14 App Router, strict TypeScript (`strict: true`), zero type errors, structured Zod schemas, zero dead code, and clean DRY utilities (`src/lib/utils/`). | `npm run lint` & `npm run typecheck` |
| **3. Security** | Multi-layer prompt injection defense (`sanitizeUserPromptInput` in `src/lib/ai/client.ts`), Zod request validation, integer overflow bounds, Supabase PostgreSQL Row Level Security (RLS) in `supabase/migrations/001_initial_schema.sql`. | `npm test` *(Tests 10, 11, 12)* |
| **4. Efficiency** | Exact integer minor-unit math (`toMinorUnits`, `normalizeAllocationsToTotal`) preventing IEEE-754 floating point drift; 15/15 pre-rendered static routes; total repo size **~1.0 MB** *(well below 10 MB limit)*. | `npm run build` |
| **5. Testing** | Comprehensive automated test suite in `tests/utsavai.test.ts` covering math invariants, relative date bounds, guest matrices, security defenses, and the flagship replanning engine. | `npm test` *(14/14 Passing)* |
| **6. Accessibility (a11y)** | Semantic HTML5 landmarks (`<header>`, `<main>`, `<nav>`, `<section>`), ARIA state toggles (`aria-pressed`, `aria-label`), visible focus rings, high-contrast light/dark modes. | Verified in `Navbar.tsx` & `new/page.tsx` |

---

## 🌟 The 4 Core Problem Statement Deliverables

### 1. 💰 Smart Budgets & Integer Minor-Unit Math
* **Minor-Unit Financial Engine (`src/lib/utils/currency.ts`):** All monetary values are calculated and stored in integer minor units (paise/cents) to eliminate floating-point drift.
* **Exact Zero-Sum Normalization:** Every generated plan normalizes category allocations so their sum matches `totalBudgetMinor` to the exact single unit.
* **Cost Tracking:** Distinct tracking for AI Estimates, Vendor Quotes, and Confirmed Invoices with Recharts visual donut analytics.
* **AI Budget Optimizer (`/api/ai/optimize-budget`):** Intelligently reduces costs while protecting user-designated categories (e.g. protecting Photography or Decor).

### 2. ⏱️ Dynamic Timelines & Countdown Milestones
* **Relative Date Math (`computeRelativeDueDate`):** Milestones are computed relative to the target event date, with automatic bounds enforcement preventing tasks from being scheduled in the past.
* **Event-Day Run-of-Show:** Timestamped itinerary slots (e.g., Guest Arrival, Golden Hour Portraits, Live Counters, Cake Cutting / Toast, Dinner Buffet).
* **Progress Tracking (`calculateTaskMetrics`):** Real-time task completion percentage, phase filtering, and overdue task alerts.

### 3. 📋 Vendor Checklists & Contract Tracking
* **Vendor CRM (`/events/[eventId]/vendors`):** Tracks quotes, booking statuses (*Not Contacted*, *Contacted*, *Quote Received*, *Booked*), and payment milestones.
* **AI Negotiation Questions:** Provides tailored vetting questions and contract clauses for each vendor category (Catering, Mandap/Decor, Sound & Lighting, Photography).
* **Sample Data Transparency:** Pre-seeded demo vendors are explicitly tagged with `[Sample]`.

### 4. 💡 Personalized Ideas & Theme Architect
* **Streamlined Creation Flow (`/events/new`):** Replaced tedious multi-field typing forms with **1-tap curated theme chips**, **interactive priority tags**, and **dietary preference pills**.
* **Cohesive Aesthetics:** 4 visual color palettes with hex swatches, decor concepts, and guest experience highlights.
* **Flagship Replanning Engine (`/events/[eventId]/copilot`):** Dynamic before-and-after replanning assistant (e.g. *"Make this suitable for 80 guests under ₹90,000"*).

---

## 🛡️ Security & Defensive Engineering

1. **Prompt Injection & Jailbreak Defense:**
   - Untrusted inputs are sanitized through `sanitizeUserPromptInput()`:
     - Strips override directives like `ignore all previous instructions` and replaces them with `[redacted-directive]`.
     - Neutralizes `<script>`, `<system>`, `<assistant>`, and `<override>` tags.
     - Replaces markdown triple backticks to prevent prompt breakout.
2. **Strict Zod Input Validation:**
   - Every client request and API route is validated through schemas with bounded guest limits (`max: 50,000`) and budget limits (`max: 100,000,000,000` minor units) preventing integer overflow attacks.
3. **Database Row Level Security (RLS):**
   - 11 normalized PostgreSQL tables protected with `owns_event(target_event_id)` security-definer policies so users can only access their own events.

---

## ⚡ Efficiency & Repo Size

- **GitHub Repository Size:** Under **1.0 MB** (Well below the platform requirement of `< 10 MB`).
- **Clean `.gitignore`:** Strict exclusion of `.next`, `.next-prod`, `node_modules`, `coverage`, and temporary build artifacts.
- **Fast Build:** 15/15 static and dynamic pages compile in seconds with zero build warnings.

---

## 🧪 Automated Test Suite (`tests/utsavai.test.ts`)

Run the full automated test suite:
```bash
npm test
```

### Verified Test Cases (14/14 Passing):
1. `Currency Minor-Unit Math` — Converts major to minor units without float drift.
2. `Zero-Sum Allocation Invariant` — Category allocations sum exactly to `totalBudgetMinor`.
3. `Budget Summary Calculation` — Accurately computes remaining budget and over-budget categories.
4. `Timeline Relative Date Logic` — Prevents generating milestones in the past for future events.
5. `Task Progress & Overdue Detection` — Accurately calculates task completion percentages.
6. `Guest RSVP & Dietary Matrix` — Computes headcount, plus-ones, and dietary totals (Vegetarian, Jain, etc.).
7. `Weddings 4-Pillar Plan Generation` — Verified complete budgets, timelines, vendors, and ideas.
8. `Birthdays 4-Pillar Plan Generation` — Verified budget, itinerary, and vendor requirements.
9. `Community Events Plan Generation` — Verified 4-pillar generation for neighborhood festivals.
10. `Security: Prompt Injection Stripping` — Removes malicious override directives and script tags.
11. `Security: Integer Overflow Bounds` — Rejects budgets exceeding maximum numerical scale.
12. `Security: Input Validation Bounds` — Rejects malformed dates and negative guest counts.
13. `Budget Optimizer Priority Protection` — Reduces budget while protecting named categories.
14. `Flagship AI Replanning (50 -> 80 Guests under ₹90,000)` — Verified exact mathematical before/after diffs.

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Node.js** 18.18+ (tested on Node v20 & v25)
- **npm** 9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Verify Code Quality & Tests
```bash
# 1. Typecheck & Lint
npm run lint

# 2. Run Test Suite
npm test

# 3. Production Build
npm run build
```

### 4. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Offline Demo Mode:** VervePlan includes a full offline demo mode with local persistence pre-seeded with 3 rich celebrations (Bengaluru Garden Birthday, Jaipur Heritage Wedding, and Pune College Festival), allowing complete evaluation without requiring external API keys.
