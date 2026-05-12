"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, LogOut, Download, Mail, Shield } from "lucide-react";
import Link from "next/link";

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export default function AccountPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        router.push("/auth");
        return;
      }
      setUser(data.user as AuthUser);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/auth");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hemdal-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950 py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Account</h1>
          <p className="mt-1 text-gray-400">Manage your Hemdal account and preferences.</p>
        </div>

        <div className="space-y-6">
          {/* Profile card */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-hemdal-500/10 text-hemdal-400">
                <User className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {(user.user_metadata?.name as string) || "Hemdal User"}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email || "No email"}
                </div>
              </div>
            </div>
          </div>

          {/* Downloads */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Downloads</h3>
            <div className="space-y-3">
              <a
                href="https://github.com/zanni098/hemdal/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-hemdal-400" />
                  <div>
                    <div className="text-sm font-medium text-white">Hemdal Desktop</div>
                    <div className="text-xs text-gray-500">Windows MSI / NSIS Setup</div>
                  </div>
                </div>
                <span className="text-xs text-hemdal-400 font-medium">Latest</span>
              </a>

              <a
                href="https://github.com/zanni098/hemdal/tree/master/apps/extension"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-hemdal-400" />
                  <div>
                    <div className="text-sm font-medium text-white">Browser Extension</div>
                    <div className="text-xs text-gray-500">Chrome / Firefox MV3</div>
                  </div>
                </div>
                <span className="text-xs text-hemdal-400 font-medium">Source</span>
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-950/40 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
