import { execSync } from 'node:child_process';
import pg from 'pg';

/** Fresh database for every run: create if missing, reset schema, seed base + demo data. */
export default async function globalSetup() {
  const url = process.env.E2E_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/hrms_e2e';
  const u = new URL(url);
  const dbName = u.pathname.slice(1);
  u.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: u.toString() });
  await admin.connect();
  const exists = await admin.query('select 1 from pg_database where datname = $1', [dbName]);
  if (!exists.rowCount) await admin.query(`create database "${dbName}"`);
  await admin.end();
  const env = { ...process.env, DATABASE_URL: url, ADMIN_EMAIL: 'admin@systory.la', ADMIN_PASSWORD: 'ChangeMe123', JWT_SECRET: 'e2e-secret-e2e-secret-e2e-secret-e2e-1234' };
  execSync('npx tsx scripts/migrate.ts --reset', { cwd: '../backend', env, stdio: 'pipe' });
  execSync('npx tsx scripts/seed-demo.ts', { cwd: '../backend', env, stdio: 'pipe' });
}
