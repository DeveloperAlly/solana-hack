import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithRouter } from '../../test/render';
import { Box, Button, Container, Heading, Link, Stack, Text } from '.';

describe('P1 Box', () => {
  it.each(['none', 'canvas', 'surface', 'subtle', 'inverse'] as const)('renders background %s', (bg) => {
    renderWithRouter(<Box background={bg} border="default" radius="box" padding={4}>box</Box>);
    const el = screen.getByText('box');
    expect(el.tagName).toBe('DIV');
    if (bg !== 'none') expect(el.style.background).toBe(`var(--wl-bg-${bg})`);
  });
  it('renders as another element', () => {
    renderWithRouter(<Box as="section">sec</Box>);
    expect(screen.getByText('sec').tagName).toBe('SECTION');
  });
});

describe('P2 Stack', () => {
  it.each(['row', 'column'] as const)('renders direction %s', (d) => {
    renderWithRouter(<Stack direction={d} gap={3} wrap justify="between">stack</Stack>);
    const el = screen.getByText('stack');
    expect(el.style.flexDirection).toBe(d);
    expect(el.style.gap).toBe('var(--wl-space-3)');
  });
});

describe('P4 Container', () => {
  it.each(['reading', 'wizard', 'app', 'full'] as const)('renders width %s', (w) => {
    renderWithRouter(<Container width={w}>c</Container>);
    expect(screen.getByText('c')).toHaveClass(w);
  });
});

describe('P5 Text', () => {
  it.each(['body', 'small', 'caption', 'label', 'mono'] as const)('renders variant %s', (v) => {
    renderWithRouter(<Text variant={v}>t</Text>);
    expect(screen.getByText('t')).toHaveClass(v);
  });
  it.each(['primary', 'secondary', 'inverse', 'success', 'warning', 'danger', 'info'] as const)('renders tone %s', (tone) => {
    renderWithRouter(<Text tone={tone}>t</Text>);
    expect(screen.getByText('t')).toHaveClass(`tone-${tone}`);
  });
  it('truncates', () => {
    renderWithRouter(<Text truncate>t</Text>);
    expect(screen.getByText('t')).toHaveClass('truncate');
  });
});

describe('P6 Heading', () => {
  it.each([1, 2, 3, 4] as const)('renders level %i', (level) => {
    renderWithRouter(<Heading level={level}>h</Heading>);
    expect(screen.getByRole('heading', { level })).toBeInTheDocument();
  });
  it('size is independent of level', () => {
    renderWithRouter(<Heading level={4} size="4xl">h</Heading>);
    expect(screen.getByRole('heading', { level: 4 })).toHaveClass('size-4xl');
  });
});

describe('P7 Link', () => {
  it('renders internal', () => {
    renderWithRouter(<Link href="/system">Go</Link>);
    const a = screen.getByRole('link', { name: 'Go' });
    expect(a).toHaveAttribute('href', '/system');
    expect(a).not.toHaveAttribute('target');
  });
  it('renders external with a new-tab label', () => {
    renderWithRouter(<Link href="https://example.org" external>Docs</Link>);
    const a = screen.getByRole('link', { name: /Docs.*opens in new tab/ });
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

describe('P8 Button', () => {
  it.each(['primary', 'secondary'] as const)('renders variant %s as a button', (variant) => {
    renderWithRouter(<Button variant={variant}>Go</Button>);
    const b = screen.getByRole('button', { name: 'Go' });
    expect(b).toHaveClass(variant);
    expect(b).toHaveAttribute('type', 'button');
  });
  it.each(['primary', 'secondary'] as const)('renders variant %s as a link', (variant) => {
    renderWithRouter(<Button variant={variant} href="/sign-in">Go</Button>);
    expect(screen.getByRole('link', { name: 'Go' })).toHaveClass(variant);
  });
  it('renders full width and disabled', () => {
    renderWithRouter(<Button fullWidth disabled>Go</Button>);
    const b = screen.getByRole('button', { name: 'Go' });
    expect(b).toHaveClass('full');
    expect(b).toBeDisabled();
  });
  it('navigates when rendered as a link and clicked', async () => {
    renderWithRouter(
      <Routes>
        <Route path="/" element={<Button href="/sign-in">Build my brand</Button>} />
        <Route path="/sign-in" element={<p>Sign in page</p>} />
      </Routes>,
    );
    await userEvent.click(screen.getByRole('link', { name: 'Build my brand' }));
    expect(screen.getByText('Sign in page')).toBeInTheDocument();
  });
});
