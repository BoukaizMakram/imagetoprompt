"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function LoginForm({
  next,
  initialError,
}: {
  next?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);

  const redirectTo = next || "/image-to-prompt";

  async function withGoogle() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          redirectTo
        )}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        // Email verification is disabled in Supabase settings, so we get a session
        // immediately. Refresh router to pick up the cookie.
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={withGoogle}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border border-black/10 bg-white hover:bg-paper transition disabled:opacity-50"
      >
        <GoogleIcon />
        <span className="text-sm font-semibold text-ink">Continue with Google</span>
      </button>

      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-black/10" />
        </div>
        <span className="relative inline-block px-3 text-xs uppercase tracking-wide text-ink/50 bg-white">
          or
        </span>
      </div>

      <form onSubmit={withEmail} className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-ink/60 mb-1.5 block" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-paper border border-black/10 text-[15px] text-ink focus:border-ink focus:outline-none"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink/60 mb-1.5 block" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-paper border border-black/10 text-[15px] text-ink focus:border-ink focus:outline-none"
            placeholder="At least 6 characters"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-ink text-paper font-semibold hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <p className="mt-6 text-center text-sm text-ink/60">
        {mode === "signin" ? (
          <>
            New here?{" "}
            <button onClick={() => setMode("signup")} className="text-ink font-semibold underline-offset-2 hover:underline">
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button onClick={() => setMode("signin")} className="text-ink font-semibold underline-offset-2 hover:underline">
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
