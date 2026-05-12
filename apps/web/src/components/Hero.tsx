"use client";

import { motion } from "framer-motion";
import { Shield, Download, Github, ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gray-950 pt-20 pb-32">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-hemdal-500/10 blur-[120px]" />
        <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-hemdal-500/20 bg-hemdal-950/50 px-4 py-1.5 text-sm text-hemdal-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hemdal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-hemdal-400" />
            </span>
            v0.1.0 is now available with biometric unlock
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            Your secrets,{" "}
            <span className="bg-gradient-to-r from-hemdal-400 to-purple-400 bg-clip-text text-transparent">
              encrypted
            </span>
            , always yours.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-2xl text-lg text-gray-400"
          >
            Hemdal is a secure, cross-platform password and secret manager with
            end-to-end encryption, biometric unlock, browser autofill, and P2P sync.
            No cloud required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4"
          >
            <a
              href="https://github.com/zanni098/hemdal/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-hemdal-600 px-6 py-3 text-base font-medium text-white hover:bg-hemdal-500 transition-colors"
            >
              <Download className="h-5 w-5" />
              Download for Windows
            </a>
            <a
              href="https://github.com/zanni098/hemdal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-6 py-3 text-base font-medium text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <Github className="h-5 w-5" />
              View on GitHub
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-hemdal-400" />
              AES-256-GCM Encryption
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-hemdal-400" />
              Argon2id Key Derivation
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-hemdal-400" />
              Zero-Knowledge
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
