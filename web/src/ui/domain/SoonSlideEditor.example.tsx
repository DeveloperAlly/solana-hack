import type { WorkbenchExample } from '../../system/example';
import { useState } from 'react';
import { SoonSlideEditor } from './SoonSlideEditor';

function Demo() {
  const [slides, setSlides] = useState([
    { id: '1', label: '1 · Hook', text: '[hook]' },
    { id: '2', label: '2 · Problem', text: '[problem]' },
  ]);
  return <SoonSlideEditor label="Carousel slides" slides={slides} onChange={(id, text) => setSlides((ss) => ss.map((s) => (s.id === id ? { ...s, text } : s)))} />;
}

export const example: WorkbenchExample = {
  id: 'D-UI5',
  name: 'SoonSlideEditor',
  description: 'Pick a slide to edit its text in place; an empty slide shows an error.',
  render: () => <Demo />,
};
