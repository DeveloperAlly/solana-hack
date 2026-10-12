import { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { themeNames, type ThemeName } from '../tokens/tokens';

export const defaultTheme: ThemeName = 'wireframe';
const storageKey = 'jamjam.gallery.theme';

export function isTheme(v: string | null): v is ThemeName {
  return v !== null && (themeNames as readonly string[]).includes(v);
}

// The theme chosen in this tab. Storage can be unavailable (private mode, blocked site data); the URL still works.
function remembered(): ThemeName | null {
  try {
    const v = sessionStorage.getItem(storageKey);
    return isTheme(v) ? v : null;
  } catch {
    return null;
  }
}
function remember(theme: ThemeName) {
  try {
    sessionStorage.setItem(storageKey, theme);
  } catch {
    // ignore: the URL keeps the theme for links built with screenPath / ScreenLink
  }
}

/**
 * Applies ?theme=<name> to <html data-theme> while the gallery is mounted and restores the previous theme after.
 * The URL is the source of truth. A gallery URL without ?theme= (a bare /screens/<Artboard> link inside a screen)
 * is rewritten in place to the theme chosen earlier in this tab, so following any link never resets the theme
 * (Codex review on PR #68). Themes come from src/tokens/themes/*.json, so a new theme file appears with no code change.
 */
export function useGalleryTheme(): ThemeName {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const requested = params.get('theme');
  const fallback = isTheme(requested) ? null : remembered();
  const theme = isTheme(requested) ? requested : fallback ?? defaultTheme;

  useEffect(() => {
    if (isTheme(requested)) remember(requested);
    else if (fallback) {
      const next = new URLSearchParams(params);
      next.set('theme', fallback);
      navigate({ pathname: location.pathname, search: `?${next.toString()}`, hash: location.hash }, { replace: true });
    }
  }, [requested, fallback, params, location.pathname, location.hash, navigate]);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute('data-theme');
    root.setAttribute('data-theme', theme);
    return () => {
      if (previous === null) root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', previous);
    };
  }, [theme]);
  return theme;
}

/** "?theme=<name>" when the URL has one, else "": appended to gallery links so the theme carries over. */
export function useThemeQuery(): string {
  const [params] = useSearchParams();
  const t = params.get('theme');
  return t ? `?theme=${encodeURIComponent(t)}` : '';
}

/** Same path, with one search param set (keeps the others). */
export function withParam(params: URLSearchParams, key: string, value: string): string {
  const next = new URLSearchParams(params);
  next.set(key, value);
  return `?${next.toString()}`;
}
