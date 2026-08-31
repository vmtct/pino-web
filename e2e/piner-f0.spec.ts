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
test('Piano Practice renders deterministic pages and omits Worksheet when the published page has none', async ({ page }) => {
  await page.route('**/api/piner/session', (route) => route.fulfill(envelope({
    principalType: 'PARENT_USER',
    parent: { id: parentId, displayName: 'Gia đình PINO' },
    session: { id: parentSessionId, issuedAt: '2026-08-31T06:00:00.000Z', expiresAt: '2026-11-30T06:00:00.000Z' },
  })));
  await page.route('**/api/piner/students', (route) => route.fulfill(envelope([
    { id: studentId, displayName: 'Piner Piano' },
  ])));
  await page.route(`**/api/piner/students/${studentId}/home`, (route) => route.fulfill(envelope({
    state: 'NEUTRAL', student: { id: studentId, displayName: 'Piner Piano' },
    primaryAction: null, nextTouchpoint: null, journey: null, recentOutcome: null,
    asOf: '2026-08-31T06:00:00.000Z', resolverVersion: 'f0-v1',
  })));
  await page.route(`**/api/piner/students/${studentId}/journey`, (route) => route.fulfill(envelope({
    state: 'NO_ACTIVE_JOURNEY', student: { id: studentId, displayName: 'Piner Piano' },
    paths: [], journeys: [], asOf: '2026-08-31T06:00:00.000Z',
  })));
  await page.route(`**/api/piner/students/${studentId}/toppi**`, (route) => route.fulfill({
    status: 404, contentType: 'application/json', body: JSON.stringify({ error: { code: 'NOT_FOUND' } }),
  }));
  const mediaReads: string[] = [];
  await page.route('**/api/piner/students/*/piano/repertoire/*/practice-pages/*/media/*', async (route) => {
    mediaReads.push(new URL(route.request().url()).pathname);
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      headers: { 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff' },
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    });
  });
  await page.route(`**/api/piner/students/${studentId}/piano-practice/current`, (route) => route.fulfill(envelope({
    state: 'READY',
    student: { id: studentId, displayName: 'Piner Piano' },
    resource: {
      id: 'practice_always_with_me', title: 'Always With Me', family: 'JOURNEY',
      context: { label: 'PianoHouse · Level 3' },
      version: { id: 'practice_version_2', number: 2 },
      pages: [
        { id: 'page_1', order: 1, sheet: { url: '/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/piano/repertoire/018f7f5a-aaaa-7abc-8def-123456789001/practice-pages/018f7f5a-bbbb-7abc-8def-123456789001/media/SHEET' }, worksheet: { url: '/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/piano/repertoire/018f7f5a-aaaa-7abc-8def-123456789001/practice-pages/018f7f5a-bbbb-7abc-8def-123456789001/media/WORKSHEET' } },
        { id: 'page_2', order: 2, sheet: { url: '/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/piano/repertoire/018f7f5a-aaaa-7abc-8def-123456789001/practice-pages/018f7f5a-bbbb-7abc-8def-123456789002/media/SHEET' }, worksheet: null },
        { id: 'page_3', order: 3, sheet: { url: '/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/piano/repertoire/018f7f5a-aaaa-7abc-8def-123456789001/practice-pages/018f7f5a-bbbb-7abc-8def-123456789003/media/SHEET' }, worksheet: { url: '/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/piano/repertoire/018f7f5a-aaaa-7abc-8def-123456789001/practice-pages/018f7f5a-bbbb-7abc-8def-123456789003/media/WORKSHEET' } },
      ],
    },
    reasonCode: null,
    asOf: '2026-08-31T06:00:00.000Z',
  })));

  await page.goto('/piner');
  await page.getByRole('button', { name: 'Hành trình' }).click();
  await expect(page.getByTestId('piano-practice-module')).toContainText('Always With Me');
  await page.getByRole('button', { name: 'Mở bài luyện →' }).click();

  const player = page.getByTestId('piano-practice-player');
  await expect(player).toContainText('Trang 1 / 3');
  await expect(player.getByRole('button', { name: 'Worksheet' })).toBeVisible();
  await player.getByRole('button', { name: 'Worksheet' }).click();
  await expect(player.getByRole('img')).toHaveAttribute('src', '/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/piano/repertoire/018f7f5a-aaaa-7abc-8def-123456789001/practice-pages/018f7f5a-bbbb-7abc-8def-123456789001/media/WORKSHEET');
  await expect.poll(() => mediaReads.some((path) => path.endsWith('/018f7f5a-bbbb-7abc-8def-123456789001/media/WORKSHEET'))).toBe(true);

  await player.getByRole('button', { name: 'Trang sau' }).click();
  await expect(player).toContainText('Trang 2 / 3');
  await expect(player.getByRole('button', { name: 'Worksheet' })).toHaveCount(0);
  await expect(player.getByRole('img')).toHaveAttribute('src', '/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/piano/repertoire/018f7f5a-aaaa-7abc-8def-123456789001/practice-pages/018f7f5a-bbbb-7abc-8def-123456789002/media/SHEET');
  await expect.poll(() => mediaReads.some((path) => path.endsWith('/018f7f5a-bbbb-7abc-8def-123456789002/media/SHEET'))).toBe(true);

  await player.getByRole('button', { name: 'Trang sau' }).click();
  await expect(player).toContainText('Trang 3 / 3');
  await expect(player.getByRole('button', { name: 'Worksheet' })).toBeVisible();
});
