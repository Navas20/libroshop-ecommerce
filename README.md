# 📚 LibroShop - E-commerce de Libros

> Plataforma completa de comercio electrónico con integración de pagos Wompi y catálogo de Open Library

[![Security](https://img.shields.io/badge/security-hardened-green.svg)](./SECURITY_CHECKLIST.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

---

## 🚀 Características

### Para Usuarios
- 📖 **Catálogo extenso**: Miles de libros de Open Library
- 🔍 **Búsqueda avanzada**: Filtros por categoría, precio, relevancia
- 🛒 **Carrito inteligente**: Gestión de productos con descuentos automáticos
- 💳 **Pagos seguros**: Integración con Wompi (tarjetas y PSE)
- 📧 **Notificaciones**: Emails de confirmación y verificación
- 📱 **Responsive**: Optimizado para móvil, tablet y desktop
- 🔐 **Autenticación robusta**: JWT con refresh tokens

### Para Desarrolladores
- ⚡ **Stack moderno**: React 18 + Node.js + Express + MySQL
- 🔒 **Seguridad empresarial**: CSRF, rate limiting, sanitización, Helmet
- 📊 **Logging completo**: Winston con niveles configurables
- 🧪 **Testing automatizado**: Script de pruebas de seguridad incluido
- 📝 **Documentación exhaustiva**: Guías de deployment y seguridad
- 🐳 **Docker ready**: Fácil containerización

---

## 📋 Requisitos

- **Node.js**: >= 18.0.0
- **MySQL**: >= 8.0
- **npm**: >= 9.0.0

---

## 🛠️ Instalación Rápida

### 1. Clonar Repositorio

```bash
git clone https://github.com/tu-usuario/libreria-app.git
cd libreria-app
```

### 2. Configurar Backend

```bash
cd backend
npm install

# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
nano .env

# Ejecutar migraciones
npm run migrate

# Iniciar servidor
npm start
```

### 3. Configurar Frontend

```bash
cd ../frontend
npm install

# Crear archivo .env
echo "VITE_API_URL=http://localhost:5000" > .env
echo "VITE_WOMPI_PUBLIC_KEY=pub_test_XXXXXXXX" >> .env

# Iniciar desarrollo
npm run dev
```

### 4. Acceder a la Aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

---

## 📁 Estructura del Proyecto

```
libreria-app/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuraciones (DB, JWT, Wompi)
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── middlewares/     # Seguridad y validación
│   │   ├── routes/          # Definición de endpoints
│   │   ├── migrations/      # Scripts SQL
│   │   └── utils/           # Utilidades (email, logger, etc.)
│   ├── server.js            # Punto de entrada
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── context/         # Context API (Auth, Cart)
│   │   ├── pages/           # Páginas de la app
│   │   ├── services/        # Llamadas a API
│   │   └── utils/           # Utilidades
│   ├── index.html
│   └── package.json
│
├── .gitignore               # ✅ Archivos a ignorar
├── security-test.js         # ✅ Pruebas de seguridad
├── SECURITY_CHECKLIST.md    # ✅ Checklist de seguridad
├── WOMPI_PRODUCTION_GUIDE.md # ✅ Guía de Wompi
├── DEPLOYMENT_GUIDE.md      # ✅ Guía de deployment
└── README.md                # Este archivo
```

---

## 🔐 Seguridad

Este proyecto implementa múltiples capas de seguridad:

### Autenticación
- ✅ JWT con access y refresh tokens
- ✅ Tokens hasheados en base de datos
- ✅ Bloqueo de cuenta tras 5 intentos fallidos
- ✅ Verificación de email obligatoria
- ✅ Recuperación de contraseña segura

### Protección de Datos
- ✅ Sanitización de inputs (sanitize-html)
- ✅ Validación con express-validator y Joi
- ✅ Prepared statements (prevención SQL injection)
- ✅ CSRF protection con tokens
- ✅ Rate limiting (global y por endpoint)

### Headers de Seguridad
- ✅ Helmet configurado
- ✅ CORS restrictivo
- ✅ HTTPS redirect en producción
- ✅ Cookie flags (httpOnly, secure, sameSite)

### Pagos
- ✅ Verificación de firmas Wompi (HMAC SHA-256)
- ✅ Doble verificación con API de Wompi
- ✅ Whitelist de IPs para webhooks
- ✅ Validación de montos
- ✅ Logs de auditoría

**Ver más**: [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)

---

## 🧪 Testing

### Pruebas de Seguridad Automatizadas

```bash
# Ejecutar todas las pruebas
node security-test.js

# Probar contra servidor específico
TEST_URL=https://tudominio.com node security-test.js
```

Pruebas incluidas:
- ✅ SQL Injection
- ✅ XSS (Cross-Site Scripting)
- ✅ CSRF
- ✅ Rate Limiting
- ✅ Auth Bypass
- ✅ Input Validation
- ✅ Security Headers
- ✅ Payment Security

---

## 📚 API Endpoints

### Autenticación (`/api/auth`)
```
POST   /register          # Registrar usuario
POST   /login             # Iniciar sesión
POST   /refresh           # Renovar token
POST   /logout            # Cerrar sesión
GET    /me                # Perfil del usuario
POST   /verify-email      # Verificar email
POST   /forgot-password   # Solicitar reset
POST   /reset-password    # Cambiar contraseña
```

### Libros (`/api/books`)
```
GET    /search            # Buscar libros
GET    /featured          # Libros destacados
GET    /:key              # Detalle de libro
```

### Carrito (`/api/cart`) - Requiere Auth
```
GET    /                  # Obtener carrito
POST   /                  # Agregar item
PUT    /:id               # Actualizar cantidad
DELETE /:id               # Eliminar item
DELETE /                  # Vaciar carrito
```

### Órdenes (`/api/orders`) - Requiere Auth
```
POST   /                  # Crear orden
GET    /                  # Listar órdenes
GET    /:id               # Detalle de orden
```

### Pagos (`/api/payment`)
```
POST   /create            # Crear transacción (Auth)
POST   /webhook           # Webhook de Wompi
GET    /status/:ref       # Estado de pago (Auth)
```

**Ver documentación completa**: [API.md](./API.md) _(crear si necesario)_

---

## 🚀 Deployment

### Opción 1: VPS (Recomendado)
- Control total
- Mejor performance
- Más económico a largo plazo

### Opción 2: Heroku
- Deployment automático
- Fácil escalamiento
- Ideal para MVP

### Opción 3: Vercel + Railway
- Moderno y rápido
- Edge network global
- CI/CD integrado

**Ver guía completa**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 💳 Configurar Wompi

### Desarrollo (Sandbox)

1. Obtener credenciales de prueba en https://comercios.wompi.co/
2. Configurar en `.env`:
```bash
WOMPI_PUBLIC_KEY=pub_test_XXXXXXXX
WOMPI_PRIVATE_KEY=prv_test_XXXXXXXX
WOMPI_INTEGRITY_KEY=test_integrity_XXXXXXXX
```

3. Usar tarjetas de prueba:
   - **Aprobada**: 4242 4242 4242 4242
   - **Rechazada**: 4111 1111 1111 1111

### Producción

**Ver guía completa**: [WOMPI_PRODUCTION_GUIDE.md](./WOMPI_PRODUCTION_GUIDE.md)

---

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar credenciales en .env
```

### Error: "CSRF token required"
```bash
# Asegurarse de que el frontend envíe el header X-CSRF-Token
# Ver: frontend/src/services/api.js
```

### Error: "Webhook not received"
```bash
# Verificar URL configurada en Wompi
# Verificar logs: pm2 logs libroshop-backend
# Verificar firewall permite IPs de Wompi
```

**Ver más**: [DEPLOYMENT_GUIDE.md#troubleshooting](./DEPLOYMENT_GUIDE.md#troubleshooting)

---

## 📊 Monitoreo

### Métricas Clave

- **Uptime**: Objetivo 99.9%
- **Response Time**: <500ms
- **Error Rate**: <1%
- **Payment Success**: >80%

### Herramientas Recomendadas

- **Uptime**: UptimeRobot (gratis)
- **Errors**: Sentry
- **Analytics**: Google Analytics
- **Logs**: Winston + LogDNA

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Tu Nombre**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- Email: tu@email.com

---

## 🙏 Agradecimientos

- [Open Library](https://openlibrary.org/) - API de libros
- [Wompi](https://wompi.co/) - Pasarela de pagos
- [React](https://react.dev/) - Framework frontend
- [Express](https://expressjs.com/) - Framework backend

---

## 📞 Soporte

¿Necesitas ayuda?

1. Revisa la [documentación](./SECURITY_CHECKLIST.md)
2. Busca en [Issues](https://github.com/tu-usuario/libreria-app/issues)
3. Crea un [nuevo Issue](https://github.com/tu-usuario/libreria-app/issues/new)

---

## 🗺️ Roadmap

### v1.0 (Actual)
- ✅ Catálogo de libros
- ✅ Carrito de compras
- ✅ Pagos con Wompi
- ✅ Autenticación JWT
- ✅ Seguridad empresarial

### v1.1 (Próximo)
- [ ] Panel de administración
- [ ] Sistema de reseñas
- [ ] Wishlist
- [ ] Recomendaciones personalizadas
- [ ] Notificaciones push

### v2.0 (Futuro)
- [ ] App móvil (React Native)
- [ ] Programa de afiliados
- [ ] Libros digitales (ebooks)
- [ ] Suscripción mensual
- [ ] Multi-idioma

---

## ⚡ Performance

- **Lighthouse Score**: 95+
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s
- **Bundle Size**: <500KB

---

## 🌟 Características Destacadas

### Para el Negocio
- 💰 Comisión Wompi: 2.99% + $900 COP
- 📈 Escalable a miles de usuarios
- 🔄 Actualizaciones automáticas de inventario
- 📊 Dashboard de métricas (próximamente)

### Para Desarrolladores
- 🎨 Código limpio y documentado
- 🧩 Arquitectura modular
- 🔧 Fácil de extender
- 📦 Dependencias mínimas

---

<div align="center">

**⭐ Si este proyecto te fue útil, considera darle una estrella ⭐**

[Reportar Bug](https://github.com/tu-usuario/libreria-app/issues) · [Solicitar Feature](https://github.com/tu-usuario/libreria-app/issues) · [Documentación](./SECURITY_CHECKLIST.md)

</div>
