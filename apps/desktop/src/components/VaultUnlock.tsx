import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Shield, Eye, EyeOff, AlertTriangle, Fingerprint } from "lucide-react";

interface Props {
  onUnlock: () => void;
}

export default function VaultUnlock({ onUnlock }: Props) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    invoke<boolean>("biometric_enabled")
      .then(setBiometricEnabled)
      .catch(() => setBiometricEnabled(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await invoke("unlock_vault", { password });
      onUnlock();
    } catch (e) {
      setError("Invalid master password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setError("");
    setLoading(true);

    try {
      await invoke("unlock_with_biometric");
      onUnlock();
    } catch (e) {
      setError("Biometric unlock failed. Use your master password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Shield className="w-14 h-14 text-hemdal-500" />
        </div>

        <h2 className="text-xl font-bold text-center text-white mb-6">
          Unlock Hemdal
        </h2>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Master Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-12"
                  placeholder="Enter your master password..."
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/50 border border-red-900 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                "Unlock Vault"
              )}
            </button>

            {biometricEnabled && (
              <button
                type="button"
                onClick={handleBiometricUnlock}
                disabled={loading}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Fingerprint className="w-5 h-5" />
                Unlock with Biometrics
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
