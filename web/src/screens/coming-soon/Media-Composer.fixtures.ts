// Sample data for Media-Composer. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), board
// Media-Composer, issue #51; backend map: no row yet (proposed in issue #51). Slide roles are the
// canvas labels; slide text is bracketed because the canvas draws none.
import type { MediaComposerData } from './types';

export const mediaComposer: MediaComposerData = {
  formats: [
    {
      id: 'carousel',
      label: 'Carousel',
      hint: "Slides drafted from the post; edit any slide's text in place.",
      slides: [
        { id: 'c1', label: '1 · Hook', text: '[hook]' },
        { id: 'c2', label: '2 · Problem', text: '[problem]' },
        { id: 'c3', label: '3 · Proof', text: '[proof]' },
        { id: 'c4', label: '4 · CTA', text: '[call to action]' },
      ],
    },
    { id: 'card', label: 'Image card', hint: 'One card drafted from the post, in your look.', slides: [{ id: 'k1', label: '1 · Card', text: '[headline]' }] },
    {
      id: 'video',
      label: 'Short video',
      hint: 'Scenes drafted from the post; edit any scene in place.',
      slides: [
        { id: 'v1', label: '1 · Hook', text: '[opening line]' },
        { id: 'v2', label: '2 · Proof', text: '[proof]' },
        { id: 'v3', label: '3 · CTA', text: '[call to action]' },
      ],
    },
  ],
  exportOptions: [
    { value: 'pdf', label: 'LinkedIn document (PDF)', detail: 'Exports one PDF with a page per slide.' },
    { value: 'images', label: 'Image set', detail: 'Exports one image per slide.' },
  ],
};
