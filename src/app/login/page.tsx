"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, LogIn, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { useUtsav } from "@/context/UtsavContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, enterDemoMode, isSupabaseReady } = useUtsav();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResetMessage(null);
    setLoading(true);

    const res = await loginWithEmail(email, password);
    setLoading(false);

    if (!res.ok) {
      setError(res.error || "Sign in failed.");
      return;
    }

    router.push("/dashboard");
  }

  async function handlePasswordReset() {
    setError(null);
    setResetMessage(null);
    if (!email.trim()) {
      setError("Enter your email address above first to request a password reset link.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(
        "Password reset requires a configured Supabase project. Use Demo Mode below to explore offline."
      );
      return;
    }
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (resetErr) {
      setError(resetErr.message);
    } else {
      setResetMessage("Password reset instructions have been requested for your email.");
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md utsav-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-utsav-gradient mx-auto flex items-center justify-center text-white shadow-glow">
            <Sparkles className="w-6 h-6 text-utsav-gold" />
          </div>
          <h1 className="text-2xl font-extrabold text-utsav-text">
            Welcome back to VervePlan
          </h1>
          <p className="text-xs text-utsav-muted font-medium">
            Sign in with your Supabase account or launch explicit Demo Mode.
          </p>
        </div>

        {/* Explicit Demo Mode Callout */}
        <div className="rounded-2xl bg-utsav-primary/6 p-4 border border-utsav-primary/20 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-utsav-primary">
            <ShieldCheck className="w-4 h-4 text-utsav-coral shrink-0" />
            {isSupabaseReady
              ? "Instant Demo Workspace Available"
              : "Supabase Credentials Not Configured — Demo Mode Ready"}
          </div>
          <p className="text-xs text-utsav-muted leading-relaxed">
            Explore all 3 seeded celebrations, create new events, and run the AI Replanning Engine using browser-local persistence without external credentials.
          </p>
          <button
            type="button"
            onClick={() => {
              enterDemoMode();
              router.push("/dashboard");
            }}
            className="utsav-btn-primary w-full !py-2.5 !text-xs"
          >
            Continue in Explicit Demo Mode →
          </button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="grow border-t border-utsav-primary/15" />
          <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-utsav-muted font-extrabold">
            Or Email & Password
          </span>
          <div className="grow border-t border-utsav-primary/15" />
        </div>

        {error && (
          <div className="rounded-2xl bg-utsav-coral/15 border border-utsav-coral/30 p-3.5 text-xs font-semibold text-utsav-text flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-utsav-coral shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {resetMessage && (
          <div className="rounded-2xl bg-emerald-500/12 border border-emerald-500/25 p-3.5 text-xs font-semibold text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{resetMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-extrabold text-utsav-text mb-1.5"
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-extrabold text-utsav-text"
              >
                Password
              </label>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-xs font-bold text-utsav-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              required
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
            <LogIn className="w-4 h-4 text-utsav-primary" />
            {loading ? "Signing In..." : "Sign In with Email"}
          </button>
        </form>

        <p className="text-center text-xs text-utsav-muted font-medium">
          New to VervePlan?{" "}
          <Link href="/signup" className="font-extrabold text-utsav-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
