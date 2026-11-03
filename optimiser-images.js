const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC = path.join(__dirname, 'images');
const BACKUP = path.join(__dirname, '..', 'images_originales');
const MAX_W = 1000;
const QUALITY = 78;

function liste(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? liste(p) : p.endsWith('.webp') ? [p] : [];
  });
}

(async () => {
  if (!fs.existsSync(BACKUP)) fs.cpSync(SRC, BACKUP, { recursive: true });
  for (const f of liste(SRC)) {
    const avant = fs.readFileSync(f);
    const apres = await sharp(avant)
      .resize({ width: MAX_W, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();
    if (apres.length < avant.length) fs.writeFileSync(f, apres);
    console.log(path.relative(SRC, f), Math.round(avant.length / 1024), '→', Math.round(Math.min(apres.length, avant.length) / 1024), 'Ko');
  }
})();