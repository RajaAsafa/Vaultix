/**
 * Cryptographically Secure Password Generator & Strength Analyzer
 * Based on PRD FR-06 & FR-07
 */

import { PasswordStrengthLevel, PasswordStrengthResult } from '../types';

export interface GeneratorOptions {
  length: number; // 8 - 64
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean;
}

export const DEFAULT_GENERATOR_OPTIONS: GeneratorOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeAmbiguous: false,
};

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

const AMBIGUOUS_CHARS = new Set(['O', '0', 'I', 'l', '1', '|', 'B', '8', '`', '\'', '"']);

/**
 * Generates a cryptographically random password matching user options.
 */
export function generatePassword(options: GeneratorOptions = DEFAULT_GENERATOR_OPTIONS): string {
  let charPool = '';
  const guaranteedChars: string[] = [];

  const filterAmbiguous = (chars: string) => {
    if (!options.excludeAmbiguous) return chars;
    return chars.split('').filter((c) => !AMBIGUOUS_CHARS.has(c)).join('');
  };

  const poolUpper = filterAmbiguous(UPPERCASE_CHARS);
  const poolLower = filterAmbiguous(LOWERCASE_CHARS);
  const poolNum = filterAmbiguous(NUMBER_CHARS);
  const poolSym = filterAmbiguous(SYMBOL_CHARS);

  if (options.includeUppercase && poolUpper.length > 0) {
    charPool += poolUpper;
    guaranteedChars.push(getRandomChar(poolUpper));
  }
  if (options.includeLowercase && poolLower.length > 0) {
    charPool += poolLower;
    guaranteedChars.push(getRandomChar(poolLower));
  }
  if (options.includeNumbers && poolNum.length > 0) {
    charPool += poolNum;
    guaranteedChars.push(getRandomChar(poolNum));
  }
  if (options.includeSymbols && poolSym.length > 0) {
    charPool += poolSym;
    guaranteedChars.push(getRandomChar(poolSym));
  }

  if (charPool.length === 0) {
    charPool = poolLower; // Fallback
    guaranteedChars.push(getRandomChar(poolLower));
  }

  const length = Math.max(8, Math.min(64, options.length));
  const remainingCount = length - guaranteedChars.length;
  const resultChars: string[] = [...guaranteedChars];

  const randomBytes = new Uint8Array(remainingCount);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    throw new Error('CSPRNG not available');
  }

  for (let i = 0; i < remainingCount; i++) {
    const randomIndex = randomBytes[i] % charPool.length;
    resultChars.push(charPool[randomIndex]);
  }

  // Cryptographically shuffle characters (Fisher-Yates)
  return shuffleArray(resultChars).join('');
}

function getRandomChar(str: string): string {
  const bytes = new Uint8Array(1);
  crypto.getRandomValues(bytes);
  return str[bytes[0] % str.length];
}

function shuffleArray(array: string[]): string[] {
  const bytes = new Uint8Array(array.length);
  crypto.getRandomValues(bytes);
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = bytes[i] % (i + 1);
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

/**
 * Analyzes password strength locally without sending data externally.
 * Evaluates length, character diversity, and repetitions.
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  if (!password || password.length === 0) {
    return { score: 0, level: 'Weak', feedback: ['Password tidak boleh kosong'] };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length scoring
  if (password.length >= 16) {
    score += 2;
  } else if (password.length >= 12) {
    score += 1.5;
  } else if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Gunakan minimal 8 karakter (disarankan 16+)');
  }

  // Diversity checks
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  const diversityCount = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  if (diversityCount === 4) {
    score += 1.5;
  } else if (diversityCount === 3) {
    score += 1;
  } else if (diversityCount <= 2) {
    feedback.push('Kombinasikan huruf besar, kecil, angka, dan simbol');
  }

  // Repetition penalty
  if (/(.)\1{2,}/.test(password)) {
    score -= 0.5;
    feedback.push('Hindari pengulangan karakter berturut-turut');
  }

  // Common simple patterns
  if (/^[a-zA-Z]+$/.test(password) || /^[0-9]+$/.test(password)) {
    score -= 0.5;
    feedback.push('Hindari hanya menggunakan satu jenis karakter');
  }

  score = Math.max(0, Math.min(4, Math.round(score)));

  let level: PasswordStrengthLevel = 'Weak';
  if (score >= 4) {
    level = 'Very Strong';
  } else if (score === 3) {
    level = 'Strong';
  } else if (score === 2) {
    level = 'Medium';
  } else {
    level = 'Weak';
  }

  return { score, level, feedback };
}
