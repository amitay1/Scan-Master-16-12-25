export type AppFontChoice =
  | "ibm-plex-sans"
  | "space-grotesk"
  | "segoe-ui"
  | "bahnschrift"
  | "arial";

export interface AppFontOption {
  value: AppFontChoice;
  label: string;
  sample: string;
  stack: string;
}

export const APP_FONT_OPTIONS: AppFontOption[] = [
  {
    value: "ibm-plex-sans",
    label: "IBM Plex Sans",
    sample: "Technical and balanced",
    stack: '"IBM Plex Sans", "Segoe UI Variable", "Bahnschrift", "Segoe UI", sans-serif',
  },
  {
    value: "space-grotesk",
    label: "Space Grotesk",
    sample: "Bold and modern",
    stack: '"Space Grotesk", "IBM Plex Sans", "Segoe UI Variable", sans-serif',
  },
  {
    value: "segoe-ui",
    label: "Segoe UI",
    sample: "Clean Windows native",
    stack: '"Segoe UI Variable", "Segoe UI", "IBM Plex Sans", sans-serif',
  },
  {
    value: "bahnschrift",
    label: "Bahnschrift",
    sample: "Industrial DIN style",
    stack: '"Bahnschrift", "Segoe UI Variable", "IBM Plex Sans", sans-serif',
  },
  {
    value: "arial",
    label: "Arial",
    sample: "Classic universal",
    stack: 'Arial, "Segoe UI", sans-serif',
  },
];

export const APP_FONT_STACKS: Record<AppFontChoice, { body: string; heading: string }> = {
  "ibm-plex-sans": {
    body: '"IBM Plex Sans", "Segoe UI Variable", "Bahnschrift", "Segoe UI", sans-serif',
    heading: '"IBM Plex Sans", "Segoe UI Variable", "Bahnschrift", "Segoe UI", sans-serif',
  },
  "space-grotesk": {
    body: '"Space Grotesk", "IBM Plex Sans", "Segoe UI Variable", sans-serif',
    heading: '"Space Grotesk", "IBM Plex Sans", "Segoe UI Variable", sans-serif',
  },
  "segoe-ui": {
    body: '"Segoe UI Variable", "Segoe UI", "IBM Plex Sans", sans-serif',
    heading: '"Segoe UI Variable", "Segoe UI", "IBM Plex Sans", sans-serif',
  },
  bahnschrift: {
    body: '"Bahnschrift", "Segoe UI Variable", "IBM Plex Sans", sans-serif',
    heading: '"Bahnschrift", "Segoe UI Variable", "IBM Plex Sans", sans-serif',
  },
  arial: {
    body: 'Arial, "Segoe UI", sans-serif',
    heading: 'Arial, "Segoe UI", sans-serif',
  },
};
