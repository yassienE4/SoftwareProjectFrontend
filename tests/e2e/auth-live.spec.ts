import { expect, test } from '@playwright/test';

const email = 'yassienebrahim@gmail.com';
const password = '12345678';
const demoDelayMs = 900;

async function demoPause(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForTimeout(demoDelayMs);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => localStorage.clear());
});

test('logs in and opens the profile page', async ({ page }) => {
  await demoPause(page);

  await page.getByLabel('Email').fill(email);
  await demoPause(page);

  await page.getByLabel('Password').fill(password);
  await demoPause(page);

  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Login successful!')).toBeVisible();
  await page.waitForFunction(() => !!localStorage.getItem('accessToken'));
  await page.waitForURL('**/home');
  await demoPause(page);

  await page.goto('/profile');
  await demoPause(page);

  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.locator('[data-slot="card-title"]')).toHaveText('Profile');
  await expect(page.locator('[data-slot="card-description"]')).toHaveText(
    'View your account information'
  );
  await expect(page.getByText('Email', { exact: true })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
});