"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          message: "Newsletter signup",
          type: "newsletter",
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Subscribed! You will hear from us soon.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative bg-[#0a0f1c] py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full glow-cyan opacity-20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-slate-700/30 bg-[#0d1117]/60 p-10 text-center backdrop-blur-sm sm:p-16"
        >
          {/* Decorative corner accents */}
          <div className="absolute -top-px -left-px h-20 w-20 rounded-tl-3xl border-t border-l border-sky-500/10" />
          <div className="absolute -bottom-px -right-px h-20 w-20 rounded-br-3xl border-b border-r border-sky-500/10" />

          <div className="relative">
            <div className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/15">
              <Mail className="h-5 w-5 text-sky-400" />
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Stay in the <span className="text-gradient">loop</span>
            </h2>
            <p className="mt-4 text-slate-400 max-w-lg mx-auto">
              Get notified about new releases, security updates, and features.
              No spam, ever.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-sky-500/40 focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-400 transition-colors disabled:opacity-50 shadow-lg shadow-sky-500/15"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {status === "success" && (
              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                {message}
              </div>
            )}
            {status === "error" && (
              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                {message}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
