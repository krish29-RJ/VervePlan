"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Users,
  Plus,
  Trash2,
  Sparkles,
  Copy,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useUtsav } from "@/context/UtsavContext";
import { EventWorkspaceShell } from "@/components/layout/EventWorkspaceShell";
import { calculateGuestMetrics } from "@/lib/utils/currency";
import { GuestGroup, RsvpStatus } from "@/types/event";

export default function GuestsPage() {
  const params = useParams<{ eventId: string }>();
  const rawId = params?.eventId;
  const eventId = (Array.isArray(rawId) ? rawId[0] : rawId) || "demo-garden-birthday";
  const { bundles, getEventBundle, addGuest, updateGuest, deleteGuest } =
    useUtsav();

  // Add Guest form
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [guestGroup, setGuestGroup] = useState<GuestGroup>("Friends");
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>("Confirmed");
  const [dietaryPreferences, setDietaryPreferences] = useState("Vegetarian");
  const [plusOnes, setPlusOnes] = useState(0);
  const [accessibilityNotes, setAccessibilityNotes] = useState("");

  // Filters
  const [groupFilter, setGroupFilter] = useState<"ALL" | GuestGroup>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedInvite, setCopiedInvite] = useState(false);

  const bundle = getEventBundle(eventId) || bundles[0];
  if (!bundle) {
    return (
      <div className="p-10 text-center text-sm text-utsav-muted font-semibold">
        Event not found.
      </div>
    );
  }

  const { event, guests } = bundle;
  const guestMetrics = calculateGuestMetrics(guests);

  const filteredGuests = guests.filter((g) => {
    const matchesGroup = groupFilter === "ALL" || g.guestGroup === groupFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.dietaryPreferences.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  function handleAddGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    addGuest(event.id, {
      name: name.trim(),
      contact: contact.trim(),
      guestGroup,
      rsvpStatus,
      dietaryPreferences: dietaryPreferences.trim() || "None",
      plusOnes: Math.max(0, Number(plusOnes) || 0),
      accessibilityNotes: accessibilityNotes.trim(),
    });

    setName("");
    setContact("");
    setPlusOnes(0);
    setAccessibilityNotes("");
  }

  const invitationText = `✨ You're Invited to ${event.title}! ✨

Join us as we celebrate with a "${event.theme}" experience:
📅 Date: ${event.eventDate}
📍 Venue: ${event.location}
⏰ Timing: ${event.preferences.duration}

Please share your RSVP and any dietary preferences (${event.preferences.dietaryRequirements}) so we can prepare a warm welcome for you!`;

  return (
    <EventWorkspaceShell bundle={bundle}>
      <div className="space-y-8">
        {/* Privacy & Invitation Honesty Banner */}
        <div className="utsav-card p-4 text-xs text-utsav-muted flex items-start gap-2.5">
          <Info className="w-4 h-4 text-utsav-primary shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong className="text-utsav-text font-extrabold">
              Privacy & Delivery Transparency:
            </strong>{" "}
            Guest contact details are kept private and are never sent to external AI models. Invitation copy generated below is for you to copy and share—VervePlan never claims an email or SMS was sent without an active delivery integration.
          </span>
        </div>

        {/* Guest Analytics KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="utsav-card p-4 sm:p-5">
            <span className="text-xs font-bold text-utsav-muted">
              Planned Target Headcount
            </span>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-text mt-1">
              {event.guestTarget} Guests
            </p>
            <span className="utsav-num text-[11px] text-utsav-muted font-medium">
              Listed (incl. +1s): {guestMetrics.totalHeadcount}
            </span>
          </div>

          <div className="utsav-card p-4 sm:p-5">
            <span className="text-xs font-bold text-utsav-muted">
              Confirmed Attendance
            </span>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
              {guestMetrics.confirmedHeadcount}
            </p>
            <span className="text-[11px] text-utsav-muted font-medium">
              Across {guests.filter((g) => g.rsvpStatus === "Confirmed").length} parties
            </span>
          </div>

          <div className="utsav-card p-4 sm:p-5">
            <span className="text-xs font-bold text-utsav-muted">
              Pending / Maybe RSVPs
            </span>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-deep mt-1">
              {guestMetrics.pendingHeadcount + guestMetrics.maybeHeadcount}
            </p>
            <span className="utsav-num text-[11px] text-utsav-muted font-medium">
              Declined: {guestMetrics.declinedHeadcount}
            </span>
          </div>

          <div className="utsav-card p-4 sm:p-5">
            <span className="text-xs font-bold text-utsav-muted">
              Dietary Breakdown
            </span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {Object.entries(guestMetrics.dietaryBreakdown).map(([diet, count]) => (
                <span
                  key={diet}
                  className="utsav-badge bg-utsav-primary/10 text-utsav-primary !text-[10px] !py-0.5 !px-2.5 utsav-num"
                >
                  {diet}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* GUEST LIST + ADD GUEST FORM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 utsav-card p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-utsav-text">
                Guest List & RSVP Tracker
              </h2>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guest or dietary preference..."
                className="border px-3.5 py-2 text-xs w-full sm:w-64"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              {(["ALL", "Family", "Friends", "Colleagues", "VIP", "Custom"] as const).map(
                (grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setGroupFilter(grp)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                      groupFilter === grp
                        ? "bg-utsav-primary text-white shadow-2xs"
                        : "bg-utsav-primary/6 text-utsav-muted hover:text-utsav-text"
                    }`}
                  >
                    {grp}
                  </button>
                )
              )}
            </div>

            {filteredGuests.length === 0 ? (
              <p className="text-xs text-utsav-muted py-8 text-center">
                No guests match this filter. Add a guest party on the right!
              </p>
            ) : (
              <div className="space-y-3">
                {filteredGuests.map((g) => {
                  const totalParty = 1 + (g.plusOnes || 0);
                  return (
                    <div
                      key={g.id}
                      className="rounded-2xl bg-utsav-primary/5 p-4 border border-utsav-primary/12 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-utsav-text">
                            {g.name}
                          </span>
                          <span className="utsav-badge bg-utsav-primary/12 text-utsav-primary !text-[10px] !py-0.5 !px-2.5">
                            {g.guestGroup}
                          </span>
                          <span className="utsav-badge bg-utsav-surface border border-utsav-primary/15 !text-[10px] !py-0.5 !px-2.5 text-utsav-text utsav-num">
                            Party of {totalParty}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-utsav-muted font-medium">
                          <span>
                            Dietary: <strong className="text-utsav-text">{g.dietaryPreferences}</strong>
                          </span>
                          {g.contact && <span>Contact: {g.contact}</span>}
                          {g.accessibilityNotes && (
                            <span className="text-utsav-primary font-bold">
                              Accessibility: {g.accessibilityNotes}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <select
                          aria-label="Guest RSVP status"
                          value={g.rsvpStatus}
                          onChange={(e) =>
                            updateGuest(event.id, g.id, {
                              rsvpStatus: e.target.value as RsvpStatus,
                            })
                          }
                          className="rounded-xl border px-2.5 py-1.5 text-xs font-extrabold"
                        >
                          <option value="Invited">Invited</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Maybe">Maybe</option>
                          <option value="Declined">Declined</option>
                          <option value="Not Responded">Not Responded</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => deleteGuest(event.id, g.id)}
                          className="p-1.5 text-utsav-muted hover:text-utsav-coral transition-colors"
                          title="Remove guest"
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

          {/* ADD GUEST + INVITATION CARD COPY */}
          <div className="lg:col-span-4 space-y-6">
            <div className="utsav-card p-5 sm:p-6 space-y-4">
              <h2 className="text-base font-extrabold text-utsav-text flex items-center gap-2">
                <Users className="w-4 h-4 text-utsav-primary" />
                Add Guest or Family Party
              </h2>
              <form onSubmit={handleAddGuest} className="space-y-3 text-xs">
                <div>
                  <label className="block font-extrabold text-utsav-text mb-1">
                    Guest or Family Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Rohan & Kavita Iyer"
                    className="w-full border px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-extrabold text-utsav-text mb-1">
                      Group
                    </label>
                    <select
                      value={guestGroup}
                      onChange={(e) => setGuestGroup(e.target.value as GuestGroup)}
                      className="w-full border px-2.5 py-2"
                    >
                      <option value="Family">Family</option>
                      <option value="Friends">Friends</option>
                      <option value="Colleagues">Colleagues</option>
                      <option value="VIP">VIP</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-extrabold text-utsav-text mb-1">
                      RSVP Status
                    </label>
                    <select
                      value={rsvpStatus}
                      onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)}
                      className="w-full border px-2.5 py-2"
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Invited">Invited</option>
                      <option value="Maybe">Maybe</option>
                      <option value="Not Responded">Not Responded</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-extrabold text-utsav-text mb-1">
                      Additional Guests (+1s)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={plusOnes}
                      onChange={(e) => setPlusOnes(Number(e.target.value))}
                      className="w-full border px-3 py-2 utsav-num"
                    />
                  </div>
                  <div>
                    <label className="block font-extrabold text-utsav-text mb-1">
                      Dietary Preference
                    </label>
                    <input
                      type="text"
                      value={dietaryPreferences}
                      onChange={(e) => setDietaryPreferences(e.target.value)}
                      placeholder="Vegetarian / Jain / Vegan"
                      className="w-full border px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-utsav-text mb-1">
                    Accessibility / Seating Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={accessibilityNotes}
                    onChange={(e) => setAccessibilityNotes(e.target.value)}
                    placeholder="e.g., Reserved elder seating near veranda"
                    className="w-full border px-3 py-2"
                  />
                </div>

                <button type="submit" className="utsav-btn-primary w-full !py-2.5 !text-xs">
                  <Plus className="w-4 h-4" />
                  Add Guest to List
                </button>
              </form>
            </div>

            {/* Generated Invitation Copy Card */}
            <div className="utsav-card p-5 bg-utsav-primary/5 border-utsav-primary/20 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-extrabold text-utsav-primary">
                  <Sparkles className="w-4 h-4 text-utsav-coral" />
                  Shareable Invitation Preview
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(invitationText);
                    setCopiedInvite(true);
                    setTimeout(() => setCopiedInvite(false), 2500);
                  }}
                  className="inline-flex items-center gap-1 font-extrabold text-utsav-primary hover:underline"
                >
                  {copiedInvite ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Text
                    </>
                  )}
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-[11px] bg-utsav-surface p-3.5 rounded-2xl border border-utsav-primary/12 text-utsav-text leading-relaxed">
                {invitationText}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </EventWorkspaceShell>
  );
}
