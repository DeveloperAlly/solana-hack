import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../../test/axe';
import { HubBarList } from './HubBarList';

describe('C22 HubBarList', () => {
  it('scales bars to the largest value and reads values as text, with no axe violations', async () => {
    const { container } = render(
      <HubBarList label="By voice" items={[{ label: 'Founder', value: 3.1, display: '3.1%' }, { label: 'Playful', value: 1, display: '1.0%' }]} />,
    );
    const list = screen.getByRole('list', { name: 'By voice' });
    expect(list).toHaveTextContent('Founder3.1%');
    const bars = container.querySelectorAll('progress');
    expect(bars[0]).toHaveAttribute('max', '3.1');
    expect(bars[1]).toHaveAttribute('value', '1');
    await expectNoAxeViolations(container);
  });
  it('renders nothing for an empty list', () => {
    const { container } = render(<HubBarList label="Empty" items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
