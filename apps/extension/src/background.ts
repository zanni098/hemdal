/// <reference types="chrome"/>

const HEMDAL_API_PORT = 19421;
const HEMDAL_API_BASE = `http://localhost:${HEMDAL_API_PORT}`;

interface CredentialData {
  id: string;
  name: string;
  username: string;
  password: string;
  urls: string[];
}

async function hemdalFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${HEMDAL_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

async function getCredentialsForUrl(url: string): Promise<CredentialData[]> {
  try {
    const response = await hemdalFetch(`/credentials?url=${encodeURIComponent(url)}`);
    if (!response.ok) return [];
    const data = await response.json();
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (e) {
    console.log("Hemdal: Desktop app not connected or vault locked");
    return [];
  }
}

async function checkHealth(): Promise<{ connected: boolean; unlocked: boolean }> {
  try {
    const response = await hemdalFetch("/health");
    if (!response.ok) return { connected: false, unlocked: false };
    const data = await response.json();
    return {
      connected: true,
      unlocked: data.success && data.data?.unlocked,
    };
  } catch (e) {
    return { connected: false, unlocked: false };
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_CREDENTIALS") {
    getCredentialsForUrl(request.url)
      .then((credentials) => {
        sendResponse({ success: true, credentials });
      })
      .catch((error: Error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === "PING") {
    checkHealth()
      .then((status) => sendResponse({ success: status.connected, unlocked: status.unlocked }))
      .catch(() => sendResponse({ success: false, unlocked: false }));
    return true;
  }

  return false;
});

// Check health periodically and update extension icon
setInterval(async () => {
  const status = await checkHealth();
  if (status.connected && status.unlocked) {
    chrome.action.setBadgeText({ text: "✓" });
    chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
  } else if (status.connected) {
    chrome.action.setBadgeText({ text: "🔒" });
    chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}, 5000);
