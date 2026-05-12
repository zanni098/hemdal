import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Shield, Eye, EyeOff, AlertTriangle } from "lucide-react";

interface Props {
  onSetupComplete: () => void;
}

export default function SetupVault({ onSetupComplete }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 12) {
      setError("Password must be at least 12 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await invoke("initialize_vault", { password });
      onSetupComplete();
    } catch (e) {
      setError(`Failed to initialize vault: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Shield className="w-16 h-16 text-hemdal-500" />
        </div>

        <h2 className="text-2xl font-bold text-center text-white mb-2">
          Welcome to Hemdal
        </h2>
        <p className="text-gray-400 text-center mb-8">
          Create a master password to secure your vault. This is the only password you need to remember.
        </p>

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
                  placeholder="Enter a strong password..."
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

            <div>
              <label className="label">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Confirm your password..."
              />
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
                "Create Vault"
              )}
            </button>
          </form>
        </div>

        <p className="text-gray-500 text-xs text-center mt-6">
          Your password is never stored. A cryptographic key is derived from it using Argon2id.
        </p>
      </div>
    </div>
  );
}
