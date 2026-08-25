"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CoreSession,
  RegistrationForm,
  createSubmissionAttempt,
  formatAgeRange,
  formatLocalDate,
  formatLocalTimeRange,
  isCoreSession,
  isSessionFull,
  mapRegistrationError,
  publicSyllabusTitle,
  serializeRegistration,
  sessionImageAlt,
  sessionThumbnail,
  validateRegistration,
} from "../../../lib/open-studio-funnel";
import { buildOpenStudioFallbackSessions, isFallbackSession } from "../fallback-sessions";
import "./detail.css";

const SCHEDULE_ENDPOINT = "/api/pino-core/open-studio/sessions";
const CAPABILITY_ENDPOINT = "/api/pino-core/open-studio/capabilities";
const REGISTRATION_ENDPOINT = "/api/pino-core/open-studio/registrations";
const ASSET_BASE = "https://assets.pinohouse.art/site/OpenStudio";
const LOGO_URL = "https://assets.pinohouse.art/core/Pino%20Sigil.png";
const DEMO_PREFIX = "demo-open-studio-";

const ASSETS = {
  courtyard: `${ASSET_BASE}/open-studio-courtyard-exterior.png`,
  blocks: `${ASSET_BASE}/children-building-wooden-blocks.png`,
  piano: `${ASSET_BASE}/child-playing-piano.png`,
  watercolor: `${ASSET_BASE}/watercolor-palette-and-botanical-painting.png`,
  clay: `${ASSET_BASE}/child-making-clay-cup.png`,
  dance: `${ASSET_BASE}/children-dance-class.png`,
  architecture: `${ASSET_BASE}/architectural-model-and-sketchbook.png`,
  gate: `${ASSET_BASE}/garden-archway-entrance.png`,
  leavesOne: `${ASSET_BASE}/glowing-autumn-leaves-v1.png`,
  leavesTwo: `${ASSET_BASE}/glowing-autumn-leaves-v2.png`,
};

type ScheduleResponse = { sessions: CoreSession[] };
type LoadState = "loading" | "success" | "error";
type SubmissionState = "idle" | "pending" | "success" | "error";

type Outcome = { icon: string; title: string; body: string };
type PlanItem = { time: string; title: string; body: string };

const emptyForm: RegistrationForm = { contactName: "", phone: "", childName: "", childDateOfBirth: "" };

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function queryTarget() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return (params.get("id") || params.get("activity") || "little-piner-play").trim();
}

function titleFor(session: CoreSession) {
  return publicSyllabusTitle(session.syllabus.title);
}

function pathLabel(session: CoreSession) {
  const value = `${session.path.code} ${session.path.displayName} ${session.syllabus.title}`.toLowerCase();
  if (value.includes("little")) return "Little Piner";
  if (value.includes("piano") || value.includes("music")) return "PianoHouse";
  return "Artchitect";
}

function fallbackImage(session: CoreSession) {
  const direct = sessionThumbnail(session);
  if (direct) return direct;
  const value = `${session.path.code} ${session.path.displayName} ${session.syllabus.title}`.toLowerCase();
  if (value.includes("little")) return ASSETS.blocks;
  if (value.includes("piano") || value.includes("music")) return ASSETS.piano;
  if (value.includes("clay")) return ASSETS.clay;
  if (value.includes("architect")) return ASSETS.architecture;
  return ASSETS.watercolor;
}

function matchesTarget(session: CoreSession, target: string) {
  const normalized = target.replace(DEMO_PREFIX, "");
  return session.id === target || slugify(titleFor(session)) === slugify(normalized);
}

function outcomes(session: CoreSession): Outcome[] {
  const value = `${pathLabel(session)} ${titleFor(session)}`.toLowerCase();
  if (value.includes("little") || value.includes("play")) {
    return [
      { icon: "▱", title: "Xếp & xây", body: "Dùng khối gỗ để xếp, xây và tạo ý tưởng của riêng mình." },
      { icon: "✦", title: "Thử sai", body: "Thoải mái thử – sai – sửa để hiểu điều gì hiệu quả hơn." },
      { icon: "♧", title: "Chơi cùng bạn", body: "Học cách quan sát, chờ lượt và hợp tác khi cùng chơi." },
      { icon: "◌", title: "Kể lại điều con làm", body: "Kể lại quá trình và niềm vui trong cách của con." },
    ];
  }
  if (value.includes("piano") || value.includes("music")) {
    return [
      { icon: "♪", title: "Nghe & bắt nhịp", body: "Nghe một mẫu ngắn và phản hồi bằng cơ thể hoặc phím đàn." },
      { icon: "✦", title: "Thử giai điệu", body: "Chạm, thử và ghép những âm thanh nhỏ thành câu nhạc." },
      { icon: "♧", title: "Chơi cùng bạn", body: "Chờ lượt, nghe nhau và cùng hoàn thành một thử thách nhỏ." },
      { icon: "◌", title: "Kể lại điều con nghe", body: "Gọi tên cảm giác, nhịp và điều con thích nhất." },
    ];
  }
  return [
    { icon: "◉", title: "Quan sát", body: "Nhìn kỹ chất liệu, màu sắc, hình khối và những chi tiết nhỏ." },
    { icon: "✦", title: "Thử vật liệu", body: "Thử nhiều cách làm trước khi chọn hướng con thích nhất." },
    { icon: "♧", title: "Tạo sản phẩm", body: "Biến ý tưởng thành một sản phẩm nhỏ mang dấu ấn cá nhân." },
    { icon: "◌", title: "Kể câu chuyện", body: "Chia sẻ điều con làm, cách con chọn và điều con khám phá." },
  ];
}

function plan(session: CoreSession): PlanItem[] {
  const start = new Date(session.startsAt);
  const end = new Date(session.endsAt);
  const mins = Math.max(30, Math.round((end.getTime() - start.getTime()) / 60000));
  const steps = [10, Math.max(15, Math.floor((mins - 15) * 0.55)), Math.max(10, mins - 25)];
  const fmt = (d: Date) => new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(d);
  const at = (offset: number) => new Date(start.getTime() + offset * 60000);
  const value = `${pathLabel(session)} ${titleFor(session)}`.toLowerCase();
  if (value.includes("little") || value.includes("play")) {
    return [
      { time: `${fmt(start)} – ${fmt(at(steps[0]))}`, title: "Chào nhau & khởi động", body: "Trò chơi ngắn để con làm quen, khởi động cơ thể và tập trung." },
      { time: `${fmt(at(steps[0]))} – ${fmt(at(steps[0] + steps[1]))}`, title: "Xếp & xây thử thách", body: "Con dùng khối gỗ để xây tháp hoặc cấu trúc đơn giản theo ý tưởng của mình." },
      { time: `${fmt(at(steps[0] + steps[1]))} – ${fmt(at(mins - 5))}`, title: "Thử lại khi tháp đổ", body: "Con quan sát, điều chỉnh và tìm cách mới để công trình vững hơn." },
      { time: `${fmt(at(mins - 5))} – ${fmt(end)}`, title: "Chia sẻ & kết thúc", body: "Con kể lại điều mình làm và điều mình thích trong giờ chơi." },
    ];
  }
  return [
    { time: `${fmt(start)} – ${fmt(at(10))}`, title: "Chào nhau & làm quen", body: "Một khởi động nhẹ để con vào nhịp và hiểu thử thách hôm nay." },
    { time: `${fmt(at(10))} – ${fmt(at(Math.max(25, mins - 20)))}`, title: "Khám phá & trải nghiệm", body: session.syllabus.publicDescription || session.syllabus.shortDescription || "Con thử vật liệu, kỹ thuật và cách làm theo nhịp riêng." },
    { time: `${fmt(at(Math.max(25, mins - 20)))} – ${fmt(at(mins - 5))}`, title: "Hoàn thiện theo cách của con", body: "Con chọn, điều chỉnh và hoàn thiện phần mình muốn giữ lại." },
    { time: `${fmt(at(mins - 5))} – ${fmt(end)}`, title: "Chia sẻ & kết thúc", body: "Cùng nhìn lại điều vừa thử và điều con muốn khám phá lần sau." },
  ];
}

export default function SessionDetailPage() {
  const [status, setStatus] = useState<LoadState>("loading");
  const [session, setSession] = useState<CoreSession | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [demoNotice, setDemoNotice] = useState(false);
  const [form, setForm] = useState<RegistrationForm>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegistrationForm, string>>>({});
  const [submission, setSubmission] = useState<SubmissionState>("idle");
  const [submissionMessage, setSubmissionMessage] = useState("");
  const attemptKey = useRef<string | null>(null);
  const noticeRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    const target = queryTarget();
    try {
      const response = await fetch(SCHEDULE_ENDPOINT, { cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("schedule unavailable");
      const data = await response.json() as ScheduleResponse;
      const realSessions = Array.isArray(data.sessions) ? data.sessions.filter(isCoreSession) : [];
      if (realSessions.length > 0) {
        const found = realSessions.find((item) => matchesTarget(item, target));
        setSession(found || null);
        setUsingFallback(false);
        setStatus(found ? "success" : "error");
        return;
      }
      const fallback = buildOpenStudioFallbackSessions();
      const found = fallback.find((item) => matchesTarget(item, target)) || fallback[0] || null;
      setSession(found);
      setUsingFallback(Boolean(found));
      setStatus(found ? "success" : "error");
    } catch {
      const fallback = buildOpenStudioFallbackSessions();
      const found = fallback.find((item) => matchesTarget(item, target)) || fallback[0] || null;
      setSession(found);
      setUsingFallback(Boolean(found));
      setStatus(found ? "success" : "error");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let cancelled = false;
    fetch(CAPABILITY_ENDPOINT, { cache: "no-store", headers: { Accept: "application/json" } })
      .then(async (response) => response.ok ? response.json() as Promise<{ registrationEnabled?: boolean }> : { registrationEnabled: false })
      .then((data) => { if (!cancelled) setRegistrationEnabled(data.registrationEnabled === true); })
      .catch(() => { if (!cancelled) setRegistrationEnabled(false); });
    return () => { cancelled = true; };
  }, []);

  const canRegister = Boolean(session && registrationEnabled && !usingFallback && !isSessionFull(session));
  const remaining = session?.availability.remainingSeats ?? null;
  const activityOutcomes = useMemo(() => session ? outcomes(session) : [], [session]);
  const activityPlan = useMemo(() => session ? plan(session) : [], [session]);

  const startBooking = () => {
    if (!session) return;
    if (usingFallback) {
      setDemoNotice(true);
      window.setTimeout(() => noticeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
      return;
    }
    if (!registrationEnabled) {
      setDemoNotice(true);
      window.setTimeout(() => noticeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
      return;
    }
    setShowForm(true);
    window.setTimeout(() => document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  };

  const updateForm = (field: keyof RegistrationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    if (submission === "error") setSubmission("idle");
    attemptKey.current = null;
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !canRegister || submission === "pending") return;
    const errors = validateRegistration(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSubmission("error");
      setSubmissionMessage("Ba mẹ vui lòng kiểm tra các thông tin còn thiếu.");
      return;
    }
    const key = createSubmissionAttempt(attemptKey.current, () => crypto.randomUUID());
    attemptKey.current = key;
    setSubmission("pending");
    setSubmissionMessage("");
    try {
      const response = await fetch(REGISTRATION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify(serializeRegistration(session.id, form)),
      });
      const data = await response.json().catch(() => ({})) as { error?: { code?: string } };
      if (!response.ok) {
        const issue = mapRegistrationError(data.error?.code);
        setSubmission("error");
        setSubmissionMessage(issue.message);
        attemptKey.current = null;
        return;
      }
      setSubmission("success");
      attemptKey.current = null;
    } catch {
      setSubmission("error");
      setSubmissionMessage(mapRegistrationError().message);
    }
  };

  if (status === "loading") return <main className="osd-page"><div className="osd-loading">Đang mở hoạt động…</div></main>;
  if (status === "error" || !session) return <main className="osd-page"><Header /><section className="osd-error"><p>OPEN STUDIO</p><h1>Hoạt động này chưa mở.</h1><span>Lịch thật đã được cập nhật nhưng chưa có session tương ứng với đường dẫn này.</span><a href="/open-studio">Xem lịch Open Studio →</a></section></main>;

  const soldOut = isSessionFull(session);
  const hero = fallbackImage(session);
  const title = titleFor(session);
  const path = pathLabel(session);
  const summary = session.syllabus.shortDescription || "Một trải nghiệm nhỏ để con thử, làm và khám phá điều mình tò mò.";

  return (
    <main className="osd-page">
      <Header />

      <div className="osd-shell osd-breadcrumb"><a href="/open-studio">Open Studio</a><span>›</span><span>{title}</span></div>

      <section className="osd-shell osd-hero">
        <div className="osd-hero-copy">
          <span className="osd-path-pill">{path.toUpperCase()}</span>
          <h1>{title}</h1>
          <p className="osd-lede">{summary}</p>
          <div className="osd-meta-pills">
            <span>♙ {formatAgeRange(session.syllabus.ageMin, session.syllabus.ageMax)}</span>
            <span>◷ {formatLocalTimeRange(session.startsAt, session.endsAt)}</span>
            <span>▣ {formatLocalDate(session.startsAt)}</span>
            <span className="is-seats">♧ {soldOut ? "Đã đủ chỗ" : remaining === null ? "Chỗ đang cập nhật" : `Còn ${remaining} chỗ`}</span>
          </div>
          <div className="osd-hero-action">
            <button type="button" onClick={startBooking} disabled={soldOut}>{soldOut ? "Đã đủ chỗ" : "Giữ 1 chỗ miễn phí"}<span>→</span></button>
            <small>✓ Không cần thanh toán</small>
          </div>
        </div>
        <div className="osd-hero-image"><img src={hero} alt={sessionImageAlt(session)} /></div>
      </section>

      <section className="osd-shell osd-main-grid">
        <div className="osd-content-column">
          <article className="osd-panel osd-about">
            <p className="osd-kicker">✦ VỀ HOẠT ĐỘNG</p>
            <h2>Chơi – khám phá – trưởng thành</h2>
            <p>{session.syllabus.publicDescription || summary}</p>
            <div className="osd-outcomes">
              {activityOutcomes.map((item) => <div key={item.title}><i>{item.icon}</i><strong>{item.title}</strong><span>{item.body}</span></div>)}
            </div>
          </article>

          <article className="osd-panel osd-plan">
            <p className="osd-kicker">TRẺ SẼ LÀM GÌ?</p>
            <h2>Một giờ chơi thật ý nghĩa</h2>
            <div className="osd-plan-list">
              {activityPlan.map((item) => <div className="osd-plan-row" key={`${item.time}-${item.title}`}><time>{item.time}</time><i>✦</i><div><strong>{item.title}</strong><span>{item.body}</span></div></div>)}
            </div>
          </article>
        </div>

        <aside className="osd-panel osd-quick">
          <p className="osd-kicker">THÔNG TIN NHANH</p>
          <dl>
            <div><dt>⌖</dt><dd><strong>Địa điểm</strong><span>PINO House · Cần Thơ</span></dd></div>
            <div><dt>♧</dt><dd><strong>Số chỗ còn lại</strong><span>{soldOut ? "Đã đủ chỗ" : remaining === null ? "Đang cập nhật" : `${remaining} chỗ`}</span></dd></div>
            <div><dt>◇</dt><dd><strong>Phí tham gia</strong><span>Miễn phí</span></dd></div>
            <div><dt>♙</dt><dd><strong>Phụ huynh có thể ở cùng</strong><span>Có – quan sát nhẹ, không hỗ trợ trực tiếp</span></dd></div>
            <div><dt>▢</dt><dd><strong>Con cần mang theo</strong><span>Bình nước cá nhân nếu cần</span></dd></div>
            <div><dt>☆</dt><dd><strong>Path</strong><span>{path}</span></dd></div>
            <div><dt>✦</dt><dd><strong>Trải nghiệm phù hợp</strong><span>Cho trẻ tò mò, thích thử và khám phá hoạt động mới</span></dd></div>
          </dl>
          <div className="osd-free-note"><strong>Hoàn toàn miễn phí</strong><span>Open Studio là món quà PINO dành tặng các bé và gia đình.</span></div>
        </aside>
      </section>

      <section className="osd-shell osd-trust-grid">
        <article className="osd-panel osd-mentor">
          <p className="osd-kicker">NGƯỜI ĐỒNG HÀNH</p>
          <div className="osd-mentor-body">
            <div className="osd-mentor-mark"><img src={LOGO_URL} alt="" /></div>
            <div><h3>Mentor tại Open Studio</h3><p>Người đồng hành nhẹ nhàng quan sát, lắng nghe và hỗ trợ khi cần, giúp con cảm thấy an toàn để khám phá theo cách riêng.</p><span>Đồng hành · Tôn trọng · Khuyến khích</span></div>
          </div>
        </article>

        <article className="osd-panel osd-gallery">
          <p className="osd-kicker">KHÔNG KHÍ OPEN STUDIO</p>
          <div className="osd-gallery-grid">
            <img src={ASSETS.courtyard} alt="Không gian PINO House" />
            <img src={ASSETS.architecture} alt="Bàn trải nghiệm Open Studio" />
            <img src={path === "PianoHouse" ? ASSETS.piano : path === "Little Piner" ? ASSETS.blocks : ASSETS.watercolor} alt="Hoạt động tại Open Studio" />
          </div>
          <a href="/open-studio">Xem thêm Open Studio</a>
        </article>
      </section>

      {(demoNotice || showForm || submission === "success") && (
        <section className="osd-shell osd-booking-section" ref={noticeRef} id="booking-form">
          {usingFallback ? (
            <div className="osd-panel osd-demo-notice"><p className="osd-kicker">LỊCH MINH HOẠ</p><h2>UI đã sẵn sàng để test.</h2><p>Đây là dữ liệu mẫu nên hệ thống không gửi đăng ký thật. Khi API có session thật cùng hoạt động, trang sẽ tự dùng dữ liệu thật và form giữ chỗ sẽ được bật theo capability production.</p></div>
          ) : !registrationEnabled ? (
            <div className="osd-panel osd-demo-notice"><p className="osd-kicker">ĐĂNG KÝ TRỰC TUYẾN</p><h2>Sắp mở nhận giữ chỗ.</h2><p>Trang đã có dữ liệu thật nhưng capability đăng ký hiện đang tắt. Ba mẹ có thể quay lại sau hoặc xem các hoạt động khác.</p></div>
          ) : submission === "success" ? (
            <div className="osd-panel osd-demo-notice is-success"><p className="osd-kicker">ĐÃ GHI NHẬN</p><h2>Chỗ của bé đang được xác nhận.</h2><p>PINO sẽ liên hệ qua Zalo để xác nhận ngày giờ và hướng dẫn phần còn lại.</p></div>
          ) : (
            <form className="osd-panel osd-booking-form" onSubmit={submitRegistration}>
              <p className="osd-kicker">GIỮ CHỖ MIỄN PHÍ</p><h2>Chỉ mất khoảng một phút.</h2>
              <div className="osd-fields">
                <label>Ba/mẹ tên gì?<input value={form.contactName} onChange={(e) => updateForm("contactName", e.target.value)} />{fieldErrors.contactName && <small>{fieldErrors.contactName}</small>}</label>
                <label>Số điện thoại Zalo<input inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} />{fieldErrors.phone && <small>{fieldErrors.phone}</small>}</label>
                <label>Tên của bé<input value={form.childName} onChange={(e) => updateForm("childName", e.target.value)} />{fieldErrors.childName && <small>{fieldErrors.childName}</small>}</label>
                <label>Ngày sinh của bé<input type="date" value={form.childDateOfBirth} onChange={(e) => updateForm("childDateOfBirth", e.target.value)} />{fieldErrors.childDateOfBirth && <small>{fieldErrors.childDateOfBirth}</small>}</label>
              </div>
              {submissionMessage && <p className="osd-form-message">{submissionMessage}</p>}
              <button type="submit" disabled={submission === "pending"}>{submission === "pending" ? "Đang ghi nhận…" : "Giữ chỗ cho bé →"}</button>
            </form>
          )}
        </section>
      )}

      <section className="osd-shell osd-faq osd-panel">
        <p className="osd-kicker">CÂU HỎI THƯỜNG GẶP</p>
        <div className="osd-faq-grid">
          <details><summary>Bé cần chuẩn bị gì?</summary><p>Chỉ cần trang phục thoải mái và bình nước cá nhân nếu bé cần.</p></details>
          <details><summary>Nếu bé chưa quen môi trường mới thì sao?</summary><p>Mentor sẽ cho bé thời gian quan sát và làm quen trước khi tham gia; không ép bé nhập cuộc ngay.</p></details>
          <details><summary>Phụ huynh có thể ở lại không?</summary><p>Có. Phụ huynh có thể quan sát nhẹ nhàng để bé vẫn có không gian tự khám phá.</p></details>
          <details><summary>Open Studio có diễn ra hằng tuần không?</summary><p>Lịch hoạt động được cập nhật theo tuần tại trang Open Studio.</p></details>
        </div>
      </section>

      <section className="osd-shell osd-final-cta" style={{ backgroundImage: `linear-gradient(90deg,rgba(156,53,24,.95),rgba(169,57,25,.86)),url(${ASSETS.gate})` }}>
        <img src={ASSETS.leavesOne} alt="" aria-hidden="true" />
        <img src={ASSETS.leavesTwo} alt="" aria-hidden="true" />
        <h2>Giữ chỗ cho {title}</h2>
        <p>{soldOut ? "Buổi này đã đủ chỗ — xem thêm hoạt động khác tại Open Studio." : remaining === null ? "Một trải nghiệm nhỏ để con có thêm điều mới để kể." : `Còn ${remaining} chỗ — giữ một chỗ miễn phí cho bé.`}</p>
        {soldOut ? <a href="/open-studio">Xem hoạt động khác →</a> : <button type="button" onClick={startBooking}>Giữ 1 chỗ miễn phí <span>→</span></button>}
      </section>

      <Footer />

      {!soldOut && submission !== "success" && <div className="osd-mobile-bar"><div><small>MIỄN PHÍ</small><strong>{remaining === null ? "Chỗ đang cập nhật" : `Còn ${remaining} chỗ`}</strong></div><button type="button" onClick={startBooking}>Giữ chỗ</button></div>}
    </main>
  );
}

function Header() {
  return <header className="osd-header"><nav className="osd-shell"><a className="osd-brand" href="/"><img src={LOGO_URL} alt="" /><span>PINO House</span></a><div><a href="/open-studio">Open Studio</a><a href="/">Về PINO House</a></div></nav></header>;
}

function Footer() {
  return <footer className="osd-footer"><div className="osd-shell"><div className="osd-footer-brand"><a className="osd-brand" href="/"><img src={LOGO_URL} alt="" /><span>PINO House</span></a><p>Art. Music. Creative Growth.</p><small>pinohouse.art</small></div><div><strong>Explore</strong><a href="/">House</a><a href="/#paths">Paths</a><a href="/open-studio">Open Studio</a></div><div><strong>About</strong><a href="/">Our Story</a><a href="/#journey">Journey</a></div><div><strong>Information</strong><a href="/">Visit</a><a href="#faq">FAQs</a></div><div><strong>Stay connected</strong><p>Nhận tin về Open Studio và các trải nghiệm đặc biệt tại PINO House.</p></div></div><small className="osd-copy">© {new Date().getFullYear()} PINO House. All rights reserved.</small></footer>;
}
