import { Button, Link, Text } from '../../../ui/primitives';
import { AmbInlineForm } from '../../../ui/domain/AmbInlineForm';
import { AmbPublishRouteCard } from '../../../ui/domain/AmbPublishRouteCard';
import { validateLinkedInPostUrl, validatePageUrl } from '../validators';
import type { PublishRoute as Route, PublishRouteId } from '../types';

export interface PublishRouteProps {
  route: Route;
  mobile: boolean;
  connectedAs: string;
  settingsHref: string;
  onSubmit: () => void;
}

const validators: Partial<Record<PublishRouteId, (v: string) => string | null>> = {
  'paste-url': validateLinkedInPostUrl,
  'blog-url': validatePageUrl,
};

/**
 * One publish route (canvas Amb-4 / M-4; note n-a4): post on your behalf, or paste a URL that is validated before it is
 * sent. INTEGRATION: POST /api/submissions (LinkedIn or pasted URL; no X), then verify_submission.
 */
export function PublishRoute({ route, mobile, connectedAs, settingsHref, onSubmit }: PublishRouteProps) {
  const validate = validators[route.id];
  return (
    <AmbPublishRouteCard title={route.title} badge={mobile ? undefined : route.badge} description={mobile ? route.mobileDescription ?? route.description : route.description} selected={route.id === 'on-behalf'}>
      {route.field && validate ? (
        <AmbInlineForm label={route.field.label} type="url" placeholder={route.field.placeholder} submitLabel={route.submitLabel} variant="secondary" validate={validate} onSubmit={onSubmit} />
      ) : (
        <>
          {!mobile && (
            <Text variant="small">
              LinkedIn: <strong>Connected as {connectedAs}</strong> <Link href={settingsHref}>Change</Link>
            </Text>
          )}
          <Button onClick={onSubmit}>{route.submitLabel}</Button>
        </>
      )}
    </AmbPublishRouteCard>
  );
}
