import { Link, useLocation } from "react-router-dom";
import {
  Shield,
  Lock,
  KeyRound,
  FileKey,
  Variable,
  StickyNote,
  Wifi,
  ArrowDownUp,
} from "lucide-react";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  onLock: () => void;
}

const navItems = [
  { icon: Shield, label: "All Items", path: "/" },
  { icon: KeyRound, label: "Passwords", path: "/?type=password" },
  { icon: FileKey, label: "API Keys", path: "/?type=api-key" },
  { icon: Variable, label: "Env Vars", path: "/?type=environment-variable" },
  { icon: StickyNote, label: "Notes", path: "/?type=note" },
  { icon: ArrowDownUp, label: "Import / Export", path: "/import-export" },
  { icon: Wifi, label: "Sync", path: "/sync" },
];

export default function Layout({ children, onLock }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="h-screen flex bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <Shield className="w-8 h-8 text-hemdal-500" />
          <h1 className="text-xl font-bold text-white">Hemdal</h1>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path.split("?")[0]));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-hemdal-950 text-hemdal-400 border border-hemdal-800"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-800 space-y-1">
          <button
            onClick={onLock}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
          >
            <Lock className="w-5 h-5" />
            Lock Vault
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
