const logger = require('../utils/logger');

// IPs oficiales de Wompi (actualizar según documentación oficial)
const WOMPI_IPS = [
  '::1', // localhost para testing
  '127.0.0.1', // localhost para testing
  // Agregar IPs reales de Wompi en producción
  // Ejemplo: '34.83.123.45', '35.184.45.67'
];

function wompiWebhookValidator(req, res, next) {
  // En desarrollo, permitir todas las IPs
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const clientIp = req.ip || req.connection.remoteAddress;
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIp = forwardedFor ? forwardedFor.split(',')[0].trim() : clientIp;

  // Normalizar IPv6 localhost
  const normalizedIp = realIp === '::ffff:127.0.0.1' ? '127.0.0.1' : realIp;

  if (!WOMPI_IPS.includes(normalizedIp)) {
    logger.warn(`Webhook rechazado desde IP no autorizada: ${normalizedIp}`, {
      headers: req.headers,
      body: req.body
    });

    // Registrar intento sospechoso
    const pool = require('../config/db');
    pool.execute(
      'INSERT INTO security_logs (user_id, event_type, ip_address, user_agent, details) VALUES (NULL, ?, ?, ?, ?)',
      ['WEBHOOK_UNAUTHORIZED_IP', normalizedIp, req.get('User-Agent'), `Intento de webhook desde IP no autorizada`]
    ).catch(err => logger.error(`Error logging security event: ${err.message}`));

    return res.status(403).json({ 
      success: false, 
      error: 'IP no autorizada para webhooks' 
    });
  }

  next();
}

module.exports = wompiWebhookValidator;
