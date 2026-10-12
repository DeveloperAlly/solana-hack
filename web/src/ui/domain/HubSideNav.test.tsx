import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { HubSideNav } from './HubSideNav';

describe('L7 HubSideNav', () => {
  it('marks the current link, filters with buttons and has no axe violations', async () => {
    const onSelect = vi.fn();
    const { container } = renderWithRouter(
      <HubSideNav
        label="Inbox"
        current="all"
        onSelect={onSelect}
        sections={[
          { items: [{ id: 'all', label: 'All inboxes', count: 37, href: '/a' }] },
          { title: 'Sources', items: [{ id: 'tg', label: 'Telegram', count: 12 }] },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: /All inboxes/ })).toHaveAttribute('aria-current', 'page');
    const tg = screen.getByRole('button', { name: /Telegram/ });
    expect(tg).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(tg);
    expect(onSelect).toHaveBeenCalledWith('tg');
    await expectNoAxeViolations(container);
  });
});
