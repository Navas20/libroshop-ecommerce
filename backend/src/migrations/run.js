require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runMigrations() {
  console.log('========================================');
  console.log('  Iniciando migraciones de LibroShop');
  console.log('========================================\n');

  try {
    const connection = await pool.getConnection();

    const migrationDir = __dirname;
    const files = fs.readdirSync(migrationDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No se encontraron archivos SQL de migración.');
      connection.release();
      await pool.end();
      return;
    }

    for (const file of files) {
      const filePath = path.join(migrationDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      console.log(`Ejecutando: ${file}`);

      for (const statement of statements) {
        try {
          await connection.query(statement);
        } catch (err) {
          console.error(`  Error en statement: ${err.message}`);
        }
      }

      console.log(`  Completado: ${file}\n`);
    }

    connection.release();
    console.log('========================================');
    console.log('  Migraciones ejecutadas exitosamente');
    console.log('========================================');
  } catch (err) {
    console.error('Error ejecutando migraciones:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
