export interface VaultItem {
  id: string;
  type: VaultItemType;
  name: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  favorite: boolean;
  encryptedData: EncryptedBlob;
}

export type VaultItemType =
  | 'password'
  | 'api-key'
  | 'secret'
  | 'environment-variable'
  | 'note'
  | 'ssh-key'
  | 'credit-card';

export interface EncryptedBlob {
  ciphertext: string; // base64
  nonce: string; // base64
  tag: string; // base64
}

export interface PasswordPayload {
  username: string;
  password: string;
  urls: string[];
  notes?: string;
  totp?: string;
}

export interface ApiKeyPayload {
  key: string;
  endpoint?: string;
  headers?: Record<string, string>;
  notes?: string;
}

export interface SecretPayload {
  value: string;
  notes?: string;
}

export interface EnvironmentVariablePayload {
  key: string;
  value: string;
  project?: string;
  notes?: string;
}

export type ItemPayload =
  | PasswordPayload
  | ApiKeyPayload
  | SecretPayload
  | EnvironmentVariablePayload;

export interface VaultMetadata {
  version: number;
  itemCount: number;
  lastSyncAt?: number;
  deviceId: string;
}

export interface MasterKey {
  salt: string; // base64
  verifier: string; // base64 - used to verify password without storing it
}
