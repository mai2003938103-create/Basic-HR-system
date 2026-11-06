import { defineConfig, devices } from '@playwright/test';

const DB = process.env.E2E_DATABASE_URL ?? 'mysql://hrms:hrms@127.0.0.1:3306/hrms_e2e';
const backendEnv = {
  NODE_ENV: 'development',
  PORT: '4100',
  DATABASE_URL: DB,
  JWT_SECRET: 'e2e-secret-e2e-secret-e2e-secret-e2e-1234',
  CORS_ORIGIN: 'http://localhost:5180',
  ADMIN_EMAIL: 'admin@systory.la',
  ADMIN_PASSWORD: 'ChangeMe123',
  UPLOAD_DIR: 'uploads-e2e',
};

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: { baseURL: 'http://localhost:5180', trace: 'retain-on-failure', locale: 'lo-LA', timezoneId: 'Asia/Vientiane' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npx tsx src/server.ts',
      cwd: '../backend',
      url: 'http://localhost:4100/api/health',
      env: backendEnv,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      // Production build of the Next.js app; /api is forwarded to the e2e backend.
      command: 'npx next build && npx next start -p 5180',
      url: 'http://localhost:5180/login',
      env: { BACKEND_URL: 'http://localhost:4100', NEXT_TELEMETRY_DISABLED: '1' },
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
});
