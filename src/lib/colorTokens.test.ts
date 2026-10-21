import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  WHITE,
  onWhiteTextTokens,
  statusColorTokens,
  yellowBadgeTokens,
} from "./colorTokens";

function channel(hex: string, start: number): number {
  const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const r = channel(hex, 1);
  const g = channel(hex, 3);
  const b = channel(hex, 5);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe("colour tokens", () => {
  it("keeps every status text/background pair at 4.5:1 or better", () => {
    for (const [name, pair] of Object.entries(statusColorTokens)) {
      expect(contrastRatio(pair.text, pair.background), name).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps muted and status text at 4.5:1 on white", () => {
    for (const [name, hex] of Object.entries(onWhiteTextTokens)) {
      expect(contrastRatio(hex, WHITE), name).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("uses the same hex values in src/index.css", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    for (const pair of Object.values(statusColorTokens)) {
      expect(css).toContain(pair.background);
      expect(css).toContain(pair.text);
    }
    for (const hex of Object.values(onWhiteTextTokens)) {
      expect(css).toContain(hex);
    }
    expect(css).toContain(yellowBadgeTokens.text);
    expect(
      contrastRatio(yellowBadgeTokens.text, yellowBadgeTokens.background),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
