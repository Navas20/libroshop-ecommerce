# 🆓 GUÍA COMPLETA: Deployment 100% GRATUITO

> **Última actualización**: Mayo 2026  
> **Objetivo**: Subir LibroShop a internet sin gastar un solo peso

---

## 📊 RESUMEN EJECUTIVO

| Servicio | Proveedor | Costo | Límites |
|----------|-----------|-------|---------|
| **Backend** | Render.com | $0 | 750 hrs/mes |
| **Frontend** | Vercel | $0 | 100GB bandwidth |
| **Base de Datos** | Aiven MySQL | $0 | 1GB RAM, ilimitado |
| **Dominio** | Subdominios gratis | $0 | .onrender.com, .vercel.app |
| **SSL/HTTPS** | Automático | $0 | Incluido |
| **Email SMTP** | Brevo | $0 | 9,000 emails/mes |
| **Monitoreo** | UptimeRobot | $0 | 50 monitores |
| **CDN** | Cloudflare | $0 | Ilimitado |
| **Wompi** | Wompi.co | $0 | Solo comisión 2.99% |

**TOTAL: $0/mes** 🎉

---

## 🚀 OPCIÓN RECOMENDADA: Stack Gratuito Completo

### Stack Elegido:
- **Backend**: Render.com (Free Tier)
- **Frontend**: Vercel (Hobby Plan)
- **Base de Datos**: Aiven MySQL (Free Tier)
- **Email**: Brevo (Free Plan)
- **Dominio**: Subdominio gratis (.vercel.app)
- **SSL**: Automático (incluido)

---

## 📝 PASO 1: Base de Datos MySQL Gratis (Aiven)

### ¿Por qué Aiven?
- ✅ **100% GRATIS para siempre**
- ✅ 1 CPU + 1GB RAM
- ✅ Sin límite de tiempo
- ✅ Backups automáticos
- ✅ SSL incluido
- ✅ No requiere tarjeta de crédito

### Crear Cuenta en Aiven

1. **Ir a**: https://aiven.io/free-mysql-database
2. **Clic en**: "Start Free"
3. **Registrarse con**:
   - Email
   - Google
   - GitHub

4. **Crear servicio MySQL**:
   - Service: MySQL
   - Cloud: AWS
   - Region: **us-east-1** (más cercano a Colombia)
   - Plan: **Free** (Hobbyist)
   - Service name: `libroshop-db`

5. **Esperar 2-3 minutos** mientras se crea

### Obtener Credenciales

Una vez creado, verás:

```
Service URI: mysql://avnadmin:PASSWORD@libroshop-db-xxx.aivencloud.com:12345/defaultdb
```

Anotar:
- **Host**: `libroshop-db-xxx.aivencloud.com`
- **Port**: `12345`
- **User**: `avnadmin`
- **Password**: `tu_password_aqui`
- **Database**: `defaultdb`

### Crear Tablas

1. **Descargar MySQL Workbench** o usar la consola web de Aiven
2. **Conectar** con las credenciales de arriba
3. **Ejecutar** el contenido de `backend/src/migrations/001_initial.sql`

O desde tu computadora:

```bash
# Instalar MySQL client
# Windows: https://dev.mysql.com/downloads/mysql/

# Conectar
mysql -h libroshop-db-xxx.aivencloud.com -P 12345 -u avnadmin -p

# Pegar el contenido de 001_initial.sql
```

---

## 🖥️ PASO 2: Backend en Render.com (GRATIS)

### ¿Por qué Render?
- ✅ **750 horas gratis/mes** (suficiente para 24/7)
- ✅ Deploy automático desde GitHub
- ✅ SSL gratis
- ✅ Variables de entorno seguras
- ✅ Logs en tiempo real
- ✅ No requiere tarjeta de crédito

### Preparar Repositorio

1. **Crear cuenta en GitHub** (si no tienes)
2. **Crear repositorio nuevo**: `libroshop`
3. **Subir tu código**:

```bash
cd "c:\Users\ASUS\Documents\Mis proyectos aca\libreria-app"

# Inicializar git (si no lo has hecho)
git init
git add .
git commit -m "Initial commit"

# Conectar con GitHub
git remote add origin https://github.com/TU_USUARIO/libroshop.git
git branch -M main
git push -u origin main
```

### Crear Web Service en Render

1. **Ir a**: https://render.com/
2. **Sign Up** con GitHub
3. **New +** → **Web Service**
4. **Conectar repositorio**: `libroshop`
5. **Configurar**:

```
Name: libroshop-backend
Region: Oregon (US West)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

6. **Environment Variables** (clic en "Advanced"):

```bash
NODE_ENV=production
PORT=10000

# Aiven Database
DB_HOST=libroshop-db-xxx.aivencloud.com
DB_PORT=12345
DB_USER=avnadmin
DB_PASSWORD=tu_password_de_aiven
DB_NAME=defaultdb

# JWT (generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=tu_secret_generado_aqui_64_caracteres
JWT_REFRESH_SECRET=otro_secret_diferente_64_caracteres
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Wompi SANDBOX (para pruebas)
WOMPI_PUBLIC_KEY=pub_test_XXXXXXXXXXXXXXXX
WOMPI_PRIVATE_KEY=prv_test_XXXXXXXXXXXXXXXX
WOMPI_INTEGRITY_KEY=test_integrity_XXXXXXXXXXXXXXXX

# Brevo SMTP (configurar en paso 4)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_brevo_smtp_key
EMAIL_FROM=noreply@libroshop.com

# Frontend URL (actualizar después)
FRONTEND_URL=https://libroshop.vercel.app

LOG_LEVEL=info
```

7. **Create Web Service**

### Esperar Deployment (5-10 minutos)

Verás logs en tiempo real. Al finalizar:

```
✅ Build successful
✅ Deploy live at https://libroshop-backend.onrender.com
```

### Probar Backend

```bash
# Abrir en navegador
https://libroshop-backend.onrender.com/api/books/featured

# Deberías ver JSON con libros
```

**⚠️ IMPORTANTE**: El plan gratuito de Render "duerme" después de 15 minutos sin uso. La primera request después de dormir toma 30-60 segundos en despertar.

---

## 🎨 PASO 3: Frontend en Vercel (GRATIS)

### ¿Por qué Vercel?
- ✅ **100% GRATIS para siempre**
- ✅ 100GB bandwidth/mes
- ✅ Deploy automático desde GitHub
- ✅ SSL gratis
- ✅ CDN global
- ✅ Dominio .vercel.app gratis
- ✅ No requiere tarjeta de crédito

### Preparar Frontend

1. **Actualizar archivo de configuración**:

```bash
# frontend/.env.production
VITE_API_URL=https://libroshop-backend.onrender.com
VITE_WOMPI_PUBLIC_KEY=pub_test_XXXXXXXXXXXXXXXX
```

2. **Commit cambios**:

```bash
git add .
git commit -m "Add production config"
git push
```

### Deploy en Vercel

1. **Ir a**: https://vercel.com/
2. **Sign Up** con GitHub
3. **Add New** → **Project**
4. **Import** tu repositorio `libroshop`
5. **Configurar**:

```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

6. **Environment Variables**:

```bash
VITE_API_URL=https://libroshop-backend.onrender.com
VITE_WOMPI_PUBLIC_KEY=pub_test_XXXXXXXXXXXXXXXX
```

7. **Deploy**

### Esperar Deployment (2-3 minutos)

Al finalizar:

```
✅ Production: https://libroshop.vercel.app
```

### Actualizar Backend con URL del Frontend

1. **Volver a Render.com**
2. **Environment** → Editar `FRONTEND_URL`
3. Cambiar a: `https://libroshop.vercel.app`
4. **Save Changes** (se reiniciará automáticamente)

---

## 📧 PASO 4: Email SMTP Gratis (Brevo)

### ¿Por qué Brevo?
- ✅ **9,000 emails/mes GRATIS**
- ✅ 300 emails/día
- ✅ Sin tarjeta de crédito
- ✅ SMTP incluido
- ✅ Templates profesionales

### Crear Cuenta en Brevo

1. **Ir a**: https://www.brevo.com/
2. **Sign Up Free**
3. **Verificar email**

### Obtener Credenciales SMTP

1. **Dashboard** → **SMTP & API**
2. **SMTP** → **Create a new SMTP key**
3. **Name**: `LibroShop`
4. **Create**

Anotar:
```
SMTP Server: smtp-relay.brevo.com
Port: 587
Login: tu_email@gmail.com
Password: xsmtpsib-XXXXXXXXXXXXXXXX
```

### Actualizar Backend

1. **Render.com** → **Environment**
2. **Editar**:

```bash
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=xsmtpsib-XXXXXXXXXXXXXXXX
EMAIL_FROM=noreply@libroshop.com
```

3. **Save Changes**

### Probar Emails

1. **Registrarte en tu app**
2. **Verificar que llegue email de verificación**
3. **Revisar logs en Brevo**: Dashboard → Statistics

---

## 🌐 PASO 5: Dominio Personalizado (OPCIONAL)

### Opción A: Usar Subdominios Gratis

Ya tienes:
- ✅ `libroshop.vercel.app` (frontend)
- ✅ `libroshop-backend.onrender.com` (backend)

**No necesitas hacer nada más.**

### Opción B: Dominio Gratis con Hosting

Algunos proveedores dan dominio gratis el primer año:

1. **InfinityFree** (hosting + dominio .rf.gd gratis)
   - https://infinityfree.net/
   - Dominio: `libroshop.rf.gd`

2. **000webhost** (dominio .000webhostapp.com)
   - https://www.000webhost.com/
   - Dominio: `libroshop.000webhostapp.com`

### Opción C: Dominio Barato ($1-2/año)

Si quieres .com o .co:

1. **Namecheap**: $0.99 primer año (.com)
2. **Porkbun**: $1.14 primer año (.com)
3. **.co.co**: ~$2/año (dominio colombiano)

**Configurar dominio en Vercel**:
1. Vercel → Settings → Domains
2. Add Domain → `tudominio.com`
3. Agregar registros DNS en tu proveedor:

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

---

## 📊 PASO 6: Monitoreo Gratis (UptimeRobot)

### ¿Por qué UptimeRobot?
- ✅ **50 monitores gratis**
- ✅ Chequeo cada 5 minutos
- ✅ Alertas por email
- ✅ Sin tarjeta de crédito

### Configurar Monitoreo

1. **Ir a**: https://uptimerobot.com/
2. **Sign Up Free**
3. **Add New Monitor**:

```
Monitor Type: HTTPS
Friendly Name: LibroShop Frontend
URL: https://libroshop.vercel.app
Monitoring Interval: 5 minutes
```

4. **Agregar otro monitor para backend**:

```
Monitor Type: HTTPS
Friendly Name: LibroShop Backend
URL: https://libroshop-backend.onrender.com/api/books/featured
Monitoring Interval: 5 minutes
```

5. **Configurar alertas**:
   - My Settings → Alert Contacts
   - Agregar tu email

**Beneficio extra**: Los pings cada 5 minutos mantienen tu backend de Render despierto (evita el "sleep" del plan gratuito).

---

## 🚀 PASO 7: CDN Gratis (Cloudflare)

### ¿Por qué Cloudflare?
- ✅ **100% GRATIS**
- ✅ CDN global
- ✅ DDoS protection
- ✅ SSL mejorado
- ✅ Caché automático

### Configurar Cloudflare (OPCIONAL)

Solo si tienes dominio propio:

1. **Ir a**: https://www.cloudflare.com/
2. **Sign Up**
3. **Add Site** → `tudominio.com`
4. **Select Plan**: Free
5. **Cambiar nameservers** en tu registrador de dominio
6. **Activar**:
   - SSL/TLS → Full (strict)
   - Always Use HTTPS
   - Auto Minify (JS, CSS, HTML)
   - Brotli compression

---

## 🔐 PASO 8: Configurar Wompi para Producción

### Sandbox (Pruebas) - GRATIS

Ya está configurado. Usa tarjetas de prueba:

```
Aprobada: 4242 4242 4242 4242
Rechazada: 4111 1111 1111 1111
CVV: 123
Fecha: Cualquier fecha futura
```

### Producción (Pagos Reales)

1. **Ir a**: https://comercios.wompi.co/
2. **Registrarse** (requiere documentos de empresa)
3. **Obtener credenciales de producción**
4. **Actualizar en Render**:

```bash
WOMPI_PUBLIC_KEY=prod_pub_XXXXXXXXXXXXXXXX
WOMPI_PRIVATE_KEY=prod_prv_XXXXXXXXXXXXXXXX
WOMPI_INTEGRITY_KEY=prod_integrity_XXXXXXXXXXXXXXXX
```

5. **Actualizar en Vercel**:

```bash
VITE_WOMPI_PUBLIC_KEY=prod_pub_XXXXXXXXXXXXXXXX
```

**Ver guía completa**: `WOMPI_PRODUCTION_GUIDE.md`

---

## ✅ CHECKLIST FINAL

### Backend (Render)
- [ ] Servicio creado y corriendo
- [ ] Variables de entorno configuradas
- [ ] Base de datos Aiven conectada
- [ ] Migraciones ejecutadas
- [ ] API responde en `/api/books/featured`

### Frontend (Vercel)
- [ ] Deploy exitoso
- [ ] Variables de entorno configuradas
- [ ] Conecta con backend correctamente
- [ ] Página carga sin errores

### Base de Datos (Aiven)
- [ ] Servicio MySQL creado
- [ ] Tablas creadas
- [ ] Conexión desde backend funciona

### Email (Brevo)
- [ ] Cuenta creada
- [ ] SMTP configurado en backend
- [ ] Email de prueba enviado

### Monitoreo (UptimeRobot)
- [ ] Monitores configurados
- [ ] Alertas por email activas

### Seguridad
- [ ] HTTPS activo (automático)
- [ ] Variables de entorno seguras
- [ ] `.gitignore` configurado
- [ ] Credenciales NO en código

---

## 🎯 URLs Finales

Después de completar todos los pasos:

- **Frontend**: https://libroshop.vercel.app
- **Backend API**: https://libroshop-backend.onrender.com
- **Base de Datos**: Aiven (privada)
- **Monitoreo**: https://uptimerobot.com/dashboard

---

## 💰 COSTOS REALES

| Servicio | Costo Mensual | Costo Anual |
|----------|---------------|-------------|
| Render | $0 | $0 |
| Vercel | $0 | $0 |
| Aiven | $0 | $0 |
| Brevo | $0 | $0 |
| UptimeRobot | $0 | $0 |
| Cloudflare | $0 | $0 |
| **TOTAL** | **$0** | **$0** |

**Único costo**: Comisión de Wompi por transacción (2.99% + $900 COP)

---

## ⚠️ LIMITACIONES DEL PLAN GRATUITO

### Render (Backend)
- ✅ 750 horas/mes (suficiente para 24/7)
- ⚠️ Se "duerme" después de 15 min sin uso
- ⚠️ Primera request después de dormir: 30-60 segundos
- ✅ Solución: UptimeRobot hace ping cada 5 min

### Vercel (Frontend)
- ✅ 100GB bandwidth/mes
- ✅ 100 deployments/día
- ✅ Sin límite de requests
- ⚠️ Si excedes 100GB, se pausa hasta el mes siguiente

### Aiven (Base de Datos)
- ✅ 1GB RAM (suficiente para ~10,000 usuarios)
- ✅ Sin límite de queries
- ✅ Backups automáticos
- ⚠️ Solo 1 base de datos gratis por cuenta

### Brevo (Email)
- ✅ 9,000 emails/mes (300/día)
- ⚠️ Si excedes, debes esperar al mes siguiente
- ✅ Suficiente para ~300 registros/día

---

## 📈 ¿Cuándo Necesitas Pagar?

### Escenario 1: Pocos Usuarios (<100/día)
**Costo**: $0/mes ✅

### Escenario 2: Usuarios Moderados (100-500/día)
**Costo**: $0/mes ✅
(Aún dentro de límites gratuitos)

### Escenario 3: Muchos Usuarios (>1,000/día)
**Necesitarás**:
- Render Pro: $7/mes (backend más rápido)
- Aiven Startup: $19/mes (más RAM)
- **Total**: ~$26/mes

### Escenario 4: Viral (>10,000/día)
**Necesitarás**:
- VPS dedicado: $20-50/mes
- Base de datos escalable: $50-100/mes
- CDN premium: $20/mes
- **Total**: ~$100-200/mes

---

## 🚀 PRÓXIMOS PASOS

1. ✅ **Seguir esta guía paso a paso**
2. ✅ **Probar que todo funciona**
3. ✅ **Ejecutar pruebas de seguridad**: `node security-test.js`
4. ✅ **Leer**: `SECURITY_CHECKLIST.md`
5. ✅ **Configurar Wompi producción**: `WOMPI_PRODUCTION_GUIDE.md`
6. ✅ **Promocionar tu app** 🎉

---

## 🆘 SOPORTE

### Render
- Docs: https://render.com/docs
- Community: https://community.render.com/

### Vercel
- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord

### Aiven
- Docs: https://docs.aiven.io/
- Support: support@aiven.io

### Brevo
- Docs: https://developers.brevo.com/
- Support: https://www.brevo.com/support/

---

## 🎉 ¡LISTO!

Tu aplicación está ahora en internet, **100% GRATIS**, con:
- ✅ HTTPS
- ✅ Base de datos
- ✅ Emails
- ✅ Monitoreo
- ✅ CDN global
- ✅ Backups automáticos

**Sin gastar un solo peso.** 💰

---

## 📝 NOTAS FINALES

1. **Render se duerme**: Usa UptimeRobot para mantenerlo despierto
2. **Backups**: Aiven hace backups automáticos, pero descarga uno manual cada semana
3. **Monitoreo**: Revisa UptimeRobot diariamente
4. **Logs**: Render y Vercel guardan logs por 7 días
5. **Escalamiento**: Cuando crezcas, migra a planes pagos

**¿Preguntas?** Revisa `SECURITY_CHECKLIST.md` y `DEPLOYMENT_GUIDE.md`
