import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { GalleryModeContext } from '../hooks/galleryMode';
import { loopStages, mobileTabs, stageById, utilityStages } from '../../config/nav';
import { StageNav } from './StageNav';
import { StageTabs } from './StageTabs';
import { MobileTabBar } from './MobileTabBar';
import { example as navExample } from './StageNav.example';
import { example as tabsExample } from './StageTabs.example';
import { example as barExample } from './MobileTabBar.example';

describe('L2 StageNav', () => {
  it('renders the loop then the utilities, marks the current stage, and has no axe violations', async () => {
    const { container } = renderWithRouter(navExample.render());
    const nav = screen.getByRole('navigation', { name: 'Main nav example' });
    expect(within(within(nav).getByRole('list', { name: 'The loop' })).getAllByRole('link').map((a) => a.textContent)).toEqual(loopStages.map((s) => s.label));
    expect(within(within(nav).getByRole('list', { name: 'Utilities' })).getAllByRole('link').map((a) => a.textContent)).toEqual(utilityStages.map((s) => s.label));
    expect(within(nav).getByRole('link', { name: 'Verify' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getAllByRole('link').filter((a) => a.hasAttribute('aria-current'))).toHaveLength(1);
    await expectNoAxeViolations(container);
  });

  it('links live routes outside the gallery and typed screen paths (theme kept) inside it', () => {
    renderWithRouter(<StageNav />);
    expect(screen.getByRole('link', { name: 'Today' })).toHaveAttribute('href', '/home');
    expect(screen.getByRole('link', { name: 'Distribute' })).toHaveAttribute('href', '/screens/Platforms');
    renderWithRouter(<GalleryModeContext.Provider value={true}><StageNav label="In gallery" /></GalleryModeContext.Provider>, '/screens/Today?theme=wireframe-dark&state=empty');
    const nav = screen.getByRole('navigation', { name: 'In gallery' });
    expect(within(nav).getByRole('link', { name: 'Today' })).toHaveAttribute('href', '/screens/Today?theme=wireframe-dark');
  });
});

describe('L3 StageTabs', () => {
  it("renders a stage's canvas tabs with the current one marked, and has no axe violations", async () => {
    const { container } = renderWithRouter(tabsExample.render());
    const brand = screen.getByRole('navigation', { name: 'Brand' });
    expect(within(brand).getAllByRole('link').map((a) => a.textContent)).toEqual(stageById('brand').tabs.map((t) => t.label));
    expect(within(brand).getByRole('link', { name: 'The Brain' })).toHaveAttribute('aria-current', 'page');
    expect(within(screen.getByRole('navigation', { name: 'Grow' })).getAllByRole('link')).toHaveLength(10);
    await expectNoAxeViolations(container);
  });

  it('renders nothing for a stage without tabs', () => {
    const { container } = renderWithRouter(<StageTabs stage="today" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('L4 MobileTabBar', () => {
  it('renders five tabs with the current one marked, and has no axe violations', async () => {
    const { container } = renderWithRouter(barExample.render());
    const nav = screen.getByRole('navigation', { name: 'Mobile tabs example' });
    expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual(mobileTabs.map((t) => t.label));
    expect(within(nav).getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page');
    await expectNoAxeViolations(container);
  });

  it('marks the tab matching the URL when no current is given', () => {
    renderWithRouter(<MobileTabBar label="Tabs" items={[{ id: 'a', label: 'A', href: '/a' }, { id: 'b', label: 'B', href: '/b' }]} />, '/b');
    expect(screen.getByRole('link', { name: 'B' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'A' })).not.toHaveAttribute('aria-current');
  });
});
