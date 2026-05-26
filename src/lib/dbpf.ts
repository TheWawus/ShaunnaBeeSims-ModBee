import pako from 'pako';
import { Package, XmlResource, StringTableResource, RawResource } from '@s4tk/models';
import { TuningResourceType, StringTableLocale } from '@s4tk/models/enums';
import { DBPFResource } from '../types';

/**
 * FNV-1a 32-bit hash, used for TS4 instance IDs and STBL keys.
 */
export function fnv32(s: string): number {
  const FNV_PRIME = 0x01000193;
  const OFFSET_BASIS = 0x811C9DC5;
  let h = OFFSET_BASIS;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(s.toLowerCase());
  for (const byte of bytes) {
    h ^= byte;
    h = Math.imul(h, FNV_PRIME);
  }
  return h >>> 0;
}

/**
 * FNV-1a 64-bit hash, used for group IDs and some instance types.
 */
export function fnv64(s: string): bigint {
  const FNV_PRIME = 0x00000100000001B3n;
  const OFFSET_BASIS = 0xCBF29CE484222325n;
  let h = OFFSET_BASIS;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(s.toLowerCase());
  for (const byte of bytes) {
    h ^= BigInt(byte);
    h = (h * FNV_PRIME) & 0xFFFFFFFFFFFFFFFFn;
  }
  return h;
}

/**
 * Creates a String Table (STBL) binary resource using @s4tk/models.
 */
export function createStbl(strings: Record<number, string>): Uint8Array {
  const stbl = new StringTableResource();
  Object.entries(strings).forEach(([key, value]) => {
    stbl.add(parseInt(key) >>> 0, value);
  });
  return new Uint8Array(stbl.getBuffer());
}

/**
 * Writes valid .package files for The Sims 4 (DBPF 2.1) using @s4tk/models.
 */
export function buildPackage(resources: DBPFResource[]): Uint8Array {
  const pkg = new Package();
  
  resources.forEach(res => {
    pkg.add({
      type: res.typeId,
      group: res.groupId,
      instance: res.instanceId
    }, RawResource.from(Buffer.from(res.data)));
  });

  return new Uint8Array(pkg.getBuffer());
}

export function parsePackage(buffer: ArrayBuffer): DBPFResource[] {
  try {
    const pkg = Package.from(Buffer.from(buffer));
    return pkg.entries.map(entry => ({
      typeId: entry.key.type,
      groupId: entry.key.group,
      instanceId: entry.key.instance,
      data: new Uint8Array(entry.value.getBuffer())
    }));
  } catch (err) {
    console.error('DBPF Parse Error:', err);
    throw err;
  }
}

/**
 * Parses a String Table (STBL) resource using @s4tk/models.
 */
export function parseStbl(bytes: Uint8Array): { keyHash: number, value: string }[] {
  try {
    const stbl = StringTableResource.from(Buffer.from(bytes));
    return stbl.entries.map(entry => ({
      keyHash: entry.key,
      value: entry.value
    }));
  } catch (e) {
    console.error('STBL Parse Error:', e);
    return [];
  }
}


export function downloadPackage(data: Uint8Array, filename: string): void {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.package') ? filename : `${filename}.package`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
