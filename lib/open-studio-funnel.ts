export const PINO_TIMEZONE = "Asia/Ho_Chi_Minh";

export type PublicSyllabus = {
  id: string;
  title: string;
  shortDescription: string | null;
  publicDescription: string | null;
  skillSummary: string | null;
  ageMin: number | null;
  ageMax: number | null;
  thumbnailUrl: string | null;
  coverUrl: string | null;
};

export type CoreSession = {
  id: string;
  path: { id: string; code: string; displayName: string };
  startsAt: string;
  endsAt: string;
  bookingClosesAt: string;
  timezone: string;
  availability: { remainingSeats: number; isFull: boolean };
  access: { kind: string; trialPremium: boolean };
  syllabus: PublicSyllabus;
};

export type RegistrationForm = {
  contactName: string;
  phone: string;
  childName: string;
  childDateOfBirth: string;
};

export type RegistrationPayload = RegistrationForm & { sessionId: string };

export type RegistrationIssue = {
  message: string;
  field?: keyof RegistrationForm;
  refreshSchedule?: boolean;
  retryable?: boolean;
};

const formatter = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("vi-VN", {
  timeZone: PINO_TIMEZONE,
  ...options,
});

export const localDateKey = (iso: string) => new Intl.DateTimeFormat("en-CA", {
  timeZone: PINO_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date(iso));

export const formatLocalDate = (iso: string) => {
  const value = formatter({ weekday: "long", day: "2-digit", month: "2-digit" }).format(new Date(iso));
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const formatLocalTimeRange = (startsAt: string, endsAt: string) => {
  const time = formatter({ hour: "2-digit", minute: "2-digit", hour12: false });
  return `${time.format(new Date(startsAt))}–${time.format(new Date(endsAt))}`;
};

export const formatAgeRange = (ageMin: number | null, ageMax: number | null) => {
  if (ageMin !== null && ageMax !== null) return ageMin === ageMax ? `${ageMin} tuổi` : `${ageMin}–${ageMax} tuổi`;
  if (ageMin !== null) return `${ageMin}+ tuổi`;
  if (ageMax !== null) return `Đến ${ageMax} tuổi`;
  return "Mọi độ tuổi";
};

export const isSessionFull = (session: CoreSession) => session.availability.isFull || session.availability.remainingSeats <= 0;

export const groupSessionsByLocalDate = (sessions: CoreSession[]) => {
  const sorted = [...sessions].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const groups = new Map<string, CoreSession[]>();
  for (const session of sorted) {
    const key = localDateKey(session.startsAt);
    groups.set(key, [...(groups.get(key) || []), session]);
  }
  return Array.from(groups.entries());
};

export const sessionThumbnail = (session: CoreSession) => session.syllabus.thumbnailUrl;
export const sessionCover = (session: CoreSession) => session.syllabus.coverUrl || session.syllabus.thumbnailUrl;
export const sessionImageAlt = (session: CoreSession) => `${session.syllabus.title} — ${session.path.displayName}`;

export const serializeRegistration = (sessionId: string, form: RegistrationForm): RegistrationPayload => ({
  sessionId,
  contactName: form.contactName.trim(),
  phone: form.phone.trim(),
  childName: form.childName.trim(),
  childDateOfBirth: form.childDateOfBirth,
});

export const validateRegistration = (form: RegistrationForm): Partial<Record<keyof RegistrationForm, string>> => {
  const errors: Partial<Record<keyof RegistrationForm, string>> = {};
  if (!form.contactName.trim()) errors.contactName = "Vui lòng nhập họ tên phụ huynh.";
  if (!form.phone.trim()) errors.phone = "Vui lòng nhập số điện thoại.";
  if (!form.childName.trim()) errors.childName = "Vui lòng nhập tên của con.";
  if (!form.childDateOfBirth) errors.childDateOfBirth = "Vui lòng chọn ngày sinh của con.";
  return errors;
};

export const createSubmissionAttempt = (currentKey: string | null, makeKey: () => string) => currentKey || makeKey();

export const mapRegistrationError = (code?: string): RegistrationIssue => {
  switch (code) {
    case "PLATFORM_INVALID_INPUT":
      return { message: "Một vài thông tin chưa đúng. Ba mẹ vui lòng kiểm tra lại các ô bên trên." };
    case "SESSION_FULL":
      return { message: "Buổi này vừa đủ chỗ. Mời ba mẹ chọn một buổi khác.", refreshSchedule: true };
    case "SESSION_NOT_OPEN":
      return { message: "Buổi này hiện không còn nhận đăng ký. Mời ba mẹ chọn một buổi khác.", refreshSchedule: true };
    case "IDEMPOTENCY_CONFLICT":
      return { message: "Thông tin đăng ký đã thay đổi. Ba mẹ vui lòng gửi lại một lần nữa." };
    case "REGISTRATION_DISABLED":
      return { message: "Đăng ký trực tuyến sắp mở. Ba mẹ có thể xem lịch và quay lại sau." };
    default:
      return { message: "Chưa thể gửi đăng ký lúc này. Ba mẹ vui lòng thử lại.", retryable: true };
  }
};

export const REGISTRATION_SUCCESS_TITLE = "Đã nhận đăng ký";
export const REGISTRATION_SUCCESS_BODY = "PINO sẽ liên hệ với ba mẹ để xác nhận buổi tham gia và hướng dẫn chuẩn bị.";

export function isCoreSession(value: unknown): value is CoreSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<CoreSession>;
  return typeof session.id === "string"
    && typeof session.path?.displayName === "string"
    && typeof session.startsAt === "string"
    && typeof session.endsAt === "string"
    && typeof session.availability?.remainingSeats === "number"
    && typeof session.availability?.isFull === "boolean"
    && typeof session.syllabus?.title === "string";
}
