const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(5000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(3306),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  WOMPI_PUBLIC_KEY: Joi.string().default('pub_test_default'),
  WOMPI_PRIVATE_KEY: Joi.string().default('prv_test_default'),
  WOMPI_INTEGRITY_KEY: Joi.string().default('test_integrity_default'),

  SMTP_HOST: Joi.string().default('smtp-relay.brevo.com'),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().default('noreply@example.com'),
  SMTP_PASS: Joi.string().default('default_password'),
  EMAIL_FROM: Joi.string().default('LibroShop <noreply@libroshop.com>'),

  FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info')
}).unknown();

function validateEnv() {
  const { error, value } = envSchema.validate(process.env, { abortEarly: false });

  if (error) {
    console.error('\n========================================');
    console.error('  ERROR: Variables de entorno inválidas');
    console.error('========================================\n');
    error.details.forEach((detail) => {
      console.error(`  - ${detail.message}`);
    });
    console.error('\nRevisa tu archivo .env y corrige los valores faltantes o incorrectos.\n');
    process.exit(1);
  }

  return value;
}

module.exports = validateEnv;
