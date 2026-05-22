# 🚀 Guía de Deployment - LibroShop

## 📋 Tabla de Contenidos

1. [Preparación Pre-Deployment](#preparación-pre-deployment)
2. [Opción 1: VPS (DigitalOcean, AWS, Linode)](#opción-1-vps)
3. [Opción 2: Heroku](#opción-2-heroku)
4. [Opción 3: Vercel + Railway](#opción-3-vercel--railway)
5. [Configuración de Dominio](#configuración-de-dominio)
6. [Post-Deployment](#post-deployment)

---

## 🔧 Preparación Pre-Deployment

### 1. Verificar que todo funciona localmente

```bash
# Backend
cd backend
npm install
npm run migrate
npm start

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

### 2. Ejecutar pruebas de seguridad

```bash
# En la raíz del proyecto
node security-test.js
```

### 3. Revisar checklist de seguridad

```bash
# Leer y completar
cat SECURITY_CHECKLIST.md
```

---

## 🖥️ Opción 1: VPS (Recomendado para Control Total)

### Proveedores Recomendados

- **DigitalOcean**: $6/mes (1GB RAM, 25GB SSD)
- **Linode**: $5/mes (1GB RAM, 25GB SSD)
- **AWS Lightsail**: $5/mes (512MB RAM, 20GB SSD)
- **Vultr**: $6/mes (1GB RAM, 25GB SSD)

### Paso 1: Crear Droplet/VPS

1. Crear cuenta en DigitalOcean
2. Crear Droplet:
   - **OS**: Ubuntu 22.04 LTS
   - **Plan**: Basic $6/mes
   - **Datacenter**: Más cercano a Colombia (Miami o São Paulo)
   - **SSH Key**: Agregar tu llave pública

### Paso 2: Configuración Inicial del Servidor

```bash
# Conectar al servidor
ssh root@tu-ip-del-servidor

# Actualizar sistema
apt update && apt upgrade -y

# Crear usuario no-root
adduser libroshop
usermod -aG sudo libroshop

# Configurar firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Cambiar a usuario libroshop
su - libroshop
```

### Paso 3: Instalar Dependencias

```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Nginx
sudo apt install -y nginx

# PM2 (Process Manager)
sudo npm install -g pm2

# Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### Paso 4: Configurar MySQL

```bash
# Entrar a MySQL
sudo mysql

# Crear base de datos y usuario
CREATE DATABASE libreria_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'libroshop_app'@'localhost' IDENTIFIED BY 'PASSWORD_SUPER_SEGURO';
GRANT SELECT, INSERT, UPDATE, DELETE ON libreria_db.* TO 'libroshop_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Paso 5: Clonar y Configurar Proyecto

```bash
# Clonar repositorio
cd /home/libroshop
git clone https://github.com/tu-usuario/libreria-app.git
cd libreria-app

# Backend
cd backend
npm install --production

# Crear archivo .env
nano .env
```

Contenido del `.env`:

```bash
NODE_ENV=production
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=libroshop_app
DB_PASSWORD=PASSWORD_SUPER_SEGURO
DB_NAME=libreria_db

JWT_SECRET=tu_secret_super_largo_minimo_64_caracteres_aleatorios
JWT_REFRESH_SECRET=otro_secret_diferente_minimo_64_caracteres
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

WOMPI_PUBLIC_KEY=prod_pub_XXXXXXXXXXXXXXXX
WOMPI_PRIVATE_KEY=prod_prv_XXXXXXXXXXXXXXXX
WOMPI_INTEGRITY_KEY=prod_integrity_XXXXXXXXXXXXXXXX

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_app_password
EMAIL_FROM=noreply@tudominio.com

FRONTEND_URL=https://tudominio.com

LOG_LEVEL=info
```

```bash
# Ejecutar migraciones
npm run migrate

# Frontend
cd ../frontend
npm install
npm run build
```

### Paso 6: Configurar PM2

```bash
# Iniciar backend con PM2
cd /home/libroshop/libreria-app/backend
pm2 start server.js --name libroshop-backend

# Configurar PM2 para iniciar al arrancar
pm2 startup
pm2 save

# Ver logs
pm2 logs libroshop-backend
```

### Paso 7: Configurar Nginx

```bash
# Crear configuración
sudo nano /etc/nginx/sites-available/libroshop
```

Contenido:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Frontend
    location / {
        root /home/libroshop/libreria-app/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Caché para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Seguridad
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "0" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Limitar tamaño de uploads
    client_max_body_size 10M;
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/libroshop /etc/nginx/sites-enabled/

# Eliminar sitio default
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Paso 8: Configurar SSL con Let's Encrypt

```bash
# Obtener certificado
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Renovación automática (ya configurada por defecto)
sudo certbot renew --dry-run
```

### Paso 9: Configurar Backups Automáticos

```bash
# Crear script de backup
nano /home/libroshop/backup.sh
```

Contenido:

```bash
#!/bin/bash

# Variables
BACKUP_DIR="/home/libroshop/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="libreria_db"
DB_USER="libroshop_app"
DB_PASS="PASSWORD_SUPER_SEGURO"

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Backup de base de datos
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Eliminar backups antiguos (más de 7 días)
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completado: db_$DATE.sql.gz"
```

```bash
# Dar permisos de ejecución
chmod +x /home/libroshop/backup.sh

# Configurar cron para backup diario a las 2 AM
crontab -e

# Agregar línea:
0 2 * * * /home/libroshop/backup.sh >> /home/libroshop/backup.log 2>&1
```

---

## 🎈 Opción 2: Heroku (Más Fácil, Menos Control)

### Ventajas
- ✅ Deployment automático desde Git
- ✅ SSL gratis
- ✅ Fácil escalamiento
- ✅ Backups automáticos de DB

### Desventajas
- ❌ Más caro ($7/mes por dyno)
- ❌ Menos control
- ❌ Dyno se duerme después de 30 min sin uso (plan gratis)

### Paso 1: Preparar Proyecto

```bash
# Crear Procfile en la raíz del backend
cd backend
echo "web: node server.js" > Procfile

# Crear .gitignore si no existe
echo "node_modules/
.env
logs/
*.log" > .gitignore
```

### Paso 2: Crear App en Heroku

```bash
# Instalar Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Crear app
cd backend
heroku create libroshop-backend

# Agregar MySQL (ClearDB)
heroku addons:create cleardb:ignite

# Obtener URL de DB
heroku config:get CLEARDB_DATABASE_URL
```

### Paso 3: Configurar Variables de Entorno

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="tu_secret_aqui"
heroku config:set JWT_REFRESH_SECRET="otro_secret_aqui"
heroku config:set WOMPI_PUBLIC_KEY="prod_pub_XXX"
heroku config:set WOMPI_PRIVATE_KEY="prod_prv_XXX"
heroku config:set WOMPI_INTEGRITY_KEY="prod_integrity_XXX"
heroku config:set SMTP_HOST="smtp.gmail.com"
heroku config:set SMTP_PORT=587
heroku config:set SMTP_USER="tu_correo@gmail.com"
heroku config:set SMTP_PASS="tu_app_password"
heroku config:set EMAIL_FROM="noreply@tudominio.com"
heroku config:set FRONTEND_URL="https://tudominio.com"
```

### Paso 4: Deploy

```bash
# Commit cambios
git add .
git commit -m "Preparar para Heroku"

# Push a Heroku
git push heroku main

# Ejecutar migraciones
heroku run npm run migrate

# Ver logs
heroku logs --tail
```

### Paso 5: Frontend en Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy frontend
cd ../frontend
vercel

# Configurar variables de entorno en Vercel
# Dashboard → Settings → Environment Variables
VITE_API_URL=https://libroshop-backend.herokuapp.com
VITE_WOMPI_PUBLIC_KEY=prod_pub_XXX
```

---

## ☁️ Opción 3: Vercel + Railway (Moderno y Rápido)

### Ventajas
- ✅ Deploy automático desde Git
- ✅ SSL gratis
- ✅ Edge network global
- ✅ Muy rápido

### Backend en Railway

1. Ir a https://railway.app/
2. Conectar con GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Seleccionar repositorio
5. Agregar variables de entorno
6. Deploy automático

### Frontend en Vercel

1. Ir a https://vercel.com/
2. "Import Project"
3. Conectar con GitHub
4. Seleccionar carpeta `frontend`
5. Agregar variables de entorno
6. Deploy automático

---

## 🌐 Configuración de Dominio

### Opción 1: Dominio en Namecheap/GoDaddy

1. Comprar dominio (ej: libroshop.com)
2. Ir a DNS Management
3. Agregar registros:

```
Tipo    Host    Valor                   TTL
A       @       tu-ip-del-servidor      300
A       www     tu-ip-del-servidor      300
```

### Opción 2: Cloudflare (Recomendado)

1. Crear cuenta en Cloudflare
2. Agregar sitio
3. Cambiar nameservers en tu registrador
4. Configurar DNS:

```
Tipo    Nombre  Contenido               Proxy
A       @       tu-ip-del-servidor      ✅ Proxied
A       www     tu-ip-del-servidor      ✅ Proxied
```

5. Activar:
   - SSL/TLS → Full (strict)
   - Always Use HTTPS
   - Auto Minify (JS, CSS, HTML)
   - Brotli compression

---

## ✅ Post-Deployment

### 1. Verificar que todo funciona

```bash
# Probar API
curl https://tudominio.com/api/books/featured

# Probar frontend
curl https://tudominio.com

# Verificar SSL
curl -I https://tudominio.com | grep -i "strict-transport"
```

### 2. Configurar Monitoreo

**UptimeRobot** (Gratis):
1. Ir a https://uptimerobot.com/
2. Agregar monitor:
   - Type: HTTPS
   - URL: https://tudominio.com
   - Interval: 5 minutos
3. Agregar email para alertas

**Sentry** (Errores):
```bash
npm install @sentry/node

# En backend/server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'tu-dsn-aqui' });
```

### 3. Configurar Analytics

**Google Analytics**:
```html
<!-- En frontend/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 4. Probar Flujo Completo

- [ ] Registro de usuario
- [ ] Login
- [ ] Búsqueda de libros
- [ ] Agregar al carrito
- [ ] Checkout
- [ ] Pago con Wompi (tarjeta de prueba)
- [ ] Verificar webhook recibido
- [ ] Confirmar orden actualizada
- [ ] Email de confirmación recibido

### 5. Ejecutar Pruebas de Seguridad

```bash
# Desde tu máquina local
TEST_URL=https://tudominio.com node security-test.js
```

---

## 🔄 Actualizar Aplicación

### VPS

```bash
# Conectar al servidor
ssh libroshop@tu-ip

# Actualizar código
cd /home/libroshop/libreria-app
git pull origin main

# Backend
cd backend
npm install --production
pm2 restart libroshop-backend

# Frontend
cd ../frontend
npm install
npm run build
```

### Heroku

```bash
# Simplemente push
git push heroku main
```

### Vercel/Railway

- Automático al hacer push a GitHub

---

## 🆘 Troubleshooting

### Error: "Cannot connect to database"

```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar credenciales
mysql -u libroshop_app -p libreria_db
```

### Error: "502 Bad Gateway"

```bash
# Verificar que backend esté corriendo
pm2 status

# Ver logs
pm2 logs libroshop-backend

# Reiniciar
pm2 restart libroshop-backend
```

### Error: "SSL certificate expired"

```bash
# Renovar certificado
sudo certbot renew

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Error: "Webhook not received"

```bash
# Verificar logs
pm2 logs libroshop-backend | grep webhook

# Verificar firewall
sudo ufw status

# Probar webhook manualmente
curl -X POST https://tudominio.com/api/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 📊 Métricas de Éxito

Después del deployment, monitorea:

- **Uptime**: Objetivo 99.9%
- **Response Time**: <500ms
- **Error Rate**: <1%
- **Conversion Rate**: >80% de pagos exitosos
- **User Satisfaction**: >4.5/5

---

## 🎉 ¡Felicidades!

Tu aplicación está ahora en producción y lista para recibir usuarios reales.

**Próximos pasos**:
1. Marketing y adquisición de usuarios
2. Monitorear métricas diariamente
3. Iterar basado en feedback
4. Escalar según demanda

¿Preguntas? Revisa:
- `SECURITY_CHECKLIST.md`
- `WOMPI_PRODUCTION_GUIDE.md`
- Documentación de tu proveedor de hosting
