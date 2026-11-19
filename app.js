require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const compression = require('compression');

const db = require('./src/config/db');
const helpers = require('./src/utils/helpers');
const seo = require('./src/utils/seo');
const publicRoutes = require('./src/routes/public');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Upewnij się, że katalog na wgrywane zdjęcia istnieje
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Inicjalizacja bazy danych i danych startowych (seed)
db.initDatabase();

// Konfiguracja silnika szablonów EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

// Kompresja odpowiedzi HTTP, nagłówki bezpieczeństwa oraz parsowanie formularzy
app.disable('x-powered-by');
app.use(compression());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.json({ limit: '15mb' }));

// Pliki statyczne z długim czasem przechowywania w pamięci podręcznej przeglądarki (PageSpeed Cache)
const ASSET_VERSION = '2.0';
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  maxAge: '365d',
  immutable: true
}));
app.use('/fonts', express.static(path.join(__dirname, 'public', 'fonts'), {
  maxAge: '365d',
  immutable: true
}));
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '30d'
}));

// Konfiguracja sesji (logowanie właściciela)
app.use(session({
  name: 'agent_cms_sid',
  secret: process.env.SESSION_SECRET || 'nieruchomosci-secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 dni
  }
}));

// Zmienne globalne dostępne w każdym widoku EJS
app.use((req, res, next) => {
  let activeUser = null;
  if (req.session && req.session.user) {
    const dbUser = db.findUserById(req.session.user.id);
    if (dbUser && dbUser.active !== false) {
      activeUser = {
        id: dbUser.id,
        username: dbUser.username,
        name: dbUser.name,
        role: dbUser.role || 'agent',
        avatar: dbUser.avatar
      };
      req.session.user = activeUser;
    } else {
      delete req.session.user;
    }
  }

  const primaryAgent = db.getPrimaryAgent();
  const activeAgents = db.getUsers({ activeOnly: true }).sort((a, b) => {
    if (Number(a.id) === Number(primaryAgent.id)) return -1;
    if (Number(b.id) === Number(primaryAgent.id)) return 1;
    return Number(a.id) - Number(b.id);
  });

  const settings = db.getSettings();
  const baseUrl = seo.getBaseUrl(req, settings);
  const cleanPath = req.path === '/' ? '/' : req.path.replace(/\/+$/, '');
  const isAdminRoute = cleanPath.startsWith('/admin');

  res.locals.currentUser = activeUser;
  res.locals.currentPath = req.path;
  res.locals.settings = settings;
  res.locals.primaryAgent = primaryAgent;
  res.locals.teamAgents = activeAgents;
  res.locals.unreadMessagesCount = activeUser ? db.getUnreadMessagesCount(activeUser) : 0;
  res.locals.helpers = helpers;
  res.locals.seo = seo;
  res.locals.assetVersion = ASSET_VERSION;
  res.locals.getAuthor = db.getAuthorForResource;

  // Domyślne dane SEO / Open Graph dla każdego widoku
  res.locals.baseUrl = baseUrl;
  res.locals.canonicalUrl = `${baseUrl}${cleanPath}`;
  res.locals.ogType = 'website';
  res.locals.ogImage = seo.pickOgImage(baseUrl, settings, null);
  res.locals.robotsMeta = isAdminRoute ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
  res.locals.jsonLdSchemas = isAdminRoute ? [] : [seo.buildAgencySchema({ baseUrl, settings, primaryAgent })];

  // Komunikaty flash (sukces / błąd)
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;

  next();
});

// Ścieżki aplikacji
app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

// Obsługa strony 404
app.use((req, res) => {
  res.status(404).render('public/404', {
    pageTitle: 'Strona nie została znaleziona (404)',
    pageDescription: 'Przepraszamy, szukana strona nie istnieje.',
    robotsMeta: 'noindex, nofollow'
  });
});

// Obsługa błędów serwera 500
app.use((err, req, res, next) => {
  console.error('[Błąd aplikacji]:', err);
  res.status(500).render('public/404', {
    pageTitle: 'Wystąpił błąd serwera (500)',
    pageDescription: 'Przepraszamy, wystąpił nieoczekiwany błąd. Spróbuj ponownie za chwilę.',
    robotsMeta: 'noindex, nofollow'
  });
});

app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na http://localhost:${PORT}`);
});

module.exports = app;
