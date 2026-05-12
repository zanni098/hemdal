import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Copy, Check, RefreshCw } from "lucide-react";

interface Props {
  itemId: string;
}

interface TotpResult {
  code: string;
  remaining_seconds: number;
}

export default function TotpDisplay({ itemId }: Props) {
  const [code, setCode] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCode = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await invoke<TotpResult>("generate_totp", { id: itemId });
      setCode(result.code);
      setRemaining(result.remaining_seconds);
    } catch (e) {
      setError(String(e));
      setCode(null);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchCode();
  }, [fetchCode]);

  // Countdown timer
  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          fetchCode();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remaining, fetchCode]);

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  const progressPercent = code ? (remaining / 30) * 100 : 0;
  const isLow = remaining <= 5;

  if (error) {
    return (
      <div className="card border-gray-800">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">2FA / TOTP</p>
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="card border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          2FA / TOTP
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={copyCode}
            disabled={!code}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={fetchCode}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
            title="Refresh code"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {code ? (
        <>
          <div className="flex items-center justify-between">
            <div className="font-mono text-3xl font-bold text-white tracking-widest">
              {code}
            </div>
            <span className={`text-sm font-medium tabular-nums ${isLow ? "text-red-400" : "text-gray-400"}`}>
              {remaining}s
            </span>
          </div>
          <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                isLow ? "bg-red-500" : "bg-green-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Loading code...
        </div>
      )}
    </div>
  );
}
