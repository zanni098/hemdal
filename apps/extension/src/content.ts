/// <reference types="chrome"/>

import type { DetectedForm, FormField } from "@hemdal/types";

interface CredentialData {
  id: string;
  name: string;
  username: string;
  password: string;
  urls: string[];
}

// ─── Constants ───────────────────────────────────────────────

const OVERLAY_ID = "hemdal-autofill-overlay";
const OVERLAY_DATA_ATTR = "data-hemdal-form-id";
let currentOverlay: HTMLDivElement | null = null;
let lastProcessedUrl = "";

// ─── Message Listener (from popup/background) ──────────────

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "FILL_CREDENTIALS") {
    const { username, password } = request.data;
    const result = fillCredentials(username, password);
    sendResponse({ success: result });
    return true;
  }
  return false;
});

// ─── Save Credential Detection ─────────────────────────────────

let submittedCredentials: { url: string; username: string; password: string } | null = null;

function setupSaveDetection() {
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    // Skip if already listening
    if ((form as any)._hemdal_save_listener) return;
    (form as any)._hemdal_save_listener = true;

    form.addEventListener("submit", (e) => {
      const passwordInput = form.querySelector<HTMLInputElement>('input[type="password"]');
      if (!passwordInput || !passwordInput.value) return;

      const usernameInput = form.querySelector<HTMLInputElement>(
        'input[type="email"], input[type="text"], input:not([type])'
      );
      const username = usernameInput?.value || "";
      const password = passwordInput.value;
      const url = window.location.href;

      // Check if this looks like a login/signup form
      const formText = form.textContent?.toLowerCase() || "";
      const action = (form.getAttribute("action") || "").toLowerCase();
      const isAuthForm =
        formText.includes("sign in") ||
        formText.includes("sign up") ||
        formText.includes("log in") ||
        formText.includes("login") ||
        formText.includes("register") ||
        formText.includes("create account") ||
        action.includes("login") ||
        action.includes("auth") ||
        action.includes("signin");

      if (!isAuthForm) return;

      submittedCredentials = { url, username, password };
      showSaveOverlay(url, username, password);
    });
  });
}

function showSaveOverlay(url: string, username: string, password: string) {
  // Remove existing save overlay
  document.querySelectorAll(".hemdal-save-overlay").forEach((el) => el.remove());

  const overlay = document.createElement("div");
  overlay.className = "hemdal-save-overlay";
  overlay.style.cssText = `
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 2147483647;
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 12px;
    padding: 16px;
    width: 320px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #f1f5f9;
    animation: hemdal-fade-in 0.2s ease-out;
  `;

  overlay.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M12 8v4l3 3"/>
      </svg>
      <span style="font-weight: 600; font-size: 14px;">Hemdal</span>
    </div>
    <p style="font-size: 13px; color: #e2e8f0; margin: 0 0 12px;">
      Save this password to your vault?
    </p>
    <div style="background: #1e293b; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;">
      <div style="font-size: 12px; color: #94a3b8; margin-bottom: 2px;">Username</div>
      <div style="font-size: 13px; color: #f1f5f9; font-weight: 500;">${escapeHtml(username)}</div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button id="hemdal-save-yes" style="flex: 1; padding: 8px 12px; border-radius: 6px; background: #0ea5e9; border: none; color: white; font-size: 13px; font-weight: 500; cursor: pointer;">
        Save
      </button>
      <button id="hemdal-save-no" style="flex: 1; padding: 8px 12px; border-radius: 6px; background: transparent; border: 1px solid #334155; color: #94a3b8; font-size: 13px; cursor: pointer;">
        Dismiss
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector("#hemdal-save-yes")?.addEventListener("click", async () => {
    try {
      const response = await fetch("http://localhost:19421/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, username, password }),
      });
      const data = await response.json();
      if (data.success) {
        overlay.innerHTML = `
          <div style="text-align: center; padding: 8px;">
            <div style="color: #4ade80; font-size: 14px; font-weight: 500;">Saved to Hemdal</div>
          </div>
        `;
        setTimeout(() => overlay.remove(), 2000);
      } else {
        overlay.innerHTML = `
          <div style="text-align: center; padding: 8px;">
            <div style="color: #f87171; font-size: 13px;">Failed to save: ${data.error || "Unknown error"}</div>
          </div>
        `;
        setTimeout(() => overlay.remove(), 3000);
      }
    } catch (e) {
      overlay.innerHTML = `
        <div style="text-align: center; padding: 8px;">
          <div style="color: #f87171; font-size: 13px;">Hemdal app not running or vault locked</div>
        </div>
      `;
      setTimeout(() => overlay.remove(), 3000);
    }
  });

  overlay.querySelector("#hemdal-save-no")?.addEventListener("click", () => {
    overlay.remove();
  });

  // Auto-dismiss after 15 seconds
  setTimeout(() => overlay.remove(), 15000);
}

// ─── Credential Filling ──────────────────────────────────────

function fillCredentials(username: string, password: string): boolean {
  // Find the best username input
  const usernameInput = findUsernameInput();
  const passwordInput = findPasswordInput();

  if (!passwordInput) {
    console.log("Hemdal: No password input found");
    return false;
  }

  if (usernameInput) {
    setInputValue(usernameInput, username);
  }

  setInputValue(passwordInput, password);

  // Try to auto-submit the form after a short delay
  setTimeout(() => {
    const form = passwordInput.closest("form");
    if (form) {
      const submitBtn = form.querySelector<HTMLElement>(
        'button[type="submit"], input[type="submit"], button[aria-label*="sign" i], button[aria-label*="log" i]'
      );
      if (submitBtn) {
        (submitBtn as HTMLButtonElement).click();
      }
    }
  }, 300);

  return true;
}

function findUsernameInput(): HTMLInputElement | null {
  // Try selectors in order of specificity
  const selectors = [
    'input[type="email"]',
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
    'input[name*="user" i]',
    'input[name*="email" i]',
    'input[id*="user" i]',
    'input[id*="email" i]',
    'input[placeholder*="user" i]',
    'input[placeholder*="email" i]',
    'input[aria-label*="user" i]',
    'input[aria-label*="email" i]',
    'input[type="text"]',
  ];

  for (const selector of selectors) {
    const inputs = document.querySelectorAll<HTMLInputElement>(selector);
    for (const input of inputs) {
      // Skip hidden, disabled, or readonly inputs
      if (input.offsetParent === null) continue;
      if (input.disabled) continue;
      if (input.readOnly) continue;
      // Make sure it's in the same form as a password field, or near one
      const form = input.closest("form");
      if (form && form.querySelector('input[type="password"]')) {
        return input;
      }
      // Also accept inputs that are just before a password field
      const nextPw = input.parentElement?.querySelector('input[type="password"]');
      if (nextPw) return input;
    }
  }

  return null;
}

function findPasswordInput(): HTMLInputElement | null {
  const inputs = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
  for (const input of inputs) {
    if (input.offsetParent === null) continue;
    if (input.disabled) continue;
    return input;
  }
  return null;
}

function setInputValue(input: HTMLInputElement, value: string) {
  input.focus();
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
  input.blur();
}

// ─── Form Detection ──────────────────────────────────────────

function detectForms(): DetectedForm[] {
  const forms: DetectedForm[] = [];
  const passwordInputs = document.querySelectorAll<HTMLInputElement>(
    'input[type="password"]'
  );

  passwordInputs.forEach((passwordInput) => {
    // Skip hidden password fields (commonly used by password managers)
    if (passwordInput.offsetParent === null) return;
    if (passwordInput.disabled) return;

    const form = passwordInput.closest("form");
    if (!form) return;

    const fields: FormField[] = [];
    const allInputs = form.querySelectorAll<HTMLInputElement>(
      'input[type="text"], input[type="email"], input[type="password"], input[type="tel"], input:not([type])'
    );

    let hasUsername = false;
    let hasPassword = false;

    allInputs.forEach((input) => {
      const type = input.type || "text";
      const isPassword = type === "password";
      const isUsername = !isPassword && (
        /user(name)?|email|login/i.test(input.name || "") ||
        /user(name)?|email|login/i.test(input.id || "") ||
        /user(name)?|email|login/i.test(input.placeholder || "") ||
        /user(name)?|email|login/i.test(input.getAttribute("aria-label") || "") ||
        input.autocomplete?.includes("username") ||
        input.autocomplete?.includes("email")
      );

      if (isPassword) hasPassword = true;
      if (isUsername) hasUsername = true;

      const fieldType: FormField["type"] = isPassword
        ? "password"
        : input.autocomplete?.includes("email")
          ? "email"
          : isUsername
            ? "username"
            : "text";

      fields.push({
        type: fieldType,
        selector: getUniqueSelector(input),
        name: input.name || undefined,
        id: input.id || undefined,
        placeholder: input.placeholder || undefined,
        label: getFieldLabel(input),
      });
    });

    // Detect submit button
    const submitBtn = form.querySelector<HTMLElement>(
      'button[type="submit"], input[type="submit"]'
    );

    forms.push({
      url: window.location.href,
      fields,
      submitSelector: submitBtn ? getUniqueSelector(submitBtn) : undefined,
      isLoginForm: hasPassword && hasUsername,
      isSignupForm: hasPassword && !hasUsername,
    });
  });

  return forms;
}

function getUniqueSelector(el: Element): string {
  if (el.id) return `#${el.id}`;
  if (el.className) {
    const classes = el.className.split(" ").filter((c) => c.trim());
    if (classes.length > 0) {
      const selector = `.${classes.join(".")}`;
      if (document.querySelectorAll(selector).length === 1) return selector;
    }
  }

  const path: string[] = [];
  let current: Element | null = el;
  while (current && current !== document.body) {
    const tag = current.tagName.toLowerCase();
    const siblings = Array.from(current.parentElement?.children || []);
    const index = siblings.filter((s) => s.tagName === current!.tagName).indexOf(current) + 1;
    path.unshift(`${tag}:nth-of-type(${index})`);
    current = current.parentElement;
  }
  return path.join(" > ");
}

function getFieldLabel(input: HTMLInputElement): string | undefined {
  if (input.labels && input.labels.length > 0) {
    return input.labels[0].textContent?.trim();
  }
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent?.trim();
  }
  return undefined;
}

// ─── Autofill Overlay ────────────────────────────────────────

function createAutofillOverlay(credentials: CredentialData[]) {
  // Remove existing overlay
  removeOverlay();

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 2147483647;
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 12px;
    padding: 16px;
    width: 320px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #f1f5f9;
    animation: hemdal-fade-in 0.2s ease-out;
  `;

  // Add animation styles
  const style = document.createElement("style");
  style.textContent = `
    @keyframes hemdal-fade-in {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes hemdal-fade-out {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-8px); }
    }
  `;
  document.head.appendChild(style);

  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #1e293b;
  `;
  header.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
    <span style="font-weight: 600; font-size: 14px;">Hemdal</span>
    <span style="font-size: 12px; color: #64748b; margin-left: auto;">${credentials.length} credential${credentials.length !== 1 ? "s" : ""}</span>
  `;
  overlay.appendChild(header);

  credentials.forEach((cred) => {
    const item = document.createElement("button");
    item.style.cssText = `
      width: 100%;
      text-align: left;
      padding: 10px 12px;
      border-radius: 8px;
      background: #1e293b;
      border: 1px solid #334155;
      color: #f1f5f9;
      cursor: pointer;
      margin-bottom: 8px;
      font-size: 13px;
      transition: background 0.15s, border-color 0.15s;
    `;
    item.innerHTML = `
      <div style="font-weight: 500; margin-bottom: 2px;">${escapeHtml(cred.name)}</div>
      <div style="color: #94a3b8; font-size: 12px;">${escapeHtml(cred.username)}</div>
    `;
    item.onmouseenter = () => {
      item.style.background = "#334155";
      item.style.borderColor = "#475569";
    };
    item.onmouseleave = () => {
      item.style.background = "#1e293b";
      item.style.borderColor = "#334155";
    };
    item.onclick = () => {
      const success = fillCredentials(cred.username, cred.password);
      if (success) {
        removeOverlay();
      }
    };
    overlay.appendChild(item);
  });

  const closeBtn = document.createElement("button");
  closeBtn.style.cssText = `
    width: 100%;
    padding: 8px;
    border-radius: 6px;
    background: transparent;
    border: 1px solid #334155;
    color: #94a3b8;
    cursor: pointer;
    font-size: 12px;
    margin-top: 4px;
  `;
  closeBtn.textContent = "Dismiss";
  closeBtn.onclick = () => removeOverlay();
  overlay.appendChild(closeBtn);

  document.body.appendChild(overlay);
  currentOverlay = overlay;

  // Auto-dismiss after 30 seconds
  setTimeout(() => removeOverlay(), 30000);
}

function removeOverlay() {
  if (currentOverlay) {
    currentOverlay.style.animation = "hemdal-fade-out 0.2s ease-in forwards";
    setTimeout(() => {
      currentOverlay?.remove();
      currentOverlay = null;
    }, 200);
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ─── Main Autofill Logic ─────────────────────────────────────

function checkForAutofill() {
  const url = window.location.href;
  if (url === lastProcessedUrl && currentOverlay) {
    return; // Already checked this URL and showing overlay
  }
  lastProcessedUrl = url;

  const forms = detectForms();
  if (forms.length === 0) return;

  const loginForms = forms.filter((f) => f.isLoginForm);
  if (loginForms.length === 0) return;

  // Request credentials from background script
  chrome.runtime.sendMessage(
    {
      type: "GET_CREDENTIALS",
      url: url,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.log("Hemdal: Desktop app not connected");
        return;
      }

      if (response?.success && response.credentials?.length > 0) {
        createAutofillOverlay(response.credentials);
      }
    }
  );
}

// ─── Initialization ──────────────────────────────────────────

function init() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(checkForAutofill, 500);
      setupSaveDetection();
    });
  } else {
    setTimeout(checkForAutofill, 500);
    setupSaveDetection();
  }

  // Watch for dynamically added forms
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          if (node.querySelector('input[type="password"]') ||
            node.tagName === "INPUT" && (node as HTMLInputElement).type === "password") {
            shouldCheck = true;
          }
        }
      }
    }
    if (shouldCheck) {
      setTimeout(() => {
        checkForAutofill();
        setupSaveDetection();
      }, 500);
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Watch for URL changes (SPA navigation)
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      lastProcessedUrl = ""; // Reset so we check again
      setTimeout(checkForAutofill, 1000);
    }
  });
  urlObserver.observe(document, { subtree: true, childList: true });
}

init();
