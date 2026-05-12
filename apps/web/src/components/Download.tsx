"use client";

import { motion } from "framer-motion";
import { Monitor, Chrome, Github, Terminal, Package } from "lucide-react";

const platforms = [
  {
    icon: Package,
    title: "Windows",
    description: "MSI installer or NSIS setup executable",
    href: "https://github.com/zanni098/hemdal/releases",
    primary: true,
  },
  {
    icon: Github,
    title: "Build from Source",
    description: "Clone the repo and build with Tauri + Cargo",
    href: "https://github.com/zanni098/hemdal",
    primary: false,
  },
  {
    icon: Chrome,
    title: "Browser Extension",
    description: "Load unpacked from apps/extension/dist",
    href: "https://github.com/zanni098/hemdal/tree/master/apps/extension",
    primary: false,
  },
];

export default function DownloadSection() {
  return (
    <section id="download" className="relative bg-[#0a0f1c] py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full glow-purple opacity-15 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Get <span className="text-gradient">Hemdal</span>
          </h2>
          <p className="mt-5 max-w-xl mx-auto text-lg text-slate-400">
            Available for Windows today. macOS and Linux coming soon.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-3 max-w-4xl mx-auto">
          {platforms.map((p, i) => (
            <motion.a
              key={p.title}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`group relative overflow-hidden rounded-2xl border p-7 text-center transition-all duration-300 hover:scale-[1.02] ${p.primary
                  ? "border-sky-500/20 bg-sky-500/[0.04] hover:border-sky-500/40"
                  : "border-slate-700/40 bg-[#0d1117]/60 hover:border-slate-600/60"
                }`}
            >
              <div
                className={`mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${p.primary
                    ? "bg-sky-500/10 text-sky-400"
                    : "bg-slate-800/60 text-slate-400"
                  }`}
              >
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{p.description}</p>
              <div
                className={`mt-5 text-sm font-medium ${p.primary ? "text-sky-400" : "text-slate-400"
                  }`}
              >
                {p.primary ? "Download Latest →" : "View Instructions →"}
              </div>

              {/* Hover glow */}
              {p.primary && (
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-500/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              )}
            </motion.a>
          ))}
        </div>

        {/* Quick start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 mx-auto max-w-3xl"
        >
          <div className="rounded-2xl border border-slate-700/30 bg-[#0d1117]/80 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-700/30 px-5 py-3">
              <Terminal className="h-4 w-4 text-slate-500" />
              <span className="text-xs text-slate-500 font-mono">Quick Start</span>
            </div>
            <pre className="overflow-x-auto p-5 text-sm text-slate-300 font-mono leading-relaxed">
              <code>{`git clone https://github.com/zanni098/hemdal.git
cd hemdal && pnpm install
cd apps/desktop && pnpm tauri:build`}</code>
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
