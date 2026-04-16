import { expect, test } from '@playwright/test';
import { clearAppStorage, createMockAppState, mockAppApi } from './support/mock-app';

test.beforeEach(async ({ page }) => {
  await clearAppStorage(page);
});

test('logs in and opens the profile page', async ({ page }) => {
  const state = createMockAppState();
  await mockAppApi(page, state);

  await page.goto('/login');
  await page.getByLabel('Email').fill('student@example.com');
  await page.getByLabel('Password').fill('Student123!');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/\/home$/);

  await page.goto('/profile');
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  await expect(page.getByText('student@example.com')).toBeVisible();
});