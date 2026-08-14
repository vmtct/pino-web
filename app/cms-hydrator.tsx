"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import type { ImageAsset } from "../lib/web-images";

type CmsState = {
  content: Record<string, string>;
  images: Record<string, ImageAsset>;
};

const CmsContext = createContext<CmsState>({ content: {}, images: {} });

export default function CmsHydrator({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CmsState>({ content: {}, images: {} });

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      fetch("/api/web-content", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) throw new Error("Content unavailable");
        return response.json() as Promise<{ content?: Record<string, string> }>;
      }),
      fetch("/api/web-images", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) throw new Error("Images unavailable");
        return response.json() as Promise<{ images?: Record<string, ImageAsset> }>;
      }),
    ]).then(([contentResult, imageResult]) => {
      if (cancelled) return;
      setState({
        content: contentResult.status === "fulfilled" ? contentResult.value.content || {} : {},
        images: imageResult.status === "fulfilled" ? imageResult.value.images || {} : {},
      });
    });
    return () => { cancelled = true; };
  }, []);

  return <CmsContext.Provider value={state}>{children}</CmsContext.Provider>;
}

export function CmsText({ contentKey, fallback }: { contentKey: string; fallback: string }) {
  const { content } = useContext(CmsContext);
  const value = content[contentKey]?.trim() || fallback;
  return <span data-cms-key={contentKey}>{value}</span>;
}

export function useCmsImage(assetKey?: string): ImageAsset | null {
  const { images } = useContext(CmsContext);
  return assetKey ? images[assetKey] || null : null;
}
