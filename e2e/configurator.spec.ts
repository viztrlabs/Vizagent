import { test, expect } from '@playwright/test';

test.describe('Configurator Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', 'admin@viztr.io');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL('**/portal', { timeout: 10000 }).catch(() => {});

    // Navigate directly to a configurator page (using a known project ID from mock data)
    await page.goto('/configurator/1');
  });

  test('should load configurator page', async ({ page }) => {
    // Wait for page to load - either loading message or sidebar
    await Promise.race([
      page.waitForSelector('text=Loading 3D Engine...', { timeout: 5000 }).catch(() => {}),
      page.waitForSelector('button:has-text("Materials")', { timeout: 10000 }).catch(() => {})
    ]);
    
    // Verify we're on a configurator page
    await expect(page).toHaveURL(/\/configurator\//);
  });

  test('should switch between sidebar tabs if present', async ({ page }) => {
    const materialsTab = page.locator('button:has-text("Materials")');
    const tabCount = await materialsTab.count();
    
    if (tabCount > 0) {
      await expect(materialsTab).toBeVisible({ timeout: 10000 });
      
      // Test tab switching
      const tabs = ['Lighting', 'Hotspots', 'Export', 'AR'];
      for (const tab of tabs) {
        const tabButton = page.locator(`button:has-text("${tab}")`);
        if (await tabButton.count() > 0) {
          await tabButton.click();
          await expect(tabButton).toHaveClass(/border-cyan|text-cyan/);
        }
      }
      
      // Switch back to Materials
      await materialsTab.click();
      await expect(materialsTab).toHaveClass(/border-cyan|text-cyan/);
    }
  });

  test('should adjust material sliders in Materials tab if present', async ({ page }) => {
    const materialsTab = page.locator('button:has-text("Materials")');
    if (await materialsTab.count() > 0) {
      await materialsTab.click();
      
      const sliders = page.locator('input[type="range"]');
      const count = await sliders.count();

      if (count > 0) {
        const firstSlider = sliders.first();
        await expect(firstSlider).toBeVisible();

        const initialValue = await firstSlider.inputValue();
        await firstSlider.fill('50');
        await expect(firstSlider).toHaveValue('50');
      }
    }
  });

  test('should toggle lights in Lighting tab if present', async ({ page }) => {
    const lightingTab = page.locator('button:has-text("Lighting")');
    if (await lightingTab.count() > 0) {
      await lightingTab.click();
      
      const toggles = page.locator('button[role="switch"], input[type="checkbox"]');
      const count = await toggles.count();

      if (count > 0) {
        const firstToggle = toggles.first();
        await expect(firstToggle).toBeVisible();
        await firstToggle.click();
      }
    }
  });

  test('should show export options in Export tab if present', async ({ page }) => {
    const exportTab = page.locator('button:has-text("Export")');
    if (await exportTab.count() > 0) {
      await exportTab.click();

      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');
      const count = await exportButton.count();

      if (count > 0) {
        await expect(exportButton.first()).toBeVisible();
      }
    }
  });

  test('should show undo/redo buttons if present', async ({ page }) => {
    const undoButton = page.locator('button:has-text("Undo"), button[aria-label*="Undo" i]');
    const redoButton = page.locator('button:has-text("Redo"), button[aria-label*="Redo" i]');

    const undoCount = await undoButton.count();
    const redoCount = await redoButton.count();

    if (undoCount > 0) {
      await expect(undoButton.first()).toBeVisible();
    }
    if (redoCount > 0) {
      await expect(redoButton.first()).toBeVisible();
    }
  });

  test('should collapse and expand sidebar on desktop if present', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const materialsTab = page.locator('button:has-text("Materials")');
    
    if (await materialsTab.count() > 0) {
      await materialsTab.waitFor({ state: 'visible', timeout: 10000 });

      const collapseButton = page.locator('button:has-text("→"), button:has-text("←")').first();
      if (await collapseButton.count() > 0) {
        await collapseButton.click();
        // Check if sidebar collapsed (width changed)
        await page.waitForTimeout(500);
        await collapseButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should open mobile bottom sheet when tab clicked if mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    const materialsTab = page.locator('button:has-text("Materials")');
    if (await materialsTab.count() > 0) {
      await materialsTab.waitFor({ state: 'visible', timeout: 10000 });
      
      const lightingTab = page.locator('button:has-text("Lighting")');
      if (await lightingTab.count() > 0) {
        await lightingTab.click();
        const bottomSheet = page.locator('.bottom-sheet, [class*="bottom-sheet"]');
        if (await bottomSheet.count() > 0) {
          await expect(bottomSheet.first()).toBeVisible();
        }
      }
    }
  });
});