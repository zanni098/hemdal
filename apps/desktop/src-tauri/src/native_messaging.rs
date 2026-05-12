use std::io::{self, Read, Write};

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::error::HemdalResult;
use crate::vault::Vault;

/// A message from the browser extension.
#[derive(Debug, Deserialize)]
#[serde(tag = "action")]
pub enum ExtensionMessage {
    #[serde(rename = "get-credentials")]
    GetCredentials { url: String },
    #[serde(rename = "ping")]
    Ping,
}

/// Response sent back to the browser extension.
#[derive(Debug, Serialize)]
pub struct ExtensionResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

impl ExtensionResponse {
    pub fn ok(data: impl Serialize) -> Self {
        Self {
            success: true,
            data: serde_json::to_value(data).ok(),
            error: None,
        }
    }

    pub fn err(error: impl ToString) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(error.to_string()),
        }
    }
}

/// Reads a length-prefixed JSON message from stdin.
fn read_message() -> io::Result<Option<ExtensionMessage>> {
    let mut len_bytes = [0u8; 4];
    match io::stdin().read_exact(&mut len_bytes) {
        Ok(()) => {}
        Err(e) if e.kind() == io::ErrorKind::UnexpectedEof => return Ok(None),
        Err(e) => return Err(e),
    }

    let len = u32::from_le_bytes(len_bytes) as usize;
    let mut buffer = vec![0u8; len];
    io::stdin().read_exact(&mut buffer)?;

    let msg: ExtensionMessage = serde_json::from_slice(&buffer)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;

    Ok(Some(msg))
}

/// Writes a length-prefixed JSON message to stdout.
fn write_message(response: &ExtensionResponse) -> io::Result<()> {
    let json = serde_json::to_vec(response)?;
    let len = json.len() as u32;
    io::stdout().write_all(&len.to_le_bytes())?;
    io::stdout().write_all(&json)?;
    io::stdout().flush()?;
    Ok(())
}

/// Runs the native messaging host loop.
/// This reads messages from stdin and responds on stdout.
pub fn run_native_messaging_host(vault: &Vault) -> io::Result<()> {
    loop {
        let msg = match read_message()? {
            Some(m) => m,
            None => break, // EOF
        };

        let response = match msg {
            ExtensionMessage::Ping => ExtensionResponse::ok("pong"),
            ExtensionMessage::GetCredentials { url } => {
                match vault.get_credentials_for_url(&url) {
                    Ok(items) => {
                        let credentials: Vec<_> = items
                            .into_iter()
                            .filter_map(|item| {
                                if let crate::vault::ItemPayload::Password {
                                    username,
                                    password,
                                    urls,
                                    ..
                                } = item.payload
                                {
                                    Some(serde_json::json!({
                                        "id": item.id,
                                        "name": item.name,
                                        "username": username,
                                        "password": password,
                                        "urls": urls,
                                    }))
                                } else {
                                    None
                                }
                            })
                            .collect();
                        ExtensionResponse::ok(credentials)
                    }
                    Err(e) => ExtensionResponse::err(e),
                }
            }
        };

        write_message(&response)?;
    }

    Ok(())
}
