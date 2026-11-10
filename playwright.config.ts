import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Mobile Small (iPhone SE 375px)',
      use: { ...devices['iPhone SE'] },
    },
    {
      name: 'Mobile Standard (iPhone 14/15 393px)',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'Tablet (iPad Mini 768px)',
      use: { ...devices['iPad Mini'] },
    },
    {
      name: 'Desktop (1440px)',
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});

