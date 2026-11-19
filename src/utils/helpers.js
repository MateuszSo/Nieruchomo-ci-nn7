const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');

/**
 * Tworzy przyjazny dla SEO adres URL (slug) z obsługą polskich znaków
 */
function createSlug(text) {
  if (!text) return '';
  return slugify(String(text), {
    lower: true,
    strict: true,
    locale: 'pl'
  });
}

/**
 * Formatuje cenę w PLN (np. 849 000 zł)
 */
function formatPrice(price, suffix = 'zł') {
  const num = Number(price);
  if (isNaN(num) || num <= 0) return 'Cena do uzgodnienia';
  return num.toLocaleString('pl-PL') + (suffix ? ` ${suffix}` : '');
}

/**
 * Formatuje datę po polsku (np. 14 października 2026)
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Oblicza przybliżony czas czytania artykułu
 */
function readingTime(htmlContent) {
  if (!htmlContent) return '2 min czytania';
  const plainText = String(htmlContent).replace(/<[^>]*>/g, ' ');
  const words = plainText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} min czytania`;
}

/**
 * Zwraca etykietę i kolory o wysokim kontraście (WCAG AA >= 4.5:1) dla statusu nieruchomości
 */
function getStatusBadge(status) {
  switch (status) {
    case 'zarezerwowane':
      return {
        label: 'Zarezerwowane',
        bgClass: 'bg-amber-500 text-slate-950',
        dotClass: 'bg-slate-950'
      };
    case 'sprzedane':
      return {
        label: 'Sprzedane / Wynajęte',
        bgClass: 'bg-rose-700 text-white',
        dotClass: 'bg-rose-200'
      };
    case 'dostepne':
    default:
      return {
        label: 'Dostępne',
        bgClass: 'bg-emerald-700 text-white',
        dotClass: 'bg-emerald-200'
      };
  }
}

/**
 * Zwraca ścieżkę do lżejszej miniatury (-sm), jeśli istnieje na dysku
 */
function getSmallImage(publicUrlPath) {
  if (!publicUrlPath || !String(publicUrlPath).startsWith('/uploads/')) {
    return publicUrlPath || '';
  }
  const safeFilename = path.basename(publicUrlPath);
  const ext = path.extname(safeFilename);
  const base = path.basename(safeFilename, ext);
  const candidates = [`${base}-sm${ext}`, `${base}-sm.webp`, `${base}-sm.jpg`];

  for (const cand of candidates) {
    if (fs.existsSync(path.join(UPLOADS_DIR, cand))) {
      return `/uploads/${cand}`;
    }
  }
  return publicUrlPath;
}

/**
 * Generuje wartość atrybutu srcset dla obrazów z /uploads/, jeśli dostępny jest wariant mobilny (-sm)
 */
function getResponsiveSrcSet(publicUrlPath) {
  const smallUrl = getSmallImage(publicUrlPath);
  if (!smallUrl || smallUrl === publicUrlPath) {
    return '';
  }
  return `${smallUrl} 720w, ${publicUrlPath} 1440w`;
}

/**
 * Zwraca czytelny opis kategorii nieruchomości
 */
function getCategoryLabel(category) {
  const map = {
    mieszkanie: 'Mieszkanie',
    dom: 'Dom',
    dzialka: 'Działka',
    lokal: 'Lokal użytkowy'
  };
  return map[category] || category;
}

/**
 * Zwraca czytelny opis typu transakcji
 */
function getTransactionLabel(type) {
  return type === 'wynajem' ? 'Wynajem' : 'Sprzedaż';
}

/**
 * Sprawdza w widokach EJS, czy zalogowany użytkownik ma prawo edytować zasób
 */
function canManage(resource, user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const ownerId = resource?.authorId ?? resource?.agentId ?? 1;
  return Number(ownerId) === Number(user.id);
}

/**
 * Zwraca etykietę i styl dla roli konta (admin / agent)
 */
function getRoleBadge(role) {
  if (role === 'admin') {
    return {
      label: 'Admin (Pełny dostęp)',
      shortLabel: 'Administrator',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
    };
  }
  return {
    label: 'Agent (Własne treści)',
    shortLabel: 'Agent',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300'
  };
}

/**
 * Zwraca sformatowany adres biura lub pusty ciąg, jeśli adres nie jest podany lub został ukryty
 */
function formatOfficeAddress(contact) {
  if (!contact || contact.hideOffice) return '';
  const parts = [contact.address, contact.city]
    .map((v) => String(v || '').trim())
    .filter((v) => v && v !== '-');
  return parts.join(', ');
}

/**
 * Sprawdza, czy sekcje związane z adresem biura powinny być widoczne na stronie
 */
function hasOfficeAddress(contact) {
  return Boolean(formatOfficeAddress(contact));
}

function stripHtml(html) {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

module.exports = {
  createSlug,
  formatPrice,
  formatDate,
  readingTime,
  stripHtml,
  getStatusBadge,
  getSmallImage,
  getResponsiveSrcSet,
  getCategoryLabel,
  getTransactionLabel,
  canManage,
  getRoleBadge,
  formatOfficeAddress,
  hasOfficeAddress
};
