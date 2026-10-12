import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../../test/axe';
import { GrowthCheckBadge } from './GrowthCheckBadge';
import { GrowthCheckBadgeDemo } from './GrowthCheckBadge.example';

describe('GrowthCheckBadge', () => {
  it('names the brand and JamJam in its accessible name', () => {
    render(<GrowthCheckBadge brand="aDNA" />);
    expect(screen.getByRole('img', { name: 'Official aDNA post, checked on JamJam' })).toBeInTheDocument();
    expect(screen.getByText('Official aDNA post')).toBeInTheDocument();
  });
  it('compact shows one short line', () => {
    render(<GrowthCheckBadge brand="aDNA" variant="compact" />);
    expect(screen.getByText('Checked on JamJam')).toBeInTheDocument();
    expect(screen.queryByText('Official aDNA post')).toBeNull();
  });
  it('has no axe violations in every style', async () => {
    const { container } = render(<GrowthCheckBadgeDemo />);
    await expectNoAxeViolations(container);
  });
});
