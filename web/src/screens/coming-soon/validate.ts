// Client-side checks shared by this page's forms (issue #51). Each returns an error message or null.
export const required = (what: string) => (v: string) => (v.trim() === '' ? `Enter ${what}.` : null);

export const httpsUrl = (v: string) => {
  try {
    return new URL(v).protocol === 'https:' ? null : 'Use an https:// address.';
  } catch {
    return 'Enter a full address, starting https://';
  }
};

// Deliberately loose: one @ with text either side and a dot in the domain; the provider confirms the address.
export const email = (v: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Enter an email address, like name@example.com.');

export const domain = (v: string) => (/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(v.trim()) ? null : 'Enter a domain, like example.com.');
