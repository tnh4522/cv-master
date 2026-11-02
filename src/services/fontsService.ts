import {
  ATS_FRIENDLY_FONTS,
  type FontCategory,
  type FontItem,
} from "@/lib/utils";

const FALLBACK_GOOGLE_FONTS: Record<Exclude<FontCategory, "ATS-Friendly">, FontItem[]> = {
  "sans-serif": [
    { family: "Inter", category: "sans-serif" },
    { family: "Roboto", category: "sans-serif" },
    { family: "Open Sans", category: "sans-serif" },
    { family: "Work Sans", category: "sans-serif" },
    { family: "Lato", category: "sans-serif" },
    { family: "Plus Jakarta Sans", category: "sans-serif" },
    { family: "DM Sans", category: "sans-serif" },
    { family: "Nunito", category: "sans-serif" },
    { family: "Raleway", category: "sans-serif" },
    { family: "Ubuntu", category: "sans-serif" },
    { family: "Rubik", category: "sans-serif" },
    { family: "IBM Plex Sans", category: "sans-serif" },
    { family: "Source Sans Pro", category: "sans-serif" },
    { family: "Noto Sans", category: "sans-serif" },
    { family: "Fira Sans", category: "sans-serif" },
  ],
  serif: [
    { family: "Merriweather", category: "serif" },
    { family: "Playfair Display", category: "serif" },
    { family: "Lora", category: "serif" },
    { family: "PT Serif", category: "serif" },
    { family: "Libre Baskerville", category: "serif" },
    { family: "Crimson Text", category: "serif" },
    { family: "IBM Plex Serif", category: "serif" },
    { family: "Source Serif Pro", category: "serif" },
    { family: "Cormorant Garamond", category: "serif" },
    { family: "EB Garamond", category: "serif" },
    { family: "Bitter", category: "serif" },
  ],
  display: [
    { family: "Playfair Display", category: "display" },
    { family: "Poppins", category: "display" },
    { family: "Montserrat", category: "display" },
    { family: "Oswald", category: "display" },
    { family: "Bebas Neue", category: "display" },
    { family: "Abril Fatface", category: "display" },
    { family: "Syne", category: "display" },
    { family: "Outfit", category: "display" },
  ],
  monospace: [
    { family: "IBM Plex Mono", category: "monospace" },
    { family: "JetBrains Mono", category: "monospace" },
    { family: "Space Mono", category: "monospace" },
    { family: "Courier Prime", category: "monospace" },
    { family: "Fira Code", category: "monospace" },
    { family: "Roboto Mono", category: "monospace" },
    { family: "Source Code Pro", category: "monospace" },
    { family: "Inconsolata", category: "monospace" },
  ],
  handwriting: [
    { family: "Caveat", category: "handwriting" },
    { family: "Dancing Script", category: "handwriting" },
    { family: "Pacifico", category: "handwriting" },
    { family: "Satisfy", category: "handwriting" },
    { family: "Kalam", category: "handwriting" },
    { family: "Patrick Hand", category: "handwriting" },
  ],
};

export function buildGoogleFontUrl(
  fontFamily: string,
  weights: string[] = ["400"]
): string {
  const encodedFamily = encodeURIComponent(fontFamily);
  const weightSpec = weights.join(";");
  return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weightSpec}&display=swap`;
}

export function loadFontStylesheet(
  fontFamily: string,
  weights: string[] = ["400", "700"]
): void {
  if (typeof document === "undefined" || !fontFamily) return;
  const href = buildGoogleFontUrl(fontFamily, weights);
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

export async function fetchGoogleFontsByCategory(
  category: FontCategory
): Promise<FontItem[]> {
  if (category === "ATS-Friendly") {
    return ATS_FRIENDLY_FONTS;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_FONTS_API_KEY;
  if (!apiKey) {
    return FALLBACK_GOOGLE_FONTS[category] ?? ATS_FRIENDLY_FONTS;
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      category,
      sort: "trending",
      capability: "WOFF2",
    });
    const response = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?${params.toString()}`
    );
    if (!response.ok) {
      throw new Error(`Google Fonts API error: ${response.status}`);
    }
    const data = await response.json();
    return (data.items || []).map((item: { family: string; category: string }) => ({
      family: item.family,
      category: item.category,
    }));
  } catch (error) {
    console.warn("Falling back to local Google Fonts catalog:", error);
    return FALLBACK_GOOGLE_FONTS[category] ?? ATS_FRIENDLY_FONTS;
  }
}
