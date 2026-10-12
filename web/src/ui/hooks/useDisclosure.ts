import { useCallback, useEffect, useState, type RefObject } from 'react';

export interface DisclosureOptions {
  defaultOpen?: boolean;
  /** When given, a pointer press outside this element closes the disclosure. */
  containerRef?: RefObject<HTMLElement | null>;
}

/** Open / closed state for a popup (C16 Menu; later C17 Dialog, C18 Sheet), with close on an outside press. */
export function useDisclosure({ defaultOpen = false, containerRef }: DisclosureOptions = {}) {
  const [open, setOpen] = useState(defaultOpen);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    if (!open || !containerRef) return;
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, containerRef]);

  return { open, show, hide, toggle };
}
