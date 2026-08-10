"use client";

import { useEffect, useMemo, useState } from "react";

type Session = {
  id: string; name: string; topic: string; type: string; path: string; date: string | null;
  duration: number | null; maxSeats: number | null; availableSeats: number | null;
  confirmedCount: number | null; cover: string | null; avatar: string | null;
};

const filters = ["All", "Art", "Piano", "Little Piner"];

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/open-studio/sessions")
      .then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(data.error || "Could not load sessions."); return data; })
      .then((data) => setSessions(data.sessions || []))
      .catch((e) => setError(e.message || "Could not load sessions."))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => filter === "All" ? sessions : sessions.filter((s) => s.path === filter), [filter, sessions]);

  return (
    <main style={{ minHeight: "100vh", background: "#f4f0e7", color: "#171713" }}>
      <nav className="shell" style={{ height: 84, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(23,23,19,.16)" }}>
        <a href="/" style={{ fontWeight: 700, fontSize: 24, letterSpacing: "-.08em" }}>PINO<span style={{ color: "#d65b42", marginLeft: 3 }}>•</span></a>
        <a href="/open-studio" style={{ fontSize: 14, fontWeight: 600 }}>Get a pass →</a>
      </nav>

      <section className="shell" style={{ padding: "95px 0 55px" }}>
        <p style={{ fontSize: 11, letterSpacing: ".15em", fontWeight: 700, color: "#69655d", marginBottom: 18 }}>PINO OPEN STUDIO</p>
        <h1 style={{ fontSize: "clamp(54px, 7vw, 96px)", lineHeight: .9, letterSpacing: "-.065em", maxWidth: 850, margin: 0 }}>Find a session.<br /><em style={{ fontFamily: "DM Serif Display, serif", fontWeight: 400 }}>Come make something.</em></h1>
        <p style={{ maxWidth: 570, color: "#777269", fontSize: 18, lineHeight: 1.6, marginTop: 28 }}>Explore what&apos;s happening at PINO. Members can use their passes for eligible Open Studio and Premium sessions.</p>
      </section>

      <section className="shell" style={{ paddingBottom: 100 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          {filters.map((item) => <button key={item} onClick={() => setFilter(item)} style={{ border: filter === item ? "1px solid #171713" : "1px solid rgba(23,23,19,.16)", background: filter === item ? "#171713" : "transparent", color: filter === item ? "#fff" : "#171713", borderRadius: 999, padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{item}</button>)}
        </div>

        {loading && <p style={{ color: "#777269" }}>Loading sessions…</p>}
        {error && <div style={{ padding: 24, border: "1px solid rgba(166,59,42,.35)", color: "#a63b2a" }}>{error}</div>}
        {!loading && !error && visible.length === 0 && <div style={{ padding: 50, borderTop: "1px solid rgba(23,23,19,.16)", color: "#777269" }}>No sessions are available yet. Check back soon.</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
          {visible.map((session) => {
            const isPremium = session.type === "Premium";
            const seats = session.availableSeats;
            const soldOut = seats !== null && seats <= 0;
            return <article key={session.id} style={{ background: "#e8e0d1", border: "1px solid rgba(23,23,19,.12)", overflow: "hidden" }}>
              <div style={{ aspectRatio: "16 / 9", background: session.cover ? `url(${session.cover}) center/cover` : "linear-gradient(135deg,#d9d0bd,#c6d5ba)", position: "relative" }}>
                {session.avatar && <img src={session.avatar} alt="" style={{ position: "absolute", width: 64, height: 64, objectFit: "cover", borderRadius: "50%", left: 20, bottom: 20, border: "3px solid #f4f0e7" }} />}
                <span style={{ position: "absolute", top: 18, right: 18, background: isPremium ? "#e2ebc0" : "#f4f0e7", padding: "8px 10px", fontSize: 10, letterSpacing: ".1em", fontWeight: 700 }}>{isPremium ? "PREMIUM" : "OPEN STUDIO"}</span>
              </div>
              <div style={{ padding: 26 }}>
                <p style={{ margin: "0 0 10px", fontSize: 11, letterSpacing: ".12em", fontWeight: 700, color: "#777269" }}>{session.path || "PINO"}</p>
                <h2 style={{ fontSize: 32, lineHeight: 1, letterSpacing: "-.05em", margin: "0 0 10px" }}>{session.name}</h2>
                {session.topic && <p style={{ color: "#777269", margin: "0 0 22px", lineHeight: 1.5 }}>{session.topic}</p>}
                <div style={{ borderTop: "1px solid rgba(23,23,19,.14)", paddingTop: 16, display: "flex", justifyContent: "space-between", gap: 15, fontSize: 12 }}>
                  <span>{session.date ? new Date(session.date).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" }) : "Date TBA"}</span>
                  <span>{seats === null ? "Seats TBA" : soldOut ? "Sold out" : `${seats} seats left`}</span>
                </div>
                <button disabled={soldOut} style={{ width: "100%", marginTop: 18, padding: "14px 18px", border: 0, borderRadius: 999, background: soldOut ? "#c9c4b9" : "#1d201a", color: "#fff", fontWeight: 600, cursor: soldOut ? "not-allowed" : "pointer" }}>
                  {soldOut ? "Sold out" : "Use my pass →"}
                </button>
              </div>
            </article>;
          })}
        </div>
      </section>

      <footer className="shell" style={{ borderTop: "1px solid rgba(23,23,19,.16)", padding: "28px 0 40px", display: "flex", justifyContent: "space-between", color: "#777269", fontSize: 12 }}>
        <span>PINO<span style={{ color: "#d65b42" }}>•</span></span><span>Creative club for curious kids.</span>
      </footer>
      <style jsx>{`@media(max-width:700px){.shell{width:calc(100% - 32px)!important}.shell>div[style*="grid-template-columns"]{grid-template-columns:1fr!important}}`}</style>
    </main>
  );
}
