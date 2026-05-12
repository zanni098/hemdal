import { arrayBufferToBase64 } from './encoding.js';

export interface DerivedKeyResult {
  key: string; // base64-encoded derived key
  salt: string; // base64-encoded salt
}

/**
 * Generates a random salt for key derivation.
 * In production, the actual Argon2id hashing is done in Rust.
 */
export function generateSalt(length = 32): string {
  const salt = crypto.getRandomValues(new Uint8Array(length));
  return arrayBufferToBase64(salt.buffer);
}

/**
 * Generates a high-entropy random passphrase for vault recovery.
 */
export function generateRecoveryPhrase(wordCount = 12): string {
  // Simple BIP39-like generation using wordlist would go here
  // For MVP, generate random hex chunks
  const parts: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const bytes = crypto.getRandomValues(new Uint8Array(2));
    parts.push(bytes[0].toString(16).padStart(2, '0') + bytes[1].toString(16).padStart(2, '0'));
  }
  return parts.join('-');
}
