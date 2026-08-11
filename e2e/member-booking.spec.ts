import { test, expect } from '@playwright/test';

const phone = process.env.E2E_MEMBER_PHONE;

test.describe('Open Studio member booking journey', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!phone, 'E2E_MEMBER_PHONE is not configured; member E2E is opt-in until a dedicated test account is provided.');
    await page.addInitScript((value) => {
      sessionStorage.setItem('pino_member_phone', value as string);
    }, phone!);
  });

  test('member can reach booking confirmation with a live family, pass and session', async ({ page }) => {
    await page.goto('/open-studio/member/book');

    await expect(page.getByRole('heading', { name: /Book a session/i })).toBeVisible({ timeout: 15_000 });

    const students = page.locator('button.student');
    await expect(students.first()).toBeVisible({ timeout: 15_000 });
    await students.first().click();

    const sessions = page.locator('button.session:not(.sold)');
    await expect(sessions.first()).toBeVisible({ timeout: 15_000 });
    await sessions.first().click();

    const confirm = page.getByRole('button', { name: /Confirm booking/i });
    await expect(confirm).toBeEnabled();

    // This test intentionally stops before the mutating booking request.
    // It verifies the complete browser-side journey and that the production
    // data model supplies a usable student + session + pass combination.
    await expect(page.getByText(/Your booking/i)).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
  });
});
