"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Settings,
  Save,
  Trash2,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { useUtsav } from "@/context/UtsavContext";
import { EventWorkspaceShell } from "@/components/layout/EventWorkspaceShell";
import { fromMinorUnits, toMinorUnits } from "@/lib/utils/currency";
import {
  CurrencyCode,
  EventType,
  IndoorOutdoorPreference,
} from "@/types/event";

export default function EventSettingsPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const rawId = params?.eventId;
  const eventId =
    (Array.isArray(rawId) ? rawId[0] : rawId) || "demo-garden-birthday";

  const {
    bundles,
    getEventBundle,
    updateEventDetails,
    deleteEvent,
    resetDemoData,
  } = useUtsav();

  const bundle = getEventBundle(eventId) || bundles[0];
  const { event } = bundle;

  const [title, setTitle] = useState(event.title);
  const [eventType, setEventType] = useState<EventType>(event.eventType);
  const [eventDate, setEventDate] = useState(event.eventDate);
  const [location, setLocation] = useState(event.location);
  const [guestTarget, setGuestTarget] = useState(event.guestTarget);
  const [budgetMajor, setBudgetMajor] = useState(
    fromMinorUnits(event.totalBudgetMinor)
  );
  const [currency, setCurrency] = useState<CurrencyCode>(event.currency);
  const [theme, setTheme] = useState(event.theme);
  const [indoorOutdoor, setIndoorOutdoor] = useState<IndoorOutdoorPreference>(
    event.preferences.indoorOutdoor
  );
  const [duration, setDuration] = useState(event.preferences.duration);
  const [description, setDescription] = useState(event.description);
  const [savedNotice, setSavedNotice] = useState(false);

  React.useEffect(() => {
    setTitle(event.title);
    setEventType(event.eventType);
    setEventDate(event.eventDate);
    setLocation(event.location);
    setGuestTarget(event.guestTarget);
    setBudgetMajor(fromMinorUnits(event.totalBudgetMinor));
    setCurrency(event.currency);
    setTheme(event.theme);
    setIndoorOutdoor(event.preferences.indoorOutdoor);
    setDuration(event.preferences.duration);
    setDescription(event.description);
  }, [event]);

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    updateEventDetails(event.id, {
      title: title.trim() || event.title,
      eventType,
      eventDate,
      location: location.trim() || event.location,
      guestTarget: Math.max(1, Number(guestTarget) || event.guestTarget),
      totalBudgetMinor: toMinorUnits(
        Math.max(100, Number(budgetMajor) || fromMinorUnits(event.totalBudgetMinor))
      ),
      currency,
      theme: theme.trim() || event.theme,
      description: description.trim(),
      preferences: {
        ...event.preferences,
        indoorOutdoor,
        duration: duration.trim() || event.preferences.duration,
      },
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  }

  function handleDeleteEvent() {
    deleteEvent(event.id);
    router.push("/dashboard");
  }

  return (
    <EventWorkspaceShell bundle={bundle}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 utsav-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-utsav-primary/10 pb-4">
            <div>
              <span className="utsav-badge bg-utsav-primary/12 text-utsav-primary">
                <Settings className="w-3.5 h-3.5" />
                Celebration Configuration
              </span>
              <h2 className="text-xl font-extrabold text-utsav-text mt-2">
                Event Settings & Core Parameters
              </h2>
            </div>
            {savedNotice && (
              <span className="utsav-badge bg-emerald-500/15 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Settings Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="settings-title-input" className="block text-xs font-extrabold text-utsav-text mb-1.5">
                  Event Title
                </label>
                <input
                  id="settings-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border px-3.5 py-2.5"
                />
              </div>

              <div>
                <label htmlFor="settings-category-select" className="block text-xs font-extrabold text-utsav-text mb-1.5">
                  Event Category
                </label>
                <select
                  id="settings-category-select"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="w-full border px-3.5 py-2.5"
                >
                  {[
                    "Birthday",
                    "Wedding",
                    "Engagement",
                    "Anniversary",
                    "College Festival",
                    "Corporate Event",
                    "Cultural / Religious Festival",
                    "Community Celebration",
                    "Baby Shower",
                    "Custom Event",
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="settings-date-input" className="block text-xs font-extrabold text-utsav-text mb-1.5">
                  Event Date
                </label>
                <input
                  id="settings-date-input"
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full border px-3.5 py-2.5"
                />
              </div>

              <div>
                <label htmlFor="settings-location-input" className="block text-xs font-extrabold text-utsav-text mb-1.5">
                  Location / Venue
                </label>
                <input
                  id="settings-location-input"
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border px-3.5 py-2.5"
                />
              </div>

              <div>
                <label htmlFor="settings-guests-input" className="block text-xs font-extrabold text-utsav-text mb-1.5">
                  Target Guest Count
                </label>
                <input
                  id="settings-guests-input"
                  type="number"
                  min={1}
                  max={50000}
                  value={guestTarget}
                  onChange={(e) => setGuestTarget(Number(e.target.value))}
                  className="w-full border px-3.5 py-2.5 utsav-num font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label htmlFor="settings-budget-input" className="block text-xs font-extrabold text-utsav-text mb-1.5">
                    Total Budget ({currency})
                  </label>
                  <input
                    id="settings-budget-input"
                    type="number"
                    min={100}
                    step={500}
                    value={budgetMajor}
                    onChange={(e) => setBudgetMajor(Number(e.target.value))}
                    className="w-full border px-3.5 py-2.5 utsav-num font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="settings-currency-select" className="block text-xs font-extrabold text-utsav-text mb-1.5">
                    Currency
                  </label>
                  <select
                    id="settings-currency-select"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="w-full border px-2.5 py-2.5 font-bold"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="settings-theme-input" className="block text-xs font-extrabold text-utsav-text mb-1.5">
                  Active Theme Name
                </label>
                <input
                  id="settings-theme-input"
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full border px-3.5 py-2.5"
                />
              </div>

              <div>
                <label htmlFor="settings-indoor-select" className="block text-xs font-extrabold text-utsav-text mb-1.5">
                  Indoor / Outdoor Preference
                </label>
                <select
                  id="settings-indoor-select"
                  value={indoorOutdoor}
                  onChange={(e) =>
                    setIndoorOutdoor(e.target.value as IndoorOutdoorPreference)
                  }
                  className="w-full border px-3.5 py-2.5"
                >
                  <option value="Outdoor">Outdoor</option>
                  <option value="Indoor">Indoor</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="settings-duration-input" className="block text-xs font-extrabold text-utsav-text mb-1.5">
                  Event Duration
                </label>
                <input
                  id="settings-duration-input"
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full border px-3.5 py-2.5"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="settings-desc-input" className="block text-xs font-extrabold text-utsav-text mb-1.5">
                  Celebration Description
                </label>
                <textarea
                  id="settings-desc-input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border px-3.5 py-2.5"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-utsav-primary/10">
              <button type="submit" className="utsav-btn-primary !px-6 !py-3">
                <Save className="w-4 h-4" />
                Save Event Configuration
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="utsav-card p-6 space-y-4 text-xs">
            <h3 className="text-sm font-extrabold text-utsav-text">
              Workspace Data Controls
            </h3>
            <p className="text-utsav-muted leading-relaxed">
              Reset all 3 demo celebrations to their initial factory state or remove this event from your workspace.
            </p>
            <button
              type="button"
              onClick={() => {
                resetDemoData();
                setSavedNotice(true);
              }}
              className="utsav-btn-secondary w-full !py-2.5 !text-xs"
            >
              <RotateCcw className="w-4 h-4 text-utsav-primary" />
              Reset All Seeded Demo Data
            </button>
            <button
              type="button"
              onClick={handleDeleteEvent}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-utsav-coral/40 bg-utsav-coral/10 px-4 py-2.5 text-xs font-extrabold text-utsav-coral hover:bg-utsav-coral hover:text-white transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Remove Event from Workspace
            </button>
          </div>
        </div>
      </div>
    </EventWorkspaceShell>
  );
}
