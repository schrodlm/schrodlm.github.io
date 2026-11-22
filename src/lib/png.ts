// A PNG writer: 8-bit RGBA, unfiltered rows, one image pixel per cell. The plate scripts write the
// woodcut plates with it, and the build the desk's resting frame.
import { deflateSync } from 'node:zlib';

/** An image, w × h pixels of RGBA. */
export interface Pixels {
  w: number;
  h: number;
  data: Uint8Array | Uint8ClampedArray;
}

const CRC = new Uint32Array(256).map((_, n) => {
  let k = n;
  for (let i = 0; i < 8; i++) k = k & 1 ? 0xEDB88320 ^ (k >>> 1) : k >>> 1;
  return k >>> 0;
});

function crc32(buf: Uint8Array): number {
  let k = 0xFFFFFFFF;
  for (const b of buf) k = CRC[(k ^ b) & 0xFF]! ^ (k >>> 8);
  return (k ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type: string, body: Buffer): Buffer {
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0);
  out.write(type, 4, 'latin1');
  body.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
}

export function png(P: Pixels): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(P.w, 0); ihdr.writeUInt32BE(P.h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8 bits per channel, RGBA
  const raw = Buffer.alloc((P.w * 4 + 1) * P.h);
  const pixels = Buffer.from(P.data.buffer, P.data.byteOffset, P.data.length);
  for (let y = 0; y < P.h; y++) pixels.copy(raw, y * (P.w * 4 + 1) + 1, y * P.w * 4, (y + 1) * P.w * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}
