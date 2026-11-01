"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AIMessageRecord,
  BudgetCategoryRecord,
  ChangeProposalRecord,
  ExpenseRecord,
  FullEventBundle,
  GuestRecord,
  ReplanProposalPayload,
  TaskRecord,
  VendorRecord,
} from "@/types/event";
import { createInitialDemoBundles } from "@/lib/demo/seed-data";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { computeRelativeDueDate } from "@/lib/utils/currency";
import { GeneratedPlanResponse } from "@/lib/ai/generate-plan";
import { z } from "zod";
import { CreateEventInputSchema } from "@/lib/validation/schemas";

const STORAGE_KEY_BUNDLES = "utsavai_bundles_v3";
const STORAGE_KEY_AUTH = "utsavai_auth_session_v3";
const STORAGE_KEY_THEME = "utsavai_theme_mode";

export interface AuthUserSession {
  id: string;
  email: string;
  displayName: string;
  isDemo: boolean;
}

const DEFAULT_DEMO_USER: AuthUserSession = {
  id: "demo-user-utsav",
  email: "demo@utsavai.local",
  displayName: "Aarav Sharma (Demo Mode)",
  isDemo: true,
};

interface UtsavContextValue {
  isHydrated: boolean;
  themeMode: "light" | "dark";
  toggleThemeMode: () => void;
  setThemeMode: (mode: "light" | "dark") => void;
  user: AuthUserSession | null;
  isDemoMode: boolean;
  isSupabaseReady: boolean;
  bundles: FullEventBundle[];
  getEventBundle: (eventId: string) => FullEventBundle | undefined;
  enterDemoMode: (displayName?: string) => void;
  loginWithEmail: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signupWithEmail: (
    displayName: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetDemoData: () => void;
  createEventFromGeneratedPlan: (
    input: z.infer<typeof CreateEventInputSchema>,
    generated: GeneratedPlanResponse
  ) => FullEventBundle;
  updateEventDetails: (
    eventId: string,
    updates: Partial<FullEventBundle["event"]>
  ) => void;
  deleteEvent: (eventId: string) => void;
  applyThemeToEvent: (
    eventId: string,
    themeName: string,
    colors: string[],
    description?: string
  ) => void;
  updateBudgetCategory: (
    eventId: string,
    categoryId: string,
    allocatedAmountMinor: number,
    notes?: string
  ) => void;
  addBudgetCategory: (
    eventId: string,
    name: string,
    allocatedAmountMinor: number,
    notes?: string
  ) => void;
  applyOptimizedBudget: (
    eventId: string,
    changes: { categoryName: string; proposedMinor: number }[],
    newTotalMinor?: number
  ) => void;
  addExpense: (
    eventId: string,
    expense: Omit<ExpenseRecord, "id" | "eventId" | "createdAt">
  ) => void;
  deleteExpense: (eventId: string, expenseId: string) => void;
  updateExpenseStatus: (
    eventId: string,
    expenseId: string,
    paymentStatus: ExpenseRecord["paymentStatus"]
  ) => void;
  addTask: (
    eventId: string,
    task: Omit<TaskRecord, "id" | "eventId">
  ) => void;
  updateTask: (
    eventId: string,
    taskId: string,
    updates: Partial<TaskRecord>
  ) => void;
  deleteTask: (eventId: string, taskId: string) => void;
  applyTimelineProposals: (
    eventId: string,
    proposed: {
      action: "update" | "add";
      id?: string;
      title: string;
      description: string;
      proposedDueDate: string;
      priority: "High" | "Medium" | "Low";
      category: string;
      phase: "Early Planning" | "Vendor & Design" | "Final Countdown" | "Event Day";
    }[]
  ) => void;
  addVendor: (
    eventId: string,
    vendor: Omit<VendorRecord, "id" | "eventId">
  ) => void;
  updateVendor: (
    eventId: string,
    vendorId: string,
    updates: Partial<VendorRecord>
  ) => void;
  deleteVendor: (eventId: string, vendorId: string) => void;
  addGuest: (
    eventId: string,
    guest: Omit<GuestRecord, "id" | "eventId">
  ) => void;
  updateGuest: (
    eventId: string,
    guestId: string,
    updates: Partial<GuestRecord>
  ) => void;
  deleteGuest: (eventId: string, guestId: string) => void;
  appendChatMessage: (
    eventId: string,
    message: Omit<AIMessageRecord, "id" | "createdAt">
  ) => AIMessageRecord;
  saveChangeProposal: (
    eventId: string,
    requestedChange: string,
    payload: ReplanProposalPayload,
    baseVersion: number
  ) => ChangeProposalRecord;
  applyChangeProposalTransactionally: (
    eventId: string,
    proposalId: string
  ) => { ok: boolean; error?: string };
  rejectChangeProposal: (eventId: string, proposalId: string) => void;
}

const UtsavContext = createContext<UtsavContextValue | null>(null);

function syncDomTheme(mode: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
    document.body?.classList.add("dark");
    document.body?.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    document.body?.classList.remove("dark");
    document.body?.setAttribute("data-theme", "light");
  }
}

export function UtsavProvider({ children }: { children: React.ReactNode }) {
  const initialSeeds = useMemo(() => createInitialDemoBundles(), []);
  const [isHydrated, setIsHydrated] = useState(true);
  const [themeMode, setThemeModeState] = useState<"light" | "dark">("light");
  const [user, setUser] = useState<AuthUserSession | null>(DEFAULT_DEMO_USER);
  const [bundles, setBundles] = useState<FullEventBundle[]>(initialSeeds);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
      if (savedTheme === "dark" || savedTheme === "light") {
        setThemeModeState(savedTheme);
        syncDomTheme(savedTheme);
      } else {
        syncDomTheme("light");
      }

      const rawBundles = localStorage.getItem(STORAGE_KEY_BUNDLES);
      if (rawBundles) {
        const parsed = JSON.parse(rawBundles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((b: FullEventBundle) => b?.event?.id));
          const missingSeeds = initialSeeds.filter((s) => !existingIds.has(s.event.id));
          const merged = [...parsed, ...missingSeeds];
          setBundles(merged);
        } else {
          localStorage.setItem(STORAGE_KEY_BUNDLES, JSON.stringify(initialSeeds));
        }
      } else {
        localStorage.setItem(STORAGE_KEY_BUNDLES, JSON.stringify(initialSeeds));
      }

      const rawAuth = localStorage.getItem(STORAGE_KEY_AUTH);
      if (rawAuth) {
        setUser(JSON.parse(rawAuth));
      } else {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(DEFAULT_DEMO_USER));
      }
    } catch (e) {
      console.warn("Failed to read localStorage, using in-memory demo seeds:", e);
    } finally {
      setIsHydrated(true);
    }
  }, [initialSeeds]);

  const setThemeMode = useCallback((mode: "light" | "dark") => {
    setThemeModeState(mode);
    syncDomTheme(mode);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, mode);
    } catch {}
  }, []);

  const toggleThemeMode = useCallback(() => {
    setThemeModeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      syncDomTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY_THEME, next);
      } catch {}
      return next;
    });
  }, []);

  const persistBundles = useCallback(
    (updater: (prev: FullEventBundle[]) => FullEventBundle[]) => {
      setBundles((prev) => {
        const next = updater(prev);
        try {
          localStorage.setItem(STORAGE_KEY_BUNDLES, JSON.stringify(next));
        } catch (e) {
          console.warn("Unable to write bundles to localStorage:", e);
        }
        return next;
      });
    },
    []
  );

  const enterDemoMode = useCallback((displayName = "Aarav Sharma (Demo Mode)") => {
    const demoSession: AuthUserSession = {
      id: "demo-user-utsav",
      email: "demo@utsavai.local",
      displayName,
      isDemo: true,
    };
    setUser(demoSession);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(demoSession));
    } catch {}
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      if (!isSupabaseConfigured) {
        return {
          ok: false,
          error:
            "Supabase credentials are not configured in this environment. Use 'Continue in Demo Mode' for a full offline experience.",
        };
      }
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        return { ok: false, error: "Authentication client unavailable." };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        return { ok: false, error: error?.message || "Invalid email or password." };
      }

      const session: AuthUserSession = {
        id: data.user.id,
        email: data.user.email || email,
        displayName:
          (data.user.user_metadata?.display_name as string) ||
          email.split("@")[0] ||
          "Celebration Host",
        isDemo: false,
      };
      setUser(session);
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
      return { ok: true };
    },
    []
  );

  const signupWithEmail = useCallback(
    async (
      displayName: string,
      email: string,
      password: string
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!isSupabaseConfigured) {
        return {
          ok: false,
          error:
            "Supabase credentials are not configured in this environment. Click 'Launch Demo Mode' to create and persist events locally.",
        };
      }
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        return { ok: false, error: "Authentication client unavailable." };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      if (error || !data.user) {
        return { ok: false, error: error?.message || "Unable to register account." };
      }

      const session: AuthUserSession = {
        id: data.user.id,
        email: data.user.email || email,
        displayName,
        isDemo: false,
      };
      setUser(session);
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
      return { ok: true };
    },
    []
  );

  const logout = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut().catch(() => undefined);
    }
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch {}
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh = createInitialDemoBundles();
    setBundles(fresh);
    try {
      localStorage.setItem(STORAGE_KEY_BUNDLES, JSON.stringify(fresh));
    } catch {}
  }, []);

  const getEventBundle = useCallback(
    (eventId: string) => {
      const found = bundles.find((b) => b.event.id === eventId);
      if (found) return found;
      return initialSeeds.find((b) => b.event.id === eventId);
    },
    [bundles, initialSeeds]
  );

  const createEventFromGeneratedPlan = useCallback(
    (
      input: z.infer<typeof CreateEventInputSchema>,
      generated: GeneratedPlanResponse
    ): FullEventBundle => {
      const eventId = `evt-${Date.now()}`;
      const nowIso = new Date().toISOString();

      const budgetCategories: BudgetCategoryRecord[] = generated.budgetAllocations.map(
        (cat, idx) => ({
          id: `cat-${eventId}-${idx + 1}`,
          eventId,
          name: cat.name,
          allocatedAmountMinor: cat.allocatedAmountMinor,
          estimatedAmountMinor: cat.estimatedAmountMinor,
          notes: cat.notes,
          isCustom: false,
        })
      );

      const tasks: TaskRecord[] = generated.tasks.map((t, idx) => ({
        id: `task-${eventId}-${idx + 1}`,
        eventId,
        title: t.title,
        description: t.description,
        dueDate: computeRelativeDueDate(input.eventDate, t.daysBeforeEvent),
        priority: t.priority,
        status: "Todo",
        category: t.category,
        phase: t.phase,
      }));

      const sampleVendors: VendorRecord[] = generated.vendorRequirements.map((vr, idx) => ({
        id: `ven-${eventId}-${idx + 1}`,
        eventId,
        name: `[Sample] Recommended ${vr.category} Partner`,
        category: vr.category,
        contactName: "Sample Coordinator (Illustrative)",
        phone: "",
        email: "",
        website: "",
        quotedAmountMinor: Math.round((vr.estimatedMinMinor + vr.estimatedMaxMinor) / 2),
        bookingStatus: "Not Contacted",
        paymentStatus: "Unpaid",
        priority: vr.priority,
        deadline: computeRelativeDueDate(input.eventDate, vr.bookingDeadlineDaysBefore),
        notes: `Illustrative requirement placeholder. Questions to ask: ${vr.questionsToAsk.join(
          " | "
        )}`,
        isSample: true,
      }));

      const newBundle: FullEventBundle = {
        event: {
          id: eventId,
          ownerId: user?.id || "demo-user-utsav",
          title: input.title,
          eventType: input.eventType,
          description: generated.overview.description || input.description,
          eventDate: input.eventDate,
          location: input.location,
          guestTarget: input.guestTarget,
          totalBudgetMinor: input.totalBudgetMinor,
          currency: input.currency,
          theme: generated.theme.primaryTheme.name || input.theme,
          preferences: input.preferences,
          status: "planning",
          version: 1,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        plan: {
          id: `plan-${eventId}`,
          eventId,
          version: 1,
          overview: generated.overview,
          theme: generated.theme,
          itinerary: generated.itinerary,
          guestExperience: generated.guestExperience,
          vendorRequirements: generated.vendorRequirements,
          risks: generated.risks,
          assumptions: generated.assumptions,
          isFallbackGenerated: generated.isFallback,
          createdAt: nowIso,
        },
        budgetCategories,
        expenses: [],
        vendors: sampleVendors,
        tasks,
        guests: [],
        messages: [
          {
            id: `msg-${eventId}-1`,
            conversationId: `conv-${eventId}`,
            role: "assistant",
            content: `Your personalized plan for **${input.title}** is ready! Ask me anything about your budget, timeline, or vendors—or ask me to dynamically replan if your guest count or budget changes.`,
            intentType: "read_only",
            isFallback: generated.isFallback,
            createdAt: nowIso,
          },
        ],
        proposals: [],
      };

      persistBundles((prev) => [newBundle, ...prev]);
      return newBundle;
    },
    [persistBundles, user]
  );

  const updateEventDetails = useCallback(
    (eventId: string, updates: Partial<FullEventBundle["event"]>) => {
      persistBundles((prev) =>
        prev.map((b) =>
          b.event.id === eventId
            ? {
                ...b,
                event: {
                  ...b.event,
                  ...updates,
                  version: b.event.version + 1,
                  updatedAt: new Date().toISOString(),
                },
              }
            : b
        )
      );
    },
    [persistBundles]
  );

  const deleteEvent = useCallback(
    (eventId: string) => {
      persistBundles((prev) => prev.filter((b) => b.event.id !== eventId));
    },
    [persistBundles]
  );

  const applyThemeToEvent = useCallback(
    (eventId: string, themeName: string, colors: string[], description?: string) => {
      persistBundles((prev) =>
        prev.map((b) => {
          if (b.event.id !== eventId) return b;
          return {
            ...b,
            event: {
              ...b.event,
              theme: themeName,
              preferences: {
                ...b.event.preferences,
                colorPalette: colors.length > 0 ? colors : b.event.preferences.colorPalette,
              },
              version: b.event.version + 1,
              updatedAt: new Date().toISOString(),
            },
            plan: {
              ...b.plan,
              theme: {
                ...b.plan.theme,
                primaryTheme: {
                  ...b.plan.theme.primaryTheme,
                  name: themeName,
                  description: description || b.plan.theme.primaryTheme.description,
                },
              },
            },
          };
        })
      );
    },
    [persistBundles]
  );

  const updateBudgetCategory = useCallback(
    (eventId: string, categoryId: string, allocatedAmountMinor: number, notes?: string) => {
      persistBundles((prev) =>
        prev.map((b) => {
          if (b.event.id !== eventId) return b;
          const nextCats = b.budgetCategories.map((c) =>
            c.id === categoryId
              ? {
                  ...c,
                  allocatedAmountMinor: Math.max(0, Math.round(allocatedAmountMinor)),
                  notes: notes !== undefined ? notes : c.notes,
                }
              : c
          );
          return {
            ...b,
            event: {
              ...b.event,
              version: b.event.version + 1,
              updatedAt: new Date().toISOString(),
            },
            budgetCategories: nextCats,
          };
        })
      );
    },
    [persistBundles]
  );

  const addBudgetCategory = useCallback(
    (eventId: string, name: string, allocatedAmountMinor: number, notes = "") => {
      persistBundles((prev) =>
        prev.map((b) => {
          if (b.event.id !== eventId) return b;
          const newCat: BudgetCategoryRecord = {
            id: `cat-${Date.now()}`,
            eventId,
            name,
            allocatedAmountMinor: Math.max(0, Math.round(allocatedAmountMinor)),
            estimatedAmountMinor: Math.max(0, Math.round(allocatedAmountMinor)),
            notes,
            isCustom: true,
          };
          return {
            ...b,
            event: {
              ...b.event,
              version: b.event.version + 1,
              updatedAt: new Date().toISOString(),
            },
            budgetCategories: [...b.budgetCategories, newCat],
          };
        })
      );
    },
    [persistBundles]
  );

  const applyOptimizedBudget = useCallback(
    (
      eventId: string,
      changes: { categoryName: string; proposedMinor: number }[],
      newTotalMinor?: number
    ) => {
      persistBundles((prev) =>
        prev.map((b) => {
          if (b.event.id !== eventId) return b;
          const updatedCats = b.budgetCategories.map((cat) => {
            const match = changes.find(
              (ch) => ch.categoryName.toLowerCase() === cat.name.toLowerCase()
            );
            return match
              ? {
                  ...cat,
                  allocatedAmountMinor: Math.max(0, Math.round(match.proposedMinor)),
                }
              : cat;
          });
          return {
            ...b,
            event: {
              ...b.event,
              totalBudgetMinor:
                newTotalMinor !== undefined ? Math.round(newTotalMinor) : b.event.totalBudgetMinor,
              version: b.event.version + 1,
              updatedAt: new Date().toISOString(),
            },
            budgetCategories: updatedCats,
          };
        })
      );
    },
    [persistBundles]
  );

  const addExpense = useCallback(
    (eventId: string, expense: Omit<ExpenseRecord, "id" | "eventId" | "createdAt">) => {
      persistBundles((prev) =>
        prev.map((b) => {
          if (b.event.id !== eventId) return b;
          const newExpense: ExpenseRecord = {
            ...expense,
            id: `exp-${Date.now()}`,
            eventId,
            amountMinor: Math.max(0, Math.round(expense.amountMinor)),
            createdAt: new Date().toISOString(),
          };
          return {
            ...b,
            event: {
              ...b.event,
              version: b.event.version + 1,
              updatedAt: new Date().toISOString(),
            },
            expenses: [newExpense, ...b.expenses],
          };
        })
      );
    },
    [persistBundles]
  );

  const deleteExpense = useCallback(
    (eventId: string, expenseId: string) => {
      persistBundles((prev) =>
        prev.map((b) =>
          b.event.id === eventId
            ? {
                ...b,
                event: {
                  ...b.event,
                  version: b.event.version + 1,
                  updatedAt: new Date().toISOString(),
                },
                expenses: b.expenses.filter((e) => e.id !== expenseId),
              }
            : b
        )
      );
    },
    [persistBundles]
  );

  const updateExpenseStatus = useCallback(
    (eventId: string, expenseId: string, paymentStatus: ExpenseRecord["paymentStatus"]) => {
      persistBundles((prev) =>
        prev.map((b) =>
          b.event.id === eventId
            ? {
                ...b,
                expenses: b.expenses.map((e) =>
                  e.id === expenseId ? { ...e, paymentStatus } : e
                ),
              }
            : b
        )
      );
    },
    [persistBundles]
  );

  const addTask = useCallback(
    (eventId: string, task: Omit<TaskRecord, "id" | "eventId">) => {
      persistBundles((prev) =>
        prev.map((b) =>
          b.event.id === eventId
            ? {
                ...b,
                event: {
                  ...b.event,
                  version: b.event.version + 1,
                  updatedAt: new Date().toISOString(),
                },
                tasks: [
                  ...b.tasks,
                  {
                    ...task,
                    id: `task-${Date.now()}`,
                    eventId,
                  },
                ],
              }
            : b
        )
      );
    },
    [persistBundles]
  );

  const updateTask = useCallback(
    (eventId: string, taskId: string, updates: Partial<TaskRecord>) => {
      persistBundles((prev) =>
        prev.map((b) =>
          b.event.id === eventId
            ? {
                ...b,
                event: {
                  ...b.event,
                  version: b.event.version + 1,
                  updatedAt: new Date().toISOString(),
                },
                tasks: b.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
              }
            : b
        )
      );
    },
    [persistBundles]
  );

  const deleteTask = useCallback(
    (eventId: string, taskId: string) => {
      persistBundles((prev) =>
        prev.map((b) =>
          b.event.id === eventId
            ? {
                ...b,
                tasks: b.tasks.filter((t) => t.id !== taskId),
              }
            : b
        )
      );
    },
    [persistBundles]
  );

  const applyTimelineProposals = useCallback(
    (
      eventId: string,
      proposed: {
        action: "update" | "add";
        id?: string;
        title: string;
        description: string;
        proposedDueDate: string;
        priority: "High" | "Medium" | "Low";
        category: string;
        phase: "Early Planning" | "Vendor & Design" | "Final Countdown" | "Event Day";
      }[]
    ) => {
      persistBundles((prev) =>
        prev.map((b) => {
          if (b.event.id !== eventId) return b;
          let updatedTasks = [...b.tasks];

          for (const item of proposed) {
            if (item.action === "update" && item.id) {
              updatedTasks = updatedTasks.map((t) =>
                t.id === item.id
                  ? {
                      ...t,
                      dueDate: item.proposedDueDate,
                      priority: item.priority,
                      description: item.description || t.description,
                    }
                  : t
              );
            } else {
              updatedTasks.push({
                id: `task-ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                eventId,
                title: item.title,
                description: item.description,
                dueDate: item.proposedDueDate,
                priority: item.priority,
                status: "Todo",
                category: item.category,
                phase: item.phase,
              });
            }
          }

          return {
            ...b,
            event: {
              ...b.event,
              version: b.event.version + 1,
              updatedAt: new Date().toISOString(),
            },
            tasks: updatedTasks,
          };
        })
      );
    },
    [persistBundles]
  );

  const addVendor = useCallback(
    (eventId: string, vendor: Omit<VendorRecord, "id" | "eventId">) => {
      persistBundles((prev) =>
        prev.map((b) =>
          b.event.id === eventId
            ? {
                ...b,
                event: {
                  ...b.event,
                  version: b.event.version + 1,
                  updatedAt: new Date().toISOString(),
                },
                vendors: [
                  ...b.vendors,
                  {
                    ...vendor,
                    id: `ven-${Date.now()}`,
                    eventId,
                    quotedAmountMinor: Math.max(0, Math.round(vendor.quotedAmountMinor)),
                  },
                ],
              }
            : b
        )
      );
    },
    [persistBundles]
  );

  const updateVendor = useCallback(
    (eventId: string, vendorId: string, updates: Partial<VendorRecord>) => {
      persistBundles((prev) =>
        prev.map((b) =>
          b.event.id === eventId
            ? {
                ...b,
                event: {
                  ...b.event,
                  version: b.event.version + 1,
                  updatedAt: new Date().toISOString(),
                },
                vendors: b.vendors.map((v) =>
                  v.id === vendorId ? { ...v, ...updates } : v
                ),
              }
            : b
        )
      );
    },
    [persistBundles]
  );

  const deleteVendor = useCallback(
    (eventId: string, vendorId: string) => {
      persistBundles((prev) =>
        prev.map((b) =>
          b.event.id === eventId
            ? {
                ...b,
                vendors: b.vendors.filter((v) => v.id !== vendorId),
              }
            : b
        )
      );
    },
    [persistBundles]
  );

  const addGuest = useCallback(
    (eventId: string, guest: Omit<GuestRecord, "id" | "eventId">) => {
      persistBundles((prev) =>
        prev.map((b) =>
          b.event.id === eventId
            ? {
                ...b,
                event: {
                  ...b.event,
                  version: b.event.version + 1,
                  updatedAt: new Date().toISOString(),
                },
                guests: [
                  ...b.guests,
                  {
                    ...guest,
                    id: `guest-${Date.now()}`,
                    eventId,
                  },
                ],
              }
            : b
        )
      );
    },
    [persistBundles]
  );

  const updateGuest = useCallback(
    (eventId: string, guestId: string, updates: Partial<GuestRecord>) => {
      persistBundles((prev) =>
        prev.map((b) =>
          b.event.id === eventId
            ? {
                ...b,
                guests: b.guests.map((g) =>
                  g.id === guestId ? { ...g, ...updates } : g
                ),
              }
            : b
        )
      );
    },
    [persistBundles]
  );

  const deleteGuest = useCallback(
    (eventId: string, guestId: string) => {
      persistBundles((prev) =>
        prev.map((b) =>
          b.event.id === eventId
            ? {
                ...b,
                guests: b.guests.filter((g) => g.id !== guestId),
              }
            : b
        )
      );
    },
    [persistBundles]
  );

  const appendChatMessage = useCallback(
    (
      eventId: string,
      message: Omit<AIMessageRecord, "id" | "createdAt">
    ): AIMessageRecord => {
      const record: AIMessageRecord = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      persistBundles((prev) =>
        prev.map((b) =>
          b.event.id === eventId
            ? {
                ...b,
                messages: [...b.messages, record],
              }
            : b
        )
      );
      return record;
    },
    [persistBundles]
  );

  const saveChangeProposal = useCallback(
    (
      eventId: string,
      requestedChange: string,
      payload: ReplanProposalPayload,
      baseVersion: number
    ): ChangeProposalRecord => {
      const proposalRecord: ChangeProposalRecord = {
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        eventId,
        requestedChange,
        changes: payload,
        status: "pending",
        baseVersion,
        createdAt: new Date().toISOString(),
      };
      persistBundles((prev) =>
        prev.map((b) =>
          b.event.id === eventId
            ? {
                ...b,
                proposals: [proposalRecord, ...b.proposals],
              }
            : b
        )
      );
      return proposalRecord;
    },
    [persistBundles]
  );

  const applyChangeProposalTransactionally = useCallback(
    (eventId: string, proposalId: string): { ok: boolean; error?: string } => {
      const bundle =
        bundles.find((b) => b.event.id === eventId) ||
        initialSeeds.find((b) => b.event.id === eventId);
      if (!bundle) return { ok: false, error: "Event not found." };

      const proposalRecord = bundle.proposals.find((p) => p.id === proposalId);
      if (!proposalRecord) return { ok: false, error: "Proposal not found." };

      if (proposalRecord.status === "applied") {
        return { ok: false, error: "This proposal has already been applied." };
      }

      if (proposalRecord.baseVersion !== bundle.event.version) {
        persistBundles((prev) =>
          prev.map((b) =>
            b.event.id === eventId
              ? {
                  ...b,
                  proposals: b.proposals.map((p) =>
                    p.id === proposalId ? { ...p, status: "stale" } : p
                  ),
                }
              : b
          )
        );
        return {
          ok: false,
          error:
            "Stale proposal detected: the event was updated after this proposal was created. Please ask Copilot for a fresh proposal.",
        };
      }

      const { changes } = proposalRecord;
      const nowIso = new Date().toISOString();

      persistBundles((prev) =>
        prev.map((b) => {
          if (b.event.id !== eventId) return b;

          // 1. Update budget categories
          const updatedCategories = b.budgetCategories.map((cat) => {
            const match = changes.budgetChanges.find(
              (bc) => bc.categoryName.toLowerCase() === cat.name.toLowerCase()
            );
            if (!match) return cat;
            return {
              ...cat,
              allocatedAmountMinor: Math.max(0, Math.round(match.proposedMinor)),
              notes: `${cat.notes ? `${cat.notes} · ` : ""}[Replanned: ${match.reason}]`,
            };
          });

          // 2. Add/update synchronized tasks
          const newTasks: TaskRecord[] = changes.taskChanges.map((tc, idx) => ({
            id: `task-replan-${Date.now()}-${idx}`,
            eventId,
            title: tc.title,
            description: tc.reason,
            dueDate: tc.dueDate,
            priority: tc.priority,
            status: "Todo",
            category: tc.category,
            phase: "Final Countdown",
          }));

          // 3. Update vendor notes with synchronized guidance
          const updatedVendors = b.vendors.map((v) => {
            const imp = changes.vendorImplications.find(
              (vi) =>
                v.category.toLowerCase().includes(vi.category.toLowerCase()) ||
                vi.category.toLowerCase().includes(v.category.toLowerCase())
            );
            if (!imp) return v;
            return {
              ...v,
              quotedAmountMinor: Math.max(
                0,
                v.quotedAmountMinor + Math.round(imp.estimatedImpactMinor)
              ),
              notes: `${v.notes} | [Updated for ${changes.proposedGuestTarget} guests: ${imp.newGuidance}]`,
            };
          });

          return {
            ...b,
            event: {
              ...b.event,
              guestTarget: changes.proposedGuestTarget,
              totalBudgetMinor: changes.proposedTotalBudgetMinor,
              version: b.event.version + 1,
              updatedAt: nowIso,
            },
            budgetCategories: updatedCategories,
            tasks: [...newTasks, ...b.tasks],
            vendors: updatedVendors,
            proposals: b.proposals.map((p) =>
              p.id === proposalId ? { ...p, status: "applied", appliedAt: nowIso } : p
            ),
          };
        })
      );

      return { ok: true };
    },
    [bundles, initialSeeds, persistBundles]
  );

  const rejectChangeProposal = useCallback(
    (eventId: string, proposalId: string) => {
      persistBundles((prev) =>
        prev.map((b) =>
          b.event.id === eventId
            ? {
                ...b,
                proposals: b.proposals.map((p) =>
                  p.id === proposalId ? { ...p, status: "rejected" } : p
                ),
              }
            : b
        )
      );
    },
    [persistBundles]
  );

  const value = useMemo<UtsavContextValue>(
    () => ({
      isHydrated,
      themeMode,
      toggleThemeMode,
      setThemeMode,
      user,
      isDemoMode: Boolean(!isSupabaseConfigured || user?.isDemo),
      isSupabaseReady: isSupabaseConfigured,
      bundles,
      getEventBundle,
      enterDemoMode,
      loginWithEmail,
      signupWithEmail,
      logout,
      resetDemoData,
      createEventFromGeneratedPlan,
      updateEventDetails,
      deleteEvent,
      applyThemeToEvent,
      updateBudgetCategory,
      addBudgetCategory,
      applyOptimizedBudget,
      addExpense,
      deleteExpense,
      updateExpenseStatus,
      addTask,
      updateTask,
      deleteTask,
      applyTimelineProposals,
      addVendor,
      updateVendor,
      deleteVendor,
      addGuest,
      updateGuest,
      deleteGuest,
      appendChatMessage,
      saveChangeProposal,
      applyChangeProposalTransactionally,
      rejectChangeProposal,
    }),
    [
      isHydrated,
      themeMode,
      toggleThemeMode,
      setThemeMode,
      user,
      bundles,
      getEventBundle,
      enterDemoMode,
      loginWithEmail,
      signupWithEmail,
      logout,
      resetDemoData,
      createEventFromGeneratedPlan,
      updateEventDetails,
      deleteEvent,
      applyThemeToEvent,
      updateBudgetCategory,
      addBudgetCategory,
      applyOptimizedBudget,
      addExpense,
      deleteExpense,
      updateExpenseStatus,
      addTask,
      updateTask,
      deleteTask,
      applyTimelineProposals,
      addVendor,
      updateVendor,
      deleteVendor,
      addGuest,
      updateGuest,
      deleteGuest,
      appendChatMessage,
      saveChangeProposal,
      applyChangeProposalTransactionally,
      rejectChangeProposal,
    ]
  );

  return (
    <UtsavContext.Provider value={value}>
      <div
        data-theme={themeMode}
        className={`min-h-screen flex flex-col w-full transition-colors duration-200 ${
          themeMode === "dark"
            ? "dark bg-[#0F0B1A] text-[#F6F4FF]"
            : "bg-[#FAF8FF] text-[#241D39]"
        }`}
      >
        {children}
      </div>
    </UtsavContext.Provider>
  );
}

export function useUtsav() {
  const ctx = useContext(UtsavContext);
  if (!ctx) {
    throw new Error("useUtsav must be used within an UtsavProvider");
  }
  return ctx;
}
