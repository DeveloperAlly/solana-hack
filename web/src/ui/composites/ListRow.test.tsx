import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { List, ListRow } from './ListRow';
import { example } from './ListRow.example';

describe('C31 ListRow', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByRole('alert')).toHaveTextContent('example.com/blocked');
    await expectNoAxeViolations(container);
  });

  it('selectable rows are buttons whose pressed state follows selected', async () => {
    const onSelect = vi.fn();
    renderWithRouter(<List label="L"><ListRow title="Message" onSelect={onSelect} selected /></List>);
    const button = screen.getByRole('button', { name: 'Message' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(button);
    expect(onSelect).toHaveBeenCalled();
  });

  it('renders as a div outside a list and only the slots it is given', () => {
    const { container } = renderWithRouter(<ListRow as="div" title="Only" />);
    expect(container.querySelector('li')).toBeNull();
    expect(screen.getByText('Only')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
