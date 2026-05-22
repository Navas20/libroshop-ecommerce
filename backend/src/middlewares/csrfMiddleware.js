const crypto = require('crypto');

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// Rutas que NO requieren CSRF (webhooks externos)
const CSRF_EXEMPT_PATHS = [
  '/api/payment/webhook'
];

function csrfMiddleware(req, res, next) {
  // Excluir webhooks de validación CSRF
  if (CSRF_EXEMPT_PATHS.some(path => req.path === path)) {
    return next();
  }

  if (SAFE_METHODS.includes(req.method)) {
    const token = crypto.randomBytes(32).toString('hex');
    const cookieOptions = {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    };
    res.cookie('XSRF-TOKEN', token, cookieOptions);
    return next();
  }

  const cookieToken = req.cookies && req.cookies['XSRF-TOKEN'];
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({ success: false, error: 'Token CSRF requerido' });
  }

  if (cookieToken !== headerToken) {
    return res.status(403).json({ success: false, error: 'Token CSRF inválido' });
  }

  next();
}

module.exports = csrfMiddleware;
