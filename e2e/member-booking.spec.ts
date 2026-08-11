import { test, expect } from '@playwright/test';

const phone = process.env.E2E_MEMBER_PHONE;

test.describe('Open Studio member booking journey', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!phone, 'E2E_MEMBER_PHONE is not configured; member E2E is opt-in until a dedicated test account is provided.');
    await page.addInitScript((value) => {
      sessionStorage.setItem('pino_member_phone', value as string);
    }, phone!);
  });

  test('member can submit the real booking flow through server validation without mutating Notion', async ({ page }) => {
    await page.route('**/api/member/book', async (route) => {
      const request = route.request();
      const validationUrl = request.url().replace('/api/member/book', '/api/member/book/validate');
      const response = await route.fetch({ url: validationUrl, method: 'POST', postData: request.postData() || undefined });
      await route.fulfill({ response });
    });

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
    await confirm.click();

    await expect(page.getByRole('heading', { name: /Hẹn gặp bạn tại PINO/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/BOOKING CONFIRMED/i)).toBeVisible();
  });
});
