"use client";

import { motion } from "framer-motion";
import { Code, Users, Briefcase, Globe } from "lucide-react";

const cases = [
  {
    icon: Code,
    title: "Developers",
    description: "Store API keys, env vars, SSH keys, and database credentials securely. Never commit secrets to Git.",
    items: ["API Keys", "Env Variables", "SSH Keys", "Database URLs"],
    color: "text-emerald-400",
    bg: "from-emerald-500/10 to-teal-500/10",
    border: "border-emerald-500/10",
  },
  {
    icon: Users,
    title: "Personal Use",
    description: "Manage all your personal passwords, secure notes, and credit cards in one encrypted vault.",
    items: ["Passwords", "Secure Notes", "Credit Cards", "2FA Secrets"],
    color: "text-sky-400",
    bg: "from-sky-500/10 to-blue-500/10",
    border: "border-sky-500/10",
  },
  {
    icon: Briefcase,
    title: "Teams",
    description: "Share credentials without sharing plaintext. P2P sync keeps secrets on your local network.",
    items: ["Shared Vaults", "P2P Sync", "No Cloud", "Audit Ready"],
    color: "text-violet-400",
    bg: "from-violet-500/10 to-purple-500/10",
    border: "border-violet-500/10",
  },
  {
    icon: Globe,
    title: "Freelancers",
    description: "Juggling multiple client accounts? Organize credentials by project with tags and fast search.",
    items: ["Project Tags", "Favorites", "Fast Search", "Client Separation"],
    color: "text-amber-400",
    bg: "from-amber-500/10 to-orange-500/10",
    border: "border-amber-500/10",
  },
];

export default function UseCases() {
  return (
    <section className="relative bg-[#0a0f1c] py-32 overflow-hidden">
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full glow-cyan opacity-20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Built for how <span className="text-gradient">you work</span>
          </h2>
          <p className="mt-5 max-w-xl mx-auto text-lg text-slate-400">
            Whether you are a developer, a team, or just someone who values privacy.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          {cases.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`group relative overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-br ${c.bg} p-[1px] transition-all duration-300 hover:scale-[1.01]`}
            >
              <div className="relative h-full rounded-[15px] bg-[#0d1117]/95 p-8">
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800/60 border border-slate-700/30">
                    <c.icon className={`h-6 w-6 ${c.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white">{c.title}</h3>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                      {c.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {c.items.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-slate-700/40 bg-slate-800/40 px-3 py-1 text-xs text-slate-400"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hover glow */}
                <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${c.bg} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-50`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
