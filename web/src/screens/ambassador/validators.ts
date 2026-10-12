// Client-side checks for the Ambassador forms (issue #53). The server re-checks everything; these only catch mistakes early.
// No X route: X bans paying for posts (ADR-002, .agentic/what/decisions/adr_002_purpose_build_run_prove.md), and the API
// rejects a paid X format (backend map row "Amb-4, M-4").

const X_HOSTS = ['x.com', 'twitter.com', 'mobile.twitter.com', 'www.x.com', 'www.twitter.com'];
export const X_NOT_PAID = "X posts aren't paid: X bans paying people for posts.";

function parseUrl(value: string): URL | null {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
  } catch {
    return null;
  }
}

export function validateEmail(value: string): string | null {
  if (!value) return 'Enter your email to join.';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Enter a valid email, like name@example.com.';
}

/** The 6-digit sign-in code from the email (Supabase email OTP, ADR-006). */
export function validateCode(value: string): string | null {
  if (!value) return 'Enter the code from the email.';
  return /^\d{6}$/.test(value) ? null : 'The code is 6 digits.';
}

/** A LinkedIn post link: linkedin.com/posts/… or linkedin.com/feed/update/… (share-sheet links included, canvas note n-m4). */
export function validateLinkedInPostUrl(value: string): string | null {
  if (!value) return 'Paste the link to your LinkedIn post.';
  const u = parseUrl(value);
  if (!u) return 'That is not a link. Paste the full URL, starting with https://';
  if (X_HOSTS.includes(u.hostname)) return X_NOT_PAID;
  const linkedin = u.hostname === 'linkedin.com' || u.hostname.endsWith('.linkedin.com');
  return linkedin && /^\/(posts|feed\/update)\//.test(u.pathname) ? null : 'Paste a LinkedIn post link (linkedin.com/posts/…).';
}

/** A page on the ambassador's own blog. */
export function validatePageUrl(value: string): string | null {
  if (!value) return 'Paste the link to your published page.';
  const u = parseUrl(value);
  if (!u) return 'That is not a link. Paste the full URL, starting with https://';
  if (X_HOSTS.includes(u.hostname)) return X_NOT_PAID;
  return u.pathname.length > 1 ? null : 'Link to the page itself, not the site home page.';
}
