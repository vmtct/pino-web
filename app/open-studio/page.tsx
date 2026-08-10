"use client";

import { FormEvent, useState } from "react";

const passes = [
  {
    id: "Piano",
    title: "Piano",
    detail: "Một buổi Open Studio để con thử piano.",
  },
  {
    id: "Art",
    title: "Art",
    detail: "Một buổi Open Studio để con thử vẽ.",
  },
  {
    id: "Little Piner",
    title: "Little Piner",
    detail: "Dành cho 3–6 tuổi · kết hợp Art & Piano.",
  },
  {
    id: "Bring-a-Friend",
    title: "Bring-a-Friend",
    detail: "Bạn đi cùng có thể vào bất kỳ path, Open Studio hoặc Premium session.",
  },
];

export default function OpenStudioPage() {
  const [passType, setPassType] = useState("Piano");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = {
      parentName: String(form.get("parentName") || ""),
      phone: String(form.get("phone") || ""),
      childName: String(form.get("childName") || ""),
      ageStage: String(form.get("ageStage") || ""),
      passType,
    };

    try {
      const response = await fetch("/api/open-studio/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Có lỗi xảy ra.");
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="intake-page">
      <nav className="nav shell">
        <a className="wordmark" href="/">PINO<span>•</span></a>
        <a className="text-link" href="/">Back to PINO →</a>
      </nav>

      <section className="intake-hero shell">
        <div>
          <p className="eyebrow">PINO OPEN STUDIO</p>
          <h1>Cho con một buổi chiều <em>để khám phá.</em></h1>
          <p className="intake-lede">
            Chọn loại pass phù hợp, để lại thông tin của bạn. PINO sẽ liên hệ để
            tìm một session phù hợp cho gia đình.
          </p>
        </div>
      </section>

      {submitted ? (
        <section className="intake-success shell">
          <p className="eyebrow">YOUR PASS REQUEST IS IN</p>
          <h2>Hẹn gặp con ở PINO.</h2>
          <p>
            PINO đã nhận thông tin. Team sẽ liên hệ với bạn để xác nhận session
            Open Studio phù hợp.
          </p>
          <a className="button button-dark" href="/">Back to PINO</a>
        </section>
      ) : (
        <section className="intake-section shell">
          <div className="intake-layout">
            <div>
              <p className="eyebrow">01 · CHOOSE YOUR PASS</p>
              <div className="pass-choice-grid">
                {passes.map((pass) => (
                  <button
                    key={pass.id}
                    type="button"
                    className={`pass-choice ${passType === pass.id ? "selected" : ""}`}
                    onClick={() => setPassType(pass.id)}
                  >
                    <span className="pass-choice-number">0{passes.indexOf(pass) + 1}</span>
                    <strong>{pass.title}</strong>
                    <small>{pass.detail}</small>
                  </button>
                ))}
              </div>
            </div>

            <form className="intake-form" onSubmit={handleSubmit}>
              <p className="eyebrow">02 · TELL US A LITTLE</p>
              <label>
                Tên phụ huynh *
                <input name="parentName" required placeholder="Tên của bạn" />
              </label>
              <label>
                Số điện thoại *
                <input name="phone" required inputMode="tel" placeholder="09xx xxx xxx" />
              </label>
              <label>
                Tên của con
                <input name="childName" placeholder="Tên bé" />
              </label>
              <label>
                Độ tuổi *
                <select name="ageStage" required defaultValue="">
                  <option value="" disabled>Chọn độ tuổi</option>
                  <option value="3–6">3–6 · Little Piner</option>
                  <option value="7+">7+</option>
                </select>
              </label>

              {error && <p className="form-error">{error}</p>}

              <button className="button button-dark intake-submit" type="submit" disabled={loading}>
                {loading ? "Đang gửi…" : "Get my Open Studio pass →"}
              </button>
              <p className="form-note">Không cần cam kết. PINO sẽ liên hệ để xác nhận session.</p>
            </form>
          </div>
        </section>
      )}

      <footer className="footer shell">
        <div className="wordmark">PINO<span>•</span></div>
        <p>Creative club for curious kids.</p>
        <span>© {new Date().getFullYear()} PINO</span>
      </footer>
    </main>
  );
}
