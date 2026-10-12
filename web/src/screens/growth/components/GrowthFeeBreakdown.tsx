import { KeyValueList } from '../../../ui/composites/KeyValueList';
import { formatRate, formatUsdc } from '../format';

export interface GrowthFeeBreakdownProps {
  amount: number;
  fee: number;
  net: number;
  feeRate: number;
  creator: string;
  wallet: string;
}

/** The tip, JamJam's fee and what reaches the creator's own wallet. */
export function GrowthFeeBreakdown({ amount, fee, net, feeRate, creator, wallet }: GrowthFeeBreakdownProps) {
  return (
    <KeyValueList
      label="Tip breakdown"
      items={[
        { label: 'Your tip', value: formatUsdc(amount) },
        { label: `JamJam fee (${formatRate(feeRate)})`, value: formatUsdc(fee) },
        { label: `${creator} receives`, value: formatUsdc(net) },
        { label: 'Paid to', value: `${creator}’s own wallet · ${wallet}` },
      ]}
    />
  );
}
