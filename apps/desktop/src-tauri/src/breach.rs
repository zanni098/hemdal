use sha1::{Digest, Sha1};

use crate::error::{HemdalError, HemdalResult};

/// Check if a password has appeared in known data breaches using the
/// Have I Been Pwned k-Anonymity API.
/// Returns the number of times the password was found in breaches.
pub async fn check_password_breach(password: &str) -> HemdalResult<u64> {
    let mut hasher = Sha1::new();
    hasher.update(password.as_bytes());
    let hash = format!("{:X}", hasher.finalize());

    let prefix = &hash[..5];
    let suffix = &hash[5..];

    let url = format!(
        "https://api.pwnedpasswords.com/range/{}?addPadding=true",
        prefix
    );

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", "Hemdal-Password-Manager")
        .send()
        .await
        .map_err(|e| HemdalError::CryptoError(format!("HIBP request failed: {}", e)))?;

    if !response.status().is_success() {
        return Err(HemdalError::CryptoError(format!(
            "HIBP API returned status: {}",
            response.status()
        )));
    }

    let body = response
        .text()
        .await
        .map_err(|e| HemdalError::CryptoError(format!("HIBP read failed: {}", e)))?;

    for line in body.lines() {
        let parts: Vec<&str> = line.splitn(2, ':').collect();
        if parts.len() == 2 && parts[0].eq_ignore_ascii_case(suffix) {
            return parts[1]
                .trim()
                .parse::<u64>()
                .map_err(|e| HemdalError::CryptoError(format!("HIBP parse error: {}", e)));
        }
    }

    Ok(0) // Not found = safe
}
