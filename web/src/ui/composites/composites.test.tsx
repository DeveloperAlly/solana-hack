import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { Card, type CardVariant } from './Card';
import { EmptyState } from './EmptyState';
import { StatePanel } from './StatePanel';
import { Stepper } from './Stepper';
import { TabNav, Tabs } from './Tabs';
import { DataTable, type DataTableColumn } from './DataTable';
import { KeyValueList } from './KeyValueList';
import { Menu } from './Menu';
import { CheckboxRow } from './CheckboxRow';
import { DiffView, type DiffSegment } from './DiffView';
import { StatTile } from './StatTile';
import { DemoStateSwitcher, screenStates } from './DemoStateSwitcher';
import { ToggleGroup } from './ToggleGroup';

describe('C1 Card', () => {
  it.each(['default', 'subtle', 'selected', 'dashed', 'emphasis'] as CardVariant[])('renders variant %s with header and footer', async (v) => {
    const { container } = renderWithRouter(<Card variant={v} labelledBy="h" header={<h2 id="h">Title</h2>} footer={<button type="button">Go</button>}>body</Card>);
    const card = screen.getByRole('region', { name: 'Title' });
    expect(card).toHaveClass('card', v);
    expect(card).toHaveTextContent('body');
    await expectNoAxeViolations(container);
  });
  it('renders as a link', async () => {
    const { container } = renderWithRouter(<Card href="/screens">Gallery</Card>);
    expect(screen.getByRole('link', { name: 'Gallery' })).toHaveAttribute('href', '/screens');
    await expectNoAxeViolations(container);
  });
});

describe('C3 EmptyState', () => {
  it('shows title, body and actions', async () => {
    const { container } = renderWithRouter(<EmptyState icon="plus" title="No drafts yet" body="Start from a brief." actions={<button type="button">New draft</button>} />);
    expect(screen.getByRole('heading', { level: 2, name: 'No drafts yet' })).toBeInTheDocument();
    expect(screen.getByText('Start from a brief.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New draft' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('C29 StatePanel', () => {
  it('loading is a busy status', async () => {
    const { container } = renderWithRouter(<StatePanel kind="loading" title="Reading" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    await expectNoAxeViolations(container);
  });
  it('error is an alert with a retry action', async () => {
    const { container } = renderWithRouter(<StatePanel kind="error" title="Failed" body="Try again." actions={<button type="button">Retry</button>} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    await expectNoAxeViolations(container);
  });
  it('success is a status', async () => {
    const { container } = renderWithRouter(<StatePanel kind="success" title="Registered" />);
    expect(screen.getByRole('status')).toHaveTextContent('Registered');
    await expectNoAxeViolations(container);
  });
});

describe('C8 Stepper', () => {
  const steps = ['Read', 'Save', 'Confirm'].map((label) => ({ label }));
  it('marks done, current and todo; done steps can be links', async () => {
    const { container } = renderWithRouter(<Stepper steps={steps} current={1} hrefFor={(i) => `/s/${i}`} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveClass('done');
    expect(within(items[0]).getByRole('link')).toHaveAttribute('href', '/s/0');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[2]).toHaveClass('todo');
    expect(within(items[2]).queryByRole('link')).toBeNull();
    await expectNoAxeViolations(container);
  });
  it('renders vertical', () => {
    renderWithRouter(<Stepper steps={steps} current={0} orientation="vertical" />);
    expect(screen.getByRole('list')).toHaveClass('vertical');
  });
});

describe('C4 Tabs', () => {
  function Demo() {
    const [v, setV] = useState('a');
    return <Tabs label="T" value={v} onChange={setV} items={[{ id: 'a', label: 'A', count: 2, panel: <p>Panel A</p> }, { id: 'b', label: 'B', panel: <p>Panel B</p> }]} />;
  }
  it('selects by click and arrow keys', async () => {
    const { container } = renderWithRouter(<Demo />);
    expect(screen.getByRole('tab', { name: 'A (2)' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel A');
    await userEvent.click(screen.getByRole('tab', { name: 'B' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel B');
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'A (2)' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel A');
    await expectNoAxeViolations(container);
  });
  it('TabNav marks the current page', async () => {
    const { container } = renderWithRouter(<TabNav label="Settings" value="b" items={[{ id: 'a', label: 'A', href: '/a' }, { id: 'b', label: 'B', href: '/b' }]} />);
    expect(screen.getByRole('link', { name: 'B' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'A' })).not.toHaveAttribute('aria-current');
    await expectNoAxeViolations(container);
  });
});

describe('C10 DataTable', () => {
  interface Row { id: string; name: string; n: number }
  const columns: DataTableColumn<Row>[] = [{ key: 'name', header: 'Name', rowHeader: true }, { key: 'n', header: 'Count', align: 'end' }];
  const rows: Row[] = [{ id: '1', name: 'Kit v1', n: 1 }, { id: '2', name: 'Post', n: 3 }];
  it('renders rows with row headers and actions', async () => {
    const { container } = renderWithRouter(<DataTable caption="Things" columns={columns} rows={rows} rowKey={(r) => r.id} actions={(r) => <button type="button">Open {r.name}</button>} />);
    const table = screen.getByRole('table', { name: 'Things' });
    expect(within(table).getByRole('rowheader', { name: 'Kit v1' })).toBeInTheDocument();
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Open Post' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
  it.each([['empty', 'Nothing here yet.'], ['loading', 'Loading'], ['error', 'Could not load these rows.']] as const)('renders the %s state', async (state, text) => {
    const { container } = renderWithRouter(<DataTable caption="Things" columns={columns} rows={[]} rowKey={(r) => r.id} state={state === 'empty' ? 'ready' : state} />);
    expect(screen.getByText(text)).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('C10 DataTable sort and filter', () => {
  interface R { id: string; name: string; type: string }
  const data: R[] = [{ id: '1', name: 'Beta', type: 'Kit' }, { id: '2', name: 'Alpha', type: 'Post' }, { id: '3', name: 'Gamma', type: 'Post' }];
  const cols: DataTableColumn<R>[] = [{ key: 'name', header: 'Name', rowHeader: true, sort: (a, b) => a.name.localeCompare(b.name) }, { key: 'type', header: 'Type' }];
  const names = () => screen.getAllByRole('rowheader').map((c) => c.textContent);
  it('sorts by header button with aria-sort, by mouse and keyboard', async () => {
    const { container } = renderWithRouter(<DataTable caption="T" columns={cols} rows={data} rowKey={(r) => r.id} />);
    const th = screen.getByRole('columnheader', { name: /Name/ });
    expect(th).toHaveAttribute('aria-sort', 'none');
    await userEvent.click(within(th).getByRole('button'));
    expect(th).toHaveAttribute('aria-sort', 'ascending');
    expect(names()).toEqual(['Alpha', 'Beta', 'Gamma']);
    within(th).getByRole('button').focus();
    await userEvent.keyboard('{Enter}');
    expect(th).toHaveAttribute('aria-sort', 'descending');
    expect(names()).toEqual(['Gamma', 'Beta', 'Alpha']);
    await expectNoAxeViolations(container);
  });
  it('filters with chips and shows the empty message when nothing matches', async () => {
    const filter = { label: 'Filter by type', options: [{ id: 'all', label: 'All' }, { id: 'Post', label: 'Posts' }, { id: 'Claim', label: 'Claims' }], match: (r: R, id: string) => r.type === id };
    const { container } = renderWithRouter(<DataTable caption="T" columns={cols} rows={data} rowKey={(r) => r.id} filter={filter} />);
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Posts' }));
    expect(names()).toEqual(['Alpha', 'Gamma']);
    await userEvent.click(screen.getByRole('button', { name: 'Claims' }));
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('C5 ToggleGroup', () => {
  function Demo({ mode }: { mode: 'single' | 'multi' }) {
    const [v, setV] = useState<string[]>(['a']);
    return <ToggleGroup label="Channels" mode={mode} options={[{ id: 'a', label: 'X' }, { id: 'b', label: 'Blog' }]} value={v} onChange={setV} />;
  }
  it('single keeps one pressed', async () => {
    const { container } = renderWithRouter(<Demo mode="single" />);
    await userEvent.click(screen.getByRole('button', { name: 'Blog' }));
    expect(screen.getByRole('button', { name: 'Blog' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'X' })).toHaveAttribute('aria-pressed', 'false');
    await expectNoAxeViolations(container);
  });
  it('multi toggles each, also from the keyboard', async () => {
    renderWithRouter(<Demo mode="multi" />);
    screen.getByRole('button', { name: 'Blog' }).focus();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('button', { name: 'Blog' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'X' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'X' }));
    expect(screen.getByRole('button', { name: 'X' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('C11 KeyValueList', () => {
  it('renders a description list', async () => {
    const { container } = renderWithRouter(<KeyValueList items={[{ label: 'Brand', value: 'aDNA' }, { label: 'Kit', value: 'v1' }]} />);
    expect(container.querySelectorAll('dt')).toHaveLength(2);
    expect(screen.getByText('aDNA').tagName).toBe('DD');
    await expectNoAxeViolations(container);
  });
});

describe('C16 Menu', () => {
  it('opens from the keyboard, moves, selects and returns focus', async () => {
    const onSelect = vi.fn();
    const { container } = renderWithRouter(<Menu trigger="Actions" items={[{ id: 'a', label: 'Edit' }, { id: 'b', label: 'Delete', disabled: true }, { id: 'c', label: 'Copy' }]} onSelect={onSelect} />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    await expectNoAxeViolations(container);
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('c');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger).toHaveFocus();
  });
  const items = [{ id: 'a', label: 'Edit' }, { id: 'b', label: 'Copy' }];
  it('opening with the mouse focuses the first item (Codex review on PR #66)', async () => {
    renderWithRouter(<Menu trigger="Actions" items={items} onSelect={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
  });
  it('ArrowUp on the trigger opens on the last item', async () => {
    renderWithRouter(<Menu trigger="Actions" items={items} onSelect={() => {}} />);
    screen.getByRole('button', { name: 'Actions' }).focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveFocus();
  });
  it.each(['{Escape}', '{Tab}'])('%s closes the menu and returns focus to the trigger', async (key) => {
    renderWithRouter(<Menu trigger="Actions" items={items} onSelect={() => {}} />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await userEvent.click(trigger);
    await userEvent.keyboard(key);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
  it('a press outside closes the menu', async () => {
    renderWithRouter(<><p>Outside</p><Menu trigger="Actions" items={items} onSelect={() => {}} /></>);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Outside'));
    expect(screen.queryByRole('menu')).toBeNull();
  });
  it('Escape closes; checkable items expose aria-checked', async () => {
    renderWithRouter(<Menu trigger="Brand" items={[{ id: 'a', label: 'aDNA', checked: true }, { id: 'b', label: 'JamJam', checked: false }]} onSelect={() => {}} defaultOpen />);
    expect(screen.getByRole('menuitemradio', { name: /aDNA/ })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('menuitemradio', { name: /JamJam/ }));
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('P14 CheckboxRow', () => {
  it('labels the box, describes it and supports indeterminate and disabled', async () => {
    const { container } = renderWithRouter(
      <>
        <CheckboxRow label="Evidence only" description="Facts need a source." defaultChecked />
        <CheckboxRow label="All" indeterminate readOnly checked={false} />
        <CheckboxRow label="Locked" disabled readOnly checked />
      </>,
    );
    const box = screen.getByRole('checkbox', { name: 'Evidence only' });
    expect(box).toBeChecked();
    expect(box).toHaveAccessibleDescription('Facts need a source.');
    expect((screen.getByRole('checkbox', { name: 'All' }) as HTMLInputElement).indeterminate).toBe(true);
    expect(screen.getByRole('checkbox', { name: 'Locked' })).toBeDisabled();
    await expectNoAxeViolations(container);
  });
});

describe('C23 DiffView', () => {
  const segments: DiffSegment[] = [{ kind: 'same', text: 'One ' }, { kind: 'removed', text: 'two' }, { kind: 'added', text: 'three' }];
  it('inline marks added and removed text for screen readers', async () => {
    const { container } = renderWithRouter(<DiffView segments={segments} />);
    expect(container.querySelector('del')).toHaveTextContent('[removed: two]');
    expect(container.querySelector('ins')).toHaveTextContent('[added: three]');
    await expectNoAxeViolations(container);
  });
  it('split shows before without additions and after without removals', async () => {
    const { container } = renderWithRouter(<DiffView segments={segments} mode="split" beforeLabel="Original" afterLabel="Pasted" />);
    expect(container.querySelectorAll('del')).toHaveLength(1);
    expect(container.querySelectorAll('ins')).toHaveLength(1);
    expect(screen.getByText('Original')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('C12 StatTile', () => {
  it('shows value, sub and sample flag; can be a link', async () => {
    const { container } = renderWithRouter(<StatTile label="Drafts" value="6" sub="all passed" sample href="/x" />);
    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('Drafts6all passedSample data');
    await expectNoAxeViolations(container);
  });
  it('loading shows a labelled status instead of the value', async () => {
    const { container } = renderWithRouter(<StatTile label="Posts" value="9" loading href="/x" />);
    expect(screen.getByRole('status', { name: 'Posts: loading' })).toBeInTheDocument();
    expect(screen.queryByText('9')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    await expectNoAxeViolations(container);
  });
});

describe('C28 DemoStateSwitcher', () => {
  it('links every state and marks the current one', async () => {
    const { container } = renderWithRouter(<DemoStateSwitcher states={screenStates} value="error" hrefFor={(s) => `?state=${s}`} />);
    const nav = screen.getByRole('navigation', { name: 'Screen state' });
    expect(within(nav).getAllByRole('link')).toHaveLength(4);
    expect(within(nav).getByRole('link', { name: 'Error' })).toHaveAttribute('aria-current', 'true');
    await expectNoAxeViolations(container);
  });
  it('renders nothing outside demo mode', () => {
    const { container } = renderWithRouter(<DemoStateSwitcher states={screenStates} value="error" hrefFor={(s) => s} demo={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});
