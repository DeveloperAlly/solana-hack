import type { WorkbenchExample } from '../../system/example';
import { Badge, Button, Field, Link, Stack } from '../primitives';
import { ApprovalItem } from './ApprovalItem';

// Copy from canvas boards Engage-Queue, Influencer-Queue and Dashboard note n-dash (sample data, bracketed handles;
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
export const example: WorkbenchExample = {
  id: 'D1',
  name: 'ApprovalItem',
  description: 'Card: drafted reply with actions, held (no draft), blocked, done (outcome). Row: ambassador submission with checks, status and a reject panel.',
  render: () => (
    <Stack gap={4}>
      <ApprovalItem
        meta={<><Badge>X · mention</Badge><strong>@[handle]</strong> · 14 min ago</>}
        incoming="Does aDNA work with [agent tool]?"
        note="Drafted reply · Replies voice · Slop check passed"
        draft="Works out of the box."
        actions={<><Button>Approve and send</Button><Button variant="secondary">Skip</Button></>}
      />
      <ApprovalItem meta={<Badge>Discord · #help</Badge>} incoming="Is there a template for monorepos?" note="No confident answer found. Held for you to write." actions={<Button variant="secondary">Write reply</Button>} />
      <ApprovalItem meta={<Badge>Threads</Badge>} note="Blocked: watermark not found on this image." blocked actions={<Button>Re-stamp image</Button>} />
      <ApprovalItem meta={<Badge>LinkedIn</Badge>} draft="Fair question." outcome="Sent" />
      <ul className="wl-list">
        <ApprovalItem
          surface="row"
          meta={<><strong>LinkedIn post</strong> by [ambassador] · 10 USDC</>}
          draft="[Sample excerpt] How we ship docs with aDNA."
          checks={<><Badge>On-brand 91%</Badge><Badge>Verified on LinkedIn</Badge><Link href="/system">View post</Link></>}
          status="Awaiting approval"
          actions={<><Button>Approve</Button><Button variant="secondary">Reject</Button><Button variant="secondary" disabled>Pay (owner only)</Button></>}
        >
          <Stack direction="row" gap={2} wrap align="end">
            <Field label="Reason for rejecting [ambassador]'s LinkedIn post" />
            <Button>Send rejection</Button>
          </Stack>
        </ApprovalItem>
      </ul>
    </Stack>
  ),
};
