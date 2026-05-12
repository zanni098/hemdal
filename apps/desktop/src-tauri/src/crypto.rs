use aes_gcm::{
    Aes256Gcm, Nonce,
    aead::{Aead, KeyInit, OsRng},
};
use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use rand::RngCore;
use sha2::{Digest, Sha256};
use zeroize::{Zeroize, ZeroizeOnDrop};

use crate::error::{HemdalError, HemdalResult};

pub const VAULT_KEY_LEN: usize = 32;
pub const SALT_LEN: usize = 32;
pub const NONCE_LEN: usize = 12;
pub const TAG_LEN: usize = 16;

/// A sensitive key that is automatically zeroed from memory when dropped.
#[derive(Clone, Zeroize, ZeroizeOnDrop)]
pub struct SecureKey {
    #[zeroize(skip)]
    pub bytes: Vec<u8>,
}

impl SecureKey {
    pub fn new(bytes: Vec<u8>) -> Self {
        Self { bytes }
    }

    pub fn from_slice(slice: &[u8]) -> Self {
        Self::new(slice.to_vec())
    }

    pub fn random(len: usize) -> Self {
        let mut bytes = vec![0u8; len];
        OsRng.fill_bytes(&mut bytes);
        Self::new(bytes)
    }
}

/// Encrypted blob containing ciphertext, nonce, and authentication tag.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EncryptedBlob {
    pub ciphertext: String, // base64
    pub nonce: String,      // base64
    pub tag: String,        // base64
}

/// Derives a master key from the user's password using Argon2id.
/// Returns (derived_key, salt, password_verifier_hash)
pub fn derive_master_key(password: &str) -> HemdalResult<(SecureKey, String, String)> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| HemdalError::CryptoError(e.to_string()))?;

    let hash_b64 = password_hash
        .hash
        .ok_or_else(|| HemdalError::CryptoError("Failed to generate password hash".to_string()))?;

    let derived_key = SecureKey::new(hash_b64.as_bytes().to_vec());
    let salt_b64 = salt.as_str().to_string();
    let verifier_b64 = password_hash.to_string();

    Ok((derived_key, salt_b64, verifier_b64))
}

/// Verifies a password against a stored verifier and derives the same key.
pub fn verify_and_derive_key(password: &str, verifier: &str) -> HemdalResult<SecureKey> {
    let parsed_hash =
        PasswordHash::new(verifier).map_err(|e| HemdalError::CryptoError(e.to_string()))?;

    let argon2 = Argon2::default();
    argon2
        .verify_password(password.as_bytes(), &parsed_hash)
        .map_err(|_| HemdalError::InvalidPassword)?;

    // Re-derive the key using the stored salt
    let salt = parsed_hash
        .salt
        .ok_or_else(|| HemdalError::CryptoError("Missing salt in verifier".to_string()))?;

    let new_hash = argon2
        .hash_password(password.as_bytes(), salt)
        .map_err(|e| HemdalError::CryptoError(e.to_string()))?;

    let hash_b64 = new_hash
        .hash
        .ok_or_else(|| HemdalError::CryptoError("Failed to generate password hash".to_string()))?;

    Ok(SecureKey::new(hash_b64.as_bytes().to_vec()))
}

/// Generates a random vault key that encrypts all vault items.
pub fn generate_vault_key() -> SecureKey {
    SecureKey::random(VAULT_KEY_LEN)
}

/// Encrypts plaintext bytes with AES-256-GCM.
pub fn encrypt(key: &SecureKey, plaintext: &[u8]) -> HemdalResult<EncryptedBlob> {
    if key.bytes.len() != VAULT_KEY_LEN {
        return Err(HemdalError::CryptoError(
            "Invalid key length for AES-256".to_string(),
        ));
    }

    let cipher = Aes256Gcm::new_from_slice(&key.bytes)
        .map_err(|e| HemdalError::EncryptionError(e.to_string()))?;

    let mut nonce_bytes = [0u8; NONCE_LEN];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| HemdalError::EncryptionError(e.to_string()))?;

    // Split ciphertext and tag (last 16 bytes)
    let tag_start = ciphertext.len().saturating_sub(TAG_LEN);
    let (ct, tag) = ciphertext.split_at(tag_start);

    Ok(EncryptedBlob {
        ciphertext: BASE64.encode(ct),
        nonce: BASE64.encode(&nonce_bytes),
        tag: BASE64.encode(tag),
    })
}

/// Decrypts an AES-256-GCM encrypted blob.
pub fn decrypt(key: &SecureKey, blob: &EncryptedBlob) -> HemdalResult<Vec<u8>> {
    if key.bytes.len() != VAULT_KEY_LEN {
        return Err(HemdalError::CryptoError(
            "Invalid key length for AES-256".to_string(),
        ));
    }

    let cipher = Aes256Gcm::new_from_slice(&key.bytes)
        .map_err(|e| HemdalError::DecryptionError(e.to_string()))?;

    let nonce_bytes = BASE64
        .decode(&blob.nonce)
        .map_err(|e| HemdalError::DecryptionError(e.to_string()))?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ct = BASE64
        .decode(&blob.ciphertext)
        .map_err(|e| HemdalError::DecryptionError(e.to_string()))?;
    let tag = BASE64
        .decode(&blob.tag)
        .map_err(|e| HemdalError::DecryptionError(e.to_string()))?;

    // Reconstruct ciphertext || tag
    let mut ciphertext_with_tag = ct;
    ciphertext_with_tag.extend_from_slice(&tag);

    let plaintext = cipher
        .decrypt(nonce, ciphertext_with_tag.as_ref())
        .map_err(|e| HemdalError::DecryptionError(e.to_string()))?;

    Ok(plaintext)
}

/// Encrypts the vault key with the master-derived key for storage.
pub fn encrypt_vault_key(
    master_key: &SecureKey,
    vault_key: &SecureKey,
) -> HemdalResult<EncryptedBlob> {
    // Derive an encryption key from the master key using SHA-256
    let mut hasher = Sha256::new();
    hasher.update(&master_key.bytes);
    let enc_key = SecureKey::new(hasher.finalize().to_vec());

    encrypt(&enc_key, &vault_key.bytes)
}

/// Decrypts the vault key using the master-derived key.
pub fn decrypt_vault_key(master_key: &SecureKey, blob: &EncryptedBlob) -> HemdalResult<SecureKey> {
    let mut hasher = Sha256::new();
    hasher.update(&master_key.bytes);
    let enc_key = SecureKey::new(hasher.finalize().to_vec());

    let vault_key_bytes = decrypt(&enc_key, blob)?;
    Ok(SecureKey::new(vault_key_bytes))
}

/// Generates a unique device ID.
pub fn generate_device_id() -> String {
    let mut bytes = [0u8; 16];
    OsRng.fill_bytes(&mut bytes);
    BASE64.encode(&bytes)
}
