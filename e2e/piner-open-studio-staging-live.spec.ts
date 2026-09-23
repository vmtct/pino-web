import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { withFailSafeClaimCleanup } from '../lib/piner-open-studio-staging-safety.ts';

interface FixtureAuth {
  phone: string;
  temporaryPin: string;
  studentId: string;
  passId: string;
  listingId: string;
}

const STAGING_ORIGIN = 'https://pino-web-staging.minhtri-van42.workers.dev';
const authFile = process.env.PINER_STAGING_AUTH_FILE?.trim() ?? '';
const baseURL = process.env.E2E_BASE_URL?.trim() ?? '';
test.skip(!authFile, 'governed staging fixture credentials are required');
test.describe.configure({ retries: 0 });

test('live staging: PIN login -> change PIN -> Open Studio reserve -> cancel', async ({ page }) => {
  expect(baseURL, 'E2E_BASE_URL must be explicitly bound to governed Web staging').not.toBe('');
  expect(new URL(baseURL).origin, 'live Open Studio journey must never target Production').toBe(STAGING_ORIGIN);

  const fixture = JSON.parse(readFileSync(authFile, 'utf8')) as FixtureAuth;
  expect(fixture.phone).toMatch(/^\+84\d{9,10}$/);
  expect(fixture.temporaryPin).toMatch(/^\d{6}$/);
  expect(fixture.studentId).toMatch(/^[0-9a-f-]{36}$/);
  expect(fixture.passId).toMatch(/^[0-9a-f-]{36}$/);
  expect(fixture.listingId).toMatch(/^[0-9a-f-]{36}$/);

  const newPin = fixture.temporaryPin === '654321' ? '123456' : '654321';
  await page.goto('/piner');

  await page.getByLabel('Số điện thoại').fill(fixture.phone);
  await page.getByLabel('PIN 6 số').fill(fixture.temporaryPin);
  const loginResponse = page.waitForResponse((response) =>
    response.url().includes('/api/piner/auth/login') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Vào Piner' }).click();
  const login = await loginResponse;
  expect(login.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Tạo PIN riêng cho gia đình.' })).toBeVisible();

  await page.getByLabel('PIN mới').fill(newPin);
  await page.getByLabel('Nhập lại PIN').fill(newPin);
  const changeResponse = page.waitForResponse((response) =>
    response.url().includes('/api/piner/auth/change-pin') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Lưu PIN & vào Piner' }).click();
  expect((await changeResponse).status()).toBe(200);

  await page.getByRole('button', { name: 'Khám phá' }).click();
  await expect(page.getByText(/1 cơ hội · 0 đã giữ/)).toBeVisible();

  const admissionResponse = page.waitForResponse((response) =>
    response.url().includes(`/api/piner/students/${fixture.studentId}/open-studio/admissions`)
      && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Giữ chỗ →' }).click();
  const admitted = await admissionResponse;
  const admissionBody = await admitted.json();
  const createdClaimId = typeof admissionBody?.data?.claimId === 'string' ? admissionBody.data.claimId : '';
  expect(createdClaimId).toMatch(/^[0-9a-f-]{36}$/);

  await withFailSafeClaimCleanup(
    createdClaimId,
    async (markCancellationConfirmed) => {
      expect(admitted.status()).toBe(201);
      expect(admitted.request().postDataJSON()).toMatchObject({
        passId: fixture.passId,
        listingId: fixture.listingId,
        participantMode: 'OWNER',
      });
      expect(admissionBody).toMatchObject({
        data: {
          claimId: createdClaimId,
          claimStatus: 'RESERVED',
          reservation: { type: 'BOOKING', status: 'CONFIRMED' },
          listingId: fixture.listingId,
          participantMode: 'OWNER',
        },
      });
      await expect(page.getByText(/0 cơ hội · 1 đã giữ/)).toBeVisible();

      const cancellationResponse = page.waitForResponse((response) =>
        response.url().includes(`/api/piner/students/${fixture.studentId}/open-studio/claims/${createdClaimId}/cancel`)
          && response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Hủy chỗ' }).click();
      const cancelled = await cancellationResponse;
      expect(cancelled.status()).toBe(200);
      const cancellationBody = await cancelled.json();
      expect(cancellationBody).toMatchObject({
        data: {
          claimId: createdClaimId,
          claimStatus: 'RELEASED',
          cancellationResult: 'RELEASED_CANCELLED',
          reservation: { type: 'BOOKING', status: 'CANCELLED' },
          listingId: fixture.listingId,
          participantMode: 'OWNER',
        },
      });
      markCancellationConfirmed();
      await expect(page.getByText(/1 cơ hội · 0 đã giữ/)).toBeVisible();
    },
    async (claimId) => {
      const cleanup = await page.context().request.post(
        `${STAGING_ORIGIN}/api/piner/students/${fixture.studentId}/open-studio/claims/${claimId}/cancel`,
        {
          headers: { 'Idempotency-Key': crypto.randomUUID() },
          data: { reason: 'Governed staging E2E fail-safe cleanup' },
        },
      );
      if (!cleanup.ok()) {
        throw new Error(`PINER_STAGING_CLEANUP_FAILED:${cleanup.status()}:${claimId}`);
      }
      const cleanupBody = await cleanup.json();
      expect(cleanupBody).toMatchObject({
        data: {
          claimId,
          claimStatus: 'RELEASED',
          cancellationResult: 'RELEASED_CANCELLED',
          listingId: fixture.listingId,
          participantMode: 'OWNER',
        },
      });
    },
  );
});
