const accents: Record<string, string> = {
  a: "à", e: "é", i: "î", o: "ô", u: "û",
  A: "À", E: "É", I: "Î", O: "Ô", U: "Û",
};

export function pseudoLocalise(text: string): string {
  if (!text.trim()) return text;

  const accented = text.replace(/[aeiou]/gi, (letter) => accents[letter]);
  const padding = "ː".repeat(Math.max(0, Math.round(Array.from(text).length * 0.4) - 3));
  return padding ? `[${accented} ${padding}]` : `[${accented}]`;
}
