"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  PlusCircle,
  LogIn,
  LogOut,
  RotateCcw,
  Menu,
  X,
  ShieldCheck,
  Moon,
  Sun,
  PartyPopper,
  ChevronRight,
} from "lucide-react";
import { useUtsav } from "@/context/UtsavContext";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    isDemoMode,
    themeMode,
    toggleThemeMode,
    enterDemoMode,
    logout,
    resetDemoData,
  } = useUtsav();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDark = themeMode === "dark";

  const navLinks = [
    {
      href: "/dashboard",
      label: "Command Center",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/events/new",
      label: "Create Event",
      icon: PlusCircle,
      active: pathname === "/events/new",
    },
    {
      href: "/events/demo-garden-birthday",
      label: "Live Demo Workspace",
      icon: PartyPopper,
      active: pathname?.startsWith("/events/demo-garden-birthday"),
    },
  ];

  return (
    <header className="sticky top-0 z-40 utsav-glass border-b border-utsav-primary/12 no-print w-full">
      <div className="utsav-container h-16 sm:h-[68px] flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Desktop/Tablet Navigation */}
        <div className="flex items-center gap-3 lg:gap-7 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-utsav-primary rounded-xl shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-utsav-gradient flex items-center justify-center text-white shadow-glow group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-utsav-gold" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-utsav-text leading-none whitespace-nowrap">
                Verve
                <span className="bg-gradient-to-r from-utsav-primary to-utsav-coral bg-clip-text text-transparent">
                  Plan
                </span>
              </span>
              <span className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.14em] text-utsav-muted mt-1 whitespace-nowrap">
                Dream · Plan · Celebrate
              </span>
            </div>
          </Link>

          {/* Desktop & Tablet Navigation Pills (Never wraps onto 2 lines) */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-1 lg:gap-1.5"
          >
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 lg:px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold tracking-tight whitespace-nowrap shrink-0 transition-all duration-150 flex items-center gap-1.5 ${
                    item.active
                      ? "bg-utsav-primary text-white shadow-soft"
                      : "text-utsav-muted hover:text-utsav-text hover:bg-utsav-primary/10"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Controls: Demo Pill, Theme Toggle & User Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {isDemoMode && (
            <div className="hidden xl:flex items-center gap-2 rounded-full bg-utsav-primary/10 border border-utsav-primary/20 px-3 py-1.5 text-xs font-bold text-utsav-primary whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-utsav-coral shrink-0" />
              <span>Demo Mode Active</span>
              <span className="text-utsav-muted">·</span>
              <button
                type="button"
                onClick={() => resetDemoData()}
                className="inline-flex items-center gap-1 text-utsav-deep hover:underline cursor-pointer"
                title="Reset sample events to default state"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          )}

          {/* Theme Mode Toggle (Always visible on Desktop, Tablet & Android) */}
          <button
            type="button"
            onClick={toggleThemeMode}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl border border-utsav-primary/25 bg-utsav-surface text-xs font-extrabold text-utsav-text hover:border-utsav-primary hover:bg-utsav-primary/10 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle color theme"
            aria-pressed={isDark}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-utsav-gold shrink-0" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-utsav-primary shrink-0" />
                <span>Dark</span>
              </>
            )}
          </button>

          {/* Desktop & Tablet User Profile & CTA */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <div className="hidden 2xl:flex flex-col text-right pr-1 whitespace-nowrap">
                  <span className="text-xs font-bold text-utsav-text leading-tight">
                    {user.displayName}
                  </span>
                  <span className="text-[11px] font-medium text-utsav-muted">
                    {user.isDemo ? "Local Demo Workspace" : user.email}
                  </span>
                </div>
                <Link
                  href="/events/new"
                  className="utsav-btn-primary !py-2 !px-3.5 !text-xs whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5 text-utsav-gold shrink-0" />
                  <span>New Event</span>
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    router.push("/login");
                  }}
                  className="p-2.5 min-h-[40px] rounded-xl border border-utsav-primary/15 bg-utsav-surface text-utsav-muted hover:text-utsav-coral transition-colors cursor-pointer shrink-0"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    enterDemoMode();
                    router.push("/dashboard");
                  }}
                  className="utsav-btn-secondary !py-2 !px-3.5 !text-xs whitespace-nowrap"
                >
                  Explore Demo
                </button>
                <Link
                  href="/login"
                  className="utsav-btn-primary !py-2 !px-4 !text-xs whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile / Android Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2.5 min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl border border-utsav-primary/20 bg-utsav-surface text-utsav-text hover:bg-utsav-primary/10 transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Android / Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-utsav-primary/15 bg-utsav-surface px-4 pt-3 pb-6 space-y-3 shadow-2xl">
          {isDemoMode && (
            <div className="flex items-center justify-between rounded-xl bg-utsav-primary/10 px-3.5 py-2.5 text-xs font-bold text-utsav-primary">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-utsav-coral shrink-0" />
                Demo Mode Active
              </span>
              <button
                type="button"
                onClick={() => {
                  resetDemoData();
                  setMobileOpen(false);
                }}
                className="underline font-extrabold"
              >
                Reset Data
              </button>
            </div>
          )}

          <div className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 min-h-[44px] rounded-xl text-sm font-bold transition-colors ${
                    item.active
                      ? "bg-utsav-primary text-white"
                      : "text-utsav-text hover:bg-utsav-primary/10"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-utsav-primary/10 flex flex-col gap-2">
            <Link
              href="/events/new"
              onClick={() => setMobileOpen(false)}
              className="utsav-btn-primary w-full py-3"
            >
              <Sparkles className="w-4 h-4 text-utsav-gold" />
              Plan a New Celebration
            </Link>
            {user ? (
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setMobileOpen(false);
                  router.push("/login");
                }}
                className="w-full py-2.5 min-h-[44px] rounded-xl border border-utsav-coral/40 text-xs font-bold text-utsav-coral"
              >
                Sign Out ({user.displayName})
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="utsav-btn-secondary w-full py-2.5 text-center"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
