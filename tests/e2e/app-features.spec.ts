import { expect, test, type Locator, type Page } from '@playwright/test';
import { clearAppStorage, createMockAppState, mockAppApi, seedAuthState } from './support/mock-app';

async function chooseSelectOption(page: Page, triggerTestId: string, optionTestId: string): Promise<void> {
  await page.getByTestId(triggerTestId).click();
  await page.getByTestId(optionTestId).click();
}

async function openRowAction(page: Page, rowText: string, actionIndex: number): Promise<void> {
  const row = page.locator('tr').filter({ hasText: rowText }).first();
  await row.getByRole('button').nth(actionIndex).click();
}

async function openQuestionAction(page: Page, questionText: string, actionIndex: number): Promise<void> {
  const card = page.locator('div.rounded-lg.border.p-4').filter({ hasText: questionText }).first();
  await card.getByRole('button').nth(actionIndex).click();
}

test.describe('feature suite', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page);
  });

  test('shows public navigation and redirects protected routes without auth', async ({ page }) => {
    const state = createMockAppState();
    await mockAppApi(page, state);

    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign Up' })).toBeVisible();

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('covers signup, login, profile, navbar logout, and home token refresh', async ({ page }) => {
    const state = createMockAppState();
    await mockAppApi(page, state);

    await page.goto('/register');
    await page.getByLabel('Full Name').fill('New Instructor');
    await page.getByLabel('Email').fill('new.instructor@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirm Password', { exact: true }).fill('Password123!');
    await chooseSelectOption(page, 'register-role-trigger', 'register-role-instructor');
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByText('Account created successfully! Redirecting to login...')).toBeVisible();
    await page.waitForURL('**/login');

    await seedAuthState(page, state.users.find((entry) => entry.email === 'new.instructor@example.com')!);
    await page.goto('/home');
    await expect(page.getByRole('heading', { name: 'Home Page' })).toBeVisible();

    await page.reload();
    await page.getByRole('button', { name: 'New Instructor' }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign Up' })).toBeVisible();

    await seedAuthState(page, state.users.find((entry) => entry.email === 'student@example.com')!, {
      expiredAccessToken: true,
    });
    await page.goto('/home');
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole('heading', { name: 'Home Page' })).toBeVisible();
  });

  test('lets an admin manage users and filter by role', async ({ page }) => {
    const state = createMockAppState();
    await mockAppApi(page, state);
    await seedAuthState(page, state.users[0]);

    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();

    await chooseSelectOption(page, 'user-role-filter-trigger', 'user-role-filter-instructor');
    await expect(page.getByText('Instructor User')).toBeVisible();

    await page.getByRole('button', { name: 'Create User' }).click();
    await page.getByLabel('Name').fill('Temp Reviewer');
    await page.getByLabel('Email').fill('temp.reviewer@example.com');
    await page.getByLabel('Password', { exact: true }).fill('TempPass123!');
    await chooseSelectOption(page, 'create-user-role-trigger', 'create-user-role-instructor');
    await page.getByRole('button', { name: 'Create User' }).click();

    await expect(page.getByText('temp.reviewer@example.com')).toBeVisible();

    const createdRow = page.locator('tr').filter({ hasText: 'temp.reviewer@example.com' }).first();
    await createdRow.getByRole('button').nth(0).click();
    await page.getByLabel('Name').fill('Temp Reviewer Updated');
    await page.getByLabel('New Password (Optional)').fill('TempPass456!');
    await page.getByRole('button', { name: 'Update User' }).click();

    await expect(page.getByText('Temp Reviewer Updated')).toBeVisible();
    await expect(page.locator('tr').filter({ hasText: 'Temp Reviewer Updated' }).first()).toContainText('Instructor');

    await openRowAction(page, 'temp.reviewer@example.com', 1);
    await page.getByRole('button', { name: 'Delete User' }).click();
    await expect(page.locator('tbody')).not.toContainText('temp.reviewer@example.com');
  });

  test('lets an admin manage exams and open an exam detail page', async ({ page }) => {
    const state = createMockAppState();
    await mockAppApi(page, state);
    await seedAuthState(page, state.users[0]);

    await page.goto('/exams');
    await expect(page.getByRole('heading', { name: 'Exams' })).toBeVisible();

    await chooseSelectOption(page, 'exam-status-filter-trigger', 'exam-status-filter-draft');
    await expect(page.getByText('Draft Review Exam')).toBeVisible();

    await page.getByRole('button', { name: 'Create Exam' }).click();
    await page.getByLabel('Title').fill('Automation Generated Exam');
    await page.getByLabel('Description').fill('Created from the Playwright feature suite');
    await page.getByLabel('Duration (minutes)').fill('90');
    await chooseSelectOption(page, 'exam-course-trigger', 'exam-course-course-1');
    await chooseSelectOption(page, 'exam-status-trigger', 'exam-status-draft');
    await chooseSelectOption(page, 'exam-instructor-trigger', 'exam-instructor-user-instructor');
    await page.getByRole('button', { name: 'Create Exam' }).click();

    await expect(page.getByText('Exam created successfully')).toBeVisible();

    const createdExamRow = page.locator('tr').filter({ hasText: 'Automation Generated Exam' }).first();
    await expect(createdExamRow).toBeVisible({ timeout: 10000 });

    await createdExamRow.getByRole('link', { name: 'Open' }).click();
    await expect(page).toHaveURL(/\/exams\/exam-4$/);
    await expect(page.getByRole('heading', { name: 'Automation Generated Exam' })).toBeVisible();

    await page.goto('/exams');
    const updatedRow = page.locator('tr').filter({ hasText: 'Automation Generated Exam' }).first();
    await updatedRow.getByRole('button').nth(1).click();
    await page.getByRole('button', { name: 'Delete Exam' }).click();
    await expect(page.locator('tbody')).not.toContainText('Automation Generated Exam');
  });

  test('lets an instructor manage questions on an exam', async ({ page }) => {
    const state = createMockAppState();
    await mockAppApi(page, state);
    await seedAuthState(page, state.users[1]);

    await page.goto('/exams/exam-1');
    await expect(page.getByRole('heading', { name: 'Foundations Midterm' })).toBeVisible();
    await expect(page.getByText('What is 2 + 2?')).toBeVisible();

    await page.getByRole('button', { name: 'Add Question' }).click();
    await page.getByLabel('Order').fill('2');
    await page.getByLabel('Points').fill('3');
    await chooseSelectOption(page, 'question-type-trigger', 'question-type-truefalse');
    await page.getByLabel('Question Text').fill('The earth is round.');
    await chooseSelectOption(page, 'question-correct-answer-trigger', 'question-correct-answer-true');
    await page.getByRole('button', { name: 'Create Question' }).click();

    await expect(page.getByText('The earth is round.')).toBeVisible();

    await openQuestionAction(page, 'The earth is round.', 0);
    await page.getByLabel('Question Text').fill('The earth is spherical.');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('The earth is spherical.')).toBeVisible();

    await openQuestionAction(page, 'The earth is spherical.', 1);
    await expect(page.getByText('The earth is spherical.')).not.toBeVisible();
  });

  test('lets a student start and submit an exam attempt', async ({ page }) => {
    const state = createMockAppState();
    await mockAppApi(page, state);
    await seedAuthState(page, state.users[2]);

    await page.goto('/exams/exam-1');
    await expect(page.getByRole('button', { name: 'Start Exam' })).toBeVisible();
    await page.getByRole('button', { name: 'Start Exam' }).click();

    await page.getByRole('radio', { name: '4' }).check();
    await page.getByRole('button', { name: 'Submit Exam' }).click();

    await expect(page.getByText('Your attempt is complete')).toBeVisible();
    await expect(page.getByText('Score: 5')).toBeVisible();
    await expect(page.getByText('1 / 1')).toBeVisible();
  });
});