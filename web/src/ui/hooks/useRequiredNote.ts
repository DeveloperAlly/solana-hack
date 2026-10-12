import { useState } from 'react';

interface NoteState {
  open: boolean;
  text: string;
  error: string | null;
}

const closed: NoteState = { open: false, text: '', error: null };

/**
 * An inline "say why" form whose text is required (request changes on a gate, reject an ambassador post). The form is
 * one state object, so Cancel and a successful submit reset all of it: reopening never shows an old note or error.
 */
export function useRequiredNote(emptyMessage: string) {
  const [note, setNote] = useState<NoteState>(closed);
  return {
    ...note,
    show: () => setNote({ ...closed, open: true }),
    cancel: () => setNote(closed),
    setText: (text: string) => setNote((n) => ({ ...n, text })),
    /** Calls onValid with the trimmed text and closes, or shows the error when the text is empty. */
    submit: (onValid: (text: string) => void) => {
      const text = note.text.trim();
      if (!text) return setNote((n) => ({ ...n, error: emptyMessage }));
      onValid(text);
      setNote(closed);
    },
  };
}
