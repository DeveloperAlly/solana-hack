import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { VerifyPagination } from './VerifyPagination';

export function VerifyPaginationDemo({ pageCount = 3 }: { pageCount?: number }) {
  const [page, setPage] = useState(1);
  return <VerifyPagination label="Ledger pages" page={page} pageCount={pageCount} onChange={setPage} />;
}

export const example: WorkbenchExample = {
  id: 'C20',
  name: 'VerifyPagination',
  description: 'Previous / Next with the position; ends disabled; hidden for one page.',
  render: () => <VerifyPaginationDemo />,
};
