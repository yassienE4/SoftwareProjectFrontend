import { expect, test } from '@playwright/test';

function createJwt(expirationSecondsFromNow: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expirationSecondsFromNow })
  ).toString('base64');

  return `${header}.${payload}.${'signature'}`;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto('/login');
});

test('shows a login error when the API rejects credentials', async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Invalid email or password' }),
    });
  });

  await page.getByLabel('Email').fill('student@example.com');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByText('Invalid email or password')).toBeVisible();
});

test('logs in and stores auth state', async ({ page }) => {
  const accessToken = createJwt(60 * 60);
  const refreshToken = createJwt(60 * 60 * 24);

  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'user-1',
          email: 'student@example.com',
          name: 'Test Student',
          role: 'Student',
        },
        accessToken,
        refreshToken,
      }),
    });
  });

  await page.getByLabel('Email').fill('student@example.com');
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByText('Login successful!')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.evaluate(() => localStorage.getItem('accessToken'))).resolves.toBe(accessToken);
  await expect(page.evaluate(() => localStorage.getItem('refreshToken'))).resolves.toBe(refreshToken);
  await expect(page.evaluate(() => localStorage.getItem('user'))).resolves.toContain('student@example.com');
});