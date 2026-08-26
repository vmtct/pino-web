export const PINO_TIMEZONE = "Asia/Ho_Chi_Minh";

export type PublicLocale = "vi" | "en";

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

const formatter = (locale: PublicLocale, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
  timeZone: PINO_TIMEZONE,
  ...options,
});

export const localDateKey = (iso: string) => new Intl.DateTimeFormat("en-CA", {
  timeZone: PINO_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date(iso));

export const formatLocalDate = (iso: string, locale: PublicLocale = "vi") => {
  const value = formatter(locale, { weekday: "long", day: "2-digit", month: locale === "vi" ? "2-digit" : "short" }).format(new Date(iso));
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const formatLocalTimeRange = (startsAt: string, endsAt: string, locale: PublicLocale = "vi") => {
  const time = formatter(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${time.format(new Date(startsAt))}–${time.format(new Date(endsAt))}`;
};

export const formatAgeRange = (ageMin: number | null, ageMax: number | null, locale: PublicLocale = "vi") => {
  if (locale === "en") {
    if (ageMin !== null && ageMax !== null) return ageMin === ageMax ? `${ageMin} years old` : `Ages ${ageMin}–${ageMax}`;
    if (ageMin !== null) return `Ages ${ageMin}+`;
    if (ageMax !== null) return `Up to age ${ageMax}`;
    return "All ages";
  }
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
export const publicSyllabusTitle = (title: string) => title.replace(/\s+(?:—|-)\s*dev(?:elopment)?$/i, "").trim();
export const sessionImageAlt = (session: CoreSession) => `${publicSyllabusTitle(session.syllabus.title)} — ${session.path.displayName}`;

export const serializeRegistration = (sessionId: string, form: RegistrationForm): RegistrationPayload => ({
  sessionId,
  contactName: form.contactName.trim(),
  phone: form.phone.trim(),
  childName: form.childName.trim(),
  childDateOfBirth: form.childDateOfBirth,
});

export const validateRegistration = (form: RegistrationForm, locale: PublicLocale = "vi"): Partial<Record<keyof RegistrationForm, string>> => {
  const errors: Partial<Record<keyof RegistrationForm, string>> = {};
  if (!form.contactName.trim()) errors.contactName = locale === "vi" ? "Vui lòng nhập họ tên phụ huynh." : "Please enter the parent or guardian name.";
  if (!form.phone.trim()) errors.phone = locale === "vi" ? "Vui lòng nhập số điện thoại." : "Please enter a phone number.";
  if (!form.childName.trim()) errors.childName = locale === "vi" ? "Vui lòng nhập tên của con." : "Please enter the child's name.";
  if (!form.childDateOfBirth) errors.childDateOfBirth = locale === "vi" ? "Vui lòng chọn ngày sinh của con." : "Please choose the child's date of birth.";
  return errors;
};

export const createSubmissionAttempt = (currentKey: string | null, makeKey: () => string) => currentKey || makeKey();

export const mapRegistrationError = (code?: string, locale: PublicLocale = "vi"): RegistrationIssue => {
  const en = locale === "en";
  switch (code) {
    case "PLATFORM_INVALID_INPUT":
      return { message: en ? "Some information is not valid. Please check the fields above." : "Một vài thông tin chưa đúng. Ba mẹ vui lòng kiểm tra lại các ô bên trên." };
    case "SESSION_FULL":
      return { message: en ? "This session has just filled up. Please choose another session." : "Buổi này vừa đủ chỗ. Mời ba mẹ chọn một buổi khác.", refreshSchedule: true };
    case "SESSION_NOT_OPEN":
      return { message: en ? "This session is no longer accepting registrations. Please choose another session." : "Buổi này hiện không còn nhận đăng ký. Mời ba mẹ chọn một buổi khác.", refreshSchedule: true };
    case "IDEMPOTENCY_CONFLICT":
      return { message: en ? "The registration details changed. Please submit once more." : "Thông tin đăng ký đã thay đổi. Ba mẹ vui lòng gửi lại một lần nữa." };
    case "REGISTRATION_DISABLED":
      return { message: en ? "Online registration is opening soon. You can browse the schedule and return later." : "Đăng ký trực tuyến sắp mở. Ba mẹ có thể xem lịch và quay lại sau." };
    default:
      return { message: en ? "We could not send the registration right now. Please try again." : "Chưa thể gửi đăng ký lúc này. Ba mẹ vui lòng thử lại.", retryable: true };
  }
};

export const REGISTRATION_SUCCESS_TITLE = "Đã nhận đăng ký";
export const REGISTRATION_SUCCESS_BODY = "PINO sẽ liên hệ với ba mẹ để xác nhận buổi tham gia và hướng dẫn chuẩn bị.";
export const registrationSuccessTitle = (locale: PublicLocale = "vi") => locale === "vi" ? REGISTRATION_SUCCESS_TITLE : "Registration received";
export const registrationSuccessBody = (locale: PublicLocale = "vi") => locale === "vi" ? REGISTRATION_SUCCESS_BODY : "PINO will contact you to confirm the session and share what to prepare.";

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
