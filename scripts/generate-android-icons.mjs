import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const outputDir = path.join(root, 'resources', 'android', 'icon');
const densities = [
  ['ldpi', 36],
  ['mdpi', 48],
  ['hdpi', 72],
  ['xhdpi', 96],
  ['xxhdpi', 144],
  ['xxxhdpi', 192],
];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const payload = Buffer.concat([typeBuffer, data]);
  const result = Buffer.alloc(12 + data.length);
  result.writeUInt32BE(data.length, 0);
  payload.copy(result, 4);
  result.writeUInt32BE(crc32(payload), 8 + data.length);
  return result;
}

function png(size) {
  const pixels = Buffer.alloc(size * size * 4, 0);
  const setPixel = (x, y, color) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const index = (y * size + x) * 4;
    pixels[index] = color[0]; pixels[index + 1] = color[1];
    pixels[index + 2] = color[2]; pixels[index + 3] = color[3];
  };
  const blue = [31, 78, 216, 255];
  const white = [255, 255, 255, 255];
  const gold = [233, 168, 59, 255];
  const radius = size * 0.265;
  const center = size / 2;
  const stroke = Math.max(2, size * 0.11);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = Math.max(Math.max(radius - x, 0), x - (size - radius));
      const dy = Math.max(Math.max(radius - y, 0), y - (size - radius));
      if (dx * dx + dy * dy <= radius * radius) setPixel(x, y, blue);
    }
  }
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      if (distance > size * 0.22 && distance < size * 0.36 && (angle < -0.55 || angle > 0.55)) setPixel(x, y, white);
    }
  }
  for (let y = Math.floor(size * 0.22); y < Math.floor(size * 0.48); y += 1) {
    for (let x = Math.floor(size * 0.58); x < Math.floor(size * 0.78); x += 1) {
      const line1 = Math.abs((x - size * 0.58) - (y - size * 0.22)) < stroke / 2;
      const line2 = Math.abs(x - size * 0.78) < stroke / 2;
      if (line1 || line2) setPixel(x, y, gold);
    }
  }
  const rows = [];
  const stride = size * 4;
  for (let y = 0; y < size; y += 1) rows.push(Buffer.concat([Buffer.from([0]), pixels.subarray(y * stride, (y + 1) * stride)]));
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4);
  header[8] = 8; header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(outputDir, { recursive: true });
for (const [density, size] of densities) fs.writeFileSync(path.join(outputDir, `drawable-${density}-icon.png`), png(size));
fs.writeFileSync(path.join(outputDir, 'icon.png'), png(512));
console.log(`Iconos Android generados en ${path.relative(root, outputDir)}`);
