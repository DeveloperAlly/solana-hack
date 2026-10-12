import type { ReactNode } from 'react';
import { Container, Stack } from '../../../ui/primitives';
import { AppFrame } from '../../../ui/layouts/AppFrame';
import { AmbAccountChip } from '../../../ui/domain/AmbAccountChip';
import { ComingSoonFlag } from '../../../ui/domain/ComingSoonFlag';
import type { AmbassadorFlow, AmbNavId } from '../useAmbassadorFlow';
import type { Account } from '../types';

export interface AmbassadorFrameProps {
  flow: AmbassadorFlow;
  account: Account | null;
  /** Current nav item (aria-current="page"). */
  active?: AmbNavId;
  /** Mobile top bar: a back link and title in place of the logo and balance (canvas M-2 to M-4). */
  back?: { href: string; label: string };
  title?: string;
  /** Mobile: the bottom tab bar (list and status boards, canvas M-1, M-5). */
  tabs?: boolean;
  /** Mobile: pinned under the top bar (the on-brand meter, canvas note n-m3). */
  pinned?: ReactNode;
  /** Mobile: sticky bottom bar (Join, Publish; canvas notes n-m2, n-m3). */
  footer?: ReactNode;
  children?: ReactNode;
}

/**
 * The ambassador seat's chrome on every Ambassador board: the shared L11 AppFrame with the Campaigns / My posts /
 * Earnings nav, the balance chip and the Stretch flag. Desktop: nav in the top bar, body in the app container. Mobile:
 * a phone-width frame (canvas M-* boards) with the optional back link, pinned row, footer and tab bar.
 */
export function AmbassadorFrame({ flow, account, active, back, title, tabs = false, pinned, footer, children }: AmbassadorFrameProps) {
  const mobile = flow.device === 'mobile';
  const nav = { label: 'Ambassador', items: flow.nav, current: active ?? 'none', placement: mobile ? ('tabs' as const) : ('header' as const) };
  const chip = <AmbAccountChip account={account} signInHref={flow.pages.signIn} withName={!mobile} />;
  if (!mobile) {
    return (
      <AppFrame homeHref={flow.pages.home} flags={<ComingSoonFlag tag="STRETCH" />} nav={nav} actions={chip}>
        <Container width="app">{children}</Container>
      </AppFrame>
    );
  }
  return (
    <AppFrame
      width="phone"
      homeHref={flow.pages.home}
      flags={<ComingSoonFlag tag="STRETCH" />}
      back={back}
      title={title}
      nav={tabs ? nav : undefined}
      actions={back ? undefined : chip}
      pinned={pinned}
      footer={footer}
    >
      <Stack gap={4}>{children}</Stack>
    </AppFrame>
  );
}
