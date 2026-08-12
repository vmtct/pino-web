import { test, expect } from '@playwright/test';

test.describe('Open Studio public journey', () => {
  test('landing exposes live Open Studio sessions and a member entry point', async ({ page }) => {
    await page.goto('/open-studio');

    await expect(page.getByRole('heading', { name: /Nếu hôm nay con được tự chọn/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Chọn một buổi cho con/i }).first()).toBeVisible();

    const sessions = page.locator('a.session-card');
    const emptyState = page.locator('.session-empty');
    await expect(sessions.first().or(emptyState)).toBeVisible({ timeout: 15_000 });
    if (await sessions.count()) {
      await expect(sessions.first()).toHaveAttribute('href', /\/open-studio\/session\?id=/);
    } else {
      await expect(emptyState).toContainText('Chưa có session sắp tới');
    }

    await expect(page.getByRole('link', { name: /Vào Member Space/i })).toBeVisible();
  });

  test('session detail route resolves from a live session link', async ({ page }) => {
    await page.goto('/open-studio');
    const session = page.locator('a.session-card').first();
    const emptyState = page.locator('.session-empty');
    await expect(session.or(emptyState)).toBeVisible({ timeout: 15_000 });
    test.skip(await session.count() === 0, 'No live session is currently published');

    const href = await session.getAttribute('href');
    expect(href).toMatch(/^\/open-studio\/session\?id=.+/);

    await session.click();
    await expect(page).toHaveURL(/\/open-studio\/session\?id=/);
    await expect(page.locator('main')).toBeVisible();
  });
});
