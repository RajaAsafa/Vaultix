/**
 * Key Derivation Function (KDF) & Salt Management
 * Derives a 256-bit Key Encryption Key (KEK) from Master Password.
 */

export interface KdfConfig {
  algorithm: string;
  iterations: number;
  saltLength: number;
  keyLength: number; // in bytes (32 bytes = 256 bits)
}

export const DEFAULT_KDF_CONFIG: KdfConfig = {
  algorithm: 'PBKDF2-SHA256', // Native WebCrypto supported across all environments
  iterations: 600_000,        // OWASP recommended iteration count
  saltLength: 32,             // 256-bit salt
  keyLength: 32,              // 256-bit key for AES-256
};

/**
 * Generates cryptographically secure random bytes.
 */
export function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    throw new Error('CSPRNG is not available in environment');
  }
  return bytes;
}

/**
 * Derives a 32-byte Key Encryption Key (KEK) from Master Password and Salt.
 */
export async function deriveKeyEncryptionKey(
  masterPassword: string,
  salt: Uint8Array,
  iterations: number = DEFAULT_KDF_CONFIG.iterations
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(masterPassword);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: iterations,
      hash: 'SHA-256',
    },
    baseKey,
    256 // 256 bits = 32 bytes
  );

  return new Uint8Array(derivedBits);
}

/**
 * Generates a fresh random 256-bit (32-byte) Vault Encryption Key (VEK).
 */
export function generateVaultEncryptionKey(): Uint8Array {
  return generateRandomBytes(32);
}
