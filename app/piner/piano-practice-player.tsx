"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parsePianoPracticeProjection, pinerPracticeMediaPath } from "../../lib/piner-piano-practice-projection";
import type { PianoPracticePage, PianoPracticeProjection } from "../../lib/piner-piano-practice-projection";
import styles from "./piano-practice-player.module.css";

type LoadState = "idle" | "loading" | "absent" | "locked" | "ready" | "error";

export default function PianoPracticePlayer({
  studentId,
  onAuthRequired,
}: {
  studentId: string;
  onAuthRequired: () => void;
}) {
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [projection, setProjection] = useState<PianoPracticeProjection | null>(null);
  const [resourceId, setResourceId] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [mode, setMode] = useState<"sheet" | "worksheet">("sheet");
  const authRequiredRef = useRef(onAuthRequired);
  authRequiredRef.current = onAuthRequired;

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("practiceResourceId") ?? "";
    setResourceId(canonicalResourceId(selected) ? selected : "");
  }, []);

  useEffect(() => {
    if (!studentId || !resourceId) {
      setLoadState("absent");
      setProjection(null);
      return;
    }
    const controller = new AbortController();
    setLoadState("loading");
    setProjection(null);
    setMessage("");
    setOpen(false);
    setPageIndex(0);
    setMode("sheet");

    void fetch(`/api/piner/students/${encodeURIComponent(studentId)}/piano/practice-resources/${encodeURIComponent(resourceId)}`, {
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      if (controller.signal.aborted) return;
      if (response.status === 401) {
        authRequiredRef.current();
        return;
      }
      if (response.status === 403) {
        setLoadState("locked");
        return;
      }
      if (response.status === 404) {
        setLoadState("absent");
        return;
      }
      if (!response.ok) {
        setLoadState("error");
        setMessage(await apiMessage(response, "Piano Practice tạm thời chưa sẵn sàng."));
        return;
      }
      const envelope = await response.json().catch(() => null) as { data?: unknown } | null;
      const parsed = parsePianoPracticeProjection(envelope?.data, studentId, resourceId);
      if (!parsed) {
        setLoadState("error");
        setMessage("Piano Practice nhận được dữ liệu chưa hợp lệ.");
        return;
      }
      setProjection(parsed);
      setLoadState("ready");
    }).catch((error) => {
      if (controller.signal.aborted || error?.name === "AbortError") return;
      setLoadState("error");
      setMessage("Piano Practice tạm thời chưa sẵn sàng.");
    });

    return () => controller.abort();
  }, [studentId, resourceId]);

  const page = projection?.pages[pageIndex] ?? null;

  useEffect(() => {
    if (!page?.worksheetMediaPath && mode === "worksheet") setMode("sheet");
  }, [page, mode]);

  const familyLabel = useMemo(() => {
    if (!projection) return "";
    if (projection.family === "STARTER") return "Khởi Hành";
    if (projection.family === "SPECIALTY") return "Chuyên Đề";
    return "Hành Trình";
  }, [projection]);

  if (loadState === "absent") return null;
  if (loadState === "loading" || loadState === "idle") {
    return <div className={styles.loading}><span className={styles.loader} />Đang mở Piano Practice…</div>;
  }
  if (loadState === "locked") {
    return <section className={styles.notice}><strong>Piano Practice đang khóa.</strong><span>Quyền mở nội dung được Core quyết định.</span></section>;
  }
  if (loadState === "error") {
    return <section className={styles.notice}><strong>Piano Practice chưa thể mở.</strong><span>{message}</span></section>;
  }
  if (!projection) return null;

  if (!open) {
    return (
      <article className={styles.moduleCard} data-testid="piano-practice-module">
        <div>
          <p className={styles.eyebrow}>PIANO PRACTICE · {familyLabel.toUpperCase()}</p>
          <h3>{projection.version.title}</h3>
          <p>{projection.pages.length} trang luyện tập</p>
        </div>
        <div className={styles.moduleMeta}>
          <span>v{projection.version.number}</span>
          <span>{projection.pages.length} trang</span>
        </div>
        <button type="button" className={styles.primaryButton} onClick={() => setOpen(true)}>
          Mở bài luyện →
        </button>
      </article>
    );
  }

  return (
    <section className={styles.player} data-testid="piano-practice-player">
      <div className={styles.playerHeader}>
        <button type="button" className={styles.backButton} onClick={() => setOpen(false)}>← Hành trình</button>
        <div>
          <p className={styles.eyebrow}>PIANO PRACTICE · {familyLabel.toUpperCase()}</p>
          <h3>{projection.version.title}</h3>
        </div>
        <span className={styles.version}>v{projection.version.number}</span>
      </div>

      {page ? (
        <>
          <div className={styles.modeRow}>
            <button
              type="button"
              className={mode === "sheet" ? styles.modeActive : styles.modeButton}
              onClick={() => setMode("sheet")}
            >
              Bản nhạc
            </button>
            {page.worksheetMediaPath ? (
              <button
                type="button"
                className={mode === "worksheet" ? styles.modeActive : styles.modeButton}
                onClick={() => setMode("worksheet")}
              >
                Worksheet
              </button>
            ) : null}
          </div>

          <PracticeMedia page={page} mode={mode} title={projection.version.title} />

          <div className={styles.pageControls}>
            <button
              type="button"
              onClick={() => {
                setPageIndex((value) => Math.max(0, value - 1));
                setMode("sheet");
              }}
              disabled={pageIndex === 0}
              aria-label="Trang trước"
            >
              ←
            </button>
            <span>Trang {pageIndex + 1} / {projection.pages.length}</span>
            <button
              type="button"
              onClick={() => {
                setPageIndex((value) => Math.min(projection.pages.length - 1, value + 1));
                setMode("sheet");
              }}
              disabled={pageIndex >= projection.pages.length - 1}
              aria-label="Trang sau"
            >
              →
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

function PracticeMedia({
  page,
  mode,
  title,
}: {
  page: PianoPracticePage;
  mode: "sheet" | "worksheet";
  title: string;
}) {
  const corePath = mode === "worksheet" ? page.worksheetMediaPath : page.sheetMediaPath;
  const mediaPath = corePath ? pinerPracticeMediaPath(corePath) : null;
  if (!mediaPath) return null;
  return (
    <div className={styles.mediaFrame}>
      <img
        src={mediaPath}
        alt={`${title} · trang ${page.order} · ${mode === "sheet" ? "bản nhạc" : "worksheet"}`}
      />
    </div>
  );
}

function canonicalResourceId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
}

async function apiMessage(response: Response, fallback: string) {
  try {
    const envelope = await response.json() as { error?: { message?: string } };
    return envelope.error?.message || fallback;
  } catch {
    return fallback;
  }
}
