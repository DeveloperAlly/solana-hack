import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { DistributePlatformPicker } from './DistributePlatformPicker';
import { example } from './DistributePlatformPicker.example';

const options = [{ id: 'x', label: 'X' }, { id: 'linkedin', label: 'LinkedIn' }, { id: 'threads', label: 'Threads' }];

function Harness() {
  const [value, setValue] = useState<string[]>(['threads']);
  return (
    <>
      <DistributePlatformPicker legend="Platforms for this post" options={options} value={value} onChange={setValue} />
      <output>{value.join(',')}</output>
    </>
  );
}

describe('D91 DistributePlatformPicker', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    await expectNoAxeViolations(container);
  });

  it('adds and removes platforms, keeping the registry order', async () => {
    renderWithRouter(<Harness />);
    expect(screen.getByRole('group', { name: 'Platforms for this post' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'X' }));
    expect(screen.getByText('x,threads')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Threads' }));
    expect(screen.getByText('x')).toBeInTheDocument();
  });
});
