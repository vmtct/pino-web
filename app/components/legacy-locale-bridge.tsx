"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "../localization";

type TranslationMap = Record<string, string>;
const ATTRIBUTES = ["alt", "aria-label", "title", "placeholder"] as const;

export function LegacyLocaleBridge({ selector = "main", translations }: { selector?: string; translations: TranslationMap }) {
  const { locale } = useLocale();
  const originalText = useRef(new WeakMap<Text, string>());
  const originalAttrs = useRef(new WeakMap<Element, Map<string, string>>());

  useEffect(() => {
    const root = document.querySelector(selector);
    if (!root) return;

    const localize = () => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let current = walker.nextNode();
      while (current) {
        const text = current as Text;
        const parent = text.parentElement;
        if (parent && !["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"].includes(parent.tagName)) {
          if (!originalText.current.has(text)) originalText.current.set(text, text.nodeValue || "");
          const source = originalText.current.get(text) || "";
          const key = source.trim();
          const target = locale === "en" ? translations[key] : key;
          if (key && target && target !== key) text.nodeValue = source.replace(key, target);
          else if (locale === "vi") text.nodeValue = source;
        }
        current = walker.nextNode();
      }

      root.querySelectorAll(ATTRIBUTES.map((attr) => `[${attr}]`).join(",")).forEach((element) => {
        let saved = originalAttrs.current.get(element);
        if (!saved) { saved = new Map(); originalAttrs.current.set(element, saved); }
        for (const attr of ATTRIBUTES) {
          const value = element.getAttribute(attr);
          if (value === null) continue;
          if (!saved.has(attr)) saved.set(attr, value);
          const source = saved.get(attr) || value;
          element.setAttribute(attr, locale === "en" ? (translations[source] || source) : source);
        }
      });
    };

    localize();
    const observer = new MutationObserver(localize);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [locale, selector, translations]);

  return null;
}
