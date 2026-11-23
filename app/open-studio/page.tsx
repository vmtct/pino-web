"use client";
import RegistrationInterest from "../registration-interest";

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
  localDateKey,
  mapRegistrationError,
  publicSyllabusTitle,
  registrationSuccessBody,
  registrationSuccessTitle,
  serializeRegistration,
  sessionImageAlt,
  sessionThumbnail,
  validateRegistration,
} from "../../lib/open-studio-funnel";
import { useLocale } from "../localization";
import { CmsText } from "../cms-hydrator";

import "./page.css";
import OpenStudioM1Review from "./m1-review";

const SCHEDULE_ENDPOINT = "/api/pino-core/open-studio/sessions";
const CAPABILITY_ENDPOINT = "/api/pino-core/open-studio/capabilities";
const REGISTRATION_ENDPOINT = "/api/pino-core/open-studio/registrations";
const ASSET_BASE = "https://assets.pinohouse.art/site/OpenStudio";

const ASSETS = {
  hero: `${ASSET_BASE}/Revise/Seashell%20Art%20in%20the%20Cozy%20Studio.png`,
  piano: `${ASSET_BASE}/Revise/Child%E2%80%99s%20Hands%20at%20the%20Piano-3.png`,
  blocks: `${ASSET_BASE}/children-building-wooden-blocks.png`,
  watercolor: `${ASSET_BASE}/Revise/Child%20Painting%20a%20Whimsical%20Cat%20Scene-2.png`,
  acrylicCover: `${ASSET_BASE}/Revise/Young%20Artist%20Painting%20Anime%20Portrait.png`,
  clay: `${ASSET_BASE}/Revise/Child%20Creating%20a%20Colorful%20Collage-1.png`,
  dance: `${ASSET_BASE}/children-dance-class.png`,
  architecture: `${ASSET_BASE}/architectural-model-and-sketchbook.png`,
  gate: `${ASSET_BASE}/garden-archway-entrance.png`,
  leavesOne: `${ASSET_BASE}/glowing-autumn-leaves-v1.png`,
  leavesTwo: `${ASSET_BASE}/glowing-autumn-leaves-v2.png`,
  promo: `${ASSET_BASE}/Revise/Pastel%20Artist%E2%80%99s%20Desk%20with%20Books%20and%20Brushes.png`,
  littlePiner: `${ASSET_BASE}/Revise/Watercolor%20Mushroom%20Garden%20with%20Butterfly.png`,
  artchitect: `${ASSET_BASE}/Revise/Watercolor%20Mountain%20Landscape%20Easel.png`,
  pianoHouse: `${ASSET_BASE}/Revise/Watercolor%20Piano%20with%20Butterfly%20and%20Foliage.png`,
};

const LOGO_URL = "https://assets.pinohouse.art/core/Pino%20Sigil.png";
const FALLBACK_ACTIVITY_IMAGES = [ASSETS.blocks, ASSETS.piano, ASSETS.watercolor, ASSETS.clay, ASSETS.dance];

type ScheduleResponse = { sessions: CoreSession[] };
type ScheduleStatus = "loading" | "success" | "error";
type SubmissionState = "idle" | "pending" | "success" | "error";
type PathFilter = "all" | "PianoHouse" | "Artchitect" | "Little Piner";

const emptyForm: RegistrationForm = { contactName: "", phone: "", childName: "", childDateOfBirth: "" };

const COPY = {
  vi: {
    hero: "Khám phá, sáng tạo và lớn lên — mỗi tuần tại PINO House.", heroLink: "Xem lịch tuần này", heroAlt: "Khoảng sân và ngôi nhà sáng tạo của PINO House",
    upNext: "SẮP TỚI TẠI PINO", demoSchedule: "LỊCH MINH HOẠ", loading: "Đang mở lịch Open Studio…", loadError: "Lịch đang tạm nghỉ một chút.", retry: "Thử tải lại", noSchedule: "Lịch mới đang được chuẩn bị.", checkBack: "Hãy quay lại sau để xem buổi Open Studio gần nhất.",
    fallbackDescription: "Một buổi trải nghiệm nhẹ nhàng để con thử, làm và khám phá điều mình tò mò.", seatsLeft: "Chỗ còn lại", full: "Đã đủ chỗ", time: "Thời gian", registerNow: "Đăng ký ngay", detail: "Xem chi tiết",
    schedule: "LỊCH OPEN STUDIO", demoData: "DỮ LIỆU MẪU", filterDate: "Lọc theo ngày", all: "Tất cả", filterPath: "Lọc theo lộ trình", noFiltered: "Chưa có buổi phù hợp với bộ lọc này.", seatsRemaining: "chỗ còn lại", available: "Còn chỗ", fullShort: "Đã đủ", vietnamTime: "Giờ Việt Nam",
    exploreHeading: "Con sẽ khám phá", demoTitle: "Đây là lịch minh hoạ", demoCopy: "Các buổi mẫu đang dùng asset thật để kiểm thử UI/UX. Khi API trả về ít nhất một session thật, toàn bộ lịch minh hoạ sẽ tự động được thay thế.", registrationSoon: "Đăng ký trực tuyến sắp mở", registrationSoonCopy: "Ba mẹ vẫn có thể xem lịch. PINO sẽ mở nhận đăng ký khi hệ thống sẵn sàng.", registerSession: "Đăng ký buổi này",
    familyInfo: "Thông tin gia đình", familyInfoCopy: "PINO sẽ liên hệ để xác nhận chỗ. Một đăng ký dành cho một bé.", parentName: "Họ tên phụ huynh", phone: "Số điện thoại", childName: "Tên của con", childBirth: "Ngày sinh của con", missing: "Ba mẹ vui lòng kiểm tra các thông tin còn thiếu.", sending: "Đang gửi…", submit: "Gửi đăng ký",
    weekAtPino: "TUẦN NÀY TẠI PINO", architectureCopy: "Trẻ quan sát, phác thảo và biến ý tưởng không gian thành mô hình bằng đôi tay của mình.", viewSchedule: "Xem lịch", how: "OPEN STUDIO HOẠT ĐỘNG THẾ NÀO", choose: "Chọn một buổi", reserve: "Giữ chỗ", arrive: "Đến và tận hưởng", tryExplore: "Thử & khám phá",
    forWho: "DÀNH CHO AI", who: ["Trẻ 3–12 tuổi", "Những bạn nhỏ tò mò và thích thử", "Phụ huynh muốn quan sát con tự nhiên", "Không cần kinh nghiệm trước"],
    faq: [["Cần đăng ký trước bao lâu?", "Nên chọn buổi ngay khi lịch mở vì mỗi buổi có số chỗ giới hạn."], ["Con cần mang theo gì?", "PINO chuẩn bị vật liệu và dụng cụ cần thiết. Gia đình chỉ cần đến đúng giờ và mặc đồ thoải mái."], ["Phụ huynh có thể ở lại không?", "Tùy trải nghiệm và độ tuổi. Mentor sẽ hướng dẫn khi PINO xác nhận buổi tham gia."], ["Có chỗ đậu xe không?", "Có. PINO sẽ gửi hướng dẫn cụ thể khi xác nhận đăng ký."]],
    finalTitle: "Sẵn sàng khám phá hôm nay?", finalCopy: "Mỗi buổi chỉ có một số chỗ nhỏ — chọn một trải nghiệm và cùng con tạo nên một buổi chiều đáng nhớ.", finalButton: "Khám phá Open Studio", stay: "Nhận tin về Open Studio và các trải nghiệm đặc biệt tại PINO House.",
  },
  en: {
    hero: "Explore, create and grow — every week at PINO House.", heroLink: "See this week's schedule", heroAlt: "The PINO House creative courtyard",
    upNext: "UP NEXT AT PINO", demoSchedule: "DEMO SCHEDULE", loading: "Opening the Open Studio schedule…", loadError: "The schedule is taking a short break.", retry: "Try again", noSchedule: "A new schedule is being prepared.", checkBack: "Check back soon for the next Open Studio session.",
    fallbackDescription: "A gentle session to try, make and discover something your child is curious about.", seatsLeft: "Seats left", full: "Full", time: "Time", registerNow: "Register now", detail: "View details",
    schedule: "OPEN STUDIO SCHEDULE", demoData: "DEMO DATA", filterDate: "Filter by date", all: "All", filterPath: "Filter by path", noFiltered: "No sessions match these filters yet.", seatsRemaining: "seats left", available: "Available", fullShort: "Full", vietnamTime: "Vietnam time",
    exploreHeading: "What your child will explore", demoTitle: "This is a demo schedule", demoCopy: "These sample sessions use real assets to validate the experience. As soon as the API returns a real session, the demo schedule is replaced automatically.", registrationSoon: "Online registration is opening soon", registrationSoonCopy: "You can still browse the schedule. PINO will open registrations when the system is ready.", registerSession: "Register for this session",
    familyInfo: "Family information", familyInfoCopy: "PINO will contact you to confirm the place. One registration is for one child.", parentName: "Parent / guardian name", phone: "Phone number", childName: "Child's name", childBirth: "Child's date of birth", missing: "Please check the missing information above.", sending: "Sending…", submit: "Send registration",
    weekAtPino: "THIS WEEK AT PINO", architectureCopy: "Children observe, sketch and turn a spatial idea into a model with their own hands.", viewSchedule: "View schedule", how: "HOW OPEN STUDIO WORKS", choose: "Choose a session", reserve: "Reserve a place", arrive: "Come and enjoy", tryExplore: "Try & explore",
    forWho: "WHO IT'S FOR", who: ["Children ages 3–12", "Curious children who enjoy trying new things", "Parents who want to observe their child naturally", "No prior experience required"],
    faq: [["How early should we register?", "Choose a session when the schedule opens because places are limited."], ["What should my child bring?", "PINO prepares the materials and tools. Just arrive on time in comfortable clothes."], ["Can parents stay?", "It depends on the experience and age. A mentor will guide you when PINO confirms the session."], ["Is parking available?", "Yes. PINO will share practical directions when the registration is confirmed."]],
    finalTitle: "Ready to explore today?", finalCopy: "Each session has only a few places — choose an experience and make the afternoon memorable together.", finalButton: "Explore Open Studio", stay: "Get news about Open Studio and special experiences at PINO House.",
  },
} as const;

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

function compactDate(iso: string, locale: "vi" | "en") {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
    day: "2-digit",
    month: locale === "vi" ? "2-digit" : "short",
  }).format(new Date(iso));
}

function OpenStudioNav({ locale }: { locale: "vi" | "en" }) {
  const en = locale === "en";
  return (
    <header className="os-site-header" id="top">
      <nav className="os-nav os-shell" aria-label={en ? "Primary navigation" : "Điều hướng chính"}>
        <a className="os-brand" href="/" aria-label={en ? "PINO House home" : "PINO House — trang chủ"}><img src={LOGO_URL} alt="" aria-hidden="true" /><span>PINO House</span></a>
        <div className="os-nav-links"><a href="/">{en ? "House" : "Trang chủ"}</a><a href="/#paths">{en ? "Paths" : "Lộ trình"}</a><a className="is-active" href="/open-studio">Open Studio</a><a href="/#journey">Journey</a><a href="/#why-pino">{en ? "About" : "Về PINO"}</a></div>
        <a className="os-top-cta" href="#sessions">{en ? "Explore Open Studio" : "Khám phá Open Studio"} <span>→</span></a>
      </nav>
    </header>
  );
}

export default function OpenStudioPage() {
  const { locale } = useLocale();
  const t = COPY[locale];
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
  const detailRef = useRef<HTMLDialogElement>(null);
  const returnFocus=useRef<HTMLElement|null>(null);
  useEffect(()=>{if(selectedId&&detailRef.current&&!detailRef.current.open)detailRef.current.showModal()},[selectedId]);

  const loadSessions = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch(SCHEDULE_ENDPOINT, { cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Schedule request failed (${response.status})`);
      const data = await response.json() as ScheduleResponse;
      if (!data || !Array.isArray(data.sessions)) throw new Error("Invalid schedule response");
      const realSessions = data.sessions.filter(isCoreSession).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      setSessions(realSessions);
      setStatus("success");
    } catch {
      setSessions([]);
      setStatus("error");
    }
  }, [locale]);

  useEffect(() => { void loadSessions(); }, [loadSessions]);
  useEffect(() => {
    let cancelled = false;
    fetch(CAPABILITY_ENDPOINT, { cache: "no-store", headers: { Accept: "application/json" } })
      .then(async (response) => response.ok ? response.json() as Promise<{ registrationEnabled?: boolean }> : { registrationEnabled: false })
      .then((data) => { if (!cancelled) setRegistrationEnabled(data.registrationEnabled === true); })
      .catch(() => { if (!cancelled) setRegistrationEnabled(false); });
    return () => { cancelled = true; };
  }, []);

  const usingFallback = false;
  const canRegister = registrationEnabled;
  const selectedSession = sessions.find((session) => session.id === selectedId) || null;
  const featuredSession = useMemo(() => sessions.find((session) => !isSessionFull(session)) || sessions[0] || null, [sessions]);
  const visibleSessions = sessions;

  const selectSession = (session: CoreSession, openForm = false) => {
    if (isSessionFull(session)) return;
    returnFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null; setSelectedId(session.id); setShowForm(openForm && canRegister); setSubmission("idle"); setSubmissionMessage(""); setForm(emptyForm); setFieldErrors({}); attemptKey.current = null;
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
    if (!selectedSession || !canRegister || submission === "pending" || submissionInFlight.current) return;
    const errors = validateRegistration(form, locale);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) { setSubmission("error"); setSubmissionMessage(t.missing); return; }
    const key = createSubmissionAttempt(attemptKey.current, () => crypto.randomUUID());
    attemptKey.current = key; submissionInFlight.current = true; setSubmission("pending"); setSubmissionMessage("");
    try {
      const response = await fetch(REGISTRATION_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify(serializeRegistration(selectedSession.id, form)) });
      const data = await response.json().catch(() => ({})) as { error?: { code?: string } };
      if (!response.ok) {
        const issue = mapRegistrationError(data.error?.code, locale);
        setSubmission("error"); setSubmissionMessage(issue.message); attemptKey.current = null; submissionInFlight.current = false;
        if (issue.refreshSchedule) void loadSessions();
        return;
      }
      setSubmission("success"); attemptKey.current = null; submissionInFlight.current = false;
    } catch {
      const issue = mapRegistrationError(undefined, locale);
      setSubmission("error"); setSubmissionMessage(issue.message); submissionInFlight.current = false;
    }
  };

  return (
    <main className="open-studio-page">
      <OpenStudioNav locale={locale} />

      <section className="os-new-hero os-shell"><div><p className="os-kicker">PINO AFTERSCHOOL / OPEN STUDIO</p><h1>{locale==="vi"?"Buổi tối không chỉ để khép lại một ngày.":"An evening is more than the end of a day."}</h1><p>{locale==="vi"?"Một không gian mở, nơi con khám phá nghệ thuật và âm nhạc theo cách riêng.":"An open space to explore art and music in your own way."}</p><strong>{locale==="vi"?"2 buổi miễn phí mỗi tháng.":"2 free sessions every month."}</strong><div className="os-new-actions"><a href="#sessions">{locale==="vi"?"Đặt chỗ cho con":"Reserve a place"} →</a><a href="#activities">{locale==="vi"?"Khám phá không gian":"Explore the studio"}</a></div></div><img src={ASSETS.hero} alt={t.heroAlt}/></section>
<section className="os-new-section os-shell os-value"><h2>{locale==="vi"?"Thêm lựa chọn cho con sau giờ học.":"More ways to spend the afternoon."}</h2><p>{locale==="vi"?"Thay vì chỉ xem màn hình hay quanh quẩn ở nhà, con có thể dành buổi chiều để vẽ tranh, khám phá chất liệu và thử chơi piano.":"Instead of another afternoon on screens or at home, children can paint, explore materials and try the piano."}</p><p>{locale==="vi"?"Tại Trạm Nghệ Thuật Mở, con được tự chọn hoạt động, sáng tạo theo sở thích và làm quen với những trải nghiệm mới mỗi lần ghé đến.":"At Open Studio, children choose activities, create at their own pace and discover something new each visit."}</p></section><section id="activities" className="os-new-section os-shell"><h2>{locale==="vi"?"Hôm nay con muốn làm gì?":"What would you like to make today?"}</h2><div className="os-new-grid">{[[ASSETS.clay,"Đa chất liệu","Mixed media","Khám phá bằng đôi tay, với giấy, đất nặn và vật liệu sáng tạo.","Explore paper, clay and creative materials."],[ASSETS.acrylicCover,"Chất liệu & Nhân vật","Materials & Characters","Tự do thể hiện ý tưởng qua sắc màu, họa cụ và sáng tạo nhân vật.","Express your ideas through colour."],[ASSETS.piano,"Piano nền tảng","Foundational piano","Làm quen phím đàn, nhịp điệu và âm thanh.","Discover keys, rhythm and sound."]].map(([src,vi,en,dv,de])=><article key={en}><img src={src} alt="" loading="lazy"/><div><h3>{locale==="vi"?vi:en}</h3><p>{locale==="vi"?dv:de}</p><a className="os-activity-register" href="#register" data-registration-branch={src===ASSETS.piano?"pianohouse":src===ASSETS.acrylicCover?"artchitect":"little-piner"}>{locale==="vi"?"Đăng ký tham gia":"Register for a session"} →</a></div></article>)}</div></section>
<section className="os-new-section os-shell"><h2>{locale==="vi"?"Một buổi tại Open Studio":"A visit to Open Studio"}</h2><div className="os-new-steps">{(locale==="vi"?["Đến trạm","Chọn hoạt động","Tự do sáng tạo","Mang về niềm vui"]:["Arrive","Choose an activity","Create freely","Take joy home"]).map((step,i)=><div key={step}><b>0{i+1}</b><h3>{step}</h3></div>)}</div><p>{locale==="vi"?"Mentor hỗ trợ khi con cần và gợi mở khi con chưa có ý tưởng.":"Mentors offer support and inspiration whenever needed."}</p></section>
<section className="os-new-studio os-shell" aria-label="PINO House creative studio"><img src={ASSETS.watercolor} alt="Góc sáng tạo nghệ thuật tại PINO House" loading="lazy"/></section><section className="os-new-section os-shell os-new-free"><h2>{locale==="vi"?"Một thói quen sáng tạo mỗi tháng":"A creative habit every month"}</h2><strong>{locale==="vi"?"2 buổi miễn phí*":"2 free sessions*"}</strong><p>{locale==="vi"?"Một khoảng thời gian dành riêng cho nghệ thuật và âm nhạc.":"Time set aside for art and music."}</p><div className="os-new-actions"><a href="#sessions">{locale==="vi"?"Đặt chỗ tại Open Studio":"Reserve a place"} →</a></div><small>{locale==="vi"?"* Các buổi tiếp theo: 199.000đ/buổi.":"* Additional sessions: 199,000 VND per session."}</small></section>
<section className="os-main os-shell" id="sessions" aria-labelledby="sessions-title">
        <OpenStudioM1Review/>
        <div className="os-featured-panel">
          <p className="os-kicker">✦ <CmsText contentKey="os_v2_up_next_label" fallback={t.upNext} />{usingFallback ? ` · ${t.demoSchedule}` : ""}</p>
          {status === "loading" ? <div className="os-featured-loading">{t.loading}</div> : null}
          {status === "error" ? <div className="os-featured-error"><strong>{t.loadError}</strong><button type="button" onClick={() => void loadSessions()}>{t.retry}</button></div> : null}
          {status === "success" && !featuredSession ? <div className="os-featured-error"><strong>{t.noSchedule}</strong><span>{t.checkBack}</span></div> : null}
          {status === "success" && featuredSession ? <div className="os-featured-grid">
            <img className="os-featured-image" src={activityImage(featuredSession)} alt={sessionImageAlt(featuredSession)} />
            <div className="os-featured-copy"><span className="os-time-label">{formatLocalTimeRange(featuredSession.startsAt, featuredSession.endsAt, locale)}</span><h2 id="sessions-title">{publicSyllabusTitle(featuredSession.syllabus.title)}</h2><div className="os-pills"><span>{formatAgeRange(featuredSession.syllabus.ageMin, featuredSession.syllabus.ageMax, locale)}</span><span>{pathLabel(featuredSession)}</span></div><p>{featuredSession.syllabus.shortDescription || t.fallbackDescription}</p></div>
            <div className="os-featured-meta"><dl><div><dt>Path</dt><dd>{pathLabel(featuredSession)}</dd></div><div><dt>{t.seatsLeft}</dt><dd>{isSessionFull(featuredSession) ? t.full : featuredSession.availability.remainingSeats ?? t.available}</dd></div><div><dt>{t.time}</dt><dd>{formatLocalDate(featuredSession.startsAt, locale)}</dd></div></dl><button className="os-book-button" type="button" disabled={isSessionFull(featuredSession)} onClick={() => selectSession(featuredSession, true)}>{isSessionFull(featuredSession) ? t.full : t.registerNow}<span>→</span></button><button className="os-detail-link" type="button" disabled={isSessionFull(featuredSession)} onClick={() => selectSession(featuredSession)}>{t.detail}</button></div>
          </div> : null}
        </div>

        {status === "loading" ? <div className="os-card-grid os-skeleton-grid">{[0, 1, 2, 3, 4, 5].map((item) => <div className="os-session-card os-skeleton-card" key={item}><span /><i /><i /><i /></div>)}</div> : null}
        {status === "success" && visibleSessions.length === 0 ? <div className="os-empty">{t.noFiltered}</div> : null}
        {status === "success" && visibleSessions.length > 0 ? <div className="os-card-grid">{visibleSessions.slice(0, 9).map((session, index) => { const full = isSessionFull(session); return <article className={`os-session-card${selectedId === session.id ? " is-selected" : ""}`} key={session.id}><img src={activityImage(session, index)} alt={sessionImageAlt(session)} /><div className="os-session-body"><span className="os-time-label">{formatLocalTimeRange(session.startsAt, session.endsAt, locale)}</span><h3>{publicSyllabusTitle(session.syllabus.title)}</h3><div className="os-pills"><span>{formatAgeRange(session.syllabus.ageMin, session.syllabus.ageMax, locale)}</span><span>{pathLabel(session)}</span></div><div className="os-session-bottom"><strong className={typeof session.availability.remainingSeats === "number" && session.availability.remainingSeats <= 3 ? "is-low" : ""}>{full ? t.full : session.availability.remainingSeats === null ? t.available : `${session.availability.remainingSeats} ${t.seatsRemaining}`}</strong><button type="button" disabled={full} onClick={() => selectSession(session)}>{full ? t.fullShort : t.detail}<span>{full ? "" : "→"}</span></button></div></div></article>; })}</div> : null}

        {selectedSession ? <dialog className="os-session-detail os-session-modal" ref={detailRef} tabIndex={-1} aria-labelledby="session-detail-title" onClose={()=>{if(submissionInFlight.current)return;setSelectedId(null);setShowForm(false);requestAnimationFrame(()=>returnFocus.current?.focus())}} onCancel={e=>{if(submissionInFlight.current)e.preventDefault()}}><button className="os-modal-close" type="button" aria-label={locale==="vi"?"Đóng":"Close"} disabled={submission==="pending"} onClick={()=>detailRef.current?.close()}>×</button>
          <img src={activityImage(selectedSession)} alt={sessionImageAlt(selectedSession)} />
          <div className="os-session-detail-copy"><p className="os-kicker">{pathLabel(selectedSession)} · {formatAgeRange(selectedSession.syllabus.ageMin, selectedSession.syllabus.ageMax, locale)}</p><h2 id="session-detail-title">{publicSyllabusTitle(selectedSession.syllabus.title)}</h2><p className="os-detail-date">{formatLocalDate(selectedSession.startsAt, locale)} · {formatLocalTimeRange(selectedSession.startsAt, selectedSession.endsAt, locale)} · {t.vietnamTime}</p>{selectedSession.syllabus.publicDescription ? <p>{selectedSession.syllabus.publicDescription}</p> : null}{selectedSession.syllabus.skillSummary ? <div className="os-detail-note"><strong>{t.exploreHeading}</strong><p>{selectedSession.syllabus.skillSummary}</p></div> : null}
          {usingFallback ? <div className="os-registration-notice"><strong>{t.demoTitle}</strong><p>{t.demoCopy}</p></div> : null}
          {!usingFallback && !registrationEnabled ? <div className="os-registration-notice"><strong>{t.registrationSoon}</strong><p>{t.registrationSoonCopy}</p></div> : null}
          {canRegister && !showForm && submission !== "success" ? <button className="os-book-button" type="button" onClick={() => setShowForm(true)}>{t.registerSession} <span>→</span></button> : null}
          {canRegister && showForm && submission !== "success" ? <form className="os-registration-form" onSubmit={submitRegistration} noValidate><h3>{t.familyInfo}</h3><p>{t.familyInfoCopy}</p><label>{t.parentName}<input name="contactName" autoComplete="name" value={form.contactName} onChange={(event) => updateForm("contactName", event.target.value)} aria-invalid={Boolean(fieldErrors.contactName)} />{fieldErrors.contactName ? <small>{fieldErrors.contactName}</small> : null}</label><label>{t.phone}<input name="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} aria-invalid={Boolean(fieldErrors.phone)} />{fieldErrors.phone ? <small>{fieldErrors.phone}</small> : null}</label><label>{t.childName}<input name="childName" autoComplete="off" value={form.childName} onChange={(event) => updateForm("childName", event.target.value)} aria-invalid={Boolean(fieldErrors.childName)} />{fieldErrors.childName ? <small>{fieldErrors.childName}</small> : null}</label><label>{t.childBirth}<input name="childDateOfBirth" type="date" value={form.childDateOfBirth} onChange={(event) => updateForm("childDateOfBirth", event.target.value)} aria-invalid={Boolean(fieldErrors.childDateOfBirth)} />{fieldErrors.childDateOfBirth ? <small>{fieldErrors.childDateOfBirth}</small> : null}</label>{submission === "error" ? <p className="os-submit-error" role="alert">{submissionMessage}</p> : null}<button className="os-book-button" type="submit" disabled={submission === "pending"}>{submission === "pending" ? t.sending : t.submit}<span>→</span></button></form> : null}
          {canRegister && submission === "success" ? <div className="os-registration-success" role="status"><span>✓</span><div><strong>{registrationSuccessTitle(locale)}</strong><p>{registrationSuccessBody(locale)}</p></div></div> : null}</div>
        </dialog> : null}
      </section>

      <section className="os-new-section os-shell"><h2>{locale==="vi"?"Khi con tìm thấy điều mình thích":"When your child finds what they love"}</h2><div className="os-new-grid">{[["Little Piner","little-piner","Mầm sáng tạo",ASSETS.littlePiner],["Artchitect","artchitect","Mỹ thuật sáng tạo",ASSETS.artchitect],["PianoHouse","pianohouse","Piano nghệ thuật",ASSETS.pianoHouse]].map(([name,path,vi])=><a className="os-new-path" key={path} href={"/"+path} data-path={path}><img className="os-new-path-visual" src={path === "little-piner" ? ASSETS.littlePiner : path === "artchitect" ? ASSETS.artchitect : ASSETS.pianoHouse} alt="" loading="lazy"/><span className="os-path-age">{locale==="vi"?(path==="little-piner"?"3–6 tuổi":"7+ tuổi"):(path==="little-piner"?"Ages 3–6":"Ages 7+")}</span><h3>{name}</h3><p>{locale==="vi"?vi:"Explore the journey"} →</p></a>)}</div></section>
<div className="os-shell os-registration-interest"><RegistrationInterest openStudio/></div><section className="os-faq os-shell" aria-labelledby="faq-title"><h2 id="faq-title">FAQ</h2><div>{t.faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>

      <section className="os-final-cta os-shell"><img className="os-final-bg" src={ASSETS.gate} alt="" aria-hidden="true" /><img className="os-final-leaves os-final-leaves-left" src={ASSETS.leavesOne} alt="" aria-hidden="true" /><img className="os-final-leaves os-final-leaves-right" src={ASSETS.leavesTwo} alt="" aria-hidden="true" /><div><h2><CmsText contentKey="os_v2_final_title" fallback={t.finalTitle} /></h2><p><CmsText contentKey="os_v2_final_description" fallback={t.finalCopy} /></p><a className="os-final-button" href="#sessions"><CmsText contentKey="os_v2_final_cta" fallback={t.finalButton} /> <span>→</span></a></div></section>

      <footer className="os-footer os-shell"><div className="os-footer-brand"><a className="os-brand" href="/"><img src={LOGO_URL} alt="" aria-hidden="true" /><span>PINO House</span></a><p>{locale === "vi" ? "Nghệ thuật. Âm nhạc. Lớn lên sáng tạo." : "Art. Music. Creative Growth."}</p><small>pinohouse.art</small></div><div><strong>{locale === "vi" ? "Khám phá" : "Explore"}</strong><a href="/">{locale === "vi" ? "Trang chủ" : "House"}</a><a href="/#paths">{locale === "vi" ? "Lộ trình" : "Paths"}</a><a href="/open-studio">Open Studio</a></div><div><strong>{locale === "vi" ? "Về PINO" : "About"}</strong><a href="/#why-pino">{locale === "vi" ? "Câu chuyện PINO" : "Our Story"}</a><a href="/#journey">Journey</a></div><div><strong>{locale === "vi" ? "Thông tin" : "Information"}</strong><a href="#sessions">{locale === "vi" ? "Đến thăm" : "Visit"}</a><a href="#faq-title">FAQs</a></div><div><strong>{locale === "vi" ? "Kết nối" : "Stay connected"}</strong><p>{t.stay}</p></div><span className="os-copyright">© {new Date().getFullYear()} PINO House. {locale === "vi" ? "Đã đăng ký bản quyền." : "All rights reserved."}</span></footer>
    </main>
  );
}
