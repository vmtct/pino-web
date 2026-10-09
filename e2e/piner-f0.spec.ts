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

test('retired Open Studio Home action is neutralized and never produces a Piner booking control', async ({ page }) => {
  let openStudioRequests = 0;
  await page.route('**/api/piner/session', (route) => route.fulfill(envelope({
    principalType: 'PARENT_USER', parent: { id: parentId, displayName: 'Gia đình PINO' },
    session: { id: parentSessionId, issuedAt: '2026-08-29T06:00:00.000Z', expiresAt: '2026-11-29T06:00:00.000Z' },
  })));
  await page.route('**/api/piner/students', (route) => route.fulfill(envelope([{ id: studentId, displayName: 'Piner A' }])));
  await page.route(`**/api/piner/students/${studentId}/journey`, (route) => route.fulfill(envelope({
    state: 'NO_ACTIVE_JOURNEY', student: { id: studentId, displayName: 'Piner A' }, paths: [], journeys: [], asOf: '2026-08-29T06:00:00.000Z',
  })));
  await page.route(`**/api/piner/students/${studentId}/home`, (route) => route.fulfill(envelope({
    state: 'READY', student: { id: studentId, displayName: 'Piner A' },
    primaryAction: { kind: 'EXPLORE_RETURN', reasonCode: 'OPEN_STUDIO_RETURN', effectiveAt: '2026-08-29T06:00:00.000Z',
      target: { kind: 'OPEN_STUDIO', passId, listingId, sessionId, pathProgramId: '018f7f5a-4321-7abc-8def-777777777777' } },
    nextTouchpoint: null, journey: null, recentOutcome: null, asOf: '2026-08-29T06:00:00.000Z', resolverVersion: 'f0-v1',
  })));
  await page.route('**/api/piner/students/**/open-studio**', async (route) => { openStudioRequests += 1; await route.fulfill({ status: 410, body: '{}' }); });
  await page.goto('/piner');
  await expect(page.getByText('Khám phá hiện đã khép lại')).toBeVisible();
  await expect(page.getByRole('button', { name: /Open Studio|Khám phá/ })).toHaveCount(0);
  expect(openStudioRequests).toBe(0);
});
test('Piano Practice composes with the exact Core F0 resource DTO and media routes', async ({ page }) => {
  const resourceId = '018f7f5a-aaaa-7abc-8def-123456789001';
  const pathProgramId = '018f7f5a-aaaa-7abc-8def-123456789002';
  const repertoireItemId = '018f7f5a-aaaa-7abc-8def-123456789003';
  const pageIds = [
    '018f7f5a-bbbb-7abc-8def-123456789001',
    '018f7f5a-bbbb-7abc-8def-123456789002',
    '018f7f5a-bbbb-7abc-8def-123456789003',
  ];
  const coreMedia = (pageId: string, role: 'SHEET' | 'WORKSHEET') =>
    `/v1/member/students/${studentId}/piano/practice-resources/${resourceId}/pages/${pageId}/media/${role}`;

  await page.route('**/api/piner/session', (route) => route.fulfill(envelope({
    principalType: 'PARENT_USER',
    parent: { id: parentId, displayName: 'Gia đình PINO' },
    session: { id: parentSessionId, issuedAt: '2026-08-31T06:00:00.000Z', expiresAt: '2026-11-30T06:00:00.000Z' },
  })));
  await page.route('**/api/piner/students', (route) => route.fulfill(envelope([{ id: studentId, displayName: 'Piner Piano' }])));
  await page.route(`**/api/piner/students/${studentId}/home`, (route) => route.fulfill(envelope({
    state: 'NEUTRAL', student: { id: studentId, displayName: 'Piner Piano' }, primaryAction: null,
    nextTouchpoint: null, journey: null, recentOutcome: null, asOf: '2026-08-31T06:00:00.000Z', resolverVersion: 'f0-v1',
  })));
  await page.route(`**/api/piner/students/${studentId}/journey`, (route) => route.fulfill(envelope({
    state: 'NO_ACTIVE_JOURNEY', student: { id: studentId, displayName: 'Piner Piano' },
    paths: [], journeys: [], asOf: '2026-08-31T06:00:00.000Z',
  })));
  await page.route(`**/api/piner/students/${studentId}/summary`, (route) => route.fulfill(envelope({
    student: { id: studentId, displayName: 'Piner Piano' },
    paths: [{ pathProgramId, hasActiveSubscription: false, hasPriorSubscription: false }],
    houseMembership: { exists: true, joinedAt: '2026-08-31T06:00:00.000Z' }, piano: { inProgress: 0, completed: 0 }, effectiveAt: '2026-08-31T06:00:00.000Z',
  })));
  await page.route(`**/api/piner/students/${studentId}/piano/library**`, (route) => route.fulfill(envelope({
    studentId, pathProgramId, targetedPreviewItemId: null, effectiveAt: '2026-08-31T06:00:00.000Z',
    items: [{ id: repertoireItemId, pathProgramId, title: 'Always With Me', publishedPracticeResourceId: resourceId, access: { state: 'FULL', action: 'NONE', capabilities: { OPEN_VIEWER: 'ALLOWED' } } }],
  })));
  await page.route(`**/api/piner/students/${studentId}/toppi**`, (route) => route.fulfill({
    status: 404, contentType: 'application/json', body: JSON.stringify({ error: { code: 'NOT_FOUND' } }),
  }));

  const mediaReads: string[] = [];
  await page.route('**/api/piner/students/*/piano/practice-resources/*/pages/*/media/*', async (route) => {
    mediaReads.push(new URL(route.request().url()).pathname);
    await route.fulfill({
      status: 200, contentType: 'image/png',
      headers: { 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff' },
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    });
  });
  await page.route(`**/api/piner/students/${studentId}/piano/practice-resources/${resourceId}`, (route) => route.fulfill(envelope({
    resourceId, pathProgramId, pianoRepertoireItemId: repertoireItemId, family: 'JOURNEY',
    version: {
      id: '018f7f5a-cccc-7abc-8def-123456789002', number: 2, title: 'Always With Me',
      formatDefinition: 'PIANO_SHEET_176X250_8ROW_V1', publishedAt: '2026-08-31T06:00:00.000Z',
    },
    pages: [
      { id: pageIds[0], order: 1, sheetMediaPath: coreMedia(pageIds[0], 'SHEET'), worksheetMediaPath: coreMedia(pageIds[0], 'WORKSHEET') },
      { id: pageIds[1], order: 2, sheetMediaPath: coreMedia(pageIds[1], 'SHEET'), worksheetMediaPath: null },
      { id: pageIds[2], order: 3, sheetMediaPath: coreMedia(pageIds[2], 'SHEET'), worksheetMediaPath: coreMedia(pageIds[2], 'WORKSHEET') },
    ],
  })));

  await page.goto(`/piner`);
  await page.getByRole('button', { name: 'Hành trình' }).click();
  await expect(page.getByTestId('piano-practice-module')).toContainText('Always With Me');
  await page.getByRole('button', { name: 'Mở bài luyện →' }).click();

  const player = page.getByTestId('piano-practice-player');
  await expect(player.getByRole('heading', { name: 'Lật ngang điện thoại để luyện tập' })).toBeVisible();
  await player.getByRole('button', { name: /Đã xoay ngang/ }).click();

  const scroller = player.locator('[class*="phraseScroller"]');
  await expect(scroller).toBeVisible();
  await expect(player.getByText('Câu 1')).toBeVisible();
  await expect(player.getByAltText('Always With Me worksheet trang 1 câu 1')).toHaveAttribute('src', coreMedia(pageIds[0], 'WORKSHEET').replace(/^\/v1\/member/, '/api/piner'));
  await expect.poll(() => mediaReads.some((path) => path.endsWith(`/${pageIds[0]}/media/WORKSHEET`))).toBe(true);
  expect(await scroller.evaluate((node) => getComputedStyle(node).scrollSnapType)).toContain('mandatory');

  await scroller.evaluate((node) => node.scrollTo({ top: 500, behavior: 'instant' }));
  await expect.poll(() => player.getAttribute('data-practice-immersive')).toBe('true');
  await scroller.evaluate((node) => node.scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(() => player.getAttribute('data-practice-immersive')).toBe('false');

  await player.getByRole('button', { name: /Trang 2/ }).click();
  await expect(player.getByRole('button', { name: 'Không có hướng dẫn' })).toBeDisabled();
  await expect(player.getByAltText('Always With Me trang 2 câu 1')).toHaveAttribute('src', coreMedia(pageIds[1], 'SHEET').replace(/^\/v1\/member/, '/api/piner'));
  await expect.poll(() => mediaReads.some((path) => path.endsWith(`/${pageIds[1]}/media/SHEET`))).toBe(true);

  await player.getByRole('button', { name: /Trang 3/ }).click();
  await expect(player.getByRole('button', { name: 'Ẩn hướng dẫn' })).toBeVisible();
});
