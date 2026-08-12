import { test, expect } from '@playwright/test';

test.describe('Open Studio public journey', () => {
  async function waitForSessionState(page: import('@playwright/test').Page) {
    const sessions = page.locator('a.session-card');
    const emptyState = page.getByText(/Chưa có session sắp tới/i);
    const loading = page.getByText(/Đang xem lịch Open Studio/i);

    await expect.poll(async () => {
      const [sessionCount, emptyCount, loadingCount] = await Promise.all([
        sessions.count(),
        emptyState.count(),
        loading.count(),
      ]);
      return sessionCount > 0 ? 'sessions' : emptyCount > 0 ? 'empty' : loadingCount > 0 ? 'loading' : 'pending';
    }, { timeout: 15_000 }).toMatch(/sessions|empty/);

    return { sessions, emptyState };
  }

  test('landing exposes the current Open Studio state and a member entry point', async ({ page }) => {
    await page.goto('/open-studio');

    await expect(page.getByRole('heading', { name: /Nếu hôm nay con được tự chọn/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Chọn (một )?buổi cho con/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Vào Member Space/i })).toBeVisible();

    const { sessions, emptyState } = await waitForSessionState(page);
    const sessionCount = await sessions.count();

    if (sessionCount > 0) {
      await expect(sessions.first()).toBeVisible();
      await expect(sessions.first()).toHaveAttribute('href', /\/open-studio\/session\?id=/);
    } else {
      await expect(emptyState).toBeVisible();
    }
  });

  test('session detail route resolves when a live session is available', async ({ page }) => {
    await page.goto('/open-studio');
    const { sessions, emptyState } = await waitForSessionState(page);

    if (await sessions.count() === 0) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const session = sessions.first();
    await expect(session).toBeVisible();

    const href = await session.getAttribute('href');
    expect(href).toMatch(/^\/open-studio\/session\?id=.+/);

    await session.click();
    await expect(page).toHaveURL(/\/open-studio\/session\?id=/);
    await expect(page.locator('main')).toBeVisible();
  });
});
