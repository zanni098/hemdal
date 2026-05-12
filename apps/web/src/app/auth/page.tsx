"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shield, Mail, Github, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for the magic link!");
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: "github" | "google") => {
    setError("");
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/account`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 text-hemdal-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Welcome to Hemdal</h1>
          <p className="mt-2 text-gray-400">
            Sign in to access your account and manage downloads.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8">
          {/* OAuth buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleOAuth("github")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              <Github className="h-4 w-4" />
              Continue with GitHub
            </button>
          </div>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-800" />
            <span className="text-xs text-gray-500 uppercase">or use email</span>
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          {/* Magic link form */}
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-hemdal-500 focus:outline-none focus:ring-1 focus:ring-hemdal-500"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-950/30 border border-red-900/50 px-3 py-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {message && (
              <div className="flex items-center gap-2 rounded-lg bg-green-950/30 border border-green-900/50 px-3 py-2 text-sm text-green-400">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-hemdal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-hemdal-500 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Send Magic Link
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          By signing in, you agree to our{" "}
          <span className="text-gray-400 hover:text-white cursor-pointer">Terms</span> and{" "}
          <span className="text-gray-400 hover:text-white cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
