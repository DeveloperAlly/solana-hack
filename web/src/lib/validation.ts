// Client-side input checks shared by the Brand Builder screens (issue #50).
// The email pattern and the 6-to-10-digit code rule match the live sign-in (screens/signin/SignIn.tsx), which keeps its
// own copy because live screens are out of scope for #50. Code length: Supabase mailer_otp_length allows 6 to 10 (PR #27).

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const CODE_PATTERN = /^\d{6,10}$/;

export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function isSignInCode(value: string): boolean {
  return CODE_PATTERN.test(value.trim());
}

/** True for a web address with or without a scheme ("jamjam.tech", "https://jamjam.tech/docs"). Brackets are canvas placeholders and pass. */
export function isLink(value: string): boolean {
  const v = value.trim();
  if (/^\[.*\]$/.test(v)) return true;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`);
    return (u.protocol === 'https:' || u.protocol === 'http:') && /\.[a-z]{2,}$/i.test(u.hostname) && !/\s/.test(v);
  } catch {
    return false;
  }
}

/** Splits a one-per-line list and returns the lines that are not links. */
export function invalidLinks(text: string): string[] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean).filter((l) => !isLink(l));
}
