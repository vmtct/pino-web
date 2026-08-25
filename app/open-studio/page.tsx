"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CoreSession,
  REGISTRATION_SUCCESS_BODY,
  REGISTRATION_SUCCESS_TITLE,
  RegistrationForm,
  createSubmissionAttempt,
  formatAgeRange,
  formatLocalDate,
  formatLocalTimeRange,
  isCoreSession,
  isSessionFull,
  localDateKey,
  mapRegistrationError,
  publicSyllabusTitle,
  serializeRegistration,
  sessionImageAlt,
  sessionThumbnail,
  validateRegistration,
} from "../../lib/open-studio-funnel";
import "./page.css";

const SCHEDULE_ENDPOINT = "/api/pino-core/open-studio/sessions";
const CAPABILITY_ENDPOINT = "/api/pino-core/open-studio/capabilities";
const REGISTRATION_ENDPOINT = "/api/pino-core/open-studio/registrations";
const ASSET_BASE = "https://assets.pinohouse.art/site/OpenStudio";

const ASSETS = {
  hero: `${ASSET_BASE}/open-studio-courtyard-exterior.png`,
  piano: `${ASSET_BASE}/child-playing-piano.png`,
  blocks: `${ASSET_BASE}/children-building-wooden-blocks.png`,
  watercolor: `${ASSET_BASE}/watercolor-palette-and-botanical-painting.png`,
  clay: `${ASSET_BASE}/child-making-clay-cup.png`,
  dance: `${ASSET_BASE}/children-dance-class.png`,
  architecture: `${ASSET_BASE}/architectural-model-and-sketchbook.png`,
  gate: `${ASSET_BASE}/garden-archway-entrance.png`,
  leavesOne: `${ASSET_BASE}/glowing-autumn-leaves-v1.png`,
  leavesTwo: `${ASSET_BASE}/glowing-autumn-leaves-v2.png`,
};

const LOGO_URL = "https://assets.pinohouse.art/core/Pino%20Sigil.png";
const FALLBACK_ACTIVITY_IMAGES = [ASSETS.blocks, ASSETS.piano, ASSETS.watercolor, ASSETS.clay, ASSETS.dance];

type ScheduleResponse = { sessions: CoreSession[] };
type ScheduleStatus = "loading" | "success" | "error";
type SubmissionState = "idle" | "pending" | "success" | "error";
type PathFilter = "all" | "PianoHouse" | "Artchitect" | "Little Piner";

const emptyForm: RegistrationForm = { contactName: "", phone: "", childName: "", childDateOfBirth: "" };

function pathLabel(session: CoreSession): Exclude<PathFilter, "all"> {
  const value = `${session.path.code} ${session.path.displayName} ${session.syllabus.title}`.toLowerCase();
  if (value.includes("little")) return "Little Piner";
  if (value.includes("piano") || value.includes("music")) return "PianoHouse";
  return "Artchitect";
}

function activityImage(session: CoreSession, index = 0) {
  const supplied = sessionThumbnail(session);
  if (supplied) return supplied;
  const value = `${session.path.code} ${session.path.displayName} ${session.syllabus.title}`.toLowerCase();
  if (value.includes("piano") || value.includes("music")) return ASSETS.piano;
  if (value.includes("little")) return ASSETS.blocks;
  if (value.includes("water") || value.includes("paint") || value.includes("art")) return ASSETS.watercolor;
  if (value.includes("clay")) return ASSETS.clay;
  return FALLBACK_ACTIVITY_IMAGES[index % FALLBACK_ACTIVITY_IMAGES.length];
}

function compactDate(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(iso));
}

function OpenStudioNav() {
  return (
    <header className="os-site-header" id="top">
      <nav className="os-nav os-shell" aria-label="Điều hướng chính">
        <a className="os-brand" href="/" aria-label="PINO House — trang chủ">
          <img src={LOGO_URL} alt="" aria-hidden="true" />
          <span>PINO House</span>
        </a>
        <div className="os-nav-links">
          <a href="/">House</a>
          <a href="/#paths">Paths</a>
          <a className="is-active" href="/open-studio">Open Studio</a>
          <a href="/#journey">Journey</a>
          <a href="/#why-pino">About</a>
        </div>
        <a className="os-top-cta" href="#sessions">Khám phá Open Studio <span>→</span></a>
      </nav>
    </header>
  );
}

export default function OpenStudioPage() {
  const [status, setStatus] = useState<ScheduleStatus>("loading");
  const [sessions, setSessions] = useState<CoreSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState("all");
  const [pathFilter, setPathFilter] = useState<PathFilter>("all");
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

  const selectedSession = sessions.find((session) => session.id === selectedId) || null;
  const featuredSession = useMemo(() => sessions.find((session) => !isSessionFull(session)) || sessions[0] || null, [sessions]);
  const dateOptions = useMemo(() => Array.from(new Set(sessions.map((session) => localDateKey(session.startsAt)))), [sessions]);
  const visibleSessions = useMemo(() => sessions.filter((session) => {
    const matchesDate = activeDate === "all" || localDateKey(session.startsAt) === activeDate;
    const matchesPath = pathFilter === "all" || pathLabel(session) === pathFilter;
    return matchesDate && matchesPath;
  }), [activeDate, pathFilter, sessions]);

  const selectSession = (session: CoreSession, openForm = false) => {
    if (isSessionFull(session)) return;
    setSelectedId(session.id);
    setShowForm(openForm && registrationEnabled);
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
    }
  };

  return (
    <main className="open-studio-page">
      <OpenStudioNav />

      <section className="os-hero os-shell" aria-labelledby="open-studio-title">
        <img className="os-hero-leaves" src={ASSETS.leavesOne} alt="" aria-hidden="true" />
        <div className="os-hero-copy">
          <h1 id="open-studio-title">Open Studio</h1>
          <p>Khám phá, sáng tạo và lớn lên — mỗi tuần tại PINO House.</p>
          <a href="#sessions" className="os-inline-link">Xem lịch tuần này <span>↓</span></a>
        </div>
        <div className="os-hero-visual">
          <img src={ASSETS.hero} alt="Khoảng sân và ngôi nhà sáng tạo của PINO House" />
        </div>
      </section>

      <section className="os-main os-shell" id="sessions" aria-labelledby="sessions-title">
        <div className="os-featured-panel">
          <p className="os-kicker">✦ SẮP TỚI TẠI PINO</p>
          {status === "loading" ? <div className="os-featured-loading">Đang mở lịch Open Studio…</div> : null}
          {status === "error" ? <div className="os-featured-error"><strong>Lịch đang tạm nghỉ một chút.</strong><button type="button" onClick={() => void loadSessions()}>Thử tải lại</button></div> : null}
          {status === "success" && !featuredSession ? <div className="os-featured-error"><strong>Lịch mới đang được chuẩn bị.</strong><span>Hãy quay lại sau để xem buổi Open Studio gần nhất.</span></div> : null}
          {status === "success" && featuredSession ? (
            <div className="os-featured-grid">
              <img className="os-featured-image" src={activityImage(featuredSession)} alt={sessionImageAlt(featuredSession)} />
              <div className="os-featured-copy">
                <span className="os-time-label">{formatLocalTimeRange(featuredSession.startsAt, featuredSession.endsAt)}</span>
                <h2 id="sessions-title">{publicSyllabusTitle(featuredSession.syllabus.title)}</h2>
                <div className="os-pills"><span>{formatAgeRange(featuredSession.syllabus.ageMin, featuredSession.syllabus.ageMax)}</span><span>{pathLabel(featuredSession)}</span></div>
                <p>{featuredSession.syllabus.shortDescription || "Một buổi trải nghiệm nhẹ nhàng để con thử, làm và khám phá điều mình tò mò."}</p>
              </div>
              <div className="os-featured-meta">
                <dl>
                  <div><dt>Path</dt><dd>{pathLabel(featuredSession)}</dd></div>
                  <div><dt>Chỗ còn lại</dt><dd>{isSessionFull(featuredSession) ? "Đã đủ chỗ" : featuredSession.availability.remainingSeats}</dd></div>
                  <div><dt>Thời gian</dt><dd>{formatLocalDate(featuredSession.startsAt)}</dd></div>
                </dl>
                <button className="os-book-button" type="button" disabled={isSessionFull(featuredSession)} onClick={() => selectSession(featuredSession, true)}>{isSessionFull(featuredSession) ? "Đã đủ chỗ" : "Đăng ký ngay"}<span>→</span></button>
                <button className="os-detail-link" type="button" disabled={isSessionFull(featuredSession)} onClick={() => selectSession(featuredSession)}>Xem chi tiết</button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="os-week-head">
          <div>
            <p className="os-kicker">LỊCH OPEN STUDIO</p>
            <div className="os-date-row" aria-label="Lọc theo ngày">
              <button className={activeDate === "all" ? "is-active" : ""} onClick={() => setActiveDate("all")} type="button">Tất cả</button>
              {dateOptions.slice(0, 7).map((date) => {
                const representative = sessions.find((session) => localDateKey(session.startsAt) === date);
                return representative ? <button className={activeDate === date ? "is-active" : ""} onClick={() => setActiveDate(date)} type="button" key={date}>{compactDate(representative.startsAt)}</button> : null;
              })}
            </div>
          </div>
          <div className="os-filter-row" aria-label="Lọc theo lộ trình">
            {(["all", "PianoHouse", "Artchitect", "Little Piner"] as PathFilter[]).map((filter) => <button className={pathFilter === filter ? "is-active" : ""} onClick={() => setPathFilter(filter)} type="button" key={filter}>{filter === "all" ? "Tất cả" : filter}</button>)}
          </div>
        </div>

        {status === "loading" ? <div className="os-card-grid os-skeleton-grid">{[0, 1, 2, 3, 4, 5].map((item) => <div className="os-session-card os-skeleton-card" key={item}><span /><i /><i /><i /></div>)}</div> : null}
        {status === "success" && visibleSessions.length === 0 ? <div className="os-empty">Chưa có buổi phù hợp với bộ lọc này.</div> : null}
        {status === "success" && visibleSessions.length > 0 ? (
          <div className="os-card-grid">
            {visibleSessions.slice(0, 9).map((session, index) => {
              const full = isSessionFull(session);
              return (
                <article className={`os-session-card${selectedId === session.id ? " is-selected" : ""}`} key={session.id}>
                  <img src={activityImage(session, index)} alt={sessionImageAlt(session)} />
                  <div className="os-session-body">
                    <span className="os-time-label">{formatLocalTimeRange(session.startsAt, session.endsAt)}</span>
                    <h3>{publicSyllabusTitle(session.syllabus.title)}</h3>
                    <div className="os-pills"><span>{formatAgeRange(session.syllabus.ageMin, session.syllabus.ageMax)}</span><span>{pathLabel(session)}</span></div>
                    <div className="os-session-bottom">
                      <strong className={session.availability.remainingSeats <= 3 ? "is-low" : ""}>{full ? "Đã đủ chỗ" : `${session.availability.remainingSeats} chỗ còn lại`}</strong>
                      <button type="button" disabled={full} onClick={() => selectSession(session)}>{full ? "Đã đủ" : "Xem chi tiết"}<span>{full ? "" : "→"}</span></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {selectedSession ? (
          <div className="os-session-detail" ref={detailRef} tabIndex={-1} aria-labelledby="session-detail-title">
            <img src={activityImage(selectedSession)} alt={sessionImageAlt(selectedSession)} />
            <div className="os-session-detail-copy">
              <p className="os-kicker">{pathLabel(selectedSession)} · {formatAgeRange(selectedSession.syllabus.ageMin, selectedSession.syllabus.ageMax)}</p>
              <h2 id="session-detail-title">{publicSyllabusTitle(selectedSession.syllabus.title)}</h2>
              <p className="os-detail-date">{formatLocalDate(selectedSession.startsAt)} · {formatLocalTimeRange(selectedSession.startsAt, selectedSession.endsAt)} · Giờ Việt Nam</p>
              {selectedSession.syllabus.publicDescription ? <p>{selectedSession.syllabus.publicDescription}</p> : null}
              {selectedSession.syllabus.skillSummary ? <div className="os-detail-note"><strong>Con sẽ khám phá</strong><p>{selectedSession.syllabus.skillSummary}</p></div> : null}

              {!registrationEnabled ? <div className="os-registration-notice"><strong>Đăng ký trực tuyến sắp mở</strong><p>Ba mẹ vẫn có thể xem lịch. PINO sẽ mở nhận đăng ký khi hệ thống sẵn sàng.</p></div> : null}
              {registrationEnabled && !showForm && submission !== "success" ? <button className="os-book-button" type="button" onClick={() => setShowForm(true)}>Đăng ký buổi này <span>→</span></button> : null}

              {registrationEnabled && showForm && submission !== "success" ? (
                <form className="os-registration-form" onSubmit={submitRegistration} noValidate>
                  <h3>Thông tin gia đình</h3>
                  <p>PINO sẽ liên hệ để xác nhận chỗ. Một đăng ký dành cho một bé.</p>
                  <label>Họ tên phụ huynh<input name="contactName" autoComplete="name" value={form.contactName} onChange={(event) => updateForm("contactName", event.target.value)} aria-invalid={Boolean(fieldErrors.contactName)} />{fieldErrors.contactName ? <small>{fieldErrors.contactName}</small> : null}</label>
                  <label>Số điện thoại<input name="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} aria-invalid={Boolean(fieldErrors.phone)} />{fieldErrors.phone ? <small>{fieldErrors.phone}</small> : null}</label>
                  <label>Tên của con<input name="childName" autoComplete="off" value={form.childName} onChange={(event) => updateForm("childName", event.target.value)} aria-invalid={Boolean(fieldErrors.childName)} />{fieldErrors.childName ? <small>{fieldErrors.childName}</small> : null}</label>
                  <label>Ngày sinh của con<input name="childDateOfBirth" type="date" value={form.childDateOfBirth} onChange={(event) => updateForm("childDateOfBirth", event.target.value)} aria-invalid={Boolean(fieldErrors.childDateOfBirth)} />{fieldErrors.childDateOfBirth ? <small>{fieldErrors.childDateOfBirth}</small> : null}</label>
                  {submission === "error" ? <p className="os-submit-error" role="alert">{submissionMessage}</p> : null}
                  <button className="os-book-button" type="submit" disabled={submission === "pending"}>{submission === "pending" ? "Đang gửi…" : "Gửi đăng ký"}<span>→</span></button>
                </form>
              ) : null}
              {registrationEnabled && submission === "success" ? <div className="os-registration-success" role="status"><span>✓</span><div><strong>{REGISTRATION_SUCCESS_TITLE}</strong><p>{REGISTRATION_SUCCESS_BODY}</p></div></div> : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="os-info os-shell">
        <article className="os-architecture-card">
          <div><p className="os-kicker">TUẦN NÀY TẠI PINO</p><h2>Architecture Explorers</h2><p>Trẻ quan sát, phác thảo và biến ý tưởng không gian thành mô hình bằng đôi tay của mình.</p><a href="#sessions">Xem lịch <span>→</span></a></div>
          <img src={ASSETS.architecture} alt="Mô hình kiến trúc và sổ phác thảo" />
        </article>
        <article className="os-how-card"><p className="os-kicker">OPEN STUDIO HOẠT ĐỘNG THẾ NÀO</p><div className="os-how-steps"><span><b>01</b>Chọn một buổi</span><i>→</i><span><b>02</b>Giữ chỗ</span><i>→</i><span><b>03</b>Đến và tận hưởng</span><i>→</i><span><b>04</b>Thử & khám phá</span></div></article>
        <article className="os-for-card"><p className="os-kicker">DÀNH CHO AI</p><ul><li>Trẻ 3–12 tuổi</li><li>Những bạn nhỏ tò mò và thích thử</li><li>Phụ huynh muốn quan sát con tự nhiên</li><li>Không cần kinh nghiệm trước</li></ul></article>
      </section>

      <section className="os-faq os-shell" aria-labelledby="faq-title">
        <h2 id="faq-title">FAQ</h2>
        <div>
          <details><summary>Cần đăng ký trước bao lâu?</summary><p>Nên chọn buổi ngay khi lịch mở vì mỗi buổi có số chỗ giới hạn.</p></details>
          <details><summary>Con cần mang theo gì?</summary><p>PINO chuẩn bị vật liệu và dụng cụ cần thiết. Gia đình chỉ cần đến đúng giờ và mặc đồ thoải mái.</p></details>
          <details><summary>Phụ huynh có thể ở lại không?</summary><p>Tùy trải nghiệm và độ tuổi. Mentor sẽ hướng dẫn khi PINO xác nhận buổi tham gia.</p></details>
          <details><summary>Có chỗ đậu xe không?</summary><p>Có. PINO sẽ gửi hướng dẫn cụ thể khi xác nhận đăng ký.</p></details>
        </div>
      </section>

      <section className="os-final-cta os-shell">
        <img className="os-final-bg" src={ASSETS.gate} alt="" aria-hidden="true" />
        <img className="os-final-leaves os-final-leaves-left" src={ASSETS.leavesOne} alt="" aria-hidden="true" />
        <img className="os-final-leaves os-final-leaves-right" src={ASSETS.leavesTwo} alt="" aria-hidden="true" />
        <div><h2>Sẵn sàng khám phá hôm nay?</h2><p>Mỗi buổi chỉ có một số chỗ nhỏ — chọn một trải nghiệm và cùng con tạo nên một buổi chiều đáng nhớ.</p><a className="os-final-button" href="#sessions">Khám phá Open Studio <span>→</span></a></div>
      </section>

      <footer className="os-footer os-shell">
        <div className="os-footer-brand"><a className="os-brand" href="/"><img src={LOGO_URL} alt="" aria-hidden="true" /><span>PINO House</span></a><p>Art. Music. Creative Growth.</p><small>pinohouse.art</small></div>
        <div><strong>Explore</strong><a href="/">House</a><a href="/#paths">Paths</a><a href="/open-studio">Open Studio</a></div>
        <div><strong>About</strong><a href="/#why-pino">Our Story</a><a href="/#journey">Journey</a></div>
        <div><strong>Information</strong><a href="#sessions">Visit</a><a href="#faq-title">FAQs</a></div>
        <div><strong>Stay connected</strong><p>Nhận tin về Open Studio và các trải nghiệm đặc biệt tại PINO House.</p></div>
        <span className="os-copyright">© {new Date().getFullYear()} PINO House. All rights reserved.</span>
      </footer>
    </main>
  );
}
