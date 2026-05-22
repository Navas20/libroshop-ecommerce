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

  WOMPI_PUBLIC_KEY: Joi.string().required(),
  WOMPI_PRIVATE_KEY: Joi.string().required(),
  WOMPI_INTEGRITY_KEY: Joi.string().required(),

  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().email().required(),
  SMTP_PASS: Joi.string().required(),
  EMAIL_FROM: Joi.string().email().required(),

  FRONTEND_URL: Joi.string().uri().required(),

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
