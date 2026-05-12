"use client";

import Link from "next/link";
import { useState } from "react";
import { Shield, Menu, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/#features", label: "Features" },
    { href: "/#security", label: "Security" },
    { href: "/#download", label: "Download" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#0a0f1c]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5 text-white font-bold text-lg tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/20">
            <Shield className="h-4 w-4 text-white" />
          </div>
          Hemdal
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth"
            className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-2"
          >
            Sign In
          </Link>
          <a
            href="https://github.com/zanni098/hemdal/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500/10 border border-sky-500/20 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/20 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        </div>

        <button
          className="md:hidden text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-white/[0.04] bg-[#0a0f1c]/95 backdrop-blur-xl"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-slate-400 hover:text-white py-2 text-sm"
                >
                  {l.label}
                </a>
              ))}
              <Link
                href="/auth"
                onClick={() => setMobileOpen(false)}
                className="text-slate-300 hover:text-white py-2 text-sm"
              >
                Sign In
              </Link>
              <a
                href="https://github.com/zanni098/hemdal/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500/10 border border-sky-500/20 px-4 py-2.5 text-sm font-medium text-sky-300"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
