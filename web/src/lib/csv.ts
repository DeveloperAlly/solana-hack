/**
 * CSV for exports that run in the browser (issue #52, Leads). Every cell is quoted, and a cell that a spreadsheet would
 * read as a formula (it starts with =, +, -, @, a tab or a carriage return) gets a leading apostrophe first, so it is
 * shown as text (OWASP, "CSV Injection": https://owasp.org/www-community/attacks/CSV_Injection).
 */
const FORMULA_START = /^[=+\-@\t\r]/;

/** One cell: formula-neutralised, then quoted with inner quotes doubled. */
export function csvCell(value: string | number): string {
  const text = String(value);
  const safe = FORMULA_START.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** A header row and data rows as CSV text, one line per row. */
export function toCsv(header: string[], rows: (string | number)[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

/** Hands CSV text to the browser as a download; nothing is uploaded. */
export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
