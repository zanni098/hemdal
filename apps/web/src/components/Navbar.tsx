"use client";

import Link from "next/link";
import { useState } from "react";
import { Shield, Menu, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/#features", label: "Features" },
    { href: "/#use-cases", label: "Use Cases" },
    { href: "/#security", label: "Security" },
    { href: "/#download", label: "Download" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl">
          <Shield className="h-7 w-7 text-hemdal-400" />
          Hemdal
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth"
            className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-2"
          >
            Sign In
          </Link>
          <a
            href="https://github.com/zanni098/hemdal/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-hemdal-600 px-4 py-2 text-sm font-medium text-white hover:bg-hemdal-500 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </div>

        <button
          className="md:hidden text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-white/5 bg-gray-950"
          >
            <div className="flex flex-col gap-2 px-6 py-4">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-gray-400 hover:text-white py-2"
                >
                  {l.label}
                </a>
              ))}
              <Link
                href="/auth"
                onClick={() => setMobileOpen(false)}
                className="text-gray-300 hover:text-white py-2"
              >
                Sign In
              </Link>
              <a
                href="https://github.com/zanni098/hemdal/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-hemdal-600 px-4 py-2 text-sm font-medium text-white"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
