import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { Columns } from './Columns';
import { example } from './Columns.example';

describe('L9 Columns', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByText('Reading pane')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('keeps source order start, main, end so narrow screens stack it that way', () => {
    const { container } = renderWithRouter(<Columns start="S" end="E">M</Columns>);
    expect(container.firstElementChild?.textContent).toBe('SME');
  });

  it('sets the column classes from the props', () => {
    const { container, rerender } = renderWithRouter(<Columns end="E">M</Columns>);
    const root = () => container.firstElementChild as HTMLElement;
    expect(root()).toHaveClass('hasEnd', 'r2-1', 'lg');
    expect(root().children).toHaveLength(2);
    rerender(<Columns start="S" startWidth="fluid" end="E" ratio="1-1" gap={6} stackBelow="md">M</Columns>);
    expect(root()).toHaveClass('hasStart', 'start-fluid', 'hasEnd', 'r1-1', 'gap6', 'md');
    rerender(<Columns>M</Columns>);
    expect(root().children).toHaveLength(1);
  });
});
