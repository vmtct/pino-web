import { test, expect } from '@playwright/test';

test.describe('Open Studio public journey', () => {
  test('landing exposes the current Open Studio state and a member entry point', async ({ page }) => {
    await page.goto('/open-studio');

    await expect(page.getByRole('heading', { name: /Nếu hôm nay con được tự chọn/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Chọn (một )?buổi cho con/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Vào Member Space/i })).toBeVisible();

    const sessions = page.locator('a.session-card');
    const sessionCount = await sessions.count();

    if (sessionCount > 0) {
      await expect(sessions.first()).toBeVisible({ timeout: 15_000 });
      await expect(sessions.first()).toHaveAttribute('href', /\/open-studio\/session\?id=/);
    } else {
      await expect(page.getByText(/Chưa có session sắp tới/i)).toBeVisible();
    }
  });

  test('session detail route resolves when a live session is available', async ({ page }) => {
    await page.goto('/open-studio');
    const session = page.locator('a.session-card').first();

    if (await session.count() === 0) {
      await expect(page.getByText(/Chưa có session sắp tới/i)).toBeVisible();
      return;
    }

    await expect(session).toBeVisible({ timeout: 15_000 });

    const href = await session.getAttribute('href');
    expect(href).toMatch(/^\/open-studio\/session\?id=.+/);

    await session.click();
    await expect(page).toHaveURL(/\/open-studio\/session\?id=/);
    await expect(page.locator('main')).toBeVisible();
  });
});
