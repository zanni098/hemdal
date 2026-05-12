/// <reference types="chrome"/>

import type { DetectedForm, FormField, AutofillCredential } from "@hemdal/types";

interface CredentialData {
  id: string;
  name: string;
  username: string;
  password: string;
  urls: string[];
}

// ─── Form Detection ──────────────────────────────────────────

function detectForms(): DetectedForm[] {
  const forms: DetectedForm[] = [];
  const passwordInputs = document.querySelectorAll<HTMLInputElement>(
    'input[type="password"]'
  );

  passwordInputs.forEach((passwordInput) => {
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
        name: input.name,
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

  // Generate path
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
  // Try to find label by for attribute
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent?.trim();
  }
  return undefined;
}

// ─── Autofill UI ─────────────────────────────────────────────

function createAutofillOverlay(credentials: CredentialData[]) {
  // Remove existing overlays
  document.querySelectorAll(".hemdal-autofill-overlay").forEach((el) => el.remove());

  const overlay = document.createElement("div");
  overlay.className = "hemdal-autofill-overlay";
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
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    color: #f1f5f9;
  `;

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
      transition: background 0.15s;
    `;
    item.innerHTML = `
      <div style="font-weight: 500; margin-bottom: 2px;">${cred.name}</div>
      <div style="color: #94a3b8; font-size: 12px;">${cred.username}</div>
    `;
    item.onmouseenter = () => (item.style.background = "#334155");
    item.onmouseleave = () => (item.style.background = "#1e293b");
    item.onclick = () => {
      fillCredentials(cred);
      overlay.remove();
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
  closeBtn.onclick = () => overlay.remove();
  overlay.appendChild(closeBtn);

  document.body.appendChild(overlay);

  // Auto-dismiss after 30 seconds
  setTimeout(() => overlay.remove(), 30000);
}

function fillCredentials(cred: CredentialData) {
  const usernameInput = document.querySelector<HTMLInputElement>(
    'input[type="email"], input[type="text"], input:not([type])'
  );
  const passwordInput = document.querySelector<HTMLInputElement>(
    'input[type="password"]'
  );

  if (usernameInput) {
    usernameInput.value = cred.username;
    usernameInput.dispatchEvent(new Event("input", { bubbles: true }));
    usernameInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  if (passwordInput) {
    passwordInput.value = cred.password;
    passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
    passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

// ─── Main Logic ──────────────────────────────────────────────

function checkForAutofill() {
  const forms = detectForms();
  if (forms.length === 0) return;

  const loginForms = forms.filter((f) => f.isLoginForm);
  if (loginForms.length === 0) return;

  // Request credentials from background script
  chrome.runtime.sendMessage(
    {
      type: "GET_CREDENTIALS",
      url: window.location.href,
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

// Check on page load and URL changes
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", checkForAutofill);
} else {
  checkForAutofill();
}

// Watch for dynamically added forms
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof HTMLElement && node.querySelector('input[type="password"]')) {
        setTimeout(checkForAutofill, 500);
        return;
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Listen for URL changes (SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(checkForAutofill, 1000);
  }
}).observe(document, { subtree: true, childList: true });
