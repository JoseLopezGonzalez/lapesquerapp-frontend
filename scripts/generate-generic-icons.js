/**
 * Genera placeholders PNG para modo generic con dimensiones correctas
 * (evita error "Resource size is not correct" del manifest).
 * Ejecutar: node scripts/generate-generic-icons.js
 */
const fs = require('fs');
const path = require('path');

try {
  var PNG = require('pngjs').PNG;
} catch (e) {
  console.error('Ejecuta: npm install pngjs --save-dev');
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');

function writePng(filePath, width, height, r = 0xe5, g = 0xe5, b = 0xe5, a = 255) {
  const png = new PNG({ width, height, filterType: -1 });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, PNG.sync.write(png));
  console.log('Written:', filePath, `(${width}x${height})`);
}

writePng(path.join(publicDir, 'favicon-generic.png'), 32, 32);
writePng(path.join(publicDir, 'apple-touch-icon-generic.png'), 180, 180);
writePng(path.join(iconsDir, 'icon-192x192-generic.png'), 192, 192);
writePng(path.join(iconsDir, 'icon-512x512-generic.png'), 512, 512);
console.log('Done.');
