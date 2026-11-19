const { stripHtml } = require('./helpers');

function getBaseUrl(req, settings = null) {
  const configured = (process.env.SITE_URL || settings?.seo?.siteUrl || '').trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  if (!req) return 'http://localhost:3000';
  const proto = req.headers['x-forwarded-proto']
    ? String(req.headers['x-forwarded-proto']).split(',')[0].trim()
    : (req.protocol || 'http');
  const host = req.get ? req.get('host') : 'localhost:3000';
  return `${proto}://${host}`;
}

function toAbsoluteUrl(baseUrl, pathOrUrl) {
  if (!pathOrUrl) return '';
  const clean = String(pathOrUrl).trim();
  if (/^https?:\/\//i.test(clean)) return clean;
  return `${baseUrl}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

function isRasterSocialImage(pathOrUrl) {
  if (!pathOrUrl) return false;
  const clean = String(pathOrUrl).split('?')[0].toLowerCase();
  return !clean.endsWith('.svg');
}

function pickOgImage(baseUrl, settings, customImage = null) {
  if (customImage && isRasterSocialImage(customImage)) {
    return toAbsoluteUrl(baseUrl, customImage);
  }
  const configuredOg = settings?.seo?.ogImage;
  if (configuredOg && isRasterSocialImage(configuredOg)) {
    return toAbsoluteUrl(baseUrl, configuredOg);
  }
  return toAbsoluteUrl(baseUrl, '/images/og-nn7.png');
}

function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function buildAgencySchema({ baseUrl, settings, primaryAgent }) {
  const sameAs = [settings?.contact?.facebook, settings?.contact?.instagram]
    .map((u) => (u || '').trim())
    .filter(Boolean);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${baseUrl}/#organization`,
    name: settings?.brandName || 'Najlepsze Nieruchomości NN7',
    url: baseUrl,
    logo: toAbsoluteUrl(baseUrl, settings?.logoImage || '/images/logo-nn7.svg'),
    image: pickOgImage(baseUrl, settings, null),
    description: settings?.seo?.siteDescription || settings?.heroSubtitle || '',
    areaServed: (settings?.seo?.serviceArea || 'Częstochowa i okolice')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ '@type': 'AdministrativeArea', name }))
  };

  if (primaryAgent?.phone) schema.telephone = primaryAgent.phone;
  if (primaryAgent?.email) schema.email = primaryAgent.email;

  if (!settings?.contact?.hideOffice && (settings?.contact?.address || settings?.contact?.city)) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: settings.contact.address || undefined,
      addressLocality: settings.contact.city || undefined,
      addressCountry: 'PL'
    };
  }

  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  return schema;
}

function buildPropertySchema({ baseUrl, property, author }) {
  const propUrl = `${baseUrl}/nieruchomosci/${property.slug}`;
  const rasterImages = (property.images || [])
    .filter(isRasterSocialImage)
    .map((img) => toAbsoluteUrl(baseUrl, img));

  const plainDesc = stripHtml(property.description || '').slice(0, 400);
  const availability = property.status === 'dostepne'
    ? 'https://schema.org/InStock'
    : 'https://schema.org/SoldOut';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RealEstateListing',
        name: property.title,
        url: propUrl,
        datePosted: property.createdAt,
        description: plainDesc,
        image: rasterImages.length > 0 ? rasterImages : [toAbsoluteUrl(baseUrl, '/images/og-nn7.png')],
        offers: {
          '@type': 'Offer',
          url: propUrl,
          price: Number(property.price) || 0,
          priceCurrency: 'PLN',
          availability,
          seller: {
            '@type': 'Person',
            name: author?.name || 'Pośrednik nieruchomości',
            telephone: author?.phone || undefined,
            email: author?.email || undefined
          }
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Strona główna', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: 'Nieruchomości', item: `${baseUrl}/nieruchomosci` },
          { '@type': 'ListItem', position: 3, name: property.title, item: propUrl }
        ]
      }
    ]
  };
}

function buildBlogPostSchema({ baseUrl, post, author, settings }) {
  const postUrl = `${baseUrl}/blog/${post.slug}`;
  const image = pickOgImage(baseUrl, settings, post.coverImage);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt || stripHtml(post.content || '').slice(0, 220),
        image: [image],
        datePublished: post.createdAt,
        dateModified: post.updatedAt || post.createdAt,
        mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
        author: {
          '@type': 'Person',
          name: author?.name || 'Ekspert ds. nieruchomości'
        },
        publisher: {
          '@id': `${baseUrl}/#organization`,
          '@type': 'Organization',
          name: settings?.brandName || 'Najlepsze Nieruchomości NN7'
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Strona główna', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: postUrl }
        ]
      }
    ]
  };
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  return d.toISOString().split('T')[0];
}

function buildSitemapXml({ baseUrl, properties = [], posts = [] }) {
  const today = new Date().toISOString().split('T')[0];
  const urls = [
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0', lastmod: today },
    { loc: `${baseUrl}/nieruchomosci`, changefreq: 'daily', priority: '0.9', lastmod: today },
    { loc: `${baseUrl}/oferta`, changefreq: 'monthly', priority: '0.8', lastmod: today },
    { loc: `${baseUrl}/o-mnie`, changefreq: 'monthly', priority: '0.8', lastmod: today },
    { loc: `${baseUrl}/blog`, changefreq: 'weekly', priority: '0.8', lastmod: today },
    { loc: `${baseUrl}/kontakt`, changefreq: 'monthly', priority: '0.8', lastmod: today },
    { loc: `${baseUrl}/polityka-prywatnosci`, changefreq: 'yearly', priority: '0.3', lastmod: today }
  ];

  properties.forEach((p) => {
    if (p.slug) {
      urls.push({
        loc: `${baseUrl}/nieruchomosci/${encodeURIComponent(p.slug)}`,
        changefreq: 'weekly',
        priority: p.status === 'dostepne' ? '0.9' : '0.6',
        lastmod: toIsoDate(p.updatedAt || p.createdAt)
      });
    }
  });

  posts.forEach((post) => {
    if (post.slug && post.published) {
      urls.push({
        loc: `${baseUrl}/blog/${encodeURIComponent(post.slug)}`,
        changefreq: 'monthly',
        priority: '0.7',
        lastmod: toIsoDate(post.updatedAt || post.createdAt)
      });
    }
  });

  const itemsXml = urls
    .map(
      (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${escapeXml(u.lastmod)}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${itemsXml}
</urlset>`;
}

module.exports = {
  getBaseUrl,
  toAbsoluteUrl,
  pickOgImage,
  serializeJsonLd,
  buildAgencySchema,
  buildPropertySchema,
  buildBlogPostSchema,
  buildSitemapXml
};
