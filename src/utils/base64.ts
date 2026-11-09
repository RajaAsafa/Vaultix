/**
 * Pure TypeScript Base64 <-> Uint8Array utilities
 * Avoids Node.js Buffer dependency in React Native
 */

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let base64 = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;

    base64 += chars.charAt(b0 >> 2);
    base64 += chars.charAt(((b0 & 3) << 4) | (b1 >> 4));
    base64 += i + 1 < len ? chars.charAt(((b1 & 15) << 2) | (b2 >> 6)) : '=';
    base64 += i + 2 < len ? chars.charAt(b2 & 63) : '=';
  }
  return base64;
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/=+$/, '');
  const len = clean.length;
  const bytesLen = Math.floor((len * 3) / 4);
  const bytes = new Uint8Array(bytesLen);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const c0 = chars.indexOf(clean.charAt(i));
    const c1 = chars.indexOf(clean.charAt(i + 1));
    const c2 = i + 2 < len ? chars.indexOf(clean.charAt(i + 2)) : 64;
    const c3 = i + 3 < len ? chars.indexOf(clean.charAt(i + 3)) : 64;

    const b0 = (c0 << 2) | (c1 >> 4);
    bytes[p++] = b0;

    if (c2 !== 64 && p < bytesLen) {
      const b1 = ((c1 & 15) << 4) | (c2 >> 2);
      bytes[p++] = b1;
    }
    if (c3 !== 64 && p < bytesLen) {
      const b2 = ((c2 & 3) << 6) | c3;
      bytes[p++] = b2;
    }
  }

  return bytes;
}
