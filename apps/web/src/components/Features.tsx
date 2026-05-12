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
  ArrowLeftRight,
  Minus,
} from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description:
      "All vault items are encrypted with AES-256-GCM. Your master password is never stored.",
  },
  {
    icon: Fingerprint,
    title: "Biometric Unlock",
    description:
      "Unlock your vault instantly with Windows Hello. Touch ID and Face ID support coming soon.",
  },
  {
    icon: KeyRound,
    title: "Browser Autofill",
    description:
      "Chrome and Firefox extension detects login forms and fills credentials automatically.",
  },
  {
    icon: Timer,
    title: "TOTP / 2FA Codes",
    description:
      "Generate 6-digit 2FA codes from stored TOTP secrets with a live 30-second countdown.",
  },
  {
    icon: Search,
    title: "Fuzzy Search",
    description:
      "Find any item in milliseconds with fast substring scoring search across your entire vault.",
  },
  {
    icon: ShieldAlert,
    title: "Breach Check",
    description:
      "Check your passwords against the Have I Been Pwned database via k-Anonymity API.",
  },
  {
    icon: Import,
    title: "Import & Export",
    description:
      "Import from Bitwarden, 1Password, and CSV. Export to encrypted JSON or CSV anytime.",
  },
  {
    icon: MonitorSmartphone,
    title: "Password Generator",
    description:
      "Built-in generator with configurable length, symbols, and a real-time strength meter.",
  },
  {
    icon: Minus,
    title: "System Tray & Auto-Lock",
    description:
      "Minimize to tray, lock from the tray menu, and auto-lock after 10 minutes of inactivity.",
  },
  {
    icon: ArrowLeftRight,
    title: "P2P Sync Ready",
    description:
      "Synchronize your vault across devices on your local network without any cloud server.",
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Features() {
  return (
    <section id="features" className="bg-gray-950 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Everything you need to stay secure
          </h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
            Hemdal packs enterprise-grade security into a simple, beautiful desktop app.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 hover:border-hemdal-500/30 transition-colors"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-hemdal-500/10 text-hemdal-400">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
