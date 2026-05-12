import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Wifi, WifiOff, Shield, ShieldCheck, Laptop, RefreshCw } from "lucide-react";

interface PeerDevice {
  device_id: string;
  name: string;
  public_key_fingerprint: string;
  address: string;
  port: number;
  last_seen: number;
  trusted: boolean;
}

interface SyncStatusData {
  enabled: boolean;
  peers: PeerDevice[];
}

export default function SyncPanel() {
  const [status, setStatus] = useState<SyncStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    try {
      const s = await invoke<SyncStatusData>("sync_status");
      setStatus(s);
    } catch (e) {
      console.error("Failed to load sync status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const toggleSync = async () => {
    try {
      if (status?.enabled) {
        await invoke("disable_sync");
      } else {
        await invoke("enable_sync");
      }
      loadStatus();
    } catch (e) {
      console.error("Failed to toggle sync:", e);
    }
  };

  const trustDevice = async (deviceId: string) => {
    try {
      await invoke("trust_device", { deviceId });
      loadStatus();
    } catch (e) {
      console.error("Failed to trust device:", e);
    }
  };

  const untrustDevice = async (deviceId: string) => {
    try {
      await invoke("untrust_device", { deviceId });
      loadStatus();
    } catch (e) {
      console.error("Failed to untrust device:", e);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">P2P Sync</h1>
      <p className="text-gray-400 mb-8">
        Synchronize your vault securely with your other devices over the local network.
        No cloud required.
      </p>

      {/* Sync Toggle */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                status?.enabled ? "bg-green-950 text-green-400" : "bg-gray-800 text-gray-500"
              }`}
            >
              {status?.enabled ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-medium text-white">
                {status?.enabled ? "Sync Enabled" : "Sync Disabled"}
              </h3>
              <p className="text-sm text-gray-400">
                {status?.enabled
                  ? "Your device is discoverable on the local network"
                  : "Enable to discover and sync with other devices"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleSync}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              status?.enabled ? "bg-hemdal-600" : "bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                status?.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Peers */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <Laptop className="w-5 h-5 text-hemdal-400" />
            Discovered Devices
          </h2>
          <button
            onClick={loadStatus}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-hemdal-500" />
          </div>
        ) : !status?.peers.length ? (
          <div className="text-center py-10">
            <Laptop className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">No devices discovered yet.</p>
            <p className="text-gray-500 text-sm mt-1">
              Make sure Hemdal is running on another device on the same network.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {status.peers.map((peer) => (
              <div
                key={peer.device_id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                    <Laptop className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{peer.name}</p>
                    <p className="text-xs text-gray-500">
                      {peer.address}:{peer.port} ·{" "}
                      {new Date(peer.last_seen * 1000).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {peer.trusted ? (
                    <div className="flex items-center gap-1.5 text-green-400 text-sm">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Trusted</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      <Shield className="w-4 h-4" />
                      <span>Untrusted</span>
                    </div>
                  )}
                  {peer.trusted ? (
                    <button
                      onClick={() => untrustDevice(peer.device_id)}
                      className="ml-2 text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                    >
                      Untrust
                    </button>
                  ) : (
                    <button
                      onClick={() => trustDevice(peer.device_id)}
                      className="ml-2 text-xs px-3 py-1.5 rounded-lg bg-hemdal-950 text-hemdal-300 border border-hemdal-800 hover:bg-hemdal-900 transition-colors"
                    >
                      Trust
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-hemdal-950/50 border border-hemdal-900">
        <h3 className="text-sm font-medium text-hemdal-300 mb-2">How P2P Sync Works</h3>
        <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
          <li>Devices discover each other on your local network using mDNS</li>
          <li>All data is encrypted end-to-end before transmission</li>
          <li>You must explicitly trust each device before syncing</li>
          <li>No data ever leaves your network unless you choose to sync</li>
        </ul>
      </div>
    </div>
  );
}
