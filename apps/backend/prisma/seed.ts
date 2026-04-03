import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../../.env');

dotenv.config({ path: envPath });

function getConnectionString() {
  return process.env.DIRECT_URL || process.env.DATABASE_URL;
}

function needsSsl(connectionString: string) {
  return /sslmode=require/i.test(connectionString) || connectionString.includes('supabase.com');
}

function normalizeConnectionString(connectionString: string) {
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');
  url.searchParams.delete('sslcert');
  url.searchParams.delete('sslkey');
  url.searchParams.delete('sslrootcert');
  return url.toString();
}

function getSeedFilePath() {
  const seedFile =
    process.env.SEED_FILE?.trim() || 'supabase/seeds/20260403200000_turon_kafesi_catalog_refresh.sql';
  return path.resolve(__dirname, '../../../', seedFile);
}

async function main() {
  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL must be set before running seed.');
  }

  const seedPath = getSeedFilePath();
  const sql = await readFile(seedPath, 'utf8');

  const client = new Client({
    connectionString: normalizeConnectionString(connectionString),
    ssl: needsSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();

  try {
    console.log(`Applying seed file: ${path.basename(seedPath)}`);
    await client.query(sql);
  } finally {
    await client.end();
  }

  console.log('Supabase seed applied successfully.');
}

main().catch((error) => {
  console.error('Supabase seed failed:', error);
  process.exit(1);
});
