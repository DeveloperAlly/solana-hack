import type { AmbassadorFlow } from '../useAmbassadorFlow';
import type { PostStatusData } from '../types';

/** Props every status outcome view takes (Amb-5a to 5d, M-5). */
export interface StatusViewProps {
  data: PostStatusData;
  flow: AmbassadorFlow;
  /** Opens the receipt sheet (canvas note n-m5). */
  onReceipt: () => void;
}
