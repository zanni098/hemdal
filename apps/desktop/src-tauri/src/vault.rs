use rusqlite::{Connection, OptionalExtension, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

use crate::crypto::{
    EncryptedBlob, SecureKey, decrypt, decrypt_vault_key, encrypt, encrypt_vault_key,
};
use crate::error::{HemdalError, HemdalResult};

/// Stored vault configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultConfig {
    pub device_id: String,
    pub salt: String,
    pub verifier: String,
    pub encrypted_vault_key: EncryptedBlob,
    pub version: u32,
}

/// A decrypted vault item payload.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ItemPayload {
    Password {
        username: String,
        password: String,
        urls: Vec<String>,
        notes: Option<String>,
        totp: Option<String>,
    },
    ApiKey {
        key: String,
        endpoint: Option<String>,
        headers: Option<std::collections::HashMap<String, String>>,
        notes: Option<String>,
    },
    Secret {
        value: String,
        notes: Option<String>,
    },
    EnvironmentVariable {
        key: String,
        value: String,
        project: Option<String>,
        notes: Option<String>,
    },
    Note {
        content: String,
    },
    SshKey {
        private_key: String,
        public_key: Option<String>,
        notes: Option<String>,
    },
    CreditCard {
        number: String,
        expiry: String,
        cvv: String,
        holder: String,
    },
}

/// Stored vault item (as stored in DB, with encrypted payload).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultItem {
    pub id: String,
    pub item_type: String,
    pub name: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub tags: Vec<String>,
    pub favorite: bool,
    pub encrypted_data: EncryptedBlob,
}

/// Decrypted vault item with plaintext payload.
#[derive(Debug, Clone, Serialize)]
pub struct DecryptedVaultItem {
    pub id: String,
    pub item_type: String,
    pub name: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub tags: Vec<String>,
    pub favorite: bool,
    pub payload: ItemPayload,
}

/// The main vault manager.
pub struct Vault {
    conn: Connection,
    vault_key: Option<SecureKey>,
    config: Option<VaultConfig>,
    _db_path: PathBuf,
}

impl Vault {
    /// Opens or creates the vault database.
    pub fn open(data_dir: PathBuf) -> HemdalResult<Self> {
        let db_path = data_dir.join("vault.db");
        let conn = Connection::open(&db_path)?;

        let mut vault = Self {
            conn,
            vault_key: None,
            config: None,
            _db_path: db_path,
        };

        vault.init_schema()?;
        vault.load_config()?;

        Ok(vault)
    }

    fn init_schema(&mut self) -> HemdalResult<()> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS vault_config (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                device_id TEXT NOT NULL,
                salt TEXT NOT NULL,
                verifier TEXT NOT NULL,
                encrypted_vault_key TEXT NOT NULL,
                version INTEGER NOT NULL DEFAULT 1
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS vault_items (
                id TEXT PRIMARY KEY,
                item_type TEXT NOT NULL,
                name TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                tags TEXT NOT NULL DEFAULT '[]',
                favorite INTEGER NOT NULL DEFAULT 0,
                encrypted_ciphertext TEXT NOT NULL,
                encrypted_nonce TEXT NOT NULL,
                encrypted_tag TEXT NOT NULL
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_items_type ON vault_items(item_type)",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_items_favorite ON vault_items(favorite)",
            [],
        )?;

        Ok(())
    }

    fn load_config(&mut self) -> HemdalResult<()> {
        let row = self
            .conn
            .query_row(
                "SELECT device_id, salt, verifier, encrypted_vault_key, version FROM vault_config WHERE id = 1",
                [],
                |row| {
                    let encrypted_vault_key_json: String = row.get(3)?;
                    let encrypted_vault_key: EncryptedBlob = serde_json::from_str(&encrypted_vault_key_json)
                        .map_err(|e| rusqlite::Error::FromSqlConversionFailure(
                            3,
                            rusqlite::types::Type::Text,
                            Box::new(e),
                        ))?;
                    Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?, encrypted_vault_key, row.get::<_, u32>(4)?))
                },
            )
            .optional()?;

        if let Some((device_id, salt, verifier, encrypted_vault_key, version)) = row {
            self.config = Some(VaultConfig {
                device_id,
                salt,
                verifier,
                encrypted_vault_key,
                version,
            });
        }

        Ok(())
    }

    /// Check if vault is already initialized.
    pub fn is_initialized(&self) -> bool {
        self.config.is_some()
    }

    /// Check if vault is unlocked.
    pub fn is_unlocked(&self) -> bool {
        self.vault_key.is_some()
    }

    /// Initialize a new vault with a master password.
    pub fn initialize(&mut self, password: &str) -> HemdalResult<VaultConfig> {
        if self.config.is_some() {
            return Err(HemdalError::VaultAlreadyInitialized);
        }

        let (master_key, salt, verifier) = crate::crypto::derive_master_key(password)?;
        let vault_key = crate::crypto::generate_vault_key();
        let encrypted_vault_key = encrypt_vault_key(&master_key, &vault_key)?;
        let device_id = crate::crypto::generate_device_id();

        let config = VaultConfig {
            device_id: device_id.clone(),
            salt,
            verifier: verifier.clone(),
            encrypted_vault_key: encrypted_vault_key.clone(),
            version: 1,
        };

        self.conn.execute(
            "INSERT INTO vault_config (id, device_id, salt, verifier, encrypted_vault_key, version)
             VALUES (1, ?1, ?2, ?3, ?4, ?5)",
            params![
                device_id,
                config.salt,
                verifier,
                serde_json::to_string(&encrypted_vault_key)?,
                config.version
            ],
        )?;

        self.config = Some(config.clone());
        self.vault_key = Some(vault_key);

        Ok(config)
    }

    /// Unlock the vault with the master password.
    pub fn unlock(&mut self, password: &str) -> HemdalResult<()> {
        let config = self
            .config
            .as_ref()
            .ok_or(HemdalError::VaultNotInitialized)?;

        let master_key = crate::crypto::verify_and_derive_key(password, &config.verifier)?;
        let vault_key = decrypt_vault_key(&master_key, &config.encrypted_vault_key)?;

        self.vault_key = Some(vault_key);
        Ok(())
    }

    /// Unlock the vault with a pre-derived vault key.
    pub fn unlock_with_key(&mut self, vault_key: SecureKey) {
        self.vault_key = Some(vault_key);
    }

    /// Lock the vault (clear vault key from memory).
    pub fn lock(&mut self) {
        self.vault_key = None;
    }

    pub fn vault_key(&self) -> HemdalResult<&SecureKey> {
        self.vault_key.as_ref().ok_or(HemdalError::VaultLocked)
    }

    /// Add a new item to the vault.
    pub fn add_item(
        &mut self,
        item_type: &str,
        name: &str,
        tags: Vec<String>,
        payload: &ItemPayload,
    ) -> HemdalResult<VaultItem> {
        let vault_key = self.vault_key()?;
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        let payload_json = serde_json::to_vec(payload)?;
        let encrypted = encrypt(vault_key, &payload_json)?;

        self.conn.execute(
            "INSERT INTO vault_items (id, item_type, name, created_at, updated_at, tags, favorite, encrypted_ciphertext, encrypted_nonce, encrypted_tag)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                &id,
                item_type,
                name,
                now,
                now,
                serde_json::to_string(&tags)?,
                false,
                encrypted.ciphertext,
                encrypted.nonce,
                encrypted.tag,
            ],
        )?;

        Ok(VaultItem {
            id,
            item_type: item_type.to_string(),
            name: name.to_string(),
            created_at: now,
            updated_at: now,
            tags,
            favorite: false,
            encrypted_data: encrypted,
        })
    }

    /// Get all vault items (decrypted).
    pub fn get_items(&self, item_type: Option<&str>) -> HemdalResult<Vec<DecryptedVaultItem>> {
        let vault_key = self.vault_key()?;

        let mut items = Vec::new();

        if let Some(t) = item_type {
            let mut stmt = self.conn
                .prepare("SELECT id, item_type, name, created_at, updated_at, tags, favorite, encrypted_ciphertext, encrypted_nonce, encrypted_tag FROM vault_items WHERE item_type = ?1 ORDER BY name")?;
            let rows = stmt.query_map(params![t], |row| self.map_row_to_item(row, vault_key))?;
            for row in rows {
                items.push(row?);
            }
        } else {
            let mut stmt = self.conn
                .prepare("SELECT id, item_type, name, created_at, updated_at, tags, favorite, encrypted_ciphertext, encrypted_nonce, encrypted_tag FROM vault_items ORDER BY name")?;
            let rows = stmt.query_map([], |row| self.map_row_to_item(row, vault_key))?;
            for row in rows {
                items.push(row?);
            }
        }

        Ok(items)
    }

    fn map_row_to_item(
        &self,
        row: &rusqlite::Row,
        vault_key: &SecureKey,
    ) -> rusqlite::Result<DecryptedVaultItem> {
        let encrypted = EncryptedBlob {
            ciphertext: row.get(7)?,
            nonce: row.get(8)?,
            tag: row.get(9)?,
        };

        let tags_json: String = row.get(5)?;
        let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

        let decrypted = decrypt(vault_key, &encrypted).map_err(|e| {
            rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Blob, Box::new(e))
        })?;

        let payload: ItemPayload = serde_json::from_slice(&decrypted).map_err(|e| {
            rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Blob, Box::new(e))
        })?;

        Ok(DecryptedVaultItem {
            id: row.get(0)?,
            item_type: row.get(1)?,
            name: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
            tags,
            favorite: row.get(6)?,
            payload,
        })
    }

    /// Get a single item by ID.
    pub fn get_item(&self, id: &str) -> HemdalResult<DecryptedVaultItem> {
        let vault_key = self.vault_key()?;

        let mut stmt = self.conn.prepare(
            "SELECT id, item_type, name, created_at, updated_at, tags, favorite, encrypted_ciphertext, encrypted_nonce, encrypted_tag FROM vault_items WHERE id = ?1"
        )?;

        let item = stmt.query_row(params![id], |row| self.map_row_to_item(row, vault_key))?;

        Ok(item)
    }

    /// Update an existing item.
    pub fn update_item(
        &mut self,
        id: &str,
        name: Option<&str>,
        tags: Option<Vec<String>>,
        payload: Option<&ItemPayload>,
    ) -> HemdalResult<DecryptedVaultItem> {
        let vault_key = self.vault_key()?;
        let now = chrono::Utc::now().timestamp();

        if let Some(name) = name {
            self.conn.execute(
                "UPDATE vault_items SET name = ?1, updated_at = ?2 WHERE id = ?3",
                params![name, now, id],
            )?;
        }

        if let Some(tags) = tags {
            self.conn.execute(
                "UPDATE vault_items SET tags = ?1, updated_at = ?2 WHERE id = ?3",
                params![serde_json::to_string(&tags)?, now, id],
            )?;
        }

        if let Some(payload) = payload {
            let payload_json = serde_json::to_vec(payload)?;
            let encrypted = encrypt(vault_key, &payload_json)?;
            self.conn.execute(
                "UPDATE vault_items SET encrypted_ciphertext = ?1, encrypted_nonce = ?2, encrypted_tag = ?3, updated_at = ?4 WHERE id = ?5",
                params![encrypted.ciphertext, encrypted.nonce, encrypted.tag, now, id],
            )?;
        }

        self.get_item(id)
    }

    /// Delete an item.
    pub fn delete_item(&mut self, id: &str) -> HemdalResult<()> {
        self.conn
            .execute("DELETE FROM vault_items WHERE id = ?1", params![id])?;
        Ok(())
    }

    /// Toggle favorite status.
    pub fn toggle_favorite(&mut self, id: &str) -> HemdalResult<()> {
        self.conn.execute(
            "UPDATE vault_items SET favorite = NOT favorite, updated_at = ?1 WHERE id = ?2",
            params![chrono::Utc::now().timestamp(), id],
        )?;
        Ok(())
    }

    /// Search items by name or tags (substring match).
    pub fn search_items(&self, query: &str) -> HemdalResult<Vec<DecryptedVaultItem>> {
        let vault_key = self.vault_key()?;
        let pattern = format!("%{}%", query);

        let mut stmt = self.conn.prepare(
            "SELECT id, item_type, name, created_at, updated_at, tags, favorite, encrypted_ciphertext, encrypted_nonce, encrypted_tag
             FROM vault_items
             WHERE name LIKE ?1 OR tags LIKE ?1
             ORDER BY name"
        )?;

        let rows = stmt.query_map(params![pattern], |row| self.map_row_to_item(row, vault_key))?;

        let mut items = Vec::new();
        for row in rows {
            items.push(row?);
        }

        Ok(items)
    }

    /// Fuzzy search items by name with scoring.
    pub fn fuzzy_search_items(&self, query: &str) -> HemdalResult<Vec<(DecryptedVaultItem, i32)>> {
        let vault_key = self.vault_key()?;

        let mut stmt = self.conn.prepare(
            "SELECT id, item_type, name, created_at, updated_at, tags, favorite, encrypted_ciphertext, encrypted_nonce, encrypted_tag
             FROM vault_items
             ORDER BY name"
        )?;

        let rows = stmt.query_map([], |row| self.map_row_to_item(row, vault_key))?;

        let mut scored_items: Vec<(DecryptedVaultItem, i32)> = Vec::new();
        for row in rows {
            let item = row?;
            let score = crate::fuzzy::fuzzy_score(query, &item.name);
            // Also check tags
            let tag_score = item
                .tags
                .iter()
                .map(|tag| crate::fuzzy::fuzzy_score(query, tag))
                .max()
                .unwrap_or(0);
            // Check username for password items
            let username_score = if let ItemPayload::Password { username, .. } = &item.payload {
                crate::fuzzy::fuzzy_score(query, username)
            } else {
                0
            };

            let total_score = score.max(tag_score).max(username_score);
            if total_score > 0 {
                scored_items.push((item, total_score));
            }
        }

        // Sort by score descending
        scored_items.sort_by(|a, b| b.1.cmp(&a.1));

        Ok(scored_items)
    }

    /// Get credentials matching a URL (for autofill).
    pub fn get_credentials_for_url(&self, url: &str) -> HemdalResult<Vec<DecryptedVaultItem>> {
        let vault_key = self.vault_key()?;

        let mut stmt = self.conn.prepare(
            "SELECT id, item_type, name, created_at, updated_at, tags, favorite, encrypted_ciphertext, encrypted_nonce, encrypted_tag
             FROM vault_items
             WHERE item_type = 'password'
             ORDER BY name"
        )?;

        let rows = stmt.query_map([], |row| self.map_row_to_item(row, vault_key))?;

        let mut items = Vec::new();
        for row in rows {
            let item = row?;
            if let ItemPayload::Password { urls, .. } = &item.payload {
                if urls.iter().any(|u| url.contains(u) || u.contains(url)) {
                    items.push(item);
                }
            }
        }

        Ok(items)
    }
}
