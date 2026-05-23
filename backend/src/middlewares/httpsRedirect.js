function httpsRedirect(req, res, next) {
  // Render ya maneja HTTPS automáticamente, no necesitamos redirigir
  // Solo redirigir en desarrollo local si es necesario
  if (process.env.NODE_ENV === 'production') {
    return next();
  }
  
  if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
}

module.exports = httpsRedirect;
