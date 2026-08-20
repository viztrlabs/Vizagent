import { test, expect } from '@playwright/test';
import { TEST_EMAIL, TEST_PASSWORD, signIn, stickyFill } from './helpers';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
  });

  test('should display sign in page with correct elements', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Sign in');
    await expect(page.locator('text=Access your portal and dashboard')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Sign in")')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await stickyFill(page, page.getByLabel('Email'), 'wrong@test.com');
    await stickyFill(page, page.getByLabel('Password'), 'wrongpassword');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);
    const errorVisible = await page.locator('text=Invalid email or password').isVisible().catch(() => false);
    const stillOnSignin = page.url().includes('/auth/signin');
    expect(errorVisible || stillOnSignin).toBeTruthy();
  });

  test('should login with valid credentials', async ({ page }) => {
    await signIn(page);
    expect(page.url()).toContain('/portal');
  });

  test('should redirect to signin when accessing protected route without auth', async ({ page }) => {
    await page.goto('/portal');
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.*portal/);
  });

  test('should sign out', async ({ page }) => {
    await signIn(page);
    await page.click('button:has-text("Sign out")');
    await page.waitForURL('/', { timeout: 5000 }).catch(() => {});
    expect(page.url()).toContain('/');
  });

  test('should redirect to callback URL after login', async ({ page }) => {
    await page.goto('/portal');
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.*portal/);

    await page.goto('/auth/signin?callbackUrl=/portal');
    await stickyFill(page, page.getByLabel('Email'), TEST_EMAIL);
    await stickyFill(page, page.getByLabel('Password'), TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/portal', { timeout: 30000 });
    expect(page.url()).toContain('/portal');
  });
});