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
    fileSize: 10 * 1024 * 1024 // 10 MB na plik
  }
});

/**
 * Usuwa plik z public/uploads (nie rusza plików demonstracyjnych z /images/demo/)
 */
function removeUploadedFile(publicUrlPath) {
  if (!publicUrlPath || !String(publicUrlPath).startsWith('/uploads/')) {
    return;
  }
  const safeFilename = path.basename(publicUrlPath);
  const fullPath = path.join(UPLOAD_DIR, safeFilename);
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error('[Upload] Nie udało się usunąć pliku:', err.message);
  }
}

module.exports = {
  upload,
  removeUploadedFile
};
