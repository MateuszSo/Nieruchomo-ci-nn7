const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../config/db');
const { requireAuth, requireAdmin, canManage } = require('../middleware/auth');
const { upload, removeUploadedFile } = require('../config/upload');

// ==================== LOGOWANIE / WYLOGOWANIE ====================
router.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/admin');
  }
  res.render('admin/login', {
    pageTitle: 'Logowanie do panelu agenta | Panel CMS'
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.findUserByUsername(username);

  if (!user || !bcrypt.compareSync(String(password || ''), user.passwordHash)) {
    req.session.flash = {
      type: 'error',
      message: 'Nieprawidłowy login lub hasło.'
    };
    return res.redirect('/admin/login');
  }

  if (user.active === false) {
    req.session.flash = {
      type: 'error',
      message: 'To konto agenta zostało zablokowane przez administratora.'
    };
    return res.redirect('/admin/login');
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role || 'agent',
    avatar: user.avatar
  };

  req.session.flash = {
    type: 'success',
    message: `Witaj ponownie, ${user.name || user.username}! Zalogowano w roli: ${user.role === 'admin' ? 'Administrator' : 'Agent'}.`
  };
  return res.redirect('/admin');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Wszystkie poniższe ścieżki wymagają zalogowania (admin lub agent)
router.use(requireAuth);

// ==================== KOKPIT GŁÓWNY (/admin) ====================
router.get('/', (req, res) => {
  const isAdmin = req.session.user.role === 'admin';
  const filterByUser = isAdmin ? {} : { authorId: req.session.user.id };
  const filterMsgByUser = isAdmin ? {} : { agentId: req.session.user.id };

  const properties = db.getProperties(filterByUser);
  const posts = db.getPosts(filterByUser);
  const services = db.getServices();
  const messages = db.getMessages(filterMsgByUser);
  const users = db.getUsers();

  const stats = {
    totalProperties: properties.length,
    availableProperties: properties.filter((p) => p.status === 'dostepne').length,
    reservedProperties: properties.filter((p) => p.status === 'zarezerwowane').length,
    soldProperties: properties.filter((p) => p.status === 'sprzedane').length,
    totalPosts: posts.length,
    totalServices: services.length,
    totalAgents: users.length,
    unreadMessages: messages.filter((m) => !m.read).length,
    totalMessages: messages.length
  };

  res.render('admin/dashboard', {
    pageTitle: isAdmin ? 'Panel zarządzania stroną (Administrator)' : `Panel Agenta – ${req.session.user.name}`,
    activeTab: 'dashboard',
    stats,
    recentProperties: properties.slice(0, 5),
    recentMessages: messages.slice(0, 5)
  });
});

// ==================== MÓJ PROFIL (/admin/profil – dla Admina i Agenta) ====================
router.get('/profil', (req, res) => {
  const profileUser = db.findUserById(req.session.user.id);
  res.render('admin/profile', {
    pageTitle: 'Mój profil i wizytówka agenta | Panel CMS',
    activeTab: 'profile',
    profileUser
  });
});

router.post('/profil', upload.single('avatarFile'), (req, res) => {
  const current = db.findUserById(req.session.user.id);
  if (!current) return res.redirect('/admin');

  let avatar = current.avatar;
  if (req.file) {
    removeUploadedFile(current.avatar);
    avatar = `/uploads/${req.file.filename}`;
  }

  try {
    // Jeśli podano nowe hasło, zweryfikuj obecne hasło
    let newPassword = null;
    if (req.body.newPassword && String(req.body.newPassword).trim()) {
      if (!bcrypt.compareSync(String(req.body.currentPassword || ''), current.passwordHash)) {
        req.session.flash = { type: 'error', message: 'Obecne hasło jest nieprawidłowe – nie zmieniono hasła.' };
        return res.redirect('/admin/profil');
      }
      newPassword = req.body.newPassword.trim();
    }

    db.updateUser(current.id, {
      username: req.body.username,
      newPassword,
      name: req.body.name,
      title: req.body.title,
      licenseNumber: req.body.licenseNumber,
      phone: req.body.phone,
      email: req.body.email,
      bio: req.body.bio,
      avatar
    });

    req.session.flash = {
      type: 'success',
      message: 'Twój profil i wizytówka agenta zostały zaktualizowane.'
    };
  } catch (err) {
    req.session.flash = {
      type: 'error',
      message: err.message
    };
  }
  return res.redirect('/admin/profil');
});

// ==================== ZARZĄDZANIE ZESPOŁEM AGENTÓW (/admin/agenci – TYLKO ADMIN) ====================
router.get('/agenci', requireAdmin, (req, res) => {
  const users = db.getUsers();
  const allProperties = db.getProperties();
  const allPosts = db.getPosts();

  const usersWithCounts = users.map((u) => ({
    ...u,
    propertiesCount: allProperties.filter((p) => Number(p.authorId || 1) === Number(u.id)).length,
    postsCount: allPosts.filter((p) => Number(p.authorId || 1) === Number(u.id)).length
  }));

  const editId = req.query.edytuj ? Number(req.query.edytuj) : null;
  const editingUser = editId ? db.findUserById(editId) : null;

  res.render('admin/agents-list', {
    pageTitle: 'Zespół i konta agentów | Panel CMS',
    activeTab: 'agents',
    users: usersWithCounts,
    editingUser
  });
});

router.post('/agenci/nowy', requireAdmin, upload.single('avatarFile'), (req, res) => {
  const avatar = req.file ? `/uploads/${req.file.filename}` : '/images/demo/agent-female.svg';
  try {
    const created = db.createUser({
      username: req.body.username,
      password: req.body.password,
      role: req.body.role === 'admin' ? 'admin' : 'agent',
      active: req.body.active !== 'false',
      name: req.body.name,
      title: req.body.title,
      licenseNumber: req.body.licenseNumber,
      phone: req.body.phone,
      email: req.body.email,
      bio: req.body.bio,
      avatar
    });
    req.session.flash = {
      type: 'success',
      message: `Utworzono nowe konto: ${created.name} (login: ${created.username}, rola: ${created.role}).`
    };
  } catch (err) {
    req.session.flash = {
      type: 'error',
      message: err.message
    };
  }
  res.redirect('/admin/agenci');
});

router.post('/agenci/:id/edytuj', requireAdmin, upload.single('avatarFile'), (req, res) => {
  const target = db.findUserById(req.params.id);
  if (!target) {
    req.session.flash = { type: 'error', message: 'Nie znaleziono wybranego konta.' };
    return res.redirect('/admin/agenci');
  }

  let avatar = target.avatar;
  if (req.file) {
    removeUploadedFile(target.avatar);
    avatar = `/uploads/${req.file.filename}`;
  }

  try {
    const updated = db.updateUser(target.id, {
      username: req.body.username,
      newPassword: req.body.newPassword,
      role: req.body.role === 'admin' ? 'admin' : 'agent',
      active: req.body.active === 'true',
      name: req.body.name,
      title: req.body.title,
      licenseNumber: req.body.licenseNumber,
      phone: req.body.phone,
      email: req.body.email,
      bio: req.body.bio,
      avatar
    });
    req.session.flash = {
      type: 'success',
      message: `Zaktualizowano konto: ${updated.name} (${updated.username}).`
    };
  } catch (err) {
    req.session.flash = {
      type: 'error',
      message: err.message
    };
  }
  res.redirect('/admin/agenci');
});

router.post('/agenci/:id/usun', requireAdmin, (req, res) => {
  if (Number(req.params.id) === Number(req.session.user.id)) {
    req.session.flash = {
      type: 'error',
      message: 'Nie możesz usunąć własnego, aktualnie zalogowanego konta.'
    };
    return res.redirect('/admin/agenci');
  }

  try {
    const deleted = db.deleteUser(req.params.id, req.session.user.id);
    if (deleted) {
      removeUploadedFile(deleted.avatar);
      req.session.flash = {
        type: 'success',
        message: `Usunięto konto „${deleted.name}”. Jego oferty i wpisy zostały przepisane na Twoje konto.`
      };
    }
  } catch (err) {
    req.session.flash = {
      type: 'error',
      message: err.message
    };
  }
  res.redirect('/admin/agenci');
});

// ==================== ZARZĄDZANIE NIERUCHOMOŚCIAMI ====================
router.get('/nieruchomosci', (req, res) => {
  const isAdmin = req.session.user.role === 'admin';
  const selectedAgent = isAdmin && req.query.agent ? Number(req.query.agent) : null;
  const filter = isAdmin
    ? (selectedAgent ? { authorId: selectedAgent } : {})
    : { authorId: req.session.user.id };

  const properties = db.getProperties(filter);
  const agents = db.getUsers();

  res.render('admin/properties-list', {
    pageTitle: isAdmin ? 'Wszystkie nieruchomości | Panel CMS' : 'Moje nieruchomości | Panel Agenta',
    activeTab: 'properties',
    properties,
    agents,
    selectedAgent
  });
});

router.get('/nieruchomosci/nowa', (req, res) => {
  const agents = db.getUsers({ activeOnly: true });
  res.render('admin/property-form', {
    pageTitle: 'Dodaj nową nieruchomość | Panel CMS',
    activeTab: 'properties',
    property: null,
    agents
  });
});

router.post('/nieruchomosci/nowa', upload.array('images', 15), (req, res) => {
  const isAdmin = req.session.user.role === 'admin';
  const uploadedPaths = (req.files || []).map((f) => `/uploads/${f.filename}`);
  const customImageUrls = String(req.body.customImages || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const images = [...uploadedPaths, ...customImageUrls];
  const amenities = String(req.body.amenities || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const authorId = isAdmin && req.body.authorId
    ? Number(req.body.authorId)
    : req.session.user.id;

  const created = db.createProperty({
    authorId,
    title: req.body.title,
    transactionType: req.body.transactionType,
    category: req.body.category,
    status: req.body.status,
    featured: req.body.featured === 'on',
    price: req.body.price,
    pricePerM2: req.body.pricePerM2,
    area: req.body.area,
    rooms: req.body.rooms,
    floor: req.body.floor,
    buildYear: req.body.buildYear,
    city: req.body.city,
    district: req.body.district,
    address: req.body.address,
    images,
    amenities,
    description: req.body.description
  });

  req.session.flash = {
    type: 'success',
    message: `Dodano nową nieruchomość: „${created.title}”.`
  };
  res.redirect('/admin/nieruchomosci');
});

router.get('/nieruchomosci/:id/edytuj', (req, res) => {
  const property = db.getPropertyById(req.params.id);
  if (!property) {
    req.session.flash = { type: 'error', message: 'Nie znaleziono wybranej nieruchomości.' };
    return res.redirect('/admin/nieruchomosci');
  }
  if (!canManage(property, req.session.user)) {
    req.session.flash = { type: 'error', message: 'Brak uprawnień – możesz edytować wyłącznie własne ogłoszenia.' };
    return res.redirect('/admin/nieruchomosci');
  }

  const agents = db.getUsers({ activeOnly: true });
  res.render('admin/property-form', {
    pageTitle: `Edycja: ${property.title} | Panel CMS`,
    activeTab: 'properties',
    property,
    agents
  });
});

router.post('/nieruchomosci/:id/edytuj', upload.array('images', 15), (req, res) => {
  const current = db.getPropertyById(req.params.id);
  if (!current) {
    req.session.flash = { type: 'error', message: 'Nie znaleziono wybranej nieruchomości.' };
    return res.redirect('/admin/nieruchomosci');
  }
  if (!canManage(current, req.session.user)) {
    req.session.flash = { type: 'error', message: 'Brak uprawnień – możesz edytować wyłącznie własne ogłoszenia.' };
    return res.redirect('/admin/nieruchomosci');
  }

  const isAdmin = req.session.user.role === 'admin';

  // Zachowane zdjęcia z formularza (checkboxy existingImages)
  let keptImages = req.body.existingImages || [];
  if (!Array.isArray(keptImages)) {
    keptImages = [keptImages].filter(Boolean);
  }

  // Usuń z dysku zdjęcia, które właściciel odznaczył
  (current.images || []).forEach((imgUrl) => {
    if (!keptImages.includes(imgUrl)) {
      removeUploadedFile(imgUrl);
    }
  });

  const uploadedPaths = (req.files || []).map((f) => `/uploads/${f.filename}`);
  const customImageUrls = String(req.body.customImages || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const allImages = [...keptImages, ...uploadedPaths, ...customImageUrls];
  const amenities = String(req.body.amenities || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const authorId = isAdmin && req.body.authorId
    ? Number(req.body.authorId)
    : current.authorId;

  const updated = db.updateProperty(current.id, {
    authorId,
    title: req.body.title,
    transactionType: req.body.transactionType,
    category: req.body.category,
    status: req.body.status,
    featured: req.body.featured === 'on',
    price: req.body.price,
    pricePerM2: req.body.pricePerM2,
    area: req.body.area,
    rooms: req.body.rooms,
    floor: req.body.floor,
    buildYear: req.body.buildYear,
    city: req.body.city,
    district: req.body.district,
    address: req.body.address,
    images: allImages.length > 0 ? allImages : ['/images/demo/prop-1.svg'],
    amenities,
    description: req.body.description
  });

  req.session.flash = {
    type: 'success',
    message: `Zapisano zmiany w ofercie: „${updated.title}”.`
  };
  res.redirect('/admin/nieruchomosci');
});

router.post('/nieruchomosci/:id/status', (req, res) => {
  const current = db.getPropertyById(req.params.id);
  if (!current || !canManage(current, req.session.user)) {
    req.session.flash = { type: 'error', message: 'Brak uprawnień do zmiany statusu tej oferty.' };
    return res.redirect('/admin/nieruchomosci');
  }
  if (req.body.status) {
    db.updateProperty(current.id, {
      status: req.body.status,
      featured: current.featured
    });
    req.session.flash = {
      type: 'success',
      message: `Zmieniono status oferty „${current.title}”.`
    };
  }
  res.redirect('/admin/nieruchomosci');
});

router.post('/nieruchomosci/:id/usun', (req, res) => {
  const current = db.getPropertyById(req.params.id);
  if (!current || !canManage(current, req.session.user)) {
    req.session.flash = { type: 'error', message: 'Brak uprawnień do usunięcia tej oferty.' };
    return res.redirect('/admin/nieruchomosci');
  }
  const deleted = db.deleteProperty(req.params.id);
  if (deleted) {
    (deleted.images || []).forEach((imgUrl) => removeUploadedFile(imgUrl));
    req.session.flash = {
      type: 'success',
      message: `Usunięto nieruchomość „${deleted.title}”.`
    };
  }
  res.redirect('/admin/nieruchomosci');
});

// ==================== ZARZĄDZANIE ZAKŁADKĄ OFERTA (USŁUGI – TYLKO ADMIN) ====================
router.get('/oferta', requireAdmin, (req, res) => {
  const services = db.getServices();
  const editId = req.query.edytuj ? Number(req.query.edytuj) : null;
  const editingService = editId ? db.getServiceById(editId) : null;

  res.render('admin/services-list', {
    pageTitle: 'Zarządzanie zakładką Oferta | Panel CMS',
    activeTab: 'services',
    services,
    editingService
  });
});

router.post('/oferta/nowa', requireAdmin, (req, res) => {
  const features = String(req.body.features || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  db.createService({
    title: req.body.title,
    subtitle: req.body.subtitle,
    icon: req.body.icon || 'home',
    description: req.body.description,
    features,
    order: req.body.order
  });

  req.session.flash = {
    type: 'success',
    message: 'Dodano nową usługę do zakładki Oferta.'
  };
  res.redirect('/admin/oferta');
});

router.post('/oferta/:id/edytuj', requireAdmin, (req, res) => {
  const features = String(req.body.features || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  db.updateService(req.params.id, {
    title: req.body.title,
    subtitle: req.body.subtitle,
    icon: req.body.icon,
    description: req.body.description,
    features,
    order: req.body.order
  });

  req.session.flash = {
    type: 'success',
    message: 'Zaktualizowano usługę w zakładce Oferta.'
  };
  res.redirect('/admin/oferta');
});

router.post('/oferta/:id/usun', requireAdmin, (req, res) => {
  db.deleteService(req.params.id);
  req.session.flash = {
    type: 'success',
    message: 'Usunięto wybraną usługę.'
  };
  res.redirect('/admin/oferta');
});

// ==================== ZARZĄDZANIE BLOGIEM (ADMIN I AGENT) ====================
router.get('/blog', (req, res) => {
  const isAdmin = req.session.user.role === 'admin';
  const posts = db.getPosts(isAdmin ? {} : { authorId: req.session.user.id });

  res.render('admin/blog-list', {
    pageTitle: isAdmin ? 'Zarządzanie blogiem | Panel CMS' : 'Moje artykuły na blogu | Panel Agenta',
    activeTab: 'blog',
    posts
  });
});

router.get('/blog/nowy', (req, res) => {
  const agents = db.getUsers({ activeOnly: true });
  res.render('admin/blog-form', {
    pageTitle: 'Nowy artykuł na blogu | Panel CMS',
    activeTab: 'blog',
    post: null,
    agents
  });
});

router.post('/blog/nowy', upload.single('coverImageFile'), (req, res) => {
  const isAdmin = req.session.user.role === 'admin';
  const coverImage = req.file
    ? `/uploads/${req.file.filename}`
    : (req.body.coverImageUrl || '/images/demo/blog-cover.svg');

  const authorId = isAdmin && req.body.authorId
    ? Number(req.body.authorId)
    : req.session.user.id;

  const post = db.createPost({
    authorId,
    title: req.body.title,
    category: req.body.category,
    excerpt: req.body.excerpt,
    coverImage,
    content: req.body.content,
    published: req.body.published === 'on'
  });

  req.session.flash = {
    type: 'success',
    message: `Dodano wpis na blogu: „${post.title}”.`
  };
  res.redirect('/admin/blog');
});

router.get('/blog/:id/edytuj', (req, res) => {
  const post = db.getPostById(req.params.id);
  if (!post) {
    req.session.flash = { type: 'error', message: 'Nie znaleziono artykułu.' };
    return res.redirect('/admin/blog');
  }
  if (!canManage(post, req.session.user)) {
    req.session.flash = { type: 'error', message: 'Brak uprawnień – możesz edytować wyłącznie własne artykuły.' };
    return res.redirect('/admin/blog');
  }

  const agents = db.getUsers({ activeOnly: true });
  res.render('admin/blog-form', {
    pageTitle: `Edycja wpisu: ${post.title} | Panel CMS`,
    activeTab: 'blog',
    post,
    agents
  });
});

router.post('/blog/:id/edytuj', upload.single('coverImageFile'), (req, res) => {
  const current = db.getPostById(req.params.id);
  if (!current) {
    req.session.flash = { type: 'error', message: 'Nie znaleziono artykułu.' };
    return res.redirect('/admin/blog');
  }
  if (!canManage(current, req.session.user)) {
    req.session.flash = { type: 'error', message: 'Brak uprawnień – możesz edytować wyłącznie własne artykuły.' };
    return res.redirect('/admin/blog');
  }

  const isAdmin = req.session.user.role === 'admin';
  let coverImage = current.coverImage;
  if (req.file) {
    removeUploadedFile(current.coverImage);
    coverImage = `/uploads/${req.file.filename}`;
  } else if (req.body.coverImageUrl && req.body.coverImageUrl.trim()) {
    coverImage = req.body.coverImageUrl.trim();
  }

  const authorId = isAdmin && req.body.authorId
    ? Number(req.body.authorId)
    : current.authorId;

  const updated = db.updatePost(current.id, {
    authorId,
    title: req.body.title,
    category: req.body.category,
    excerpt: req.body.excerpt,
    coverImage,
    content: req.body.content,
    published: req.body.published === 'on'
  });

  req.session.flash = {
    type: 'success',
    message: `Zaktualizowano artykuł: „${updated.title}”.`
  };
  res.redirect('/admin/blog');
});

router.post('/blog/:id/usun', (req, res) => {
  const current = db.getPostById(req.params.id);
  if (!current || !canManage(current, req.session.user)) {
    req.session.flash = { type: 'error', message: 'Brak uprawnień do usunięcia tego artykułu.' };
    return res.redirect('/admin/blog');
  }
  const deleted = db.deletePost(req.params.id);
  if (deleted) {
    removeUploadedFile(deleted.coverImage);
    req.session.flash = {
      type: 'success',
      message: `Usunięto artykuł „${deleted.title}”.`
    };
  }
  res.redirect('/admin/blog');
});

// ==================== EDYCJA TREŚCI STRON (HOME, O MNIE, KONTAKT – TYLKO ADMIN) ====================
router.get('/tresci', requireAdmin, (req, res) => {
  const settings = db.getSettings();
  res.render('admin/settings', {
    pageTitle: 'Edycja treści zakładek (O mnie, Kontakt, Strona główna) | Panel CMS',
    activeTab: 'settings',
    settings
  });
});

router.post(
  '/tresci/glowna',
  requireAdmin,
  upload.fields([
    { name: 'agentPhotoFile', maxCount: 1 },
    { name: 'heroImageFile', maxCount: 1 }
  ]),
  (req, res) => {
    const current = db.getSettings();
    let agentPhoto = current.agentPhoto;
    let heroImage = current.heroImage;

    if (req.files && req.files.agentPhotoFile && req.files.agentPhotoFile[0]) {
      removeUploadedFile(current.agentPhoto);
      agentPhoto = `/uploads/${req.files.agentPhotoFile[0].filename}`;
    }
    if (req.files && req.files.heroImageFile && req.files.heroImageFile[0]) {
      removeUploadedFile(current.heroImage);
      heroImage = `/uploads/${req.files.heroImageFile[0].filename}`;
    }

    const stats = [
      { value: req.body.stat1Value || '', label: req.body.stat1Label || '' },
      { value: req.body.stat2Value || '', label: req.body.stat2Label || '' },
      { value: req.body.stat3Value || '', label: req.body.stat3Label || '' },
      { value: req.body.stat4Value || '', label: req.body.stat4Label || '' }
    ].filter((s) => s.value || s.label);

    db.updateSettings({
      brandName: req.body.brandName || current.brandName,
      agentName: req.body.agentName || current.agentName,
      agentRole: req.body.agentRole || current.agentRole,
      licenseNumber: req.body.licenseNumber || current.licenseNumber,
      heroBadge: req.body.heroBadge || current.heroBadge,
      heroTitle: req.body.heroTitle || current.heroTitle,
      heroSubtitle: req.body.heroSubtitle || current.heroSubtitle,
      agentPhoto,
      heroImage,
      stats,
      seo: {
        siteTitle: req.body.siteTitle || current.seo?.siteTitle,
        siteDescription: req.body.siteDescription || current.seo?.siteDescription
      }
    });

    req.session.flash = {
      type: 'success',
      message: 'Zapisano zmiany na Stronie Głównej oraz w wizytówce głównej.'
    };
    res.redirect('/admin/tresci#glowna');
  }
);

router.post('/tresci/o-mnie', requireAdmin, (req, res) => {
  const current = db.getSettings();

  const values = [
    { title: req.body.val1Title || '', description: req.body.val1Desc || '' },
    { title: req.body.val2Title || '', description: req.body.val2Desc || '' },
    { title: req.body.val3Title || '', description: req.body.val3Desc || '' },
    { title: req.body.val4Title || '', description: req.body.val4Desc || '' }
  ].filter((v) => v.title);

  const nextAbout = {
    ...current.about,
    title: req.body.aboutTitle || current.about?.title,
    subtitle: req.body.aboutSubtitle || current.about?.subtitle,
    bioHtml: req.body.aboutBioHtml || current.about?.bioHtml,
    values: values.length > 0 ? values : current.about?.values
  };
  delete nextAbout.certifications;

  db.updateSettings({
    about: nextAbout
  });

  req.session.flash = {
    type: 'success',
    message: 'Zaktualizowano treść zakładki „O mnie”.'
  };
  res.redirect('/admin/tresci#o-mnie');
});

router.post('/tresci/kontakt', requireAdmin, (req, res) => {
  const current = db.getSettings();
  db.updateSettings({
    contact: {
      ...current.contact,
      phone: (req.body.phone || '').trim(),
      email: (req.body.email || '').trim(),
      address: (req.body.address || '').trim(),
      city: (req.body.city || '').trim(),
      hideOffice: Boolean(req.body.hideOffice),
      workingHours: (req.body.workingHours || '').trim(),
      facebook: (req.body.facebook || '').trim(),
      instagram: (req.body.instagram || '').trim(),
      linkedin: (req.body.linkedin || '').trim(),
      mapEmbedUrl: (req.body.mapEmbedUrl || '').trim()
    }
  });

  req.session.flash = {
    type: 'success',
    message: 'Zaktualizowano dane kontaktowe i linki społecznościowe.'
  };
  res.redirect('/admin/tresci#kontakt');
});

router.post('/tresci/konto', requireAdmin, (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  const user = db.findUserById(req.session.user.id);

  if (!user || !bcrypt.compareSync(String(currentPassword || ''), user.passwordHash)) {
    req.session.flash = {
      type: 'error',
      message: 'Obecne hasło jest nieprawidłowe.'
    };
    return res.redirect('/admin/tresci#konto');
  }

  try {
    const updated = db.updateUserCredentials(user.id, {
      username,
      newPassword
    });
    req.session.user.username = updated.username;
    req.session.flash = {
      type: 'success',
      message: 'Dane logowania zostały zaktualizowane.'
    };
  } catch (err) {
    req.session.flash = {
      type: 'error',
      message: err.message
    };
  }
  res.redirect('/admin/tresci#konto');
});

// ==================== WIADOMOŚCI Z FORMULARZA ====================
router.get('/wiadomosci', (req, res) => {
  const isAdmin = req.session.user.role === 'admin';
  const messages = db.getMessages(isAdmin ? {} : { agentId: req.session.user.id });
  res.render('admin/messages-list', {
    pageTitle: isAdmin ? 'Wszystkie zapytania od klientów | Panel CMS' : 'Moje wiadomości od klientów | Panel Agenta',
    activeTab: 'messages',
    messages
  });
});

router.post('/wiadomosci/:id/przeczytana', (req, res) => {
  const msg = db.getMessageById(req.params.id);
  if (msg && canManage(msg, req.session.user)) {
    const nextState = req.body.read === 'true';
    db.markMessageRead(req.params.id, nextState);
  }
  res.redirect('/admin/wiadomosci');
});

router.post('/wiadomosci/:id/usun', (req, res) => {
  const msg = db.getMessageById(req.params.id);
  if (msg && canManage(msg, req.session.user)) {
    db.deleteMessage(req.params.id);
    req.session.flash = {
      type: 'success',
      message: 'Wiadomość została usunięta.'
    };
  }
  res.redirect('/admin/wiadomosci');
});

module.exports = router;
