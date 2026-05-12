use crate::error::{HemdalError, HemdalResult};
use crate::vault::{ItemPayload, Vault};
use serde::{Deserialize, Serialize};

/// Result of an import operation.
#[derive(Debug, Clone, Serialize)]
pub struct ImportResult {
    pub total: usize,
    pub imported: usize,
    pub skipped: usize,
    pub errors: Vec<String>,
}

impl ImportResult {
    fn new() -> Self {
        Self {
            total: 0,
            imported: 0,
            skipped: 0,
            errors: Vec::new(),
        }
    }
}

// ─── Bitwarden JSON Format ───────────────────────────────────

#[derive(Debug, Deserialize)]
struct BitwardenExport {
    #[serde(default)]
    items: Vec<BitwardenItem>,
}

#[derive(Debug, Deserialize)]
struct BitwardenItem {
    #[serde(rename = "type")]
    item_type: i32,
    name: String,
    #[serde(default)]
    login: Option<BitwardenLogin>,
    #[serde(default)]
    notes: Option<String>,
    #[serde(default)]
    fields: Vec<BitwardenField>,
}

#[derive(Debug, Deserialize)]
struct BitwardenLogin {
    #[serde(default)]
    username: Option<String>,
    #[serde(default)]
    password: Option<String>,
    #[serde(default)]
    uris: Vec<BitwardenUri>,
    #[serde(default)]
    totp: Option<String>,
}

#[derive(Debug, Deserialize)]
struct BitwardenUri {
    uri: String,
}

#[derive(Debug, Deserialize)]
struct BitwardenField {
    #[serde(rename = "type")]
    _field_type: i32,
    name: String,
    value: Option<String>,
}

fn import_bitwarden_json(vault: &mut Vault, json_data: &str) -> HemdalResult<ImportResult> {
    let export: BitwardenExport =
        serde_json::from_str(json_data).map_err(|e| HemdalError::SerializationError(e))?;

    let mut result = ImportResult::new();
    result.total = export.items.len();

    for item in export.items {
        // Type 1 = login
        if item.item_type != 1 {
            result.skipped += 1;
            continue;
        }

        let login = match item.login {
            Some(l) => l,
            None => {
                result.skipped += 1;
                continue;
            }
        };

        let urls: Vec<String> = login
            .uris
            .into_iter()
            .map(|u| u.uri)
            .filter(|u| !u.is_empty())
            .collect();

        // TODO: Check for API key or secret in custom fields and create separate items
        for _field in item.fields {
            // Future: detect custom fields and create api-key or secret items
        }

        let payload = ItemPayload::Password {
            username: login.username.unwrap_or_default(),
            password: login.password.unwrap_or_default(),
            urls,
            notes: item.notes.clone(),
            totp: login.totp.clone(),
        };

        match vault.add_item("password", &item.name, Vec::new(), &payload) {
            Ok(_) => result.imported += 1,
            Err(e) => {
                result.errors.push(format!("{}: {}", item.name, e));
            }
        }
    }

    Ok(result)
}

// ─── Generic CSV Format ──────────────────────────────────────

#[derive(Debug, Deserialize)]
struct GenericCsvRow {
    #[serde(alias = "name", alias = "title", default)]
    name: String,
    #[serde(alias = "username", alias = "login_username", alias = "user", default)]
    username: String,
    #[serde(alias = "password", alias = "login_password", default)]
    password: String,
    #[serde(
        alias = "url",
        alias = "urls",
        alias = "website",
        alias = "login_url",
        default
    )]
    url: String,
    #[serde(alias = "notes", alias = "extra", default)]
    notes: String,
    #[serde(alias = "totp", alias = "otp", default)]
    totp: String,
}

fn import_csv(vault: &mut Vault, csv_data: &str) -> HemdalResult<ImportResult> {
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .flexible(true)
        .from_reader(csv_data.as_bytes());

    let mut result = ImportResult::new();

    for record in reader.deserialize::<GenericCsvRow>() {
        match record {
            Ok(row) => {
                result.total += 1;

                if row.name.trim().is_empty() {
                    result.skipped += 1;
                    continue;
                }

                let urls: Vec<String> = row
                    .url
                    .split(",")
                    .map(|u| u.trim().to_string())
                    .filter(|u| !u.is_empty())
                    .collect();

                let payload = ItemPayload::Password {
                    username: row.username,
                    password: row.password,
                    urls,
                    notes: if row.notes.trim().is_empty() {
                        None
                    } else {
                        Some(row.notes)
                    },
                    totp: if row.totp.trim().is_empty() {
                        None
                    } else {
                        Some(row.totp)
                    },
                };

                match vault.add_item("password", &row.name, Vec::new(), &payload) {
                    Ok(_) => result.imported += 1,
                    Err(e) => {
                        result.errors.push(format!("{}: {}", row.name, e));
                    }
                }
            }
            Err(e) => {
                result.errors.push(format!("CSV parse error: {}", e));
            }
        }
    }

    Ok(result)
}

// ─── 1Password CSV Format ────────────────────────────────────

#[derive(Debug, Deserialize)]
struct OnePasswordRow {
    title: String,
    #[serde(default)]
    username: String,
    #[serde(default)]
    password: String,
    #[serde(default)]
    url: String,
    #[serde(default)]
    notes: String,
    #[serde(default)]
    #[serde(rename = "one-time password")]
    totp: String,
}

fn import_1password_csv(vault: &mut Vault, csv_data: &str) -> HemdalResult<ImportResult> {
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .from_reader(csv_data.as_bytes());

    let mut result = ImportResult::new();

    for record in reader.deserialize::<OnePasswordRow>() {
        match record {
            Ok(row) => {
                result.total += 1;

                if row.title.trim().is_empty() {
                    result.skipped += 1;
                    continue;
                }

                let urls: Vec<String> = if row.url.trim().is_empty() {
                    Vec::new()
                } else {
                    vec![row.url]
                };

                let payload = ItemPayload::Password {
                    username: row.username,
                    password: row.password,
                    urls,
                    notes: if row.notes.trim().is_empty() {
                        None
                    } else {
                        Some(row.notes)
                    },
                    totp: if row.totp.trim().is_empty() {
                        None
                    } else {
                        Some(row.totp)
                    },
                };

                match vault.add_item("password", &row.title, Vec::new(), &payload) {
                    Ok(_) => result.imported += 1,
                    Err(e) => {
                        result.errors.push(format!("{}: {}", row.title, e));
                    }
                }
            }
            Err(e) => {
                result.errors.push(format!("CSV parse error: {}", e));
            }
        }
    }

    Ok(result)
}

// ─── Export ──────────────────────────────────────────────────

#[derive(Debug, Serialize)]
struct ExportItem {
    name: String,
    item_type: String,
    tags: Vec<String>,
    payload: serde_json::Value,
}

#[derive(Debug, Serialize)]
struct HemdalExport {
    version: u32,
    exported_at: i64,
    items: Vec<ExportItem>,
}

pub fn export_to_json(vault: &Vault) -> HemdalResult<String> {
    let items = vault.get_items(None)?;
    let mut export_items = Vec::new();

    for item in items {
        let payload_json = match &item.payload {
            ItemPayload::Password { .. } => serde_json::to_value(&item.payload).unwrap_or_default(),
            ItemPayload::ApiKey { .. } => serde_json::to_value(&item.payload).unwrap_or_default(),
            ItemPayload::Secret { .. } => serde_json::to_value(&item.payload).unwrap_or_default(),
            ItemPayload::EnvironmentVariable { .. } => {
                serde_json::to_value(&item.payload).unwrap_or_default()
            }
            ItemPayload::Note { .. } => serde_json::to_value(&item.payload).unwrap_or_default(),
            ItemPayload::SshKey { .. } => serde_json::to_value(&item.payload).unwrap_or_default(),
            ItemPayload::CreditCard { .. } => {
                serde_json::to_value(&item.payload).unwrap_or_default()
            }
        };

        export_items.push(ExportItem {
            name: item.name,
            item_type: item.item_type,
            tags: item.tags,
            payload: payload_json,
        });
    }

    let export = HemdalExport {
        version: 1,
        exported_at: chrono::Utc::now().timestamp(),
        items: export_items,
    };

    Ok(serde_json::to_string_pretty(&export)?)
}

pub fn export_passwords_to_csv(vault: &Vault) -> HemdalResult<String> {
    let items = vault.get_items(Some("password"))?;

    let mut wtr = csv::WriterBuilder::new().from_writer(Vec::new());

    wtr.write_record(["name", "username", "password", "url", "notes", "totp"])
        .map_err(|e| HemdalError::IoError(std::io::Error::new(std::io::ErrorKind::Other, e)))?;

    for item in items {
        if let ItemPayload::Password {
            username,
            password,
            urls,
            notes,
            totp,
        } = &item.payload
        {
            wtr.write_record([
                &item.name,
                username,
                password,
                &urls.join(", "),
                &notes.clone().unwrap_or_default(),
                &totp.clone().unwrap_or_default(),
            ])
            .map_err(|e| HemdalError::IoError(std::io::Error::new(std::io::ErrorKind::Other, e)))?;
        }
    }

    let data = wtr
        .into_inner()
        .map_err(|e| HemdalError::IoError(std::io::Error::new(std::io::ErrorKind::Other, e)))?;

    Ok(String::from_utf8(data).unwrap_or_default())
}

// ─── Public API ──────────────────────────────────────────────

pub fn import_from_format(
    vault: &mut Vault,
    format: &str,
    data: &str,
) -> HemdalResult<ImportResult> {
    match format {
        "bitwarden" => import_bitwarden_json(vault, data),
        "csv" => import_csv(vault, data),
        "1password" => import_1password_csv(vault, data),
        _ => Err(HemdalError::InvalidItemType(format!(
            "Unsupported import format: {}",
            format
        ))),
    }
}
