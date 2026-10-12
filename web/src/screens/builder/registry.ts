import { createElement } from 'react';
import type { ScreenEntry } from '../registry-types';
import { Onboard1SignIn } from './Onboard-1-SignIn';
import { signInData } from './Onboard-1-SignIn.fixtures';
import { Onboard2Domain } from './Onboard-2-Domain';
import { domainData } from './Onboard-2-Domain.fixtures';
import { domainFailedData } from './Onboard-2b-DomainFailed.fixtures';

// Canvas page "Brand Builder" (issue #50). Titles and tags are the canvas board titles
// (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn); states are the board notes. Variants render the same screen
// component with their own fixtures. The live /build and /sign-in routes are unchanged.
export const screens: ScreenEntry[] = [
  {
    artboard: 'Onboard-1-SignIn',
    page: 'brand',
    title: 'Sign in',
    tag: 'HACKATHON',
    states: ['success', 'loading', 'error'],
    render: (state) => createElement(Onboard1SignIn, { data: signInData, state }),
  },
  {
    artboard: 'Onboard-2-Domain',
    page: 'brand',
    title: 'Domain (optional for PoC)',
    tag: 'HACKATHON',
    states: ['success'],
    render: () => createElement(Onboard2Domain, { data: domainData }),
  },
  {
    artboard: 'Onboard-2b-DomainFailed',
    page: 'brand',
    title: 'Domain: record not found (error)',
    tag: 'HACKATHON',
    states: ['error'],
    render: () => createElement(Onboard2Domain, { data: domainFailedData }),
  },
];
