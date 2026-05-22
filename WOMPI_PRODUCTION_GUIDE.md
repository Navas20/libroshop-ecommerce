# 🔐 Guía Completa: Wompi en Producción

## 📋 Requisitos Previos

Antes de activar Wompi en producción, necesitas:

1. ✅ Negocio registrado legalmente en Colombia
2. ✅ Cuenta bancaria empresarial
3. ✅ RUT (Registro Único Tributario)
4. ✅ Cámara de Comercio (menos de 30 días)
5. ✅ Cédula del representante legal

---

## 🚀 Paso 1: Registro en Wompi

### 1.1 Crear Cuenta de Producción

1. Ir a: https://comercios.wompi.co/
2. Clic en "Registrarse"
3. Completar formulario:
   - Nombre del negocio
   - Email empresarial
   - Teléfono
   - Tipo de negocio

### 1.2 Verificación de Identidad

Wompi solicitará:
- ✅ Documento de identidad del representante legal
- ✅ RUT actualizado
- ✅ Cámara de Comercio (menos de 30 días)
- ✅ Extracto bancario
- ✅ Certificación bancaria

**Tiempo de aprobación**: 2-5 días hábiles

---

## 🔑 Paso 2: Obtener Credenciales de Producción

Una vez aprobada tu cuenta:

### 2.1 Acceder al Dashboard

1. Login en https://comercios.wompi.co/
2. Ir a: **Configuración → API Keys**

### 2.2 Copiar Credenciales

Encontrarás 3 keys:

```bash
# Llave Pública (Frontend)
WOMPI_PUBLIC_KEY=prod_pub_XXXXXXXXXXXXXXXXXXXXXXXX

# Llave Privada (Backend - NUNCA exponer)
WOMPI_PRIVATE_KEY=prod_prv_XXXXXXXXXXXXXXXXXXXXXXXX

# Llave de Integridad (Webhooks)
WOMPI_INTEGRITY_KEY=prod_integrity_XXXXXXXXXXXXXXXXXXXXXXXX
```

### 2.3 Configurar en tu Servidor

**NUNCA** pongas estas keys en el código. Usa variables de entorno:

```bash
# En tu servidor de producción
export WOMPI_PUBLIC_KEY="prod_pub_XXXXXXXXXXXXXXXXXXXXXXXX"
export WOMPI_PRIVATE_KEY="prod_prv_XXXXXXXXXXXXXXXXXXXXXXXX"
export WOMPI_INTEGRITY_KEY="prod_integrity_XXXXXXXXXXXXXXXXXXXXXXXX"
```

---

## 🔔 Paso 3: Configurar Webhooks

Los webhooks son **CRÍTICOS** para actualizar el estado de los pagos.

### 3.1 Configurar URL del Webhook

1. En el dashboard de Wompi: **Configuración → Webhooks**
2. Agregar URL: `https://tudominio.com/api/payment/webhook`
3. Seleccionar eventos:
   - ✅ `transaction.updated`
   - ✅ `transaction.created`

### 3.2 Obtener IPs de Wompi

**IMPORTANTE**: Solicita a soporte de Wompi las IPs desde donde envían webhooks.

Email: soporte@wompi.co

Ejemplo de respuesta:
```
IPs de Webhooks:
- 34.83.123.45
- 35.184.45.67
- 35.199.78.90
```

### 3.3 Actualizar Whitelist en tu Código

```javascript
// backend/src/middlewares/wompiWebhookValidator.js
const WOMPI_IPS = [
  '34.83.123.45',    // IP 1 de Wompi
  '35.184.45.67',    // IP 2 de Wompi
  '35.199.78.90'     // IP 3 de Wompi
];
```

---

## 🧪 Paso 4: Probar en Sandbox

Antes de producción, prueba en sandbox:

### 4.1 Credenciales de Sandbox

```bash
WOMPI_PUBLIC_KEY=pub_test_XXXXXXXXXXXXXXXX
WOMPI_PRIVATE_KEY=prv_test_XXXXXXXXXXXXXXXX
WOMPI_INTEGRITY_KEY=test_integrity_XXXXXXXXXXXXXXXX
```

### 4.2 Tarjetas de Prueba

**Transacción Aprobada:**
```
Número: 4242 4242 4242 4242
CVV: 123
Fecha: Cualquier fecha futura
```

**Transacción Rechazada:**
```
Número: 4111 1111 1111 1111
CVV: 123
Fecha: Cualquier fecha futura
```

**Transacción Pendiente:**
```
Número: 4000 0000 0000 0002
CVV: 123
Fecha: Cualquier fecha futura
```

### 4.3 Probar Flujo Completo

1. Crear orden en tu app
2. Iniciar pago con tarjeta de prueba
3. Verificar que webhook se recibe
4. Confirmar que orden se actualiza a "pagado"

---

## 🔒 Paso 5: Seguridad en Producción

### 5.1 Verificación de Firmas

Tu código ya implementa verificación de firmas:

```javascript
// backend/src/utils/wompiSignature.js
function verifyWompiSignature(payload, signature) {
  const properties = [
    payload.id,
    payload.amount_in_cents,
    payload.reference,
    payload.currency,
    payload.sign
  ].filter(Boolean);

  const raw = properties.join('');
  const hash = crypto.createHash('sha256')
    .update(raw + wompiConfig.integrityKey)
    .digest('hex');

  return hash === signature;
}
```

### 5.2 Doble Verificación

Siempre verifica con la API de Wompi:

```javascript
// Ya implementado en paymentController.js
const verification = await axios.get(
  `${wompiConfig.baseUrl}/transactions/${transaction.id}`,
  { headers: { Authorization: `Bearer ${wompiConfig.privateKey}` } }
);
```

### 5.3 Logs de Seguridad

Todos los eventos se registran en `security_logs`:

```sql
SELECT * FROM security_logs 
WHERE event_type IN ('PAYMENT_APPROVED', 'PAYMENT_DECLINED', 'WEBHOOK_INVALID_SIGNATURE')
ORDER BY created_at DESC;
```

---

## 💰 Paso 6: Comisiones y Tarifas

### 6.1 Estructura de Costos

Wompi cobra:
- **2.99% + $900 COP** por transacción exitosa
- **Sin costo** por transacciones rechazadas
- **Sin mensualidad**

### 6.2 Cálculo de Precio Final

Si vendes un libro a $50,000 COP:

```
Precio del libro:     $50,000
Comisión Wompi (2.99%): $1,495
Tarifa fija:            $900
Total comisión:       $2,395
Recibes:             $47,605
```

### 6.3 Ajustar Precios (Opcional)

Si quieres absorber la comisión:

```javascript
// backend/src/controllers/bookController.js
const getOrCreatePrice = async (bookKey) => {
  // ... código existente ...
  
  // Agregar comisión de Wompi
  const wompiCommission = Math.round(original * 0.0299 + 900);
  const finalWithCommission = original + wompiCommission;
  
  return { 
    original: finalWithCommission, 
    final: Math.round(finalWithCommission * 0.8) 
  };
};
```

---

## 📊 Paso 7: Monitoreo de Transacciones

### 7.1 Dashboard de Wompi

Accede a: https://comercios.wompi.co/transacciones

Verás:
- ✅ Transacciones en tiempo real
- ✅ Tasa de aprobación
- ✅ Monto total procesado
- ✅ Disputas y contracargos

### 7.2 Reportes Automáticos

Configura reportes diarios:
1. Dashboard → Reportes
2. Activar "Reporte Diario"
3. Email de destino

### 7.3 Alertas Críticas

Configura alertas para:
- ✅ Tasa de rechazo > 30%
- ✅ Disputas nuevas
- ✅ Transacciones sospechosas

---

## 🚨 Paso 8: Manejo de Errores Comunes

### Error 1: "Invalid signature"

**Causa**: Llave de integridad incorrecta

**Solución**:
```bash
# Verificar que la llave sea correcta
echo $WOMPI_INTEGRITY_KEY

# Debe empezar con "prod_integrity_"
```

### Error 2: "Transaction not found"

**Causa**: Referencia no existe en Wompi

**Solución**:
```javascript
// Verificar que la referencia se guardó correctamente
const [orders] = await pool.execute(
  'SELECT wompi_reference FROM orders WHERE id = ?',
  [orderId]
);
console.log('Referencia guardada:', orders[0].wompi_reference);
```

### Error 3: "Webhook not received"

**Causa**: Firewall bloqueando IPs de Wompi

**Solución**:
```bash
# Verificar que las IPs de Wompi estén permitidas
sudo ufw allow from 34.83.123.45 to any port 443
sudo ufw allow from 35.184.45.67 to any port 443
```

### Error 4: "Amount mismatch"

**Causa**: Monto en webhook diferente al esperado

**Solución**:
```javascript
// Verificar monto antes de aprobar
if (transaction.amount_in_cents !== expectedAmount) {
  logger.error('Monto no coincide', {
    expected: expectedAmount,
    received: transaction.amount_in_cents
  });
  return res.status(400).json({ error: 'Monto inválido' });
}
```

---

## 🔄 Paso 9: Reembolsos

### 9.1 Política de Reembolsos

Define tu política:
- ✅ Plazo para solicitar reembolso (ej: 7 días)
- ✅ Condiciones (libro no descargado, error en pedido)
- ✅ Proceso de aprobación

### 9.2 Procesar Reembolso

Desde el dashboard de Wompi:
1. Transacciones → Buscar transacción
2. Clic en "Reembolsar"
3. Ingresar monto (puede ser parcial)
4. Confirmar

### 9.3 Actualizar Estado en tu DB

```javascript
// Crear endpoint para webhooks de reembolso
router.post('/refund-webhook', async (req, res) => {
  const { transaction_id, status } = req.body;
  
  if (status === 'REFUNDED') {
    await pool.execute(
      "UPDATE orders SET status = 'reembolsado' WHERE wompi_transaction_id = ?",
      [transaction_id]
    );
  }
  
  res.json({ success: true });
});
```

---

## 📱 Paso 10: Pagos con PSE (Opcional)

PSE permite pagos directos desde cuentas bancarias.

### 10.1 Activar PSE

1. Dashboard → Métodos de Pago
2. Activar "PSE"
3. Completar información bancaria

### 10.2 Modificar Frontend

```javascript
// frontend/src/components/WompiWidget.jsx
const widget = new window.WidgetCheckout({
  currency: 'COP',
  amountInCents: amount,
  reference,
  publicKey: WOMPI_PUBLIC_KEY,
  signature: integrityHash,
  redirectUrl: 'https://tudominio.com/confirmacion',
  // Habilitar PSE
  paymentMethods: {
    pse: true,
    card: true
  }
});
```

---

## 🎯 Checklist Final de Producción

Antes de lanzar, verifica:

### Configuración
- [ ] Credenciales de producción configuradas
- [ ] Webhook URL configurada en Wompi
- [ ] IPs de Wompi en whitelist
- [ ] SSL/HTTPS activo
- [ ] Variables de entorno seguras

### Seguridad
- [ ] Verificación de firmas activa
- [ ] Doble verificación con API de Wompi
- [ ] Logs de seguridad funcionando
- [ ] Rate limiting en endpoints de pago
- [ ] Validación de montos

### Testing
- [ ] Flujo completo probado en sandbox
- [ ] Webhooks recibidos correctamente
- [ ] Emails de confirmación enviados
- [ ] Estados de orden actualizados
- [ ] Manejo de errores probado

### Monitoreo
- [ ] Dashboard de Wompi configurado
- [ ] Alertas de transacciones activas
- [ ] Reportes diarios configurados
- [ ] Logs centralizados

### Legal
- [ ] Política de reembolsos publicada
- [ ] Términos y condiciones actualizados
- [ ] Aviso de procesamiento de pagos

---

## 📞 Soporte de Wompi

### Canales de Contacto

- **Email**: soporte@wompi.co
- **WhatsApp**: +57 300 123 4567 (ejemplo)
- **Chat**: https://comercios.wompi.co/ (esquina inferior derecha)
- **Documentación**: https://docs.wompi.co/

### Horarios de Atención

- Lunes a Viernes: 8:00 AM - 6:00 PM (COT)
- Sábados: 9:00 AM - 1:00 PM (COT)
- Domingos: Cerrado

### Tiempo de Respuesta

- Crítico (pagos caídos): 1-2 horas
- Alto (errores de integración): 4-8 horas
- Normal (consultas): 24-48 horas

---

## 🚀 ¡Listo para Producción!

Una vez completados todos los pasos, tu integración con Wompi estará lista para procesar pagos reales de forma segura.

**Recomendación final**: Procesa 5-10 transacciones de prueba con montos pequeños ($1,000 COP) antes de lanzar oficialmente.

---

## 📚 Recursos Adicionales

- [Documentación Oficial de Wompi](https://docs.wompi.co/)
- [API Reference](https://docs.wompi.co/reference)
- [Ejemplos de Integración](https://github.com/wompi/examples)
- [Status Page](https://status.wompi.co/)
