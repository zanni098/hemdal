use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::error::HemdalResult;

/// Represents a discovered peer device on the local network.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerDevice {
    pub device_id: String,
    pub name: String,
    pub public_key_fingerprint: String,
    pub address: String,
    pub port: u16,
    pub last_seen: i64,
    pub trusted: bool,
}

/// Manages peer discovery and P2P sync sessions.
pub struct SyncManager {
    pub local_device_id: String,
    pub local_name: String,
    pub peers: HashMap<String, PeerDevice>,
    pub enabled: bool,
}

impl SyncManager {
    pub fn new(device_id: String, name: String) -> Self {
        Self {
            local_device_id: device_id,
            local_name: name,
            peers: HashMap::new(),
            enabled: false,
        }
    }

    pub fn enable(&mut self) {
        self.enabled = true;
        // TODO: Start mDNS discovery and listener
    }

    pub fn disable(&mut self) {
        self.enabled = false;
        // TODO: Stop mDNS discovery and listener
    }

    pub fn discover_peers(&self) -> HemdalResult<Vec<PeerDevice>> {
        // TODO: Implement mDNS discovery
        Ok(self.peers.values().cloned().collect())
    }

    pub fn trust_device(&mut self, device_id: &str) -> HemdalResult<()> {
        if let Some(peer) = self.peers.get_mut(device_id) {
            peer.trusted = true;
        }
        Ok(())
    }

    pub fn untrust_device(&mut self, device_id: &str) -> HemdalResult<()> {
        if let Some(peer) = self.peers.get_mut(device_id) {
            peer.trusted = false;
        }
        Ok(())
    }
}
