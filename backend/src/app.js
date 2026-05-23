const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const morgan = require('morgan');
const httpsRedirect = require('./middlewares/httpsRedirect');
const rateLimiter = require('./middlewares/rateLimiter');
const sanitize = require('./middlewares/sanitize');
const csrfMiddleware = require('./middlewares/csrfMiddleware');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// CORS debe ir PRIMERO para manejar preflight requests
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Wompi-Signature', 'X-Signature']
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://checkout.wompi.co"],
      frameSrc: ["'self'", "https://checkout.wompi.co"],
      imgSrc: ["'self'", "https://covers.openlibrary.org", "https://checkout.wompi.co"],
      connectSrc: ["'self'", "https://sandbox.wompi.co", "https://production.wompi.co"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

app.use(httpsRedirect);

app.use(rateLimiter.globalLimiter);

app.use(cookieParser());

app.use(express.json({ limit: '10kb' }));

app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(sanitize);

app.use(hpp());

app.use(csrfMiddleware);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

app.use(errorHandler);

module.exports = app;
