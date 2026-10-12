import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { StateView } from './StateView';
import { example } from './StateView.example';

describe('C35 StateView', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByRole('alert')).toHaveTextContent('Campaigns did not load');
    expect(screen.getByText('No campaigns yet')).toBeInTheDocument();
    expect(screen.getByText('Custom skeleton for this screen.')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('falls back to the success view when a state has neither a view nor copy', () => {
    renderWithRouter(<StateView state="error"><p>ok</p></StateView>);
    expect(screen.getByText('ok')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('takes a lookup of views, with views.success as the fallback', () => {
    renderWithRouter(<StateView state="empty" views={{ success: <p>list</p>, loading: <p>wait</p> }} />);
    expect(screen.getByText('list')).toBeInTheDocument();
  });
});
