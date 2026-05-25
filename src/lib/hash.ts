/**
 * FNV-1a Hash Utilities for Sims 4 Modding
 */

/**
 * FNV-1a 64-bit hash
 */
export function fnv64(name: string): bigint {
  const OFFSET_BASIS = 14695981039346656037n;
  const PRIME = 1099511628211n;
  const MASK = (1n << 64n) - 1n;

  let hash = OFFSET_BASIS;
  const encoder = new TextEncoder();
  const data = encoder.encode(name.toLowerCase());

  for (const byte of data) {
    hash ^= BigInt(byte);
    hash = (hash * PRIME) & MASK;
  }

  return hash;
}

/**
 * FNV-1a 32-bit hash
 */
export function fnv32(str: string): number {
  const OFFSET_BASIS = 2166136261;
  const PRIME = 16777619;

  let hash = OFFSET_BASIS;
  const encoder = new TextEncoder();
  const data = encoder.encode(str.toLowerCase());

  for (const byte of data) {
    hash ^= byte;
    hash = Math.imul(hash, PRIME) >>> 0;
  }

  return hash;
}

/**
 * Splits fnv64 result into high and low 32-bit numbers for DBPF
 */
export function instanceIdFromName(name: string): { high: number; low: number } {
  const hash = fnv64(name);
  const high = Number(hash >> 32n) >>> 0;
  const low = Number(hash & 0xFFFFFFFFn) >>> 0;
  return { high, low };
}

/**
 * STBL key from string (FNV32)
 */
export function stblKeyFromString(str: string): number {
  return fnv32(str);
}

// Development self-test
if ((import.meta as any).env?.DEV) {
  console.log('FNV Test - "Night Owl":', {
    fnv32: fnv32("Night Owl").toString(16),
    fnv64: fnv64("Night Owl").toString(16),
  });
}
