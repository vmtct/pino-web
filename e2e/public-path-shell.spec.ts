import { expect, test } from '@playwright/test';

const paths = [
  { route: '/pianohouse', locale: 'vi' },
  { route: '/artchitect', locale: 'en' },
  { route: '/little-piner', locale: 'en' },
] as const;

for (const path of paths) {
  test(`${path.route} uses the shared PINO path chrome`, async ({ page }) => {
    await page.goto(path.route);

    const header = page.locator('[data-pino-path-header]');
    const footer = page.locator('[data-pino-path-footer]');
    await expect(header).toBeVisible();
    await expect(footer).toBeVisible();

    const expectedNav = ['/', '/#paths', '/open-studio', '/#stories', '/#about'];
    await expect(header.locator('nav a')).toHaveCount(expectedNav.length);
    expect(await header.locator('nav a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual(expectedNav);
    await expect(header.locator('a[href="/open-studio"]').last()).toContainText('Open Studio');

    await expect(footer.locator('a[href="/"]').first()).toContainText('PINO House');
    await expect(footer.locator('strong').first()).toContainText('pinohouse.art');
  });
}
