"use client";

import { motion } from "framer-motion";
import { Code, Users, Briefcase, Globe } from "lucide-react";

const cases = [
  {
    icon: Code,
    title: "Developers",
    description:
      "Store API keys, environment variables, SSH keys, and database credentials securely. Never commit secrets to Git again.",
    bullets: ["API Keys & Tokens", "Environment Variables", "SSH Keys", "Database URLs"],
  },
  {
    icon: Users,
    title: "Personal Use",
    description:
      "Manage all your personal passwords, secure notes, and credit cards in one encrypted vault that only you can unlock.",
    bullets: ["Passwords & Logins", "Secure Notes", "Credit Cards", "2FA Secrets"],
  },
  {
    icon: Briefcase,
    title: "Teams",
    description:
      "Share credentials without sharing plaintext. P2P sync keeps team secrets on your local network, not in the cloud.",
    bullets: ["Shared Credentials", "P2P Sync", "No Cloud Required", "Audit Trail Ready"],
  },
  {
    icon: Globe,
    title: "Freelancers",
    description:
      "Juggling multiple client accounts? Organize credentials by project with tags, favorites, and fast fuzzy search.",
    bullets: ["Project Organization", "Tags & Favorites", "Fast Search", "Client Separation"],
  },
];

export default function UseCases() {
  return (
    <section id="use-cases" className="bg-gray-900 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Built for how you work
          </h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
            Whether you are a developer, a team, or just someone who values privacy, Hemdal fits your workflow.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {cases.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-gray-800 bg-gray-950 p-8"
            >
              <div className="flex items-start gap-4">
                <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-hemdal-500/10 text-hemdal-400">
                  <c.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{c.title}</h3>
                  <p className="mt-2 text-gray-400 text-sm leading-relaxed">
                    {c.description}
                  </p>
                  <ul className="mt-4 grid grid-cols-2 gap-2">
                    {c.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-center gap-2 text-sm text-gray-300"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-hemdal-400" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
