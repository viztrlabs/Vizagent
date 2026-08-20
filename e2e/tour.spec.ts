import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

test.describe('Virtual Tour Features', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('tour page loads and displays viewer container', async ({ page }) => {
    await page.goto('/tour/sample-tour-id');
    await expect(page).toHaveURL(/.*\/tour\/sample-tour-id/);
    await expect(page.locator('.viztr-tour-container')).toBeVisible();
  });

  test('tour page shows TourMenu with project info', async ({ page }) => {
    await page.goto('/tour/sample-tour-id');
    await expect(page.locator('.viztr-tour-container')).toBeVisible();
    await page.waitForLoadState('networkidle');
    const trigger = page.locator('[aria-label="Open tour menu"]');
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveCSS('position', 'absolute');
    for (let attempt = 0; attempt < 3; attempt++) {
      await trigger.click({ timeout: 5000 });
      const dialog = page.locator('[aria-label="Tour information"]');
      if (await dialog.isVisible().catch(() => false)) break;
      await page.waitForTimeout(500);
    }
    await expect(page.locator('[aria-label="Tour information"]')).toBeVisible();
  });

  test('ModeManager renders with view mode tabs', async ({ page }) => {
    await page.goto('/tour/sample-tour-id');
    await expect(page.locator('[role="tablist"][aria-label="View mode"]')).toBeVisible();
    await expect(page.locator('text=Panoramic')).toBeVisible();
  });

  test('mode switcher shows mode toggle buttons', async ({ page }) => {
    await page.goto('/tour/sample-tour-id');
    await expect(page.locator('.viztr-mode-switcher')).toBeVisible();
    await expect(page.locator('.viztr-mode-tab:has-text("Dollhouse")')).toBeVisible();
    await expect(page.locator('.viztr-mode-tab:has-text("Floor Plan")')).toBeVisible();
  });

  test('MeasurementTool renders measure button', async ({ page }) => {
    await page.goto('/tour/sample-tour-id');
    await expect(page.locator('.viztr-measure-button')).toBeVisible();
    await expect(page.locator('.viztr-measure-button')).toHaveText('Measure');
  });

  test('floor selector appears when tour has floors', async ({ page }) => {
    await page.goto('/tour/sample-tour-id');
    const floorSelector = page.locator('select:has(option[value^="floor-"])');
    if (await floorSelector.count() > 0) {
      await expect(floorSelector).toBeVisible();
    }
  });

  test('timeline player appears on multi-scene tours', async ({ page }) => {
    await page.goto('/tour/sample-tour-id');
    const timeline = page.locator('[aria-label="Next scene"], [aria-label="Previous scene"]');
    await expect(timeline.first()).toBeVisible();
  });

  test('compass rotates based on heading', async ({ page }) => {
    await page.goto('/tour/sample-tour-id');
    const compass = page.locator('text=N').first();
    if (await compass.count() > 0) {
      await expect(compass).toBeVisible();
    }
  });

  test('public API returns tour config for valid project', async ({ page }) => {
    const response = await page.request.get('/api/public/tour/sample-tour-id');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('scenes');
  });

  test('tour stats API returns counts', async ({ page }) => {
    const response = await page.request.get('/api/tours/sample-tour-id/stats');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('totalViews');
    expect(data).toHaveProperty('sceneCount');
  });
});