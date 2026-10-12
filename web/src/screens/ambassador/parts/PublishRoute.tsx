import { AmbInlineForm } from '../../../ui/domain/AmbInlineForm';
import { AmbPublishRouteCard } from '../../../ui/domain/AmbPublishRouteCard';
import { validateLinkedInPostUrl, validatePageUrl } from '../validators';
import type { PublishRoute as Route, PublishRouteId } from '../types';
import { PostForMe } from './PostForMe';

export interface PublishRouteProps {
  route: Route;
  mobile: boolean;
  connectedAs: string | null;
  settingsHref: string;
  /** The recommended route for this piece, drawn selected (canvas Amb-4: "Fastest · for this post"). */
  selected: boolean;
  /** Called with the submitted link, or with nothing when JamJam posts it. */
  onSubmit: (url?: string) => void;
}

const validators: Partial<Record<PublishRouteId, (v: string) => string | null>> = {
  'paste-url': validateLinkedInPostUrl,
  'blog-url': validatePageUrl,
};

/**
 * One publish route (canvas Amb-4 / M-4; note n-a4): post on your behalf, or paste a URL that is validated before it is
 * sent. INTEGRATION: POST /api/submissions (LinkedIn or pasted URL; no X), then verify_submission.
 */
export function PublishRoute({ route, mobile, connectedAs, settingsHref, selected, onSubmit }: PublishRouteProps) {
  const validate = validators[route.id];
  return (
    <AmbPublishRouteCard title={route.title} badge={mobile || !selected ? undefined : route.badge} description={mobile ? route.mobileDescription ?? route.description : route.description} selected={selected}>
      {route.field && validate ? (
        <AmbInlineForm label={route.field.label} type="url" placeholder={route.field.placeholder} submitLabel={route.submitLabel} variant="secondary" validate={validate} onSubmit={onSubmit} />
      ) : (
        <PostForMe connectedAs={connectedAs} settingsHref={settingsHref} submitLabel={route.submitLabel} onSubmit={() => onSubmit()} />
      )}
    </AmbPublishRouteCard>
  );
}
