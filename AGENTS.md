# Hemdal Development Guide

## Project Structure

- **Monorepo**: Uses pnpm workspaces
- **Desktop App**: Tauri (Rust backend + React frontend)
- **Browser Extension**: Manifest V3, TypeScript + React
- **Shared Packages**: `@hemdal/types`, `@hemdal/crypto`, `@hemdal/protocol`

## Build Commands

```bash
# Root directory: C:\Users\eishm\hemdal

# Install all dependencies
pnpm install

# Desktop app
cd apps/desktop
pnpm dev          # Vite dev server
pnpm build        # Production build
pnpm tauri:dev    # Tauri dev mode
pnpm tauri:build  # Build Tauri binary

# Browser extension
cd apps/extension
pnpm dev    # Development build
pnpm build  # Production build (outputs to dist/)
```

## Rust Backend (apps/desktop/src-tauri/src)

| File | Purpose |
|------|---------|
| `main.rs` | Entry point, delegates to `lib.rs::run()` |
| `lib.rs` | Tauri setup, command handlers, app state |
| `crypto.rs` | Argon2id, AES-256-GCM, secure key management |
| `vault.rs` | SQLite vault storage, item CRUD |
| `http_api.rs` | Local HTTP server for browser extension (port 19421) |
| `native_messaging.rs` | Native messaging host (future enhancement) |
| `sync.rs` | P2P sync manager stub |
| `error.rs` | Application error types |

## Key Design Decisions

1. **HTTP API over Native Messaging**: For the MVP, the browser extension communicates with the desktop app via a local HTTP server on port 19421. This avoids platform-specific registry setup required for native messaging and works across all browsers.

2. **Argon2id + AES-256-GCM**: Industry-standard password hashing and encryption. Vault key is encrypted by the master-derived key.

3. **SQLite with bundled feature**: Single-file encrypted database. `bundled` ensures thread-safe compilation.

4. **Zero-Knowledge**: The server (when cloud sync is added) only sees encrypted blobs. All decryption happens client-side.

## Extension Loading

After building `apps/extension`:
1. Chrome -> `chrome://extensions/` -> Developer mode ON -> Load unpacked -> Select `apps/extension/dist`
2. The extension badge shows green checkmark when connected to the desktop app

## Data Directory

- Windows: `%APPDATA%/com.hemdal.desktop/`
- macOS: `~/Library/Application Support/com.hemdal.desktop/`
- Linux: `~/.local/share/com.hemdal.desktop/`

The vault database is at `<data_dir>/vault.db`.

## Troubleshooting

### Cargo check fails with icon error
Ensure icon files exist in `apps/desktop/src-tauri/icons/`. Placeholder icons were created during setup.

### Extension cannot connect to desktop app
- Ensure the desktop app is running
- Ensure the vault is unlocked
- Check that port 19421 is not blocked by firewall
- Check browser console for CORS or fetch errors

### TypeScript errors in workspace packages
Run `pnpm typecheck` from the package directory to diagnose.
