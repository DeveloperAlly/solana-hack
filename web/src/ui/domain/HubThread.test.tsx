import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../../test/axe';
import { HubThread } from './HubThread';

describe('D39 HubThread', () => {
  it('says who sent each message and has no axe violations', async () => {
    const { container } = render(
      <HubThread label="Thread" messages={[{ id: '1', from: 'me', text: 'Hello' }, { id: '2', from: 'them', text: 'Hi back' }]} />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('You: Hello');
    expect(items[1]).toHaveTextContent('Them: Hi back');
    await expectNoAxeViolations(container);
  });
  it('renders nothing without messages', () => {
    const { container } = render(<HubThread label="Thread" messages={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
