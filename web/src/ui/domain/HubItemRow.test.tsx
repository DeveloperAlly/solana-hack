import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../../test/axe';
import { HubItemRow } from './HubItemRow';

describe('D38 HubItemRow', () => {
  it('renders its slots and selected state with no axe violations', async () => {
    const { container } = render(
      <ul>
        <HubItemRow as="li" lead={<span>X post</span>} aside={<span>92%</span>} actions={<button type="button">Review</button>} selected>
          <p>Draft text</p>
        </HubItemRow>
      </ul>,
    );
    expect(screen.getByText('Draft text')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveClass('selected');
    expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
