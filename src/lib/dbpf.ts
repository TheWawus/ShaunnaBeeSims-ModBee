import pako from 'pako';
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
 * Creates a String Table (STBL) binary resource (TS4 standard interleaved).
 */
export function createStbl(strings: Record<number, string>): Uint8Array {
  const headerSize = 21;
  const encoder = new TextEncoder();
  
  const entries: { key: number, data: Uint8Array }[] = [];
  let totalDataSize = 0;
  
  Object.entries(strings).forEach(([key, value]) => {
    const keyNum = parseInt(key) >>> 0;
    const data = encoder.encode(value);
    entries.push({ key: keyNum, data });
    // Interleaved: Key(4) + Flags(1) + Len(2) + Data
    totalDataSize += 7 + data.length;
  });

  const buffer = new ArrayBuffer(headerSize + totalDataSize);
  const view = new DataView(buffer);
  
  // STBL Header
  view.setUint8(0, 0x53); // S
  view.setUint8(1, 0x54); // T
  view.setUint8(2, 0x42); // B
  view.setUint8(3, 0x4C); // L
  view.setUint16(4, 5, true); // Version 5
  view.setUint8(6, 0); // Not compressed
  
  // Count (uint64 LE) - TS4 expects 8 bytes
  view.setUint32(7, entries.length, true);
  view.setUint32(11, 0, true); 

  view.setUint16(15, 0, true); // Reserved
  view.setUint32(17, totalDataSize, true); // Total Data Length

  let offset = headerSize;
  entries.forEach(entry => {
    view.setUint32(offset, entry.key, true);
    view.setUint8(offset + 4, 0); // Flags
    view.setUint16(offset + 5, entry.data.length, true);
    new Uint8Array(buffer, offset + 7, entry.data.length).set(entry.data);
    offset += 7 + entry.data.length;
  });

  return new Uint8Array(buffer);
}

/**
 * Writes valid .package files for The Sims 4 (DBPF 2.1).
 */
export function buildPackage(resources: DBPFResource[]): Uint8Array {
  const headerSize = 96;
  const indexEntrySize = 32;

  // Prepare compressed data
  const processedResources = resources.map(res => {
    const xmlTypes = [0x6017E896, 0x0C772E27, 0xE882D22F, 0xCB5FDDC7, 0x339BC5BD];
    const isTuning = xmlTypes.includes(res.typeId);
    const isStbl = res.typeId === 0x220557DA;
    
    let data = res.data;
    let compressed = false;
    let originalSize = data.length;

    if (isTuning || isStbl) {
      try {
        data = pako.deflate(data);
        compressed = true;
      } catch (e) {
        console.warn('Failed to compress resource', e);
      }
    }

    return {
      ...res,
      processedData: data,
      originalSize,
      compressed
    };
  });

  const dataOffset = headerSize;
  const dataSize = processedResources.reduce((acc, res) => acc + res.processedData.length, 0);
  const indexOffset = dataOffset + dataSize;
  const totalSize = indexOffset + (processedResources.length * indexEntrySize) + 4; // +4 for index flags

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // Header
  view.setUint8(0, 0x44); view.setUint8(1, 0x42); view.setUint8(2, 0x50); view.setUint8(3, 0x46); // DBPF
  view.setUint32(4, 2, true); // Major 2
  view.setUint32(8, 1, true); // Minor 1
  
  view.setUint32(36, processedResources.length, true); // Index count
  view.setUint32(60, 3, true); // Index version (typically 3)
  view.setUint32(64, indexOffset, true); // Index offset

  // Write Index Flags
  view.setUint32(indexOffset, 0, true); // flags=0, no constants

  // Write Data & Index Entries
  let currentOffset = dataOffset;
  processedResources.forEach((res, i) => {
    const data = res.processedData;
    new Uint8Array(buffer, currentOffset, data.length).set(data);

    const indexPos = indexOffset + 4 + (i * indexEntrySize);
    view.setUint32(indexPos, res.typeId, true);
    view.setUint32(indexPos + 4, res.groupId, true);
    
    view.setUint32(indexPos + 8, Number(res.instanceId >> 32n), true);
    view.setUint32(indexPos + 12, Number(res.instanceId & 0xFFFFFFFFn), true);
    
    view.setUint32(indexPos + 16, currentOffset, true); // Offset
    view.setUint32(indexPos + 20, (res.processedData.length | (res.compressed ? 0x80000000 : 0)) >>> 0, true); // Size + Compressed flag
    view.setUint32(indexPos + 24, res.originalSize, true); // Original size
    view.setUint16(indexPos + 28, res.compressed ? 0x5A42 : 0, true); // Compression type
    view.setUint16(indexPos + 30, 1, true); // Committed

    currentOffset += data.length;
  });

  return new Uint8Array(buffer);
}

export function parsePackage(buffer: ArrayBuffer): DBPFResource[] {
  try {
    const view = new DataView(buffer);
    const totalSize = buffer.byteLength;
    const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    
    if (magic !== 'DBPF') throw new Error('Not a valid DBPF file');

    // TS4 DBPF 2.1 Header
    // Offset 36: Index count
    // Offset 64: Index offset
    const indexCount = view.getUint32(36, true);
    const indexOffset = view.getUint32(64, true);
    
    console.log(`Parsing DBPF 2.1: Count=${indexCount}, IndexOffset=${indexOffset}`);

    if (indexOffset === 0 || indexOffset >= totalSize) {
      throw new Error(`Invalid index offset ${indexOffset}`);
    }

    // First 4 bytes of index table are flags
    const indexFlags = view.getUint32(indexOffset, true);
    let currentPos = indexOffset + 4;

    let constantType: number | null = null;
    let constantGroup: number | null = null;
    let constantInstanceHi: number | null = null;

    if (indexFlags & 0x01) { constantType = view.getUint32(currentPos, true); currentPos += 4; }
    if (indexFlags & 0x02) { constantGroup = view.getUint32(currentPos, true); currentPos += 4; }
    if (indexFlags & 0x04) { constantInstanceHi = view.getUint32(currentPos, true); currentPos += 4; }

    // Per-entry size is 32 minus 4 for each constant field
    let entrySize = 32;
    if (constantType !== null) entrySize -= 4;
    if (constantGroup !== null) entrySize -= 4;
    if (constantInstanceHi !== null) entrySize -= 4;

    const resources: DBPFResource[] = [];
    for (let i = 0; i < indexCount; i++) {
      const p = currentPos + i * entrySize;
      let ep = 0;

      const typeId = constantType ?? view.getUint32(p + ep, true);
      if (constantType === null) ep += 4;

      const groupId = constantGroup ?? view.getUint32(p + ep, true);
      if (constantGroup === null) ep += 4;

      const instanceHi = constantInstanceHi ?? view.getUint32(p + ep, true);
      if (constantInstanceHi === null) ep += 4;

      const instanceLo = view.getUint32(p + ep, true); ep += 4;
      const offset = view.getUint32(p + ep, true); ep += 4;

      const compressedSizeRaw = view.getUint32(p + ep, true); ep += 4;
      const compressedSize = compressedSizeRaw & 0x7FFFFFFF; // THE CRITICAL FIX

      const fileSize = view.getUint32(p + ep, true); ep += 4;
      const compressionType = view.getUint16(p + ep, true); ep += 2;
      const committed = view.getUint16(p + ep, true);

      const instanceId = (BigInt(instanceHi) << 32n) | BigInt(instanceLo);

      if (offset + compressedSize > totalSize) {
        console.warn(`Resource ${i} invalid: offset=${offset}, size=${compressedSize}, total=${totalSize}`);
        continue;
      }

      let data = new Uint8Array(buffer, offset, compressedSize);

      // Decompression
      if (compressionType === 0x5A42 || compressionType === 0x5A43) {
        try {
          data = pako.inflate(data);
        } catch (e) {
          console.error(`Decompression failed for resource ${i} type 0x${typeId.toString(16)}`, e);
        }
      } else if (compressionType !== 0x0000) {
        console.warn(`Unsupported compression type 0x${compressionType.toString(16)} for resource ${i}`);
      }

      resources.push({ typeId, groupId, instanceId, data: new Uint8Array(data) });
    }

    return resources;
  } catch (err) {
    console.error('DBPF Parse Error:', err);
    throw err;
  }
}

/**
 * Parses a String Table (STBL) resource (supports both interleaved and non-interleaved if encountered).
 */
export function parseStbl(bytes: Uint8Array): { keyHash: number, value: string }[] {
  try {
    if (bytes.length < 17) return [];
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    if (magic !== 'STBL') return [];

    // Header structure for v5:
    // 0-3: STBL
    // 4-5: Version (5)
    // 6: Compressed
    // 7-14: Count (uint64)
    // 15-16: Reserved
    // 17-20: Data Size (uint32)
    
    // We'll try to guess if it's a 4-byte or 8-byte count based on the reserved field and data size
    let numEntries = 0;
    let pos = 0;
    
    // Most TS4 STBLs have 8-byte counts
    numEntries = view.getUint32(7, true);
    // If the next 4 bytes are 0, it's very likely an 8-byte count (and numEntries < 4 billion)
    const countHi = view.getUint32(11, true);
    
    if (countHi === 0 && bytes.length >= 21) {
       pos = 21;
    } else {
       // Fallback to 17-byte header (common in some older tools or malformed files)
       pos = 17;
    }
    
    if (numEntries > 100000) return []; // Safety cap
    
    const strings: { keyHash: number, value: string }[] = [];
    const decoder = new TextDecoder();
    
    for (let i = 0; i < numEntries; i++) {
      if (pos + 7 > bytes.length) break;
      
      const keyHash = view.getUint32(pos, true);
      const strLen = view.getUint16(pos + 5, true);
      pos += 7;
      
      if (pos + strLen > bytes.length) break;
      const strData = bytes.slice(pos, pos + strLen);
      const value = decoder.decode(strData);
      strings.push({ keyHash, value });
      pos += strLen;
    }
    return strings;
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
