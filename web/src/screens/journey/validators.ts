/*
 * Client-side checks for the Journey forms (issue #48). Each returns an error message, or null when the value is fine.
 * The server still validates; these only catch mistakes before a request would be sent.
 */

/** A site address with or without https://, e.g. "jamjam.tech". The host needs a dot and no spaces. */
export function siteUrl(value: string): string | null {
  if (!value) return 'Enter your website address.';
  if (/\s/.test(value)) return 'Enter a web address, like yourbrand.com.';
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(value) ? value : `https://${value}`);
    const ok = (url.protocol === 'https:' || url.protocol === 'http:') && /\.[a-z]{2,}$/i.test(url.hostname);
    return ok ? null : 'Enter a web address, like yourbrand.com.';
  } catch {
    return 'Enter a web address, like yourbrand.com.';
  }
}

export function email(value: string): string | null {
  if (!value) return 'Enter your email address.';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Enter an email address, like you@yourbrand.com.';
}

/** The emailed code: Supabase allows 6 to 10 digits; same rule and copy as the live sign-in (screens/signin/SignIn.tsx). */
export function otpCode(value: string): string | null {
  return /^\d{6,10}$/.test(value) ? null : 'Enter the code from the email. It is 6 to 10 digits.';
}

/** Any non-empty text. */
export const required = (message: string) => (value: string): string | null => (value ? null : message);
