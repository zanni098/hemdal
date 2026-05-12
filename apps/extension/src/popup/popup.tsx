import { useEffect, useState } from "react";

const HEMDAL_API_BASE = "http://localhost:19421";

interface PopupState {
  connected: boolean;
  unlocked: boolean;
  currentUrl: string;
  credentials: { id: string; name: string; username: string; password: string }[];
}

export default function Popup() {
  const [state, setState] = useState<PopupState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tab?.url || "";

      // Check Hemdal desktop app health
      const healthResponse = await fetch(`${HEMDAL_API_BASE}/health`, {
        method: "GET",
      }).catch(() => null);

      if (!healthResponse || !healthResponse.ok) {
        setState({
          connected: false,
          unlocked: false,
          currentUrl: url,
          credentials: [],
        });
        setLoading(false);
        return;
      }

      const health = await healthResponse.json();
      const unlocked = health.success && health.data?.unlocked;

      let credentials: { id: string; name: string; username: string; password: string }[] = [];
      if (unlocked && url) {
        const credResponse = await fetch(
          `${HEMDAL_API_BASE}/credentials?url=${encodeURIComponent(url)}`
        ).catch(() => null);
        if (credResponse && credResponse.ok) {
          const credData = await credResponse.json();
          if (credData.success && Array.isArray(credData.data)) {
            credentials = credData.data;
          }
        }
      }

      setState({
        connected: true,
        unlocked,
        currentUrl: url,
        credentials,
      });
    } catch (e) {
      console.error("Failed to load popup state:", e);
      setState({
        connected: false,
        unlocked: false,
        currentUrl: "",
        credentials: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = async (cred: { id: string; username: string; password: string }) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    chrome.tabs.sendMessage(tab.id, {
      type: "FILL_CREDENTIALS",
      data: cred,
    });
    window.close();
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div
          style={{
            width: 24,
            height: 24,
            border: "2px solid #334155",
            borderTopColor: "#38bdf8",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!state?.connected) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Hemdal</h1>
        </div>

        <div
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 8,
            padding: 16,
            textAlign: "center",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#64748b"
            strokeWidth="2"
            style={{ marginBottom: 12 }}
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 8px" }}>
            Hemdal desktop app is not running
          </p>
          <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>
            Launch the Hemdal desktop app to enable autofill.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <div>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Hemdal</h1>
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
            {state.unlocked ? "Vault unlocked" : "Vault locked"}
          </p>
        </div>
      </div>

      <div
        style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b" }}>Current site</p>
        <p style={{ margin: 0, fontSize: 13, color: "#f1f5f9", wordBreak: "break-all" }}>
          {state.currentUrl}
        </p>
      </div>

      {!state.unlocked ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ color: "#f59e0b", fontSize: 13, margin: 0 }}>
            Unlock your Hemdal vault to use autofill.
          </p>
        </div>
      ) : state.credentials.length > 0 ? (
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b", fontWeight: 500 }}>
            Matching credentials
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {state.credentials.map((cred) => (
              <button
                key={cred.id}
                onClick={() => fillCredentials(cred)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 6,
                  background: "#0f172a",
                  border: "1px solid #334155",
                  color: "#f1f5f9",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 500 }}>{cred.name}</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>{cred.username}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
            No credentials for this site.
          </p>
        </div>
      )}
    </div>
  );
}

import { createRoot } from "react-dom/client";
const root = createRoot(document.getElementById("root")!);
root.render(<Popup />);
