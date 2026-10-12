import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { BarList } from './BarList';
import { example } from './BarList.example';

describe('C22 BarList', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    const list = screen.getByRole('list', { name: 'Engagement by voice' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('15 of 40')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('scales bars to the largest value by default and to max when given', () => {
    const { container, rerender } = renderWithRouter(<BarList label="L" items={[{ label: 'A', value: 4, display: '4' }, { label: 'B', value: 2, display: '2' }]} />);
    const widths = () => [...container.querySelectorAll('rect:not(:first-child)')].map((r) => r.getAttribute('width'));
    expect(widths()).toEqual(['100', '50']);
    rerender(<BarList label="L" max={8} items={[{ label: 'A', value: 4, display: '4' }]} />);
    expect(widths()).toEqual(['50']);
  });

  it('scales fractional values to the true maximum', () => {
    const { container } = renderWithRouter(<BarList label="L" items={[{ label: 'A', value: 0.4, display: '0.4' }, { label: 'B', value: 0.2, display: '0.2' }]} />);
    expect([...container.querySelectorAll('rect:not(:first-child)')].map((r) => r.getAttribute('width'))).toEqual(['100', '50']);
  });

  it('draws every bar empty for an all-zero list, and for max 0', () => {
    const { container, rerender } = renderWithRouter(<BarList label="L" items={[{ label: 'A', value: 0, display: '0' }, { label: 'B', value: 0, display: '0' }]} />);
    const widths = () => [...container.querySelectorAll('rect:not(:first-child)')].map((r) => r.getAttribute('width'));
    expect(widths()).toEqual(['0', '0']);
    rerender(<BarList label="L" max={0} items={[{ label: 'A', value: 3, display: '3' }]} />);
    expect(widths()).toEqual(['0']);
  });

  it('renders nothing for an empty list', () => {
    const { container } = renderWithRouter(<BarList label="L" items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
