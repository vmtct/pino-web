"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HouseArtwork, PrimaryCta, PublicFooter, PublicNav, SectionIntro } from "../components/public-site";
import {
  CoreSession,
  REGISTRATION_SUCCESS_BODY,
  REGISTRATION_SUCCESS_TITLE,
  RegistrationForm,
  createSubmissionAttempt,
  formatAgeRange,
  formatLocalDate,
  formatLocalTimeRange,
  groupSessionsByLocalDate,
  isCoreSession,
  isSessionFull,
  mapRegistrationError,
  publicSyllabusTitle,
  serializeRegistration,
  sessionCover,
  sessionImageAlt,
  sessionThumbnail,
  validateRegistration,
} from "../../lib/open-studio-funnel";
import "./page.css";

const SCHEDULE_ENDPOINT = "/api/pino-core/open-studio/sessions";
const CAPABILITY_ENDPOINT = "/api/pino-core/open-studio/capabilities";
const REGISTRATION_ENDPOINT = "/api/pino-core/open-studio/registrations";

type ScheduleResponse = { sessions: CoreSession[] };
type ScheduleStatus = "loading" | "success" | "error";
type SubmissionState = "idle" | "pending" | "success" | "error";

const emptyForm: RegistrationForm = { contactName: "", phone: "", childName: "", childDateOfBirth: "" };

const paths = [
  { age: "3–6 tuổi", name: "Little Piner Art", note: "Màu sắc, vật liệu và đôi tay tò mò." },
  { age: "3–6 tuổi", name: "Little Piner Piano", note: "Âm thanh, nhịp điệu và niềm vui đầu tiên." },
  { age: "7+ tuổi", name: "Art", note: "Quan sát, ý tưởng và ngôn ngữ tạo hình riêng." },
  { age: "7+ tuổi", name: "Piano", note: "Cảm thụ, kỹ thuật và cách kể chuyện bằng âm nhạc." },
];

export default function OpenStudioPage() {
  const [status, setStatus] = useState<ScheduleStatus>("loading");
  const [sessions, setSessions] = useState<CoreSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RegistrationForm>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegistrationForm, string>>>({});
  const [submission, setSubmission] = useState<SubmissionState>("idle");
  const [submissionMessage, setSubmissionMessage] = useState("");
  const attemptKey = useRef<string | null>(null);
  const submissionInFlight = useRef(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const loadSessions = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch(SCHEDULE_ENDPOINT, { cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Schedule request failed (${response.status})`);
      const data = await response.json() as ScheduleResponse;
      if (!data || !Array.isArray(data.sessions)) throw new Error("Invalid schedule response");
      setSessions(data.sessions.filter(isCoreSession).sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      setStatus("success");
    } catch {
      setSessions([]);
      setStatus("error");
    }
  }, []);

  useEffect(() => { void loadSessions(); }, [loadSessions]);

  useEffect(() => {
    let cancelled = false;
    fetch(CAPABILITY_ENDPOINT, { cache: "no-store", headers: { Accept: "application/json" } })
      .then(async (response) => response.ok ? response.json() as Promise<{ registrationEnabled?: boolean }> : { registrationEnabled: false })
      .then((data) => { if (!cancelled) setRegistrationEnabled(data.registrationEnabled === true); })
      .catch(() => { if (!cancelled) setRegistrationEnabled(false); });
    return () => { cancelled = true; };
  }, []);

  const groupedSessions = useMemo(() => groupSessionsByLocalDate(sessions), [sessions]);

  const selectedSession = sessions.find((session) => session.id === selectedId) || null;

  const selectSession = (session: CoreSession) => {
    if (isSessionFull(session)) return;
    setSelectedId(session.id);
    setShowForm(false);
    setSubmission("idle");
    setSubmissionMessage("");
    setForm(emptyForm);
    setFieldErrors({});
    attemptKey.current = null;
    window.setTimeout(() => detailRef.current?.focus(), 0);
  };

  const updateForm = (field: keyof RegistrationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    if (submission === "error") setSubmission("idle");
    attemptKey.current = null;
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSession || !registrationEnabled || submission === "pending" || submissionInFlight.current) return;
    const errors = validateRegistration(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSubmission("error");
      setSubmissionMessage("Ba mẹ vui lòng kiểm tra các thông tin còn thiếu.");
      return;
    }

    const key = createSubmissionAttempt(attemptKey.current, () => crypto.randomUUID());
    attemptKey.current = key;
    submissionInFlight.current = true;
    setSubmission("pending");
    setSubmissionMessage("");
    try {
      const response = await fetch(REGISTRATION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify(serializeRegistration(selectedSession.id, form)),
      });
      const data = await response.json().catch(() => ({})) as { error?: { code?: string } };
      if (!response.ok) {
        const issue = mapRegistrationError(data.error?.code);
        setSubmission("error");
        setSubmissionMessage(issue.message);
        attemptKey.current = null;
        submissionInFlight.current = false;
        if (issue.refreshSchedule) void loadSessions();
        return;
      }
      setSubmission("success");
      attemptKey.current = null;
      submissionInFlight.current = false;
    } catch {
      const issue = mapRegistrationError();
      setSubmission("error");
      setSubmissionMessage(issue.message);
      submissionInFlight.current = false;
      // Keep the key so a network retry remains the same logical submission.
    }
  };

  return (
    <main className="open-studio-page">
      <PublicNav />

      <section className="os-hero shell" aria-labelledby="open-studio-title">
        <div className="os-hero-copy">
          <p className="eyebrow">PINO HOUSE · OPEN STUDIO</p>
          <h1 id="open-studio-title">Cho con một buổi chiều <em>ý nghĩa.</em></h1>
          <p className="os-lead">Một khoảng thời gian nhẹ nhàng để con chạm vào nghệ thuật, âm nhạc và tìm điều mình thật sự muốn khám phá.</p>
          <div className="os-hero-actions">
            <PrimaryCta href="#sessions">Xem lịch Open Studio</PrimaryCta>
            <a className="os-text-link" href="#what-is">Open Studio là gì? <span aria-hidden="true">↓</span></a>
          </div>
          <p className="os-soft-note"><span aria-hidden="true">✳</span> Không áp lực · Không phải buổi học thử bán hàng</p>
        </div>
        <HouseArtwork />
      </section>

      <section className="os-purpose shell" id="what-is" aria-labelledby="purpose-title">
        <SectionIntro
          id="purpose-title"
          eyebrow="01 · OPEN STUDIO LÀ GÌ?"
          title={<>Một cánh cửa mở vào <em>thế giới của con.</em></>}
          copy="Open Studio là buổi trải nghiệm miễn phí, nơi trẻ được tự do quan sát, thử làm và trò chuyện cùng mentor trong không gian PINO House."
        />
        <div className="os-purpose-grid" id="why-pino">
          <article><span>01</span><h3>Đến để khám phá</h3><p>Không cần biết trước, không cần làm giống ai. Con bắt đầu bằng sự tò mò của chính mình.</p></article>
          <article><span>02</span><h3>Được người lớn lắng nghe</h3><p>Mentor quan sát cách con phản ứng, đặt câu hỏi và tạo ra — thay vì chỉ chấm một kết quả.</p></article>
          <article><span>03</span><h3>Ra về với một dấu ấn</h3><p>Một trải nghiệm, một câu chuyện hoặc một tác phẩm nhỏ để cả nhà cùng tiếp tục trò chuyện.</p></article>
        </div>
      </section>

      <section className="os-paths" id="paths" aria-labelledby="paths-title">
        <div className="shell">
          <SectionIntro
            id="paths-title"
            eyebrow="02 · DÀNH CHO AI?"
            title={<>Bốn lối vào, <em>một ngôi nhà.</em></>}
            copy="Chọn theo độ tuổi và điều con muốn thử. Không cần quyết định một lộ trình dài ngay hôm nay."
          />
          <div className="os-path-grid">
            {paths.map((path, index) => <article key={path.name}>
              <div><span>{String(index + 1).padStart(2, "0")}</span><small>{path.age}</small></div>
              <h3>{path.name}</h3><p>{path.note}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="os-model shell" id="journey" aria-labelledby="model-title">
        <SectionIntro id="model-title" eyebrow="03 · EXPLORE & JOURNEY" title={<>Bắt đầu nhẹ nhàng. <em>Đi xa khi sẵn sàng.</em></>} />
        <div className="os-model-grid">
          <article className="os-model-card os-model-explore">
            <p className="eyebrow">FREE · EXPLORE</p><h3>Open Studio</h3>
            <p>Những lần ghé PINO để khám phá chủ đề, chất liệu và trải nghiệm mới — không ràng buộc.</p>
            <ul><li>Một buổi chiều có chủ đích</li><li>Không gian và mentor PINO</li><li>Tự do thử điều con tò mò</li></ul>
          </article>
          <article className="os-model-card os-model-journey">
            <p className="eyebrow">PREMIUM · JOURNEY + EXPLORE</p><h3>Premium Journey</h3>
            <p>Một hành trình học tập có cấu trúc cho gia đình muốn con đi sâu và trưởng thành bền vững.</p>
            <ul><li>Lộ trình và tiến trình rõ ràng</li><li>Mentor đồng hành sâu hơn</li><li>Tác phẩm, portfolio và đặc quyền PINO</li></ul>
          </article>
        </div>
      </section>

      <section className="os-schedule" id="sessions" aria-labelledby="sessions-title">
        <div className="shell">
          <SectionIntro
            id="sessions-title"
            eyebrow="04 · LỊCH SẮP TỚI"
            title={<>Chọn một buổi <em>phù hợp với con.</em></>}
            copy="Mỗi buổi là một trải nghiệm thật, với chủ đề, độ tuổi và số chỗ được cập nhật từ lịch PINO."
          />

          <div className="os-schedule-panel" aria-live="polite" aria-busy={status === "loading"}>
            {status === "loading" ? <div className="os-card-grid os-skeleton-grid" aria-label="Đang mở lịch Open Studio">
              {[0, 1, 2].map((item) => <div className="os-session-card os-skeleton-card" key={item} aria-hidden="true">
                <span className="os-skeleton-media" /><span className="os-skeleton-line wide" /><span className="os-skeleton-line" /><span className="os-skeleton-line short" />
              </div>)}
            </div> : null}

            {status === "error" ? <div className="os-state os-error-state">
              <span aria-hidden="true">↻</span><div><strong>Lịch đang tạm nghỉ một chút.</strong><p>Phần còn lại của Open Studio vẫn ở đây. Bạn có thể thử lại hoặc liên hệ PINO để hỏi lịch gần nhất.</p>
              <button type="button" onClick={() => void loadSessions()}>Thử tải lại</button></div>
            </div> : null}

            {status === "success" && groupedSessions.length === 0 ? <div className="os-state os-empty-state">
              <span aria-hidden="true">✳</span><div><strong>Lịch mới đang được chuẩn bị.</strong><p>Chưa có buổi Open Studio sắp tới. Hãy quay lại sau hoặc nhắn PINO để được báo khi lịch mở.</p></div>
            </div> : null}

            {status === "success" && groupedSessions.length > 0 ? <div className="os-day-list">
              {groupedSessions.map(([key, daySessions]) => <section className="os-day" key={key} aria-labelledby={`day-${key}`}>
                <h3 id={`day-${key}`}>{formatLocalDate(daySessions[0].startsAt)}</h3>
                <div className="os-card-grid">
                  {daySessions.map((session) => {
                    const isFull = isSessionFull(session);
                    const selected = selectedId === session.id;
                    const thumbnail = sessionThumbnail(session);
                    return <article className={`os-session-card${selected ? " is-selected" : ""}${isFull ? " is-full" : ""}`} key={session.id}>
                      <div className={`os-card-media${thumbnail ? " has-image" : " is-fallback"}`}>
                        {thumbnail ? <img src={thumbnail} alt={sessionImageAlt(session)} /> : <div className="os-media-fallback" role="img" aria-label={`Minh hoạ Open Studio — ${session.path.displayName}`}><span>OPEN</span><strong>STUDIO</strong><i aria-hidden="true">✳</i></div>}
                        <span className="os-path-pill">{session.path.displayName}</span>
                      </div>
                      <div className="os-card-body">
                        <div className="os-card-meta"><span>{formatAgeRange(session.syllabus.ageMin, session.syllabus.ageMax)}</span><span className={`os-seats${isFull ? " is-full" : ""}`}><i aria-hidden="true" />{isFull ? "Đã đủ chỗ" : `Còn ${session.availability.remainingSeats} chỗ`}</span></div>
                        <h4>{publicSyllabusTitle(session.syllabus.title)}</h4>
                        {session.syllabus.shortDescription ? <p>{session.syllabus.shortDescription}</p> : null}
                        <div className="os-card-when"><span>{formatLocalDate(session.startsAt)}</span><strong>{formatLocalTimeRange(session.startsAt, session.endsAt)}</strong></div>
                        <button type="button" disabled={isFull} aria-pressed={selected} onClick={() => selectSession(session)}>{isFull ? "Đã đủ chỗ" : selected ? "Đang xem" : "Khám phá"}<span aria-hidden="true">{isFull ? "" : "→"}</span></button>
                      </div>
                    </article>;
                  })}
                </div>
              </section>)}
            </div> : null}
          </div>

          {!registrationEnabled && status === "success" ? <div className="os-registration-disabled os-registration-notice" role="status"><span aria-hidden="true">✳</span><div><strong>Đăng ký trực tuyến sắp mở</strong><p>Ba mẹ có thể xem lịch ngay hôm nay. PINO sẽ mở nhận đăng ký khi hệ thống chính thức sẵn sàng.</p></div></div> : null}

          {selectedSession ? <div className="os-detail" ref={detailRef} tabIndex={-1} aria-labelledby="session-detail-title">
            <div className={`os-detail-media${sessionCover(selectedSession) ? " has-image" : " is-fallback"}`}>
              {sessionCover(selectedSession) ? <img src={sessionCover(selectedSession)!} alt={sessionImageAlt(selectedSession)} /> : <div className="os-media-fallback os-media-fallback-large" role="img" aria-label={`Minh hoạ Open Studio — ${selectedSession.path.displayName}`}><span>MAKE ROOM</span><strong>TO GROW.</strong><i aria-hidden="true">✳</i></div>}
            </div>
            <div className="os-detail-copy">
              <p className="eyebrow">{selectedSession.path.displayName} · {formatAgeRange(selectedSession.syllabus.ageMin, selectedSession.syllabus.ageMax)}</p>
              <h3 id="session-detail-title">{publicSyllabusTitle(selectedSession.syllabus.title)}</h3>
              <div className="os-detail-when"><strong>{formatLocalDate(selectedSession.startsAt)}</strong><span>{formatLocalTimeRange(selectedSession.startsAt, selectedSession.endsAt)} · Giờ Việt Nam</span><span className="os-seats"><i aria-hidden="true" />Còn {selectedSession.availability.remainingSeats} chỗ</span></div>
              {selectedSession.syllabus.publicDescription ? <section><h4>Con sẽ làm gì?</h4><p>{selectedSession.syllabus.publicDescription}</p></section> : null}
              {selectedSession.syllabus.skillSummary ? <section><h4>Con sẽ khám phá</h4><p>{selectedSession.syllabus.skillSummary}</p></section> : null}

              {!registrationEnabled ? <div className="os-registration-disabled" role="status"><span aria-hidden="true">✳</span><div><strong>Đăng ký trực tuyến sắp mở</strong><p>Ba mẹ vẫn có thể xem lịch và chọn trải nghiệm phù hợp. PINO sẽ mở nhận đăng ký sau khi hệ thống chính thức sẵn sàng.</p></div></div> : null}

              {registrationEnabled && !showForm && submission !== "success" ? <button className="os-detail-cta" type="button" onClick={() => setShowForm(true)}>Đăng ký buổi này <span aria-hidden="true">→</span></button> : null}

              {registrationEnabled && showForm && submission !== "success" ? <form className="os-registration-form" onSubmit={submitRegistration} noValidate>
                <div className="os-form-heading"><p className="eyebrow">YÊU CẦU ĐĂNG KÝ</p><h4>Thông tin của gia đình</h4><p>PINO sẽ liên hệ để xác nhận chỗ. Một đăng ký dành cho một bé.</p></div>
                <label>Họ tên phụ huynh<input name="contactName" autoComplete="name" value={form.contactName} onChange={(event) => updateForm("contactName", event.target.value)} aria-invalid={Boolean(fieldErrors.contactName)} aria-describedby={fieldErrors.contactName ? "contactName-error" : undefined} />{fieldErrors.contactName ? <small id="contactName-error">{fieldErrors.contactName}</small> : null}</label>
                <label>Số điện thoại<input name="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "phone-error" : undefined} />{fieldErrors.phone ? <small id="phone-error">{fieldErrors.phone}</small> : null}</label>
                <label>Tên của con<input name="childName" autoComplete="off" value={form.childName} onChange={(event) => updateForm("childName", event.target.value)} aria-invalid={Boolean(fieldErrors.childName)} aria-describedby={fieldErrors.childName ? "childName-error" : undefined} />{fieldErrors.childName ? <small id="childName-error">{fieldErrors.childName}</small> : null}</label>
                <label>Ngày sinh của con<input name="childDateOfBirth" type="date" value={form.childDateOfBirth} onChange={(event) => updateForm("childDateOfBirth", event.target.value)} aria-invalid={Boolean(fieldErrors.childDateOfBirth)} aria-describedby={fieldErrors.childDateOfBirth ? "childDateOfBirth-error" : undefined} />{fieldErrors.childDateOfBirth ? <small id="childDateOfBirth-error">{fieldErrors.childDateOfBirth}</small> : null}</label>
                {submission === "error" ? <p className="os-submit-message is-error" role="alert">{submissionMessage}</p> : null}
                <button className="os-detail-cta" type="submit" disabled={submission === "pending"}>{submission === "pending" ? "Đang gửi…" : "Gửi đăng ký"}<span aria-hidden="true">→</span></button>
                <p className="os-form-note">Đây là yêu cầu đăng ký. PINO sẽ liên hệ để xác nhận buổi tham gia.</p>
              </form> : null}

              {registrationEnabled && submission === "success" ? <div className="os-registration-success" role="status"><span aria-hidden="true">✓</span><h4>{REGISTRATION_SUCCESS_TITLE}</h4><p>{REGISTRATION_SUCCESS_BODY}</p></div> : null}
            </div>
          </div> : null}
        </div>
      </section>

      <section className="os-next shell" aria-labelledby="next-title">
        <SectionIntro id="next-title" eyebrow="05 · SAU KHI CHỌN BUỔI" title={<>Ba bước đơn giản, <em>không áp lực.</em></>} />
        <ol>
          <li><span>01</span><div><h3>Chọn buổi phù hợp</h3><p>Xem ngày, giờ, lộ trình và số chỗ còn lại ngay trên lịch.</p></div></li>
          <li><span>02</span><div><h3>Để lại thông tin</h3><p>Khi luồng đăng ký mở, phụ huynh chỉ cần cung cấp thông tin cần thiết để giữ chỗ.</p></div></li>
          <li><span>03</span><div><h3>Cùng con đến PINO</h3><p>PINO sẽ xác nhận trước buổi trải nghiệm để gia đình biết cần chuẩn bị gì.</p></div></li>
        </ol>
      </section>

      <section className="os-final shell" aria-labelledby="final-title">
        <div><p className="eyebrow">MỘT BUỔI CHIỀU CÓ THỂ MỞ RA MỘT HÀNH TRÌNH</p><h2 id="final-title">Hãy để con bắt đầu bằng <em>sự tò mò.</em></h2>
        <p>Open Studio là lời mời khám phá. Premium Journey chỉ bắt đầu khi gia đình và con thực sự muốn đi sâu hơn.</p><PrimaryCta href="#sessions">Xem lịch Open Studio</PrimaryCta></div>
        <HouseArtwork compact />
      </section>

      <PublicFooter />
    </main>
  );
}
