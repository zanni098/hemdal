export interface SyncDevice {
  deviceId: string;
  name: string;
  publicKey: string; // base64
  lastSeenAt: number;
  trusted: boolean;
}

export interface SyncMessage {
  type: SyncMessageType;
  payload: unknown;
  timestamp: number;
  fromDeviceId: string;
}

export type SyncMessageType =
  | 'device-announce'
  | 'sync-request'
  | 'sync-response'
  | 'vault-delta'
  | 'trust-request'
  | 'trust-response';

export interface SyncDelta {
  itemsAdded: string[]; // item IDs
  itemsUpdated: string[];
  itemsDeleted: string[];
  vaultVersion: number;
}

export interface P2PSession {
  sessionId: string;
  peerDeviceId: string;
  establishedAt: number;
  encrypted: boolean;
}
