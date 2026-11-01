"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, UserPlus, ShieldCheck, AlertCircle } from "lucide-react";
import { useUtsav } from "@/context/UtsavContext";

export default function SignupPage() {
  const router = useRouter();
  const { signupWithEmail, enterDemoMode, isSupabaseReady } = useUtsav();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signupWithEmail(displayName, email, password);
    setLoading(false);

    if (!res.ok) {
      setError(res.error || "Could not create account.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md utsav-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-utsav-gradient mx-auto flex items-center justify-center text-white shadow-glow">
            <Sparkles className="w-6 h-6 text-utsav-gold" />
          </div>
          <h1 className="text-2xl font-extrabold text-utsav-text">
            Create Your VervePlan Account
          </h1>
          <p className="text-xs text-utsav-muted font-medium">
            Plan weddings, birthdays, festivals, and corporate celebrations.
          </p>
        </div>

        <div className="rounded-2xl bg-utsav-primary/6 p-4 border border-utsav-primary/20 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-utsav-primary">
            <ShieldCheck className="w-4 h-4 text-utsav-coral shrink-0" />
            {isSupabaseReady
              ? "Try Demo Mode Instantly"
              : "No External Credentials Configured — Use Demo Mode"}
          </div>
          <p className="text-xs text-utsav-muted leading-relaxed">
            Launch directly into a local Demo Mode workspace with full persistence and 3 sample Indian celebrations.
          </p>
          <button
            type="button"
            onClick={() => {
              enterDemoMode(displayName.trim() || "Aarav Sharma (Demo Mode)");
              router.push("/dashboard");
            }}
            className="utsav-btn-primary w-full !py-2.5 !text-xs"
          >
            Launch Demo Mode Workspace →
          </button>
        </div>

        {error && (
          <div className="rounded-2xl bg-utsav-coral/15 border border-utsav-coral/30 p-3.5 text-xs font-semibold text-utsav-text flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-utsav-coral shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="signup-name"
              className="block text-xs font-extrabold text-utsav-text mb-1.5"
            >
              Your Name
            </label>
            <input
              id="signup-name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Priya & Rohan"
              className="w-full border px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="block text-xs font-extrabold text-utsav-text mb-1.5"
            >
              Email Address
            </label>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="block text-xs font-extrabold text-utsav-text mb-1.5"
            >
              Password (min 6 characters)
            </label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border px-3.5 py-2.5 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="utsav-btn-secondary w-full !py-3"
          >
            <UserPlus className="w-4 h-4 text-utsav-primary" />
            {loading ? "Creating Account..." : "Register with Supabase Auth"}
          </button>
        </form>

        <p className="text-center text-xs text-utsav-muted font-medium">
          Already have an account?{" "}
          <Link href="/login" className="font-extrabold text-utsav-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
