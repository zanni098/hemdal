# Hemdal

Hemdal is a secure, cross-platform password, secret, and environment variable manager with peer-to-peer sync. It stores your credentials with end-to-end encryption and autofill them into websites via a browser extension.

## Features

- **End-to-End Encryption**: All vault items are encrypted with AES-256-GCM. Your master password is never stored; a vault key is derived using Argon2id.
- **Zero-Knowledge Architecture**: Only encrypted blobs leave your device during sync.
- **Cross-Platform Desktop App**: Built with Tauri (Rust + React), running on Windows, macOS, and Linux.
- **Browser Autofill**: Chrome/Firefox extension detects login forms and fills credentials automatically from your unlocked vault.
- **P2P Sync**: Synchronize your vault across devices on your local network without any cloud server.
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

# Build Tauri binary
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
- [ ] Full native messaging host support
- [ ] iOS/Android app with native autofill
- [ ] P2P sync over mDNS / WebRTC
- [ ] Biometric unlock (Touch ID / Face ID / Windows Hello)
- [ ] TOTP code generation
- [ ] Secure password generator
- [ ] Import from 1Password / Bitwarden / LastPass

## License

MIT
