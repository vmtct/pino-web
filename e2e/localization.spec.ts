import { expect, test } from '@playwright/test';

test('query locale, toggle, and persistence work across public pages', async ({ page }) => {
  await page.goto('/artchitect?lang=vi');
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(page.getByText('Quan sát. Làm. Thiết kế. Dựng.')).toBeVisible();

  const toggle = page.locator('.locale-toggle');
  await expect(toggle.getByRole('button', { name: 'VN' })).toHaveAttribute('aria-pressed', 'true');
  await toggle.getByRole('button', { name: 'EN' }).click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('Observe. Make. Design. Build.')).toBeVisible();
  await expect(toggle.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/little-piner');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('Little hands. Big discoveries.')).toBeVisible();

  await page.goto('/pianohouse');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('Music for expression. Confidence over time.')).toBeVisible();

  await page.goto('/open-studio?lang=vi');
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(page.getByText('Khám phá, sáng tạo và lớn lên — mỗi tuần tại PINO House.')).toBeVisible();
});

test('Open Studio formats public schedule UI in the selected locale', async ({ page }) => {
  await page.goto('/open-studio?lang=en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('Explore, create and grow — every week at PINO House.')).toBeVisible();
  await expect(page.locator('[data-pino-path-header] a[href="#sessions"]')).toContainText('View schedule');
  await expect(page.locator('.os-date-row').getByRole('button', { name: 'All' })).toBeVisible();
  await expect(page.locator('.os-filter-row').getByRole('button', { name: 'All' })).toBeVisible();
});
