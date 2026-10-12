// Sample data for Onboard-2b-DomainFailed: the Onboard-2-Domain data with the check failed. Source: canvas
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Onboard-2b-DomainFailed (note n-ob2b); issue #50; backend map §4,
// row "Onboard-2-Domain, Onboard-2b-DomainFailed".
import type { DomainData } from './types';
import { domainData } from './Onboard-2-Domain.fixtures';

export const domainFailedData: DomainData = { ...domainData, check: 'not-found' };
