const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { createSlug } = require('../utils/helpers');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.webp';
    const baseName = path.basename(file.originalname, path.extname(file.originalname));
    const safeName = createSlug(baseName) || 'zdjecie';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e4)}`;
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Dozwolone są wyłącznie pliki graficzne (JPG, PNG, WebP, SVG).'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 12 * 1024 * 1024 // 12 MB na plik
  }
});

/**
 * Zapisuje opcjonalną miniaturę (-sm) wygenerowaną po stronie przeglądarki obok głównego pliku
 */
function saveCompanionThumb(mainFile, thumbFile) {
  if (!mainFile || !thumbFile || !thumbFile.path) return null;
  try {
    const mainExt = path.extname(mainFile.filename);
    const mainBase = path.basename(mainFile.filename, mainExt);
    const thumbExt = path.extname(thumbFile.originalname).toLowerCase() || mainExt || '.webp';
    const targetName = `${mainBase}-sm${thumbExt}`;
    const targetPath = path.join(UPLOAD_DIR, targetName);
    if (fs.existsSync(thumbFile.path)) {
      fs.renameSync(thumbFile.path, targetPath);
      return `/uploads/${targetName}`;
    }
  } catch (err) {
    console.error('[Upload] Nie udało się zapisać miniatury:', err.message);
  }
  return null;
}

/**
 * Usuwa plik z public/uploads wraz z jego miniaturą (-sm), nie ruszając plików demonstracyjnych z /images/demo/
 */
function removeUploadedFile(publicUrlPath) {
  if (!publicUrlPath || !String(publicUrlPath).startsWith('/uploads/')) {
    return;
  }
  const safeFilename = path.basename(publicUrlPath);
  const fullPath = path.join(UPLOAD_DIR, safeFilename);
  const ext = path.extname(safeFilename);
  const base = path.basename(safeFilename, ext);

  const candidates = [
    fullPath,
    path.join(UPLOAD_DIR, `${base}-sm${ext}`),
    path.join(UPLOAD_DIR, `${base}-sm.webp`),
    path.join(UPLOAD_DIR, `${base}-sm.jpg`)
  ];

  candidates.forEach((candidatePath) => {
    try {
      if (fs.existsSync(candidatePath)) {
        fs.unlinkSync(candidatePath);
      }
    } catch (err) {
      console.error('[Upload] Nie udało się usunąć pliku:', err.message);
    }
  });
}

/**
 * Skanuje public/uploads w poszukiwaniu zbyt ciężkich plików graficznych (np. > 220 KB),
 * które mogą obniżać wynik Google PageSpeed Insights.
 */
function getOversizedUploads(thresholdBytes = 220 * 1024) {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) return [];
    const entries = fs.readdirSync(UPLOAD_DIR);
    const oversized = [];

    for (const name of entries) {
      if (name.startsWith('.') || /-sm\.(webp|jpe?g|png)$/i.test(name)) continue;
      if (!/\.(webp|jpe?g|png)$/i.test(name)) continue;
      const fullPath = path.join(UPLOAD_DIR, name);
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && stat.size > thresholdBytes) {
        oversized.push({
          filename: name,
          publicPath: `/uploads/${name}`,
          sizeBytes: stat.size,
          sizeKB: Math.round(stat.size / 1024)
        });
      }
    }

    return oversized.sort((a, b) => b.sizeBytes - a.sizeBytes);
  } catch (err) {
    console.error('[Upload] Błąd skanowania katalogu uploads:', err.message);
    return [];
  }
}

module.exports = {
  UPLOAD_DIR,
  upload,
  saveCompanionThumb,
  removeUploadedFile,
  getOversizedUploads
};
