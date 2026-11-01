"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Store,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
  Info,
  Copy,
} from "lucide-react";
import { useUtsav } from "@/context/UtsavContext";
import { EventWorkspaceShell } from "@/components/layout/EventWorkspaceShell";
import {
  calculateVendorMetrics,
  computeRelativeDueDate,
  formatMinorCurrency,
  toMinorUnits,
} from "@/lib/utils/currency";
import { VendorBookingStatus, VendorPaymentStatus } from "@/types/event";

const VENDOR_CATEGORIES = [
  "ALL",
  "Venues",
  "Caterers",
  "Decorators",
  "Photographers",
  "Videographers",
  "DJs",
  "Entertainment providers",
  "Event coordinators",
  "Transportation",
  "Rental services",
  "Custom services",
];

export default function VendorsPage() {
  const params = useParams<{ eventId: string }>();
  const rawId = params?.eventId;
  const eventId = (Array.isArray(rawId) ? rawId[0] : rawId) || "demo-garden-birthday";
  const {
    bundles,
    getEventBundle,
    addVendor,
    updateVendor,
    deleteVendor,
  } = useUtsav();

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Add vendor form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Caterers");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [quotedMajor, setQuotedMajor] = useState("");
  const [bookingStatus, setBookingStatus] =
    useState<VendorBookingStatus>("Quote Received");
  const [priority] = useState<"High" | "Medium" | "Low">("High");
  const [notes, setNotes] = useState("");

  // AI Vendor Assistant state
  const [selectedAssistantCategory, setSelectedAssistantCategory] =
    useState("Caterers");
  const [copiedNotice, setCopiedNotice] = useState(false);

  const bundle = getEventBundle(eventId) || bundles[0];
  if (!bundle) {
    return (
      <div className="p-10 text-center text-sm text-utsav-muted font-semibold">
        Event not found.
      </div>
    );
  }

  const { event, vendors } = bundle;
  const vendorMetrics = calculateVendorMetrics(vendors);

  const filteredVendors = vendors.filter((v) => {
    const matchesCategory =
      categoryFilter === "ALL" ||
      v.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function handleAddVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    addVendor(event.id, {
      name: name.trim(),
      category,
      contactName: contactName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      website: "",
      quotedAmountMinor: toMinorUnits(Number(quotedMajor) || 0),
      bookingStatus,
      paymentStatus: bookingStatus === "Booked" ? "Deposit Paid" : "Unpaid",
      priority,
      deadline: computeRelativeDueDate(event.eventDate, 14),
      notes: notes.trim(),
      isSample: false,
    });

    setName("");
    setContactName("");
    setPhone("");
    setEmail("");
    setQuotedMajor("");
    setNotes("");
  }

  const generatedInquiryDraft = `Subject: Event Inquiry — ${event.title} (${event.eventDate}, ${event.guestTarget} Guests in ${event.location})

Namaste Team,

We are planning our ${event.eventType} ("${event.title}") on ${event.eventDate} in ${event.location} for approximately ${event.guestTarget} guests with a "${event.theme}" theme.

We are currently shortlisting ${selectedAssistantCategory} partners and would love to receive your itemized quotation:
1. Availability for ${event.eventDate} (${event.preferences.duration})
2. Tiered pricing for ${event.guestTarget} guests (and flexibility if guest count changes by ±15%)
3. Setup/teardown timings, backup contingencies, and deposit payment schedule.

Note: Please share your itemized quote via email. Looking forward to hearing from you!`;

  return (
    <EventWorkspaceShell bundle={bundle}>
      <div className="space-y-8">
        {/* Sample Data Honesty Notice */}
        <div className="utsav-card p-4 text-xs text-utsav-muted flex items-start gap-2.5">
          <Info className="w-4 h-4 text-utsav-primary shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong className="text-utsav-text font-extrabold">Data Transparency Notice:</strong>{" "}
            Pre-populated sample vendors are explicitly labelled with{" "}
            <code className="bg-utsav-primary/10 text-utsav-primary px-1.5 py-0.5 rounded-md font-extrabold">
              [Sample]
            </code>{" "}
            and represent illustrative quotes for planning—not fabricated live vendor listings or guaranteed bookings.
          </span>
        </div>

        {/* Vendor KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="utsav-card p-4 sm:p-5">
            <span className="text-xs font-bold text-utsav-muted">
              Tracked Vendors
            </span>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-text mt-1">
              {vendorMetrics.totalVendors}
            </p>
            <span className="text-[11px] text-utsav-muted font-medium">
              Across key categories
            </span>
          </div>

          <div className="utsav-card p-4 sm:p-5">
            <span className="text-xs font-bold text-utsav-muted">
              Confirmed Bookings
            </span>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
              {vendorMetrics.bookedCount}
            </p>
            <span className="text-[11px] text-utsav-muted font-medium">
              {vendorMetrics.shortlistedCount} shortlisted quotes
            </span>
          </div>

          <div className="utsav-card p-4 sm:p-5">
            <span className="text-xs font-bold text-utsav-muted">
              Booked Vendor Value
            </span>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-primary mt-1">
              {formatMinorCurrency(
                vendorMetrics.totalBookedValueMinor,
                event.currency
              )}
            </p>
            <span className="text-[11px] text-utsav-muted font-medium">
              Locked commitments
            </span>
          </div>

          <div className="utsav-card p-4 sm:p-5">
            <span className="text-xs font-bold text-utsav-muted">
              Total Quoted Pipeline
            </span>
            <p className="utsav-num text-xl sm:text-2xl font-extrabold text-utsav-text mt-1">
              {formatMinorCurrency(
                vendorMetrics.totalQuotedValueMinor,
                event.currency
              )}
            </p>
            <span className="utsav-num text-[11px] text-utsav-muted font-medium">
              Of {formatMinorCurrency(event.totalBudgetMinor, event.currency)} budget
            </span>
          </div>
        </div>

        {/* VENDOR LIST + ADD VENDOR FORM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 utsav-card p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-utsav-text">
                Vendor Directory & Quote Comparison
              </h2>
              <input
                type="search"
                aria-label="Search vendors by name or category"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor name or category..."
                className="border px-3.5 py-2 text-xs w-full sm:w-64"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {VENDOR_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    categoryFilter === cat
                      ? "bg-utsav-primary text-white shadow-2xs"
                      : "bg-utsav-primary/6 text-utsav-muted hover:text-utsav-text"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredVendors.length === 0 ? (
              <p className="text-xs text-utsav-muted py-8 text-center">
                No vendors found in this category. Add a vendor quote on the right!
              </p>
            ) : (
              <div className="space-y-3.5">
                {filteredVendors.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-2xl bg-utsav-primary/5 p-4 sm:p-5 border border-utsav-primary/12 space-y-3 text-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-extrabold text-utsav-text">
                            {v.name}
                          </h3>
                          <span className="utsav-badge bg-utsav-primary/12 text-utsav-primary !text-[10px] !py-0.5 !px-2.5">
                            {v.category}
                          </span>
                          {v.isSample && (
                            <span className="utsav-badge bg-utsav-gold/30 text-utsav-deep !text-[10px] !py-0.5 !px-2.5">
                              Illustrative Sample
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-utsav-muted mt-1.5 font-medium">
                          {v.contactName && <span>Contact: {v.contactName}</span>}
                          {v.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="w-3 h-3 text-utsav-primary" />
                              {v.phone}
                            </span>
                          )}
                          {v.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3 h-3 text-utsav-coral" />
                              {v.email}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right utsav-num">
                        <span className="text-[11px] font-bold text-utsav-muted block">
                          Quoted Amount
                        </span>
                        <span className="text-base font-extrabold text-utsav-primary">
                          {formatMinorCurrency(v.quotedAmountMinor, event.currency)}
                        </span>
                      </div>
                    </div>

                    {v.notes && (
                      <p className="text-utsav-muted bg-utsav-surface p-3 rounded-xl border border-utsav-primary/10 leading-relaxed">
                        {v.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-utsav-primary/10">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="text-[11px] font-bold text-utsav-muted">
                          Booking:
                        </label>
                        <select
                          aria-label="Vendor booking status"
                          value={v.bookingStatus}
                          onChange={(e) =>
                            updateVendor(event.id, v.id, {
                              bookingStatus: e.target.value as VendorBookingStatus,
                            })
                          }
                          className="rounded-xl border px-2.5 py-1 text-xs font-extrabold text-utsav-text"
                        >
                          <option value="Not Contacted">Not Contacted</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Quote Received">Quote Received</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Booked">Booked</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>

                        <label className="text-[11px] font-bold text-utsav-muted ml-1">
                          Payment:
                        </label>
                        <select
                          aria-label="Vendor payment status"
                          value={v.paymentStatus}
                          onChange={(e) =>
                            updateVendor(event.id, v.id, {
                              paymentStatus: e.target.value as VendorPaymentStatus,
                            })
                          }
                          className="rounded-xl border px-2.5 py-1 text-xs font-bold"
                        >
                          <option value="Unpaid">Unpaid</option>
                          <option value="Deposit Paid">Deposit Paid</option>
                          <option value="Partially Paid">Partially Paid</option>
                          <option value="Paid in Full">Paid in Full</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteVendor(event.id, v.id)}
                        className="p-1.5 text-utsav-muted hover:text-utsav-coral transition-colors"
                        title="Remove vendor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ADD VENDOR + AI VENDOR ASSISTANT */}
          <div className="lg:col-span-4 space-y-6">
            <div className="utsav-card p-5 sm:p-6 space-y-4">
              <h2 className="text-base font-extrabold text-utsav-text flex items-center gap-2">
                <Store className="w-4 h-4 text-utsav-primary" />
                Add Vendor or Quotation
              </h2>
              <form onSubmit={handleAddVendor} className="space-y-3 text-xs">
                <div>
                  <label htmlFor="vendor-name-input" className="block font-extrabold text-utsav-text mb-1">
                    Business / Vendor Name
                  </label>
                  <input
                    id="vendor-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., SpiceCraft Catering Bengaluru"
                    className="w-full border px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="vendor-category-select" className="block font-extrabold text-utsav-text mb-1">
                      Category
                    </label>
                    <select
                      id="vendor-category-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border px-2.5 py-2"
                    >
                      {VENDOR_CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="vendor-quoted-input" className="block font-extrabold text-utsav-text mb-1">
                      Quoted Price ({event.currency})
                    </label>
                    <input
                      id="vendor-quoted-input"
                      type="number"
                      min={0}
                      value={quotedMajor}
                      onChange={(e) => setQuotedMajor(e.target.value)}
                      placeholder="24000"
                      className="w-full border px-3 py-2 utsav-num"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="vendor-contact-input" className="block font-extrabold text-utsav-text mb-1">
                      Contact Person
                    </label>
                    <input
                      id="vendor-contact-input"
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Coordinator Name"
                      className="w-full border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="vendor-status-select" className="block font-extrabold text-utsav-text mb-1">
                      Booking Status
                    </label>
                    <select
                      id="vendor-status-select"
                      value={bookingStatus}
                      onChange={(e) =>
                        setBookingStatus(e.target.value as VendorBookingStatus)
                      }
                      className="w-full border px-2.5 py-2"
                    >
                      <option value="Not Contacted">Not Contacted</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Quote Received">Quote Received</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Booked">Booked</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="vendor-notes-input" className="block font-extrabold text-utsav-text mb-1">
                    Notes & Contract Terms
                  </label>
                  <input
                    id="vendor-notes-input"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Includes 2 live counters, 50% advance"
                    className="w-full border px-3 py-2"
                  />
                </div>

                <button type="submit" className="utsav-btn-primary w-full !py-2.5 !text-xs">
                  <Plus className="w-4 h-4" />
                  Save Vendor to Tracker
                </button>
              </form>
            </div>

            {/* AI VENDOR ASSISTANT */}
            <div className="utsav-card p-5 bg-utsav-primary/5 border-utsav-primary/20 space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-extrabold text-utsav-primary">
                  <Sparkles className="w-4 h-4 text-utsav-coral" />
                  AI Vendor Inquiry Assistant
                </span>
              </div>

              <div>
                <label className="block font-extrabold text-utsav-text mb-1">
                  Select Category to Prepare Inquiry:
                </label>
                <select
                  value={selectedAssistantCategory}
                  onChange={(e) => setSelectedAssistantCategory(e.target.value)}
                  className="w-full border px-3 py-2"
                >
                  {VENDOR_CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="utsav-card p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-utsav-text">
                    Ready-to-Send Inquiry Template
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(generatedInquiryDraft);
                      setCopiedNotice(true);
                      setTimeout(() => setCopiedNotice(false), 2500);
                    }}
                    className="inline-flex items-center gap-1 text-utsav-primary font-extrabold hover:underline"
                  >
                    {copiedNotice ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Draft
                      </>
                    )}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-[11px] text-utsav-muted leading-relaxed">
                  {generatedInquiryDraft}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EventWorkspaceShell>
  );
}
