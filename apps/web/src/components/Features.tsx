"use client";

import { motion } from "framer-motion";
import {
  Lock,
  Fingerprint,
  KeyRound,
  Timer,
  Search,
  ShieldAlert,
  Import,
  MonitorSmartphone,
  Minus,
  ArrowLeftRight,
} from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "AES-256-GCM encryption. Your master password is never stored.",
    gradient: "from-sky-500/20 to-blue-600/20",
    iconColor: "text-sky-400",
    border: "border-sky-500/15",
  },
  {
    icon: Fingerprint,
    title: "Biometric Unlock",
    description: "Windows Hello with DPAPI-encrypted key storage. Touch ID coming.",
    gradient: "from-violet-500/20 to-purple-600/20",
    iconColor: "text-violet-400",
    border: "border-violet-500/15",
  },
  {
    icon: KeyRound,
    title: "Browser Autofill",
    description: "Chrome/Firefox extension detects login forms and fills credentials.",
    gradient: "from-emerald-500/20 to-teal-600/20",
    iconColor: "text-emerald-400",
    border: "border-emerald-500/15",
  },
  {
    icon: Timer,
    title: "TOTP / 2FA Codes",
    description: "Generate 6-digit codes from stored secrets with live countdown.",
    gradient: "from-amber-500/20 to-orange-600/20",
    iconColor: "text-amber-400",
    border: "border-amber-500/15",
  },
  {
    icon: Search,
    title: "Fuzzy Search",
    description: "Find any item in milliseconds with substring scoring.",
    gradient: "from-pink-500/20 to-rose-600/20",
    iconColor: "text-pink-400",
    border: "border-pink-500/15",
  },
  {
    icon: ShieldAlert,
    title: "Breach Check",
    description: "Check passwords against Have I Been Pwned via k-Anonymity API.",
    gradient: "from-red-500/20 to-rose-600/20",
    iconColor: "text-red-400",
    border: "border-red-500/15",
  },
  {
    icon: Import,
    title: "Import & Export",
    description: "Bitwarden, 1Password, CSV import. JSON/CSV export.",
    gradient: "from-cyan-500/20 to-sky-600/20",
    iconColor: "text-cyan-400",
    border: "border-cyan-500/15",
  },
  {
    icon: MonitorSmartphone,
    title: "Password Generator",
    description: "Configurable length, symbols, and real-time strength meter.",
    gradient: "from-indigo-500/20 to-blue-600/20",
    iconColor: "text-indigo-400",
    border: "border-indigo-500/15",
  },
  {
    icon: Minus,
    title: "System Tray & Auto-Lock",
    description: "Minimize to tray, lock from tray, auto-lock after inactivity.",
    gradient: "from-slate-500/20 to-gray-600/20",
    iconColor: "text-slate-400",
    border: "border-slate-500/15",
  },
  {
    icon: ArrowLeftRight,
    title: "P2P Sync Ready",
    description: "Synchronize across devices on your local network. No cloud.",
    gradient: "from-fuchsia-500/20 to-pink-600/20",
    iconColor: "text-fuchsia-400",
    border: "border-fuchsia-500/15",
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Features() {
  return (
    <section id="features" className="relative bg-[#0a0f1c] py-32">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full glow-cyan opacity-30 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mb-20 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
          >
            Everything you need
            <br />
            <span className="text-gradient">to stay secure</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 max-w-xl mx-auto text-lg text-slate-400"
          >
            Enterprise-grade security in a simple, beautiful desktop app.
            Open source. Always free.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              className={`group relative overflow-hidden rounded-2xl border ${f.border} bg-gradient-to-br ${f.gradient} p-0.5 transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="relative h-full rounded-[14px] bg-[#0d1117]/90 p-6 transition-colors group-hover:bg-[#0d1117]/70">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/30 shadow-sm">
                  <f.icon className={`h-5 w-5 ${f.iconColor}`} />
                </div>
                <h3 className="text-[15px] font-semibold text-white tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-2 text-[13px] text-slate-400 leading-relaxed">
                  {f.description}
                </p>

                {/* Subtle glow on hover */}
                <div
                  className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${f.gradient} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40`}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
