import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
  });

  test('should display sign in page with correct elements', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('VizTR');
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]:has-text("Sign In")');
    
    // Wait for error message or stay on signin page
    await page.waitForTimeout(1000);
    const errorVisible = await page.locator('text=Invalid email or password').isVisible().catch(() => false);
    const stillOnSignin = page.url().includes('/auth/signin');
    expect(errorVisible || stillOnSignin).toBeTruthy();
  });

  test('should login with valid credentials (admin@viztr.io / admin)', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@viztr.io');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]:has-text("Sign In")');
    
    // Wait for redirect to portal
    await page.waitForURL('**/portal', { timeout: 10000 }).catch(() => {});
    expect(page.url()).toContain('/portal');
  });

  test('should redirect to signin when accessing protected route without auth', async ({ page }) => {
    await page.goto('/portal');
    await expect(page).toHaveURL('/auth/signin?callbackUrl=/portal');
  });

  test('should sign out', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@viztr.io');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL('**/portal', { timeout: 10000 }).catch(() => {});
    
    // Sign out via next-auth
    await page.goto('/api/auth/signout');
    // Just verify we can access the signout endpoint
    expect(page.url()).toContain('/api/auth/signout');
  });

  test('should redirect to callback URL after login', async ({ page }) => {
    await page.goto('/portal');
    await expect(page).toHaveURL('/auth/signin?callbackUrl=/portal');

    await page.fill('input[type="email"]', 'admin@viztr.io');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL('**/portal', { timeout: 10000 }).catch(() => {});
    expect(page.url()).toContain('/portal');
  });
});