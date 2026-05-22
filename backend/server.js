require('dotenv').config();
const validateEnv = require('./src/middlewares/validateEnv');
validateEnv();

const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Servidor iniciado en puerto ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
