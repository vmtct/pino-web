"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  loading?: "eager" | "lazy";
};

export default function ToppiVisual({ src, alt, className, fallback = "✦", loading = "lazy" }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`tp-visual-fallback ${className ?? ""}`} role="img" aria-label={alt}>
        <span>{fallback}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
