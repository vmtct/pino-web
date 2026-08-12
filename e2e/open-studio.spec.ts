import { test, expect } from '@playwright/test';

test.describe('Open Studio public journey', () => {
  async function waitForSessionState(page: import('@playwright/test').Page) {
    const upcoming = page.locator('a.session-card');
    const recentPast = page.locator('.session-card-past');
    const emptyState = page.getByText(/Chưa có session để hiển thị/i);
    const loading = page.getByText(/Đang xem lịch Open Studio/i);

    await expect.poll(async () => {
      const [upcomingCount, pastCount, emptyCount, loadingCount] = await Promise.all([
        upcoming.count(),
        recentPast.count(),
        emptyState.count(),
        loading.count(),
      ]);
      return upcomingCount > 0 || pastCount > 0 ? 'sessions' : emptyCount > 0 ? 'empty' : loadingCount > 0 ? 'loading' : 'pending';
    }, { timeout: 15_000 }).toMatch(/sessions|empty/);

    return { upcoming, recentPast, emptyState };
  }

  async function attachBrowserDiagnostics(page: import('@playwright/test').Page) {
    const diagnostics: {
      consoleErrors: string[];
      pageErrors: string[];
      sessionApi?: { status: number; ok: boolean; body: unknown };
    } = { consoleErrors: [], pageErrors: [] };

    page.on('console', message => {
      if (message.type() === 'error') diagnostics.consoleErrors.push(message.text());
    });
    page.on('pageerror', error => diagnostics.pageErrors.push(error.message));

    page.on('response', async response => {
      if (!response.url().includes('/api/os-sessions')) return;
      try {
        diagnostics.sessionApi = { status: response.status(), ok: response.ok(), body: await response.json() };
      } catch (error) {
        diagnostics.sessionApi = { status: response.status(), ok: response.ok(), body: { parseError: String(error) } };
      }
    });

    return diagnostics;
  }

  async function dumpBrowserDiagnostics(
    page: import('@playwright/test').Page,
    diagnostics: Awaited<ReturnType<typeof attachBrowserDiagnostics>>,
  ) {
    const renderedUpcoming = await page.locator('a.session-card').count();
    const renderedPast = await page.locator('.session-card-past').count();
    const loadingCount = await page.getByText(/Đang xem lịch Open Studio/i).count();
    const emptyCount = await page.getByText(/Chưa có session để hiển thị/i).count();
    const errorCount = await page.getByText(/Lịch Open Studio đang tạm thời chưa tải được/i).count();

    console.log('[OS E2E DIAGNOSTICS]', JSON.stringify({
      renderedUpcoming,
      renderedPast,
      loadingCount,
      emptyCount,
      errorCount,
      sessionApi: diagnostics.sessionApi,
      consoleErrors: diagnostics.consoleErrors,
      pageErrors: diagnostics.pageErrors,
    }, null, 2));
  }

  test('live session API exposes current Open Studio data', async ({ request }) => {
    const response = await request.get('/api/os-sessions');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data.sessions)).toBeTruthy();

    const openStudioSessions = data.sessions.filter((session: { type?: string }) => session.type === 'Open Studio');
    expect(openStudioSessions.length).toBeGreaterThan(0);
  });

  test('landing exposes live Open Studio sessions and a member entry point', async ({ page }) => {
    const diagnostics = await attachBrowserDiagnostics(page);
    const sessionResponse = page.waitForResponse(response => response.url().includes('/api/os-sessions'));
    await page.goto('/open-studio');

    const response = await sessionResponse;
    expect(response.ok()).toBeTruthy();

    await expect(page.getByRole('heading', { name: /Nếu hôm nay con được tự chọn/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Chọn (một )?buổi cho con/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Vào Member Space/i })).toBeVisible();

    const { upcoming, recentPast } = await waitForSessionState(page);
    await dumpBrowserDiagnostics(page, diagnostics);

    expect((await upcoming.count()) + (await recentPast.count())).toBeGreaterThan(0);
    if (await recentPast.count()) {
      await expect(recentPast.first()).toContainText(/ĐÃ DIỄN RA/);
      await expect(recentPast.first()).toContainText(/Chỉ để tham khảo/);
      await expect(recentPast.first()).not.toHaveAttribute('href', /./);
    }
  });

  test('session detail route resolves when a live upcoming session is available', async ({ page }) => {
    const diagnostics = await attachBrowserDiagnostics(page);
    await page.goto('/open-studio');
    const { upcoming, recentPast } = await waitForSessionState(page);

    await dumpBrowserDiagnostics(page, diagnostics);
    if (await upcoming.count() === 0) {
      expect(await recentPast.count()).toBeGreaterThan(0);
      return;
    }

    const session = upcoming.first();
    await expect(session).toBeVisible();
    const href = await session.getAttribute('href');
    expect(href).toMatch(/^\/open-studio\/session\?id=.+/);

    await session.click();
    await expect(page).toHaveURL(/\/open-studio\/session\?id=/);
    await expect(page.locator('main')).toBeVisible();
  });
});
