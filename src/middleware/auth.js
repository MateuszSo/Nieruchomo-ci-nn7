const db = require('../config/db');

/**
 * Sprawdza, czy dany użytkownik może edytować/usunąć dany zasób (nieruchomość, wpis na blogu, wiadomość)
 */
function canManage(resource, user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const ownerId = resource?.authorId ?? resource?.agentId ?? 1;
  return Number(ownerId) === Number(user.id);
}

/**
 * Middleware chroniący trasy panelu (/admin) – wymaga aktywnego konta admin lub agent
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    req.session.flash = {
      type: 'error',
      message: 'Zaloguj się, aby uzyskać dostęp do panelu zarządzania.'
    };
    return res.redirect('/admin/login');
  }

  const freshUser = db.findUserById(req.session.user.id);
  if (!freshUser || freshUser.active === false) {
    return req.session.destroy(() => {
      res.redirect('/admin/login');
    });
  }

  // Odśwież dane w sesji i widokach (np. jeśli admin zmienił rolę użytkownika)
  req.session.user = {
    id: freshUser.id,
    username: freshUser.username,
    name: freshUser.name,
    role: freshUser.role || 'agent',
    avatar: freshUser.avatar
  };
  res.locals.currentUser = req.session.user;

  return next();
}

/**
 * Middleware chroniący trasy dostępne wyłącznie dla głównego właściciela (rola: admin)
 */
function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  req.session.flash = {
    type: 'error',
    message: 'Brak uprawnień. Ta sekcja jest dostępna wyłącznie dla Administratora (Właściciela strony).'
  };
  return res.redirect('/admin');
}

module.exports = {
  requireAuth,
  requireAdmin,
  canManage
};
