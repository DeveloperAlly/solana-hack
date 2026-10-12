import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { EventBoardFilters } from './EventBoardFilters';

// Options from canvas v21 Events-Board.
const sortOptions = [{ value: 'most', label: 'Most rated' }, { value: 'highest', label: 'Highest rated' }, { value: 'lowest', label: 'Lowest rated' }, { value: 'upcoming', label: 'Upcoming' }];
const kindOptions = [{ value: 'all', label: 'All' }, { value: 'conference', label: 'Conference' }, { value: 'meetup', label: 'Meetup' }];

function Live() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('most');
  const [kind, setKind] = useState('all');
  return <EventBoardFilters query={query} onQuery={setQuery} sort={sort} sortOptions={sortOptions} onSort={setSort} kind={kind} kindOptions={kindOptions} onKind={setKind} count={query ? 1 : 4} />;
}

export const example: WorkbenchExample = {
  id: 'D104',
  name: 'EventBoardFilters',
  description: 'Search, sort and kind for the events board, with the live match count.',
  render: () => <Live />,
};
