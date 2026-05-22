const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Demasiados intentos de autenticación. Intenta de nuevo más tarde.'
  }
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Máximo 10 intentos de pago por hora
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Demasiados intentos de pago. Intenta de nuevo más tarde.'
  },
  skipSuccessfulRequests: true // No contar requests exitosos
});

const searchSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 20,
  delayMs: 500,
  message: {
    success: false,
    error: 'Demasiadas solicitudes de búsqueda. Reduciendo velocidad.'
  }
});

module.exports = { globalLimiter, authLimiter, paymentLimiter, searchSlowDown };
