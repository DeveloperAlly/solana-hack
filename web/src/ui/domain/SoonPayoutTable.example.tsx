import type { WorkbenchExample } from '../../system/example';
import { useState } from 'react';
import { SoonPayoutTable } from './SoonPayoutTable';

function Demo() {
  const [rows, setRows] = useState([
    { id: 'li', format: 'LinkedIn post', where: 'LinkedIn', payout: '10' },
    { id: 'tu', format: 'Tutorial', where: "Ambassador's blog", payout: '' },
  ]);
  return <SoonPayoutTable caption="Payout per approved piece" rows={rows} onChange={(id, payout) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, payout } : r)))} />;
}

export const example: WorkbenchExample = {
  id: 'D26',
  name: 'SoonPayoutTable',
  description: 'Editable payouts; the empty one shows its error.',
  render: () => <Demo />,
};
