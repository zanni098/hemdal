pub mod crypto;
pub mod error;
pub mod http_api;
pub mod native_messaging;
pub mod sync;
pub mod vault;

use std::sync::{
    Arc, Mutex,
    atomic::{AtomicI64, Ordering},
};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager, State};

use crate::error::{HemdalError, HemdalResult};
use crate::sync::SyncManager;
use crate::vault::{ItemPayload, Vault, VaultConfig};

/// Application state shared across commands.
pub struct AppState {
    pub vault: Arc<Mutex<Vault>>,
    pub sync_manager: Mutex<SyncManager>,
    pub last_activity: AtomicI64,
}

/// Seconds since UNIX epoch.
fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

/// Updates the activity timestamp.
fn touch_activity(state: &State<AppState>) {
    state.last_activity.store(now_secs(), Ordering::Relaxed);
}

/// Auto-lock threshold in seconds (10 minutes).
const AUTO_LOCK_THRESHOLD: i64 = 600;

#[derive(Serialize)]
struct VaultStatus {
    initialized: bool,
    unlocked: bool,
    device_id: Option<String>,
    item_count: usize,
}

// ─── Vault Commands ────────────────────────────────────────────

#[tauri::command]
fn vault_status(state: State<AppState>) -> HemdalResult<VaultStatus> {
    let vault = state
        .vault
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock vault mutex".to_string()))?;

    let item_count = if vault.is_unlocked() {
        vault.get_items(None).unwrap_or_default().len()
    } else {
        0
    };

    let device_id = vault.is_initialized().then(|| "initialized".to_string());

    Ok(VaultStatus {
        initialized: vault.is_initialized(),
        unlocked: vault.is_unlocked(),
        device_id,
        item_count,
    })
}

#[tauri::command]
fn initialize_vault(password: String, state: State<AppState>) -> HemdalResult<VaultConfig> {
    let mut vault = state
        .vault
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock vault mutex".to_string()))?;
    vault.initialize(&password)
}

#[tauri::command]
fn unlock_vault(password: String, state: State<AppState>) -> HemdalResult<()> {
    touch_activity(&state);
    let mut vault = state
        .vault
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock vault mutex".to_string()))?;
    vault.unlock(&password)
}

#[tauri::command]
fn lock_vault(state: State<AppState>) -> HemdalResult<()> {
    let mut vault = state
        .vault
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock vault mutex".to_string()))?;
    vault.lock();
    Ok(())
}

// ─── Item Commands ─────────────────────────────────────────────

#[derive(Deserialize)]
struct CreateItemRequest {
    item_type: String,
    name: String,
    tags: Vec<String>,
    payload: ItemPayload,
}

#[tauri::command]
fn create_item(
    request: CreateItemRequest,
    state: State<AppState>,
) -> HemdalResult<crate::vault::VaultItem> {
    touch_activity(&state);
    let mut vault = state
        .vault
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock vault mutex".to_string()))?;
    vault.add_item(
        &request.item_type,
        &request.name,
        request.tags,
        &request.payload,
    )
}

#[tauri::command]
fn get_items(
    item_type: Option<String>,
    state: State<AppState>,
) -> HemdalResult<Vec<crate::vault::DecryptedVaultItem>> {
    touch_activity(&state);
    let vault = state
        .vault
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock vault mutex".to_string()))?;
    let t = item_type.as_deref();
    vault.get_items(t)
}

#[tauri::command]
fn get_item(id: String, state: State<AppState>) -> HemdalResult<crate::vault::DecryptedVaultItem> {
    touch_activity(&state);
    let vault = state
        .vault
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock vault mutex".to_string()))?;
    vault.get_item(&id)
}

#[tauri::command]
fn update_item(
    id: String,
    name: Option<String>,
    tags: Option<Vec<String>>,
    payload: Option<ItemPayload>,
    state: State<AppState>,
) -> HemdalResult<crate::vault::DecryptedVaultItem> {
    touch_activity(&state);
    let mut vault = state
        .vault
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock vault mutex".to_string()))?;
    vault.update_item(&id, name.as_deref(), tags, payload.as_ref())
}

#[tauri::command]
fn delete_item(id: String, state: State<AppState>) -> HemdalResult<()> {
    touch_activity(&state);
    let mut vault = state
        .vault
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock vault mutex".to_string()))?;
    vault.delete_item(&id)
}

#[tauri::command]
fn search_items(
    query: String,
    state: State<AppState>,
) -> HemdalResult<Vec<crate::vault::DecryptedVaultItem>> {
    touch_activity(&state);
    let vault = state
        .vault
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock vault mutex".to_string()))?;
    vault.search_items(&query)
}

#[tauri::command]
fn toggle_favorite(id: String, state: State<AppState>) -> HemdalResult<()> {
    touch_activity(&state);
    let mut vault = state
        .vault
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock vault mutex".to_string()))?;
    vault.toggle_favorite(&id)
}

// ─── Autofill Commands ─────────────────────────────────────────

#[derive(Serialize)]
struct CredentialMatch {
    id: String,
    name: String,
    username: String,
    password: String,
    urls: Vec<String>,
}

#[tauri::command]
fn get_credentials_for_url(
    url: String,
    state: State<AppState>,
) -> HemdalResult<Vec<CredentialMatch>> {
    touch_activity(&state);
    let vault = state
        .vault
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock vault mutex".to_string()))?;

    let items = vault.get_credentials_for_url(&url)?;
    let mut matches = Vec::new();

    for item in items {
        if let ItemPayload::Password {
            username,
            password,
            urls,
            ..
        } = item.payload
        {
            matches.push(CredentialMatch {
                id: item.id,
                name: item.name,
                username,
                password,
                urls,
            });
        }
    }

    Ok(matches)
}

// ─── Sync Commands ─────────────────────────────────────────────

#[derive(Serialize)]
struct SyncStatus {
    enabled: bool,
    peers: Vec<crate::sync::PeerDevice>,
}

#[tauri::command]
fn sync_status(state: State<AppState>) -> HemdalResult<SyncStatus> {
    let sync = state
        .sync_manager
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock sync mutex".to_string()))?;

    Ok(SyncStatus {
        enabled: sync.enabled,
        peers: sync.discover_peers()?,
    })
}

#[tauri::command]
fn enable_sync(state: State<AppState>) -> HemdalResult<()> {
    let mut sync = state
        .sync_manager
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock sync mutex".to_string()))?;
    sync.enable();
    Ok(())
}

#[tauri::command]
fn disable_sync(state: State<AppState>) -> HemdalResult<()> {
    let mut sync = state
        .sync_manager
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock sync mutex".to_string()))?;
    sync.disable();
    Ok(())
}

#[tauri::command]
fn trust_device(device_id: String, state: State<AppState>) -> HemdalResult<()> {
    let mut sync = state
        .sync_manager
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock sync mutex".to_string()))?;
    sync.trust_device(&device_id)
}

#[tauri::command]
fn untrust_device(device_id: String, state: State<AppState>) -> HemdalResult<()> {
    let mut sync = state
        .sync_manager
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock sync mutex".to_string()))?;
    sync.untrust_device(&device_id)
}

// ─── App Builder ───────────────────────────────────────────────

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir().unwrap_or_else(|_| {
                dirs::data_dir()
                    .unwrap_or_else(|| std::env::current_dir().unwrap())
                    .join("com.hemdal.desktop")
            });

            std::fs::create_dir_all(&data_dir)?;

            let vault = Vault::open(data_dir).map_err(|e| {
                eprintln!("Failed to open vault: {}", e);
                e
            })?;

            let device_id = if vault.is_initialized() {
                crate::crypto::generate_device_id()
            } else {
                crate::crypto::generate_device_id()
            };

            let sync_manager =
                SyncManager::new(device_id, format!("Hemdal-{}", std::env::consts::OS));

            let vault_arc = Arc::new(Mutex::new(vault));

            // Start HTTP API server for browser extension
            let vault_clone = vault_arc.clone();
            tauri::async_runtime::spawn(async move {
                match http_api::start_http_server(19421, vault_clone).await {
                    Ok(port) => {
                        println!("Hemdal HTTP API listening on port {}", port);
                    }
                    Err(e) => {
                        eprintln!("Failed to start HTTP API: {}", e);
                    }
                }
            });

            let app_handle = app.app_handle().clone();

            app.manage(AppState {
                vault: vault_arc.clone(),
                sync_manager: Mutex::new(sync_manager),
                last_activity: AtomicI64::new(0),
            });

            // ─── Auto-Lock Background Task ───────────────────────
            tauri::async_runtime::spawn(async move {
                let mut interval = tokio::time::interval(Duration::from_secs(10));
                loop {
                    interval.tick().await;

                    if let Some(state) = app_handle.try_state::<AppState>() {
                        let last = state.last_activity.load(Ordering::Relaxed);
                        if last == 0 {
                            continue;
                        }

                        let elapsed = now_secs() - last;
                        if elapsed >= AUTO_LOCK_THRESHOLD {
                            if let Ok(mut vault) = state.vault.lock() {
                                if vault.is_unlocked() {
                                    vault.lock();
                                    println!("Vault auto-locked after {}s idle", elapsed);
                                    if let Some(window) = app_handle.get_webview_window("main") {
                                        let _ = window.emit("vault-locked", ());
                                    }
                                }
                            }
                        }
                    }
                }
            });

            // ─── System Tray ─────────────────────────────────────
            let show_i =
                tauri::menu::MenuItem::with_id(app, "show", "Show Vault", true, None::<&str>)?;
            let lock_i =
                tauri::menu::MenuItem::with_id(app, "lock", "Lock Vault", true, None::<&str>)?;
            let quit_i = tauri::menu::MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = tauri::menu::Menu::with_items(app, &[&show_i, &lock_i, &quit_i])?;

            let _tray = tauri::tray::TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "lock" => {
                        if let Ok(mut state) = app.state::<AppState>().vault.lock() {
                            state.lock();
                        }
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("vault-locked", ());
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { .. } = event {
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            vault_status,
            initialize_vault,
            unlock_vault,
            lock_vault,
            create_item,
            get_items,
            get_item,
            update_item,
            delete_item,
            search_items,
            toggle_favorite,
            get_credentials_for_url,
            sync_status,
            enable_sync,
            disable_sync,
            trust_device,
            untrust_device,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
