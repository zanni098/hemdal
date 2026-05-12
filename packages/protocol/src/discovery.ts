/**
 * Device discovery helpers for local-network P2P sync.
 *
 * The actual mDNS/Bonjour discovery is handled by the Rust backend.
 * These utilities format/parse discovery payloads.
 */

export interface DiscoveryPayload {
  deviceId: string;
  deviceName: string;
  publicKeyFingerprint: string;
  servicePort: number;
  protocolVersion: number;
}

export function serializeDiscoveryPayload(payload: DiscoveryPayload): string {
  return JSON.stringify(payload);
}

export function parseDiscoveryPayload(data: string): DiscoveryPayload {
  const parsed = JSON.parse(data);
  if (typeof parsed.deviceId !== 'string') {
    throw new Error('Invalid discovery payload: missing deviceId');
  }
  return parsed as DiscoveryPayload;
}

export const HEMDAL_SERVICE_TYPE = '_hemdal._tcp.local';
