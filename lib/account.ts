// lib/account.ts
// Pure helpers for Settings (password rules, CSV export). No DOM, unit-tested.

export const PASSWORD_MIN = 8;

export type PasswordCheck = { id: "length" | "letter" | "number"; label: string; ok: boolean };

export function passwordChecks(pw: string): PasswordCheck[] {
  return [
    { id: "length", label: `At least ${PASSWORD_MIN} characters`, ok: pw.length >= PASSWORD_MIN },
    { id: "letter", label: "Contains a letter", ok: /[A-Za-z]/.test(pw) },
    { id: "number", label: "Contains a number or symbol", ok: /[^A-Za-z]/.test(pw) },
  ];
}

export function isStrongEnough(pw: string): boolean {
  return pw.length <= 72 && passwordChecks(pw).every((c) => c.ok);
}

const EMAIL_RE = /^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[A-Za-z]{2,}$/;
export const isEmail = (v: string) => EMAIL_RE.test(v.trim());

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = Array.isArray(value) ? value.join("; ") : String(value);
  // Neutralise spreadsheet formula injection, then quote if needed.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** RFC 4180 CSV with a header row, in the given column order. */
export function toCsv<T extends Record<string, unknown>>(rows: readonly T[], columns: readonly (keyof T & string)[]): string {
  const lines = [columns.join(",")];
  for (const r of rows) lines.push(columns.map((c) => csvCell(r[c])).join(","));
  return lines.join("\r\n");
}

export function exportFileName(base: string, ext: string, now: Date = new Date()): string {
  return `snaplnk-${base}-${now.toISOString().slice(0, 10)}.${ext}`;
}
