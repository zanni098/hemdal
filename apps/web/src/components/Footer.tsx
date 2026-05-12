import Link from "next/link";
import { Shield, Github, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg">
              <Shield className="h-6 w-6 text-hemdal-400" />
              Hemdal
            </Link>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Secure, cross-platform password and secret manager with end-to-end encryption and P2P sync.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <a
                href="https://github.com/zanni098/hemdal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Product</h4>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li><a href="/#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="/#download" className="hover:text-white transition-colors">Download</a></li>
              <li><a href="/#security" className="hover:text-white transition-colors">Security</a></li>
              <li><a href="https://github.com/zanni098/hemdal/releases" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Resources</h4>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li><a href="https://github.com/zanni098/hemdal" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a></li>
              <li><a href="https://github.com/zanni098/hemdal/issues" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Issues</a></li>
              <li><Link href="/auth" className="hover:text-white transition-colors">Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Legal</h4>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li><span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">License (MIT)</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Hemdal. Open source under MIT License.
          </p>
          <p className="text-sm text-gray-600">
            Built with Tauri, Rust, React, and love.
          </p>
        </div>
      </div>
    </footer>
  );
}
