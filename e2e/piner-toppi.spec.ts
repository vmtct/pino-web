import { expect, test } from '@playwright/test';

const parentId = '018f7f5a-4321-7abc-8def-111111111111';
const sessionId = '018f7f5a-4321-7abc-8def-222222222222';
const studentA = '018f7f5a-4321-7abc-8def-aaaaaaaaaaaa';
const studentB = '018f7f5a-4321-7abc-8def-bbbbbbbbbbbb';

function envelope(data: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify({ data }) };
}

function journey(studentId: string, displayName: string) {
  return {
    state: 'NO_ACTIVE_JOURNEY',
    student: { id: studentId, displayName },
    paths: [], journeys: [], asOf: '2026-08-30T06:00:00.000Z',
  };
}

function home(studentId: string, displayName: string) {
  return {
    state: 'NEUTRAL', student: { id: studentId, displayName }, primaryAction: null,
    nextTouchpoint: null, journey: null, recentOutcome: null,
    asOf: '2026-08-30T06:00:00.000Z', resolverVersion: 'f0-v1',
  };
}
function toppi(studentId: string, displayName: string, level: number, lens: string) {
  return {
    student: { id: studentId, displayName },
    programs: [{
      enrollment_id: `top_enr_${level}`, enrollment_status: 'active',
      program: { code: 'TOPPI_ENGLISH', name: 'Toppi English' },
      stage: { code: level <= 5 ? 'FOUNDATION' : 'DEVELOPMENT', name: level <= 5 ? 'Nền tảng' : 'Phát triển' },
      level: { code: `L${level}`, number: level, name: `Level ${level}` },
      class_lens: { code: `TRACK_${level}`, name: lens },
      next_level: { code: `L${level + 1}`, number: level + 1, name: `Level ${level + 1}` },
      progression: { state: 'in_progress', latest_promotion_at: null },
      evidence_summary: { published_count: level, latest_at: null },
      assessment_summary: { published_count: 1, latest_at: null },
      competencies: [],
    }],
  };
}

test('Toppi stays inside Journey and late sibling responses cannot overwrite active Student', async ({ page }) => {
  await page.route('**/api/piner/session', route => route.fulfill(envelope({
    principalType: 'PARENT_USER', parent: { id: parentId, displayName: 'Gia đình PINO' },
    session: { id: sessionId, issuedAt: '2026-08-30T06:00:00.000Z', expiresAt: '2026-11-30T06:00:00.000Z' },
  })));
  await page.route('**/api/piner/students', route => route.fulfill(envelope([
    { id: studentA, displayName: 'Mori A' }, { id: studentB, displayName: 'Mori B' },
  ])));
  for (const [id, name] of [[studentA, 'Mori A'], [studentB, 'Mori B']] as const) {
    await page.route(`**/api/piner/students/${id}/home`, route => route.fulfill(envelope(home(id, name))));
    await page.route(`**/api/piner/students/${id}/journey`, route => route.fulfill(envelope(journey(id, name))));
  }
  await page.route(`**/api/piner/students/${studentA}/toppi`, async route => {
    await new Promise(resolve => setTimeout(resolve, 700));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(toppi(studentA, 'Mori A', 4, 'Tự tin giao tiếp')) }).catch(() => {});
  });
  await page.route(`**/api/piner/students/${studentB}/toppi`, route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(toppi(studentB, 'Mori B', 6, 'Vững nền ngôn ngữ')),
  }));

  await page.goto('/piner');
  await expect(page.getByRole('button', { name: /Mori B/ })).toBeVisible();
  await page.getByRole('button', { name: /Mori B/ }).click();
  await page.getByRole('button', { name: 'Hành trình' }).click();

  await expect(page.getByText('Vững nền ngôn ngữ')).toBeVisible();
  await expect(page.getByText('Level 6')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mở Toppi →' })).toBeVisible();
  await page.waitForTimeout(850);
  await expect(page.getByText('Tự tin giao tiếp')).toHaveCount(0);
  await expect(page.getByText('Level 4')).toHaveCount(0);
});
