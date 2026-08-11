"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function MemberPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const normalizedPhone = phone.replace(/[^0-9+]/g, "").trim();

    try {
      const response = await fetch("/api/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      const data = await response.json();
      if (!response.ok || !data.member) {
        throw new Error(data.error || "Không tìm thấy tài khoản Member.");
      }

      sessionStorage.setItem("pino_member_phone", normalizedPhone);
      router.push("/open-studio/member/book");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể mở Member Space.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="member-page">
      <nav className="nav">
        <a className="logo" href="/">PINO<span>•</span></a>
        <a className="back" href="/open-studio">Open Studio</a>
      </nav>

      <section className="member-shell">
        <div className="intro">
          <p className="eyebrow">PINO MEMBER SPACE</p>
          <h1>Một nơi để<br /><em>con tiếp tục khám phá.</em></h1>
          <p className="lede">
            Đăng nhập bằng số điện thoại/Zalo đã đăng ký với PINO để xem Pass của bé,
            tìm Open Studio và đặt chỗ ngay.
          </p>
        </div>

        <div className="login-card">
          <div>
            <p className="eyebrow">MEMBER LOGIN</p>
            <h2>Chào mừng trở lại.</h2>
            <p className="card-copy">Dùng số điện thoại phụ huynh đã đăng ký với PINO.</p>
          </div>

          <form onSubmit={submit}>
            <label htmlFor="phone">Số điện thoại</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="09xx xxx xxx"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              autoFocus
            />

            {error && <p className="error" role="alert">{error}</p>}

            <button type="submit" disabled={loading || !phone.trim()}>
              {loading ? "Đang mở Member Space…" : "Vào Member Space →"}
            </button>
          </form>

          <p className="privacy">
            PINO chỉ dùng số điện thoại này để xác định tài khoản gia đình của bạn.
          </p>
        </div>
      </section>

      <footer>
        <span>PINO<span className="dot">•</span></span>
        <span>Creative club for curious kids.</span>
      </footer>

      <style jsx>{css}</style>
    </main>
  );
}

const css = `
.member-page{min-height:100vh;background:#f4f0e7;color:#171713;display:flex;flex-direction:column}
.nav{height:84px;max-width:1120px;width:100%;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(23,23,19,.15);box-sizing:border-box}
.logo{color:#171713;text-decoration:none;font-weight:700;font-size:24px;letter-spacing:-.08em}.logo span{color:#d65b42}
.back{color:#777269;text-decoration:none;font-size:12px}.back:hover{text-decoration:underline}
.member-shell{width:100%;max-width:1120px;margin:0 auto;padding:88px 24px 110px;box-sizing:border-box;display:grid;grid-template-columns:1.25fr .75fr;gap:90px;align-items:center;flex:1}
.intro{max-width:760px}.eyebrow{font-size:10px;letter-spacing:.14em;font-weight:700;color:#777269;margin:0 0 14px}.intro h1{font-size:clamp(58px,7vw,94px);line-height:.9;letter-spacing:-.065em;margin:0;max-width:800px}.intro h1 em{font-family:"DM Serif Display",serif;font-weight:400}.lede{max-width:560px;color:#777269;font-size:16px;line-height:1.65;margin:30px 0 0}
.login-card{background:#e2ebc0;padding:34px;box-sizing:border-box;box-shadow:0 18px 50px rgba(23,23,19,.06)}.login-card h2{font-size:34px;line-height:1;letter-spacing:-.05em;margin:0}.card-copy{color:#777269;font-size:13px;line-height:1.5;margin:12px 0 28px}.login-card form{display:grid;gap:9px}.login-card label{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#777269}.login-card input{width:100%;box-sizing:border-box;border:1px solid rgba(23,23,19,.2);background:#f4f0e7;color:#171713;padding:15px 14px;font:inherit;font-size:16px;outline:none}.login-card input:focus{border-color:#171713}.login-card button{border:0;background:#171713;color:#fff;padding:15px 18px;margin-top:7px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}.login-card button:disabled{opacity:.45;cursor:not-allowed}.error{margin:8px 0 0;color:#9b3d2e;font-size:12px;line-height:1.45}.privacy{font-size:10px;line-height:1.5;color:#777269;margin:20px 0 0}
footer{width:100%;max-width:1120px;margin:0 auto;padding:22px 24px 30px;box-sizing:border-box;border-top:1px solid rgba(23,23,19,.15);display:flex;justify-content:space-between;color:#777269;font-size:10px;letter-spacing:.04em}footer>span:first-child{color:#171713;font-weight:700}.dot{color:#d65b42}
@media (max-width:800px){.member-shell{grid-template-columns:1fr;gap:48px;padding-top:58px;padding-bottom:70px}.intro h1{font-size:clamp(52px,14vw,76px)}.lede{font-size:15px}.login-card{padding:26px}.nav{height:72px}footer{display:block}footer span{display:block;margin-top:6px}}
`;
