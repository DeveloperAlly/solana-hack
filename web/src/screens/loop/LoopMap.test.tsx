import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { GalleryModeContext } from '../../ui/hooks/galleryMode';
import { expectNoAxeViolations } from '../../test/axe';
import { loopSteps, mobileTabs } from '../../config/nav';
import { LoopMap } from './LoopMap';
import { screens } from './registry';

describe('exported Loop-Map overview', () => {
  it('covers all six existing stages, Brain, Today, rules and role shells using typed links', async () => {
    const { container } = renderWithRouter(<GalleryModeContext.Provider value={true}><LoopMap /></GalleryModeContext.Provider>);
    for (const stage of loopSteps) {
      const region = screen.getByRole('region', { name: `${stage.step} ${stage.label}` });
      for (const tab of stage.tabs) expect(within(region).getByRole('link', { name: tab.label })).toHaveAttribute('href', `/screens/${tab.artboard}`);
      expect(within(region).getByText(/Reads from the Brain:/)).toBeInTheDocument();
      expect(within(region).getByText(/Gives back:/)).toBeInTheDocument();
    }
    for (const title of ['Today', 'The Brain', 'One navigation, everywhere', 'Rules that hold on every screen', 'Shells by role']) expect(screen.getByRole('region', { name: title })).toBeInTheDocument();
    expect(screen.getByText(`Mobile tabs: ${mobileTabs.map((t) => t.label).join(', ')}.`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Today' })).toHaveAttribute('href', '/screens/Today');
    expect(screen.getByRole('link', { name: 'Mobile' })).toHaveAttribute('href', '/screens/M-Today');
    await expectNoAxeViolations(container);
  });

  it('registers one static product map on the exported loop page and uses live destinations outside the gallery', () => {
    expect(screens.filter((s) => s.artboard === 'Loop-Map')).toHaveLength(1);
    expect(screens.find((s) => s.artboard === 'Loop-Map')).toMatchObject({ page: 'loop', tag: 'HACKATHON', states: ['success'] });
    renderWithRouter(<LoopMap />);
    expect(screen.getByRole('link', { name: 'Open Today' })).toHaveAttribute('href', '/home');
    expect(within(screen.getByRole('region', { name: '3 Distribute' })).getByRole('link', { name: 'Platforms' })).toHaveAttribute('href', '/distribute');
  });
});
