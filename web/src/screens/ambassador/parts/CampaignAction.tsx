import { Button } from '../../../ui/primitives';
import { ToggleButton } from '../../../ui/composites/ToggleButton';
import type { CampaignSummary } from '../types';

export interface CampaignActionProps {
  campaign: CampaignSummary;
  detailHref: string;
  notified: boolean;
  onNotify: () => void;
}

/**
 * The desktop card's control (canvas Amb-1): View opens the detail; a campaign whose detail is not drawn yet (the
 * bracketed film.fun card) shows View disabled; a budget-reached campaign offers Notify me instead (note n-a1).
 */
export function CampaignAction({ campaign, detailHref, notified, onNotify }: CampaignActionProps) {
  if (campaign.budgetReached) return <ToggleButton label="Notify me" pressedLabel="We'll email you" context={`about ${campaign.brand}`} pressed={notified} onToggle={onNotify} />;
  if (!campaign.hasDetail) {
    return (
      <Button variant="secondary" disabled>
        View{' '}<span className="wl-visually-hidden">{campaign.title} (not open yet)</span>
      </Button>
    );
  }
  return (
    <Button href={detailHref} aria-label={`View ${campaign.title}`}>View</Button>
  );
}
