"use client";

import { motion } from "framer-motion";
import { Download, Monitor, Chrome, Github, Terminal } from "lucide-react";

const platforms = [
  {
    icon: Monitor,
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
    <section id="download" className="bg-gray-900 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Get Hemdal
          </h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
            Available for Windows today. macOS and Linux builds coming soon. The browser extension works on Chrome and Firefox.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
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
              className={`flex flex-col items-center rounded-2xl border p-8 text-center transition-colors ${
                p.primary
                  ? "border-hemdal-500/30 bg-hemdal-950/20 hover:border-hemdal-500/60"
                  : "border-gray-800 bg-gray-950 hover:border-gray-700"
              }`}
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                  p.primary
                    ? "bg-hemdal-500/10 text-hemdal-400"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                <p.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm text-gray-400">{p.description}</p>
              <div
                className={`mt-6 inline-flex items-center gap-2 text-sm font-medium ${
                  p.primary ? "text-hemdal-400" : "text-gray-300"
                }`}
              >
                <Download className="h-4 w-4" />
                {p.primary ? "Download Latest" : "View Instructions"}
              </div>
            </motion.a>
          ))}
        </div>

        {/* Quick start code block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 rounded-2xl border border-gray-800 bg-gray-950 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500 font-medium">Quick Start</span>
          </div>
          <pre className="overflow-x-auto text-sm text-gray-300 font-mono">
            <code>{`# Clone the repository
git clone https://github.com/zanni098/hemdal.git
cd hemdal

# Install dependencies
pnpm install

# Build the desktop app
cd apps/desktop && pnpm tauri:build

# Build the browser extension
cd apps/extension && pnpm build`}</code>
          </pre>
        </motion.div>
      </div>
    </section>
  );
}
