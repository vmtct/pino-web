"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type FlowState = "idle" | "submitting" | "success" | "error";

type HoldResponse = {
  ok?: boolean;
  message?: string;
  zaloChatUrl?: string;
  error?: string;
};

const triggerSelector = ".osd-hero-action button, .osd-final-cta button, .osd-mobile-bar button";

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^84\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  return digits;
}

function pageContext() {
  const params = new URLSearchParams(window.location.search);
  const activitySlug = (params.get("activity") || params.get("id") || "open-studio").trim();
  const activityTitle = document.querySelector<HTMLHeadingElement>(".osd-hero h1")?.textContent?.trim() || "Open Studio";
  const meta = Array.from(document.querySelectorAll<HTMLElement>(".osd-meta-pills span")).map((node) => node.textContent?.trim() || "");
  const sessionDate = meta.find((value) => /Thứ|CN|\d{1,2}\/\d{1,2}/i.test(value)) || "Theo lịch hiển thị";
  return { activitySlug, activityTitle, sessionId: activitySlug, sessionDate };
}

export default function HoldRequestFlow() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [childAge, setChildAge] = useState("");
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [message, setMessage] = useState("");
  const [zaloChatUrl, setZaloChatUrl] = useState("https://zalo.me/0779979777");
  const idempotencyKey = useRef<string | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const context = useMemo(() => typeof window === "undefined" ? null : pageContext(), [open]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const trigger = target?.closest(triggerSelector);
      if (!trigger) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setMessage("");
      setFlowState("idle");
      setOpen(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!open) {
      document.documentElement.classList.remove("osd-hold-open");
      return;
    }
    document.documentElement.classList.add("osd-hold-open");
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => phoneRef.current?.focus(), 180);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && flowState !== "submitting") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      document.documentElement.classList.remove("osd-hold-open");
    };
  }, [open, flowState]);

  const resetAttempt = () => {
    idempotencyKey.current = null;
    if (flowState === "error") setFlowState("idle");
    setMessage("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (flowState === "submitting" || !context) return;

    const normalized = normalizePhone(phone);
    if (!/^0\d{9}$/.test(normalized)) {
      setFlowState("error");
      setMessage("Ba mẹ vui lòng nhập số Zalo di động hợp lệ.");
      return;
    }
    const age = Number(childAge);
    if (!Number.isInteger(age) || age < 2 || age > 15) {
      setFlowState("error");
      setMessage("Ba mẹ vui lòng chọn tuổi của bé.");
      return;
    }

    const key = idempotencyKey.current || crypto.randomUUID();
    idempotencyKey.current = key;
    setFlowState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/open-studio/hold-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify({
          zaloMobile: normalized,
          childAge: age,
          activitySlug: context.activitySlug,
          activityTitle: context.activityTitle,
          sessionId: context.sessionId,
          sessionDate: context.sessionDate,
        }),
      });
      const data = await response.json().catch(() => ({})) as HoldResponse;
      if (!response.ok || !data.ok) {
        setFlowState("error");
        setMessage(data.error || "PINO chưa nhận được yêu cầu. Ba mẹ vui lòng thử lại.");
        return;
      }
      if (data.zaloChatUrl) setZaloChatUrl(data.zaloChatUrl);
      setMessage(data.message || "PINO đã nhận yêu cầu và sẽ liên hệ qua Zalo để xác nhận chỗ.");
      setFlowState("success");
    } catch {
      setFlowState("error");
      setMessage("Kết nối đang gián đoạn. Ba mẹ có thể thử lại hoặc chat trực tiếp với PINO.");
    }
  };

  if (!open) return null;

  return (
    <div className="osd-hold-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && flowState !== "submitting") setOpen(false);
    }}>
      <section className="osd-hold-sheet" role="dialog" aria-modal="true" aria-labelledby="osd-hold-title">
        <button className="osd-hold-close" type="button" aria-label="Đóng" onClick={() => setOpen(false)} disabled={flowState === "submitting"}>×</button>

        {flowState === "success" ? (
          <div className="osd-hold-success">
            <div className="osd-hold-success-mark" aria-hidden="true">✓</div>
            <p className="osd-hold-eyebrow">ĐÃ NHẬN YÊU CẦU</p>
            <h2 id="osd-hold-title">PINO sẽ liên hệ qua Zalo</h2>
            <p>{message}</p>
            <div className="osd-hold-confirm-note">
              <strong>Chỗ được xác nhận sau khi PINO phản hồi.</strong>
              <span>Nếu cần xác nhận nhanh hoặc có lưu ý riêng về bé, ba mẹ có thể nhắn PINO ngay.</span>
            </div>
            <a className="osd-hold-zalo" href={zaloChatUrl} target="_blank" rel="noreferrer">Chat ngay với PINO trên Zalo <span>→</span></a>
            <button className="osd-hold-done" type="button" onClick={() => setOpen(false)}>Xong</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="osd-hold-eyebrow">GIỮ CHỖ OPEN STUDIO</p>
            <h2 id="osd-hold-title">Chỉ cần 2 thông tin</h2>
            <p className="osd-hold-intro">PINO dùng số Zalo để xác nhận lịch và gửi lưu ý trước buổi. Không cần tạo tài khoản.</p>

            <label className="osd-hold-field">
              <span>Số Zalo của ba mẹ</span>
              <input
                ref={phoneRef}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="VD: 0779 979 777"
                value={phone}
                onChange={(event) => { setPhone(event.target.value); resetAttempt(); }}
                disabled={flowState === "submitting"}
              />
            </label>

            <label className="osd-hold-field">
              <span>Tuổi của con</span>
              <select value={childAge} onChange={(event) => { setChildAge(event.target.value); resetAttempt(); }} disabled={flowState === "submitting"}>
                <option value="">Chọn tuổi</option>
                {Array.from({ length: 11 }, (_, index) => index + 2).map((age) => <option value={age} key={age}>{age} tuổi</option>)}
              </select>
            </label>

            {flowState === "error" && <p className="osd-hold-error" role="alert">{message}</p>}

            <button className="osd-hold-submit" type="submit" disabled={flowState === "submitting"}>
              {flowState === "submitting" ? "Đang gửi…" : "Giữ chỗ cho bé"}<span>→</span>
            </button>
            <small className="osd-hold-privacy">Chỉ dùng để PINO liên hệ về buổi Open Studio này.</small>
          </form>
        )}
      </section>
    </div>
  );
}
