import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import VaultUnlock from "./components/VaultUnlock";
import SetupVault from "./components/SetupVault";
import VaultDashboard from "./components/VaultDashboard";
import ItemForm from "./components/ItemForm";
import ItemDetail from "./components/ItemDetail";
import SyncPanel from "./components/SyncPanel";
import Layout from "./components/Layout";

interface VaultStatus {
  initialized: boolean;
  unlocked: boolean;
  device_id: string | null;
  item_count: number;
}

function App() {
  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStatus = async () => {
    try {
      const s = await invoke<VaultStatus>("vault_status");
      setStatus(s);
    } catch (e) {
      console.error("Failed to get vault status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();

    // Listen for tray "Lock Vault" action
    const unlisten = listen("vault-locked", () => {
      refreshStatus();
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hemdal-500" />
      </div>
    );
  }

  if (!status?.initialized) {
    return <SetupVault onSetupComplete={refreshStatus} />;
  }

  if (!status?.unlocked) {
    return <VaultUnlock onUnlock={refreshStatus} />;
  }

  return (
    <Layout onLock={() => { invoke("lock_vault"); refreshStatus(); }}>
      <Routes>
        <Route path="/" element={<VaultDashboard />} />
        <Route path="/new/:type" element={<ItemForm />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/edit/:id" element={<ItemForm />} />
        <Route path="/sync" element={<SyncPanel />} />
      </Routes>
    </Layout>
  );
}

export default App;
