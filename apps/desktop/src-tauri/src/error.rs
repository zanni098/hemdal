use thiserror::Error;

#[derive(Error, Debug)]
pub enum HemdalError {
    #[error("Vault is locked. Unlock with master password first.")]
    VaultLocked,

    #[error("Invalid master password")]
    InvalidPassword,

    #[error("Vault already initialized")]
    VaultAlreadyInitialized,

    #[error("Vault not initialized")]
    VaultNotInitialized,

    #[error("Encryption failed: {0}")]
    EncryptionError(String),

    #[error("Decryption failed: {0}")]
    DecryptionError(String),

    #[error("Database error: {0}")]
    DatabaseError(#[from] rusqlite::Error),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("Base64 decode error: {0}")]
    Base64Error(#[from] base64::DecodeError),

    #[error("Crypto error: {0}")]
    CryptoError(String),

    #[error("Sync error: {0}")]
    SyncError(String),

    #[error("Item not found: {0}")]
    ItemNotFound(String),

    #[error("Invalid item type: {0}")]
    InvalidItemType(String),

    #[error("Biometric error: {0}")]
    BiometricError(String),
}

impl serde::Serialize for HemdalError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub type HemdalResult<T> = Result<T, HemdalError>;
