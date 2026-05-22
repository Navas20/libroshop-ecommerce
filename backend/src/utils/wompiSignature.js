const crypto = require('crypto');
const wompiConfig = require('../config/wompi');

function verifyWompiSignature(payload, signature) {
  if (!payload || !signature) return false;

  const properties = [
    payload.id,
    payload.amount_in_cents,
    payload.reference,
    payload.currency,
    payload.sign
  ].filter(Boolean);

  const raw = properties.join('');
  const hash = crypto.createHash('sha256').update(raw + wompiConfig.integrityKey).digest('hex');

  return hash === signature;
}

function generateIntegritySignature(reference, amountInCents, currency) {
  const raw = `${reference}${amountInCents}${currency}${wompiConfig.integrityKey}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

module.exports = { verifyWompiSignature, generateIntegritySignature };
