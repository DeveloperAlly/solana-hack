// Sample data for BB-5-Audience. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-5-Audience
// (note n-bb5); issue #50; backend map §4, row "BB-2 to BB-6". Every persona field stays bracketed, as on the canvas.
import type { AudienceData, Persona } from './types';
import { jamjamBrand } from './shared.fixtures';

const persona = (n: number): Persona => ({ id: `p${n}`, name: `[Persona ${n} name]`, job: '[job to be done]', pain: '[pain]', where: '[channels]' });

export const audienceData: AudienceData = {
  brand: jamjamBrand,
  opinion: '[Owner answer]',
  people: ['[Name, role]', '[Name, role]', ''],
  personas: [persona(1), persona(2), persona(3)],
};
