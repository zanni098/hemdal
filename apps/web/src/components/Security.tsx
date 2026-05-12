"use client";

import { motion } from "framer-motion";

export default function Security() {
  return (
    <section id="security" className="relative bg-[#0a0f1c] py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/2 right-0 h-[500px] w-[500px] -translate-y-1/2 rounded-full glow-purple opacity-20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text content */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-sky-400 mb-4"
            >
              Security
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
            >
              Security by <span className="text-gradient">design</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-5 text-lg text-slate-400 leading-relaxed"
            >
              We built Hemdal with a zero-trust architecture. Every layer is
              hardened so your secrets stay yours. No backdoors, no cloud
              storage of plaintext.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-10 space-y-6"
            >
              {[
                {
                  num: "01",
                  title: "Argon2id Key Derivation",
                  desc: "Your master password is hashed with Argon2id, the winner of the Password Hashing Competition.",
                },
                {
                  num: "02",
                  title: "AES-256-GCM Vault Encryption",
                  desc: "A random 256-bit vault key encrypts all items. The vault key itself is encrypted by your master key.",
                },
                {
                  num: "03",
                  title: "Secure Memory with Zeroize",
                  desc: "All keys use secure memory containers automatically zeroed from RAM when no longer needed.",
                },
              ].map((item) => (
                <div key={item.num} className="flex gap-4 group">
                  <span className="text-xs font-mono text-sky-500/60 pt-1">
                    {item.num}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white group-hover:text-sky-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Visual diagram */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative rounded-2xl border border-slate-700/40 bg-[#0d1117]/80 p-8 backdrop-blur-sm">
              <div className="space-y-4">
                {/* Flow diagram */}
                {[
                  { label: "Master Password", active: true },
                  { label: "Argon2id Derivation", active: true },
                  { label: "Master Key", active: true },
                  { label: "AES-256-GCM", active: true },
                  { label: "Encrypted Vault", active: false },
                ].map((step, i, arr) => (
                  <div key={step.label} className="relative">
                    <div
                      className={`flex items-center gap-4 rounded-xl border px-5 py-4 ${step.active
                          ? "border-sky-500/20 bg-sky-500/[0.06]"
                          : "border-slate-700/30 bg-slate-800/20"
                        }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${step.active
                            ? "bg-sky-500/15 text-sky-400"
                            : "bg-slate-700/30 text-slate-500"
                          }`}
                      >
                        {i + 1}
                      </div>
                      <span
                        className={`text-sm font-medium ${step.active ? "text-white" : "text-slate-400"
                          }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex justify-center py-2">
                        <div className="h-4 w-px bg-gradient-to-b from-sky-500/40 to-slate-700/30" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Corner accent */}
              <div className="absolute -top-px -left-px h-16 w-16 rounded-tl-2xl border-t border-l border-sky-500/20" />
              <div className="absolute -bottom-px -right-px h-16 w-16 rounded-br-2xl border-b border-r border-sky-500/20" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
