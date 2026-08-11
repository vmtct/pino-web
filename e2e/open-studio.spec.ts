import { test, expect } from '@playwright/test';

test.describe('Open Studio public journey', () => {
  test('landing exposes live Open Studio sessions and a member entry point', async ({ page }) => {
    await page.goto('/open-studio');

    await expect(page.getByRole('heading', { name: /Nếu hôm nay con được tự chọn/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Xem các buổi đang có/i }).first()).toBeVisible();

    const sessions = page.locator('a.session-card');
    await expect(sessions.first()).toBeVisible({ timeout: 15_000 });
    await expect(sessions.first()).toHaveAttribute('href', /\/open-studio\/session\?id=/);

    await expect(page.getByRole('link', { name: /Vào Member Space/i })).toBeVisible();
  });

  test('session detail route resolves from a live session link', async ({ page }) => {
    await page.goto('/open-studio');
    const session = page.locator('a.session-card').first();
    await expect(session).toBeVisible({ timeout: 15_000 });

    const href = await session.getAttribute('href');
    expect(href).toMatch(/^\/open-studio\/session\?id=.+/);

    await session.click();
    await expect(page).toHaveURL(/\/open-studio\/session\?id=/);
    await expect(page.locator('main')).toBeVisible();
  });
});
