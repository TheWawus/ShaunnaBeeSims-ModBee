import { STBLEntry } from '../../types';
import { fnv64 } from '../hash';

/**
 * Writes STBL binary string table.
 */
export function generateSTBL(entries: STBLEntry[]): Uint8Array {
  // Calculate string data length
  const encoder = new TextEncoder();
  let stringDataLength = 0;
  const encodedStrings = entries.map(entry => {
    const encoded = encoder.encode(entry.value);
    stringDataLength += 2 + encoded.length; // 2 bytes for length prefix
    return encoded;
  });

  const entryCount = BigInt(entries.length);
  const headerSize = 21;
  const entrySize = 5; // key(4) + flags(1)
  const totalSize = headerSize + entries.length * entrySize + stringDataLength;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // Magic "STBL"
  view.setUint8(0, 0x53); // S
  view.setUint8(1, 0x54); // T
  view.setUint8(2, 0x42); // B
  view.setUint8(3, 0x4C); // L

  view.setUint16(4, 5, true); // Version 5
  view.setUint8(6, 0); // Compressed (0 = no)
  
  // Entry count (uint64 LE)
  view.setUint32(7, Number(entryCount & 0xFFFFFFFFn), true);
  view.setUint32(11, Number(entryCount >> 32n), true);

  view.setUint16(15, 0, true); // Reserved
  view.setUint32(17, stringDataLength, true);

  // Entries and Strings are interleaved in STBL v5
  let currentOffset = headerSize;

  entries.forEach((entry, i) => {
    // Key
    view.setUint32(currentOffset, entry.key, true);
    // Flags
    view.setUint8(currentOffset + 4, 0);
    // Length
    const encoded = encodedStrings[i];
    view.setUint16(currentOffset + 5, encoded.length, true);
    // String data
    new Uint8Array(buffer, currentOffset + 7, encoded.length).set(encoded);
    
    currentOffset += 7 + encoded.length;
  });

  return new Uint8Array(buffer);
}

/**
 * Helper to create an STBL resource from a key-value record.
 */
export function createSTBLResource(strings: Record<string, string>): { entries: STBLEntry[] } {
  const entries: STBLEntry[] = Object.entries(strings).map(([key, value]) => ({
    key: parseInt(key, 10),
    value
  }));
  return { entries };
}

/**
 * Generates an STBL instance ID based on mod name.
 * Often en-US is 0x07...
 */
export function stblInstanceId(modName: string): bigint {
  const hash = fnv64(`${modName}:en-US`);
  // TS4 STBLs usually start with 0x07 for English
  return (hash & 0x00FFFFFFFFFFFFFFn) | 0x0700000000000000n;
}
