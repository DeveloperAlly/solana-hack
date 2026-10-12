import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { ComingSoonFlag } from './ComingSoonFlag';
import { EvidenceChip, evidenceStatuses } from './EvidenceChip';
import { Placeholder } from './Placeholder';
import { BrandSwitcher } from './BrandSwitcher';
import { VerifyInput } from './VerifyInput';
import { demoBrands } from './demoBrands';
import { Icon } from '../primitives/Icon';
import { WizardLayout } from '../layouts/WizardLayout';
import { AppShell } from '../shells/AppShell';

vi.mock('../../lib/supabase', () => ({ supabase: null }));

describe('D56 ComingSoonFlag', () => {
  it.each([['COMING SOON', 'Coming soon'], ['ROADMAP', 'Roadmap'], ['EXPERIMENTAL', 'Experimental']] as const)('labels %s', async (tag, label) => {
    const { container } = renderWithRouter(<ComingSoonFlag tag={tag} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
  it('renders nothing for a hackathon screen', () => {
    const { container } = renderWithRouter(<ComingSoonFlag tag="HACKATHON" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('D57 EvidenceChip', () => {
  it.each(evidenceStatuses)('renders %s as text', async (s) => {
    const { container } = renderWithRouter(<EvidenceChip status={s} />);
    expect(container.firstChild).toHaveClass('chip', s);
    expect(container.textContent).toMatch(/Found|Partly found|Needs you/);
    await expectNoAxeViolations(container);
  });
});

describe('D58 Placeholder', () => {
  it('is a labelled local SVG with no network source', async () => {
    const { container } = renderWithRouter(<Placeholder label="Sample product shot" ratio="wide" />);
    const img = screen.getByRole('img', { name: 'Sample product shot' });
    expect(img.tagName.toLowerCase()).toBe('svg');
    expect(container.querySelector('img, image, [href], [src]')).toBeNull();
    await expectNoAxeViolations(container);
  });
});

describe('P10 Icon', () => {
  it('is hidden when decorative and named when labelled', async () => {
    const { container } = renderWithRouter(<><Icon name="check" /><Icon name="alert" label="Warning" /></>);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('img', { name: 'Warning' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('D33 VerifyInput', () => {
  it('submits the trimmed text and shows the checking state', async () => {
    const onCheck = vi.fn();
    const { container, rerender } = renderWithRouter(<VerifyInput onCheck={onCheck} />);
    await userEvent.type(screen.getByLabelText('Text or URL'), '  hello  ');
    await userEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(onCheck).toHaveBeenCalledWith('hello');
    await expectNoAxeViolations(container);
    rerender(<VerifyInput checking />);
    expect(screen.getByRole('button', { name: 'Checking…' })).toBeDisabled();
  });
});

describe('D48 BrandSwitcher in the L1 AppShell slot', () => {
  it('shows the current brand, lists brands with status and switches', async () => {
    const onSelect = vi.fn();
    const onAdd = vi.fn();
    const { container } = renderWithRouter(<AppShell preview brandSlot={<BrandSwitcher brands={demoBrands} currentId="adna" onSelect={onSelect} onAdd={onAdd} />}>x</AppShell>);
    await userEvent.click(screen.getByRole('button', { name: 'aDNA, switch brand' }));
    expect(screen.getByRole('menuitemradio', { name: /aDNA · verified/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: /film.fun · unverified/ })).toHaveAttribute('aria-checked', 'false');
    await expectNoAxeViolations(container);
    await userEvent.click(screen.getByRole('menuitemradio', { name: /JamJam/ }));
    expect(onSelect).toHaveBeenCalledWith('jamjam');
    await userEvent.click(screen.getByRole('button', { name: 'aDNA, switch brand' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Add a brand' }));
    expect(onAdd).toHaveBeenCalled();
  });
});

describe('L6 WizardLayout', () => {
  const steps = ['Read', 'Save', 'Confirm'].map((label) => ({ label }));
  it('renders progress, title, saving, error, body and footer', async () => {
    const { container } = renderWithRouter(
      <WizardLayout steps={steps} current={1} title="Save your work" intro="Email after value." estimate="About 8 min left" saving error={<p role="alert">Not saved</p>} footer={<button type="button">Continue</button>}>
        <p>Body</p>
      </WizardLayout>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Save your work' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Step 2 of 3' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Saving');
    expect(screen.getByRole('alert')).toHaveTextContent('Not saved');
    expect(screen.getByText('About 8 min left')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
  it('first and last steps', () => {
    const { rerender } = renderWithRouter(<WizardLayout steps={steps} current={0} title="T" />);
    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('aria-current', 'step');
    rerender(<WizardLayout steps={steps} current={2} title="T" />);
    expect(screen.getAllByRole('listitem')[2]).toHaveAttribute('aria-current', 'step');
  });
});
