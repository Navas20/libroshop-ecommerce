const sanitizeHtml = require('sanitize-html');

const ALLOWED = { allowedTags: [], allowedAttributes: {} };

function sanitizeMiddleware(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return;

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeHtml(obj[key], ALLOWED).trim();
    } else if (Array.isArray(obj[key])) {
      obj[key].forEach((item, index) => {
        if (typeof item === 'string') {
          obj[key][index] = sanitizeHtml(item, ALLOWED).trim();
        } else if (typeof item === 'object') {
          sanitizeObject(item);
        }
      });
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
}

module.exports = sanitizeMiddleware;
