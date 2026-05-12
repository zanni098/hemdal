use crate::crypto::{EncryptedBlob, SecureKey, decrypt, encrypt};
use crate::error::{HemdalError, HemdalResult};
use std::path::PathBuf;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct BiometricConfig {
    pub enabled: bool,
    pub created_at: String,
}

const BIOMETRIC_CONFIG_FILE: &str = "biometric_config.json";
const BIOMETRIC_KEY_FILE: &str = "biometric_key.dat";
const BIOMETRIC_VAULT_KEY_FILE: &str = "biometric_vault_key.dat";

// --- Platform-specific biometric verification ---

#[cfg(target_os = "windows")]
pub async fn verify_biometric() -> HemdalResult<bool> {
    tokio::task::spawn_blocking(|| {
        use windows::Security::Credentials::UI::UserConsentVerifier;

        let availability = UserConsentVerifier::CheckAvailabilityAsync().map_err(|e| {
            HemdalError::BiometricError(format!("CheckAvailabilityAsync failed: {}", e))
        })?;

        let avail_result = availability
            .get()
            .map_err(|e| HemdalError::BiometricError(format!("Availability get failed: {}", e)))?;

        use windows::Security::Credentials::UI::UserConsentVerifierAvailability;
        if avail_result != UserConsentVerifierAvailability::Available {
            return Ok(false);
        }

        let message = windows::core::HSTRING::from("Unlock your Hemdal vault");
        let verification =
            UserConsentVerifier::RequestVerificationAsync(&message).map_err(|e| {
                HemdalError::BiometricError(format!("RequestVerificationAsync failed: {}", e))
            })?;

        let verify_result = verification
            .get()
            .map_err(|e| HemdalError::BiometricError(format!("Verification get failed: {}", e)))?;

        use windows::Security::Credentials::UI::UserConsentVerificationResult;
        Ok(verify_result == UserConsentVerificationResult::Verified)
    })
    .await
    .map_err(|e| HemdalError::BiometricError(format!("Blocking task failed: {}", e)))?
}

#[cfg(target_os = "macos")]
pub async fn verify_biometric() -> HemdalResult<bool> {
    Err(HemdalError::BiometricError(
        "Touch ID support is not yet implemented".to_string(),
    ))
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub async fn verify_biometric() -> HemdalResult<bool> {
    Err(HemdalError::BiometricError(
        "Biometric authentication is not supported on this platform".to_string(),
    ))
}

// --- DPAPI key storage (Windows) ---

#[cfg(target_os = "windows")]
fn dpapi_encrypt(data: &[u8]) -> HemdalResult<Vec<u8>> {
    use windows::Win32::Foundation::LocalFree;
    use windows::Win32::Security::Cryptography::{CRYPT_INTEGER_BLOB, CryptProtectData};

    unsafe {
        let data_in = CRYPT_INTEGER_BLOB {
            cbData: data.len() as u32,
            pbData: data.as_ptr() as *mut u8,
        };

        let mut data_out = CRYPT_INTEGER_BLOB::default();

        CryptProtectData(&data_in, None, None, None, None, 0, &mut data_out)
            .map_err(|e| HemdalError::BiometricError(format!("CryptProtectData failed: {}", e)))?;

        let protected =
            std::slice::from_raw_parts(data_out.pbData, data_out.cbData as usize).to_vec();
        let _ = LocalFree(windows::Win32::Foundation::HLOCAL(
            data_out.pbData as *mut std::ffi::c_void,
        ));

        Ok(protected)
    }
}

#[cfg(target_os = "windows")]
fn dpapi_decrypt(data: &[u8]) -> HemdalResult<Vec<u8>> {
    use windows::Win32::Foundation::LocalFree;
    use windows::Win32::Security::Cryptography::{CRYPT_INTEGER_BLOB, CryptUnprotectData};

    unsafe {
        let mut data_in = CRYPT_INTEGER_BLOB {
            cbData: data.len() as u32,
            pbData: data.as_ptr() as *mut u8,
        };

        let mut data_out = CRYPT_INTEGER_BLOB::default();

        CryptUnprotectData(&mut data_in, None, None, None, None, 0, &mut data_out).map_err(
            |e| HemdalError::BiometricError(format!("CryptUnprotectData failed: {}", e)),
        )?;

        let plaintext =
            std::slice::from_raw_parts(data_out.pbData, data_out.cbData as usize).to_vec();
        let _ = LocalFree(windows::Win32::Foundation::HLOCAL(
            data_out.pbData as *mut std::ffi::c_void,
        ));

        Ok(plaintext)
    }
}

#[cfg(not(target_os = "windows"))]
fn dpapi_encrypt(data: &[u8]) -> HemdalResult<Vec<u8>> {
    Ok(data.to_vec())
}

#[cfg(not(target_os = "windows"))]
fn dpapi_decrypt(data: &[u8]) -> HemdalResult<Vec<u8>> {
    Ok(data.to_vec())
}

// --- High-level API ---

pub fn is_biometric_available() -> bool {
    #[cfg(target_os = "windows")]
    {
        use windows::Security::Credentials::UI::UserConsentVerifier;
        if let Ok(op) = UserConsentVerifier::CheckAvailabilityAsync() {
            if let Ok(result) = op.get() {
                use windows::Security::Credentials::UI::UserConsentVerifierAvailability;
                return result == UserConsentVerifierAvailability::Available;
            }
        }
    }
    false
}

pub fn is_biometric_enabled(data_dir: &PathBuf) -> bool {
    let config_file = data_dir.join(BIOMETRIC_CONFIG_FILE);
    if !config_file.exists() {
        return false;
    }
    std::fs::read_to_string(config_file)
        .ok()
        .and_then(|s| serde_json::from_str::<BiometricConfig>(&s).ok())
        .map(|c| c.enabled)
        .unwrap_or(false)
}

pub fn enable_biometric(vault_key: &SecureKey, data_dir: &PathBuf) -> HemdalResult<()> {
    let biometric_key = SecureKey::random(32);

    let encrypted_vault_key = encrypt(&biometric_key, &vault_key.bytes)?;

    let protected_key = dpapi_encrypt(&biometric_key.bytes)?;

    let key_file = data_dir.join(BIOMETRIC_KEY_FILE);
    std::fs::write(&key_file, &protected_key)?;

    let vault_key_file = data_dir.join(BIOMETRIC_VAULT_KEY_FILE);
    let vault_key_json = serde_json::to_vec(&encrypted_vault_key)?;
    std::fs::write(&vault_key_file, &vault_key_json)?;

    let config = BiometricConfig {
        enabled: true,
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    let config_file = data_dir.join(BIOMETRIC_CONFIG_FILE);
    std::fs::write(&config_file, serde_json::to_string(&config).unwrap())?;

    Ok(())
}

pub async fn unlock_with_biometric(data_dir: &PathBuf) -> HemdalResult<SecureKey> {
    if !verify_biometric().await? {
        return Err(HemdalError::BiometricError(
            "Biometric verification failed or cancelled".to_string(),
        ));
    }

    let key_file = data_dir.join(BIOMETRIC_KEY_FILE);
    let protected_key = std::fs::read(&key_file)?;

    let biometric_key_bytes = dpapi_decrypt(&protected_key)?;
    let biometric_key = SecureKey::new(biometric_key_bytes);

    let vault_key_file = data_dir.join(BIOMETRIC_VAULT_KEY_FILE);
    let vault_key_json = std::fs::read(&vault_key_file)?;

    let encrypted_vault_key: EncryptedBlob = serde_json::from_slice(&vault_key_json)?;

    let vault_key_bytes = decrypt(&biometric_key, &encrypted_vault_key)?;
    Ok(SecureKey::new(vault_key_bytes))
}

pub fn disable_biometric(data_dir: &PathBuf) -> HemdalResult<()> {
    let config_file = data_dir.join(BIOMETRIC_CONFIG_FILE);
    if config_file.exists() {
        std::fs::remove_file(&config_file).ok();
    }
    let key_file = data_dir.join(BIOMETRIC_KEY_FILE);
    if key_file.exists() {
        std::fs::remove_file(&key_file).ok();
    }
    let vault_key_file = data_dir.join(BIOMETRIC_VAULT_KEY_FILE);
    if vault_key_file.exists() {
        std::fs::remove_file(&vault_key_file).ok();
    }
    Ok(())
}
