"use client";

import { useEffect, useState } from "react";

type Session = { id: string; topic: string; type: string; path: string | null; date: string | null; availableSeats: number | null; capacity: number | null; confirmedCount: number; cover: string | null; avatar: string | null };

function formatSessionDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value.length === 10 ? `${value}T12:00:00+07:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "numeric", month: "numeric", hour: value.length > 10 ? "2-digit" : undefined, minute: value.length > 10 ? "2-digit" : undefined, timeZone: "Asia/Ho_Chi_Minh" }).format(date);
}

export default function OpenStudioPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/os-sessions")
      .then((response) => response.json())
      .then((data) => { if (active) setSessions(Array.isArray(data.sessions) ? data.sessions.filter((session: Session) => session.type === "Open Studio") : []); })
      .catch(() => { if (active) setSessions([]); })
      .finally(() => { if (active) setSessionLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="intake-page open-studio-landing">
      <nav className="nav shell"><a className="wordmark" href="/">PINO<span>•</span></a><div className="nav-links"><a href="#sessions">Các buổi đang có</a><a href="#how">Cách hoạt động</a></div><a className="nav-cta" href="#sessions">Xem session →</a></nav>
      <section className="os-ad-hero shell"><div><p className="eyebrow">PINO OPEN STUDIO</p><h1>Nếu hôm nay con <em>được tự chọn?</em></h1><p className="hero-lede">Một buổi chiều để con vẽ, chơi nhạc và khám phá điều mình thích. Không thêm áp lực. Chỉ là một khoảng thời gian thật sự của riêng con.</p><div className="hero-actions"><a className="button button-dark" href="#sessions">Xem các buổi đang có →</a><a className="text-link" href="#how">Open Studio là gì?</a></div><div className="hero-proof"><span>ART</span><i>·</i><span>PIANO</span><i>·</i><span>LITTLE PINER</span><i>·</i><span>3–15 TUỔI</span></div></div><div className="hero-art os-hero-art" aria-hidden="true"><div className="orb orb-a" /><div className="orb orb-b" /><div className="orb orb-c" /><div className="scribble">✦</div><div className="art-note"><strong>make</strong><br />something today.</div></div></section>
      <section className="statement"><div className="statement-inner shell"><p className="eyebrow">KHÔNG PHẢI THÊM MỘT LỚP HỌC</p><h2>Một buổi chiều để con <em>tự mình khám phá.</em></h2><p>Open Studio là khoảng thời gian có cấu trúc vừa đủ để con được chọn, thử và tạo ra một điều gì đó — trong một không gian sáng tạo của PINO.</p></div></section>
      <section className="os-sessions-section" id="sessions"><div className="shell"><div className="section-heading"><div><p className="eyebrow">THIS WEEK AT PINO</p><h2>Con có thể<br /><em>khám phá gì?</em></h2></div><p>Các session Open Studio thực tế đang mở. Chọn một buổi để xem chi tiết và bắt đầu.</p></div>{sessionLoading ? <div className="session-loading">Đang xem lịch Open Studio…</div> : sessions.length ? <div className="session-grid">{sessions.slice(0, 6).map((session, index) => <a className={`session-card session-card-${(index % 3) + 1}`} key={session.id} href={`/open-studio/sessions/${session.id}`}><div className="session-card-top"><span>{session.type}</span><span>{session.path || "Open Studio"}</span></div><div className="session-card-body"><p className="session-date">{formatSessionDate(session.date)}</p><h3>{session.topic}</h3><p className="session-seats">{session.availableSeats === null ? "Đang cập nhật chỗ" : session.availableSeats === 0 ? "Đã đầy" : `${session.availableSeats} chỗ còn lại`} <span>→</span></p></div></a>)}</div> : <div className="session-empty">Lịch đang được cập nhật. Hãy quay lại sau để chọn một buổi.</div>}</div></section>
      <section className="how-it-works" id="how"><div className="shell"><div className="section-heading"><div><p className="eyebrow">HOW IT WORKS</p><h2>Chọn một buổi.<br /><em>Rồi bắt đầu.</em></h2></div><p>Không cần biết trước con sẽ thích gì. Chỉ cần chọn một buổi để bắt đầu.</p></div><div className="steps-grid"><div className="step-card"><span>01 · CHỌN</span><h3>Chọn một buổi</h3><p>Xem lịch và tìm một session phù hợp với thời gian của gia đình.</p></div><div className="step-card"><span>02 · KHÁM PHÁ</span><h3>Con đến PINO</h3><p>Một buổi Art, Piano hoặc Little Piner — với đủ khoảng trống để con tự khám phá.</p></div><div className="step-card"><span>03 · TẠO RA</span><h3>Con làm một điều</h3><p>Một bức tranh, một giai điệu, một ý tưởng — thứ con mang về là của riêng con.</p></div><div className="step-card"><span>04 · QUAY LẠI</span><h3>Thích thì khám phá tiếp</h3><p>Open Studio được thiết kế để mỗi lần quay lại có thể là một điều mới.</p></div></div></div></section>
      <section className="os-start" id="start"><div className="shell"><div className="os-start-grid"><div><p className="eyebrow">READY WHEN YOU ARE</p><h2>Một buổi chiều.<br /><em>Một điều mới.</em></h2><p>Chọn một session đang mở để xem chi tiết. Khi sẵn sàng, PINO sẽ kiểm tra Pass và giúp bạn đặt chỗ.</p></div><div className="direct-book-card"><p className="eyebrow">ALREADY A PINO MEMBER?</p><h3>Đã có Open Studio Pass?</h3><p>Đăng nhập để xem Pass của bé và đặt chỗ ngay.</p><a className="button button-dark" href="/open-studio/member">Vào Member Space →</a></div></div></div></section>
      <footer className="footer shell"><div className="wordmark">PINO<span>•</span></div><p>Creative club for curious kids.</p><span>© {new Date().getFullYear()} PINO</span></footer>
    </main>
  );
}
