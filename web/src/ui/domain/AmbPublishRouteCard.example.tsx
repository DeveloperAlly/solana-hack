import type { WorkbenchExample } from '../../system/example';
import { Button, Grid, Text } from '../primitives';
import { AmbPublishRouteCard } from './AmbPublishRouteCard';

export const example: WorkbenchExample = {
  id: 'D30',
  name: 'AmbPublishRouteCard',
  description: 'Selected (the fastest route for this post) and default (canvas Amb-4).',
  render: () => (
    <Grid min="sm" gap={4}>
      <AmbPublishRouteCard title="Post to LinkedIn for me" badge="Fastest · for this post" description="We publish from your LinkedIn account, so the post is verified the moment it goes live." selected>
        <Text variant="small">LinkedIn: <strong>Connected as Mai T.</strong></Text>
        <Button>Post now</Button>
      </AmbPublishRouteCard>
      <AmbPublishRouteCard title="Submit blog URL" description="For tutorials. Publish on your blog, then send the link. We check the page matches your draft.">
        <Button variant="secondary">Submit</Button>
      </AmbPublishRouteCard>
    </Grid>
  ),
};
