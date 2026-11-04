import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mariadb from 'mariadb';

const migrations = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../backend/prisma/migrations');

/** Fresh MySQL database for every run: recreate, apply the Prisma migrations, seed base + demo data. */
export default async function globalSetup() {
  const url = process.env.E2E_DATABASE_URL ?? 'mysql://hrms:hrms@127.0.0.1:3306/hrms_e2e';
  const u = new URL(url);
  const db = decodeURIComponent(u.pathname.slice(1));
  if (!/^[A-Za-z0-9_]+$/.test(db) || !db.includes('e2e')) throw new Error(`Refusing to reset "${db}": the e2e database name must contain "e2e"`);
  const conn = await mariadb.createConnection({
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    allowPublicKeyRetrieval: true,
    multipleStatements: true,
  });
  try {
    await conn.query(`DROP DATABASE IF EXISTS \`${db}\``);
    await conn.query(`CREATE DATABASE \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
    await conn.query(`USE \`${db}\``);
    for (const dir of readdirSync(migrations).filter((d) => existsSync(path.join(migrations, d, 'migration.sql'))).sort()) {
      await conn.query(readFileSync(path.join(migrations, dir, 'migration.sql'), 'utf8'));
    }
  } finally {
    await conn.end();
  }
  const env = { ...process.env, DATABASE_URL: url, ADMIN_EMAIL: 'admin@systory.la', ADMIN_PASSWORD: 'ChangeMe123', JWT_SECRET: 'e2e-secret-e2e-secret-e2e-secret-e2e-1234' };
  execSync('npx tsx prisma/seed-demo.ts', { cwd: '../backend', env, stdio: 'pipe' });
}
