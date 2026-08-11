"use client";

import { useState } from "react";

type Student={id:string;name:string;avatar:string|null};
type Pass={id:string;name:string;type:string|null;scope:string|null;month:string|null;validUntil:string|null;status:string|null};
type Booking={id:string;status:string|null;sessionId:string|null;sessionTopic:string|null;sessionDate:string|null};
type Member={id:string;name:string;phone:string|null;students:Student[];passes:Pass[];bookings:Booking[]};

const formatDate=(value:string|null)=>{
  if(!value)return "Date TBA";
  return new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(`${value}T00:00:00`));
};

const initials=(name:string)=>name.split(" ").filter(Boolean).slice(-2).map(x=>x[0]).join("").toUpperCase();

export default function MemberPage(){
  const [phone,setPhone]=useState("");
  const [member,setMember]=useState<Member|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const login=async()=>{
    const value=phone.trim();
    if(!value)return;
    setLoading(true);setError("");
    try{
      const response=await fetch("/api/member",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:value})});
      const data=await response.json();
      if(!response.ok){setMember(null);setError(data.error||"Không tìm thấy member.");return;}
      setMember(data.member);
    }catch{setError("Không thể kết nối tới PINO. Vui lòng thử lại.");}
    finally{setLoading(false);}
  };

  const reset=()=>{setMember(null);setError("");setPhone("");};

  return <main className="member-page">
    <nav className="shell member-nav">
      <a href="/" className="wordmark">PINO<span>•</span></a>
      <div className="member-nav-links">
        <a href="/open-studio/sessions">Open Studio</a>
        <a href="/open-studio/sessions" className="nav-cta">Book a session →</a>
      </div>
    </nav>

    {!member ? <section className="shell member-login">
      <div className="member-login-copy">
        <p className="eyebrow">PINO MEMBER</p>
        <h1>Your PINO<br/><em>space.</em></h1>
        <p>Chỗ riêng để xem các bé, quyền Open Studio và những buổi đã đặt của gia đình bạn.</p>
      </div>
      <div className="member-login-card">
        <div className="login-card-mark">PINO<br/><span>MEMBER</span></div>
        <label>Số Zalo đã đăng ký</label>
        <input value={phone} onChange={e=>setPhone(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")login()}} placeholder="09xx xxx xxx" inputMode="tel" autoComplete="tel"/>
        <button className="button button-dark" onClick={login} disabled={loading||!phone.trim()}>{loading?"Đang mở space…":"Vào Member Space →"}</button>
        {error&&<p className="member-error">{error}</p>}
        <p className="member-login-note">Dùng đúng số Zalo đã đăng ký với PINO. PINO không yêu cầu mật khẩu.</p>
      </div>
    </section> : <section className="shell member-dashboard">
      <header className="member-welcome">
        <div>
          <p className="eyebrow">WELCOME BACK</p>
          <h1>{member.name}<span>.</span></h1>
          <p>{member.phone||phone} · {member.students.length} {member.students.length===1?"bé":"bé"}</p>
        </div>
        <button className="member-change" onClick={reset}>Đổi số</button>
      </header>

      <div className="member-stats">
        <div><strong>{member.students.length}</strong><span>Học viên</span></div>
        <div><strong>{member.passes.length}</strong><span>OS Pass</span></div>
        <div><strong>{member.bookings.length}</strong><span>Bookings</span></div>
      </div>

      <div className="member-grid">
        <section className="member-panel kids-panel">
          <div className="panel-head"><div><p className="eyebrow">01 · FAMILY</p><h2>My kids</h2></div><span>{member.students.length}</span></div>
          {member.students.length? <div className="kids-list">{member.students.map((student,index)=><div className="kid-row" key={student.id}>
            <div className="kid-avatar">{student.avatar?<img src={student.avatar} alt=""/>:initials(student.name)}</div>
            <div className="kid-info"><strong>{student.name}</strong><span>{member.passes[index]?.scope||"PINO member"}</span></div>
            <span className="kid-arrow">↗</span>
          </div>)}</div>:<div className="empty-state">Chưa có thông tin học viên.</div>}
        </section>

        <section className="member-panel pass-panel">
          <div className="panel-head"><div><p className="eyebrow">02 · ACCESS</p><h2>Open Studio</h2></div><span>{member.passes.length}</span></div>
          {member.passes.length?<div className="pass-list-member">{member.passes.map(pass=><div className="member-pass" key={pass.id}>
            <div className="pass-top"><span>{pass.type||"Creative"}</span><b>{pass.status||"Active"}</b></div>
            <strong>{pass.scope||"Open Studio"}</strong>
            <p>{pass.validUntil?`Valid until ${formatDate(pass.validUntil)}`:"No expiry date"}</p>
          </div>)}</div>:<div className="empty-state"><strong>Chưa có Open Studio Pass.</strong><span>Khi PINO cấp pass, quyền booking sẽ xuất hiện ở đây.</span></div>}
          <a className="panel-link" href="/open-studio">Khám phá Open Studio →</a>
        </section>
      </div>

      <section className="member-panel bookings-panel">
        <div className="panel-head"><div><p className="eyebrow">03 · YOUR CALENDAR</p><h2>Upcoming & recent</h2></div><a className="panel-link" href="/open-studio/sessions">Book a session →</a></div>
        {member.bookings.length?<div className="booking-list">{member.bookings.map(booking=><article className="booking-card" key={booking.id}>
          <div className="booking-date"><strong>{booking.sessionDate?new Date(`${booking.sessionDate}T00:00:00`).getDate():"—"}</strong><span>{booking.sessionDate?new Intl.DateTimeFormat("en-US",{month:"short"}).format(new Date(`${booking.sessionDate}T00:00:00"`)):""}</span></div>
          <div className="booking-main"><span className="booking-kicker">OPEN STUDIO</span><h3>{booking.sessionTopic||"Open Studio session"}</h3><p>{booking.sessionDate?formatDate(booking.sessionDate):"Date to be confirmed"}</p></div>
          <span className={`booking-status ${booking.status?.toLowerCase()==="confirmed"?"confirmed":""}`}>{booking.status||"Pending"}</span>
        </article>)}</div>:<div className="empty-bookings"><div><strong>No sessions yet.</strong><p>Chưa có buổi Open Studio nào được đặt cho gia đình.</p></div><a className="button button-dark" href="/open-studio/sessions">Find a session →</a></div>}
      </section>

      <section className="member-bottom-cta">
        <div><p className="eyebrow">KEEP CREATING</p><h2>Một buổi chiều<br/><em>đáng nhớ.</em></h2></div>
        <div><p>Chọn một session phù hợp và để bé tự chọn điều mình muốn khám phá.</p><a className="button button-dark" href="/open-studio/sessions">Book Open Studio →</a></div>
      </section>
    </section>}

    <style jsx>{`
      .member-page{min-height:100vh;background:var(--paper);color:var(--ink)}
      .member-nav{height:84px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}
      .member-nav-links{display:flex;align-items:center;gap:26px;font-size:13px;font-weight:600;color:#4f4b43}.member-nav-links a:first-child{color:var(--muted)}
      .member-login{min-height:calc(100vh - 84px);display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:100px;padding:70px 0 100px}
      .member-login-copy h1{margin:0 0 28px;font-size:clamp(64px,8vw,108px)}.member-login-copy h1 em{font-size:.92em}.member-login-copy>p:last-child{max-width:520px;color:var(--muted);font-size:18px;line-height:1.6}
      .member-login-card{background:#e8e0d1;padding:38px;max-width:430px;box-shadow:12px 12px 0 #d8ff52}.login-card-mark{font-weight:700;font-size:28px;letter-spacing:-.08em;line-height:.8;margin-bottom:65px}.login-card-mark span{font-size:9px;letter-spacing:.16em;color:var(--muted)}
      .member-login-card label{display:block;font-size:12px;font-weight:700;margin-bottom:9px}.member-login-card input{width:100%;border:1px solid var(--line);background:rgba(255,255,255,.25);padding:16px;outline:none;margin-bottom:12px}.member-login-card input:focus{border-color:var(--ink)}.member-login-card .button{width:100%}.member-login-note{font-size:11px;color:var(--muted);line-height:1.5;margin:18px 0 0}.member-error{color:#a63b2a;font-size:13px;line-height:1.4;margin:14px 0 0}
      .member-dashboard{padding:72px 0 120px}.member-welcome{display:flex;align-items:flex-end;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:42px}.member-welcome h1{font-size:clamp(56px,7vw,94px);margin:0 0 12px}.member-welcome h1 span{color:#d65b42}.member-welcome>div>p:last-child{color:var(--muted);margin:0;font-size:14px}.member-change{border:0;background:transparent;text-decoration:underline;text-underline-offset:4px;cursor:pointer;color:var(--muted);font-size:13px}
      .member-stats{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--line);margin-bottom:14px}.member-stats div{padding:22px 0;display:flex;align-items:baseline;gap:9px}.member-stats div+div{border-left:1px solid var(--line);padding-left:28px}.member-stats strong{font-size:30px;letter-spacing:-.06em}.member-stats span{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
      .member-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.member-panel{background:#e8e0d1;padding:30px}.pass-panel{background:#e2ebc0}.panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:24px}.panel-head .eyebrow{margin-bottom:8px}.panel-head h2{font-size:36px;letter-spacing:-.06em;line-height:1;margin:0}.panel-head>span{font-size:12px;color:var(--muted)}.kids-list{border-top:1px solid var(--line)}.kid-row{display:flex;align-items:center;gap:14px;padding:17px 0;border-bottom:1px solid var(--line)}.kid-avatar{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:#f4f0e7;font-size:12px;font-weight:700;overflow:hidden}.kid-avatar img{width:100%;height:100%;object-fit:cover}.kid-info{display:grid;gap:4px;flex:1}.kid-info strong{font-size:17px}.kid-info span{font-size:11px;color:var(--muted)}.kid-arrow{font-size:18px;color:var(--muted)}
      .pass-list-member{display:grid;gap:9px}.member-pass{border:1px solid rgba(23,23,19,.14);background:rgba(255,255,255,.25);padding:18px}.pass-top{display:flex;justify-content:space-between;gap:10px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}.pass-top b{color:#536323}.member-pass>strong{display:block;font-size:22px;letter-spacing:-.04em;margin:16px 0 7px}.member-pass>p{font-size:11px;color:var(--muted);margin:0}.panel-link{display:inline-block;margin-top:20px;font-size:12px;font-weight:700;text-decoration:underline;text-underline-offset:4px}.empty-state{min-height:150px;border-top:1px solid var(--line);padding-top:20px;color:var(--muted);font-size:13px;line-height:1.5}.empty-state strong,.empty-state span{display:block}.empty-state span{margin-top:7px}
      .bookings-panel{margin-top:14px}.booking-list{border-top:1px solid var(--line)}.booking-card{display:grid;grid-template-columns:72px 1fr auto;align-items:center;gap:20px;padding:20px 0;border-bottom:1px solid var(--line)}.booking-date{width:58px;height:58px;border:1px solid var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,.25)}.booking-date strong{font-size:24px;line-height:1;letter-spacing:-.06em}.booking-date span{font-size:9px;text-transform:uppercase;color:var(--muted);margin-top:3px}.booking-kicker{font-size:9px;letter-spacing:.13em;color:var(--muted);font-weight:700}.booking-main h3{font-size:20px;letter-spacing:-.04em;margin:5px 0}.booking-main p{font-size:11px;color:var(--muted);margin:0}.booking-status{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);padding:7px 10px;border:1px solid var(--line)}.booking-status.confirmed{color:#536323;background:#e2ebc0;border-color:rgba(83,99,35,.2)}.empty-bookings{border-top:1px solid var(--line);padding:30px 0 4px;display:flex;justify-content:space-between;align-items:center;gap:25px}.empty-bookings strong{font-size:18px}.empty-bookings p{font-size:12px;color:var(--muted);margin:5px 0 0}
      .member-bottom-cta{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:end;padding:120px 0 20px}.member-bottom-cta h2{font-size:clamp(50px,6vw,78px);line-height:.94;letter-spacing:-.06em;margin:0}.member-bottom-cta>div:last-child{max-width:380px}.member-bottom-cta>div:last-child p{color:var(--muted);line-height:1.6;font-size:15px;margin-bottom:24px}
      @media(max-width:820px){.member-nav{height:72px}.member-nav-links a:first-child{display:none}.member-login{grid-template-columns:1fr;gap:45px;padding:65px 0 80px;min-height:auto}.member-login-card{max-width:none;box-shadow:8px 8px 0 #d8ff52}.member-dashboard{padding:55px 0 85px}.member-welcome{align-items:flex-start;gap:20px}.member-welcome h1{font-size:56px}.member-grid{grid-template-columns:1fr}.member-stats{margin-top:0}.booking-card{grid-template-columns:58px 1fr}.booking-status{grid-column:2;justify-self:start}.member-bottom-cta{grid-template-columns:1fr;gap:30px;padding-top:80px}}
      @media(max-width:520px){.member-nav-links .nav-cta{padding:9px 12px;font-size:11px}.member-login-copy h1{font-size:62px}.member-login-card{padding:26px}.member-welcome{display:block}.member-change{margin-top:20px;padding:0}.member-stats strong{font-size:25px}.member-stats span{font-size:9px}.member-stats div+div{padding-left:14px}.member-panel{padding:22px}.panel-head h2{font-size:30px}.empty-bookings{display:block}.empty-bookings .button{margin-top:20px;width:100%}}
    `}</style>
  </main>;
}
