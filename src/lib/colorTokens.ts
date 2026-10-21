/**
 * Canonical colour tokens. `src/index.css` repeats these hex values so
 * Tailwind v4 utilities and status badges stay on the same pairs.
 * `tailwind.config.ts` re-exports this module for the issue's token file.
 */
export const statusColorTokens = {
  gray: { background: "#f3f4f6", text: "#1f2937" },
  blue: { background: "#dbeafe", text: "#1e3a8a" },
  teal: { background: "#ccfbf1", text: "#115e59" },
  green: { background: "#dcfce7", text: "#14532d" },
  amber: { background: "#fef3c7", text: "#78350f" },
  red: { background: "#fee2e2", text: "#7f1d1d" },
} as const;

/** yellow-800 on yellow-100, used by dispute escrow pills. */
export const yellowBadgeTokens = {
  background: "#fef9c3",
  text: "#713f12",
} as const;

/** Small text on a white page. gray-400 is the muted step that previously failed. */
export const onWhiteTextTokens = {
  "gray-400": "#4b5563",
  "gray-700": "#1f2937",
  "blue-700": "#1e3a8a",
  "teal-700": "#115e59",
  "green-700": "#14532d",
  "amber-700": "#78350f",
  "red-700": "#7f1d1d",
} as const;

export const WHITE = "#ffffff";
