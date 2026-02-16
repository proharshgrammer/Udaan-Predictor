require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Force SSL configuration for Neon if not local
const isLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost');
const sslConfig = isLocal ? false : { rejectUnauthorized: false };

console.log(`Connecting to database... (SSL: ${JSON.stringify(sslConfig)})`);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig
});

const runSchema = async () => {
  const client = await pool.connect();
  try {
    console.log('Running schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('Schema executed successfully.');

    // Check for migrations
    const migrationPath = path.join(__dirname, 'migration_imports.sql');
    if (fs.existsSync(migrationPath)) {
        console.log('Running migration_imports.sql...');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        await client.query(migrationSql);
        console.log('Migration executed successfully.');
    }

  } catch (err) {
    console.error('Error executing schema:', err);
  } finally {
    client.release();
    pool.end();
  }
};

runSchema();
