pub mod crypto;
pub mod error;
pub mod http_api;
pub mod native_messaging;
pub mod sync;
pub mod vault;

use std::sync::{Arc, Mutex};

use serde::{Deserialize, Serialize};
use tauri::{Manager, State};

use crate::error::{HemdalError, HemdalResult};
use crate::sync::SyncManager;
use crate::vault::{ItemPayload, Vault, VaultConfig};

/// Application state shared across commands.
pub struct AppState {
    pub vault: Arc<Mutex<Vault>>,
    pub sync_manager: Mutex<SyncManager>,
}

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
    let vault = state
        .vault
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock vault mutex".to_string()))?;
    let t = item_type.as_deref();
    vault.get_items(t)
}

#[tauri::command]
fn get_item(id: String, state: State<AppState>) -> HemdalResult<crate::vault::DecryptedVaultItem> {
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
    let mut vault = state
        .vault
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock vault mutex".to_string()))?;
    vault.update_item(&id, name.as_deref(), tags, payload.as_ref())
}

#[tauri::command]
fn delete_item(id: String, state: State<AppState>) -> HemdalResult<()> {
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
    let vault = state
        .vault
        .lock()
        .map_err(|_| HemdalError::CryptoError("Failed to lock vault mutex".to_string()))?;
    vault.search_items(&query)
}

#[tauri::command]
fn toggle_favorite(id: String, state: State<AppState>) -> HemdalResult<()> {
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
                // We don't have direct access to config here due to privacy,
                // but for the sync manager we can generate one if needed.
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

            app.manage(AppState {
                vault: vault_arc,
                sync_manager: Mutex::new(sync_manager),
            });

            Ok(())
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
