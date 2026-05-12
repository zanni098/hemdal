"use client";

import { motion } from "framer-motion";
import { Lock, Key, Database, EyeOff } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Lock,
    title: "Master Password",
    description:
      "You create a strong master password. It is never stored anywhere. Not on disk, not in memory for long, and never sent to any server.",
  },
  {
    step: "02",
    icon: Key,
    title: "Argon2id Derivation",
    description:
      "Your master password is hashed with Argon2id, the winner of the Password Hashing Competition. This produces a cryptographically strong master key.",
  },
  {
    step: "03",
    icon: Database,
    title: "Vault Key Encryption",
    description:
      "A random 256-bit vault key encrypts all your items. That vault key itself is encrypted by your master key using AES-256-GCM.",
  },
  {
    step: "04",
    icon: EyeOff,
    title: "Secure Memory",
    description:
      "All keys use secure memory containers that are automatically zeroed from RAM when no longer needed. Keys never swap to disk.",
  },
];

export default function Security() {
  return (
    <section id="security" className="bg-gray-950 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Security by design
          </h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
            We built Hemdal with a zero-trust architecture. Every layer is hardened so your secrets stay yours.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex gap-5 rounded-2xl border border-gray-800 bg-gray-900/50 p-6"
            >
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-hemdal-500/10 text-hemdal-400">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 h-full w-px bg-gradient-to-b from-hemdal-500/20 to-transparent" />
              </div>
              <div>
                <div className="text-xs font-bold text-hemdal-500 uppercase tracking-wider">
                  Step {s.step}
                </div>
                <h3 className="mt-1 text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  {s.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Architecture diagram box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 rounded-2xl border border-gray-800 bg-gray-900/50 p-8"
        >
          <h3 className="text-center text-lg font-semibold text-white mb-6">
            Encryption Flow
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
            <div className="rounded-lg border border-gray-700 bg-gray-950 px-5 py-3 text-gray-300">
              Master Password
            </div>
            <span className="text-gray-600 hidden md:inline">&rarr;</span>
            <span className="text-gray-600 md:hidden">&darr;</span>
            <div className="rounded-lg border border-hemdal-500/30 bg-hemdal-950/30 px-5 py-3 text-hemdal-300">
              Argon2id
            </div>
            <span className="text-gray-600 hidden md:inline">&rarr;</span>
            <span className="text-gray-600 md:hidden">&darr;</span>
            <div className="rounded-lg border border-gray-700 bg-gray-950 px-5 py-3 text-gray-300">
              Master Key
            </div>
            <span className="text-gray-600 hidden md:inline">&rarr;</span>
            <span className="text-gray-600 md:hidden">&darr;</span>
            <div className="rounded-lg border border-hemdal-500/30 bg-hemdal-950/30 px-5 py-3 text-hemdal-300">
              AES-256-GCM
            </div>
            <span className="text-gray-600 hidden md:inline">&rarr;</span>
            <span className="text-gray-600 md:hidden">&darr;</span>
            <div className="rounded-lg border border-gray-700 bg-gray-950 px-5 py-3 text-gray-300">
              Vault Items
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
