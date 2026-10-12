// Sample data shared by the Brand Builder screens. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards
// Onboard-2-Domain … Kit-RegisterFailed (header "Build your brand: JamJam" and the Unverified chip, notes n-ob2.2 and n-openq.2);
// issue #50; backend map §4, rows "Onboard-1-SignIn" (profiles) and "BB-1-Basics" (brands).
import type { BuilderBrand } from './types';

/** JamJam is the walkthrough brand, unverified until its domain is checked. The approver stays bracketed. */
export const jamjamBrand: BuilderBrand = { name: 'JamJam', verified: false, approver: '[owner email]' };
