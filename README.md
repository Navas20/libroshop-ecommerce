# LibroShop — E-commerce de Libros

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](https://github.com/Navas20/libroshop-ecommerce)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)](https://mysql.com)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-95-success)](https://developers.google.com/web/tools/lighthouse)

E-commerce completo con carrito, catálogo de libros, pagos integrados con Wompi y panel de administración.

## Tech Stack

| Frontend | Backend | Pagos | Testing |
|---|---|---|---|
| React 18 + Vite | Express.js | Wompi (HMAC SHA-256) | Jest + Supertest |
| CSS Modules | MySQL 8.0 | Doble verificación | Security suite |
| Context API | JWT access/refresh | | Lighthouse 95+ |

## Características

- 20+ endpoints REST con Swagger/OpenAPI
- Autenticación JWT con access + refresh tokens y verificación por email
- Pagos Wompi con firma HMAC SHA-256 y verificación de doble capa
- Protección CSRF, sanitización SQL injection, rate limiting
- Suite de seguridad automatizada con Jest + Supertest
- Lighthouse 95+ (Performance, Accessibility, Best Practices, SEO)

## Seguridad

```
✓ CSRF protection
✓ SQL injection prevention
✓ XSS sanitization
✓ Rate limiting
✓ JWT with bcrypt
✓ Email verification
✓ HMAC SHA-256 payment integrity
✓ Helmet.js headers
```

## Instalación

```bash
cd backend && npm install && cp .env.example .env
npm run migrate && npm run dev

cd frontend && npm install && npm run dev
```

## Demo

[🔗 Ver demo en Vercel](https://libroshop-ecommerce.vercel.app)
