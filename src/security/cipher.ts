/**
 * AES-256-GCM Cipher Module
 * Formats: Pure binary BLOB [12B IV][16B Auth Tag][Ciphertext]
 * Uses @noble/ciphers/aes for robust, cross-platform AEAD without WebCrypto runtime dependency.
 */

import { gcm } from '@noble/ciphers/aes.js';
import { generateRandomBytes } from './kdf';

const IV_LENGTH = 12; // 96 bits recommended for AES-GCM
const TAG_LENGTH = 16; // 128 bits authentication tag

/**
 * Packs IV, Tag, and Ciphertext into a single contiguous Uint8Array.
 */
export function packCipherBlob(iv: Uint8Array, tag: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  const packed = new Uint8Array(IV_LENGTH + TAG_LENGTH + ciphertext.length);
  packed.set(iv, 0);
  packed.set(tag, IV_LENGTH);
  packed.set(ciphertext, IV_LENGTH + TAG_LENGTH);
  return packed;
}

/**
 * Unpacks a contiguous Uint8Array into IV, Tag, and Ciphertext.
 */
export function unpackCipherBlob(packed: Uint8Array): {
  iv: Uint8Array;
  tag: Uint8Array;
  ciphertext: Uint8Array;
} {
  if (packed.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error('Invalid cipher blob: length is too short');
  }

  const iv = packed.slice(0, IV_LENGTH);
  const tag = packed.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = packed.slice(IV_LENGTH + TAG_LENGTH);

  return { iv, tag, ciphertext };
}

/**
 * Encrypts a UTF-8 plaintext string using AES-256-GCM with a given 32-byte key.
 * Generates a unique cryptographically random 12-byte IV for each operation.
 * Returns the packed binary BLOB [IV][Tag][Ciphertext].
 */
export async function encryptAesGcm(
  plaintext: string,
  keyBytes: Uint8Array
): Promise<Uint8Array> {
  if (keyBytes.length !== 32) {
    throw new Error('Invalid key length: AES-256 requires a 32-byte key');
  }

  // 12-byte cryptographically secure random IV from native Android SecureRandom
  const iv = generateRandomBytes(IV_LENGTH);

  const cipher = gcm(keyBytes, iv);
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // gcm.encrypt appends the 16-byte tag to the ciphertext
  const encrypted = cipher.encrypt(data);

  const ciphertext = encrypted.slice(0, encrypted.length - TAG_LENGTH);
  const tag = encrypted.slice(encrypted.length - TAG_LENGTH);

  return packCipherBlob(iv, tag, ciphertext);
}

/**
 * Decrypts a packed binary BLOB [IV][Tag][Ciphertext] using AES-256-GCM.
 * Validates the authentication tag. Throws error if tag does not match (tampered/wrong key).
 */
export async function decryptAesGcm(
  packedBlob: Uint8Array,
  keyBytes: Uint8Array
): Promise<string> {
  if (keyBytes.length !== 32) {
    throw new Error('Invalid key length: AES-256 requires a 32-byte key');
  }

  const { iv, tag, ciphertext } = unpackCipherBlob(packedBlob);

  // Combine [ciphertext + tag] for @noble/ciphers/aes decrypt
  const combined = new Uint8Array(ciphertext.length + TAG_LENGTH);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.length);

  const decipher = gcm(keyBytes, iv);
  const decryptedBytes = decipher.decrypt(combined);

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBytes);
}
