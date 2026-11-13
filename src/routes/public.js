const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { sendContactEmail } = require('../utils/mailer');

// Strona główna (Home)
router.get('/', (req, res) => {
  const settings = db.getSettings();
  const featuredProperties = db.getProperties({ featuredOnly: true }).slice(0, 3);
  const latestProperties = featuredProperties.length > 0
    ? featuredProperties
    : db.getProperties().slice(0, 3);
  const services = db.getServices().slice(0, 3);
  const latestPosts = db.getPosts({ publishedOnly: true }).slice(0, 3);

  res.render('public/home', {
    pageTitle: settings.seo?.siteTitle || `${settings.brandName} – Agent Nieruchomości`,
    pageDescription: settings.seo?.siteDescription || settings.heroSubtitle,
    featuredProperties: latestProperties,
    services,
    latestPosts
  });
});

// Zakładka: O mnie
router.get('/o-mnie', (req, res) => {
  const settings = db.getSettings();
  const allProperties = db.getProperties();
  const teamAgents = db.getUsers({ activeOnly: true }).map((u) => ({
    ...u,
    propertiesCount: allProperties.filter((p) => Number(p.authorId || 1) === Number(u.id)).length
  }));

  res.render('public/about', {
    pageTitle: `O mnie i nasz zespół – ${settings.agentName} | ${settings.brandName}`,
    pageDescription: settings.about?.subtitle || `Poznaj doświadczenie i zespół biura nieruchomości ${settings.brandName}.`,
    teamAgents
  });
});

// Zakładka: Oferta (Usługi)
router.get('/oferta', (req, res) => {
  const settings = db.getSettings();
  const services = db.getServices();
  res.render('public/services', {
    pageTitle: `Oferta i zakres usług | ${settings.brandName}`,
    pageDescription: 'Kompleksowe pośrednictwo w sprzedaży, zakupie oraz wynajmie nieruchomości, home staging i doradztwo.',
    services
  });
});

// Zakładka: Nieruchomości (Katalog z filtrami)
router.get('/nieruchomosci', (req, res) => {
  const settings = db.getSettings();
  const filters = {
    authorId: req.query.agent || '',
    transactionType: req.query.typ || '',
    category: req.query.kategoria || '',
    status: req.query.status || '',
    search: req.query.szukaj || '',
    minPrice: req.query.cena_od || '',
    maxPrice: req.query.cena_do || '',
    minArea: req.query.metraz_od || '',
    rooms: req.query.pokoje || '',
    sort: req.query.sort || 'newest'
  };

  const properties = db.getProperties(filters);
  const agents = db.getUsers({ activeOnly: true });

  res.render('public/properties', {
    pageTitle: `Nieruchomości na sprzedaż i wynajem | ${settings.brandName}`,
    pageDescription: 'Sprawdź aktualne oferty mieszkań, domów, działek i lokali użytkowych.',
    properties,
    filters,
    agents
  });
});

// Szczegóły pojedynczej nieruchomości
router.get('/nieruchomosci/:slug', (req, res) => {
  const settings = db.getSettings();
  const property = db.getPropertyBySlug(req.params.slug);

  if (!property) {
    return res.status(404).render('public/404', {
      pageTitle: 'Oferta nie została znaleziona',
      pageDescription: 'Szukana nieruchomość została usunięta lub zmieniła adres.'
    });
  }

  const similarProperties = db
    .getProperties({ category: property.category })
    .filter((p) => p.id !== property.id)
    .slice(0, 3);

  res.render('public/property-detail', {
    pageTitle: `${property.title} – ${property.city} | ${settings.brandName}`,
    pageDescription: `${property.title}, ${property.area} m², ${property.city} (${property.district}). Sprawdź szczegóły oferty.`,
    property,
    similarProperties
  });
});

// Zakładka: Blog (Lista wpisów)
router.get('/blog', (req, res) => {
  const settings = db.getSettings();
  const posts = db.getPosts({ publishedOnly: true });

  res.render('public/blog', {
    pageTitle: `Blog i poradniki nieruchomości | ${settings.brandName}`,
    pageDescription: 'Praktyczne artykuły o sprzedaży, zakupie, prawie nieruchomości oraz home stagingu.',
    posts
  });
});

// Pojedynczy artykuł na blogu
router.get('/blog/:slug', (req, res) => {
  const settings = db.getSettings();
  const post = db.getPostBySlug(req.params.slug);

  if (!post || (!post.published && !req.session.user)) {
    return res.status(404).render('public/404', {
      pageTitle: 'Artykuł nie został znaleziony',
      pageDescription: 'Szukany wpis na blogu nie istnieje.'
    });
  }

  const otherPosts = db
    .getPosts({ publishedOnly: true })
    .filter((p) => p.id !== post.id)
    .slice(0, 2);
  const featuredProperties = db.getProperties().slice(0, 2);

  res.render('public/blog-post', {
    pageTitle: `${post.title} | Blog ${settings.brandName}`,
    pageDescription: post.excerpt || post.title,
    post,
    otherPosts,
    featuredProperties
  });
});

// Zakładka: Kontakt
router.get('/kontakt', (req, res) => {
  const settings = db.getSettings();
  const prefilledSubject = req.query.temat || '';
  const prefilledProperty = req.query.oferta || '';

  res.render('public/contact', {
    pageTitle: `Kontakt – Umów bezpłatną konsultację | ${settings.brandName}`,
    pageDescription: `Skontaktuj się z agentem nieruchomości: ${settings.contact?.phone}, ${settings.contact?.email}.`,
    prefilledSubject,
    prefilledProperty
  });
});

// Obsługa wysyłki formularza kontaktowego (ze strony Kontakt oraz z karty nieruchomości)
router.post('/kontakt', async (req, res) => {
  const { name, email, phone, subject, message, propertyTitle, propertyId, agentId, redirectUrl } = req.body;
  const targetRedirect = redirectUrl && String(redirectUrl).startsWith('/') ? redirectUrl : '/kontakt';

  if (!name || !message || (!phone && !email)) {
    req.session.flash = {
      type: 'error',
      message: 'Uzupełnij imię, treść wiadomości oraz numer telefonu lub adres e-mail.'
    };
    return res.redirect(targetRedirect);
  }

  const targetAgentId = agentId ? Number(agentId) : 1;
  const assignedAgent = db.findUserById(targetAgentId);

  const savedMsg = db.createMessage({
    agentId: targetAgentId,
    propertyId: propertyId ? Number(propertyId) : null,
    name: name.trim(),
    email: (email || '').trim(),
    phone: (phone || '').trim(),
    subject: (subject || 'Zapytanie ze strony').trim(),
    propertyTitle: (propertyTitle || '').trim(),
    message: message.trim()
  });

  // Próba wysyłki powiadomienia e-mail przez SMTP (bezpośrednio do opiekuna oferty lub na główny adres biura)
  const settings = db.getSettings();
  await sendContactEmail(savedMsg, settings, assignedAgent?.email || null);

  req.session.flash = {
    type: 'success',
    message: 'Dziękuję za wiadomość! Twoje zapytanie zostało zapisane – skontaktujemy się z Tobą najszybciej jak to możliwe.'
  };
  return res.redirect(targetRedirect);
});

module.exports = router;
