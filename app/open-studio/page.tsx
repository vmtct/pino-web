"use client";

import { FormEvent, useEffect, useState } from "react";
import "./page.css";

type Session = { id: string; topic: string; type: string; path: string | null; date: string | null; availableSeats: number | null; capacity: number | null; confirmedCount: number; cover: string | null; avatar: string | null };

const passes = [
  { id: "Piano", title: "Piano", detail: "Một buổi để con khám phá piano." },
  { id: "Art", title: "Art", detail: "Một buổi để con vẽ và tạo ra điều mới." },
  { id: "Little Piner", title: "Little Piner", detail: "Dành cho 3–6 tuổi · Art & Piano." },
  { id: "Bring-a-Friend", title: "Bring-a-Friend", detail: "Một trải nghiệm để con đi cùng một người bạn." },
];

function formatSessionDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value.length === 10 ? `${value}T12:00:00+07:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "numeric", month: "numeric", hour: value.length > 10 ? "2-digit" : undefined, minute: value.length > 10 ? "2-digit" : undefined, timeZone: "Asia/Ho_Chi_Minh" }).format(date);
}

export default function OpenStudioPage() {
  const [passType, setPassType] = useState("Piano");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/os-sessions")
      .then((response) => response.json())
      .then((data) => { if (active) setSessions(Array.isArray(data.sessions) ? data.sessions.filter((session: Session) => session.type === "Open Studio") : []); })
      .catch(() => { if (active) setSessions([]); })
      .finally(() => { if (active) setSessionLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const payload = { parentName: String(form.get("parentName") || ""), phone: String(form.get("phone") || ""), childName: String(form.get("childName") || ""), ageStage: String(form.get("ageStage") || ""), passType };
    try {
      const response = await fetch("/api/open-studio/interest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Có lỗi xảy ra.");
      setSubmitted(true);
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Có lỗi xảy ra."); }
    finally { setLoading(false); }
  }

  return (
    <main className="intake-page open-studio-landing">
      <nav className="nav shell"><a className="wordmark" href="/">PINO<span>•</span></a><div className="nav-links"><a href="#sessions">Các buổi đang có</a><a href="#how">Cách hoạt động</a></div><a className="nav-cta" href="#start">Khám phá Open Studio →</a></nav>
      <section className="os-ad-hero shell"><div><p className="eyebrow">PINO OPEN STUDIO</p><h1>Nếu hôm nay con <em>được tự chọn?</em></h1><p className="hero-lede">Một buổi chiều để con vẽ, chơi nhạc và khám phá điều mình thích. Không thêm áp lực. Chỉ là một khoảng thời gian thật sự của riêng con.</p><div className="hero-actions"><a className="button button-dark" href="#sessions">Xem các buổi đang có →</a><a className="text-link" href="#start">Nhận Open Studio Pass</a></div><div className="hero-proof"><span>ART</span><i>·</i><span>PIANO</span><i>·</i><span>LITTLE PINER</span><i>·</i><span>3–15 TUỔI</span></div></div><div className="hero-art os-hero-art" aria-hidden="true"><div className="orb orb-a" /><div className="orb orb-b" /><div className="orb orb-c" /><div className="scribble">✦</div><div className="art-note"><strong>make</strong><br />something today.</div></div></section>
      <section className="statement"><div className="statement-inner shell"><p className="eyebrow">KHÔNG PHẢI THÊM MỘT LỚP HỌC</p><h2>Một buổi chiều để con <em>tự mình khám phá.</em></h2><p>Open Studio là khoảng thời gian có cấu trúc vừa đủ để con được chọn, thử và tạo ra một điều gì đó — trong một không gian sáng tạo của PINO.</p></div></section>
      <section className="os-sessions-section" id="sessions"><div className="shell"><div className="section-heading"><div><p className="eyebrow">THIS WEEK AT PINO</p><h2>Con có thể<br /><em>khám phá gì?</em></h2></div><p>Các session Open Studio thực tế đang mở. Chỗ trống thay đổi theo từng buổi.</p></div>{sessionLoading ? <div className="session-loading">Đang xem lịch Open Studio…</div> : sessions.length ? <div className="session-grid">{sessions.slice(0, 6).map((session, index) => <article className={`session-card session-card-${(index % 3) + 1}`} key={session.id}><div className="session-card-top"><span>{session.type}</span><span>{session.path || "Open Studio"}</span></div><div className="session-card-body"><p className="session-date">{formatSessionDate(session.date)}</p><h3>{session.topic}</h3><p className="session-seats">{session.availableSeats === null ? "Đang cập nhật chỗ" : session.availableSeats === 0 ? "Đã đầy" : `${session.availableSeats} chỗ còn lại`}</p></div></article>)}</div> : <div className="session-empty">Lịch đang được cập nhật. Để lại thông tin bên dưới, PINO sẽ giúp gia đình chọn buổi phù hợp.</div>}</div></section>
      <section className="how-it-works" id="how"><div className="shell"><div className="section-heading"><div><p className="eyebrow">HOW IT WORKS</p><h2>Đơn giản<br /><em>thôi.</em></h2></div><p>Không cần biết trước con sẽ thích gì. Chỉ cần chọn một buổi để bắt đầu.</p></div><div className="steps-grid"><div className="step-card"><span>01 · CHỌN</span><h3>Chọn một buổi</h3><p>Xem lịch và tìm một session phù hợp với thời gian của gia đình.</p></div><div className="step-card"><span>02 · KHÁM PHÁ</span><h3>Con đến PINO</h3><p>Một buổi Art, Piano hoặc Little Piner — với đủ khoảng trống để con tự khám phá.</p></div><div className="step-card"><span>03 · TẠO RA</span><h3>Con làm một điều</h3><p>Một bức tranh, một giai điệu, một ý tưởng — thứ con mang về là của riêng con.</p></div><div className="step-card"><span>04 · QUAY LẠI</span><h3>Thích thì khám phá tiếp</h3><p>Open Studio được thiết kế để mỗi lần quay lại có thể là một điều mới.</p></div></div></div></section>
      <section className="os-start" id="start"><div className="shell">{submitted ? <div className="intake-success os-start-success"><p className="eyebrow">YOUR PASS REQUEST IS IN</p><h2>Hẹn gặp con <em>ở PINO.</em></h2><p>PINO đã nhận thông tin. Team sẽ liên hệ để xác nhận session Open Studio phù hợp.</p><a className="button button-dark" href="/">Back to PINO</a></div> : <div className="os-start-grid"><div><p className="eyebrow">START HERE</p><h2>Cho con một<br /><em>buổi chiều mới.</em></h2><p>Chọn loại trải nghiệm bạn muốn bắt đầu. Không cần cam kết dài hạn.</p></div><form className="intake-form os-start-form" onSubmit={handleSubmit}><div><p className="eyebrow">01 · CHOOSE YOUR PASS</p><div className="pass-choice-grid">{passes.map((pass, index) => <button key={pass.id} type="button" className={`pass-choice ${passType === pass.id ? "selected" : ""}`} onClick={() => setPassType(pass.id)}><span className="pass-choice-number">0{index + 1}</span><strong>{pass.title}</strong><small>{pass.detail}</small></button>)}</div></div><div className="os-form-fields"><p className="eyebrow">02 · TELL US A LITTLE</p><label>Tên phụ huynh *<input name="parentName" required placeholder="Tên của bạn" /></label><label>Số điện thoại *<input name="phone" required inputMode="tel" placeholder="09xx xxx xxx" /></label><label>Tên của con<input name="childName" placeholder="Tên bé" /></label><label>Độ tuổi *<select name="ageStage" required defaultValue=""><option value="" disabled>Chọn độ tuổi</option><option value="3–6">3–6 · Little Piner</option><option value="7+">7+</option></select></label>{error && <p className="form-error">{error}</p>}<button className="button button-dark intake-submit" type="submit" disabled={loading}>{loading ? "Đang gửi…" : "Bắt đầu Open Studio →"}</button><p className="form-note">PINO sẽ liên hệ để xác nhận session phù hợp cho gia đình.</p></div></form></div>}</div></section>
      <footer className="footer shell"><div className="wordmark">PINO<span>•</span></div><p>Creative club for curious kids.</p><span>© {new Date().getFullYear()} PINO</span></footer>
    </main>
  );
}
