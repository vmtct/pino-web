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

test('OWNER Open Studio action reuses its idempotency key until canonical Home changes', async ({ page }) => {
  let homeReads = 0;
  let admissionCalls = 0;
  const admissionKeys: string[] = [];
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

  await page.route(`**/api/piner/students/${studentId}/open-studio`, (route) => route.fulfill(envelope({
    student: { id: studentId, displayName: 'Piner A' },
    opportunities: [], reservations: [], asOf: '2026-08-29T06:00:00.000Z',
  })));

  await page.route(`**/api/piner/students/${studentId}/home`, async (route) => {
    homeReads += 1;
    const resolved = admissionCalls >= 2;
    return route.fulfill(envelope({
      state: resolved ? 'NEUTRAL' : 'READY',
      student: { id: studentId, displayName: 'Piner A' },
      primaryAction: resolved ? null : {
        kind: 'EXPLORE_RETURN', reasonCode: 'OPEN_STUDIO_RETURN', effectiveAt: '2026-08-29T06:00:00.000Z',
        target: { kind: 'OPEN_STUDIO', passId, listingId, sessionId, pathProgramId: '018f7f5a-4321-7abc-8def-777777777777' },
      },
      nextTouchpoint: null, journey: null, recentOutcome: null,
      asOf: '2026-08-29T06:00:00.000Z', resolverVersion: 'f0-v1',
    }));
  });

  await page.route(`**/api/piner/students/${studentId}/open-studio/admissions`, async (route) => {
    admissionCalls += 1;
    admissionKeys.push(route.request().headers()['idempotency-key'] || '');
    admissionBody = route.request().postDataJSON();
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

  const actionButton = page.getByRole('button', { name: 'Giữ chỗ Open Studio →' });
  await actionButton.click();
  await expect.poll(() => admissionCalls).toBe(1);
  await expect(actionButton).toBeEnabled();
  await actionButton.click();
  await expect.poll(() => admissionCalls).toBe(2);
  await expect(page.getByText('Không có việc cần ưu tiên lúc này.')).toBeVisible();
  expect(homeReads).toBeGreaterThanOrEqual(2);
  expect(new Set(admissionKeys).size).toBe(1);
  expect(admissionKeys[0]).toBeTruthy();
  expect(admissionBody).toEqual({ passId, listingId, participantMode: 'OWNER' });
});
test('Khám phá books and cancels an OWNER Open Studio reservation from canonical projection', async ({ page }) => {
  let reserved = false;
  let admissionCalls = 0;
  let cancelCalls = 0;
  const claimId = '018f7f5a-4321-7abc-8def-888888888888';
  const bookingId = '018f7f5a-4321-7abc-8def-999999999999';
  const item = {
    passId, listingId, experienceType: 'KHAM_PHA',
    session: { id: sessionId, localDate: '2026-09-12', scheduledStartsAt: '2026-09-12T10:00:00.000Z', scheduledEndsAt: '2026-09-12T11:30:00.000Z' },
    path: { id: '018f7f5a-4321-7abc-8def-777777777777', code: 'PIANO', displayName: 'PianoHouse' },
    syllabus: { id: '018f7f5a-4321-7abc-8def-aaaaaaaaaaaa', title: 'Always With Me' },
  };

  await page.route('**/api/piner/session', (route) => route.fulfill(envelope({
    principalType: 'PARENT_USER', parent: { id: parentId, displayName: 'Gia đình PINO' },
    session: { id: parentSessionId, issuedAt: '2026-08-29T06:00:00.000Z', expiresAt: '2026-11-29T06:00:00.000Z' },
  })));
  await page.route('**/api/piner/students', (route) => route.fulfill(envelope([{ id: studentId, displayName: 'Piner A' }])));
  await page.route(`**/api/piner/students/${studentId}/home`, (route) => route.fulfill(envelope({
    state: 'NEUTRAL', student: { id: studentId, displayName: 'Piner A' }, primaryAction: null,
    nextTouchpoint: null, journey: null, recentOutcome: null,
    asOf: '2026-08-29T06:00:00.000Z', resolverVersion: 'f0-v1',
  })));
  await page.route(`**/api/piner/students/${studentId}/journey`, (route) => route.fulfill(envelope({
    state: 'NO_ACTIVE_JOURNEY', student: { id: studentId, displayName: 'Piner A' },
    paths: [], journeys: [], asOf: '2026-08-29T06:00:00.000Z',
  })));
  await page.route(`**/api/piner/students/${studentId}/open-studio`, (route) => route.fulfill(envelope({
    student: { id: studentId, displayName: 'Piner A' },
    opportunities: reserved ? [] : [item],
    reservations: reserved ? [{ ...item, claimId, reservation: { id: bookingId, type: 'BOOKING', status: 'CONFIRMED' }, claimStatus: 'RESERVED' }] : [],
    asOf: '2026-08-29T06:00:00.000Z',
  })));

  await page.route(`**/api/piner/students/${studentId}/open-studio/admissions`, async (route) => {
    admissionCalls += 1;
    reserved = true;
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: {
      claimId, reservation: { id: bookingId, type: 'BOOKING', status: 'CONFIRMED' },
      claimStatus: 'RESERVED', listingId, session: { id: sessionId }, participantMode: 'OWNER',
    } }) });
  });
  await page.route(`**/api/piner/students/${studentId}/open-studio/claims/${claimId}/cancel`, async (route) => {
    cancelCalls += 1;
    reserved = false;
    await route.fulfill(envelope({
      claimId, reservation: { id: bookingId, type: 'BOOKING', status: 'CANCELLED' },
      claimStatus: 'RELEASED', listingId, session: { id: sessionId }, participantMode: 'OWNER',
      cancellationResult: 'RELEASED_CANCELLED',
    }));
  });

  await page.goto('/piner');
  await page.getByRole('button', { name: 'Khám phá' }).click();
  await expect(page.getByText('Always With Me')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Giữ chỗ →' })).toBeVisible();
  await page.getByRole('button', { name: 'Giữ chỗ →' }).click();
  await expect.poll(() => admissionCalls).toBe(1);
  await expect(page.getByText('ĐÃ XÁC NHẬN')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hủy chỗ' })).toBeVisible();
  await page.getByRole('button', { name: 'Hủy chỗ' }).click();
  await expect.poll(() => cancelCalls).toBe(1);
  await expect(page.getByRole('button', { name: 'Giữ chỗ →' })).toBeVisible();
});
