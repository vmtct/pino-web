import { test, expect } from '@playwright/test';

const phone = process.env.E2E_MEMBER_PHONE;
const unknownPhone = process.env.E2E_UNKNOWN_PHONE;

type MemberPayload = {
  ok: boolean;
  member?: {
    students?: Array<{ id: string; name?: string }>;
    passes?: Array<{ id: string; studentId?: string; passType?: string; status?: string }>;
    bookings?: Array<{ id: string; studentId?: string; sessionId?: string; status?: string }>;
  };
};

type Session = {
  id: string;
  topic?: string;
  type?: string;
  path?: string | null;
  availableSeats?: number | null;
  capacity?: number | null;
};

async function loadMember(page: Parameters<Parameters<typeof test>[1]>[0]['page']): Promise<MemberPayload> {
  const response = await page.request.post('/api/member', { data: { phone } });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function loadSessions(page: Parameters<Parameters<typeof test>[1]>[0]['page']): Promise<Session[]> {
  const response = await page.request.get('/api/os-sessions');
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.sessions || [];
}

async function validateBooking(page: Parameters<Parameters<typeof test>[1]>[0]['page'], body: Record<string, string>) {
  return page.request.post('/api/member/book/validate', { data: body });
}

test.describe('Open Studio member access', () => {
  test('known parent can always enter Member Space', async ({ page }) => {
    test.skip(!phone, 'E2E_MEMBER_PHONE is not configured.');

    await page.goto('/open-studio/member');
    await page.getByLabel('Số điện thoại').fill(phone!);
    await page.getByRole('button', { name: /Tiếp tục/i }).click();

    await expect(page).toHaveURL(/\/open-studio\/member\/book/);
    await expect(page.getByRole('heading', { name: /Book a session/i })).toBeVisible({ timeout: 15_000 });
  });

  test('unknown parent is rejected at identity lookup', async ({ page }) => {
    test.skip(!unknownPhone, 'E2E_UNKNOWN_PHONE is not configured.');

    await page.goto('/open-studio/member');
    await page.getByLabel('Số điện thoại').fill(unknownPhone!);
    await page.getByRole('button', { name: /Tiếp tục/i }).click();

    await expect(page.getByRole('alert')).toContainText(/không tìm thấy|not found/i, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/open-studio\/member(?:\?.*)?$/);
  });
});

test.describe('Open Studio member booking journey', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!phone, 'E2E_MEMBER_PHONE is not configured; member E2E is opt-in until a dedicated test account is provided.');
    await page.addInitScript((value) => {
      sessionStorage.setItem('pino_member_phone', value as string);
    }, phone!);
  });

  test('member can submit the server validation flow without mutating Notion', async ({ page }) => {
    await page.route('**/api/member/book', async (route) => {
      const request = route.request();
      const validationUrl = request.url().replace('/api/member/book', '/api/member/book/validate');
      const response = await route.fetch({ url: validationUrl, method: 'POST', postData: request.postData() || undefined });
      await route.fulfill({ response });
    });

    await page.goto('/open-studio/member/book');
    await expect(page.getByRole('heading', { name: /Book a session/i })).toBeVisible({ timeout: 15_000 });

    const students = page.locator('button.student');
    await expect(students.first()).toBeVisible({ timeout: 15_000 });
    await students.first().click();

    const sessions = page.locator('button.session:not(.sold)');
    await expect(sessions.first()).toBeVisible({ timeout: 15_000 });
    await sessions.first().click();

    const confirm = page.getByRole('button', { name: /Confirm booking/i });
    await expect(confirm).toBeEnabled();
    await confirm.click();

    await expect(page.getByRole('heading', { name: /Hẹn gặp bạn tại PINO/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/BOOKING CONFIRMED/i)).toBeVisible();
  });

  test('wrong student is rejected by the booking domain', async ({ page }) => {
    const member = await loadMember(page);
    const students = member.member?.students || [];
    const passes = member.member?.passes || [];
    test.skip(students.length < 2 || passes.length === 0, 'Requires at least two students and one available pass fixture.');

    const pass = passes[0];
    const passStudentId = pass.studentId;
    const wrongStudent = students.find((student) => student.id !== passStudentId);
    test.skip(!passStudentId || !wrongStudent, 'Could not identify a pass owner and a different student.');

    const sessions = await loadSessions(page);
    const compatibleSession = sessions.find((session) => session.availableSeats === null || (session.availableSeats || 0) > 0);
    test.skip(!compatibleSession, 'No bookable session fixture available.');

    const response = await validateBooking(page, {
      phone: phone!,
      studentId: wrongStudent!.id,
      sessionId: compatibleSession!.id,
      passId: pass.id,
    });

    expect(response.status()).toBe(409);
    await expect(response).toHaveText(/pass is not available|không khả dụng/i);
  });

  test('sold-out session is rejected by the booking domain', async ({ page }) => {
    const member = await loadMember(page);
    const student = member.member?.students?.[0];
    const pass = member.member?.passes?.find((item) => item.status === 'Available') || member.member?.passes?.[0];
    test.skip(!student || !pass, 'Requires a student and pass fixture.');

    const sessions = await loadSessions(page);
    const soldOut = sessions.find((session) => session.availableSeats === 0);
    test.skip(!soldOut, 'No sold-out session fixture available.');

    const response = await validateBooking(page, {
      phone: phone!,
      studentId: student!.id,
      sessionId: soldOut!.id,
      passId: pass!.id,
    });

    expect(response.status()).toBe(409);
    await expect(response).toHaveText(/sold out|hết chỗ/i);
  });

  test('wrong-path pass is rejected by the booking domain', async ({ page }) => {
    const member = await loadMember(page);
    const student = member.member?.students?.[0];
    const pass = member.member?.passes?.find((item) => item.status === 'Available') || member.member?.passes?.[0];
    test.skip(!student || !pass, 'Requires a student and pass fixture.');

    const sessions = await loadSessions(page);
    const passPath = pass!.passType === 'Piano' ? 'Piano' : pass!.passType === 'Art' ? 'Mỹ thuật' : pass!.passType === 'Little Piner' ? 'Little Piner' : null;
    const mismatchedSession = sessions.find((session) => session.path && session.path !== passPath && (session.availableSeats === null || (session.availableSeats || 0) > 0));
    test.skip(!mismatchedSession, 'No mismatched-path session fixture available.');

    const response = await validateBooking(page, {
      phone: phone!,
      studentId: student!.id,
      sessionId: mismatchedSession!.id,
      passId: pass!.id,
    });

    expect(response.status()).toBe(409);
    await expect(response).toHaveText(/cannot access|pass cannot access|không thể truy cập/i);
  });
});
