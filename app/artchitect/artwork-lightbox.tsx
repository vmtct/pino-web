"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./artwork-lightbox.module.css";

type Work = { file: string; name: string };
export function ArtworkLightbox({ works, assetRoot }: { works: Work[]; assetRoot: string }) {
  const [active, setActive] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const src = (work: Work) => `${assetRoot}/221126/artwork-by-students/${encodeURIComponent(work.file)}`;
  useEffect(() => {
    if (active === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowRight") setActive((i) => i === null ? null : (i + 1) % works.length);
      if (event.key === "ArrowLeft") setActive((i) => i === null ? null : (i - 1 + works.length) % works.length);
      if (event.key === "Tab") {
        const modal = document.querySelector<HTMLElement>('[data-artwork-lightbox]');
        const focusable = [...(modal?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", onKey); openerRef.current?.focus(); };
  }, [active !== null, works.length]);
  return <>
    <div className={styles.grid}>
      {works.map((work, index) => <figure className={styles.artwork} key={work.file}>
        <button type="button" className={styles.thumb} aria-label={`Xem tác phẩm ${work.name}`} onClick={(e) => { openerRef.current = e.currentTarget; setActive(index); }}>
          <img src={src(work)} alt={work.name} loading="lazy" />
          
        </button>
        <figcaption>{work.name}</figcaption>
      </figure>)}
    </div>
    {active !== null && <div className={styles.overlay} data-artwork-lightbox role="dialog" aria-modal="true" aria-label="Bộ sưu tập tác phẩm học viên" onMouseDown={(e) => { if (e.target === e.currentTarget) setActive(null); }}>
      <div className={styles.top}><span>{active + 1} / {works.length}</span><button type="button" ref={closeRef} onClick={() => setActive(null)} aria-label="Đóng ảnh">✕</button></div>
      <button type="button" className={styles.prev} onClick={() => setActive((active - 1 + works.length) % works.length)} aria-label="Ảnh trước">‹</button>
      <figure className={styles.preview}><img src={src(works[active])} alt={works[active].name}/><figcaption>{works[active].name}</figcaption></figure>
      <button type="button" className={styles.next} onClick={() => setActive((active + 1) % works.length)} aria-label="Ảnh tiếp theo">›</button>
    </div>}
  </>;
}