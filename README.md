# Hemdal

Hemdal is a secure, cross-platform password, secret, and environment variable manager with peer-to-peer sync. It stores your credentials with end-to-end encryption and autofills them into websites via a browser extension.

## Features

- **End-to-End Encryption**: All vault items are encrypted with AES-256-GCM. Your master password is never stored; a vault key is derived using Argon2id.
- **Zero-Knowledge Architecture**: Only encrypted blobs leave your device during sync.
- **Cross-Platform Desktop App**: Built with Tauri (Rust + React), running on Windows, macOS, and Linux.
- **Browser Autofill**: Chrome/Firefox extension detects login forms, fills credentials automatically, and offers to save new passwords.
- **Biometric Unlock**: Unlock your vault with Windows Hello (Touch ID / Face ID support coming soon).
- **TOTP / 2FA Code Generator**: Generate 6-digit 2FA codes from stored TOTP secrets with a live 30-second countdown.
- **Password Generator**: Built-in generator with configurable length, character types, and strength meter.
- **Password Breach Check**: Check passwords against the Have I Been Pwned database via k-Anonymity API.
- **Fuzzy Search**: Quickly find items with fast substring scoring search.
- **Import / Export**: Import from Bitwarden JSON, 1Password CSV, or generic CSV. Export to encrypted JSON or CSV.
- **System Tray & Auto-Lock**: Minimize to tray, lock from tray menu, and auto-lock after 10 minutes of inactivity.
- **P2P Sync**: Synchronize your vault across devices on your local network without any cloud server (framework ready).
- **Multiple Secret Types**: Passwords, API keys, SSH keys, environment variables, secure notes, and credit cards.

## Architecture

```
hemdal/
├── apps/
│   ├── desktop/          # Tauri desktop application (React + Rust)
│   └── extension/        # Browser extension (Chrome/Firefox MV3)
├── packages/
│   ├── types/            # Shared TypeScript types
│   ├── crypto/           # Shared crypto utilities
│   └── protocol/         # P2P sync protocol definitions
```

### Security Model

1. **Master Password** -> Argon2id -> Master Key
2. **Master Key** -> Decrypts -> Vault Key (stored encrypted at rest)
3. **Vault Key** -> AES-256-GCM -> All vault items

The browser extension never stores your master password or vault key. It communicates with the desktop app via a local HTTP API (localhost:19421) only when the vault is unlocked.

### Biometric Unlock (Windows Hello)

When enabled, a random biometric key is generated and protected by Windows DPAPI. The vault key is encrypted with this biometric key and stored on disk. On unlock, the system prompts for Windows Hello verification, DPAPI decrypts the biometric key, which then decrypts the vault key. The master password is never stored.

## Development

### Prerequisites

- [Rust](https://rustup.rs/)
- [Node.js](https://nodejs.org/) + [pnpm](https://pnpm.io/)
- [Tauri CLI](https://tauri.app/start/prerequisites/)

### Setup

```bash
# Install dependencies
pnpm install

# Build shared packages
pnpm build:desktop
pnpm build:extension

# Run the desktop app in dev mode
pnpm dev:desktop

# Build the browser extension
cd apps/extension
pnpm build
# Then load `apps/extension/dist` as an unpacked extension in Chrome
```

### Desktop App Commands

```bash
# Dev mode
pnpm dev:desktop

# Build for production
pnpm build:desktop

# Build Tauri binary (installers)
cd apps/desktop && pnpm tauri:build
```

### Browser Extension

1. Build the extension: `cd apps/extension && pnpm build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select `apps/extension/dist`
5. The extension will show a checkmark badge when the Hemdal desktop app is running and the vault is unlocked

## Roadmap

- [x] Core vault with AES-256-GCM encryption
- [x] Desktop app with React UI
- [x] Browser extension with form detection
- [x] Local HTTP API for extension communication
- [x] Browser extension save-new-credentials flow
- [x] TOTP code generation
- [x] Secure password generator
- [x] Import from 1Password / Bitwarden / CSV
- [x] Export to JSON / CSV
- [x] Fuzzy search
- [x] Password breach check via Have I Been Pwned
- [x] Biometric unlock (Windows Hello)
- [x] System tray with auto-lock
- [ ] Full native messaging host support
- [ ] iOS/Android app with native autofill
- [ ] P2P sync over mDNS / WebRTC
- [ ] Biometric unlock on macOS (Touch ID) and Linux

## License

MIT
