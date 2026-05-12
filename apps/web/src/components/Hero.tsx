"use client";

import { motion } from "framer-motion";
import { Download, ArrowRight, Shield, Lock, Fingerprint } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0a0f1c]">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-grid" />
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full glow-cyan opacity-60 blur-3xl" />
      <div className="absolute top-20 right-1/4 h-[400px] w-[400px] rounded-full glow-purple opacity-40 blur-3xl" />

      {/* Noise */}
      <div className="absolute inset-0 noise-overlay" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-20">
        <div className="flex flex-col items-center text-center">
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/5 px-4 py-1.5 text-sm text-sky-300 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
              </span>
              v0.1.0 with Windows Hello biometric unlock
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="max-w-5xl text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            Your secrets,{" "}
            <span className="text-gradient">encrypted</span>
            <br />
            and always yours.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed"
          >
            Hemdal is an open-source password and secret manager built with
            end-to-end encryption, biometric unlock, and P2P sync. No cloud
            required.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4"
          >
            <a
              href="https://github.com/zanni098/hemdal/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="group btn-shimmer inline-flex items-center gap-2.5 rounded-xl bg-sky-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition-all"
            >
              <Download className="h-4 w-4" />
              Download for Windows
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="https://github.com/zanni098/hemdal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-7 py-3.5 text-sm font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-colors backdrop-blur-sm"
            >
              View on GitHub
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-8"
          >
            {[
              { icon: Lock, label: "AES-256-GCM" },
              { icon: Shield, label: "Argon2id" },
              { icon: Fingerprint, label: "Zero-Knowledge" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 text-sm text-slate-500">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/60 border border-slate-700/40">
                  <item.icon className="h-4 w-4 text-sky-400" />
                </div>
                {item.label}
              </div>
            ))}
          </motion.div>

          {/* Floating UI mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 w-full max-w-4xl"
          >
            <div className="relative rounded-2xl border border-slate-700/50 bg-slate-900/60 p-1 shadow-2xl shadow-black/40 backdrop-blur-sm">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 rounded-xl bg-[#0d1117] px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <div className="ml-4 flex-1 rounded-lg bg-slate-800/80 px-3 py-1 text-xs text-slate-500 text-center">
                  hemdal.app/vault
                </div>
              </div>

              {/* App content mockup */}
              <div className="relative overflow-hidden rounded-b-xl bg-[#0d1117] p-6">
                {/* Top bar */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-sky-400" />
                    <span className="font-semibold text-white">Hemdal Vault</span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-purple-500" />
                </div>

                {/* Search + add */}
                <div className="mb-5 flex gap-3">
                  <div className="h-10 flex-1 rounded-lg bg-slate-800/60 border border-slate-700/40" />
                  <div className="h-10 w-24 rounded-lg bg-sky-500/20 border border-sky-500/30" />
                </div>

                {/* Vault items */}
                <div className="space-y-2.5">
                  {[
                    { color: "bg-emerald-500/20", border: "border-emerald-500/20", dot: "bg-emerald-400" },
                    { color: "bg-amber-500/20", border: "border-amber-500/20", dot: "bg-amber-400" },
                    { color: "bg-sky-500/20", border: "border-sky-500/20", dot: "bg-sky-400" },
                    { color: "bg-purple-500/20", border: "border-purple-500/20", dot: "bg-purple-400" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 rounded-lg ${item.color} border ${item.border} px-4 py-3`}
                    >
                      <div className={`h-2 w-2 rounded-full ${item.dot}`} />
                      <div className="h-2.5 w-32 rounded bg-slate-600/40" />
                      <div className="ml-auto h-2 w-20 rounded bg-slate-700/40" />
                    </div>
                  ))}
                </div>

                {/* Floating glow behind mockup */}
                <div className="absolute -bottom-20 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
