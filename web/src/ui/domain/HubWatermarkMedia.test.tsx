import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../../test/axe';
import { HubWatermarkMedia } from './HubWatermarkMedia';

describe('D46 HubWatermarkMedia', () => {
  it('stamps present and missing media, with no axe violations', async () => {
    const { container } = render(
      <>
        <HubWatermarkMedia label="Avatar one" />
        <HubWatermarkMedia label="Avatar two" stamped={false} />
      </>,
    );
    expect(screen.getByRole('img', { name: 'Avatar one' })).toBeInTheDocument();
    expect(screen.getByText('AI-generated')).toBeInTheDocument();
    expect(screen.getByText('Label missing')).toHaveClass('missing');
    await expectNoAxeViolations(container);
  });
});
