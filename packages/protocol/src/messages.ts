import type { SyncMessage, SyncMessageType, SyncDelta } from '@hemdal/types';

export function createSyncMessage(
  type: SyncMessageType,
  fromDeviceId: string,
  payload: unknown
): SyncMessage {
  return {
    type,
    payload,
    timestamp: Date.now(),
    fromDeviceId,
  };
}

export function serializeSyncMessage(msg: SyncMessage): string {
  return JSON.stringify(msg);
}

export function deserializeSyncMessage(data: string): SyncMessage {
  return JSON.parse(data) as SyncMessage;
}

export function createDeltaMessage(
  fromDeviceId: string,
  delta: SyncDelta
): SyncMessage {
  return createSyncMessage('vault-delta', fromDeviceId, delta);
}
