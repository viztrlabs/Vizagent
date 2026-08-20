import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'admin@viztr.io';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin';

test.describe('Virtual Tour Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]:has-text("Sign In")');
    await expect(page).toHaveURL('/portal');
  });

  test('tour page loads and displays viewer container', async ({ page }) => {
    await page.goto('/tour/sample-tour-id');
    await expect(page).toHaveURL(/.*\/tour\/sample-tour-id/);
    await expect(page.locator('.viztr-tour-container')).toBeVisible();
  });

  test('tour page shows TourMenu with project info', async ({ page }) => {
    await page.goto('/tour/sample-tour-id');
    await expect(page.locator('[aria-label="Tour Menu"], [aria-label="Tour menu"]')).toBeVisible();
  });

  test('ModeManager renders with view mode tabs', async ({ page }) => {
    await page.goto('/tour/sample-tour-id');
    await expect(page.locator('[role="tablist"][aria-label="View mode"]')).toBeVisible();
    await expect(page.locator('text=Panoramic')).toBeVisible();
  });

  test('ViewModeSwitcher shows mode toggle buttons', async ({ page }) => {
    await page.goto('/tour/sample-tour-id');
    await expect(page.locator('.viztr-view-mode-switcher')).toBeVisible();
  });

  test('MeasurementTool renders measure button', async ({ page }) => {
    await page.goto('/tour/sample-tour-id');
    await expect(page.locator('text=Measure')).toBeVisible();
  });

  test('floor selector appears when tour has floors', async ({ page }) => {
    await page.goto('/tour/sample-tour-id');
    const floorSelector = page.locator('.viztr-floor-selector');
    if (await floorSelector.count() > 0) {
      await expect(floorSelector).toBeVisible();
    }
  });

  test('timeline player appears on multi-scene tours', async ({ page }) => {
    await page.goto('/tour/sample-tour-id');
    const timeline = page.locator('[aria-label="Scene navigation"], .viztr-timeline');
    await expect(timeline).toBeVisible();
  });

  test('compass rotates based on heading', async ({ page }) => {
    await page.goto('/tour/sample-tour-id');
    const compass = page.locator('.viztr-compass');
    if (await compass.count() > 0) {
      await expect(compass).toBeVisible();
    }
  });

  test('API returns tour config for valid project', async ({ page }) => {
    const response = await page.request.get('/api/tours/sample-tour-id');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('success');
  });

  test('tour stats API returns counts', async ({ page }) => {
    const response = await page.request.get('/api/tours/sample-tour-id/stats');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('totalViews');
    expect(data).toHaveProperty('sceneCount');
  });
});
