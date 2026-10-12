// Media flow state (issue #51): the draft Media-Composer edits and Media-Review checks. Composer's fixtures are the
// defaults; once the person edits, Review renders the edited slides, the media type and the export format chosen.
// INTEGRATION: PATCH /api/drafts/:id with the slides and format (no media row in the backend map yet; issue #51).
import { createBrandScopedStore } from './useSoonSession';
import type { ExportOption, MediaFormat, MediaKind } from './types';

interface MediaDraft {
  /** Formats with the person's slide edits; unset until the first edit. */
  formats?: MediaFormat[];
  kind?: MediaKind;
  exportAs?: ExportOption;
  /** Slide text at the last checks re-run, by slide id (Media-Review). */
  rerunText?: Record<string, string>;
}

// Kept per brand (Codex review on PR #79): another brand's media never shows here.
const mediaDraft = createBrandScopedStore<MediaDraft>();

/** How each media type is named in a sentence ("Review your …"). */
export const mediaKindNames: Record<MediaKind, string> = { carousel: 'carousel', card: 'image card', video: 'short video' };

/** Composer's page title per media type (canvas: "Make a carousel"). */
export const mediaKindTitles: Record<MediaKind, string> = { carousel: 'Make a carousel', card: 'Make an image card', video: 'Make a short video' };

/** Clears the media draft (tests, and starting a new piece). */
export const resetMediaDraft = mediaDraft.reset;

/** `defaults`: the fixture formats, used until the person edits a slide. */
export function useMediaFlow(defaults: MediaFormat[] = []) {
  const [draft, set] = mediaDraft.use();
  const formats = draft.formats ?? defaults;
  const kind = draft.kind ?? 'carousel';
  return {
    formats,
    kind,
    exportAs: draft.exportAs,
    /** The slides of the current media type: the ones Review checks. */
    slides: formats.find((f) => f.id === kind)?.slides ?? [],
    rerunText: draft.rerunText ?? {},
    /** Records a checks re-run on the current slides' text. */
    rerunChecks: (slides: { id: string; text: string }[]) => set({ rerunText: { ...draft.rerunText, ...Object.fromEntries(slides.map((s) => [s.id, s.text])) } }),
    setKind: (k: MediaKind) => set({ kind: k }),
    setExportAs: (o: ExportOption | undefined) => set({ exportAs: o }),
    editSlide: (k: MediaKind, id: string, text: string) =>
      set({ formats: formats.map((f) => (f.id === k ? { ...f, slides: f.slides.map((s) => (s.id === id ? { ...s, text } : s)) } : f)) }),
  };
}
