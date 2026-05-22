0# 🔒 CHECKLIST DE SEGURIDAD PARA PRODUCCIÓN - LibroShop

## ✅ VULNERABILIDADES CORREGIDAS

- [x] Agregado `.gitignore` para proteger archivos sensibles
- [x] Corregido CSRF middleware con excepciones para webhooks
- [x] Agregado validador de IPs para webhooks de Wompi
- [x] Mejorada validación de entrada en búsquedas
- [x] Agregado rate limiting específico para pagos
- [x] Agregada validación de montos en transacciones
- [x] Agregado timeout en polling de pagos (frontend)

---

## 🚨 ACCIONES CRÍTICAS ANTES DE PRODUCCIÓN

### 1. GESTIÓN DE SECRETOS (URGENTE)

#### ❌ NUNCA hacer:
```bash
git add backend/.env
git add frontend/.env
```

#### ✅ Hacer AHORA:
```bash
# Si ya commiteaste los .env, eliminarlos del historial:
git rm --cached backend/.env
git rm --cached frontend/.env
git commit -m "Remove sensitive files"

# Rotar TODAS las credenciales expuestas:
# - Cambiar contraseñas de base de datos
# - Regenerar JWT_SECRET y JWT_REFRESH_SECRET
# - Obtener nuevas credenciales de Wompi
# - Cambiar contraseñas de SMTP
```

#### ✅ Usar variables de entorno en producción:
- **Heroku**: Settings → Config Vars
- **AWS**: Systems Manager Parameter Store
- **DigitalOcean**: App Platform → Environment Variables
- **Vercel**: Settings → Environment Variables

---

### 2. BASE DE DATOS

#### ✅ Configuración de Producción:

```sql
-- Crear usuario específico con permisos limitados
CREATE USER 'libroshop_app'@'%' IDENTIFIED BY 'PASSWORD_SUPER_SEGURO_AQUI';

-- Dar solo permisos necesarios (NO root)
GRANT SELECT, INSERT, UPDATE, DELETE ON libreria_db.* TO 'libroshop_app'@'%';
FLUSH PRIVILEGES;

-- Habilitar SSL para conexiones
-- En tu proveedor de DB (AWS RDS, DigitalOcean, etc.)
```

#### ✅ Backups Automáticos:
```bash
# Configurar backups diarios
# AWS RDS: Automated Backups (7-35 días)
# DigitalOcean: Daily Backups
# Manual: cron job con mysqldump
```

#### ✅ Índices adicionales para performance:
```sql
-- Optimizar consultas frecuentes
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_cart_user_created ON cart_items(user_id, created_at DESC);
CREATE INDEX idx_security_logs_created ON security_logs(created_at DESC);
```

---

### 3. WOMPI - CONFIGURACIÓN DE PRODUCCIÓN

#### ✅ Obtener credenciales de PRODUCCIÓN:
1. Ir a https://comercios.wompi.co/
2. Completar proceso de verificación de negocio
3. Obtener:
   - `WOMPI_PUBLIC_KEY` (prod_pub_...)
   - `WOMPI_PRIVATE_KEY` (prod_prv_...)
   - `WOMPI_INTEGRITY_KEY` (prod_integrity_...)

#### ✅ Configurar Webhook en Wompi:
```
URL: https://tudominio.com/api/payment/webhook
Eventos: transaction.updated
```

#### ✅ Whitelist de IPs de Wompi:
```javascript
// Actualizar en: backend/src/middlewares/wompiWebhookValidator.js
const WOMPI_IPS = [
  '34.83.123.45',    // IP 1 de Wompi (ejemplo)
  '35.184.45.67',    // IP 2 de Wompi (ejemplo)
  // Solicitar IPs reales a soporte de Wompi
];
```

#### ✅ Probar en Sandbox primero:
```bash
# Usar tarjetas de prueba de Wompi:
# Aprobada: 4242 4242 4242 4242
# Rechazada: 4111 1111 1111 1111
```

---

### 4. SSL/TLS (HTTPS)

#### ✅ Obtener certificado SSL:

**Opción 1: Let's Encrypt (GRATIS)**
```bash
# Con Certbot
sudo apt-get install certbot
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

**Opción 2: Cloudflare (GRATIS + CDN)**
- Agregar dominio a Cloudflare
- Activar SSL/TLS → Full (strict)
- Activar Always Use HTTPS

**Opción 3: Proveedor de hosting**
- Heroku: SSL automático
- Vercel: SSL automático
- DigitalOcean: Let's Encrypt integrado

#### ✅ Configurar HSTS:
```javascript
// En backend/src/app.js
app.use(helmet({
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  }
}));
```

---

### 5. CORS - CONFIGURACIÓN ESTRICTA

#### ✅ Actualizar en producción:
```javascript
// backend/src/app.js
app.use(cors({
  origin: [
    'https://tudominio.com',
    'https://www.tudominio.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400 // 24 horas
}));
```

---

### 6. RATE LIMITING AVANZADO

#### ✅ Usar Redis para rate limiting distribuido:
```bash
npm install rate-limit-redis redis
```

```javascript
// backend/src/middlewares/rateLimiter.js
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

const globalLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'rl:global:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

---

### 7. LOGGING Y MONITOREO

#### ✅ Implementar logging centralizado:

**Opción 1: Sentry (Errores)**
```bash
npm install @sentry/node
```

```javascript
// backend/server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Opción 2: LogDNA / Datadog / New Relic**

#### ✅ Monitoreo de uptime:
- UptimeRobot (gratis)
- Pingdom
- StatusCake

#### ✅ Alertas críticas:
```javascript
// Enviar email/SMS cuando:
// - Servidor caído
// - Errores 500 > 10/min
// - Pagos fallidos > 50%
// - Intentos de login fallidos > 100/hora
```

---

### 8. HEADERS DE SEGURIDAD

#### ✅ Configuración completa de Helmet:
```javascript
// backend/src/app.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://checkout.wompi.co"],
      frameSrc: ["'self'", "https://checkout.wompi.co"],
      imgSrc: ["'self'", "https://covers.openlibrary.org", "data:", "https:"],
      connectSrc: ["'self'", "https://production.wompi.co"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

---

### 9. VALIDACIÓN DE ENTRADA COMPLETA

#### ✅ Agregar validación en TODOS los endpoints:
```javascript
// Ejemplo: backend/src/routes/orderRoutes.js
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

router.post('/', [
  body('nombre_destinatario').trim().isLength({ min: 2, max: 100 }),
  body('email_destinatario').isEmail(),
  body('direccion').trim().isLength({ min: 5, max: 500 }),
  body('ciudad').trim().isLength({ min: 2, max: 100 }),
  validateRequest
], orderController.createOrder);
```

---

### 10. PRUEBAS DE PENETRACIÓN

#### ✅ Herramientas para testing:

**Automatizadas:**
```bash
# OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://tudominio.com

# Nikto
nikto -h https://tudominio.com

# SQLMap (SQL Injection)
sqlmap -u "https://tudominio.com/api/books/search?q=test" --batch

# Burp Suite Community Edition
# https://portswigger.net/burp/communitydownload
```

**Manuales:**
1. **SQL Injection**: Probar `' OR '1'='1` en todos los inputs
2. **XSS**: Probar `<script>alert('XSS')</script>` en formularios
3. **CSRF**: Intentar hacer requests sin token CSRF
4. **Auth Bypass**: Intentar acceder a rutas protegidas sin token
5. **Rate Limiting**: Hacer 1000 requests rápidas
6. **File Upload**: Intentar subir archivos maliciosos (si aplica)

#### ✅ Checklist de pruebas:
- [ ] Intentar login con credenciales incorrectas 10 veces
- [ ] Intentar crear orden sin autenticación
- [ ] Intentar modificar monto de pago en el cliente
- [ ] Enviar webhook falso a `/api/payment/webhook`
- [ ] Intentar SQL injection en búsqueda
- [ ] Intentar XSS en formularios
- [ ] Verificar que HTTPS redirecciona correctamente
- [ ] Verificar que cookies tienen flags `httpOnly` y `secure`
- [ ] Intentar acceso a archivos sensibles (/.env, /config)

---

### 11. PERFORMANCE Y ESCALABILIDAD

#### ✅ Caché de búsquedas:
```bash
npm install node-cache
```

```javascript
// backend/src/controllers/bookController.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hora

exports.search = async (req, res, next) => {
  const cacheKey = `search:${req.query.q}:${req.query.page}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return res.json(cached);
  }
  
  // ... búsqueda normal ...
  
  cache.set(cacheKey, result);
  res.json(result);
};
```

#### ✅ Compresión de respuestas:
```bash
npm install compression
```

```javascript
// backend/src/app.js
const compression = require('compression');
app.use(compression());
```

#### ✅ CDN para assets estáticos:
- Cloudflare (gratis)
- AWS CloudFront
- Vercel Edge Network

---

### 12. CUMPLIMIENTO LEGAL

#### ✅ Páginas legales requeridas:
- [ ] Términos y Condiciones
- [ ] Política de Privacidad (GDPR/CCPA)
- [ ] Política de Cookies
- [ ] Política de Devoluciones
- [ ] Aviso Legal

#### ✅ GDPR (si tienes usuarios europeos):
- [ ] Consentimiento explícito para cookies
- [ ] Derecho al olvido (eliminar cuenta)
- [ ] Exportar datos del usuario
- [ ] Notificación de brechas de seguridad (72h)

---

### 13. DEPLOYMENT

#### ✅ Variables de entorno de producción:
```bash
NODE_ENV=production
PORT=5000

# Base de datos
DB_HOST=tu-db-host.com
DB_PORT=3306
DB_USER=libroshop_app
DB_PASSWORD=PASSWORD_SUPER_SEGURO
DB_NAME=libreria_db

# JWT (generar con: openssl rand -base64 64)
JWT_SECRET=tu_secret_super_largo_minimo_64_caracteres_aleatorios
JWT_REFRESH_SECRET=otro_secret_diferente_minimo_64_caracteres
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Wompi PRODUCCIÓN
WOMPI_PUBLIC_KEY=prod_pub_XXXXXXXXXXXXXXXX
WOMPI_PRIVATE_KEY=prod_prv_XXXXXXXXXXXXXXXX
WOMPI_INTEGRITY_KEY=prod_integrity_XXXXXXXXXXXXXXXX

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_app_password
EMAIL_FROM=noreply@tudominio.com

# URLs
FRONTEND_URL=https://tudominio.com

# Logging
LOG_LEVEL=info
```

#### ✅ Proceso de deployment:
```bash
# 1. Build del frontend
cd frontend
npm run build

# 2. Subir a servidor
# Opción A: FTP/SFTP
# Opción B: Git push (Heroku, Vercel)
# Opción C: Docker

# 3. Ejecutar migraciones
cd backend
npm run migrate

# 4. Iniciar servidor con PM2
npm install -g pm2
pm2 start server.js --name libroshop
pm2 startup
pm2 save

# 5. Configurar Nginx como reverse proxy
```

#### ✅ Configuración de Nginx:
```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/libroshop/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### 14. MONITOREO POST-LANZAMIENTO

#### ✅ Métricas a monitorear:
- [ ] Uptime (objetivo: 99.9%)
- [ ] Tiempo de respuesta (objetivo: <500ms)
- [ ] Tasa de error (objetivo: <1%)
- [ ] Conversión de pagos (objetivo: >80%)
- [ ] Usuarios activos
- [ ] Transacciones por hora

#### ✅ Alertas configuradas:
- [ ] Servidor caído (email + SMS)
- [ ] CPU > 80% por 5 minutos
- [ ] Memoria > 90%
- [ ] Disco > 85%
- [ ] Errores 500 > 10/minuto
- [ ] Pagos fallidos > 50%

---

## 🎯 CHECKLIST FINAL ANTES DE LANZAR

### Seguridad
- [ ] `.gitignore` configurado correctamente
- [ ] Archivos `.env` NO están en Git
- [ ] Todas las credenciales rotadas
- [ ] HTTPS configurado y funcionando
- [ ] Certificado SSL válido
- [ ] CORS configurado para dominio de producción
- [ ] Rate limiting activo
- [ ] CSRF protection activo
- [ ] Helmet configurado
- [ ] Validación de entrada en todos los endpoints
- [ ] Webhooks de Wompi con whitelist de IPs
- [ ] Logs de seguridad funcionando

### Base de Datos
- [ ] Usuario de DB con permisos limitados
- [ ] Backups automáticos configurados
- [ ] Índices optimizados
- [ ] SSL habilitado para conexiones

### Wompi
- [ ] Credenciales de PRODUCCIÓN obtenidas
- [ ] Webhook configurado en panel de Wompi
- [ ] Probado con tarjetas de prueba
- [ ] Verificación de firmas funcionando

### Performance
- [ ] Compresión gzip activa
- [ ] Caché de búsquedas implementado
- [ ] CDN configurado (opcional)
- [ ] Imágenes optimizadas

### Monitoreo
- [ ] Sentry o similar configurado
- [ ] Uptime monitoring activo
- [ ] Alertas configuradas
- [ ] Logs centralizados

### Legal
- [ ] Términos y Condiciones publicados
- [ ] Política de Privacidad publicada
- [ ] Política de Cookies publicada

### Testing
- [ ] Pruebas de penetración realizadas
- [ ] Vulnerabilidades críticas corregidas
- [ ] Flujo completo de compra probado
- [ ] Webhooks de Wompi probados
- [ ] Emails de verificación funcionando

---

## 🚀 LISTO PARA PRODUCCIÓN

Una vez completado este checklist, tu aplicación estará lista para:
- ✅ Resistir pruebas de penetración básicas
- ✅ Procesar pagos reales de forma segura
- ✅ Escalar a miles de usuarios
- ✅ Cumplir con estándares de seguridad

**Última recomendación**: Contrata un pentest profesional antes del lanzamiento oficial.

---

## 📞 RECURSOS ÚTILES

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Wompi Docs**: https://docs.wompi.co/
- **Let's Encrypt**: https://letsencrypt.org/
- **Sentry**: https://sentry.io/
- **UptimeRobot**: https://uptimerobot.com/
