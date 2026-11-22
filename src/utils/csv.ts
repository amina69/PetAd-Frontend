/**
 * Spreadsheet apps execute cells beginning with these characters as formulas
 * (CSV injection). Tab and CR are included because some apps trim them first.
 */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** Prefixes string cells that would be read as formulas with a single quote. */
export function neutralizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    return FORMULA_PREFIX.test(value) ? `'${value}` : value;
  }
  if (typeof value === "object") {
    return neutralizeCsvCell(JSON.stringify(value));
  }
  return String(value);
}

function quote(cell: string): string {
  return /[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows]
    .map((row) => row.map((cell) => quote(neutralizeCsvCell(cell))).join(","))
    .join("\r\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
