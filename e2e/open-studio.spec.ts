import { test, expect } from '@playwright/test';

test.describe('Open Studio public journey', () => {
  const scheduleEndpoint = '/api/pino-core/open-studio/sessions';
  const capabilityEndpoint = '/api/pino-core/open-studio/capabilities';

  async function waitForRenderedSessions(page: import('@playwright/test').Page) {
    const cards = page.locator('.os-session-card');
    const empty = page.locator('.os-empty');
    const loadError = page.getByText(/Lịch đang tạm nghỉ một chút/i);

    await expect.poll(async () => {
      if (await cards.count()) return 'sessions';
      if (await empty.count()) return 'empty';
      if (await loadError.count()) return 'error';
      return 'pending';
    }, { timeout: 15_000 }).toMatch(/sessions|empty/);

    return cards;
  }

  test('Core public schedule exposes current Open Studio data', async ({ request }) => {
    const response = await request.get(scheduleEndpoint);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data.sessions)).toBeTruthy();
    expect(data.sessions.length).toBeGreaterThan(0);
  });

  test('landing renders the approved Open Studio visual system and live sessions', async ({ page }) => {
    const scheduleResponse = page.waitForResponse(response => response.url().includes(scheduleEndpoint));
    await page.goto('/open-studio');

    const response = await scheduleResponse;
    expect(response.ok()).toBeTruthy();

    await expect(page.getByRole('heading', { name: 'Open Studio', exact: true })).toBeVisible();
    await expect(page.locator('.os-hero-visual img')).toHaveAttribute('src', /assets\.pinohouse\.art\/site\/OpenStudio\/open-studio-courtyard-exterior\.png/);
    await expect(page.getByRole('link', { name: /Khám phá Open Studio/i }).first()).toBeVisible();

    const cards = await waitForRenderedSessions(page);
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(cards.first().locator('img')).toBeVisible();
  });

  test('session cards open the inline detail experience', async ({ page }) => {
    await page.goto('/open-studio');
    const cards = await waitForRenderedSessions(page);
    expect(await cards.count()).toBeGreaterThan(0);

    const availableCard = cards.filter({ has: page.getByRole('button', { name: /Xem chi tiết/i }) }).first();
    await expect(availableCard).toBeVisible();
    await availableCard.getByRole('button', { name: /Xem chi tiết/i }).click();

    await expect(page.locator('.os-session-detail')).toBeVisible();
    await expect(page.locator('.os-session-detail h2')).toBeVisible();
    await expect(page.locator('.os-session-detail img')).toBeVisible();
  });

  test('registration UI follows the production capability contract', async ({ page, request }) => {
    const capabilityResponse = await request.get(capabilityEndpoint);
    expect(capabilityResponse.ok()).toBeTruthy();
    const capability = await capabilityResponse.json() as { registrationEnabled?: boolean };

    await page.goto('/open-studio');
    const cards = await waitForRenderedSessions(page);
    expect(await cards.count()).toBeGreaterThan(0);

    const availableCard = cards.filter({ has: page.getByRole('button', { name: /Xem chi tiết/i }) }).first();
    await availableCard.getByRole('button', { name: /Xem chi tiết/i }).click();
    const detail = page.locator('.os-session-detail');

    if (capability.registrationEnabled === true) {
      await expect(detail.getByRole('button', { name: /Đăng ký buổi này/i })).toBeVisible();
      await detail.getByRole('button', { name: /Đăng ký buổi này/i }).click();
      await expect(detail.getByRole('heading', { name: /Thông tin gia đình/i })).toBeVisible();
      await expect(detail.getByLabel(/Họ tên phụ huynh/i)).toBeVisible();
      await expect(detail.getByLabel(/Số điện thoại/i)).toBeVisible();
    } else {
      await expect(detail.getByText(/Đăng ký trực tuyến sắp mở/i)).toBeVisible();
    }
  });
});
