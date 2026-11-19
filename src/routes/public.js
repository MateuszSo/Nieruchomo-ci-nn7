const express = require('express');
const router = express.Router();
const db = require('../config/db');
const seo = require('../utils/seo');
const { sendContactEmail } = require('../utils/mailer');

// Techniczne SEO: robots.txt oraz dynamiczna mapa strony sitemap.xml
router.get('/robots.txt', (req, res) => {
  const settings = db.getSettings();
  const baseUrl = seo.getBaseUrl(req, settings);
  const content = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /admin/',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`
  ].join('\n');

  res.type('text/plain; charset=utf-8').send(content);
});

router.get('/sitemap.xml', (req, res) => {
  const settings = db.getSettings();
  const baseUrl = seo.getBaseUrl(req, settings);
  const properties = db.getProperties();
  const posts = db.getPosts({ publishedOnly: true });
  const xml = seo.buildSitemapXml({ baseUrl, properties, posts });

  res.type('application/xml; charset=utf-8').send(xml);
});

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
  const primaryAgent = db.getPrimaryAgent();
  const allProperties = db.getProperties();
  const teamAgents = db.getUsers({ activeOnly: true })
    .sort((a, b) => {
      if (Number(a.id) === Number(primaryAgent.id)) return -1;
      if (Number(b.id) === Number(primaryAgent.id)) return 1;
      return Number(a.id) - Number(b.id);
    })
    .map((u) => ({
      ...u,
      propertiesCount: allProperties.filter((p) => Number(p.authorId || primaryAgent.id) === Number(u.id)).length
    }));

  res.render('public/about', {
    pageTitle: `O mnie i nasz zespół – ${primaryAgent.name} | ${settings.brandName}`,
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
      pageDescription: 'Szukana nieruchomość została usunięta lub zmieniła adres.',
      robotsMeta: 'noindex, nofollow'
    });
  }

  const similarProperties = db
    .getProperties({ category: property.category })
    .filter((p) => p.id !== property.id)
    .slice(0, 3);

  const baseUrl = res.locals.baseUrl || seo.getBaseUrl(req, settings);
  const author = db.getAuthorForResource(property);
  const txLabel = property.transactionType === 'wynajem' ? 'Wynajem' : 'Sprzedaż';

  res.render('public/property-detail', {
    pageTitle: `${property.title} – ${property.city} (${txLabel}) | ${settings.brandName}`,
    pageDescription: `${property.title}${property.area ? `, ${property.area} m²` : ''}${property.city ? `, ${property.city}` : ''}${property.district ? ` (${property.district})` : ''}. Sprawdź cenę, zdjęcia i szczegóły oferty w biurze ${settings.brandName}.`,
    ogImage: seo.pickOgImage(baseUrl, settings, property.images?.[0]),
    jsonLdSchemas: [
      ...(res.locals.jsonLdSchemas || []),
      seo.buildPropertySchema({ baseUrl, property, author })
    ],
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
      pageDescription: 'Szukany wpis na blogu nie istnieje.',
      robotsMeta: 'noindex, nofollow'
    });
  }

  const otherPosts = db
    .getPosts({ publishedOnly: true })
    .filter((p) => p.id !== post.id)
    .slice(0, 2);
  const featuredProperties = db.getProperties().slice(0, 2);

  const baseUrl = res.locals.baseUrl || seo.getBaseUrl(req, settings);
  const author = db.getAuthorForResource(post);

  res.render('public/blog-post', {
    pageTitle: `${post.title} | Blog ${settings.brandName}`,
    pageDescription: post.excerpt || post.title,
    ogType: 'article',
    ogImage: seo.pickOgImage(baseUrl, settings, post.coverImage),
    jsonLdSchemas: [
      ...(res.locals.jsonLdSchemas || []),
      seo.buildBlogPostSchema({ baseUrl, post, author, settings })
    ],
    post,
    otherPosts,
    featuredProperties
  });
});

// Polityka prywatności i plików cookies (RODO)
router.get('/polityka-prywatnosci', (req, res) => {
  const settings = db.getSettings();
  res.render('public/privacy-policy', {
    pageTitle: `Polityka Prywatności i RODO | ${settings.brandName}`,
    pageDescription: `Zasady przetwarzania danych osobowych (RODO) oraz wykorzystywania plików cookies w serwisie ${settings.brandName}.`
  });
});

// Zakładka: Kontakt
router.get('/kontakt', (req, res) => {
  const settings = db.getSettings();
  const primaryAgent = db.getPrimaryAgent();
  const prefilledSubject = req.query.temat || '';
  const prefilledProperty = req.query.oferta || '';

  res.render('public/contact', {
    pageTitle: `Kontakt – Umów bezpłatną konsultację | ${settings.brandName}`,
    pageDescription: `Skontaktuj się z biurem nieruchomości ${settings.brandName}: ${primaryAgent.phone}, ${primaryAgent.email}.`,
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

  const primaryAgent = db.getPrimaryAgent();
  const targetAgentId = agentId ? Number(agentId) : primaryAgent.id;
  const assignedAgent = db.findUserById(targetAgentId) || primaryAgent;

  const savedMsg = db.createMessage({
    agentId: assignedAgent.id,
    propertyId: propertyId ? Number(propertyId) : null,
    name: name.trim(),
    email: (email || '').trim(),
    phone: (phone || '').trim(),
    subject: (subject || 'Zapytanie ze strony').trim(),
    propertyTitle: (propertyTitle || '').trim(),
    message: message.trim()
  });

  // Próba wysyłki powiadomienia e-mail przez SMTP (bezpośrednio do opiekuna oferty lub głównego agenta)
  const settings = db.getSettings();
  await sendContactEmail(savedMsg, settings, assignedAgent?.email || primaryAgent?.email || null);

  req.session.flash = {
    type: 'success',
    message: 'Dziękuję za wiadomość! Twoje zapytanie zostało zapisane – skontaktujemy się z Tobą najszybciej jak to możliwe.'
  };
  return res.redirect(targetRedirect);
});

module.exports = router;
