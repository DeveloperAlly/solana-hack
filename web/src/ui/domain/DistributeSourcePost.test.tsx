import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { DistributeSourcePost } from './DistributeSourcePost';
import { example } from './DistributeSourcePost.example';

describe('D93 DistributeSourcePost', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    await expectNoAxeViolations(container);
  });

  it('edits the original and saves it; Cancel keeps the old text', async () => {
    const onSave = vi.fn();
    renderWithRouter(<DistributeSourcePost label="Approved · X" text="Old" onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit original' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('Old')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Edit original' }));
    await userEvent.type(screen.getByLabelText('Original post'), ' and new');
    await userEvent.click(screen.getByRole('button', { name: 'Save original' }));
    expect(onSave).toHaveBeenCalledWith('Old and new');
  });

  it('an edited original needs approving again', async () => {
    const onApprove = vi.fn();
    renderWithRouter(<DistributeSourcePost label="X" text="New" onSave={() => undefined} approval={{ label: 'Edited: needs approval', tone: 'warning', approved: false }} onApprove={onApprove} />);
    expect(screen.getByText('Edited: needs approval')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Approve original' }));
    expect(onApprove).toHaveBeenCalled();
  });
});
