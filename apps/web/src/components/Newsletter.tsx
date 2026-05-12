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
        body: JSON.stringify({ email, message: "Newsletter signup", type: "newsletter" }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("You have been subscribed to updates!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gray-950 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-gray-800 bg-gray-900/50 px-8 py-16 text-center"
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-hemdal-500/10 blur-[80px]" />
          </div>

          <div className="relative">
            <Mail className="h-10 w-10 text-hemdal-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white">Stay in the loop</h2>
            <p className="mt-3 text-gray-400 max-w-xl mx-auto">
              Get notified about new releases, security updates, and features. No spam, ever.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-hemdal-500 focus:outline-none focus:ring-1 focus:ring-hemdal-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-hemdal-600 px-6 py-3 text-sm font-medium text-white hover:bg-hemdal-500 transition-colors disabled:opacity-50"
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
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-400">
                <CheckCircle className="h-4 w-4" />
                {message}
              </div>
            )}
            {status === "error" && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-red-400">
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
