import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe';
import { HubDial } from './HubDial';

function Harness() {
  const [v, setV] = useState(2);
  return (
    <>
      <HubDial legend="Formality" start="Casual" end="Formal" value={v} onChange={setV} />
      <output>{v}</output>
    </>
  );
}

describe('C6 HubDial', () => {
  it('changes value on click, names the ends, and has no axe violations', async () => {
    const { container } = render(<Harness />);
    const group = screen.getByRole('group', { name: 'Formality' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '2' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: /^5.*Formal/ }));
    expect(screen.getByRole('radio', { name: /^5.*Formal/ })).toBeChecked();
    expect(container.querySelector('output')).toHaveTextContent('5');
    await expectNoAxeViolations(container);
  });
});
