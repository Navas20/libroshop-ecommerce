module.exports = {
  publicKey: process.env.WOMPI_PUBLIC_KEY,
  privateKey: process.env.WOMPI_PRIVATE_KEY,
  integrityKey: process.env.WOMPI_INTEGRITY_KEY,
  sandboxUrl: 'https://sandbox.wompi.co/v1',
  productionUrl: 'https://production.wompi.co/v1',
  baseUrl: process.env.NODE_ENV === 'production'
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1'
};
