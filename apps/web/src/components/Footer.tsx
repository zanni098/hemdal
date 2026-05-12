import Link from "next/link";
import { Shield, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.04] bg-[#0a0f1c] pt-16 pb-8">
      <div className="absolute inset-0 bg-grid opacity-10" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-white font-bold text-lg tracking-tight"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600">
                <Shield className="h-4 w-4 text-white" />
              </div>
              Hemdal
            </Link>
            <p className="mt-4 text-sm text-slate-500 leading-relaxed max-w-xs">
              Secure, cross-platform password and secret manager with end-to-end
              encryption and P2P sync.
            </p>
            <div className="mt-5 flex items-center gap-4">
              <a
                href="https://github.com/zanni098/hemdal"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Product
            </h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a href="/#features" className="text-slate-500 hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/#download" className="text-slate-500 hover:text-white transition-colors">
                  Download
                </a>
              </li>
              <li>
                <a href="/#security" className="text-slate-500 hover:text-white transition-colors">
                  Security
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/zanni098/hemdal/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  Changelog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Resources
            </h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a
                  href="https://github.com/zanni098/hemdal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/zanni098/hemdal/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  Issues
                </a>
              </li>
              <li>
                <Link href="/auth" className="text-slate-500 hover:text-white transition-colors">
                  Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Legal
            </h4>
            <ul className="mt-5 space-y-3 text-sm text-slate-500">
              <li className="hover:text-white transition-colors cursor-pointer">Privacy Policy</li>
              <li className="hover:text-white transition-colors cursor-pointer">Terms of Service</li>
              <li className="hover:text-white transition-colors cursor-pointer">MIT License</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-white/[0.04] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Hemdal. Open source under MIT License.
          </p>
          <p className="text-xs text-slate-600">
            Built with Tauri, Rust, React, and love.
          </p>
        </div>
      </div>
    </footer>
  );
}
