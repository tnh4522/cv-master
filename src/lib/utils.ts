import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState, useEffect, useRef, useCallback } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CONFIG = {
  SCALE: {
    MIN: 0.4,
    MAX: 2,
    INITIAL: 0.65,
    SMALL: 0.4,
    MEDIUM: 0.5,
    LARGE: 0.75,
    STEP: 0.25,
  },
  FONTSIZE: {
    MIN: 12,
    MAX: 18,
    INITIAL: 14,
    STEP: 1,
  },
  LINEHEIGHT: {
    MIN: 4,
    MAX: 10,
    INITIAL: 5,
    STEP: 1,
  },
  VERTICALSPACING: {
    MIN: 1,
    MAX: 10,
    INITIAL: 2,
    STEP: 1,
  },
  MARGIN: {
    MIN: 0,
    MAX: 80,
    INITIAL: 20,
    VALUE: 20,
    STEP: 1,
  },
  PHOTO: {
    SIZE: { MIN: 40, MAX: 200, DEFAULT: 100 },
    RADIUS: { MIN: 0, MAX: 100, DEFAULT: 4 },
  },
} as const;

export interface ResolvedMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Resolves the four page margins (px) from a margin setting.
 * Legacy settings that only carry `VALUE` apply it uniformly to every side.
 */
export function resolveMargins(
  margin?: {
    VALUE?: number;
    TOP?: number;
    BOTTOM?: number;
    LEFT?: number;
    RIGHT?: number;
  } | null
): ResolvedMargins {
  const base = margin?.VALUE ?? CONFIG.MARGIN.VALUE;
  const clamp = (v: number) =>
    Math.min(CONFIG.MARGIN.MAX, Math.max(CONFIG.MARGIN.MIN, v));
  return {
    top: clamp(margin?.TOP ?? base),
    bottom: clamp(margin?.BOTTOM ?? base),
    left: clamp(margin?.LEFT ?? base),
    right: clamp(margin?.RIGHT ?? base),
  };
}

export const A4_DIMENSIONS_MM = { width: 210, height: 297 } as const;
export const MM_TO_PX = 3.78;
export const A4_WIDTH_PX = A4_DIMENSIONS_MM.width * MM_TO_PX;
export const A4_HEIGHT_PX = A4_DIMENSIONS_MM.height * MM_TO_PX;

export const FONT_CATEGORIES = [
  "ATS-Friendly",
  "sans-serif",
  "serif",
  "display",
  "monospace",
  "handwriting",
] as const;

export type FontCategory = (typeof FONT_CATEGORIES)[number];

export interface FontItem {
  family: string;
  category: string;
}

export const ATS_FRIENDLY_FONTS: FontItem[] = [
  { family: "IBM Plex Sans", category: "sans-serif" },
  { family: "Inter", category: "sans-serif" },
  { family: "Roboto", category: "sans-serif" },
  { family: "Source Sans Pro", category: "sans-serif" },
  { family: "Noto Sans", category: "sans-serif" },
  { family: "Lato", category: "sans-serif" },
  { family: "Work Sans", category: "sans-serif" },
  { family: "IBM Plex Serif", category: "serif" },
  { family: "Merriweather", category: "serif" },
  { family: "Source Serif Pro", category: "serif" },
  { family: "Crimson Text", category: "serif" },
  { family: "Cormorant Garamond", category: "serif" },
  { family: "Libre Baskerville", category: "serif" },
  { family: "IBM Plex Mono", category: "monospace" },
  { family: "JetBrains Mono", category: "monospace" },
  { family: "Space Mono", category: "monospace" },
  { family: "Courier Prime", category: "monospace" },
  { family: "Fira Code", category: "monospace" },
  { family: "Playfair Display", category: "display" },
  { family: "Poppins", category: "display" },
  { family: "Montserrat", category: "display" },
];

export function useWindowSize() {
  const [size, setSize] = useState<{ width: number | null; height: number | null }>({
    width: typeof window !== "undefined" ? window.innerWidth : null,
    height: typeof window !== "undefined" ? window.innerHeight : null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

export function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function useScrollLock() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);
}

export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRef = useCallback(
    (node: Element | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (node && typeof IntersectionObserver !== "undefined") {
        observerRef.current = new IntersectionObserver(([ent]) => {
          setEntry(ent);
        }, options);
        observerRef.current.observe(node);
      }
    },
    [options?.threshold, options?.root, options?.rootMargin]
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return [setRef, entry] as const;
}
