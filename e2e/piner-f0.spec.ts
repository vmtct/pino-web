import { expect, test } from '@playwright/test';

const studentId = '018f7f5a-4321-7abc-8def-1234567890ab';
const parentId = '018f7f5a-4321-7abc-8def-111111111111';
const parentSessionId = '018f7f5a-4321-7abc-8def-222222222222';
const passId = '018f7f5a-4321-7abc-8def-333333333333';
const listingId = '018f7f5a-4321-7abc-8def-444444444444';
const sessionId = '018f7f5a-4321-7abc-8def-555555555555';

function envelope(data: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify({ data }) };
}

test('OWNER Open Studio action refetches canonical Home before UI changes', async ({ page }) => {
  let admitted = false;
  let homeReads = 0;
  let admissionCalls = 0;
  let admissionKey = '';
  let admissionBody: unknown;

  await page.route('**/api/piner/session', (route) => route.fulfill(envelope({
    principalType: 'PARENT_USER',
    parent: { id: parentId, displayName: 'Gia đình PINO' },
    session: { id: parentSessionId, issuedAt: '2026-08-29T06:00:00.000Z', expiresAt: '2026-11-29T06:00:00.000Z' },
  })));
  await page.route('**/api/piner/students', (route) => route.fulfill(envelope([
    { id: studentId, displayName: 'Piner A' },
  ])));

  await page.route(`**/api/piner/students/${studentId}/journey`, (route) => route.fulfill(envelope({
    state: 'NO_ACTIVE_JOURNEY', student: { id: studentId, displayName: 'Piner A' },
    paths: [], journeys: [], asOf: '2026-08-29T06:00:00.000Z',
  })));

  await page.route(`**/api/piner/students/${studentId}/home`, (route) => {
    homeReads += 1;
    return route.fulfill(envelope({
      state: admitted ? 'NEUTRAL' : 'READY',
      student: { id: studentId, displayName: 'Piner A' },
      primaryAction: admitted ? null : {
        kind: 'EXPLORE_RETURN', reasonCode: 'OPEN_STUDIO_RETURN', effectiveAt: '2026-08-29T06:00:00.000Z',
        target: { kind: 'OPEN_STUDIO', passId, listingId, sessionId, pathProgramId: '018f7f5a-4321-7abc-8def-777777777777' },
      },
      nextTouchpoint: null, journey: null, recentOutcome: null,
      asOf: '2026-08-29T06:00:00.000Z', resolverVersion: 'f0-v1',
    }));
  });

  await page.route(`**/api/piner/students/${studentId}/open-studio/admissions`, async (route) => {
    admissionCalls += 1;
    admissionKey = route.request().headers()['idempotency-key'] || '';
    admissionBody = route.request().postDataJSON();
    admitted = true;
    await route.fulfill({
      status: 201, contentType: 'application/json', body: JSON.stringify({ data: {
        claimId: '018f7f5a-4321-7abc-8def-888888888888',
        reservation: { id: '018f7f5a-4321-7abc-8def-999999999999', type: 'BOOKING', status: 'CONFIRMED' },
        claimStatus: 'RESERVED', listingId, session: { id: sessionId }, participantMode: 'OWNER',
      } }),
    });
  });

  await page.goto('/piner');
  await expect(page.getByRole('button', { name: 'Giữ chỗ Open Studio →' })).toBeVisible();
  expect(homeReads).toBe(1);

  await page.getByRole('button', { name: 'Giữ chỗ Open Studio →' }).click();
  await expect(page.getByText('Không có việc cần ưu tiên lúc này.')).toBeVisible();
  expect(homeReads).toBeGreaterThanOrEqual(2);
  expect(admissionCalls).toBe(1);
  expect(admissionKey).toBeTruthy();
  expect(admissionBody).toEqual({ passId, listingId, participantMode: 'OWNER' });
});