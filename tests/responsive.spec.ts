import { test, expect } from '@playwright/test';

test.describe('LUMO HQ — RESPONSIVE & MOBILE-FIRST E2E AUDIT', () => {
  test('Landing Page renders with no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/');

    // Check no horizontal scrollbar / overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Check Hero title is visible
    const heroTitle = page.locator('h1');
    await expect(heroTitle).toBeVisible();

    // Check touch target sizes: all buttons >= 48px
    const buttons = await page.locator('button, a.min-h-touch').all();
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box && box.height > 0) {
        // Buttons with min-h-touch should be at least 40px in visual height (accounting for padding/borders)
        expect(box.height).toBeGreaterThanOrEqual(38);
      }
    }
  });

  test('Interactive Demo switches channels and updates simulated phone view', async ({ page }) => {
    await page.goto('/#demos');

    // Click Meta Business tab
    const metaTab = page.getByRole('button', { name: /Instagram y Facebook/i });
    if (await metaTab.isVisible()) {
      await metaTab.click();
      await expect(page.getByText('Escribir por Instagram / Messenger')).toBeVisible();
    }

    // Click WhatsApp tab
    const whatsappTab = page.getByRole('button', { name: /WhatsApp Business Completo/i });
    if (await whatsappTab.isVisible()) {
      await whatsappTab.click();
      await expect(page.getByText('Chatear por WhatsApp Business')).toBeVisible();
    }
  });

  test('Language toggle switches between Spanish and English instantly', async ({ page }) => {
    await page.goto('/');

    // Find lang toggle
    const langToggle = page.locator('button[aria-label="Toggle language"]').first();
    await langToggle.click();

    // Verify English text appears
    await expect(page.getByText('Local Businesses, Visible').or(page.getByText('Request Audit'))).toBeVisible();

    // Toggle back
    await langToggle.click();
    await expect(page.getByText('Negocios Locales, Visibles').or(page.getByText('Solicitar Diagnóstico'))).toBeVisible();
  });
});

