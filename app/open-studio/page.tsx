"use client";

import { useEffect, useMemo, useState } from "react";

type Session = { id: string; topic: string; type: string; path: string | null; date: string | null; availableSeats: number | null; capacity: number | null; confirmedCount: number; cover: string | null; avatar: string | null };

const SESSIONS_API = "/api/os-sessions";
const RECENT_PAST_DAYS = 7;

function parseSessionDate(value: string | null) { if (!value) return null; const normalized = value.length === 10 ? `${value}T23:59:59+07:00` : value; const date = new Date(normalized); return Number.isNaN(date.getTime()) ? null : date; }
function formatSessionDate(value: string | null) { const date = parseSessionDate(value); if (!date) return "Ngày đang cập nhật"; return new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "numeric", month: "numeric", hour: value && value.length > 10 ? "2-digit" : undefined, minute: value && value.length > 10 ? "2-digit" : undefined, timeZone: "Asia/Ho_Chi_Minh" }).format(date); }

export default function OpenStudioPage() {
  const [sessions, setSessions] = useState<Session[]>([]); const [sessionLoading, setSessionLoading] = useState(true); const [sessionError, setSessionError] = useState(false);
  useEffect(() => { let active = true; setSessionLoading(true); setSessionError(false); fetch(SESSIONS_API).then(r => { if (!r.ok) throw new Error(`Session API returned ${r.status}`); return r.json(); }).then(data => { if (active) setSessions(Array.isArray(data.sessions) ? data.sessions.filter((session: Session) => session.type === "Open Studio") : []); }).catch(() => { if (active) { setSessions([]); setSessionError(true); } }).finally(() => { if (active) setSessionLoading(false); }); return () => { active = false; }; }, []);
  const { upcomingSessions, recentPastSessions } = useMemo(() => {
    const now = Date.now();
    const cutoff = now - RECENT_PAST_DAYS * 24 * 60 * 60 * 1000;
    const dated = sessions.map(session => ({ session, time: parseSessionDate(session.date)?.getTime() || 0 })).filter(item => item.time > 0);
    return {
      upcomingSessions: dated.filter(item => item.time >= now).sort((a, b) => a.time - b.time).slice(0, 6).map(item => item.session),
      recentPastSessions: dated.filter(item => item.time < now && item.time >= cutoff).sort((a, b) => b.time - a.time).map(item => item.session),
    };
  }, [sessions]);
  return <main className="intake-page open-studio-landing">
    <nav className="nav shell"><a className="wordmark" href="/">PINO<span>•</span></a><div className="nav-links"><a href="#sessions">Các buổi đang có</a><a href="#how">Cách hoạt động</a></div><a className="nav-cta" href="#sessions">Chọn buổi cho con →</a></nav>
    <section className="os-ad-hero shell"><div className="hero-copy"><p className="eyebrow">PINO OPEN STUDIO · 1 BUỔI KHÁM PHÁ</p><h1>Nếu hôm nay con <em>được tự chọn?</em></h1><p className="hero-lede">Một buổi chiều để con vẽ, chơi nhạc và khám phá điều mình thích. Không thêm áp lực. Chỉ là một khoảng thời gian thật sự của riêng con.</p><div className="hero-actions"><a className="button button-dark" href="#sessions">Chọn một buổi cho con →</a><a className="text-link" href="#how">Open Studio là gì?</a></div><div className="hero-proof"><span>ART</span><i>·</i><span>PIANO</span><i>·</i><span>LITTLE PINER</span><i>·</i><span>3–15 TUỔI</span></div></div><div className="hero-art os-hero-art" aria-hidden="true"><div className="orb orb-a" /><div className="orb orb-b" /><div className="orb orb-c" /><div className="scribble">✦</div><div className="art-note"><strong>make</strong><br />something today.</div></div></section>
    <section className="statement"><div className="statement-inner shell"><p className="eyebrow">KHÔNG PHẢI THÊM MỘT LỚP HỌC</p><h2>Một buổi chiều để con <em>tự mình khám phá.</em></h2><p>Open Studio là khoảng thời gian có cấu trúc vừa đủ để con được chọn, thử và tạo ra một điều gì đó — trong một không gian sáng tạo của PINO.</p></div></section>
    <section className="os-sessions-section" id="sessions"><div className="shell"><div className="section-heading"><div><p className="eyebrow">THIS WEEK AT PINO</p><h2>Con có thể<br /><em>khám phá gì?</em></h2></div><p>Chọn một buổi phù hợp với thời gian của gia đình. Mỗi session là một điểm bắt đầu — không cần biết trước con sẽ thích gì.</p></div>{sessionLoading ? <div className="session-loading">Đang xem lịch Open Studio…</div> : sessionError ? <div className="session-empty"><strong>Lịch Open Studio đang tạm thời chưa tải được.</strong><br />Vui lòng thử tải lại trang sau ít phút.</div> : <>
      {upcomingSessions.length > 0 && <><div className="session-grid">{upcomingSessions.map((session, index) => { const unavailable = session.availableSeats === 0 || session.availableSeats === null; return <a className={`session-card session-card-${(index % 3) + 1}${unavailable ? " is-unavailable" : ""}`} key={session.id} href={`/open-studio/session?id=${encodeURIComponent(session.id)}`}><div className="session-card-top"><span>{session.path || "Open Studio"}</span><span>{session.availableSeats === 0 ? "FULL" : session.availableSeats === null ? "CHECK" : "OPEN"}</span></div><div className="session-card-body"><p className="session-date">{formatSessionDate(session.date)}</p><h3>{session.topic}</h3><p className="session-experience">Một buổi {session.path === "Piano" ? "khám phá âm nhạc" : session.path === "Little Piner" ? "khám phá dành cho bé" : "sáng tạo"} tại PINO.</p><p className="session-seats">{session.availableSeats === null ? "Đang cập nhật chỗ" : session.availableSeats === 0 ? "Đã đầy · Xem chi tiết" : `${session.availableSeats} chỗ còn lại`} <span>→</span></p></div></a>; })}</div><p className="session-helper">Chọn một buổi để xem chi tiết. Bạn chưa cần đăng nhập để khám phá.</p></>}
      {recentPastSessions.length > 0 && <div className="recent-sessions"><div className="recent-sessions-heading"><div><p className="eyebrow">RECENTLY AT PINO</p><h3>Những buổi vừa diễn ra</h3></div><p>Đây là một phần lịch sử Open Studio trong 7 ngày gần nhất — để bạn thấy những gì các bạn nhỏ đã khám phá tại PINO.</p></div><div className="session-grid recent-session-grid">{recentPastSessions.map((session, index) => <div className={`session-card session-card-past session-card-${(index % 3) + 1}`} key={session.id} aria-label={`Open Studio đã diễn ra: ${session.topic}`}><div className="session-card-top"><span>{session.path || "Open Studio"}</span><span>ĐÃ DIỄN RA</span></div><div className="session-card-body"><p className="session-date">{formatSessionDate(session.date)}</p><h3>{session.topic}</h3><p className="session-experience">Một buổi {session.path === "Piano" ? "khám phá âm nhạc" : session.path === "Little Piner" ? "khám phá dành cho bé" : "sáng tạo"} đã diễn ra tại PINO.</p><p className="session-seats session-readonly">Session đã kết thúc · Chỉ để tham khảo</p></div></div>)}</div></div>}
      {upcomingSessions.length === 0 && recentPastSessions.length === 0 && <div className="session-empty"><strong>Chưa có session để hiển thị.</strong><br />Lịch mới sẽ được cập nhật tại đây. Hãy quay lại sau để chọn một buổi.</div>}
    </>}</div></section>
    <section className="how-it-works" id="how"><div className="shell"><div className="section-heading"><div><p className="eyebrow">HOW IT WORKS</p><h2>Chọn một buổi.<br /><em>Rồi bắt đầu.</em></h2></div><p>Không cần biết trước con sẽ thích gì. Chỉ cần chọn một buổi để bắt đầu.</p></div><div className="steps-grid"><div className="step-card"><span>01 · CHỌN</span><h3>Chọn một buổi</h3><p>Xem lịch và tìm một session phù hợp với thời gian của gia đình.</p></div><div className="step-card"><span>02 · KHÁM PHÁ</span><h3>Con đến PINO</h3><p>Một buổi Art, Piano hoặc Little Piner — với đủ khoảng trống để con tự khám phá.</p></div><div className="step-card"><span>03 · TẠO RA</span><h3>Con làm một điều</h3><p>Một bức tranh, một giai điệu, một ý tưởng — thứ con mang về là của riêng con.</p></div><div className="step-card"><span>04 · QUAY LẠI</span><h3>Thích thì khám phá tiếp</h3><p>Open Studio được thiết kế để mỗi lần quay lại có thể là một điều mới.</p></div></div></div></section>
    <section className="os-start" id="start"><div className="shell"><div className="os-start-grid"><div><p className="eyebrow">READY WHEN YOU ARE</p><h2>Một buổi chiều.<br /><em>Một điều mới.</em></h2><p>Chọn một session đang mở để xem chi tiết. Khi sẵn sàng, PINO sẽ kiểm tra Pass và giúp bạn đặt chỗ.</p></div><div className="direct-book-card"><p className="eyebrow">ALREADY A PINO MEMBER?</p><h3>Đã có Open Studio Pass?</h3><p>Đăng nhập để xem Pass của bé và đặt chỗ ngay.</p><a className="button button-dark" href="/open-studio/member">Vào Member Space →</a></div></div></div></section>
    <footer className="footer shell"><div className="wordmark">PINO<span>•</span></div><p>Creative club for curious kids.</p><span>© {new Date().getFullYear()} PINO</span></footer>
    {!sessionLoading && !sessionError && upcomingSessions.length > 0 && <a className="mobile-session-cta" href="#sessions"><span>Open Studio</span><strong>Chọn một buổi cho con →</strong></a>}
    <style jsx global>{`
      .open-studio-landing { --os-shadow: 0 22px 60px rgba(23,23,19,.08); overflow: hidden; }
      .open-studio-landing .nav { position: sticky; top: 0; z-index: 20; background: rgba(244,240,231,.92); backdrop-filter: blur(14px); }
      .open-studio-landing .nav-cta { transition: background .2s ease, color .2s ease, transform .2s ease; }
      .open-studio-landing .nav-cta:hover { background: var(--ink); color: var(--paper); transform: translateY(-1px); }
      .open-studio-landing .os-ad-hero { min-height: 700px; display: grid; grid-template-columns: 1.05fr .95fr; gap: clamp(40px,7vw,110px); align-items: center; padding-top: 70px; padding-bottom: 80px; }
      .open-studio-landing .hero-copy { position: relative; z-index: 2; }
      .open-studio-landing .hero-copy h1 { font-size: clamp(58px,7.2vw,104px); max-width: 800px; }
      .open-studio-landing .hero-copy h1 em { color: #5e6b2b; }
      .open-studio-landing .hero-lede { max-width: 590px; }
      .open-studio-landing .hero-actions .button { box-shadow: 0 10px 24px rgba(29,32,26,.14); transition: transform .2s ease, box-shadow .2s ease; }
      .open-studio-landing .hero-actions .button:hover { transform: translateY(-2px); box-shadow: 0 14px 28px rgba(29,32,26,.18); }
      .open-studio-landing .hero-art { min-height: 540px; box-shadow: var(--os-shadow); }
      .open-studio-landing .hero-art::after { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 75% 80%, rgba(255,255,255,.28), transparent 28%); pointer-events: none; }
      .open-studio-landing .statement { position: relative; }
      .open-studio-landing .statement-inner { max-width: 1180px; }
      .open-studio-landing .statement h2 { max-width: 940px; }
      .os-sessions-section { padding: 130px 0 115px; background: #f4f0e7; }
      .os-sessions-section .section-heading { margin-bottom: 48px; }
      .session-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; }
      .session-card { min-height: 390px; padding: 0; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid rgba(23,23,19,.1); background: #e8e0d1; box-shadow: 0 8px 26px rgba(23,23,19,.04); transition: transform .22s ease, box-shadow .22s ease; }
      a.session-card { color: inherit; }
      a.session-card:hover { transform: translateY(-5px); box-shadow: var(--os-shadow); }
      .session-card::before { content: ""; display: block; height: 7px; width: 100%; background: #d65b42; }
      .session-card-2::before { background: #9bbfd8; }
      .session-card-3::before { background: #a8c86b; }
      .session-card-top { display: flex; justify-content: space-between; gap: 16px; padding: 20px 22px 0; font-size: 9px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; color: #6d685f; }
      .session-card-top span:last-child { color: #53631f; }
      .session-card-body { padding: 24px 22px 22px; margin-top: auto; }
      .session-date { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #777269; margin-bottom: 15px; }
      .session-card h3 { font-size: clamp(28px,3vw,40px); line-height: .98; letter-spacing: -.055em; margin: 0 0 14px; max-width: 330px; }
      .session-experience { color: #777269; font-size: 13px; line-height: 1.55; max-width: 300px; margin-bottom: 24px; }
      .session-seats { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-top: 1px solid rgba(23,23,19,.13); padding-top: 15px; margin: 0; font-size: 11px; font-weight: 700; }
      .session-seats span { font-size: 18px; transition: transform .2s ease; }
      a.session-card:hover .session-seats span { transform: translateX(4px); }
      .session-card.is-unavailable { opacity: .72; }
      .session-card.is-unavailable .session-card-top span:last-child { color: #8a6b61; }
      .session-helper { margin: 18px 0 0; color: #8a857b; font-size: 11px; }
      .recent-sessions { margin-top: 90px; padding-top: 65px; border-top: 1px solid var(--line); }
      .recent-sessions-heading { display: flex; justify-content: space-between; align-items: end; gap: 40px; margin-bottom: 28px; }
      .recent-sessions-heading h3 { font-size: clamp(34px,4vw,52px); line-height: .95; letter-spacing: -.055em; margin: 0; }
      .recent-sessions-heading > p { max-width: 360px; color: var(--muted); font-size: 13px; line-height: 1.55; margin: 0; }
      .session-card-past { min-height: 310px; background: #ebe5d9; box-shadow: none; }
      .session-card-past::before { background: #b9b3a7; }
      .session-card-past .session-card-top span:last-child { color: #8a857b; }
      .session-card-past h3 { font-size: 30px; }
      .session-card-past .session-experience { margin-bottom: 20px; }
      .session-readonly { color: #8a857b; font-weight: 500; }
      .session-loading, .session-empty { padding: 42px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); color: var(--muted); font-size: 14px; line-height: 1.6; }
      .session-empty strong { color: var(--ink); }
      .how-it-works { background: #e8e0d1; }
      .open-studio-landing .steps-grid { margin-top: 10px; }
      .open-studio-landing .step-card { min-height: 220px; padding: 25px 18px 18px 0; }
      .open-studio-landing .step-card h3 { font-size: 30px; margin-top: 46px; }
      .open-studio-landing .step-card p { max-width: 260px; }
      .os-start { background: var(--dark); color: var(--paper); padding: 115px 0 125px; }
      .os-start-grid { display: grid; grid-template-columns: 1.1fr .9fr; gap: 90px; align-items: end; }
      .os-start h2 { font-size: clamp(54px,6.4vw,90px); line-height: .9; letter-spacing: -.065em; margin: 0 0 24px; }
      .os-start h2 em { color: #c7df72; }
      .os-start-grid > div:first-child > p:not(.eyebrow) { max-width: 540px; color: #bdb9af; line-height: 1.65; }
      .os-start .eyebrow { color: #aaa69d; }
      .direct-book-card { background: #f0eadf; color: var(--ink); padding: 34px; min-height: 280px; display: flex; flex-direction: column; justify-content: flex-end; box-shadow: var(--os-shadow); }
      .direct-book-card h3 { font-size: 32px; letter-spacing: -.05em; margin: 0 0 10px; }
      .direct-book-card p:not(.eyebrow) { color: var(--muted); font-size: 13px; line-height: 1.55; max-width: 320px; margin-bottom: 22px; }
      .direct-book-card .button { width: fit-content; }
      .mobile-session-cta { display: none; }
      @media (max-width: 900px) {
        .open-studio-landing .os-ad-hero { grid-template-columns: 1fr; min-height: auto; padding-top: 65px; }
        .open-studio-landing .hero-art { min-height: 420px; max-width: 680px; width: 100%; margin: 0 auto; }
        .session-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
        .os-start-grid { grid-template-columns: 1fr; gap: 45px; }
        .recent-sessions-heading { align-items: start; flex-direction: column; gap: 16px; }
      }
      @media (max-width: 620px) {
        .open-studio-landing .os-ad-hero { padding-top: 48px; padding-bottom: 62px; }
        .open-studio-landing .hero-copy h1 { font-size: clamp(52px,15vw,76px); }
        .open-studio-landing .hero-lede { font-size: 16px; }
        .open-studio-landing .hero-art { min-height: 320px; border-radius: 42% 58% 48% 52% / 48% 45% 55% 52%; }
        .open-studio-landing .orb-a { width: 210px; height: 210px; }
        .open-studio-landing .orb-b { width: 190px; height: 190px; }
        .open-studio-landing .orb-c { width: 200px; height: 200px; }
        .os-sessions-section { padding: 82px 0 88px; }
        .session-grid { grid-template-columns: 1fr; gap: 12px; }
        .session-card { min-height: 340px; }
        .recent-sessions { margin-top: 65px; padding-top: 48px; }
        .recent-sessions-heading h3 { font-size: 38px; }
        .open-studio-landing .steps-grid { grid-template-columns: 1fr; }
        .open-studio-landing .step-card { min-height: 175px; }
        .os-start { padding: 82px 0 105px; }
        .direct-book-card { min-height: 250px; padding: 28px; }
        .open-studio-landing .footer { padding-bottom: 90px; }
        .mobile-session-cta { position: fixed; display: flex; left: 12px; right: 12px; bottom: 12px; z-index: 30; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 12px 11px 15px; background: var(--dark); color: #fff; border-radius: 2px; box-shadow: 0 14px 36px rgba(23,23,19,.22); }
        .mobile-session-cta span { font-size: 8px; letter-spacing: .13em; opacity: .65; }
        .mobile-session-cta strong { font-size: 11px; }
      }
    `}</style>
  </main>;
}
