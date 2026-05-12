use std::net::SocketAddr;
use std::sync::{Arc, Mutex};

use axum::{
    Router,
    extract::{Query, State},
    http::StatusCode,
    response::Json,
    routing::get,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};

use crate::error::HemdalResult;
use crate::vault::Vault;

#[derive(Clone)]
pub struct ApiState {
    pub vault: Arc<Mutex<Vault>>,
}

#[derive(Deserialize)]
struct CredentialsQuery {
    url: String,
}

#[derive(Serialize)]
struct CredentialMatch {
    id: String,
    name: String,
    username: String,
    password: String,
    urls: Vec<String>,
}

#[derive(Serialize)]
struct ApiResponse<T> {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

async fn get_credentials(
    State(state): State<ApiState>,
    Query(query): Query<CredentialsQuery>,
) -> Json<ApiResponse<Vec<CredentialMatch>>> {
    let vault = match state.vault.lock() {
        Ok(v) => v,
        Err(_) => {
            return Json(ApiResponse {
                success: false,
                data: None,
                error: Some("Failed to lock vault".to_string()),
            });
        }
    };

    if !vault.is_unlocked() {
        return Json(ApiResponse {
            success: false,
            data: None,
            error: Some("Vault is locked".to_string()),
        });
    }

    match vault.get_credentials_for_url(&query.url) {
        Ok(items) => {
            let credentials: Vec<CredentialMatch> = items
                .into_iter()
                .filter_map(|item| {
                    if let crate::vault::ItemPayload::Password {
                        username,
                        password,
                        urls,
                        ..
                    } = item.payload
                    {
                        Some(CredentialMatch {
                            id: item.id,
                            name: item.name,
                            username,
                            password,
                            urls,
                        })
                    } else {
                        None
                    }
                })
                .collect();
            Json(ApiResponse {
                success: true,
                data: Some(credentials),
                error: None,
            })
        }
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

async fn health_check(State(state): State<ApiState>) -> Json<ApiResponse<Value>> {
    let vault = match state.vault.lock() {
        Ok(v) => v,
        Err(_) => {
            return Json(ApiResponse {
                success: false,
                data: None,
                error: Some("Failed to lock vault".to_string()),
            });
        }
    };

    Json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "initialized": vault.is_initialized(),
            "unlocked": vault.is_unlocked(),
        })),
        error: None,
    })
}

/// Starts a local HTTP API server for the browser extension.
/// Tries the requested port first, falls back to a random port if unavailable.
pub async fn start_http_server(port: u16, vault: Arc<Mutex<Vault>>) -> HemdalResult<u16> {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/credentials", get(get_credentials))
        .layer(cors)
        .with_state(ApiState { vault });

    // Try requested port first, fall back to random port
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    let listener = match TcpListener::bind(addr).await {
        Ok(l) => l,
        Err(_) => {
            let fallback = SocketAddr::from(([127, 0, 0, 1], 0));
            TcpListener::bind(fallback).await?
        }
    };
    let actual_port = listener.local_addr()?.port();

    tokio::spawn(async move {
        if let Err(e) = axum::serve(listener, app).await {
            eprintln!("HTTP API server error: {}", e);
        }
    });

    Ok(actual_port)
}
