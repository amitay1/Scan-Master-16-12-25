export interface AppFontOption {
  value: string;
  label: string;
  sample: string;
  stack: string;
  source: "curated" | "system";
}

type LocalFontRecord = {
  family: string;
  fullName?: string;
  postscriptName?: string;
  style?: string;
};

const CURATED_FONT_CATALOG: Array<{ family: string; sample: string }> = [
  { family: "IBM Plex Sans", sample: "Technical and balanced" },
  { family: "Space Grotesk", sample: "Bold and modern" },
  { family: "Segoe UI Variable", sample: "Modern Windows native" },
  { family: "Segoe UI", sample: "Clean Windows native" },
  { family: "Bahnschrift", sample: "Industrial DIN style" },
  { family: "Aptos", sample: "Microsoft modern office" },
  { family: "Arial", sample: "Classic universal" },
  { family: "Arial Nova", sample: "Updated Arial family" },
  { family: "Calibri", sample: "Soft office standard" },
  { family: "Cambria", sample: "Readable with classic proportions" },
  { family: "Candara", sample: "Rounded and friendly" },
  { family: "Century Gothic", sample: "Geometric and airy" },
  { family: "Corbel", sample: "Humanist and clean" },
  { family: "Franklin Gothic Medium", sample: "Strong industrial headline" },
  { family: "Garamond", sample: "Traditional and elegant" },
  { family: "Georgia", sample: "Classic screen serif" },
  { family: "Leelawadee UI", sample: "Clear multilingual sans" },
  { family: "Lucida Sans Unicode", sample: "Stable universal UI" },
  { family: "Nirmala UI", sample: "Clear multilingual Windows font" },
  { family: "Palatino Linotype", sample: "Formal serif option" },
  { family: "Rockwell", sample: "Mechanical slab serif" },
  { family: "Tahoma", sample: "Compact legacy UI" },
  { family: "Times New Roman", sample: "Traditional document font" },
  { family: "Trebuchet MS", sample: "Open and readable" },
  { family: "Verdana", sample: "Wide and legible" },
  { family: "Yu Gothic UI", sample: "Modern CJK interface font" },
  { family: "JetBrains Mono", sample: "Developer-oriented mono" },
  { family: "Consolas", sample: "Microsoft coding mono" },
  { family: "Courier New", sample: "Classic monospace" },
  { family: "Cascadia Mono", sample: "Modern Windows terminal mono" },
  { family: "Cascadia Code", sample: "Code-friendly mono" },
];

const DEFAULT_FONT_FAMILY = "IBM Plex Sans";
const FALLBACK_FONT_STACK = '"Segoe UI Variable", "Segoe UI", Arial, sans-serif';
const LEGACY_FONT_ALIASES: Record<string, string> = {
  "ibm-plex-sans": "IBM Plex Sans",
  "space-grotesk": "Space Grotesk",
  "segoe-ui": "Segoe UI",
  bahnschrift: "Bahnschrift",
  arial: "Arial",
};

export function normalizeAppFontValue(fontValue?: string | null): string {
  const trimmed = fontValue?.trim();
  if (!trimmed) return DEFAULT_FONT_FAMILY;
  return LEGACY_FONT_ALIASES[trimmed] || trimmed;
}

function buildFontStack(fontFamily: string): string {
  const escaped = fontFamily.includes('"') ? fontFamily.replace(/"/g, '\\"') : fontFamily;
  return `"${escaped}", ${FALLBACK_FONT_STACK}`;
}

function createFontOption(
  family: string,
  sample: string,
  source: "curated" | "system"
): AppFontOption {
  return {
    value: family,
    label: family,
    sample,
    stack: buildFontStack(family),
    source,
  };
}

export const APP_FONT_OPTIONS: AppFontOption[] = CURATED_FONT_CATALOG.map((font) =>
  createFontOption(font.family, font.sample, "curated")
);

export function resolveAppFontStacks(fontValue?: string | null): { body: string; heading: string } {
  const selected = normalizeAppFontValue(fontValue);
  const match = APP_FONT_OPTIONS.find((font) => font.value === selected);
  const stack = match?.stack || buildFontStack(selected);
  return {
    body: stack,
    heading: stack,
  };
}

export async function getAvailableAppFonts(): Promise<AppFontOption[]> {
  const deduped = new Map<string, AppFontOption>();

  for (const font of APP_FONT_OPTIONS) {
    deduped.set(font.value, font);
  }

  if (typeof window !== "undefined") {
    const localFontWindow = window as Window & {
      queryLocalFonts?: () => Promise<LocalFontRecord[]>;
    };

    if (typeof localFontWindow.queryLocalFonts === "function") {
      try {
        const localFonts = await localFontWindow.queryLocalFonts();
        for (const font of localFonts) {
          const family = font.family?.trim();
          if (!family || deduped.has(family)) continue;
          deduped.set(
            family,
            createFontOption(family, "Detected on this workstation", "system")
          );
        }
      } catch {
        // Ignore local font API errors and fall back to curated list.
      }
    }
  }

  return Array.from(deduped.values()).sort((a, b) => a.label.localeCompare(b.label));
}
