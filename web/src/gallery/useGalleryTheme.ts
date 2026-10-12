import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { themeNames, type ThemeName } from '../tokens/tokens';

export const defaultTheme: ThemeName = 'wireframe';

export function isTheme(v: string | null): v is ThemeName {
  return v !== null && (themeNames as readonly string[]).includes(v);
}

/**
 * Applies ?theme=<name> to <html data-theme> while the gallery is mounted and restores the previous theme after.
 * Themes come from src/tokens/themes/*.json through the token build, so a new theme file appears here with no code change.
 */
export function useGalleryTheme(): ThemeName {
  const [params] = useSearchParams();
  const requested = params.get('theme');
  const theme = isTheme(requested) ? requested : defaultTheme;
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
