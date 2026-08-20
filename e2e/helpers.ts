import { expect, type Page } from '@playwright/test';

export const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'admin@viztr.io';
export const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin';

/**
 * Fill a field, retrying until the value sticks. Guarded against the hydration
 * race where React re-renders the SSR'd form and resets controlled inputs.
 */
export async function stickyFill(
  page: Page,
  locator: ReturnType<Page['getByLabel']>,
  value: string
) {
  await expect(locator).toBeVisible();
  for (let attempt = 0; attempt < 5; attempt++) {
    await locator.fill(value);
    const actual = await locator.inputValue();
    if (actual === value) return;
    await page.waitForTimeout(500);
  }
  throw new Error(`stickyFill failed to set value "${value}"`);
}

/**
 * Sign in and wait for the portal redirect. Retries the whole flow to guard
 * against the hydration race where React resets controlled inputs, and avoids
 * `networkidle` which can hang on the dev server (HMR websockets).
 */
export async function signIn(page: Page) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto('/auth/signin');
    const email = page.getByLabel('Email');
    const password = page.getByLabel('Password');
    await expect(email).toBeVisible({ timeout: 15000 });
    await expect(password).toBeVisible();

    for (let fill = 0; fill < 5; fill++) {
      await email.fill(TEST_EMAIL);
      await password.fill(TEST_PASSWORD);
      const [emailValue, passwordValue] = await Promise.all([
        email.inputValue(),
        password.inputValue(),
      ]);
      if (emailValue === TEST_EMAIL && passwordValue === TEST_PASSWORD) break;
      await page.waitForTimeout(300);
    }

    await page.click('button[type="submit"]');
    try {
      await page.waitForURL('**/portal', { timeout: 15000 });
      return;
    } catch {
      // retry the whole flow
    }
  }
  throw new Error('signIn failed after 3 attempts');
}