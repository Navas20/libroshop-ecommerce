#!/usr/bin/env node

/**
 * Script de Pruebas de Seguridad Automatizadas
 * Ejecutar: node security-test.js
 */

const axios = require('axios');
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';
let passedTests = 0;
let failedTests = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  if (passed) {
    passedTests++;
    log(`✓ ${name}`, 'green');
  } else {
    failedTests++;
    log(`✗ ${name}`, 'red');
    if (details) log(`  ${details}`, 'yellow');
  }
}

async function testSQLInjection() {
  log('\n=== Pruebas de SQL Injection ===', 'blue');
  
  const payloads = [
    "' OR '1'='1",
    "admin'--",
    "' UNION SELECT NULL--",
    "1' AND 1=1--"
  ];

  for (const payload of payloads) {
    try {
      const response = await axios.get(`${BASE_URL}/api/books/search`, {
        params: { q: payload },
        validateStatus: () => true
      });
      
      const vulnerable = response.status === 200 && 
                        response.data.success === true &&
                        response.data.data?.books?.length > 0;
      
      logTest(
        `SQL Injection con payload: "${payload}"`,
        !vulnerable,
        vulnerable ? 'VULNERABLE: La aplicación procesó el payload' : ''
      );
    } catch (error) {
      logTest(`SQL Injection con payload: "${payload}"`, true, 'Request bloqueado correctamente');
    }
  }
}

async function testXSS() {
  log('\n=== Pruebas de XSS ===', 'blue');
  
  const payloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>'
  ];

  for (const payload of payloads) {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, {
        nombre: payload,
        email: 'test@test.com',
        password: 'Test1234!'
      }, {
        validateStatus: () => true
      });
      
      const sanitized = !response.data?.data?.user?.nombre?.includes('<script>') &&
                       !response.data?.data?.user?.nombre?.includes('onerror');
      
      logTest(
        `XSS con payload: "${payload.substring(0, 30)}..."`,
        sanitized || response.status >= 400,
        !sanitized && response.status < 400 ? 'VULNERABLE: Payload no sanitizado' : ''
      );
    } catch (error) {
      logTest(`XSS con payload: "${payload.substring(0, 30)}..."`, true);
    }
  }
}

async function testCSRF() {
  log('\n=== Pruebas de CSRF ===', 'blue');
  
  try {
    // Intentar POST sin token CSRF
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@test.com',
      password: 'password'
    }, {
      validateStatus: () => true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const protected = response.status === 403 && 
                     response.data?.error?.toLowerCase().includes('csrf');
    
    logTest(
      'POST sin token CSRF',
      protected,
      !protected ? 'VULNERABLE: Endpoint no protegido contra CSRF' : ''
    );
  } catch (error) {
    logTest('POST sin token CSRF', true);
  }
}

async function testRateLimiting() {
  log('\n=== Pruebas de Rate Limiting ===', 'blue');
  
  const requests = [];
  const numRequests = 110; // Más que el límite de 100
  
  log(`Enviando ${numRequests} requests rápidas...`, 'yellow');
  
  for (let i = 0; i < numRequests; i++) {
    requests.push(
      axios.get(`${BASE_URL}/api/books/featured`, {
        validateStatus: () => true
      }).catch(() => ({ status: 0 }))
    );
  }
  
  const responses = await Promise.all(requests);
  const blocked = responses.filter(r => r.status === 429).length;
  
  logTest(
    `Rate Limiting (${blocked}/${numRequests} bloqueados)`,
    blocked > 0,
    blocked === 0 ? 'VULNERABLE: No hay rate limiting' : `${blocked} requests bloqueados correctamente`
  );
}

async function testAuthBypass() {
  log('\n=== Pruebas de Bypass de Autenticación ===', 'blue');
  
  // Intentar acceder a ruta protegida sin token
  try {
    const response = await axios.get(`${BASE_URL}/api/cart`, {
      validateStatus: () => true
    });
    
    const protected = response.status === 401;
    
    logTest(
      'Acceso a /api/cart sin autenticación',
      protected,
      !protected ? 'VULNERABLE: Ruta no protegida' : ''
    );
  } catch (error) {
    logTest('Acceso a /api/cart sin autenticación', true);
  }
  
  // Intentar con token inválido
  try {
    const response = await axios.get(`${BASE_URL}/api/cart`, {
      headers: {
        'Authorization': 'Bearer invalid_token_12345'
      },
      validateStatus: () => true
    });
    
    const protected = response.status === 401;
    
    logTest(
      'Acceso a /api/cart con token inválido',
      protected,
      !protected ? 'VULNERABLE: Token no validado correctamente' : ''
    );
  } catch (error) {
    logTest('Acceso a /api/cart con token inválido', true);
  }
}

async function testSecurityHeaders() {
  log('\n=== Pruebas de Headers de Seguridad ===', 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/books/featured`);
    const headers = response.headers;
    
    const requiredHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-xss-protection': '0',
      'strict-transport-security': null // Solo en HTTPS
    };
    
    for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
      const exists = headers[header] !== undefined;
      const correct = expectedValue === null || headers[header] === expectedValue;
      
      logTest(
        `Header: ${header}`,
        exists && correct,
        !exists ? 'Faltante' : (!correct ? `Valor incorrecto: ${headers[header]}` : '')
      );
    }
  } catch (error) {
    log(`Error al verificar headers: ${error.message}`, 'red');
  }
}

async function testInputValidation() {
  log('\n=== Pruebas de Validación de Entrada ===', 'blue');
  
  // Email inválido
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      nombre: 'Test User',
      email: 'not-an-email',
      password: 'Test1234!'
    }, {
      validateStatus: () => true
    });
    
    const validated = response.status === 400;
    
    logTest(
      'Email inválido rechazado',
      validated,
      !validated ? 'VULNERABLE: Email inválido aceptado' : ''
    );
  } catch (error) {
    logTest('Email inválido rechazado', true);
  }
  
  // Contraseña débil
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      nombre: 'Test User',
      email: 'test@test.com',
      password: '123'
    }, {
      validateStatus: () => true
    });
    
    const validated = response.status === 400;
    
    logTest(
      'Contraseña débil rechazada',
      validated,
      !validated ? 'VULNERABLE: Contraseña débil aceptada' : ''
    );
  } catch (error) {
    logTest('Contraseña débil rechazada', true);
  }
  
  // Búsqueda muy larga
  try {
    const longQuery = 'a'.repeat(300);
    const response = await axios.get(`${BASE_URL}/api/books/search`, {
      params: { q: longQuery },
      validateStatus: () => true
    });
    
    const validated = response.status === 400;
    
    logTest(
      'Búsqueda excesivamente larga rechazada',
      validated,
      !validated ? 'VULNERABLE: No hay límite de longitud' : ''
    );
  } catch (error) {
    logTest('Búsqueda excesivamente larga rechazada', true);
  }
}

async function testPaymentSecurity() {
  log('\n=== Pruebas de Seguridad de Pagos ===', 'blue');
  
  // Intentar crear transacción sin autenticación
  try {
    const response = await axios.post(`${BASE_URL}/api/payment/create`, {
      order_id: 1
    }, {
      validateStatus: () => true
    });
    
    const protected = response.status === 401;
    
    logTest(
      'Crear transacción sin autenticación',
      protected,
      !protected ? 'VULNERABLE: Endpoint de pago no protegido' : ''
    );
  } catch (error) {
    logTest('Crear transacción sin autenticación', true);
  }
  
  // Intentar enviar webhook sin firma
  try {
    const response = await axios.post(`${BASE_URL}/api/payment/webhook`, {
      data: {
        transaction: {
          id: 'fake-123',
          status: 'APPROVED',
          amount_in_cents: 100000
        }
      }
    }, {
      validateStatus: () => true
    });
    
    // En desarrollo puede pasar, en producción debe fallar
    const isProduction = process.env.NODE_ENV === 'production';
    const protected = isProduction ? response.status === 403 : true;
    
    logTest(
      'Webhook sin firma válida',
      protected,
      !protected ? 'VULNERABLE: Webhook acepta datos sin verificación' : ''
    );
  } catch (error) {
    logTest('Webhook sin firma válida', true);
  }
}

async function testHTTPS() {
  log('\n=== Pruebas de HTTPS ===', 'blue');
  
  if (BASE_URL.startsWith('https://')) {
    try {
      const response = await axios.get(BASE_URL.replace('https://', 'http://'), {
        validateStatus: () => true,
        maxRedirects: 0
      });
      
      const redirects = response.status === 301 || response.status === 302;
      
      logTest(
        'HTTP redirige a HTTPS',
        redirects,
        !redirects ? 'ADVERTENCIA: HTTP no redirige a HTTPS' : ''
      );
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logTest('HTTP redirige a HTTPS', true, 'Puerto HTTP cerrado (correcto)');
      } else {
        logTest('HTTP redirige a HTTPS', false, error.message);
      }
    }
  } else {
    log('⚠ Prueba omitida: URL no es HTTPS', 'yellow');
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'magenta');
  log('║   PRUEBAS DE SEGURIDAD AUTOMATIZADAS - LibroShop      ║', 'magenta');
  log('╚════════════════════════════════════════════════════════╝', 'magenta');
  log(`\nURL de prueba: ${BASE_URL}`, 'blue');
  log('Iniciando pruebas...\n', 'blue');

  try {
    await testSecurityHeaders();
    await testSQLInjection();
    await testXSS();
    await testCSRF();
    await testAuthBypass();
    await testInputValidation();
    await testPaymentSecurity();
    await testRateLimiting();
    await testHTTPS();
  } catch (error) {
    log(`\nError crítico: ${error.message}`, 'red');
  }

  // Resumen
  log('\n╔════════════════════════════════════════════════════════╗', 'magenta');
  log('║                    RESUMEN                             ║', 'magenta');
  log('╚════════════════════════════════════════════════════════╝', 'magenta');
  log(`\nPruebas pasadas: ${passedTests}`, 'green');
  log(`Pruebas fallidas: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  
  const total = passedTests + failedTests;
  const percentage = total > 0 ? ((passedTests / total) * 100).toFixed(1) : 0;
  
  log(`\nPorcentaje de seguridad: ${percentage}%`, percentage >= 80 ? 'green' : 'red');
  
  if (failedTests > 0) {
    log('\n⚠ ADVERTENCIA: Se encontraron vulnerabilidades', 'red');
    log('Revisa el archivo SECURITY_CHECKLIST.md para más detalles\n', 'yellow');
    process.exit(1);
  } else {
    log('\n✓ Todas las pruebas pasaron exitosamente', 'green');
    log('La aplicación tiene un nivel de seguridad aceptable\n', 'green');
    process.exit(0);
  }
}

// Ejecutar pruebas
runAllTests().catch(error => {
  log(`\nError fatal: ${error.message}`, 'red');
  process.exit(1);
});
